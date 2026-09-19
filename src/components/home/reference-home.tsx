import Link from "next/link";
import { homeCopy, type HomeLocale } from "./copy";
import { HomeIcon, type HomeIconName } from "./icons";
import { InventoryPreview, CalendarPreview } from "./preview";
import "./reference-home.css";

const audienceIcons: HomeIconName[] = ["people", "home", "school", "church", "people", "theatre"];

function Brand() {
  return <span className="lh-brand">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/images/leihnest-home/nest-logo.png" width={40} height={43} alt="" />
    <strong>LeihNest</strong>
  </span>;
}

export function ReferenceHome({ locale }: { locale: HomeLocale }) {
  const t = homeCopy[locale];
  const login = locale === "de" ? "/login" : "/login?lang=en";
  const register = locale === "de" ? "/register" : "/register?lang=en";

  return <div className="lh-home" lang={locale}>
    <a className="lh-skip" href="#home-main">{t.skip}</a>
    <main id="home-main">
      <section className="lh-hero" aria-labelledby="home-title">
        <div className="lh-art" aria-hidden="true">
          {/* The asset contains only scenery; all original UI regions were removed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/leihnest-home/reference-scene.webp" width={928} height={576} alt="" fetchPriority="high" />
        </div>
        <header className="lh-header">
          <Link href={locale === "de" ? "/" : "/en"} aria-label="LeihNest"><Brand /></Link>
          <nav className="lh-nav" aria-label={locale === "de" ? "Hauptnavigation" : "Main navigation"}>
            <a href="#funktionen">{t.features}</a><a href="#ablauf">{t.how}</a>
          </nav>
          <div className="lh-header-right"><nav className="lh-languages" aria-label={locale === "de" ? "Sprache" : "Language"}>
            <Link href="/" lang="de" aria-current={locale === "de" ? "page" : undefined}>DE</Link>
            <Link href="/en" lang="en" aria-current={locale === "en" ? "page" : undefined}>EN</Link>
          </nav><Link className="lh-button lh-header-login" href={login}>{t.login}</Link></div>
        </header>
        <div className="lh-copy">
          <p className="lh-eyebrow">{t.eyebrow}</p>
          <h1 id="home-title">{t.title}<br /><span>{t.green}</span></h1>
          <p className="lh-description">{t.description}</p>
          <div className="lh-hero-actions"><Link className="lh-button" href={login}>{t.login}<HomeIcon name="arrow" /></Link>
            <a className="lh-play" href="#ablauf"><HomeIcon name="play" />{t.how}</a></div>
          <dl className="lh-facts">{t.facts.map(([heading, detail]) => <div key={heading}><dt>{heading}</dt><dd>{detail}</dd></div>)}</dl>
        </div>
        <div className="lh-product-stage"><InventoryPreview locale={locale} /><CalendarPreview locale={locale} />
          <div className="lh-borrow-note"><span><HomeIcon name="leaf" /></span><p>{t.note}<strong>{t.noteStrong}</strong></p></div>
        </div>
      </section>
      <section className="lh-audiences" id="zielgruppen" aria-label={locale === "de" ? "Fuer wen ist LeihNest?" : "Who LeihNest is for"}>
        <p>{t.audienceIntro}</p><div>{t.audiences.map((name, index) => <span key={name}><HomeIcon name={audienceIcons[index]} />{name}</span>)}
          <span><b aria-hidden="true">&middot;&middot;&middot;</b>{t.more}</span></div>
      </section>
      <section className="lh-features" id="funktionen" aria-label={t.features}>
        {t.featuresList.map(([title, description], index) => <article key={title}>
          <span className="lh-round-icon"><HomeIcon name={( ["box", "calendar", "return"] as const )[index]} /></span>
          <div><h2>{title}</h2><p>{description}</p><a href={`#step-${index + 1}`}>{t.learn}<HomeIcon name="arrow" /></a></div>
        </article>)}
      </section>
      <section className="lh-how" id="ablauf" aria-labelledby="how-title">
        <div className="lh-how-heading"><p className="lh-eyebrow">{t.stepsEyebrow}</p><h2 id="how-title">{t.how}</h2></div>
        {locale === "de" ? /* eslint-disable-next-line @next/next/no-img-element */
          <img className="lh-handwriting" src="/images/leihnest-home/handwritten-accent.webp" width={205} height={71} alt="" /> :
          <p className="lh-handwriting lh-handwriting-en" aria-hidden="true">{t.motto}</p>}
        <div className="lh-steps">{t.steps.map(([title, description], index) => <article key={title} id={`step-${index + 1}`}>
          <span>{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div>
        </article>)}</div>
      </section>
    </main>
    <footer className="lh-footer"><Link href={locale === "de" ? "/" : "/en"}><Brand /></Link><p>{t.footer}</p>
      <nav aria-label={locale === "de" ? "Weitere Informationen" : "Further information"}><Link href="/datenschutz">{t.privacy}</Link>
        <Link href="/impressum">{t.legal}</Link><Link href="/kontakt">{t.help}</Link><Link href="/kontakt">{t.contact}</Link>
        <Link href={register}>{t.register}</Link></nav>
      <details className="lh-credits"><summary>{t.credits}</summary><p>{t.creditText}</p><p>{t.demoHint}</p></details>
    </footer>
  </div>;
}
