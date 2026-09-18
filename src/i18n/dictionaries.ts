export const dictionaries = {
  de: {
    appName: "LeihNest",
    tagline: "Gemeinsam nutzen. Einfach organisiert.",
    features: "Funktionen",
    signIn: "Anmelden",
    register: "Registrieren",
    contact: "Kontakt",
    imprint: "Impressum",
    privacy: "Datenschutz",
    dashboard: "Übersicht",
    items: "Gegenstände",
    reservations: "Reservierungen",
    members: "Mitglieder",
    settings: "Einstellungen",
    returnNote: "Rückgabehinweis",
    confirmReturn: "Rückgabe bestätigen",
  },
  en: {
    appName: "LeihNest",
    tagline: "Share more. Organize less.",
    features: "Features",
    signIn: "Sign in",
    register: "Register",
    contact: "Contact",
    imprint: "Imprint",
    privacy: "Privacy",
    dashboard: "Overview",
    items: "Items",
    reservations: "Reservations",
    members: "Members",
    settings: "Settings",
    returnNote: "Return note",
    confirmReturn: "Confirm return",
  },
} as const;

export type Locale = keyof typeof dictionaries;
export type Dictionary = typeof dictionaries.de | typeof dictionaries.en;
