import { db } from "@/lib/db";
import { canManageBilling, type GroupRole } from "@/features/groups/permissions";
import type { PlanInterval } from "./billing-types";
import { getStripe, publicUrl, resolvePriceId } from "./stripe";

const ACTIVE_LOCAL=new Set(["active","trialing","past_due"]);

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
  let createdCustomer:string|undefined;
  let customerId:string;
  try{
    customerId=await db.$transaction(async tx=>{
      await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1))",`leihnest:billing:${groupId}`);
      const current=await tx.groupSubscription.findUnique({where:{groupId}});
      if(current && ACTIVE_LOCAL.has(current.status))throw new Error("SUBSCRIPTION_EXISTS");
      if(current?.status==="checkout_pending")throw new Error("CHECKOUT_PENDING");
      if(current?.stripeCustomerId){
        await tx.groupSubscription.update({where:{groupId},data:{status:"checkout_pending"}});
        return current.stripeCustomerId;
      }
      const customer=await stripe.customers.create({
        email:context.user.email,
        name:context.group.name,
        metadata:{service:"leihnest",groupId},
      });
      createdCustomer=customer.id;
      await tx.groupSubscription.create({
        data:{groupId,stripeCustomerId:customer.id,status:"checkout_pending"},
      });
      return customer.id;
    });
  }catch(error){
    if(createdCustomer){
      try{await stripe.customers.del(createdCustomer);}catch{}
    }
    throw error;
  }

  try{
    const price=resolvePriceId(interval);
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
    return session.url;
  }catch(error){
    await db.groupSubscription.updateMany({where:{groupId,status:"checkout_pending"},data:{status:"none"}});
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
