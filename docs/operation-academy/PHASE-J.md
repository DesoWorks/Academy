# Phase J – erstes Modul und Academy-Repository

**Stand:** 2026-11-21  
**Workspace:** `D:\Desoworks\Workspace\Academy`  
**Branch:** `feature/phase-j-it-module`  
**Ausgangscommit auf `main`:** `2e704e316d1cfad58f7335424ff0078012f41f10`

## GitHub

Connector-Identität über `get_me`: Login `DesoWorks`, ID `340276136`, Typ **User**, nicht Organisation. Die Browser-Anmeldung wurde nicht als Identitätsnachweis verwendet.

`search_repositories` für `org:DesoWorks Academy` lieferte 0 Treffer. Unter `user:DesoWorks` lagen GalaxynetOS, Verwaltung-Ausbildung, starnet-test, IT-Ausbildung und Discord-Bot. Academy fehlte. Der verbundene Account hat auf diesen Repos `admin`.

`create_repository` mit `organization: DesoWorks` scheiterte exakt mit:

`POST https://api.github.com/orgs/DesoWorks/repos: 404 Not Found`

Das ist kein Berechtigungsloch einer fremden Organisation. `DesoWorks` ist das Benutzerkonto, unter dem die bestehenden Repos liegen. Ein zweiter Aufruf ohne `organization` hat das Ziel `https://github.com/DesoWorks/Academy` privat und ohne README angelegt. ID `1466955090`. Kein persönliches Ersatzkonto.

`git push -u origin main` übertrug die 7 lokalen Commits. Remote-HEAD ist `2e704e316d1cfad58f7335424ff0078012f41f10`. Historie von `4d7f205` bis `2e704e3` ist auf GitHub sichtbar. Kein Push nach `DesoWorks/IT-Ausbildung`.

Feature-Branch `feature/phase-j-it-module` steht auf dem veröffentlichten Core und trackt `origin/feature/phase-j-it-module`.

## Modul

ID: `desoworks.it-systemintegration`  
Version: `1.0.0`  
Herausgeber: DesoWorks (`publisher.desoworks`)  
Laufzeit: `hosted-web`, Einstieg `index.html`  
Paket: `modules/it-systemintegration`  
Katalog: `catalog/official.json`, lokal, nicht verbunden

Installation kopiert nur deklarierte Dateien plus den geprüften `web/`-Index. Pfadflucht, falsche Prüfsumme und fremder Herausgeber werden vor dem Kopieren abgewiesen. Die reservierte ID `dev.desoworks.it-ausbildung` bleibt gesperrt.

Geöffnet wird das Modul nur durch den Nutzer. Die Startseite bleibt „Willkommen bei DesoWorks Academy.“ Ein zuletzt geöffneter Bereich ist ein Link, kein Autostart.

## Fenster

CDP gegen die laufende Anwendung, Datenverzeichnis nur für die Prüfung:

- Startseite: Begrüßung sichtbar, IT-Themenübersicht nicht als Anwendung. Installiertes Modul als Karte.
- Lernbereiche: Name, Beschreibung, Herausgeber, Version, Status, Größe 13.522.720 Bytes.
- Öffnen zeigt im Rahmen die echte Seite „IT-Ausbildung / Themenübersicht“.
- Katalog listet das Modul mit „Erneut installieren“ und das Beispielmodul.

Bilder: `docs/operation-academy/fenster-start-j.png`, `fenster-katalog.png`, `fenster-modul.png`.

Der Katalogdialog wurde in diesem Lauf nicht durchgeklickt. Die Installation selbst ist über `installFromDirectory` auf dem gebündelten Paket geprüft, inklusive Öffnen und Dateiintegrität.

## Tests

`npm test`: 56 bestanden, 0 fehlgeschlagen. Darunter die bisherigen Modul-, Update- und F11-Tests plus `tests/hosted-module.test.js`.

## Grenzen

- Eine GitHub-Organisation `DesoWorks` existiert für diesen Connector nicht. Das Repo liegt auf dem Benutzerkonto `DesoWorks`.
- `main` auf GitHub ist der Core-Stand `2e704e3`. Die Moduländerung liegt auf dem Feature-Branch, nicht als Release und nicht als Merge.
- Alte Desktop-Lernstände werden nicht automatisch importiert.
- Die Textvorschau des Cores kürzt Aufgabenblöcke auf 40. Die Lernumgebung selbst enthält 102 HTML-Seiten und 248 Dateien.
- Hosted-Web ist unsigniert und privat. Es bekommt kein Node und keine Core-Schnittstelle. Ein fremder Herausgeber kann diese Laufzeit nicht verlangen.
- Unabhängige Berichte von GLaDOS, RoboCop und Terminus folgen als eigene Dateien, sobald sie den implementierten Stand geprüft haben.

## Phase K

Signierte Modulupdates getrennt vom Core, Import der alten `it-ausbildung.*`-Stände nur aus einer bestätigten Exportdatei, und ein Installer-Lauf, der das gebündelte Modul über den Katalogdialog zeigt.
