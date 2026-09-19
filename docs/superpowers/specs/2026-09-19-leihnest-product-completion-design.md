# LeihNest Product Completion Design

**Status:** Roadmap fuer vollstaendige Produktausreifung  
**Datum:** 19.09.2026  
**Repository:** `acciento89-bot/leihnest`  
**Baseline:** `main` ab `866242b663e0afe179bc84976bc0a1af8beac24e` plus nachfolgende Plan-/Spec-Dokumentation  
**Production:** `leihnest.de`

---

## 1. Produktziel

LeihNest ist ein geschlossenes, zweisprachiges Leih- und Organisationssystem fuer Vereine, Freundeskreise, Hausgemeinschaften und andere private Gruppen.

Der aktuelle Stand deckt bereits den Kern ab:

- Registrierung und Login mit E-Mail/Passwort;
- Gruppen;
- Rollen OWNER / ADMIN / MEMBER;
- Inventar;
- Reservierungen;
- Freigabe / Ausgabe / Rueckgabe;
- Einladungslinks;
- Profil-/Gruppen-/Gegenstandsbilder;
- LeihNest Plus;
- Stripe Checkout / Customer Portal;
- CSV-Exporte;
- Plus-Statistiken;
- responsive DE/EN-Oberflaeche;
- Docker/Portainer/PostgreSQL.

Die naechste Entwicklungsstufe soll LeihNest nicht neu erfinden, sondern die noch fehlenden Produkt- und Betriebsbausteine so ergaenzen, dass die Plattform im Alltag vollstaendig, sicher und langfristig wartbar ist.

---

## 2. Bewusste Nicht-Ziele

Nicht Teil dieser Roadmap:

- oeffentlicher Marktplatz;
- oeffentliche Gruppensuche;
- Zahlungen, Kautionen oder Geldtransfer zwischen Mitgliedern;
- Escrow;
- Versandabwicklung;
- Social Feed;
- Werbung;
- Analytics-/Tracking-Dienste von Drittanbietern;
- native iOS-/Android-App in dieser Ausbaustufe;
- komplexe Buchhaltung oder Anlagenabschreibung.

Eine installierbare PWA ist dagegen sinnvoll und Teil der Roadmap.

---

## 3. Prioritaeten

### Prioritaet A – Production Completion

Diese Bereiche schliessen reale Funktions- oder Sicherheitsluecken:

1. Auth-/Account-Lifecycle;
2. Mehrgruppenfaehigkeit und vollstaendige Mitgliederverwaltung;
3. robuste Reservierungs-/Verfuegbarkeitslogik;
4. Benachrichtigungen und Erinnerungen;
5. Datenschutz, Datenexport und Kontoloeschung;
6. Audit-/Aktivitaetsverlauf;
7. Backup/Restore, Security und E2E-Release-Gates.

### Prioritaet B – Produktwert

Diese Funktionen machen LeihNest im Alltag wesentlich nuetzlicher:

8. Kategorien, Tags und bessere Inventarfilter;
9. Wartung, Schaeden und Teilmengen ausser Betrieb;
10. QR-Labels und Scan-Workflows;
11. Kalenderansichten und iCalendar-Export;
12. installierbare PWA.

---

## 4. Auth und Account

Verbindliche Details stehen in:

`docs/superpowers/specs/2026-09-19-auth-account-completion-design.md`

Umfang:

- E-Mail-Verifizierung;
- Resend;
- Passwort vergessen;
- Passwort-Reset;
- automatische Einladungsmails;
- Google Login;
- Apple Login;
- Passkeys;
- explizites Account Linking;
- Passwortaenderung;
- E-Mail-Aenderung;
- Sessionverwaltung;
- gesicherte Kontoloeschung;
- DE/EN;
- Mail-Infrastruktur;
- Auth-E2E.

Zusaetzlich als spaetere Security-Erweiterung:

- optionale TOTP-Zwei-Faktor-Authentifizierung;
- Recovery Codes;
- Sicherheitsereignisse im Audit-Verlauf.

TOTP ist nicht Voraussetzung, um die zuerst genannten Auth-Luecken zu schliessen; es wird nach Passkeys umgesetzt.

---

