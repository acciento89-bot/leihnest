# Auslieferungsstand: LeihNest-Mitgliederbereich

Stand: 18. September 2026

## Wichtig: lokal umgesetzt, noch nicht auf GitHub oder live
Der GitHub-Schreibaufruf fuer die Implementierung wurde vom Tool blockiert.
Es wurde danach kein alternativer Upload versucht. Kein Merge und kein
Deployment dieses neuen Mitgliederbereichs wurde ausgefuehrt.

Die ZIP enthaelt den vollstaendigen neuen Quellcode. Der beigefuegte Patch
bezieht sich exakt auf den folgenden unveraenderten main-Stand:

    e31e33644d1b1dd5a7e0edc81842a16a282fb534

Der entfernte Branch feat/member-experience-20260918 steht noch auf:

    1ff22158ee79a5d6c9eb212bee0e8b26958d5bd8

Dieser entfernte Zwischenstand enthaelt nur die initialen Regressionstests
und einen temporaeren CI-Arbeitsbereichsexport, NICHT die neue Implementierung.
Diesen Zwischenstand daher nicht als fertigen Mitgliederbereich mergen.
Die lokale Endfassung entfernt den temporaeren Export wieder und ergaenzt
stattdessen einen isolierten PostgreSQL-Dienst fuer Integrationstests.

## Bewahrte Projektgrenzen
Impressum, Datenschutz, oeffentliche Seiten, bestehende Datenmodelle,
Datenbankmigrationen, Compose-Dateien und Volumes bleiben unveraendert.
Keine Produktivdaten wurden geloescht, migriert oder zurueckgesetzt.
Portainer nutzt weiterhin portainer-preview und compose.portainer.yaml.

## Lokal geprueft
- 78 Tests in 25 Dateien erfolgreich, einschliesslich 5 persistierter
  Integrationstests gegen eine isolierte PostgreSQL-kompatible PGlite-Instanz.
- ESLint ohne Fehler oder Warnungen.
- Prisma-Generierung und TypeScript-Pruefung erfolgreich.
- Next.js-Produktionsbuild erfolgreich.
- Fuenf Ansichten je in Desktop- und Smartphone-Breite offline aus dem
  echten Komponenten-Markup gerendert; kein horizontaler Ueberlauf.
- Patch-Anwendung gegen den exakten main-Quellbaum verifiziert.

Die Integrationstests verwenden ausschliesslich LEIHNEST_TEST_DATABASE_URL
und ein temporaeres Schema. Ohne diese explizite Test-URL werden diese
fuenf Tests uebersprungen. Keine Produktions-URL dafuer verwenden.

## Grenzen der Pruefung
Keine angemeldete Live-Browser-Abnahme und keine Produktionspruefung.
Die Ansichtsaufnahmen verwenden Testdaten und sind statische Offline-Renderings,
nicht Screenshots eines bereits ausgerollten Systems. Die neue CI wurde
auf GitHub noch nicht ausgefuehrt. Eine unabhaengige Code-Review durch eine
zweite Person oder einen zweiten Agenten fand nicht statt.

## Noch offen
Uebernahme dieses Quellstands in GitHub, Ausfuehrung der dortigen CI,
Pruefung vor dem Merge und anschliessendes Portainer-Deployment mit
angemeldeter Live-Abnahme. Vorherige Secrets, Container und Volumes erhalten.

Diese Ablage bewahrt Code und Projektentscheidungen auch bei einem Chatwechsel.
