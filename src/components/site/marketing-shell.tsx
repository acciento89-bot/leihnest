import Link from "next/link";

export type MarketingLocale = "de" | "en";

export function MarketingHeader({ locale }: { locale: MarketingLocale }) {
  const de = locale === "de";
  return <header className="mx-auto flex w-full max-w-6xl items-center gap-5 px-6 py-6">
    <Link href={de ? "/" : "/en"} className="flex items-center gap-2 font-bold text-[var(--foreground)]" aria-label="LeihNest">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/leihnest-home/nest-logo.png" width={34} height={37} alt="" />
      <span className="text-xl">LeihNest</span>
    </Link>
    <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold sm:flex" aria-label={de ? "Hauptnavigation" : "Main navigation"}>
      <Link href={de ? "/funktionen" : "/en/features"}>{de ? "Funktionen" : "Features"}</Link>
      <Link href={de ? "/preise" : "/en/pricing"}>{de ? "Preise" : "Pricing"}</Link>
    </nav>
    <Link className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold" href={de ? "/en" : "/"}>{de ? "EN" : "DE"}</Link>
    <Link className="rounded-xl bg-[var(--brand-dark)] px-4 py-2 text-sm font-semibold text-white" href={de ? "/login" : "/login?lang=en"}>{de ? "Anmelden" : "Sign in"}</Link>
  </header>;
}

export function MarketingFooter({ locale }: { locale: MarketingLocale }) {
  const de = locale === "de";
  return <footer className="mx-auto mt-16 flex w-full max-w-6xl flex-wrap gap-x-6 gap-y-3 border-t border-[var(--line)] px-6 py-8 text-sm text-[var(--muted)]">
    <span>© 2026 Kamilunavo · LeihNest</span>
    <Link href={de ? "/preise" : "/en/pricing"}>{de ? "Preise" : "Pricing"}</Link>
    <Link href={de ? "/funktionen" : "/en/features"}>{de ? "Funktionen" : "Features"}</Link>
    <Link href="/datenschutz">{de ? "Datenschutz" : "Privacy"}</Link>
    <Link href="/impressum">{de ? "Impressum" : "Legal notice"}</Link>
    <Link href="/kontakt">{de ? "Kontakt" : "Contact"}</Link>
  </footer>;
}
