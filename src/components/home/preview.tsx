"use client";

import { useState } from "react";
import Link from "next/link";
import { HomeIcon, type HomeIconName } from "./icons";
import { homeCopy, type HomeLocale } from "./copy";

const kinds = ["pavilion", "speaker", "projector", "chair", "toolbox", "benches"];
const categoryOf = [1, 2, 2, 3, 4, 3];
const navigationIcons: HomeIconName[] = ["home", "box", "calendar", "people", "settings"];

export function InventoryPreview({ locale }: { locale: HomeLocale }) {
  const t = homeCopy[locale];
  const [category, setCategory] = useState(0);
  const [search, setSearch] = useState("");
  const shown = kinds.map((kind, index) => ({ kind, index })).filter(({ index }) =>
    (category === 0 || categoryOf[index] === category) &&
    t.items[index].toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale)),
  );

  return <section className="lh-preview" aria-label={t.demo}>
    <aside className="lh-preview-sidebar">
      <div className="lh-mini-brand">
        {/* The local image is a decorative mark, not a second navigation link. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/leihnest-home/nest-logo.png" width={20} height={22} alt="" />
        <strong>LeihNest</strong>
      </div>
      <div className="lh-preview-nav" aria-hidden="true">
        {t.nav.map((label, index) => <div className={index === 1 ? "active" : ""} key={label}>
          <HomeIcon name={navigationIcons[index]} />{label}
        </div>)}
      </div>
    </aside>
    <div className="lh-preview-main">
      <div className="lh-preview-toolbar">
        <label><HomeIcon name="search" /><input type="search" aria-label={t.search}
          placeholder={t.search} value={search} onChange={event => setSearch(event.target.value)} /></label>
        <Link href={locale === "de" ? "/register" : "/register?lang=en"}><HomeIcon name="plus" />{t.add}</Link>
      </div>
      <h2>{t.inventory}</h2>
      <div className="lh-preview-filters" aria-label={locale === "de" ? "Beispielkategorien" : "Sample categories"}>
        {t.categories.map((name, index) => <button key={name} type="button" aria-pressed={category === index}
          onClick={() => setCategory(index)}>{name}</button>)}
      </div>
      <div className="lh-preview-items">
        {shown.map(({ kind, index }) => <article key={kind}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/leihnest-home/${kind}.webp`} alt={t.items[index]} width={108} height={76} />
          <h3>{t.items[index]}</h3>
          <div><span className={index === 1 || index === 5 ? "reserved" : ""}>
            {index === 1 || index === 5 ? t.reserved : t.available}
          </span><HomeIcon name="calendar" /></div>
        </article>)}
      </div>
      {shown.length === 0 && <p className="lh-no-results" role="status">{t.empty}</p>}
      <p className="lh-demo-caption">{t.demo}</p>
    </div>
  </section>;
}

export function CalendarPreview({ locale }: { locale: HomeLocale }) {
  const t = homeCopy[locale];
  const [offset, setOffset] = useState(0);
  const month = new Date(Date.UTC(2026, 3 + offset, 1));
  const leadingDays = (month.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const cells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(month);

  return <aside className="lh-calendar" aria-label={t.calendar}>
    <div className="lh-calendar-item">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/leihnest-home/pavilion.webp" width={56} height={42} alt="" />
      <div><strong>{t.items[0]}</strong><span>{t.available}</span></div>
    </div>
    <div className="lh-calendar-body">
      <div className="lh-calendar-title"><button type="button" aria-label={t.previous} onClick={() => setOffset(offset - 1)}>
        <HomeIcon name="back" /></button><b>{title}</b>
        <button type="button" aria-label={t.next} onClick={() => setOffset(offset + 1)}><HomeIcon name="chevron" /></button>
      </div>
      <div className="lh-calendar-grid">
        {t.weekdays.map(day => <small key={day}>{day}</small>)}
        {Array.from({ length: cells }, (_, index) => {
          const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index - leadingDays + 1));
          const day = date.getUTCDate();
          const outside = date.getUTCMonth() !== month.getUTCMonth();
          const marked = offset === 0 && !outside && day >= 16 && day <= 19;
          return <span key={index} className={`${outside ? "outside" : ""} ${marked ? "marked" : ""}`}>
            {day}
          </span>;
        })}
      </div>
    </div>
  </aside>;
}
