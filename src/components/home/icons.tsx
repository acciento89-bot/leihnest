import type { ReactNode } from "react";
export type HomeIconName = "lock" | "eye" | "eyeOff" | "home" | "box" | "calendar" | "people" | "leaf" | "arrow" | "plus" | "search" | "settings" | "check" | "shield" | "back" | "chevron" | "chart" | "activity" | "mail" | "school" | "church" | "theatre" | "play" | "return" | "clock";
export function HomeIcon({ name, className = "" }: { name: HomeIconName; className?: string }) {
  const icons: Record<HomeIconName, ReactNode> = {
    lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:<><path d="m3 3 18 18M9 5a13 13 0 0 1 3 0c6 0 10 7 10 7a20 20 0 0 1-4 5M6 6a24 24 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1"/></>,
    home:<><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/></>,
    box:<><path d="m3 7 9-4 9 4v10l-9 4-9-4ZM3 7l9 4 9-4M12 11v10M7 5l10 4"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/></>,
    people:<><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/></>,
    leaf:<><path d="M20 3C5 3 2 9 5 15c6 6 15 0 15-12Z"/><path d="M3 22 16 8M10 15v-5"/></>,
    arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>, plus:<path d="M12 5v14M5 12h14"/>,
    search:<><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
    settings:<><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="9" cy="5" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="7" cy="19" r="2"/></>,
    check:<path d="m4 12 5 5L20 6"/>,shield:<><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,
    back:<path d="m15 5-7 7 7 7"/>,chevron:<path d="m9 5 7 7-7 7"/>,
    chart:<><path d="M3 21V9h3v12m4 0V3h3v18m4 0V6h3v15"/></>,
    activity:<path d="M2 12h5l3-8 4 16 3-8h5"/>,
    mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
    school:<><path d="m2 8 10-5 10 5-10 5-10-5Zm4 3v7l6 3 6-3v-7M22 8v9"/></>,
    church:<><path d="M10 2h4M12 1v6M6 21V11l6-5 6 5v10H6ZM3 21h18M10 21v-6h4v6"/></>,
    theatre:<><path d="M3 4 12 6v7c0 5-4 7-4 7s-5-3-5-8V4Zm9 2 9-2v8c0 5-5 8-5 8s-2-1-3-3"/><path d="m5 9 2 1m8 0 3-1m-12 5 2 1m8 0 2-1"/></>,
    play:<><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></>,
    return:<><path d="M20 7a9 9 0 1 1-8-4M12 1v5l5-2"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  };
  return <svg className={`lh-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}
