# Sicherheitsbericht N.1 – Öffentlicher Stand und Updateweg

**Projekt:** DesoWorks Academy (`DesoWorks/Academy`)
**Prüfer:** RoboCop, Security Officer
**Datum:** 2026-11-22
**Gesamtstatus:** TEILWEISE. Kein bestätigtes Secret gefunden. Die Repository-Historie ist aber NICHT freigegeben (siehe Grenzen). Nachprüfung der Korrektur: OFFEN.

## 0. Prüfgegenstand und Stand

- Öffentlich: `https://github.com/DesoWorks/Academy`, Branches `main` (7 Commits) und `feature/phase-j-it-module` (9 Commits), gelesen am 2026-11-22 über die öffentlichen Webseiten.
- Lokal: Arbeitsbaum `D:\Desoworks\Workspace\Academy`. Rick nennt Branch `feature/phase-n1-release-connectivity`, HEAD `e558c14`. **Das habe ich nicht selbst verifiziert:** `.git` ist für mich gesperrt, ich habe keine Shell. Der lokale Stand ist nicht auf origin.
- **Der Arbeitsbaum war nicht eingefroren.** Jarvis hat während meiner Prüfung geändert. `github-feed.js` und `service.js` waren zwischen meinem ersten und zweiten Lesen verschieden. `manifest-sign.js`, `update-public-key.pem` und `tests/phase-n1-manifest-signature.test.js` tauchten erst während des Laufs auf. Alle Aussagen zum Code gelten für den jeweils genannten Lesezeitpunkt, nicht für einen Commit.

## 1. Öffentlich erreichbarer Stand

| Nr. | Befund | Stufe | Status |
| --- | --- | --- | --- |
| P-1 | Auf den gelesenen Verzeichnislisten und in `.gitignore` sind keine Zugangsdaten, Schlüssel, Datenbanken oder `_secure/` sichtbar. `.gitignore` schließt `.env*` und `_secure/` aus. Der lokale Ordner `_secure` existiert, liegt aber nicht auf origin. | INFORMATIV | bestätigt, begrenzt |
| P-2 | Alle gescannten Commits tragen als Autor eine E-Mail-Adresse einer privaten Domain. Das ist personenbezogen und in der Historie dauerhaft öffentlich. Entfernen geht nur durch Umschreiben der Historie. Das ist eine Entscheidung des Commanders. Für künftige Commits eine GitHub-noreply-Adresse nutzen. | NIEDRIG | bestätigt |
| P-3 | Interne Dokumente sind öffentlich: `docs/operation-academy/*`. Bestätigt gelesen: `GIT-REPO-ABSCHLUSS.md` (lokale Pfade, Commit-IDs, Aufbau der Workspaces), `REPO-NAMEN.md` (Namen privater Repositories), `MIGRATION-IT.md`. Es steht kein Secret darin, aber Struktur und Pfade helfen Angreifern bei der Aufklärung. Commander entscheidet, ob diese Dateien öffentlich bleiben. | NIEDRIG | bestätigt |
| P-4 | `SECURITY-PHASE-I.md`, `QA-PHASE-I.md`, `PHASE-I.md` sind öffentlich, kamen aber nur gekürzt zurück. Ob dort ungepatchte Schwächen beschrieben sind, ist **unbekannt**. | OFFEN | nicht geprüft |
| P-5 | `.github/workflows/*` liegen nicht auf origin (Verzeichnisliste `main`). Es gibt keine Releases. Die Workflows sind noch nie öffentlich gelaufen. | INFORMATIV | bestätigt |

**Secret-Befund:** keiner bestätigt. Das ist **keine Freigabe der Historie**, weil der Scan unvollständig ist (siehe Grenzen). Falls später ein echtes Secret auftaucht, gilt: blockiert, Widerruf und Ersatz, nie nur Entfernen aus dem Arbeitsbaum.

## 2. Updateweg (Arbeitsbaum, Lesestand siehe Spalte)

