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
  },
} as const;

export type Locale = keyof typeof dictionaries;
export type Dictionary = typeof dictionaries.de | typeof dictionaries.en;
