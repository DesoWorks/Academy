# GitHub-Release- und Updateweg – N.1, Welle 2

**Stand:** 22. November 2026  
**Arbeitsstand laut Lead:** Branch `feature/phase-n1-release-connectivity`, Commit `e558c14e65d546b77a5305346bf5957c2424bb2c`. Arbeitsbaum ändert sich parallel; kein Commit und kein Push. Dieser Bericht beschreibt gelesene lokale Workflowdateien und den aktuellen Updatecode, nicht einen erfolgten Release.

## Geprüfter lokaler Workflow

Die drei lokalen Actions-Definitionen sind `.github/workflows/academy-dev.yml`, `academy-beta.yml` und `academy-stable.yml`.

- **DEV:** Workflow bei Push auf `dev`; Windows-Test- und Build-Schritte erzeugen einen DEV-Versionstag und ein Release als Entwurf, prüfen Assets und sollen es anschließend veröffentlichen.
- **BETA:** manueller Workflow, auf Branch `beta` begrenzt; erzeugt BETA-Prerelease-Tag und prüft Assets vor Veröffentlichung.
- **STABLE:** manueller Workflow auf `main`, mit Freigabeeingabe; prüft Build/Installer und Assets. Die lokale Datei setzt eine Stable-Umgebung mit vorgeschriebenen Prüfern voraus.

Diese Beschreibungen beziehen sich auf die lokalen YAML-Dateien. Sie beweisen weder, dass GitHub die Workflows erhalten hat, noch dass deren Einstellungen, Secrets oder Environments auf GitHub eingerichtet sind.

## Lokaler Update-Client

`src/updates/github-feed.js` verwendet die fest eingetragene öffentliche GitHub-API-Adresse `https://api.github.com/repos/DesoWorks/Academy/releases`. Ein Token ist optional für die API-Releaseliste; die Manifest- und Release-Asset-Downloads sind tokenlos. Der Client lädt `manifest.json` und `manifest.json.sig` nur von exakt passenden Release-Download-URLs. `src/updates/manifest-sign.js` prüft die Signatur über die exakten Manifestbytes mittels Ed25519 und dem öffentlichen Schlüssel im Projekt. Ohne verifizierte Signatur wird das Manifest nicht als Kandidat verwendet.

Die Releaseauswahl verlangt zusammenpassenden Tag, Kanal, Manifestprodukt, Manifestversion, Paketart und Plattform. Für das Core-Paket wird ein einzelnes `.exe`-Asset und ein SHA-256-Wert aus dem verifizierten Manifest verlangt. Der Installer wird erst nach erfolgreichem Download-Hashvergleich und zusätzlicher Installationsprüfung gestartet. Die Kanalauswahl stammt aus der gespeicherten Einstellung; sie installiert nicht selbst.

Die sichtbaren Installationsaktionen und Bestätigungen finden sich in `src/renderer/verwaltung.html` und `verwaltung.js`; die Kanalwahl liegt in den Einstellungen (`settings.html`/`settings.js`).

## Lauf- und Releasebeleg: offene Punkte

- **Offen – Actions:** Kein GitHub-Actions-Lauf wurde für diesen Arbeitsstand nachgewiesen. Die Workflows wurden lokal gelesen; nicht gelaufene Läufe sind kein Testergebnis.
- **Offen – GitHub-Releases:** Laut Lead enthält das öffentliche Repository keine Releases. Es ist kein Release-Tag, Manifest, Signatur oder Installer-Asset für einen echten Updateabruf belegt.
- **Offen – Push:** Kein Commit und kein Push dieses Arbeitsstands. Die lokalen Workflowdefinitionen sind daher nicht als auf GitHub verfügbar bestätigt.
- **Offen – Windows-A/B:** Es gibt keinen erfolgreichen Nachweis einer installierten Version A, die Version B über GitHub erkennt, lädt, prüft und installiert. Das vorhandene Protokoll `WINDOWS-ENV-N1.md` hält fest, dass installierte `0.3.1-dev.2` den GitHub-Client nicht enthält und kein gültiger A/B-Ausgangspunkt ist.
- **Offen – funktionsfähige Signaturkette:** Der Clientcode enthält Ed25519-Prüfung, doch es gibt keinen echten signierten GitHub-Releaseabruf, mit dem Schlüssel, Signatur und Manifest in der veröffentlichten Kette belegt wären.
- **Offen – Workflow-Signierung:** Das vorhandene lokale Pipeline-Protokoll `GITHUB-PIPELINE-N1.md` dokumentiert für DEV und BETA `signature=unsigned`; es bewertet auch den realen Stable-Signaturweg als nicht nachgewiesen. Das steht im Gegensatz zur Clientanforderung, nur signierte Manifeste zu akzeptieren. Solange dies nicht am tatsächlichen Workflow-/Releaseweg korrigiert und verifiziert ist, ist kein funktionierender Updateweg belegt.
- **Offen – Actions-/GitHub-Konfiguration:** Einrichtung der GitHub-Environments, Secrets, Schutzregeln und erforderlichen Freigaben ist durch lokale Dateien nicht belegt.

## Verwendete Quellen

Selbst gelesen: `.github/workflows/academy-dev.yml`, `.github/workflows/academy-beta.yml`, `.github/workflows/academy-stable.yml`, `src/updates/github-feed.js`, `src/updates/manifest-sign.js`, `src/updates/channels.js`, `src/updates/service.js`, `src/updates/channel-preference.js`, `src/renderer/settings.html`, `src/renderer/settings.js`, `src/renderer/verwaltung.html`, `src/renderer/verwaltung.js`, `src/main.js`. Vorhandene lokale Nachweise: `docs/operation-academy/GITHUB-PIPELINE-N1.md` und `docs/operation-academy/WINDOWS-ENV-N1.md`.