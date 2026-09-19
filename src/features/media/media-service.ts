import { db } from "@/lib/db";
import { canManageGroupImage, canManageInventory, type GroupRole } from "@/features/groups/permissions";
import { itemImageLimit } from "@/features/billing/entitlements";
import { processImage } from "./image-processor";
import { removeAsset, writeImageVariants } from "./media-store";

async function safeRemove(storageKey:string){
  try{await removeAsset(storageKey);}catch(error){console.error("media cleanup failed",{storageKey,error:error instanceof Error?error.message:"unknown"});}
}

async function groupMembership(groupId:string,userId:string){
  return db.membership.findUnique({where:{groupId_userId:{groupId,userId}}});
}

export async function uploadProfileImage(userId:string,input:Buffer){
  const processed=await processImage(input);
  const storageKey=await writeImageVariants(processed.variants);
  let previous:string|undefined;
  try{
    const created=await db.$transaction(async tx=>{
      await tx.$queryRawUnsafe("SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext($1))",`leihnest:user:${userId}`);
      const user=await tx.user.findUnique({where:{id:userId},select:{id:true}});
      if(!user)throw new Error("FORBIDDEN");
      const existing=await tx.mediaAsset.findFirst({where:{userId,kind:"PROFILE"},orderBy:{createdAt:"desc"}});
      previous=existing?.storageKey;
      if(existing)await tx.mediaAsset.delete({where:{id:existing.id}});
      return tx.mediaAsset.create({data:{
        kind:"PROFILE",userId,storageKey,mimeType:processed.mimeType,
        sourceBytes:processed.sourceBytes,sourceWidth:processed.sourceWidth,sourceHeight:processed.sourceHeight,position:0,
      }});
    });
    if(previous)await safeRemove(previous);
    return created;
  }catch(error){
    await safeRemove(storageKey);
    throw error;
  }
}

export async function uploadGroupImage(groupId:string,userId:string,input:Buffer){
  const processed=await processImage(input);
  const storageKey=await writeImageVariants(processed.variants);
  let previous:string|undefined;
  try{
    const created=await db.$transaction(async tx=>{
      await tx.$queryRawUnsafe("SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext($1))",`leihnest:group:${groupId}`);
      const membership=await tx.membership.findUnique({where:{groupId_userId:{groupId,userId}}});
      if(!membership || !canManageGroupImage(membership.role as GroupRole))throw new Error("FORBIDDEN");
      const existing=await tx.mediaAsset.findFirst({where:{groupId,kind:"GROUP"},orderBy:{createdAt:"desc"}});
      previous=existing?.storageKey;
      if(existing)await tx.mediaAsset.delete({where:{id:existing.id}});
      return tx.mediaAsset.create({data:{
        kind:"GROUP",groupId,storageKey,mimeType:processed.mimeType,
        sourceBytes:processed.sourceBytes,sourceWidth:processed.sourceWidth,sourceHeight:processed.sourceHeight,position:0,
      }});
    });
    if(previous)await safeRemove(previous);
    return created;
  }catch(error){
    await safeRemove(storageKey);
    throw error;
  }
}

export async function uploadItemImage(groupId:string,itemId:string,userId:string,input:Buffer){
  const processed=await processImage(input);
  const storageKey=await writeImageVariants(processed.variants);
  try{
    return await db.$transaction(async tx=>{
      await tx.$queryRawUnsafe("SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext($1))",`leihnest:item:${itemId}`);
      const locked=await tx.item.findFirst({where:{id:itemId,groupId},select:{id:true}});
      if(!locked)throw new Error("NOT_FOUND");
      const membership=await tx.membership.findUnique({where:{groupId_userId:{groupId,userId}}});
      if(!membership || !canManageInventory(membership.role as GroupRole))throw new Error("FORBIDDEN");
      const subscription=await tx.groupSubscription.findUnique({where:{groupId}});
      const limit=itemImageLimit(subscription);
      const count=await tx.mediaAsset.count({where:{itemId,kind:"ITEM"}});
      if(count>=limit)throw new Error("IMAGE_LIMIT");
      return tx.mediaAsset.create({data:{
        kind:"ITEM",itemId,storageKey,mimeType:processed.mimeType,
        sourceBytes:processed.sourceBytes,sourceWidth:processed.sourceWidth,sourceHeight:processed.sourceHeight,position:count,
      }});
    });
  }catch(error){
    await safeRemove(storageKey);
    throw error;
  }
}

async function authorizeMutation(asset:{kind:"PROFILE"|"GROUP"|"ITEM";userId:string|null;groupId:string|null;item:{groupId:string}|null},userId:string){
  if(asset.kind==="PROFILE"){
    if(asset.userId!==userId)throw new Error("FORBIDDEN");
    return;
  }
  const groupId=asset.kind==="GROUP"?asset.groupId:asset.item?.groupId;
  if(!groupId)throw new Error("NOT_FOUND");
  const membership=await groupMembership(groupId,userId);
  if(!membership)throw new Error("FORBIDDEN");
  const allowed=asset.kind==="GROUP"?canManageGroupImage(membership.role as GroupRole):canManageInventory(membership.role as GroupRole);
  if(!allowed)throw new Error("FORBIDDEN");
}

export async function deleteMedia(assetId:string,userId:string){
  const asset=await db.mediaAsset.findUnique({where:{id:assetId},include:{item:{select:{groupId:true}}}});
  if(!asset)throw new Error("NOT_FOUND");
  await authorizeMutation(asset,userId);
  await db.mediaAsset.delete({where:{id:assetId}});
  await safeRemove(asset.storageKey);
}

export async function reorderItemMedia(groupId:string,itemId:string,userId:string,assetIds:string[]){
  if(new Set(assetIds).size!==assetIds.length)throw new Error("INVALID_ORDER");
  await db.$transaction(async tx=>{
    await tx.$queryRawUnsafe("SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext($1))",`leihnest:item:${itemId}`);
    const locked=await tx.item.findFirst({where:{id:itemId,groupId},select:{id:true}});
    if(!locked)throw new Error("NOT_FOUND");
    const membership=await tx.membership.findUnique({where:{groupId_userId:{groupId,userId}}});
    if(!membership || !canManageInventory(membership.role as GroupRole))throw new Error("FORBIDDEN");
    const current=await tx.mediaAsset.findMany({where:{itemId,kind:"ITEM"},select:{id:true}});
    const existing=new Set(current.map(row=>row.id));
    if(assetIds.length!==existing.size || assetIds.some(id=>!existing.has(id)))throw new Error("INVALID_ORDER");
    await Promise.all(assetIds.map((id,position)=>tx.mediaAsset.update({where:{id},data:{position}})));
  });
}

export async function getAuthorizedMedia(assetId:string,userId:string){
  const asset=await db.mediaAsset.findUnique({where:{id:assetId},include:{item:{select:{groupId:true}}}});
  if(!asset)throw new Error("NOT_FOUND");
  if(asset.kind==="PROFILE"){
    if(asset.userId===userId)return asset;
    if(!asset.userId)throw new Error("NOT_FOUND");
    const shared=await db.membership.findFirst({where:{userId,group:{memberships:{some:{userId:asset.userId}}}},select:{id:true}});
    if(!shared)throw new Error("NOT_FOUND");
    return asset;
  }
  const groupId=asset.kind==="GROUP"?asset.groupId:asset.item?.groupId;
  if(!groupId)throw new Error("NOT_FOUND");
  const membership=await groupMembership(groupId,userId);
  if(!membership)throw new Error("NOT_FOUND");
  return asset;
}
