# Update-Bestandsaufnahme für Phase N

Stand: 22.11.2026. Verfasser: Jarvis. Reine Lesearbeit: keine Codeänderung, kein Build, kein Commit, kein Push.

## 0. Grundlage und Grenzen

- Gelesen wurden: `src/updates/` (alle 8 Dateien), `src/main.js`, `src/config.js`, `src/ipc.js` (Update- und Wiederherstellungsteil), `src/renderer/verwaltung.js`, `verwaltung.html`, `settings.html`, `settings.js`, `bridge.js`, `channel.json`, `package.json`, `scripts/dev-feed-server.js`, `scripts/publish-dev-feed.js` und die Phase-M-Berichte.
- Von den Testdateien wurden nur Namen und Testtitel gelesen, nicht jeder Testrumpf. Aussagen über Tests beruhen auf den Titeln. Ich habe `npm test` **nicht** ausgeführt, weil in diesem Lauf keine Shell verfügbar war. Die Zahl „72 bestanden“ stammt aus `PHASE-M.md` und ist hier nicht neu belegt.
- Die Datei `.git/HEAD` zeigt aktuell auf `refs/heads/feature/phase-n-continuous-delivery`. Den Commit habe ich nicht aufgelöst. Dass der SemVer-Fix in `49b089a` steckt, übernehme ich vom Auftrag und habe es nicht per Git geprüft.
- Es existiert kein Ordner `.github` im Projekt: **fehlt**. Es gibt keinen Workflow, kein Release-Skript für GitHub und keine `publish`-Konfiguration in `package.json`.
- GitHub-Release-Zustände habe ich nicht abgefragt. Die einzige Aussage dazu stammt aus `PHASE-M.md` (Phase M: `list_releases` lieferte `[]`). Heutiger Stand: nicht geprüft.

## 1. Warum die Program-Files-Fassung 0.3.0 keinen DEV-Stand findet

Belegt durch Code und `PHASE-M.md`, Abschnitt „Warum die installierte 0.3.0 nichts findet“:

1. Die installierte 0.3.0 wurde vor dem Phase-M-Client gebaut. Ihr Clientcode ist der alte. Der damalige gepackte Client setzte die Feed-Adresse immer leer und blockierte jeden Nicht-Stable-Kanal. Die Datei dieser Installation habe ich nicht geöffnet; die Aussage stützt sich auf den Phase-M-Bericht.
2. Der aktuelle Code würde denselben Schritt anders machen: `src/main.js` setzt für `channel === "dev"` und gepackt `feedUrl = DEV_FEED_URL` (`http://127.0.0.1:47321/dev/manifest.json`). Dieser Code ist aber nicht in der 0.3.0 enthalten.
3. Eine Selbstaktualisierung bräuchte, dass der alte Client einen neuen Stand überhaupt sieht. Das kann er nicht. Es ist ein Bootstrap-Problem: Der neue Client muss einmalig manuell installiert werden. Phase M hat das nur in einem Testverzeichnis (`C:\Users\Denni\AppData\Local\DesoWorksAcademyPhaseM`) getan.
4. Zusätzlich: `package.json` führt `"version": "0.3.0"`, `channel.json` steht auf `dev`. Ohne Release-Build mit höherer Version bleibt auch der neue Code bei 0.3.0.
5. Selbst ein neuer Client in Program Files findet nichts ohne laufenden lokalen Feed-Server. Es gibt keine Remote-Quelle (siehe Abschnitt 3).

## 2. Was der lokale Feed kann und was nicht

Dateien: `src/updates/dev-feed.js`, `scripts/dev-feed-server.js`, `scripts/publish-dev-feed.js`, `service.js` (`fetchFeed`, `check`).