## 5. Mehrere Gruppen pro Nutzer

Die Datenbank erlaubt bereits mehrere Memberships. Die aktuelle UI verwendet jedoch `getPrimaryMembership()` und behandelt praktisch nur die erste Gruppe.

Das wird korrigiert.

### Ziel

Ein Benutzer kann gleichzeitig Mitglied mehrerer Gruppen sein.

UI:

- aktiver Gruppen-Kontext im Header / Workspace;
- Gruppenwechsler;
- zuletzt verwendete Gruppe wird gespeichert;
- `/app` oeffnet die aktive oder erste zugaengliche Gruppe;
- neue Gruppe anlegen;
- Einladung zu weiterer Gruppe annehmen, ohne die bestehende Gruppe zu verlieren.

### Routing

Die Domain-Services erhalten immer eine explizite `groupId`.

Der aktive Gruppen-Kontext darf nicht als Sicherheitsgrenze dienen. Jede serverseitige Aktion prueft weiterhin die Membership fuer die angegebene Gruppe.

---

## 6. Mitglieder- und Gruppen-Lifecycle

Heute koennen OWNER/ADMIN einladen, aber der komplette Lifecycle fehlt.

Ergaenzt werden:

- offene Einladung erneut senden;
- Einladung widerrufen;
- Rolle aendern;
- Mitglied entfernen;
- OWNER darf ADMIN/MEMBER verwalten;
- ADMIN darf MEMBER verwalten, aber keinen OWNER erzeugen/entfernen;
- Ownership sicher uebertragen;
- Gruppe verlassen;
- letzter OWNER darf Gruppe nicht einfach verlassen;
- Gruppe archivieren;
- Gruppe endgueltig loeschen mit expliziter Bestaetigung und Billing-Pruefung.

Genau ein OWNER pro Gruppe wird als Invariante behandelt.

---

## 7. Inventarstruktur

### Kategorien

Gegenstaende erhalten eine optionale Kategorie.

Initiale Systemkategorien:

- Werkzeug;
- Veranstaltung;
- Garten;
- Sport;
- Elektronik;
- Haushalt;
- Fahrzeuge/Zubehoer;
- Sonstiges.

Gruppen koennen eigene Kategorien anlegen.

### Tags

Freie gruppeninterne Tags ermoeglichen flexible Kennzeichnungen.

Beispiele:

- Outdoor;
- empfindlich;
- nur Erwachsene;
- Vereinsheim;
- Veranstaltung.

### Asset-/Inventarnummer

Jeder Gegenstand erhaelt optional:

- interne Inventarnummer;
- optionalen EAN/UPC/Barcode-Wert.

Eine automatisch erzeugte LeihNest-ID existiert unabhaengig davon fuer QR-Labels.

### Filter

Inventar kann gefiltert werden nach:

- Kategorie;
- Tags;
- Verfuegbarkeit;
- Wartungsstatus;
- Lagerort;
- Freitext.

---

## 8. Wartung, Zustand und Schaeden

LeihNest verwaltet gemeinsam genutzte reale Gegenstaende. Deshalb gehoert ein einfacher Wartungs-/Schadensprozess zum Produkt.

### Item Status

```
AVAILABLE
PARTIALLY_UNAVAILABLE
OUT_OF_SERVICE
RETIRED
```

`RETIRED` ersetzt langfristig die reine Bedeutung von `active=false`, ohne Historie zu loeschen.

### Teilmenge ausser Betrieb

Bei Mengenartikeln kann ein Teil der Gesamtmenge ausfallen.

Beispiel:

```
10 Bierzeltgarnituren
2 ausser Betrieb
=> maximal 8 reservierbar
```

Dafuer wird `unavailableQuantity` gepflegt.

Verfuegbarkeit:

```
effectiveQuantity = totalQuantity - unavailableQuantity
```

### MaintenanceEvent

Ein Wartungs-/Schadenseintrag enthaelt:

- Item;
- Typ: DAMAGE | MAINTENANCE | INSPECTION | REPAIR;
- Status OPEN | RESOLVED;
- Notiz;
- gemeldete Teilmenge;
- Ersteller;
- Zeitpunkte;
- optionale Bilder;
- optionale Loesungsnotiz.

