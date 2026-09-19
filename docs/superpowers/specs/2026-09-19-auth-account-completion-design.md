# LeihNest Auth & Account Completion Design

**Status:** verbindliche Restarbeiten fuer Production Readiness  
**Datum:** 19.09.2026  
**Repository:** `acciento89-bot/leihnest`  
**Baseline:** `main` ab Commit `866242b663e0afe179bc84976bc0a1af8beac24e`  
**Zieldomain:** `https://leihnest.de`

---

## 1. Ziel

LeihNest besitzt bereits einen funktionierenden Mitgliederbereich, E-Mail/Passwort-Registrierung, E-Mail/Passwort-Login, Gruppen, Mitglieder, Einladungslinks, Inventar, Reservierungen, Medien und Plus-Billing.

Der Account-/Authentifizierungs-Lifecycle ist jedoch noch nicht production-complete.

Dieses Design schliesst diese Luecken, ohne die bestehende Produktlogik oder das freigegebene Homepage-Design neu zu bauen.

Nach Abschluss muessen Nutzer:

- ein Konto mit E-Mail und Passwort registrieren und ihre E-Mail bestaetigen;
- Verifizierungs-Mails erneut anfordern koennen;
- ein vergessenes Passwort sicher zuruecksetzen koennen;
- Einladungen automatisch per E-Mail erhalten;
- sich mit Google anmelden koennen;
- sich mit Apple anmelden koennen;
- Passkeys fuer Anmeldung und Kontosicherheit verwenden koennen;
- verbundene Login-Methoden verwalten koennen;
- aktive Sitzungen sehen und widerrufen koennen;
- ihre E-Mail sicher aendern und die neue Adresse bestaetigen koennen;
- ihr Passwort aendern koennen;
- eine sichere Kontoloeschung ausloesen koennen.

Alle relevanten Flows muessen Deutsch und Englisch unterstuetzen.

---

## 2. Bestehender Stand

Bereits vorhanden:

- Better Auth `1.6.x`;
- Prisma/PostgreSQL Auth-Tabellen `User`, `Session`, `Account`, `Verification`;
- `User.emailVerified`;
- E-Mail/Passwort-Registrierung;
- E-Mail/Passwort-Login;
- Logout;
- Better-Auth-Catch-all unter `/api/auth/[...all]`;
- sichere `next`-Weiterleitung ueber `safeNextPath`;
- Einladungen mit gehashtem, sieben Tage gueltigem Token;
- E-Mail-Bindung einer Einladung;
- Einladung annehmen nach Login/Registrierung;
- aktive Sitzungen werden bereits in der Datenbank gespeichert;
- zweisprachige oeffentliche und Workspace-Oberflaechen.

Noch nicht vorhanden:

- Mail-Transport;
- Verifizierungs-Mail;
- Pflicht zur E-Mail-Bestaetigung;
- Resend-Verifizierung;
- Passwort-vergessen-/Reset-Flow;
- automatische Einladungsmail;
- Google OAuth;
- Apple Sign in;
- Passkeys/WebAuthn;
- UI fuer verbundene Login-Methoden;
- UI fuer aktive Sessions und Session-Widerruf;
- sicherer E-Mail-Wechsel;
- Passwortwechsel im Konto;
- verifizierter Account-Loeschflow;
- vollstaendige Auth-End-to-End-Tests.

---

## 3. Mail-Architektur

LeihNest erhaelt eine kleine provider-neutrale Mail-Schicht.

Erste Production-Implementierung: SMTP ueber `nodemailer`.

