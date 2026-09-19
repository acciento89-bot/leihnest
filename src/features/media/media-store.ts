import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MediaVariant } from "./media-types";

function root(override?:string){return override ?? process.env.UPLOADS_DIR ?? "/data/uploads";}
function safeKey(storageKey:string){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storageKey)) throw new Error("INVALID_STORAGE_KEY");
  return storageKey;
}

export async function writeImageVariants(variants:Record<MediaVariant,Buffer>,override?:string){
  const storageKey=crypto.randomUUID();
  const base=root(override);
  const tmp=join(base,`.tmp-${storageKey}`);
  const target=join(base,storageKey);
  await mkdir(tmp,{recursive:true,mode:0o700});
  try{
    await Promise.all(Object.entries(variants).map(([name,bytes])=>writeFile(join(tmp,`${name}.webp`),bytes,{flag:"wx",mode:0o600})));
    await rename(tmp,target);
    return storageKey;
  }catch(error){
    await rm(tmp,{recursive:true,force:true});
    throw error;
  }
}

export function readVariant(storageKey:string,variant:MediaVariant,override?:string){
  return readFile(join(root(override),safeKey(storageKey),`${variant}.webp`));
}

export async function removeAsset(storageKey:string,override?:string){
  await rm(join(root(override),safeKey(storageKey)),{recursive:true,force:true});
}
