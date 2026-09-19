"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { workspaceText } from "@/features/workspace/workspace";
const subscribe=()=>()=>{};
export default function WorkspaceError({reset}:{error:Error & {digest?:string};reset:()=>void}){
  const locale=useSyncExternalStore<"de" | "en">(subscribe,()=>document.querySelector(".workspace")?.getAttribute("lang")==="en"?"en":"de",()=>"de");
  const t=workspaceText[locale];
  return <section className="ws-empty" role="alert"><h1>{locale==="en"?"Please try again":"Bitte erneut versuchen"}</h1><p className="ws-muted">{t.error}</p><div className="ws-inline" style={{justifyContent:"center"}}><button type="button" className="ws-button" onClick={reset}>{locale==="en"?"Try again":"Erneut versuchen"}</button><Link href="/app" className="ws-button ws-secondary">{t.overview}</Link></div></section>;
}