Server-Konfiguration:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
MAIL_FROM
```

`MAIL_FROM` enthaelt die vollstaendige Absenderidentitaet, z. B. einen vom Betreiber in Portainer konfigurierten LeihNest-Absender.

Die Anwendung kennt ausserhalb des Mail-Adapters keine SMTP-Details.

Interface:

```ts
export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}
```

Mail-Templates sind eigene Funktionen und erhalten nur die benoetigten Variablen.

V1-Templates:

- E-Mail bestaetigen;
- Verifizierung erneut senden;
- Passwort zuruecksetzen;
- Gruppeneinladung;
- E-Mail-Aenderung bestaetigen;
- Kontoloeschung bestaetigen;
- optionaler Sicherheitshinweis nach Passwort-Reset.

Keine Secrets, Passwortwerte, Session-Tokens oder OAuth-Tokens werden in Mail-Logs geschrieben.

---

## 4. Sprache von E-Mails

Unterstuetzte Sprachen:

- Deutsch;
- Englisch.

Auth-Mails waehlen die Sprache aus dem aktuellen LeihNest-Sprachcookie bzw. dem Request-Locale-Kontext und fallen auf Deutsch zurueck.

Einladungsmails verwenden die Sprache des einladenden Workspace-Kontexts. Der Einladungslink selbst bleibt sprachneutral; nach Oeffnen kann LeihNest anhand Browser/Cookie die passende Oberflaeche ausgeben.

Alle Mail-Templates besitzen dieselben semantischen Inhalte in DE und EN.

---

## 5. E-Mail-Verifizierung

Better Auth wird so erweitert, dass E-Mail/Passwort-Nutzer ihre Adresse bestaetigen muessen.

Server-Konfiguration:

```ts
emailVerification: {
  sendOnSignUp: true,
  sendOnSignIn: true,
  autoSignInAfterVerification: true,
  expiresIn: 60 * 60,
  sendVerificationEmail: ...
},
emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,
  requireEmailVerification: true,
  ...
}
```

Nach Registrierung wird kein unbestaetigter Nutzer direkt in `/app` geschickt.

Stattdessen erscheint eine Seite:

```
/verify-email
```

Sie zeigt eine neutrale Meldung, dass eine Mail versendet wurde, und bietet eine erneute Zustellung an.

Der Flow darf nicht offenlegen, ob eine E-Mail bereits registriert ist.

Nach erfolgreicher Verifizierung:

- `emailVerified = true`;
- Better Auth kann die Sitzung erstellen;
- Rueckleitung auf den sicheren `next`-Pfad bzw. `/app`.

Abgelaufene oder ungueltige Tokens zeigen einen kontrollierten Fehler mit Option zum erneuten Senden.

---

## 6. Passwort vergessen und Passwort-Reset

Neue Seiten:

```
/forgot-password
/reset-password
```

`/forgot-password` akzeptiert eine E-Mail-Adresse und zeigt immer eine neutrale Erfolgsantwort.

Better Auth `requestPasswordReset` sendet einen zeitlich begrenzten Link.

`/reset-password?token=...` erlaubt ein neues Passwort nach denselben Passwortregeln wie Registrierung.

Nach erfolgreichem Reset:

- alle anderen bestehenden Sessions werden widerrufen;
- Nutzer wird zur Anmeldung geleitet;
- der Reset-Token kann nicht erneut verwendet werden.

Serverkonfiguration:

```ts
emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,
  requireEmailVerification: true,
  revokeSessionsOnPasswordReset: true,
  sendResetPassword: ...
}
```

---

## 7. Automatische Einladungsmails

Die bestehende Einladungslogik bleibt die fachliche Quelle:

- Einladung gehoert zu genau einer Gruppe;
- E-Mail ist fest gebunden;
- Token wird nur gehasht gespeichert;
- Gueltigkeit sieben Tage;
- bereits akzeptierte/abgelaufene Einladungen funktionieren nicht.

Neu:

Nach erfolgreicher Erstellung wird automatisch eine E-Mail an die eingeladene Adresse gesendet.

Die Mail enthaelt:

- Namen der Gruppe;
- Rolle in menschenlesbarer Form;
- Ablaufhinweis;
- sicheren Link `https://leihnest.de/invite/<token>`;
- Hinweis, dass fuer exakt diese E-Mail-Adresse ein LeihNest-Konto benoetigt wird.

Der bestehende manuelle Copy-Link bleibt als Fallback erhalten.

Schlaegt Mailversand fehl, wird die bereits korrekt erzeugte Einladung nicht unkontrolliert geloescht. Die UI meldet den Versandfehler und zeigt den Copy-Link, damit die Einladung weiterhin geteilt werden kann.

---

## 8. Google Login

Google wird als Better-Auth-Social-Provider aktiviert.

Runtime-Konfiguration:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Production Callback:

```
https://leihnest.de/api/auth/callback/google
```

Die Login- und Registrierungsoberflaeche erhaelt einen klaren Button fuer Google.

Account-Verknuepfung darf nur auf einer vom Provider bestaetigten Identitaet basieren. Eine unbestaetigte Provider-E-Mail darf keinen bestehenden LeihNest-Account uebernehmen.

Ein bereits angemeldeter Nutzer kann Google in den Sicherheitseinstellungen explizit verbinden.

---

## 9. Sign in with Apple

Apple wird als Better-Auth-Social-Provider aktiviert.

Runtime-Konfiguration:

```text
APPLE_CLIENT_ID
APPLE_TEAM_ID
APPLE_KEY_ID
APPLE_PRIVATE_KEY
```

Das Apple Client Secret wird serverseitig als ES256-JWT erzeugt; der private Apple Key darf niemals ins Repository oder Browser-Bundle gelangen.

Production Callback:

```
https://leihnest.de/api/auth/callback/apple
```

`https://appleid.apple.com` wird nur dort als Trusted Origin konfiguriert, wo Better Auth dies fuer den Apple-Flow verlangt.

Apple Private Relay-Adressen werden als normale Account-E-Mail behandelt und nicht durch eigene Heuristiken ersetzt.