Kann (im Code belegt):
- `publish-dev-feed.js` kopiert einen Installer in den Feed-Ordner, schreibt `<Installer>.sha256` und eine `manifest.json` mit einem Core-Release und optional einem Modulpaket (ZIP plus `.sha256`).
- `dev-feed-server.js` liefert Dateien aus dem Feed-Ordner nur über `GET /dev/<Dateiname>`, gebunden an `127.0.0.1:47321`, mit Pfad-Schutz gegen `..`, `/`, `\`.
- Der Server verlangt den Header `x-academy-dev-key` und vergleicht ihn mit `updates/dev-feed.key` (wird beim Veröffentlichen erzeugt, `crypto.randomBytes(32)`).
- `service.js` sendet den Schlüssel nur an Loopback-URLs (`isLoopbackUrl`).

Kann nicht:
- Er ist kein Dauerdienst. `PHASE-M.md` belegt: Nach dem Test war Port 47321 frei. Er ist nur von dem Rechner erreichbar, auf dem er läuft.
- Die URL ist im gepackten Client fest. Keine Umgebungsvariable, keine Einstellung.
- Der Client prüft nicht, wer auf Port 47321 lauscht. Ein anderer Prozess auf dem Port erhielte den Schlüssel (so benannt in `UPDATE-SECURITY-M.md`). Ich habe das nicht praktisch nachgestellt.
- Der Feed ist nicht signiert. Manifest, Installer und SHA-256 kommen aus derselben Quelle. Wer den Feed-Ordner schreiben kann, kann alle drei konsistent austauschen.
- `publish-dev-feed.js` schreibt immer genau **einen** Core-Release und überschreibt `manifest.json`. Es gibt keine Historie, keinen zweiten Kanal.

## 3. Sind Kanalwahl, GitHub-Abruf, SHA-256, Signatur, Core/Modul-Trennung, Wiederherstellung wirklich implementiert?

| Funktion | Befund | Beleg |
|---|---|---|
| Kanalwahl durch den Nutzer | **Nicht implementiert.** Der Kanal ist beim Build in `channel.json` festgelegt. `resolveChannel` (`src/config.js`) kennt nur `dev` und `stable`; unbekannte Werte werden zu `dev`. In `main.js` wird ohne `isPackaged` die Umgebungsvariable gelesen, gepackt nur die Datei. `settings.html`: „Der Kanal wird nur angezeigt. Er lässt sich hier nicht ändern.“ In `src/` kein Treffer für `beta`. | `config.js`, `settings.html`, `settings.js` Z. 20 |
| BETA-Kanal | **Fehlt.** `service.js` Z. 21: `channel = options.channel === "stable" ? "stable" : "dev"`. | `service.js` |
| GitHub-Release-Abruf | **Nur Prototyp-Bausteine, nicht angeschlossen.** `feed.js` enthält `fromGitHubReleases`, `repositoryPinned` (Host- und Repo-Bindung an `DesoWorks/Academy`) und `DEFAULT_HOSTS`. `check()` akzeptiert ein Array als GitHub-Antwort. Aber: Gepackt ist die `feedUrl` im Stable-Kanal leer (`main.js` Z. 74–76), im DEV-Kanal ist sie Loopback. Es gibt keinen Code, der `api.github.com/repos/DesoWorks/Academy/releases` aufruft. Kein Authentifizierungs-Header für ein privates Repository. Ein Test nutzt `fromGitHubReleases` nur mit Testdaten (`updater.test.js` Z. 270). | `feed.js`, `main.js`, `service.js` |
| SHA-256 | **Implementiert und für Core und Modul getestet (laut Testtiteln).** `readSha256Asset`, `sha256File`, Sidecar `<datei>.sha256`; Vergleich in `download()` und `downloadModule()`; erneuter Vergleich in `installPlan()` und in `academy:module-update-install`. Bei Abweichung wird die Teildatei gelöscht. Einschränkung: Die Prüfsumme kommt aus derselben Quelle wie die Datei, schützt also vor Beschädigung, nicht vor einer manipulierten Quelle. | `service.js`, `ipc.js`, `updater.test.js` „Download prüft SHA-256…“ |
| Signatur (Herausgeber) | **Code vorhanden, praktisch unwirksam.** `signature.js` `verifyPublisher` ruft `Get-AuthenticodeSignature` auf und vergleicht `Status === "Valid"` mit dem Thumbprint. `installPlan()` verlangt das nur im Stable-Kanal. Gepackt ist `publisherThumbprint` leer (`main.js` Z. 87), also lehnt Stable jede Installation ab. `package.json`: `"signExecutable": false`. Es gibt kein Herausgeberzertifikat. DEV installiert unsigniert (`MESSAGES.devReady` sagt das offen). Eine Signatur über das Manifest oder detached Signaturen (z. B. minisign) gibt es **nicht**. | `signature.js`, `service.js` Z. 401–410, `main.js`, `package.json` |
| Core/Modul-Trennung | **Implementiert (DEV), Stable-Modulupdates bewusst aus.** Getrennte Einträge `releases` und `modules` im Manifest; `selectModuleUpdates` gibt für Stable `[]` zurück; `downloadModule` nur im DEV-Kanal; Modulinstallation (`ipc.js` `academy:module-update-install`) entpackt ZIP mit Pfad- und Größenlimits (`zip.js`), prüft `academy-module.json` gegen id und Version (`module-manifest.js`) und startet den NSIS-Installer nicht. Core-Kompatibilität über `satisfies(coreVersion, entry.core)`. Tests dazu: `phase-m-updates.test.js` (Core-Download nimmt Modulpaket nicht mit; falsche Summe; ZIP-Ausbruch; fehlgeschlagenes Modulupdate) und `phase-k-updates.test.js`. | `feed.js`, `service.js`, `ipc.js`, `zip.js`, `module-manifest.js` |
| Wiederherstellung (Daten) | **Implementiert.** `installPlan` verlangt einen Sicherungspfad; `academy:update-install` legt `store.backup("pre-update")` an; `academy:restore` stellt eine Sicherung nach Bestätigung zurück und legt vorher einen Sicherheitsstand an (Dialogtext). Test: „Installation ohne Sicherung startet nicht“. | `ipc.js` Z. 191–216, 439–450 |
| Wiederherstellung (Programm / Core) | **Fehlt.** Es gibt kein A/B-Verfahren, keine zweite Programmkopie und keinen Core-Rollback. Der NSIS-Installer wird mit `/S` gestartet, die App beendet sich (`main.js` `onInstall`). Phase M belegt nur: Ein sofort fehlschlagender Installer ändert nichts, und die App meldet `interrupted`. Rollback eines halb geschriebenen NSIS-Stands: ausdrücklich nicht nachgewiesen. | `main.js`, `PHASE-M.md` |
| Wiederherstellung (Modul) | **Teilweise.** `ipc.js` kopiert vor dem Modulupdate den alten Stand nach `updates/modules/rollback/<id>/<zeit>` und gibt den Pfad zurück. Es gibt aber keine Funktion und keinen Button, der diesen Snapshot zurückspielt. Bei Fehler wird nur `dest` gelöscht; „die bisherige Version bleibt“ gilt nur, solange `installFromDirectory` den Altstand nicht vorher überschreibt. Das habe ich in `src/modules/` nicht geprüft. | `ipc.js` Z. 478–498 |
| SemVer inkl. `dev.10` | **Implementiert im Code und getestet.** `semver.js` `comparePrerelease` vergleicht numerische Bezeichner numerisch. Tests `phase-m-semver-fix.test.js`, `phase-m-qa-semver.test.js`. Einschränkung: `VERSION_PATTERN` lässt in der Vorabversion keinen Bindestrich und keine Build-Metadaten (`+…`) zu; solche Tags werden verworfen. Der installierte Build 0.3.1-dev.2 trägt den Fix laut Auftrag nicht. | `semver.js` |
| Wiederaufnahme nach Absturz | **Implementiert, mit einer Auffälligkeit.** `reconcile()` verwirft `.partial`-Dateien und setzt `installing` auf `interrupted`. Der Zweig vergleicht dabei `previous.available` nicht mit der installierten Version. Wurde eine Installation erfolgreich beendet, aber der Zustand blieb auf `installing`, würde der Neustart sie als unterbrochen melden. Das habe ich im Code gelesen, aber nicht ausgeführt. Als zu prüfender Punkt für GLaDOS, nicht als bestätigter Fehler. | `service.js` Z. 138–191 |
| Oberfläche „Daten und Updates“ | **Implementiert.** `verwaltung.html/js`: Prüfen, Herunterladen, Abbrechen, Core-Installation, Modul laden/installieren; Anzeige von Kanal, Commit, Veröffentlichungsdatum, Größe, Notizen, Fortschritt. Prüfung beim Start nur bei Einstellung `academy.updateCheckOnStart`, ohne automatischen Download. Keine Kanalauswahl, keine Versionsliste, kein Rollback-Knopf. | `verwaltung.js`, `settings.html` |
| Host- und Repo-Bindung | **Implementiert.** `assertAllowedUrl` (https nur für GitHub-Hosts, http nur Loopback), `repositoryPinned` (Repo `DesoWorks/Academy`, Pfad `releases/download` bzw. `repos/.../releases`). Weiterleitungs-URL wird nach dem Abruf erneut geprüft. Tests in `update-integrity.test.js`. | `feed.js`, `service.js` |
| Release-Pipeline (CI) | **Fehlt.** Kein `.github`, kein Workflow, kein Skript für `gh release`. `package.json` hat nur `dist:dir` und `dist:nsis`. Installername: `DesoWorks-Academy-Setup-${version}.${ext}`. Kein `latest.yml` und keine electron-updater-Abhängigkeit. | Dateisuche, `package.json` |

## 4. Tests (nur Titel gelesen)

- `updater.test.js`: Dev installiert keine produktive Version; Stable ohne Netz; SHA-256 und falsche Summe; unterbrochener Download; Installation ohne Sicherung; Versionsstring mit Pfad; manipulierte `state.json`; fremde Quelle und fehlende Prüfsumme; GitHub-Format.
- `update-integrity.test.js`: Repository-Pinning; ungültige Metadaten; Abbruch; unsignierte Datei besteht Herausgeberprüfung nicht.
- `phase-k-updates.test.js`, `phase-m-updates.test.js`: Modul- und Core-Pfade.
- `phase-m-semver-fix.test.js`, `phase-m-qa-semver.test.js`, `protocol-path.test.js` (`resolveChannel`).
- **Keine** Tests für: BETA, Kanalwechsel, echten GitHub-Abruf, Signaturprüfung mit gültigem Zertifikat, Core-Rollback, Downgrade-Schutz zwischen Kanälen im Betrieb, Programm-Dateien in Program Files.
- Dauerhafte Windows-Nachweise liegen nur als Bericht vor (`WINDOWS-UPDATE-TEST-M.md`), nicht als wiederholbarer Test.

## 5. Tabelle Works / Prototype / Missing

| Bereich | Works | Prototype | Missing |
|---|---|---|---|
| Kanäle | DEV und Stable als getrennte Logik in `selectRelease`; DEV nimmt nur Prereleases, Stable nur Nicht-Prereleases | Kanal aus `channel.json` beim Build | BETA; Kanalwahl durch Nutzer; Kanalwechsel mit Sicherung; Trennung der Datenpfade je Kanal |
| Quelle | Host- und Repo-Bindung; Weiterleitungsprüfung | Lokaler Loopback-Feed mit Schlüssel (`dev-feed-server.js`); `fromGitHubReleases` nur mit Testdaten | Anbindung an GitHub Releases im gepackten Client; Umgang mit privatem Repository; Remote-Manifest; Prüfung, wer auf Port 47321 antwortet |
| Integrität | SHA-256 für Core und Modul, mehrfach geprüft | Sidecar-Datei aus gleicher Quelle | Signiertes Manifest oder detached Signatur; Prüfsumme außerhalb des Download-Ursprungs |
| Authentizität | Code für Authenticode-Thumbprint in Stable | Dev ohne Signatur | Herausgeberzertifikat; Thumbprint im gepackten Build; Signieren in der Pipeline |
| Core/Modul | Getrennte Pakete, ZIP-Extraktion mit Limits, Manifest-Abgleich, Core-Kompatibilität | Modulupdates nur DEV | Modulupdates für Stable/BETA; Modul-Rollback zurückspielen; Signatur der Modulpakete |
| Installation | Sicherung vor Installation; Version nur aufwärts; Pfad- und Hash-Prüfung vor Start | NSIS `/S` mit App-Beenden | A/B- oder Rollback-Mechanismus für den Core; Prüfung nach erfolgreicher Installation (`reconcile`-Lücke); Bestätigung des Erfolgs |
| Wiederherstellung | Datensicherung und Wiederherstellung mit Bestätigung | Modul-Snapshot wird angelegt | Rückspielen des Snapshots; Core-Rückkehr zur Vorversion |
| Bootstrap 0.3.0 | Nachweis auf Testinstallation unter `%LOCALAPPDATA%` | – | Migrationspfad aus Program Files; Nachweis der Selbstaktualisierung ab neuem Client |
| Pipeline | Lokale Builds über `electron-builder` | `publish-dev-feed.js` | `.github/workflows`; Release-Erzeugung; Asset-Namenskonvention; Prerelease-Kennzeichnung automatisch; Build-Info mit Commit im Release |
| Oberfläche | Prüfen, Laden, Abbrechen, Installieren, Anzeige von Kanal/Commit/Notizen | – | Kanalauswahl; Versionsverlauf; Rollback-Knopf; Hinweis zu nicht signierten Builds je Kanal |
| Tests | Unit-Tests für Hash, Pinning, SemVer, Modulpfade (laut Titeln) | Windows-Test nur als Bericht | Tests für BETA, Kanalwechsel, GitHub-Antwortformat gegen echte Struktur, Signaturen, A/B |

## 6. Empfohlene Implementierungsreihenfolge

Grundsatz: Zuerst die Quelle und die Prüfkette, dann die Kanäle von unsicher nach sicher. Jeder Schritt bleibt klein und einzeln testbar.

**Schritt 0 – Entscheidungen, die nur der Commander treffen kann (blockierend)**
- Repository `DesoWorks/Academy` ist laut Phase M privat. Soll es öffentlich werden oder braucht der Client ein Lese-Token? Ein Token gehört nicht in die Anwendung. Ohne diese Entscheidung ist kein Remote-Abruf möglich.
- Herausgeberzertifikat beschaffen oder Stable bewusst zurückstellen.

**Schritt 1 – Kanalmodell erweitern** (Grundlage für alles)
- `resolveChannel`, `service.js`, `selectRelease`, `selectModuleUpdates` von zwei auf drei Kanäle erweitern, mit SemVer-Regel: DEV = `-dev.N`, BETA = `-beta.N`, STABLE = ohne Vorabteil. Der Kanal wählt über das Vorabsegment, nicht nur über `prerelease`.
- Kanal als Nutzereinstellung im Datenverzeichnis, nicht im Build. Wechsel nur mit Sicherung und mit Downgrade-Schutz.
- Tests zuerst (rot), dann Code.

**Schritt 2 – DEV über GitHub**
- Remote-Abruf `api.github.com/repos/DesoWorks/Academy/releases` anschließen, bestehendes `fromGitHubReleases` und `repositoryPinned` nutzen. Loopback-Feed bleibt als Entwicklungsweg, aber mit Prüfung des Ursprungs.
- Release-Pipeline (`.github/workflows`): Build, `*.exe`, `*.exe.sha256`, Prerelease-Flag. DEV ist der risikoärmste Kanal und prüft die ganze Kette.
- Bootstrap: einmaliger, freigegebener Wechsel der Program-Files-Installation auf einen Client mit Remote-Quelle.

**Schritt 3 – Signierte Metadaten**
- Manifest oder Release-Assets mit detached Signatur (öffentlicher Schlüssel im Client). Das schützt auch DEV und BETA ohne Authenticode-Zertifikat. Mit ROBOCOP abstimmen.

**Schritt 4 – BETA**
- Gleiche Pipeline mit `-beta.N`, Aufnahme nur nach grüner Abnahme durch GLaDOS. Zielgruppe: Commander als Prüfer.

**Schritt 5 – Rückfallweg**
- Core: vorherigen Installer oder Programmstand behalten und gezielt zurückspielen (A/B oder Vorversion als Asset). Modul: Snapshot-Rückspielung. Lücke in `reconcile` nach erfolgreicher Installation schließen.

**Schritt 6 – STABLE**
- Erst nach Zertifikat, Thumbprint im gepackten Build, `signExecutable` und Signaturtest auf Windows. Modulupdates für Stable freischalten, wenn Schritt 3 und 5 stehen.

**Schritt 7 – Windows-Abnahme**
- Wiederholbare Tests für alle drei Kanäle: Installation, Update, Fehlschlag, Rückkehr, Datenerhalt; mit Program-Files-Installation. Durch GLaDOS.

## 7. Offene Punkte für Rick

- Sichtbarkeit des Repositorys und Token-Frage (Schritt 0).
- Zertifikatsfrage (Stable-Blocker, aus Phase M bekannt).
- `reconcile`-Verhalten nach erfolgreicher Installation prüfen lassen.
- Der installierte Build 0.3.1-dev.2 enthält den SemVer-Fix nicht; ein Update von dev.2 auf dev.10 wäre damit bei diesem Build nicht abgesichert (Aussage aus dem Auftrag, nicht von mir geprüft).
