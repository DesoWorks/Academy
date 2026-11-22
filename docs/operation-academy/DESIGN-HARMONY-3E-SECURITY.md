# DESIGN HARMONY 3E – Sicherheitsbewertung des lokalen Commits

**Projekt:** IT-Ausbildung / DesoWorks Academy
**Prüfer:** RoboCop, Security Officer (unabhängig)
**Datum:** 22.11.2026
**Prüfgegenstand:** Commit `9e03fb8d9cb7cef914e1738d2e22278093c88f3f` auf `feature/phase-n1-release-connectivity`
**Vergleichsbasis:** `95f0033dfa3ba3f6b51155c014dbc19a4178a7f3`
**Zustand bei Prüfung:** `HEAD` ist `9e03fb8…` (per `git rev-parse` bestätigt). Der Branch steht 1 Commit vor `origin/feature/phase-n1-release-connectivity`. Der Arbeitsbaum zeigt `M build/build-info.json` (nicht im Commit, nicht bewertet) und untracked Dateien (`*N1-W4*`, `PHASE-N1-WELLE-4.md`, `DESIGN-HARMONY-3E-QA.md`, `design-harmony-3e/`). Diese liegen nicht im Commit und sind nicht Gegenstand dieser Prüfung.
**Art der Prüfung:** nur lesend. Es wurde kein Anwendungscode, `package.json`, Workflow oder Profil verändert, und es gab keinen Push.

## 1. Kurzfazit

Im Diff wurden **keine Befunde der Stufen KRITISCH, HOCH oder MITTEL** festgestellt. Es gibt zwei Befunde der Stufe NIEDRIG und mehrere INFORMATIV-Beobachtungen.

Die Sicherheitsmechanismen, die du ausdrücklich genannt hast, sind im Code in der erwarteten Reihenfolge verdrahtet und durch Tests gedeckt: Signaturpfad, Downgrade-Sperre, Abweisung von gleicher Version mit anderem Inhalt vor jeder Dateioperation, Theme-Vertrag und Katalogpfad.

**Nicht bewertet:** der Installer und das Build-Artefakt. Dieser Nachweis kommt von Rick. Aussagen zum Installerinhalt stehen hier ausschließlich unter „Offene Punkte“.

## 2. Umfang des Diffs (belegt)

- 75 Dateien, +9695 / −26 Zeilen. `git diff --diff-filter=DRT` ist leer: keine Löschungen, Umbenennungen oder Typwechsel.
- Außerhalb von `docs/`, `tests/` und `src/` ändert der Commit genau **eine** Datei: `modules/it-systemintegration/academy-module.json` (Version `1.0.1` → `1.0.3`, neu `runtime.themeContract: 1`).
- Änderungen in `src/`: `main.js`, `modules/manager.js`, `modules/spec.js`, `renderer/shell.js`, `renderer/module.js`, `renderer/design-tokens.css`.
- Nicht im Diff: `package.json`, `.github/`, `catalog/`, `src/modules/signature.js`, `src/modules/catalog.js`, `src/ipc.js`, `src/preload.js`, `src/window.js`. Das gilt je nach Pfad per `git diff … -- <Pfad>` (leer) oder per Dateiliste.
- Nach dem Testlauf zeigt `git status` keine neuen Änderungen an getrackten Dateien, abgesehen von der bereits bekannten `build/build-info.json`.

## 3. Bestätigte Befunde

### B1 – Signaturpfad unverändert und früher als die neue Logik – INFORMATIV (positiv)
- `verifyTrust` und `signature.js` stehen nicht im Diff.
- `manager.js:505` ruft `verifyTrust` auf, **vor** der Existenzprüfung (`:507`), dem Downgrade-Check (`:516`) und der Same-Version-Prüfung (`:521`).
- Für `official` und `reviewed` werden Signatur und hinterlegter Schlüssel verlangt. Eine angegebene, aber falsche Signatur wird auch bei `private` abgewiesen (`:368–376`).
- Tests: `tests/modules.test.js:143` und `:164` (`signature-rejected`) laufen grün.
- **Einordnung:** `desoworks.it-systemintegration` ist `trust: "private"` und unsigniert (`review.signed: false`, kein `signature`-Feld im Manifest). Für dieses Modul greift die Signaturprüfung faktisch nicht. Der Schutz besteht aus der Beschränkung auf `hostedWebRoots` (`manager.js:485–495`), der Bindung an Herausgeber und Vertrauensstufe (`:510–515`) und den Payload-Hashes. Das ist unverändert gegenüber der Basis. Neu ist: Auch `themeContract` steht im unsignierten Manifest und ist deshalb ein **Kompatibilitätsmerkmal, kein Sicherheitsmerkmal**.