---

## 10. Passkeys

Passkeys werden mit dem Better-Auth-Passkey-Plugin umgesetzt:

```text
@better-auth/passkey
```

Server:

```ts
plugins: [
  passkey({
    rpName: "LeihNest",
    rpID: "leihnest.de",
    origin: "https://leihnest.de"
  })
]
```

Local Development nutzt entsprechend `localhost` und die lokale Origin.

Der Client verwendet `passkeyClient()`.

Passkeys werden nicht als passkey-first Registrierung eingefuehrt.

V1-Regel:

- Konto zuerst ueber E-Mail/Passwort oder Social Login;
- danach Passkey im angemeldeten Account hinzufuegen;
- Passkey kann anschliessend zum Login verwendet werden.

Nutzer koennen:

- mehrere Passkeys anlegen;
- Passkeys benennen;
- Passkeys anzeigen;
- Passkeys umbenennen;
- Passkeys loeschen.

Die erforderliche Better-Auth-Passkey-Tabelle wird ueber eine additive Prisma-Migration angelegt.

---

## 11. Account Linking

Ein LeihNest-`User` kann mehrere `Account`-Eintraege besitzen.

Beispiel:

```
User
├── credential
├── google
├── apple
└── passkeys 1..n
```

Grundsaetze:

- keine Verknuepfung ueber unbestaetigte Provider-E-Mails;
- explizites Linking aus einer bestehenden, authentifizierten Sitzung ist erlaubt;
- OAuth-Provider mit bestaetigter E-Mail duerfen nach den Better-Auth-Sicherheitsregeln mit demselben Benutzerkonto verknuepft werden;
- unterschiedliche E-Mail-Adressen werden nicht automatisch als dieselbe Person behandelt;
- Verknuepfungen koennen in den Sicherheitseinstellungen angezeigt werden;
- Entfernen eines Providers darf den Nutzer nicht ohne nutzbaren Login-/Recovery-Weg zuruecklassen.

---

## 12. Kontosicherheit

Die Einstellungen erhalten einen eigenen Sicherheitsbereich.

Funktionen:

### Passwort aendern

- aktuelles Passwort erforderlich;
- neues Passwort mindestens acht Zeichen;
- Option bzw. Standard, andere Sitzungen zu widerrufen.

### E-Mail aendern

Better Auth `changeEmail` wird aktiviert.

- aktuelle Identitaet bleibt bis zur Bestaetigung gueltig;
- neue E-Mail wird erst nach Verifizierung uebernommen;
- aktueller Account erhaelt eine Sicherheitsinformation bzw. Bestaetigung gemaess Better-Auth-Flow.

### Sitzungen

Nutzer koennen:

- alle aktiven Sessions auflisten;
- Geraete-/Browserhinweis, Erstellzeit und letzte Metadaten sehen;
- eine andere Session widerrufen;
- alle anderen Sessions widerrufen.

Rohes Session-Token wird nicht im DOM angezeigt.

### Konto loeschen

Die bereits aktivierte Better-Auth-Loeschfunktion wird mit einer verifizierten Bestaetigung abgesichert.

Bei Social-only-Nutzern muss keine Passwortpflicht erfunden werden; der Verifikationslink bestaetigt den Loeschwunsch.

Bestehende fachliche Loesch-/Billing-Abhaengigkeiten muessen vor finaler Loeschung weiterhin respektiert werden.

---

## 13. Rate Limits und Abuse Controls

Better Auth Production Rate Limiting wird explizit aktiviert und fuer kritische Endpunkte verschaerft.

Mindestens:

- E-Mail/Passwort-Login;
- Registrierung;
- Verification resend;
- Passwort-Reset-Anforderung;
- Google/Apple Auth-Start;
- Passkey-Authentifizierung.

Die bestehende Production-Architektur nutzt einen einzelnen Web-Container; Memory-Rate-Limiting ist deshalb fuer diesen Stand akzeptabel.

Vor horizontaler Skalierung muss das Rate-Limit-Backend auf eine gemeinsame Speicherung umgestellt werden.

Alle Forgot-Password-/Verification-Responses vermeiden Account Enumeration.

---

## 14. UI

Das bestehende LeihNest-Design bleibt erhalten.

Login:

- E-Mail + Passwort;
- Passwort vergessen;
- Google;
- Apple;
- Passkey;
- Link zur Registrierung.

Registrierung:

- Name;
- E-Mail;
- Passwort;
- Google;
- Apple;
- anschliessend Verification-Pending statt sofortigem Workspace-Zugriff bei Credentials.

Settings / Security:

- E-Mail-Bestaetigungsstatus;
- E-Mail aendern;
- Passwort aendern;
- Google verbinden/trennen;
- Apple verbinden/trennen;
- Passkeys;
- aktive Sitzungen;
- alle anderen Sitzungen abmelden;
- Konto loeschen.

