# GitHub-Veröffentlichungspipelines – N.1

**Stand:** 22. November 2026  
**Geprüfter Arbeitsstand:** Branch `feature/phase-n1-release-connectivity`, HEAD `e558c14e65d546b77a5305346bf5957c2424bb2c`  
**Status:** Beschreibt lokale Workflowdateien; kein Nachweis eines GitHub-Laufs.

## DEV: `.github/workflows/academy-dev.yml`

Reagiert auf Pushes nach `dev`. Führt auf Windows `npm ci` und `npm test` aus, baut danach einen Windows-NSIS-Installer und Release-Metadaten. Die Version erhält `-dev.<GITHUB_RUN_NUMBER>` und das Tagformat `dev/v…`. Das Release wird zunächst als Entwurf angelegt, auf `manifest.json` und `manifest.json.sig` geprüft und anschließend sichtbar gemacht. Der Aufruf des Manifest-Skripts setzt `signature=unsigned`; eine Manifest-Signatur ist durch diese Definition nicht belegt.

## BETA: `.github/workflows/academy-beta.yml`

Manueller Start über `workflow_dispatch`; der Lauf muss vom Branch `beta` kommen. Nach Windows-Tests und Installerbau entsteht ein Tag `beta/v<Version>-beta.<GITHUB_RUN_NUMBER>`. Die Veröffentlichung erfolgt zunächst als Entwurf mit Prerelease-Kennzeichnung. Auch dieser Workflow ruft das Manifest-Skript mit `signature=unsigned` auf.

## STABLE: `.github/workflows/academy-stable.yml`

Manueller Start mit der Eingabe `FREIGEGEBEN` und einem Freigabeverweis; der Branch muss `main` sein. Vor dem Build prüft der Workflow erforderliche Zertifikats- und Manifest-Schlüssel-Secrets. Nach Tests baut er den signierten Windows-Installer, prüft Authenticode-Status und Herausgeber-Fingerabdruck und erzeugt anschließend das Stable-Manifest. Das Release wird als Entwurf angelegt und nach Asset-Prüfung ohne Prerelease-Markierung veröffentlicht.

Voraussetzung ist das GitHub-Environment `stable-release` mit Pflichtprüfern. Die lokale YAML beweist nicht, dass dieses Environment oder die benötigten Secrets im Repository eingerichtet sind. Die gelesene Stable-Datei übergibt `signature=signed` an `scripts/make-release-manifest.js`; dass dieser Signaturweg korrekt konfiguriert und tatsächlich gelaufen ist, ist nicht belegt.

## Gemeinsame Merkmale und tatsächlicher Laufstatus

Alle drei Workflowdateien verwenden `actions/checkout@v4`, `actions/setup-node@v4` mit Node 24, `npm ci` und `npm test`. Veröffentlichungsjobs erhalten `contents: write`; Build-/Testjobs sind auf `contents: read` beschränkt. Die Veröffentlichung prüft, dass das Tag noch nicht existiert, und legt zunächst einen Entwurf an.

**Diese Workflows wurden lokal gelesen, aber noch nicht auf GitHub ausgeführt.** Aus den YAML-Dateien folgt weder ein erfolgreicher Lauf noch ein veröffentlichtes Release. HEAD ist laut Git-Prüfung `e558c14e65d546b77a5305346bf5957c2424bb2c` auf `feature/phase-n1-release-connectivity`. Die Workflowdateien waren im geprüften Projektstand nicht als auf `origin` veröffentlichte Änderungen belegt.

## Lücken zum Auftrag – offen

- **Offen – gelaufene Actions:** Kein erfolgreicher GitHub-Actions-Lauf als Nachweis vorhanden.
- **Offen – öffentlicher Abruf ohne Token:** Der zuletzt gelesene `src/updates/github-feed.js` macht das Token optional und lädt Assets ohne Token. Ein realer öffentlicher Abruf bis zum Kandidaten-Update ist hier nicht ausgeführt und bleibt als Funktionstest offen.
- **Offen – Manifestsignatur:** Der zuletzt gelesene `src/updates/github-feed.js` lädt Manifest und Signatur und prüft über `verifyManifest()` aus `src/updates/manifest-sign.js`; DEV/BETA-Workflowdefinitionen setzen jedoch `signature=unsigned`. Damit ist eine veröffentlichbare, erfolgreich verifizierte Signaturkette für alle drei Kanäle nicht nachgewiesen.
- **Offen – Windows-A/B:** Workflowdefinitionen und Installerbau belegen keinen reproduzierbaren Updateversuch zwischen zwei installierten Windows-Versionen.

## Gelesene Dateien

`.github/workflows/academy-dev.yml` (DEV-Build/-Veröffentlichung), `.github/workflows/academy-beta.yml` (BETA-Build/-Veröffentlichung), `.github/workflows/academy-stable.yml` (STABLE-Build/-Veröffentlichung), `src/updates/github-feed.js` (öffentlicher Abruf und Signaturprüfung) und `src/updates/service.js` (Updateprüfung und Kandidatenverwendung).
