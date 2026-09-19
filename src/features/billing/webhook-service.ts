import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "./stripe";

function stringId(value:unknown){
  if(typeof value==="string")return value;
  if(value && typeof value==="object" && "id" in value && typeof (value as {id?:unknown}).id==="string")return (value as {id:string}).id;
  return null;
}

function periodEnd(subscription:Stripe.Subscription){
  const legacy=(subscription as unknown as {current_period_end?:number}).current_period_end;
  if(typeof legacy==="number")return legacy;
  const ends=subscription.items.data.map(item=>(item as unknown as {current_period_end?:number}).current_period_end).filter((value):value is number=>typeof value==="number");
  return ends.length?Math.max(...ends):null;
}

export function subscriptionProjection(subscription:Stripe.Subscription,eventCreated:number){
  const item=subscription.items.data[0];
  const interval=item?.price?.recurring?.interval;
  const end=periodEnd(subscription);
  return {
    stripeCustomerId:stringId(subscription.customer),
    stripeSubscriptionId:subscription.id,
    stripePriceId:item?.price?.id ?? null,
    interval:interval==="month"?"MONTH" as const:interval==="year"?"YEAR" as const:null,
    status:subscription.status,
    currentPeriodEnd:end?new Date(end*1000):null,
    cancelAtPeriodEnd:Boolean(subscription.cancel_at_period_end),
    stripeUpdatedAt:new Date(eventCreated*1000),
    groupId:subscription.metadata?.groupId || null,
  };
}

async function syncSubscription(tx:typeof db,subscription:Stripe.Subscription,eventCreated:number){
  const projection=subscriptionProjection(subscription,eventCreated);
  let existing=projection.groupId?await tx.groupSubscription.findUnique({where:{groupId:projection.groupId}}):null;
  if(!existing)existing=await tx.groupSubscription.findFirst({where:{OR:[
    {stripeSubscriptionId:projection.stripeSubscriptionId},
    ...(projection.stripeCustomerId?[{stripeCustomerId:projection.stripeCustomerId}]:[]),
  ]}});
  const groupId=projection.groupId || existing?.groupId;
  if(!groupId)return;
  if(existing?.stripeUpdatedAt && existing.stripeUpdatedAt.getTime()>projection.stripeUpdatedAt.getTime())return;
  if(existing){
    await tx.groupSubscription.update({where:{groupId},data:{
      stripeCustomerId:projection.stripeCustomerId ?? existing.stripeCustomerId,
      stripeSubscriptionId:projection.stripeSubscriptionId,
      stripePriceId:projection.stripePriceId,
      interval:projection.interval,
      status:projection.status,
      currentPeriodEnd:projection.currentPeriodEnd,
      cancelAtPeriodEnd:projection.cancelAtPeriodEnd,
      stripeUpdatedAt:projection.stripeUpdatedAt,
    }});
  }
}

function invoiceSubscriptionId(invoice:Stripe.Invoice){
  const legacy=(invoice as unknown as {subscription?:unknown}).subscription;
  const fromLegacy=stringId(legacy);if(fromLegacy)return fromLegacy;
  const parent=(invoice as unknown as {parent?:{subscription_details?:{subscription?:unknown}}}).parent;
  return stringId(parent?.subscription_details?.subscription);
}

export async function applyStripeEvent(event:Stripe.Event){
  const duplicate=await db.processedStripeEvent.findUnique({where:{id:event.id}});
  if(duplicate)return;
  let subscription:Stripe.Subscription|undefined;
  if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){
    subscription=event.data.object as Stripe.Subscription;
  }else if(event.type==="invoice.paid"||event.type==="invoice.payment_failed"){
    const subId=invoiceSubscriptionId(event.data.object as Stripe.Invoice);
    if(subId){
      try{subscription=await getStripe().subscriptions.retrieve(subId);}catch{}
    }
  }

  try{
    await db.$transaction(async tx=>{
      await tx.processedStripeEvent.create({data:{id:event.id,stripeType:event.type}});
      if(subscription)await syncSubscription(tx as typeof db,subscription,event.created);
      if(event.type==="checkout.session.completed"){
        const session=event.data.object as Stripe.Checkout.Session;
        const groupId=session.metadata?.groupId;
        const customerId=stringId(session.customer);
        const subscriptionId=stringId(session.subscription);
        if(groupId && customerId){
          const current=await tx.groupSubscription.findUnique({where:{groupId}});
          if(current)await tx.groupSubscription.update({where:{groupId},data:{
            stripeCustomerId:customerId,
            stripeSubscriptionId:subscriptionId ?? current.stripeSubscriptionId,
            status:current.status==="checkout_pending"?"checkout_complete":current.status,
          }});
        }
      }
    });
  }catch(error){
    if((error as {code?:string})?.code==="P2002")return;
    throw error;
  }
}