### Rueckgabe

Bei Rueckgabe kann ein Manager:

- Rueckgabehinweis speichern;
- Schaden melden;
- Bilder anhaengen;
- betroffene Menge ausser Betrieb setzen.

Bestehende Reservierungs- und Medienhistorie bleibt erhalten.

---

## 9. Reservierungen und Verfuegbarkeit

Die bestehende Regel bleibt:

- PENDING verbraucht noch keine Menge;
- APPROVED und HANDED_OUT blockieren Menge;
- Zeitraeume ueberlappen bei `a.start < b.end && a.end > b.start`.

### Verbesserungen

- Verfuegbarkeit bereits vor Absenden anzeigen;
- bei Zeitraum-/Mengenwahl verbleibende Menge anzeigen;
- Wartungsmenge abziehen;
- OUT_OF_SERVICE/RETIRED nicht reservierbar;
- bestehende PENDING-Reservierung vom Nutzer editierbar;
- APPROVED darf vor Ausgabe vom Nutzer storniert werden wie bisher;
- Manager kann genehmigte Reservierung bei Bedarf zuruecknehmen/ablehnen, solange nicht ausgegeben;
- klarer Kalender fuer Tag/Woche/Monat;
- Reservierungen eines Gegenstands auf Item-Detailseite.

### Concurrency

Die aktuelle Freigabepruefung muss gegen echte parallele Genehmigungen abgesichert werden.

Genehmigung verwendet PostgreSQL-Transaktion mit ausreichender Serialisierung bzw. Item-bezogenem Lock, sodass zwei gleichzeitig genehmigte Anfragen niemals zusammen mehr als die effektive Menge belegen.

Ein automatischer Retry darf nur bei Serialisierungsfehlern erfolgen.

---

## 10. Kalender und iCalendar

LeihNest erhaelt eine echte Kalenderansicht.

Ansichten:

- Gruppe;
- meine Reservierungen;
- einzelner Gegenstand.

Darstellung:

- pending;
- approved;
- handed out;
- overdue;
- completed optional ausblendbar.

### iCalendar

Nutzer koennen eine einzelne Reservierung als `.ics` herunterladen.

Optional kann ein privater, widerrufbarer Kalender-Feed fuer die eigenen Reservierungen angelegt werden.

Der Feed verwendet einen zufaelligen Token und enthaelt keine privaten Daten anderer Mitglieder, die fuer den Kalenderzweck nicht erforderlich sind.

---

## 11. Benachrichtigungen

LeihNest erhaelt eine In-App-Benachrichtigungszentrale und E-Mail-Benachrichtigungen.

Ereignisse:

- Einladung;
- neue Reservierungsanfrage an OWNER/ADMIN;
- Reservierung genehmigt;
- Reservierung abgelehnt;
- Reservierung storniert;
- Ausgabe bestaetigt;
- Rueckgabe bestaetigt;
- bald faellig;
- ueberfaellig;
- Schaden/Wartung gemeldet;
- Mitglied hinzugefuegt/entfernt;
- Ownership uebertragen;
- sicherheitsrelevante Account-Ereignisse.

### Preferences

Nutzer koennen nichtkritische Kategorien pro Kanal ein-/ausschalten.

Sicherheitskritische Nachrichten bleiben aktiv, wenn sie fuer Account-Sicherheit erforderlich sind.

### Hintergrundverarbeitung

Nichtkritische App-E-Mails und Reminder laufen ueber eine PostgreSQL-basierte Job-Queue mit separatem Worker.

Empfehlung:

- `pg-boss`;
- kein Redis erforderlich;
- derselbe PostgreSQL-Server;
- eigene Worker-Containerinstanz in Compose.

Auth-Verifizierung/Passwort-Reset kann weiterhin unmittelbar ueber den Better-Auth-Mailhook angestossen werden.

---

## 12. QR-Labels und Scan

Jeder aktive Gegenstand besitzt einen stabilen, nicht sequenziellen QR-Token.

Label:

- LeihNest;
- Gegenstandsname;
- optionale Inventarnummer;
- QR-Code;
- kurze menschenlesbare ID.

