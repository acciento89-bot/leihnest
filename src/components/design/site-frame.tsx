import Link from "next/link";
import { NestBrand } from "./brand";
import { siteCopy, type SiteLocale } from "./site-copy";
import { NestIcon } from "./icons";

export function SiteHeader({ locale, auth = false, switchHrefs }: { locale: SiteLocale; auth?: boolean; switchHrefs?: { de: string; en: string } }) {
  const t=siteCopy[locale];
  return <header className={`nest-header ${auth ? "nest-header-auth" : ""}`}>
    <NestBrand href={locale === "de" ? "/" : "/en"}/>
    {auth ? <p className="nest-tagline">{t.tagline}</p> : <nav className="nest-main-nav" aria-label={locale === "de" ? "Hauptnavigation" : "Main navigation"}><a href="#funktionen">{t.features}</a><a href="#ablauf">{t.how}</a></nav>}
    <div className="nest-header-right"><nav className="nest-languages" aria-label={locale === "de" ? "Sprache" : "Language"}>
      <Link href={switchHrefs?.de ?? "/"} hrefLang="de" aria-current={locale === "de" ? "page" : undefined}>DE</Link>
      <Link href={switchHrefs?.en ?? "/en"} hrefLang="en" aria-current={locale === "en" ? "page" : undefined}>EN</Link>
    </nav>{!auth && <Link className="nest-button nest-header-login" href={locale === "de" ? "/login" : "/login?lang=en"}>{t.login}</Link>}</div>
  </header>;
}
export function SiteFooter({ locale }: { locale: SiteLocale }) {
  const t=siteCopy[locale];
  return <footer className="nest-footer"><NestBrand href={locale === "de" ? "/" : "/en"} compact/><p>{t.footer}</p><nav aria-label={locale === "de" ? "Weitere Informationen" : "More information"}>
    <Link href="/datenschutz">{t.privacy}</Link><Link href="/impressum">{t.legal}</Link><Link href={locale === "de" ? "/#faq" : "/en#faq"}>{t.help}</Link><Link href="/kontakt">{t.contact}</Link><Link href={`/bildnachweise${locale === "en" ? "?lang=en" : ""}`}>{t.credits}</Link>
  </nav></footer>;
}
export function RealTrustStrip({ locale }: { locale: SiteLocale }) {
  const t=siteCopy[locale];
  return <div className="nest-trust-strip">{(["people","box","leaf"] as const).map((icon,index)=><div key={icon}><span className="nest-round-icon"><NestIcon name={icon}/></span><div><strong>{t.authTrust[index]}</strong><small>{t.authTrustHints[index]}</small></div></div>)}</div>;
}