| Nr. | Thema | Befund | Stufe | Korrektur gelesen? |
| --- | --- | --- | --- | --- |
| C-1 | Token-Pflicht | Erster Lesestand: `checkGithub` brach ohne Token mit `blocked` ab. Öffentliche Updates waren damit unmöglich und hätten zu Tokens beim Nutzer gedrängt. Zweiter Lesestand: Token optional, geht nur an die feste Releaseliste (`api.github.com`), nie an Downloads. Downloads laufen tokenlos über `browser_download_url`. | HOCH (alt) | Korrektur im Arbeitsbaum gelesen. **Nachprüfung offen.** |
| C-2 | Manifestsignatur | Erster Lesestand: `manifestVerified` blieb immer `false`, `manifest.json.sig` wurde nie geladen, der SHA-256 aus dem ungeprüften Manifest galt als Vertrauensanker. Zweiter Lesestand: `manifest-sign.js` prüft Ed25519 über die exakten Bytes, fail-closed, Public Key im Repo, Signaturformat streng. `service.js` verwirft Manifeste ohne `manifestVerified === true`. | HOCH (alt) | Korrektur im Arbeitsbaum gelesen. **Nachprüfung offen** (nicht eingefroren, nicht ausgeführt). |
| C-3 | Testlücke | `tests/phase-n1-manifest-signature.test.js`, gelesene Zeilen 24–25: `assert.notEqual(verifyManifest(...), true)`. `verifyManifest` liefert ein Objekt, nie `true`. Die Assertion ist immer wahr und erkennt einen kaputten Prüfer nicht. Die Datei habe ich nur ausschnittsweise gesehen. | MITTEL | offen |
| C-4 | Downgrade | `selectCandidate` mit `allowDowngrade: false`. `installPlan` verlangt `compare(available, installed) > 0` (ältere Fassung von `service.js`, Zeilen 404–560). Kanalwechsel nach unten ist nur als Text in `switchConsequences` beschrieben, im gelesenen Service nicht erzwungen. Verhalten bei Prerelease-gegen-Release-Vergleich in `semver.js` nicht gelesen. | MITTEL (unbestätigt) | offen |
| C-5 | Replay und Freeze | Kein Ablaufdatum, keine Frische im signierten Manifest. `judge()` in `channels.js` vergleicht `version`, `channel`, `product`, `package`, `platform`, aber nicht `releaseTag` oder `commit`. Wer Schreibrechte am Repo hat, kann ein altes, gültig signiertes Release unter neuem Tag veröffentlichen. Blockiert wird nur, was nicht neuer als die installierte Version ist. Kein Widerruf und keine Rotation: ein Schlüssel, eine PEM-Datei. | MITTEL | offen |
| C-6 | Stable-Herausgeber | `main.js` Zeile 91: `publisherThumbprint: app.isPackaged ? "" : env`. Im gepackten Build ist der Thumbprint leer. `installPlan` lehnt Stable dann immer ab. Fail-closed, also keine Lücke, aber ein Releaseblocker. Nicht „reparieren“, indem der Wert aus der Umgebung kommt. Er muss fest im Build stehen. | MITTEL (Funktion) | offen |
| C-7 | Umgehungspfade | `ACADEMY_UPDATE_FEED` (`main.js` Zeile 76) ersetzt auch im gepackten Build die GitHub-Quelle. Der alte Pfad in `check()` hat keine Ed25519-Prüfung. Auch `downloadModule` nimmt die Prüfsumme vom selben Host ohne Signatur (nur DEV). Ausnutzen setzt lokalen Zugriff auf das Nutzerkonto voraus. | NIEDRIG | offen |
| C-8 | Fremde Releases | Im gelesenen Code kein Befund: Tag-Muster pro Kanal, `product`, Signatur, Download-URL exakt `github.com/DesoWorks/Academy/releases/download/<Tag>/<Name>`, genau eine `.exe`. Die Redirect-Prüfung beim Download habe ich nur in der älteren `service.js` gesehen. | INFORMATIV | Download-Teil nicht neu gelesen |
| C-9 | Installer | NSIS: `perMachine: false`, `allowElevation: false`, also keine Admin-Rechte. Silent `/S`. Zeit zwischen Hashprüfung in `installPlan` und Start durch den Aufrufer in `main.js` nicht gelesen. | INFORMATIV | offen |

## 3. GitHub Actions (lokal gelesen: dev, beta, stable)

Positiv: `permissions: contents: read` als Standard, `contents: write` nur im Publish-Job, `persist-credentials: false`, kein persönliches Token, Release erst als Entwurf, Assetprüfung, dann veröffentlicht, bestehende Tags werden nie überschrieben, Freigabeeingaben laufen über `env` statt direkter Interpolation.

| Nr. | Befund | Stufe |
| --- | --- | --- |
| A-1 | `ACADEMY_MANIFEST_SIGNING_KEY` steht auf Job-Ebene im Build-Job und ist damit schon in `npm ci` sichtbar (Skripte von Abhängigkeiten). In Stable gilt dasselbe für `CSC_LINK` und `CSC_KEY_PASSWORD`. Secrets nur an dem Schritt setzen, der sie braucht. | MITTEL |
| A-2 | Ein Signaturschlüssel für DEV, BETA und STABLE. DEV läuft bei jedem Push auf `dev` ohne Environment und ohne Prüfer. Wer dort pushen darf, kann damit gültig signierte Releases erzeugen. Empfehlung: getrennte Schlüssel je Kanal, Stable-Schlüssel nur im Environment `stable-release`, Client akzeptiert pro Kanal nur den passenden Schlüssel. | MITTEL |
| A-3 | Im Stable-Workflow liest der `guard`-Job die Secrets ohne Environment. Die Freigabe ist ein frei eintippbarer Text. Die echte Sperre ist das Environment `stable-release` mit Pflichtprüfern. Ob es existiert, kann ich von außen nicht sehen. | MITTEL (unbestätigt) |
| A-4 | Actions per Tag `@v4` statt per Commit-SHA. | NIEDRIG |
| A-5 | Branch- und Tag-Schutz für `main`, `dev`, `beta`, `dev/*`, `beta/*`, `stable/*` ist von außen nicht prüfbar. | OFFEN |

