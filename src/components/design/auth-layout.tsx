import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader, SiteFooter, RealTrustStrip } from "./site-frame";
import { NestIcon } from "./icons";
import { siteCopy, type SiteLocale } from "./site-copy";
import "./site.css";
export function AuthLayout({ mode, locale, redirectTo }: { mode: "login" | "register"; locale:SiteLocale; redirectTo:string }) {
  const t=siteCopy[locale];const opposite=mode==="login"?"register":"login";
  const switchHref=`/${opposite}?next=${encodeURIComponent(redirectTo)}${locale==="en"?"&lang=en":""}`;
  return <div className="concept-site concept-auth" lang={locale} data-concept="auth"><SiteHeader locale={locale} auth switchHrefs={{de:`/${mode}?next=${encodeURIComponent(redirectTo)}&lang=de`,en:`/${mode}?next=${encodeURIComponent(redirectTo)}&lang=en`}}/>
    <main className="nest-auth-grid"><section className="nest-auth-card"><div><h1>{mode==="login"?<>{t.welcome}<br/>{t.backIn} <span>{t.nest}</span></>:<>{t.createTitle}<br/><span>{t.createGreen}</span></>}</h1><p className="nest-auth-intro">{mode==="login" && <>{t.authIntro}<br/></>}{mode==="login"?t.authDescription:t.createDescription}</p></div>
      <div className="nest-auth-form"><AuthForm mode={mode} redirectTo={redirectTo} locale={locale}/></div>
      <div className="nest-auth-switch"><span>{mode==="login"?t.noAccount:t.haveAccount}</span><Link href={switchHref}>{mode==="login"?t.signUp:t.signIn}<NestIcon name="arrow"/></Link></div>
      <div className="nest-auth-note"><span className="nest-round-icon"><NestIcon name="people"/></span><p>{t.authNote}</p></div>
    </section><section className="auth-scene" aria-label={locale==="de"?"Gemeinsam mehr möglich machen":"Make more possible together"}><Image src="/images/leihnest/garden-scene.webp" fill sizes="(max-width: 850px) 100vw, 55vw" priority unoptimized alt=""/><RealTrustStrip locale={locale}/></section></main><SiteFooter locale={locale}/></div>;
}
