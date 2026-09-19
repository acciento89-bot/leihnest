import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { consumeLimit } from "@/features/media/rate-limit";
import { deleteMedia, uploadGroupImage } from "@/features/media/media-service";

function responseError(error:unknown){
  const code=error instanceof Error?error.message:"INVALID_IMAGE";
  const status=code==="IMAGE_TOO_LARGE"||code==="INVALID_IMAGE"?400:code==="FORBIDDEN"?403:code==="NOT_FOUND"?404:500;
  return Response.json({error:code},{status});
}
async function context(){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return null;
  const membership=await getPrimaryMembership(session.user.id);if(!membership)return null;
  return {session,membership};
}

export async function POST(request:Request){
  const current=await context();if(!current)return Response.json({error:"UNAUTHORIZED"},{status:401});
  if(!consumeLimit(`media:${current.session.user.id}`,10,60_000))return Response.json({error:"RATE_LIMIT"},{status:429});
  try{
    const form=await request.formData();const file=form.get("file");
    if(!(file instanceof File))return Response.json({error:"INVALID_IMAGE"},{status:400});
    const asset=await uploadGroupImage(current.membership.groupId,current.session.user.id,Buffer.from(await file.arrayBuffer()));
    return Response.json({assetId:asset.id,url:`/api/media/${asset.id}/thumb`},{status:201});
  }catch(error){return responseError(error);}
}

export async function DELETE(request:Request){
  const current=await context();if(!current)return Response.json({error:"UNAUTHORIZED"},{status:401});
  if(!consumeLimit(`media:${current.session.user.id}`,10,60_000))return Response.json({error:"RATE_LIMIT"},{status:429});
  try{
    const body=await request.json() as {assetId?:unknown};
    if(typeof body.assetId!=="string")return Response.json({error:"INVALID_REQUEST"},{status:400});
    await deleteMedia(body.assetId,current.session.user.id);return new Response(null,{status:204});
  }catch(error){return responseError(error);}
}
