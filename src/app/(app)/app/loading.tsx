import { getWorkspaceText } from "@/features/workspace/locale";
export default async function Loading(){
  const {t}=await getWorkspaceText();
  return <div className="ws-loading" role="status" aria-label={t.working}><p className="ws-muted">{t.working}</p><div className="ws-stats" aria-hidden="true">{[0,1,2,3,4].map(key=><div key={key} className="ws-skeleton"/>)}</div><div className="ws-skeleton" aria-hidden="true"/></div>;
}