Alle Zustands- und Fehlermeldungen existieren in Deutsch und Englisch.

---

## 15. Datenbank

Vorhandene Better-Auth-Basistabellen werden weiterverwendet.

Neu ist mindestens die Passkey-Tabelle entsprechend Better Auth v1.6.

Keine bestehende LeihNest-Fachdatentabelle wird fuer Auth neu modelliert.

Migrationen sind:

- additiv;
- production-safe;
- mit Prisma verwaltet;
- ohne Reset der PostgreSQL-Datenbank.

---

## 16. Deployment-Konfiguration

Die Production-Deployment-Quelle ist `main`.

Erforderliche neue Secrets/Variablen werden ausserhalb von Git in Portainer gesetzt:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
MAIL_FROM

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

APPLE_CLIENT_ID
APPLE_TEAM_ID
APPLE_KEY_ID
APPLE_PRIVATE_KEY
```

Bestehende Secrets bleiben erhalten.

OAuth-Konfiguration ausserhalb des Repositories:

### Google

Authorized redirect URI:

```
https://leihnest.de/api/auth/callback/google
```

### Apple

Sign in with Apple Service ID / Web Return URL:

```
https://leihnest.de/api/auth/callback/apple
```

Passkeys benoetigen fuer Production eine gueltige HTTPS-Origin auf `leihnest.de`.

---

## 17. Tests

Test-first Implementierung.

Mindestens abzudecken:

### Mail

- korrektes DE-/EN-Template;
- keine Secrets in Logs/Fehlern;
- SMTP-Fehler kontrolliert.

### Verification

- Registrierung sendet Verification;
- unverified Credential-User kann nicht normal einloggen;
- gueltiger Link verifiziert;
- ungueltiger/abgelaufener Token wird abgelehnt;
- Resend funktioniert;
- bestehende E-Mail wird nicht enumeriert.

### Passwort Reset

- neutrale Forgot-Password-Antwort;
- gueltiger Token setzt Passwort;
- abgelaufener Token scheitert;
- Token nicht wiederverwendbar;
- andere Sessions werden widerrufen.

### Einladungen

- automatische Mail enthaelt korrekte Gruppe/Rolle/URL;
- Mailfehler laesst Copy-Link nutzbar;
- fremde E-Mail kann Einladung nicht annehmen.

### Social

- Google start/callback;
- Apple start/callback;
- sichere Account-Zuordnung;
- OAuth-Fehler landen kontrolliert auf Login.

### Passkeys

- Passkey hinzufuegen;
- anmelden;
- auflisten;
- umbenennen;
- loeschen;
- falsche Origin/RP-Konfiguration scheitert.

### Security Settings

- E-Mail-Aenderung erst nach Verifizierung;
- Passwortwechsel;
- einzelne Session widerrufen;
- andere Sessions widerrufen;
- Provider-/Passkey-Verwaltung;
- kein Entfernen des letzten nutzbaren Recovery-Wegs;
- gesicherte Kontoloeschung.

### Full Gate

```sh
npm test
npm run lint
npm run typecheck
npm run build
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
docker build -t leihnest:release .
```

---

## 18. Production Smoke Test

Nach Deployment:

1. neue E-Mail/Passwort-Registrierung;
2. Verification-Mail empfangen;
3. Verification-Link;
4. Login;
5. Resend Verification;
6. Passwort vergessen;
7. Passwort-Reset;
8. Einladungsmail empfangen;
9. Einladung ueber neuen Account annehmen;
10. Google Login;
11. Google mit bestehendem Account verbinden;
12. Apple Login;
13. Apple mit bestehendem Account verbinden;
14. Passkey hinzufuegen;
15. Logout;
16. Passkey Login;
17. Sessions anzeigen und zweite Session widerrufen;
18. E-Mail-Wechsel mit Verifikation;
19. Passwortwechsel;
20. bestehende Inventar-/Reservierungs-/Billing-Kernflows erneut kurz pruefen.

---

## 19. Fertig-Definition

LeihNest wird erst als Account/Auth-seitig fertig bezeichnet, wenn:

- Verification-Mails in Production zugestellt werden;
- unbestaetigte Credential-Accounts nicht direkt in den Workspace gelangen;
- Forgot Password und Reset live funktionieren;
- Einladungsmails automatisch versendet werden;
- Google Login live funktioniert;
- Apple Login live funktioniert;
- Passkey Login auf `https://leihnest.de` funktioniert;
- Account Linking sicher funktioniert;
- Security Settings vollstaendig funktionieren;
- alle Auth-Tests gruen sind;
- Production-Build/Docker-Build gruen sind;
- Production Smoke Test vollstaendig bestanden ist.
