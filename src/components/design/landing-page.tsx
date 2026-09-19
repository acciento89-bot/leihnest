import Link from "next/link";
import { SiteHeader, SiteFooter } from "./site-frame";
import { InventoryPreview, PreviewCalendar } from "./inventory-preview";
import { NestIcon, type NestIconName } from "./icons";
import { siteCopy, type SiteLocale } from "./site-copy";
import "./site.css";
export function LandingPage({locale}:{locale:SiteLocale}) {
  const t=siteCopy[locale];const register=locale === "de" ? "/register" : "/register?lang=en";
  return <div className="concept-site" lang={locale} data-concept="landing"><a className="nest-skip" href="#main-content">{locale === "de" ? "Zum Inhalt" : "Skip to content"}</a><SiteHeader locale={locale}/>
    <main id="main-content"><section className="nest-hero"><div className="nest-hero-photo" aria-hidden="true"/><div className="nest-hero-copy"><p className="nest-eyebrow">{t.eyebrow}</p><h1>{t.title}<br/><span>{t.titleGreen}</span></h1><p className="nest-hero-description">{t.description}</p><div className="nest-hero-actions"><Link href={locale === "de" ? "/login" : "/login?lang=en"} className="nest-button">{t.login}<NestIcon name="arrow"/></Link><a href="#ablauf" className="nest-play-link"><NestIcon name="play"/>{t.how}</a></div><dl className="nest-facts">{[[t.private,t.privateText],[t.together,t.togetherText],[t.noAds,t.noAdsText]].map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></div>
    <div className="nest-hero-art"><div className="nest-chalkboard" aria-hidden="true"><p>{t.motto}</p></div><InventoryPreview locale={locale}/><PreviewCalendar locale={locale}/><div className="nest-borrow-note"><span><NestIcon name="leaf"/></span><p>{t.littleMotto}<strong>{t.littleMottoBold}</strong></p></div></div></section>
    <section id="zielgruppen" className="nest-audiences" aria-label={locale === "de" ? "Für wen ist LeihNest?" : "Who LeihNest is for"}><p>{t.audienceIntro}</p><div>{t.audiences.map((name,index)=><span key={name}><NestIcon name={(["people","home","school","church","people","theatre"] as NestIconName[])[index]}/>{name}</span>)}<span><b aria-hidden="true">•••</b>{t.more}</span></div></section>
    <section id="funktionen" className="nest-feature-cards">{t.featureCards.map(([title,description],index)=><article key={title}><span className="nest-round-icon"><NestIcon name={(["box","calendar","return"] as const)[index]}/></span><div><h2>{title}</h2><p>{description}</p><a href={`#step-${index+1}`}>{t.learn}<NestIcon name="arrow"/></a></div></article>)}</section>
    <section id="ablauf" className="nest-how"><div className="nest-how-title"><div><p className="nest-eyebrow">{t.stepsEyebrow}</p><h2>{t.how}</h2></div><p className="nest-handwriting">{t.startMotto}<span aria-hidden="true">♥</span></p></div><div className="nest-steps">{t.steps.map(([title,description],index)=><article key={title} id={`step-${index+1}`}><span>{index+1}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>
    <section id="vorteile" className="nest-trust"><p className="nest-eyebrow">{t.trustHint}</p><h2>{t.trustTitle}</h2><div>{t.trustCards.map(([title,description],index)=><article key={title}><NestIcon name={(["leaf","shield","people"] as const)[index]}/><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section id="faq" className="nest-faq"><h2>{t.faqTitle}</h2><div>{t.faqs.map(([question,answer])=><details key={question}><summary>{question}<NestIcon name="plus"/></summary><p>{answer}</p></details>)}</div><Link className="nest-button" href={register}>{t.register}<NestIcon name="arrow"/></Link></section>
    </main><SiteFooter locale={locale}/></div>;
}