### B2 – Downgrade-Sperre – INFORMATIV (positiv)
- `compare(neu, installiert) < 0` führt zu `downgrade-blocked` (`manager.js:516–518`). Der Code ist unverändert.
- Tests: `design-harmony-3-theme-contract.test.js:130` (1.0.1 ersetzt installiertes 1.0.2 nicht, Lernstand bleibt), `modules.test.js:204`, `phase-k-updates.test.js:73`. Alle grün.

### B3 – Gleiche Version, anderer Inhalt: Abweisung vor jeder Dateioperation – INFORMATIV (positiv)
- Die Prüfung steht bei `manager.js:519–535`. Die ersten Dateioperationen (`rmSync` und `mkdirSync` des `.incoming`-Ordners) folgen erst ab `:540–543`. Die Reihenfolge ist durch Lesen des Codes belegt.
- Verglichen werden drei Dinge: Dateihashes (`sameHashes` gegen `previous.fileHashes`), Payload-Hashes (gegen `previous.payloadHashes`) und die Manifest-Identität ohne die beim Installieren abgeleiteten Felder (`manifestIdentity`).
- Bei Abweichung wirft der Code `same-version-different-content`. Installationszeile, Dateien und Lernstand bleiben unberührt.
- Bei identischem Paket im Zustand `active` oder `disabled` wird nichts ersetzt. Bei `faulted` bleibt der Kopierweg als Reparatur offen. Der Zustand `uninstalled` fällt durch auf die Neuinstallation.
- Test: `design-harmony-3b-update.test.js:86` und die Tests zu identischem Paket, Reparatur und Neuinstallation. Alle grün.

### B4 – Theme-Vertrag – INFORMATIV (positiv)
- Das Schema (`spec.js`) verlangt, sofern vorhanden, eine ganze Zahl ≥ 1. `THEME_CONTRACT_SUPPORTED = 1`.
- `compatibilityOf` liefert für hosted-web ohne Vertrag oder mit Vertrag ≠ 1 `compatible: false` samt Begründung.
- Durchsetzung an vier Stellen: Installation (`incompatible-theme`, `manager.js:499–504`, vor `verifyTrust` und vor jeder Dateioperation), Öffnen (`module-incompatible`), Auslieferung der Web-Dateien (liefert `null`) und Anzeige (`publicRow`).
- Die Prüfung vor `verifyTrust` ist unkritisch: Sie schreibt nichts.
- Tests: `design-harmony-3-theme-contract.test.js:89`, `:101`, `:164` und der Test „gebündeltes Quellmodul it-systemintegration deklariert themeContract 1 bei Version 1.0.3“. Alle grün.

### B5 – Katalogpfad – INFORMATIV (positiv, mit Offene-Punkte-Anteil)
- `main.js` bildet jetzt **eine** `catalogFile` für Modulmanager und IPC.
  - Entwicklung: `catalogPath(path.join(__dirname,"renderer"))`. Das ergibt `<Projektwurzel>/catalog/official.json`. Der Wert ist aus dem Code abgeleitet und deckt sich rechnerisch mit dem alten Ausdruck `path.join(__dirname,"..","catalog","official.json")`. Ich habe ihn nicht ausgeführt.
  - Gepackt: `process.resourcesPath/academy-catalog/official.json`, unverändert.
- `resolveBundledPackage` steht nicht im Diff. Es verlangt das Präfix `modules/`, verbietet `..` und absolute Pfade und prüft per `realpath` die Lage innerhalb des gebündelten Modulordners.
- `availableUpdate` (neu) ist rein lesend:
  - Es liest nur `academy-module.json` (Größenlimit 64 KiB, `validateManifest`).
  - Es verlangt dieselbe ID, denselben Herausgeber und dieselbe Vertrauensstufe, eine höhere Version und Kompatibilität.
  - Es installiert nichts.
- Die Installation läuft weiterhin über `academy:modules-install-catalog`. Dort gelten der ID-Abgleich (`ipc.js:401`), der Bestätigungsdialog im Hauptprozess (`ipc.js:404–423`) und `installFromDirectory` mit der `hostedWebRoots`-Prüfung.
- Wichtig: „Aktualisierung verfügbar“ ist ein **Hinweis**. Es ist keine Vorabprüfung der Signatur oder der Hashes. Die tatsächliche Prüfung geschieht erst bei der Installation.

