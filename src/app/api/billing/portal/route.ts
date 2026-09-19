import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { consumeLimit } from "@/features/media/rate-limit";
import { createPortal } from "@/features/billing/billing-service";

export async function POST(){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return Response.json({error:"UNAUTHORIZED"},{status:401});
  const membership=await getPrimaryMembership(session.user.id);if(!membership)return Response.json({error:"FORBIDDEN"},{status:403});
  if(!consumeLimit(`billing:${session.user.id}`,5,60_000))return Response.json({error:"RATE_LIMIT"},{status:429});
  try{return Response.json({url:await createPortal(membership.groupId,session.user.id)});}
  catch(error){
    const code=error instanceof Error?error.message:"BILLING_ERROR";
    const status=code==="FORBIDDEN"?403:code==="NO_BILLING_CUSTOMER"?409:code==="STRIPE_NOT_CONFIGURED"?503:500;
    return Response.json({error:code},{status});
  }
}
