import Stripe from "stripe";
import type { PlanInterval } from "./billing-types";

let stripeClient:Stripe|undefined;

export function getStripe(){
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key)throw new Error("STRIPE_NOT_CONFIGURED");
  return stripeClient ??= new Stripe(key,{appInfo:{name:"LeihNest",version:"1.0.0"}});
}

type PriceEnvironment={
  STRIPE_PLUS_MONTHLY_PRICE_ID?:string;
  STRIPE_PLUS_YEARLY_PRICE_ID?:string;
};

export function resolvePriceId(interval:PlanInterval,env?:PriceEnvironment){
  const source=env ?? {
    STRIPE_PLUS_MONTHLY_PRICE_ID:process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
    STRIPE_PLUS_YEARLY_PRICE_ID:process.env.STRIPE_PLUS_YEARLY_PRICE_ID,
  };
  const id=interval==="month"?source.STRIPE_PLUS_MONTHLY_PRICE_ID:interval==="year"?source.STRIPE_PLUS_YEARLY_PRICE_ID:undefined;
  if(!id)throw new Error("STRIPE_NOT_CONFIGURED");
  return id;
}

export function publicUrl(){
  return (process.env.PUBLIC_URL||"https://leihnest.de").replace(/\/$/,"");
}
