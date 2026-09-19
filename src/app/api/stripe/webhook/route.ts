import { getStripe } from "@/features/billing/stripe";
import { applyStripeEvent } from "@/features/billing/webhook-service";

export async function POST(request:Request){
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  const signature=request.headers.get("stripe-signature");
  if(!secret||!signature)return new Response(null,{status:400});
  const payload=await request.text();
  try{
    const event=getStripe().webhooks.constructEvent(payload,signature,secret);
    await applyStripeEvent(event);
    return Response.json({received:true});
  }catch{
    return new Response(null,{status:400});
  }
}
