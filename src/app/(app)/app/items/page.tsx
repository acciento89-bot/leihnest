import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrimaryMembership } from "@/features/groups/group-service";
import { canManageInventory } from "@/features/groups/permissions";
import { itemImageLimit } from "@/features/billing/entitlements";
import { getWorkspaceText } from "@/features/workspace/locale";
import { type WorkspaceText } from "@/features/workspace/workspace";
import { ItemPhoto, photoForItem } from "@/components/design/item-photo";
import { PageHeading, NoGroup, EmptyState, Flash, Field, Icon } from "@/components/app/workspace-ui";
import { ActionForm, SubmitButton } from "@/components/app/workspace-controls";
import { ItemImageGallery } from "@/components/app/media-controls";
import { createItemAction, itemAction } from "../actions";

type ItemsPageProps={searchParams:Promise<{error?:string;q?:string;new?:string}>};
type ItemFieldsValue={name:string;location:string|null;description:string|null;totalQuantity:number};
function ItemFields({ t,item }: {t:WorkspaceText;item?:ItemFieldsValue}) {
  return <div className="ws-form-grid"><Field label={t.name}><input name="name" required minLength={2} maxLength={120} defaultValue={item?.name} placeholder={t.itemNameExample}/></Field><Field label={t.quantity}><input name="totalQuantity" type="number" required min={1} max={9999} step={1} defaultValue={item?.totalQuantity ?? 1}/></Field><div className="ws-full"><Field label={t.location}><input name="location" maxLength={120} defaultValue={item?.location ?? ""} placeholder={t.locationExample}/></Field></div><div className="ws-full"><Field label={`${t.description} (${t.optional})`}><textarea name="description" maxLength={1000} defaultValue={item?.description ?? ""} placeholder={t.descriptionHint}/></Field></div></div>;
}
export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const session=await auth.api.getSession({headers:await headers()}); if(!session) return null;
  const [params,{locale,t},membership]=await Promise.all([searchParams,getWorkspaceText(),getPrimaryMembership(session.user.id)]);
  if(!membership) return <NoGroup locale={locale}/>;
  const q=typeof params.q === "string" ? params.q.trim().slice(0,120) : "";
  const [items,subscription]=await Promise.all([
    db.item.findMany({
      where:{groupId:membership.groupId,active:true,...(q ? {OR:[{name:{contains:q,mode:"insensitive" as const}},{location:{contains:q,mode:"insensitive" as const}},{description:{contains:q,mode:"insensitive" as const}}]} : {})},
      orderBy:{name:"asc"},
      include:{media:{where:{kind:"ITEM"},orderBy:{position:"asc"}}},
    }),
    db.groupSubscription.findUnique({where:{groupId:membership.groupId}}),
  ]);
  const manage=canManageInventory(membership.role);
  const imageLimit=itemImageLimit(subscription);
  return <section><PageHeading title={t.items} description={t.inventoryHint} action={manage && <Link className="ws-button" href="/app/items?new=1#new-item"><Icon name="plus"/>{t.addItem}</Link>}/><Flash error={params.error}/>
    {manage && <details id="new-item" className="ws-card ws-disclosure" open={params.new==="1" || !!params.error}><summary>{t.addItem}</summary><ActionForm action={createItemAction} locale={locale} resetOnSuccess><ItemFields t={t}/><div><SubmitButton locale={locale}>{t.addItem}</SubmitButton></div></ActionForm></details>}
    <form method="get" className="ws-search"><Field label={t.searchItems}><input type="search" name="q" defaultValue={q} placeholder={t.searchHint}/></Field><button type="submit" className="ws-button ws-secondary">{t.search}</button>{q && <Link className="ws-link" href="/app/items">{t.reset}</Link>}</form>
    {items.length ? <div className="ws-item-grid">{items.map(item=><article className="ws-card ws-item" key={item.id}><div className="ws-item-visual">{item.media[0]?<img className="ws-item-photo" src={`/api/media/${item.media[0].id}/card`} alt=""/>:<ItemPhoto kind={photoForItem(item.name)} name={item.name} symbolic locale={locale}/>}<span className="ws-badge">{item.totalQuantity} {t.total}</span></div><div className="ws-item-body"><h2>{item.name}</h2><p className="ws-location"><Icon name="pin"/>{item.location || t.noLocation}</p>{item.description && <p className="ws-item-description">{item.description}</p>}<div className="ws-item-footer"><Link className="ws-button ws-secondary" href={`/app/reservations?item=${encodeURIComponent(item.id)}&new=1#new-reservation`}><Icon name="calendar"/>{t.reserve}</Link></div>
      {manage && <details><summary>{t.edit}</summary><ActionForm action={itemAction} locale={locale}><input type="hidden" name="itemId" value={item.id}/><ItemFields t={t} item={item}/><div className="ws-form-actions"><SubmitButton name="action" value="update" locale={locale}>{t.save}</SubmitButton><SubmitButton name="action" value="archive" locale={locale} secondary confirm={t.archiveConfirm}>{t.archive}</SubmitButton></div><p className="ws-muted">{t.archiveHint}</p></ActionForm><div className="ws-item-images"><h3>{locale==="de"?"Gegenstandsbilder":"Item images"}</h3><p className="ws-muted">{imageLimit===1?(locale==="de"?"Free: 1 Bild pro Gegenstand.":"Free: 1 image per item."):(locale==="de"?"Plus: bis zu 5 Bilder pro Gegenstand.":"Plus: up to 5 images per item.")}</p><ItemImageGallery locale={locale} itemId={item.id} assets={item.media.map(media=>({id:media.id}))} limit={imageLimit} canEdit={manage}/></div></details>}
    </div></article>)}</div> : <EmptyState title={q?t.noResults:t.emptyItems} description={q?t.noResultsHint:(manage?t.emptyItemsHint:t.memberEmptyItems)}>{q ? <Link className="ws-button ws-secondary" href="/app/items">{t.reset}</Link> : manage && <Link className="ws-button" href="/app/items?new=1#new-item">{t.addItem}</Link>}</EmptyState>}
  </section>;
}
