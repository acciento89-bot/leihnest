import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { consumeLimit } from "@/features/media/rate-limit";
import { createCheckout } from "@/features/billing/billing-service";

const input=z.object({interval:z.enum(["month","year"])});

export async function POST(request:Request){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return Response.json({error:"UNAUTHORIZED"},{status:401});
  const membership=await getPrimaryMembership(session.user.id);if(!membership)return Response.json({error:"FORBIDDEN"},{status:403});
  if(!consumeLimit(`billing:${session.user.id}`,5,60_000))return Response.json({error:"RATE_LIMIT"},{status:429});
  const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"INVALID_REQUEST"},{status:400});
  try{return Response.json({url:await createCheckout(membership.groupId,session.user.id,parsed.data.interval)});}
  catch(error){
    const code=error instanceof Error?error.message:"BILLING_ERROR";
    const status=code==="FORBIDDEN"?403:code==="SUBSCRIPTION_EXISTS"||code==="CHECKOUT_PENDING"?409:code==="STRIPE_NOT_CONFIGURED"?503:500;
    return Response.json({error:code},{status});
  }
}