Scan-Ziel:

```
https://leihnest.de/i/<qrToken>
```

Nicht angemeldete Nutzer werden zum Login und danach sicher zum Ziel zurueckgefuehrt.

Nach Anmeldung:

### MEMBER

- Gegenstand sehen;
- Verfuegbarkeit sehen;
- Reservierung anfragen.

### ADMIN / OWNER

zusaetzlich:

- Ausgabe bestaetigen;
- Rueckgabe bestaetigen;
- Wartung/Schaden melden;
- Gegenstand bearbeiten.

Druckansicht fuer einzelne Labels und Mehrfachbogen.

---

## 13. Aktivitaets- und Audit-Verlauf

Relevante Gruppenaktionen werden append-only historisiert.

Beispiele:

- Gegenstand erstellt/geaendert/archiviert;
- Menge geaendert;
- Wartungsstatus;
- Reservierung erstellt/genehmigt/abgelehnt/storniert;
- Ausgabe/Rueckgabe;
- Schaden;
- Mitglied eingeladen/beigetreten/entfernt;
- Rolle geaendert;
- Ownership uebertragen;
- Gruppenname geaendert;
- Plus-Status geaendert;
- relevante Sicherheitsevents.

AuditEvent:

```
id
groupId?
actorUserId?
type
resourceType
resourceId?
safeMetadata
createdAt
```

Keine Passwoerter, Tokens, Stripe-Secrets oder Dokumentinhalte im Audit.

OWNER/ADMIN sehen den Gruppenverlauf.

Persoenliche Auth-Sicherheitsereignisse sieht nur der betroffene Nutzer.

---

## 14. Datenexport, Datenschutz und Loeschung

### Persoenlicher Export

Nutzer koennen einen maschinenlesbaren Export ihrer personenbezogenen LeihNest-Daten anfordern.

Enthalten:

- Profil;
- Gruppenmitgliedschaften;
- eigene Reservierungen;
- eigene Einladungs-/Aktivitaetsreferenzen;
- relevante Account-Metadaten.

Nicht enthalten:

- Passwort-Hashes;
- Session-Tokens;
- OAuth-Tokens;
- Daten anderer Nutzer ausser soweit fuer eigene Reservierungsdatensaetze erforderlich.

### Gruppe

OWNER kann:

- kompletten Gruppenbestand exportieren;
- Reservierungen exportieren;
- Mitgliederliste exportieren;
- Aktivitaetsverlauf exportieren.

Bestehende Plus-CSV-Regeln bleiben erhalten; DSGVO-Personenexport ist kein Premium-Feature.

### Kontoloeschung

Vor Loeschung:

- wenn Nutzer OWNER einer Gruppe ist, muss Ownership uebertragen oder Gruppe geloescht werden;
- aktive Stripe-Verantwortung darf nicht verwaisen;
- personenbezogene Daten werden gemaess Produktpflichten geloescht/anonymisiert;
- fachlich notwendige Historien koennen pseudonymisiert erhalten bleiben.

Datenschutzseite wird fuer SMTP, Google, Apple, Passkeys und neue Reminder angepasst.

---

## 15. PWA

LeihNest wird installierbar.

Umfang:

- Web App Manifest;
- App-Icons;
- Theme/Background;
- `display: standalone`;
- korrekte Start-URL;
- Service Worker fuer App-Shell und statische Assets.

Keine Offline-Mutationen in dieser Stufe.

Bei fehlendem Netz:

- App-Shell kann laden;
- klarer Offline-Hinweis;
- keine Reservierung/Statusaenderung wird lokal vorgetaescht.

QR-Scan und Kamera bleiben Browser-/Geraeteabhaengig.

---

## 16. Security Hardening

Zusaetzlich zu Better Auth:

- strenge Security Headers;
- Content-Security-Policy passend zu Stripe/Google/Apple;
- `frame-ancestors`/Clickjacking-Schutz;
- `nosniff`;
- Referrer Policy;
- Permissions Policy;
- CSRF-/Origin-Pruefung fuer eigene mutierende API-Routen;
- Rate Limits fuer Auth, Einladungen, Upload, Billing, QR-sensitive Aktionen;
- keine Stacktraces/Secrets im Client;
- Request-ID in Serverlogs;
- strukturierte Logs;
- sensible Werte redigieren.