### B6 – Anzeige „geprüft: keine Aktualisierung“ bei unlesbarem Katalog – NIEDRIG
- `availableUpdate` fängt alle Fehler ab und liefert `null` (`manager.js:316–319`, `:324–331`).
- `annotate` setzt bei gesetzter `catalogFile` daraufhin `updateAvailable = false` (`:343–346`). Der Kommentar im Code sagt dagegen, `false` bedeute „geprüft“, `null` bedeute „nicht geprüft“.
- Ist der Katalog im Installer nicht auffindbar oder unlesbar, meldet die Oberfläche bei einem inkompatiblen Modul „Keine Aktualisierung verfügbar: …“ (`shell.js`, `statusReason`) statt „Nicht geprüft“.
- Es ist kein Angriffsweg und kein Datenverlust. Es ist ein Fehler in der Ehrlichkeit der Anzeige, der für Auftragspunkt 8 relevant ist (zuverlässige Katalogbereitstellung beim Core-Update): Ein fehlender Katalog würde nicht als Fehler sichtbar, sondern als „nichts zu tun“.
- Ein Test für „Katalogdatei gesetzt, aber unlesbar“ ist mir nicht aufgefallen. Die Testsuche war nicht erschöpfend.
- **Empfehlung (Jarvis):** In `availableUpdate` zwischen „Katalog nicht lesbar“ (→ `null`) und „kein Update“ (→ `false`) unterscheiden und einen Test ergänzen. Das ist kein Blocker aus Sicherheitssicht. Es ist eine Korrektur, die vor dem Praxistest sinnvoll ist.

### B7 – Update-Fehlermeldung als Hinweis ohne Quelle und ohne Begrenzung – NIEDRIG
- `installFromDirectory` ist neu umhüllt. Jeder Fehlschlag eines Installationsversuchs für eine **bereits installierte** ID schreibt über `recordUpdateFailure` einen Hinweis mit dem Präfix „Aktualisierung fehlgeschlagen: “. Dabei wird nur der Hinweis geschrieben. Installationszeile, Dateien und Lernstand bleiben unberührt (Test „abgelehnter Versuch ändert nichts“ grün).
- Folgen:
  - Jeder fehlgeschlagene Import eines Pakets mit gleicher ID kann die Anzeige „Aktualisierung fehlgeschlagen“ beim echten Modul auslösen. Das gilt für jeden Weg, der `installFromDirectory` erreicht. Bestätigt habe ich den Katalogweg. Die übrigen IPC-Wege habe ich nicht gelesen.
  - Eine Obergrenze für die Zahl der Hinweise je Modul habe ich nicht gefunden. Ob es eine gibt, ist ungeprüft.
  - Ein späterer No-op mit identischem Paket (B3) schreibt keinen Hinweis. Ein alter Fehlerhinweis bleibt dann sichtbar.
- Der angezeigte Text stammt aus Anwendungsmeldungen (`ModuleError`), nicht aus freiem Paketinhalt. Gerendert wird über `textContent` (`shell.js:20`). In `shell.js` und `module.js` gibt es kein `innerHTML` und kein `insertAdjacentHTML`. Der Test „die Modulansicht setzt keine Modultexte per innerHTML“ ist grün. Ein XSS-Pfad ist daher nicht erkennbar.
- Auswirkung: begrenzt auf Anzeige und Hinweisprotokoll.

### B8 – Irreführende Erfolgsmeldung bei No-op – INFORMATIV
- Bei identischem Paket im Zustand `active` oder `disabled` gibt `installFromDirectory` die bestehende Zeile zurück (`manager.js:534`). Das ist korrekt und sicher.
- Der Katalog-Button „Erneut installieren“ (`renderer/catalog.js:40`) meldet daraufhin „Modul installiert.“, obwohl nichts ersetzt wurde. Das ist eine reine Meldungsfrage.

### B9 – Secrets – kein Befund
- Mustersuche (`ghp_`, `github_pat_`, `gho_`, `AKIA…`, `BEGIN … PRIVATE KEY`, `Bearer …`, Zuweisungen von `password`/`secret`/`api_key`/`token` mit Wert) über den Baum von `9e03fb8`:
  - über `src/`, `tests/`, die geänderten Moduldateien und die Sonden- und Berichtsordner der Etappen 3 bis 3D;
  - über das gesamte `docs/operation-academy/`.
- Treffer:
  - Nur Prosa in `DESIGN-HARMONY-DEV-SECURITY.md:58`, `UPDATE-SECURITY-N.md:138` und `:193`, die die gesuchten Muster **beschreiben**.
  - Testplatzhalter und Meldungstexte in `src/updates/messages.js` und `tests/phase-n-*.test.js`, `tests/phase-n1-w2-updater.test.js`. Diese Dateien gehören nicht zum Diff.
