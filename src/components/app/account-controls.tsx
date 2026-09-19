"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { workspaceText, type WorkspaceLocale } from "@/features/workspace/workspace";
export function AccountControls({email,locale="de"}:{email:string;locale?:WorkspaceLocale}){
  const router=useRouter();const t=workspaceText[locale];
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function signOut(){
    if(busy)return;setBusy(true);setError("");
    try{
      const result=await authClient.signOut();
      if(result.error){setError(t.error);return;}
      if(locale==="en")router.replace("/en");else router.replace("/");
      router.refresh();
    }catch{setError(t.error);}finally{setBusy(false);}
  }
  return <div className="ws-account"><p title={email}>{email}</p><button type="button" onClick={signOut} disabled={busy} className="ws-button ws-secondary">{busy?t.signingOut:t.signOut}</button>{error && <p role="alert" className="ws-feedback ws-error">{error}</p>}</div>;
}
