"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceLocale } from "@/features/workspace/workspace";

type Asset = { id:string };

const copy={
  de:{
    upload:"Bild hochladen",replace:"Bild ersetzen",remove:"Bild entfernen",working:"Wird verarbeitet…",
    invalid:"Das Bild konnte nicht verarbeitet werden. Bitte nutze JPEG, PNG oder WebP bis 8 MB.",
    limit:"Für diesen Tarif ist die maximale Bildanzahl erreicht.",error:"Das hat leider nicht geklappt. Bitte versuche es erneut.",
    up:"Nach vorne",down:"Nach hinten",remaining:"Bilder möglich",
  },
  en:{
    upload:"Upload image",replace:"Replace image",remove:"Remove image",working:"Working…",
    invalid:"The image could not be processed. Use JPEG, PNG or WebP up to 8 MB.",
    limit:"The maximum number of images for this plan has been reached.",error:"Something went wrong. Please try again.",
    up:"Move forward",down:"Move back",remaining:"images available",
  },
} as const;

function message(locale:WorkspaceLocale,code?:string){
  if(code==="IMAGE_LIMIT")return copy[locale].limit;
  if(code==="INVALID_IMAGE"||code==="IMAGE_TOO_LARGE")return copy[locale].invalid;
  return copy[locale].error;
}

async function api(url:string,init:RequestInit){
  const response=await fetch(url,init);
  if(response.ok)return response.status===204?{}:response.json();
  let code:string|undefined;
  try{code=(await response.json()).error;}catch{}
  throw new Error(code||"ERROR");
}

export function SingleImageControl({locale,kind,assetId,canEdit,fallbackLabel}:{locale:WorkspaceLocale;kind:"profile"|"group";assetId?:string|null;canEdit:boolean;fallbackLabel:string}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const endpoint=kind==="profile"?"/api/media/profile":"/api/media/group";
  async function upload(file?:File){
    if(!file)return;setBusy(true);setError("");
    try{const data=new FormData();data.set("file",file);await api(endpoint,{method:"POST",body:data});router.refresh();}
    catch(err){setError(message(locale,err instanceof Error?err.message:undefined));}
    finally{setBusy(false);}
  }
  async function remove(){
    if(!assetId)return;setBusy(true);setError("");
    try{await api(endpoint,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({assetId})});router.refresh();}
    catch(err){setError(message(locale,err instanceof Error?err.message:undefined));}
    finally{setBusy(false);}
  }
  return <div className="ws-media-control">
    <div className="ws-media-preview">{assetId?<img src={`/api/media/${assetId}/thumb`} alt=""/>:<span>{fallbackLabel.slice(0,2).toUpperCase()}</span>}</div>
    {canEdit&&<div className="ws-media-actions">
      <label className="ws-button ws-secondary">{busy?copy[locale].working:(assetId?copy[locale].replace:copy[locale].upload)}
        <input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.currentTarget.value="";}}/>
      </label>
      {assetId&&<button type="button" className="ws-link-button" disabled={busy} onClick={()=>void remove()}>{copy[locale].remove}</button>}
    </div>}
    {error&&<p className="ws-feedback ws-error" role="alert">{error}</p>}
  </div>;
}

export function ItemImageGallery({locale,itemId,assets,limit,canEdit}:{locale:WorkspaceLocale;itemId:string;assets:Asset[];limit:1|5;canEdit:boolean}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const ids=useMemo(()=>assets.map(asset=>asset.id),[assets]);
  async function upload(file?:File){
    if(!file)return;setBusy(true);setError("");
    try{const data=new FormData();data.set("file",file);await api(`/api/media/items/${encodeURIComponent(itemId)}`,{method:"POST",body:data});router.refresh();}
    catch(err){setError(message(locale,err instanceof Error?err.message:undefined));}
    finally{setBusy(false);}
  }
  async function remove(assetId:string){
    setBusy(true);setError("");
    try{await api(`/api/media/items/${encodeURIComponent(itemId)}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({assetId})});router.refresh();}
    catch(err){setError(message(locale,err instanceof Error?err.message:undefined));}
    finally{setBusy(false);}
  }
  async function move(index:number,direction:-1|1){
    const next=[...ids];const target=index+direction;if(target<0||target>=next.length)return;
    [next[index],next[target]]=[next[target],next[index]];setBusy(true);setError("");
    try{await api(`/api/media/items/${encodeURIComponent(itemId)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({assetIds:next})});router.refresh();}
    catch(err){setError(message(locale,err instanceof Error?err.message:undefined));}
    finally{setBusy(false);}
  }
  return <div className="ws-item-gallery">
    <div className="ws-item-gallery-grid">{assets.map((asset,index)=><div className="ws-item-gallery-entry" key={asset.id}>
      <img src={`/api/media/${asset.id}/thumb`} alt=""/>
      {canEdit&&<div className="ws-item-gallery-buttons">
        <button type="button" disabled={busy||index===0} onClick={()=>void move(index,-1)} aria-label={copy[locale].up}>↑</button>
        <button type="button" disabled={busy||index===assets.length-1} onClick={()=>void move(index,1)} aria-label={copy[locale].down}>↓</button>
        <button type="button" disabled={busy} onClick={()=>void remove(asset.id)} aria-label={copy[locale].remove}>×</button>
      </div>}
    </div>)}</div>
    {canEdit&&assets.length<limit&&<label className="ws-button ws-secondary ws-media-upload">{busy?copy[locale].working:copy[locale].upload}
      <input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.currentTarget.value="";}}/>
    </label>}
    <small className="ws-muted">{assets.length}/{limit} · {copy[locale].remaining}</small>
    {error&&<p className="ws-feedback ws-error" role="alert">{error}</p>}
  </div>;
}