- Der Diff enthält keine `.env`-Datei, keinen Schlüssel, kein Zertifikat und keine Datenbank. Das sagt die Dateiliste (`--name-status` außerhalb von `docs/`, `tests/` und `src/` zeigt nur das Manifest).
- Nicht inspiziert: PNG-Inhalte (binär) und die Git-Historie über diesen Commit hinaus.

### B10 – App-ID und Build-Konfiguration nicht gelockert – kein Befund
- `package.json`, `.github/` und `electron-builder.yml` haben keinen Diff (`git diff` über diese Pfade ist leer).
- `appId` ist im Stand `9e03fb8` weiterhin `dev.desoworks.academy`. `extraResources` bildet `modules` → `academy-modules` und `catalog` → `academy-catalog` ab.
- `spec.js` ergänzt nur `THEME_CONTRACT_SUPPORTED` und die Typprüfung für `themeContract`. `RESERVED_PREFIX`, Rechte und Herausgeberprüfung sind nicht angefasst.
- CSP und Fensteroptionen liegen in Dateien, die nicht im Diff stehen (`window.js` u. a.).

### B11 – Lokale Pfade mit Windows-Benutzername in den neuen Nachweisen – NIEDRIG
- Im Commit stehen Berichte und Sondenprotokolle mit absoluten Pfaden, die den Windows-Benutzernamen enthalten (`C:\Users\Denni\AppData\…`). Beispiele:
  - `design-harmony-3d/artifact.json:2`
  - `design-harmony-3d/probe-upgrade.json:3`, `:4`, `:6`
  - `design-harmony-3d/probe-uebersicht.json:2`
  - `design-harmony-3c/probe-chain.json:3`, `:5`, `:32`, `:46`
  - `design-harmony-3c/probe-card.json:2`
  - `DESIGN-HARMONY-3-BESTAND.md`, `-3-MODUL-102.md`, `-3B-VERGLEICH.md` u. a.
- Ähnliche Treffer stehen auch in älteren Dokumenten im Arbeitsbaum. Ob diese bereits gepusht sind und ob das Repository öffentlich ist, habe ich nicht geprüft.
- Es sind keine Zugangsdaten. Betroffen sind der Benutzername und die Verzeichnisstruktur. Eine E-Mail-Adresse ist mir in den ausgegebenen Trefferzeilen nicht begegnet. Ob sie in nicht ausgegebenen Treffern steht, habe ich nicht einzeln aufgeschlüsselt.
- **Empfehlung:** Vor einem Push in ein öffentliches Repository die Pfade in den neuen Nachweisen durch Platzhalter wie `%TEMP%` und `%APPDATA%` ersetzen. Das ist Sache von Rick oder Jarvis mit Freigabe des Commanders. Ich habe nichts geändert.

### B12 – Sonden berühren das Produktivprofil nur lesend – INFORMATIV
- `design-harmony-3c/probe-chain.js` und `design-harmony-3d/probe-upgrade.js` bilden `profileRoot` aus `%APPDATA%\DesoWorks\Academy`. Dort werden nur `module-packages/<id>/1.0.2` und das verified-Manifest gelesen und per Kopie in ein Temp-Verzeichnis übernommen.
- Alle Schreibzugriffe (`writeFileSync`, `mkdirSync`, `cpSync`-Ziele) gehen nach `os.tmpdir()` oder ins Sondenverzeichnis (`probe-upgrade.js:44`, `:46`, `:52`, `:97`, `:105`, `:162`). Das habe ich per Suche über beide Dateien geprüft. `probe-upgrade.js` habe ich nur bis Zeile 70 vollständig gelesen.
- Die Lernstand-Datenbank des Produktivprofils wird nicht berührt.

## 4. Testlauf (belegt)

```
node --test tests/design-harmony-3-theme-contract.test.js tests/design-harmony-3b-update.test.js tests/modules.test.js tests/phase-k-updates.test.js tests/hosted-module.test.js
```
Ergebnis: **38 Tests, 38 bestanden, 0 fehlgeschlagen**, 5,1 s. Das ist nicht die gesamte Suite. Die Aussage gilt nur für diese fünf Dateien.

Zusätzlich: Die 249 Einträge in `modules/it-systemintegration/content/payload-index.json` stimmen im Arbeitsbaum mit den SHA-256-Werten der Dateien überein (0 Abweichungen). Der Arbeitsbaum entspricht für `modules/` dem Commit (`git status` für `modules`, `catalog`, `src`, `package.json`, `.github` ist leer).

