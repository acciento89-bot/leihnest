import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAuthorizedMedia } from "@/features/media/media-service";
import { readVariant } from "@/features/media/media-store";
import type { MediaVariant } from "@/features/media/media-types";

const VARIANTS=new Set<MediaVariant>(["thumb","card","large"]);

export async function GET(_request:Request,{params}:{params:Promise<{assetId:string;variant:string}>}){
  const session=await auth.api.getSession({headers:await headers()});
  if(!session)return new Response(null,{status:404});
  const {assetId,variant}=await params;
  if(!VARIANTS.has(variant as MediaVariant))return new Response(null,{status:404});
  try{
    const asset=await getAuthorizedMedia(assetId,session.user.id);
    const bytes=await readVariant(asset.storageKey,variant as MediaVariant);
    return new Response(new Uint8Array(bytes),{headers:{
      "Content-Type":"image/webp",
      "Cache-Control":"private, max-age=300",
      "X-Content-Type-Options":"nosniff",
    }});
  }catch{
    return new Response(null,{status:404});
  }
}
