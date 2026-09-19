import { db } from "@/lib/db";
import { canManageBilling, type GroupRole } from "@/features/groups/permissions";
import type { PlanInterval } from "./billing-types";
import { getStripe, publicUrl, resolvePriceId } from "./stripe";

const ACTIVE_LOCAL=new Set(["active","trialing","past_due"]);

type CheckoutState={
  status:string;
  stripePriceId:string|null;
  stripeCheckoutSessionId:string|null;
  stripeCheckoutExpiresAt:Date|null;
};

export function canReuseCheckout(current:CheckoutState,priceId:string,now=new Date()){
  return current.status==="checkout_pending"
    && current.stripePriceId===priceId
    && Boolean(current.stripeCheckoutSessionId)
    && Boolean(current.stripeCheckoutExpiresAt && current.stripeCheckoutExpiresAt.getTime()>now.getTime());
}

async function ownerContext(groupId:string,userId:string){
  const membership=await db.membership.findUnique({
    where:{groupId_userId:{groupId,userId}},
    include:{user:true,group:true},
  });
  if(!membership || !canManageBilling(membership.role as GroupRole))throw new Error("FORBIDDEN");
  return membership;
}

export async function createCheckout(groupId:string,userId:string,interval:PlanInterval){
  const context=await ownerContext(groupId,userId);
  const stripe=getStripe();
  const price=resolvePriceId(interval);
  let createdCustomer:string|undefined;
  let createdSession:string|undefined;

  try{
    return await db.$transaction(async tx=>{
      await tx.$queryRawUnsafe("SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext($1))",`leihnest:billing:${groupId}`);
      const current=await tx.groupSubscription.findUnique({where:{groupId}});
      if(current && ACTIVE_LOCAL.has(current.status))throw new Error("SUBSCRIPTION_EXISTS");
      if(current?.status==="checkout_complete")throw new Error("CHECKOUT_PENDING");

      if(current && canReuseCheckout(current,price)){
        const existing=await stripe.checkout.sessions.retrieve(current.stripeCheckoutSessionId!);
        if(existing.status==="open" && existing.url)return existing.url;
        if(existing.status==="complete")throw new Error("CHECKOUT_PENDING");
      }

      if(current?.status==="checkout_pending" && current.stripeCheckoutSessionId){
        try{
          const stale=await stripe.checkout.sessions.retrieve(current.stripeCheckoutSessionId);
          if(stale.status==="open")await stripe.checkout.sessions.expire(current.stripeCheckoutSessionId);
          if(stale.status==="complete")throw new Error("CHECKOUT_PENDING");
        }catch(error){
          if(error instanceof Error && error.message==="CHECKOUT_PENDING")throw error;
        }
      }

      let customerId=current?.stripeCustomerId;
      if(!customerId){
        const customer=await stripe.customers.create({
          email:context.user.email,
          name:context.group.name,
          metadata:{service:"leihnest",groupId},
        });
        customerId=customer.id;
        createdCustomer=customer.id;
      }

      const session=await stripe.checkout.sessions.create({
        mode:"subscription",
        customer:customerId,
        line_items:[{price,quantity:1}],
        client_reference_id:groupId,
        metadata:{service:"leihnest",groupId},
        subscription_data:{metadata:{service:"leihnest",groupId}},
        success_url:`${publicUrl()}/app/settings?billing=confirming`,
        cancel_url:`${publicUrl()}/app/settings?billing=cancelled`,
        allow_promotion_codes:false,
      });
      if(!session.url)throw new Error("STRIPE_SESSION_URL_MISSING");
      createdSession=session.id;
      const expiresAt=new Date(session.expires_at*1000);

      if(current){
        await tx.groupSubscription.update({where:{groupId},data:{
          stripeCustomerId:customerId,
          stripePriceId:price,
          interval:interval==="month"?"MONTH":"YEAR",
          status:"checkout_pending",
          stripeCheckoutSessionId:session.id,
          stripeCheckoutExpiresAt:expiresAt,
        }});
      }else{
        await tx.groupSubscription.create({data:{
          groupId,
          stripeCustomerId:customerId,
          stripePriceId:price,
          interval:interval==="month"?"MONTH":"YEAR",
          status:"checkout_pending",
          stripeCheckoutSessionId:session.id,
          stripeCheckoutExpiresAt:expiresAt,
        }});
      }
      return session.url;
    });
  }catch(error){
    if(createdSession){
      try{await stripe.checkout.sessions.expire(createdSession);}catch{}
    }
    if(createdCustomer){
      try{await stripe.customers.del(createdCustomer);}catch{}
    }
    throw error;
  }
}

export async function createPortal(groupId:string,userId:string){
  await ownerContext(groupId,userId);
  const subscription=await db.groupSubscription.findUnique({where:{groupId}});
  if(!subscription?.stripeCustomerId)throw new Error("NO_BILLING_CUSTOMER");
  const session=await getStripe().billingPortal.sessions.create({
    customer:subscription.stripeCustomerId,
    return_url:`${publicUrl()}/app/settings`,
  });
  return session.url;
}