## 5. Offene Punkte (nicht belegt)

1. **Installer-Nachweis:** Ob der Installer wirklich Modul `1.0.3` mit `themeContract: 1` und `academy-catalog/official.json` enthält, ist nicht geprüft. Die Konfiguration (`extraResources`) ist belegt, der Inhalt des Artefakts nicht.
2. **Upgrade 1.0.2 → 1.0.3 mit dem Artefakt:** Die Tests belegen den Pfad im Code. Der Lauf gegen den entpackten oder installierten Installer liegt bei Rick. Ich habe die Ergebnisse der Sonden aus Etappe 3D nicht als Nachweis übernommen.
3. **Integrität installierter Dateien:** Die Same-Version-Prüfung vergleicht gegen die beim Installieren gespeicherten Hashes, nicht gegen die aktuellen Dateien auf der Platte. Nachträgliche Manipulation an `module-packages` erkennt dieser Pfad nicht. Das ist vorbestehend und nicht Teil dieses Diffs. Ob eine andere Stelle das abfängt, habe ich nicht untersucht.
4. **Altinstallationen ohne `payloadHashes`:** Bei gleicher Version würde ein identisches Paket als „anderer Inhalt“ abgewiesen (`previous.payloadHashes || {}`). Das fällt sicher aus, wäre aber ein Verfügbarkeitsproblem. Ob solche Installationen existieren, ist offen. Für 1.0.2 → 1.0.3 ist es nicht relevant, weil die Versionen verschieden sind.
5. **Schreibrechte auf `resources/academy-catalog` im installierten Zustand:** Wer den Katalog dort ändern kann, könnte Update-Hinweise beeinflussen. Installation bliebe hinter Bestätigung und Paketprüfung. Die Rechte im Installationsverzeichnis habe ich nicht geprüft.
6. **Signierung von Installer und Release-Artefakt, Workflow `academy-dev.yml`, CSP:** nicht Gegenstand dieser Prüfung. Der Workflow und die CSP-Dateien sind im Diff unverändert, ich habe sie hier nicht gelesen.
7. **Barrierefreiheit und die weiterhin offene Statusmeldung:** Das sind keine Sicherheitsfragen. Ich habe sie nicht bewertet.
8. **`build/build-info.json`:** Die Arbeitsbaum-Änderung habe ich nicht gelesen. Im Commit ist die Datei gegenüber der Basis unverändert (`git diff` leer). Sie ist keine Grundlage für eine Sicherheitsaussage.

## 6. Sicherheitsempfehlung

- **Zum Code-Diff (`9e03fb8` gegenüber `95f0033`):** Aus Sicherheitssicht kein Einwand. Keine Befunde ab Stufe MITTEL.
- **Vor dem Push auf `dev` wünsche ich mir:**
  1. B11 entscheiden: Pfade in den Nachweisen schwärzen oder bewusst so lassen. Ein Amend ist vor dem Push noch möglich, die Entscheidung liegt beim Commander.
  2. B6 beheben oder bewusst vertagen. Es betrifft Auftragspunkt 8.
  3. Den Installer-Nachweis (Offene Punkte 1 und 2) von Rick abwarten. Ohne ihn gebe ich **keine** Aussage zum Artefakt ab.
- Die Entscheidung über Push und Veröffentlichung liegt beim Commander. Ein Push auf `dev` würde laut Lead den Workflow `academy-dev.yml` auslösen und nach grünem Lauf veröffentlichen. Ich habe keine Freigabe erteilt und keinen Push ausgeführt.
- Auf Anforderung prüfe ich das gebaute Artefakt unabhängig nach (Installerinhalt, Katalogdatei im Installer, Upgrade-Lauf).

## 7. Grenzen der Prüfung

- Statische Prüfung des Diffs und gezielter Quellstellen sowie ein Testlauf von fünf Testdateien. Kein Penetrationstest, kein Portscan, keine Ausnutzungsversuche.
- Nicht vollständig gelesen: `manager.js` außerhalb der genannten Bereiche, `ipc.js` außerhalb von `:383–432`, `probe-upgrade.js` ab Zeile 71, die übrigen Berichte unter `docs/operation-academy/`.
- Die Secret-Suche war musterbasiert. Sie ersetzt keinen Scanner und deckt weder Binärdateien noch die vollständige Historie ab.
- Historische Prüfberichte (3 bis 3D) habe ich nicht als Nachweis verwendet. Die Aussagen oben stützen sich auf den Code und die Testläufe dieses Laufs.