## 4. Empfohlene Maßnahmen (nur Empfehlung, nichts ausgeführt)

1. Commander entscheidet über P-2 und P-3. Ohne Entscheidung wird die Historie nicht umgeschrieben.
2. Historie vor jedem Release-Push vollständig prüfen (lokal mit Git und einem Secret-Scanner, plus GitHub Secret Scanning aktivieren).
3. Test C-3 reparieren: `assert.equal(result.ok, true)` für die gültige und `false` mit erwartetem `reason` für Fälschung, falsches Format und fehlenden Schlüssel.
4. Manifest um `releaseTag`, `commit` und ein Mindestversionsfeld erweitern, `judge()` gegen den Tag prüfen. Schlüsselkennung und Rotationsweg festlegen.
5. Stable-Thumbprint zur Build-Zeit festschreiben (C-6). `ACADEMY_UPDATE_FEED` im gepackten Build ignorieren (C-7).
6. Secrets nur schrittweise setzen, Schlüssel je Kanal trennen, Environments mit Prüfern für BETA und STABLE, Tag- und Branch-Rulesets, Actions per SHA (A-1 bis A-5).
7. Direkt vor dem Start des Installers den Hash erneut bilden.

## 5. Grenzen der Prüfung (verbindlich)

- **Keine Shell, kein Git.** `.git` ist für mich gesperrt. Branch, HEAD und Arbeitsbaumstatus habe ich nicht selbst geprüft. `e558c14` stammt von Rick.
- **Historie nicht vollständig geprüft.** Meine Abrufe der Commit-Diffs (`.patch`) kamen auf ca. 6,6 KB gekürzt zurück, für einen Commit ohne eine einzige Datei. Dieser Mustersuchlauf zählt **nicht** als Historienprüfung. Es gab keinen Klon und keinen Scan über alle Objekte. Gelöschte oder spätere Dateien, die nur in der Historie liegen, sind nicht gesehen. Gelesen habe ich Verzeichnislisten von `docs/operation-academy`, `scripts`, `build`, `catalog`, `tests`, `modules` (Branch) und die Wurzel, dazu `.gitignore`, `channel.json`, `package.json`, `catalog/official.json` und vier Dokumente. Nicht geöffnet: `src/`, `assets/`, `module-template/`, `modules/*`.
- **Dokumente P-4:** `SECURITY-PHASE-I.md`, `QA-PHASE-I.md`, `PHASE-I.md` nur gekürzt gesehen. Treffer auf lokale Pfade in diesen Läufen können auch vom Abrufwerkzeug stammen und gelten nicht als bestätigt.
- **Code:** gelesen sind `github-feed.js` (beide Stände), `signature.js`, `channels.js`, `manifest-sign.js`, `service.js` Zeilen 1–561 (alt) und 250–339 (neu), `main.js` Zeilen 60–109, `scripts/make-release-manifest.js`, die drei Workflows. **Nicht gelesen:** aktuelles `service.js` ab Zeile 340, `main.js` ab Zeile 110, `semver.js`, `feed.js`, `dev-feed.js`, Modulcode, Renderer, Preload und IPC, `package-lock.json`, Abhängigkeiten auf bekannte Schwachstellen.
- **Nichts ausgeführt:** keine Tests, kein Build, keine Actions, keine Update-Probe von Version A nach B. Dass der private Signaturschlüssel zum Public Key im Repo passt und sicher liegt, ist unbelegt.
- **GitHub-Einstellungen** (Environments, Secrets, Rulesets, Secret Scanning) sind unauthentifiziert nicht einsehbar.
- **Nachprüfung der Korrektur:** OFFEN. Sie gilt erst, wenn Jarvis einen festen Commit nennt und ich genau diesen Stand lese. Kein Befund aus C-1 bis C-9 und A-1 bis A-5 ist geschlossen.
- Keine Datei gelöscht, keine Historie umgeschrieben, keine Sichtbarkeit geändert, kein Commit, kein Push. Geschrieben wurde nur diese Datei.
