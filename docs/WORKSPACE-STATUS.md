# LeihNest: Mitgliederbereich, 18. September 2026

## Verbindlicher Umfang
Der angemeldete Bereich wird fertiggestellt: keine erneute Bearbeitung von Impressum, Datenschutz oder oeffentlicher Startseite. Bestehende Daten und Reservierungen bleiben erhalten. Keine Datenbankmigration, kein Zuruecksetzen und kein Austausch der Portainer-Konfiguration.

## Umsetzung
- Eigenstaendige responsive Oberflaeche im vorhandenen hellgruennen Design; Desktop-Seitenleiste und vollstaendige mobile Navigation.
- Uebersicht mit echten Kennzahlen, naechsten Ausleihen und direkten Aktionen; gefuehrter Einstieg ohne Gruppe.
- Suchbare Gegenstaende, lesbare Karten, Bearbeitung nur bei Bedarf und bestaetigtes Archivieren.
- Reservierungsanfragen, Freigabe, Ausgabe und Rueckgabe; persoenliche und gruppenweite Filter, paginierter Verlauf und Rueckgabehinweise.
- Mitgliederrollen in Alltagssprache, vollstaendige kopierbare Einladungslinks und offene Einladungen.
- Speicherbares Profil, berechtigungsgepruefter Gruppenname und persistente DE/EN-Sprachwahl.
- Formulare behalten Eingaben bei Fehlern; Serveraktionen liefern sichere lokalisierte Ergebnisse statt Fehler-Weiterleitungen.

## Pruefung
Die Tests decken Oberflaechen, Rollen, Sprachwahl, Filter und Serveraktionen ab. Die Integrationssuite verwendet ausschliesslich LEIHNEST_TEST_DATABASE_URL und ein je Lauf neu erzeugtes Schema; sie liest niemals die Produktions-DATABASE_URL. CI stellt dafuer einen kurzlebigen PostgreSQL-Dienst bereit. Der vollstaendige Ausleihablauf und der Erhalt des Verlaufs nach Archivierung sind abgedeckt.

Die Desktop- und Mobilansichten wurden aus dem tatsaechlichen Komponenten-Markup offline gerendert. Das ist keine angemeldete Live-Browser-Abnahme der Produktionsseite.

## Auslieferung
Arbeitsbranch: feat/member-experience-20260918. Portainer verwendet weiterhin portainer-preview und compose.portainer.yaml. Einen Live-Status nur nach Nachweis des aktualisierten Deployments melden. Vorhandene Secrets, Volumes und Compose-Konfiguration nicht ersetzen.

## Aktueller Uebertragungsstatus
Der Implementierungs-Upload wurde vom Tool blockiert. Die fertigen lokalen Aenderungen befinden sich noch nicht im entfernten Arbeitsbranch. Details, exakter Basis-Commit und Pruefgrenzen stehen in DELIVERY-STATUS.md.
