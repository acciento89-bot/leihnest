# LeihNest 0.2.0: Start und aktueller Stand

Dieses Paket enthaelt die echte Anwendung einschliesslich Oberflaeche, Datenbank,
Tests, Docker-Konfiguration und Betriebsanleitung. Es ist kein klickbares Bild
und keine reine Landingpage.

## Eigenstaendiges Design

Warme Papierflaechen, Waldgruen, redaktionelle Serifenschrift und ein eigenes
Nest-Zeichen. Die Seitenleiste ist durch eine obere Navigation ersetzt. Startseite,
Gruppenbereich und mobile Ansichten folgen derselben eigenen Gestaltung.
Kategorie-Illustrationen sind als fehlendes Foto gekennzeichnet; hochgeladene
Bestandsfotos bleiben echte private Gruppenfotos.

## Was bereits funktioniert

Gruppen anlegen, Mitglieder einladen, Gegenstaende mit Fotos und Stueckzahlen
verwalten, reservieren, freigeben, ausgeben und vollstaendig oder teilweise
zuruecknehmen. Deutsch/Englisch, Desktop/Mobil, Kalender und Bestands-Export
sind enthalten. Daten werden gespeichert; fremde Gruppen erhalten keinen Zugriff.

## Schnell lokal testen

Python 3.13 installieren, das ZIP entpacken und ein Terminal im Ordner mit
README.md oeffnen. Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:ALLOW_SIGNUP="1"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Anschliessend `http://localhost:8000` im Browser oeffnen, Konto erstellen und
Gruppe anlegen. Es gibt absichtlich kein fest eingebautes Passwort und keine
vorgetaeuschten Bestandsdaten. Die Linux-/Docker-Anleitung steht in README.md.

## Was noch nicht live ist

Der Entwicklungsstand gehoert zum Repository `acciento89-bot/leihnest`,
Branch `design/leihnest-eigenstaendig`. Ein Quellcode-Upload oder eine Pull Request
sind keine Veroeffentlichung auf der Domain. Den verbindlichen CI-Status zeigen
die GitHub-Actions-Laeufe am jeweiligen Commit.

`leihnest.de` wurde nicht veraendert. Der Betrieb auf deinem Server benoetigt
noch HTTPS/Proxy, persistentes Datenverzeichnis und eine sichere Konfiguration.
E-Mail-Versand ist vorbereitet, aber nicht mit einem echten Postfach verbunden.
Ein kostenpflichtiges Abo oder Zahlungsanbieter ist nicht integriert.

Vor einer oeffentlichen Freigabe muessen die echten Betreiber-Rechtstexte,
Datenschutz-/Loeschprozesse, Mailzustellung, Backups und die Produktionsinstallation
geprueft sein. Fuer geschlossene Tests bleibt die Registrierung standardmaessig
abgeschaltet; lokal oben wird sie ausdruecklich aktiviert.

## Pruefstand

68 automatische Tests bestanden, darunter acht neue Design-Regressionstests. 30 Desktop-/Mobil-/Sprachkombinationen wurden
im Browser mit echtem Anwendungs-HTML gerendert und auf seitlichen Ueberlauf
geprueft. Der vollstaendige Ausleihablauf wurde ueber die HTTP-Schnittstellen
getestet. Echter Browser-Netzwerkablauf und Docker-Build sind als GitHub-Pruefung
vorbereitet, aber hier noch nicht erfolgreich ausgefuehrt. Details und Grenzen
stehen in `docs/verification.md`.