Optional nach Passkeys:

- Better-Auth-TOTP-2FA;
- Recovery Codes;
- 2FA-Verwaltung im Security-Bereich.

---

## 17. Backup und Restore

Die bestehenden persistenten Datenquellen sind mindestens:

- PostgreSQL;
- `leihnest-uploads`.

Beide muessen zusammen gesichert werden.

Erforderlich:

- automatisierbares `pg_dump`;
- Upload-Archiv/Backup;
- SHA-256 Manifest;
- dokumentierter Restore;
- Restore in isolierter Testumgebung;
- Pruefung, dass jeder DB-`MediaAsset.storageKey` im wiederhergestellten Storage existiert.

Ein Backup gilt erst als verifiziert, wenn ein Restore-Test erfolgreich war.

---

## 18. Observability

Mindestens:

- Healthcheck prueft App und Datenbank;
- Worker-Health/Heartbeat;
- strukturierte Logs;
- Request ID;
- Mail-/Jobfehler nachvollziehbar;
- keine sensiblen Inhalte in Logs;
- Stripe-Webhook-Fehler retrybar;
- Queue-Jobs mit Status/Versuchen/letztem Fehler.

Kein externer Analytics- oder Trackingdienst erforderlich.

---

## 19. Tests und Release

### Unit/Domain

- Rollen;
- Gruppenwechsel;
- Einladung;
- Wartungsmengen;
- Verfuegbarkeit;
- Concurrency;
- Audit;
- Notifications;
- QR;
- Datenschutz-/Loeschregeln;
- Auth.

### Integration

- PostgreSQL;
- Better Auth;
- Mail Adapter;
- Queue/Worker;
- Stripe;
- Media;
- Backup/Restore.

### Browser/E2E

Playwright wird fuer kritische Flows eingefuehrt:

- Registrierung + Verification;
- Passwort Reset;
- Google/Apple mit Mock/Testprovider-Konfiguration;
- Passkey mit Browserunterstuetzung/Mock;
- Gruppe erstellen;
- zweite Gruppe beitreten;
- Gruppe wechseln;
- Einladung;
- Item;
- Reservierung;
- parallele Konfliktlage serverseitig;
- Freigabe/Ausgabe/Rueckgabe;
- Schaden/Wartung;
- QR;
- Notification Center;
- Session-Widerruf;
- Plus smoke.

### Release Gate

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
cmp compose.portainer.yaml docker-compose.portainer.yml
docker compose -f compose.portainer.yaml config
docker build -t leihnest:release .
```

plus Playwright, Backup/Restore-Test und Produktions-Smoke.

---

## 20. Deployment-Regel

Der integrierte Quellstand liegt auf `main`.

Die bestehende Production-Portainer-Konfiguration konsumiert laut aktuellem Repository-README den Branch:

`portainer-preview`

mit:

`compose.portainer.yaml`

Diese Produktionsschnittstelle wird nicht ungeprueft auf `main` umgestellt.

Release-Ablauf:

1. Feature-Branch;
2. CI/Test/Review;
3. Merge nach `main`;
4. verifizierten Release-SHA bestimmen;
5. bestehenden `portainer-preview`-Stand sichern;
6. `portainer-preview` auf den verifizierten SHA aktualisieren;
7. Portainer Redeploy;
8. Migration;
9. Healthcheck;
10. Live-Smoke;
11. erst danach Release als abgeschlossen markieren.

---

## 21. Implementierungsreihenfolge

1. Auth & Account Completion;
2. Multi-Group + Member Lifecycle;
3. Inventory Categories + Maintenance/Damage;
4. Reservation Integrity + Calendar;
5. Notifications + Reminder Worker;
6. QR Labels + Scan Workflows;
7. Audit + Activity History;
8. Privacy + Data Export + Deletion;
9. PWA + Calendar Integration;
10. Security/Operations/Backup/Restore/Release Hardening.

Diese Reihenfolge behebt zuerst reale Sicherheits-/Datenintegritaetsluecken und baut danach Komfortfunktionen darauf auf.
