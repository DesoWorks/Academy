# Design Harmony 2B – Sicherheitsprüfung der Theme-Weitergabe

**Prüfer:** RoboCop (Security Officer) · **Datum:** 2026-11-22
**Projekt:** Academy (`D:\Desoworks\Workspace\Academy`)
**Prüfstand:** Branch `feature/phase-n1-release-connectivity`, HEAD `46283bf`, `main` = `2e704e3` (unverändert, per `git rev-parse main` gelesen). Arbeitsbaum mit Änderungen, drei Moduldateien gestagt, kein Commit durch diese Prüfung.
**Gegenstand:** `git diff HEAD` der 13 geänderten Nicht-Doku-Dateien (`git diff HEAD --stat`), nicht die Absicht aus dem Vertrag.
**Art:** nur lesend. Einzige neue Datei neben diesem Bericht: `docs/operation-academy/design-harmony-2b-security/nachrechnen.js` (schreibgeschützte Nachrechnung der Nutzlast, siehe Abschnitt 5).

## Ergebnis in einem Satz

**EINGESCHRÄNKT freigegeben für den Theme-Transport.** Im Diff gibt es keinen bestätigten Befund der Stufen KRITISCH, HOCH oder MITTEL. Die Einschränkung entsteht, weil ich das Laufzeitverhalten nicht live beobachtet und die Tests nicht selbst ausgeführt habe (Abschnitt 6). Dies ist keine Produktfreigabe.

## 1. Neuer Kanal, gelockerte CSP, Sandbox, Rückkanal?

**Bestätigt: nein.**

| Prüfpunkt | Beleg |
|---|---|
| Kein `postMessage`/`message`-Listener im Diff | Suche in `src/` nach `postMessage` und `addEventListener("message"` ergab keine Treffer. Im Diff von `shell.js`, `module.js`, `protocol.js`, `navigation.js`, `anzeige-glossar.js` kommt keines vor. |
| Transport ist ausschließlich ein Query-Parameter | `src/renderer/module.js:99-101` (`frameUrl.searchParams.set("academy-theme", shell.activeTheme())`, `frame.src = frameUrl.href`) |
| CSP unverändert | `src/protocol-path.js` steht nicht im Diff. `MODULE_CSP` Zeilen 37-49: `script-src 'self'`, `frame-src 'none'`, `frame-ancestors academy://app`, `form-action 'self'`. |
| Sandbox unverändert | `src/renderer/module.js:96`: `allow-scripts allow-forms allow-same-origin`. Diese Zeile ist im Diff Kontext, nicht geändert. `referrerPolicy = "no-referrer"` ebenfalls unverändert (Zeile 97). |
| Fensterhärtung unverändert | `src/window.js:69-96` nicht im Diff: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `setWindowOpenHandler` verweigert, `will-navigate` nur `academy://app/`. |
| Kein Rückkanal Modul → Shell | Das Modul liest nur sein eigenes `<html data-academy-theme>` (`anzeige-glossar.js:10`, `navigation.js:173-179`). Es gibt keinen neuen IPC-Kanal, `preload.js` und `ipc.js` stehen nicht im Diff. |
| Host-Einbettung bleibt skriptfrei | `HOST_LINKS` (`protocol.js:9`) enthält nur zwei Stylesheets. Neu hinzugekommen ist kein `<script>`. |

## 2. Kann `academy-theme` HTML, Attribut oder Pfad injizieren?

**Bestätigt: nein.**

- `themeFromUrl` (`src/protocol.js:55-65`) verlangt genau einen Wert (`values.length !== 1` ergibt `hell`) und gibt nur ein Literal aus `THEMES` zurück, nie den Roh-Query. Der Vergleich ist `theme === values[0]` gegen ein eingefrorenes Array (`protocol.js:13`).
- `applyTheme` (`protocol.js:69-78`) wiederholt die Allowlist (`literal`, Zeile 71) und schreibt nur `data-academy-theme="${literal}"`. Ein Eintrag, der schon im Dokument steht, wird entfernt (Zeilen 73-75), es entsteht genau ein Attribut. Der Query-Wert erreicht den Ausdruck nicht.
- Der Pfad wird vom Parameter nicht berührt: `serveModule` löst die Datei aus `url.hostname` und `url.pathname` auf (`protocol.js:108-109`), der Query geht nur in `themeFromUrl` (Zeile 119). `resolveAcademyPath` (`protocol-path.js:51-75`) ist unverändert.
- Die Reichweite ist begrenzt: Anwendung nur im HTML-Zweig (`protocol.js:117-120`). Andere Dateitypen und die Shell-Seiten (`protocol.js:134-167`) bleiben ohne Theme-Eingriff.
- Clientseitig ist `shell.activeTheme()` durch `validTheme` gefiltert (`shell.js:92-94`). `navigation.js` hängt nur den bereits validierten `rootTheme` an (`navigation.js:173-179`, `withTheme` ab Zeile 180).
- Link-Umschreibung (`navigation.js:180-`): Nur `academy:` mit gleichem Host (Modul-ID) wird verändert. `javascript:`, `http(s):` und andere Module liefern `null` und bleiben unverändert. Assets (Endung außer `.html`) werden nicht umgeschrieben.

Grenze: Dass der Regex `HTML_ROOT` (`protocol.js:15`) auf Modul-HTML angewendet wird, ist Eingabe aus der installierten Nutzlast, nicht aus einer externen Quelle. Eine Fehlanpassung beträfe nur die Darstellung des betroffenen Moduls (Abschnitt 4, Befund B2). Eine Sicherheitsgrenze wird nicht berührt.

## 3. Modulgrenzen und Origins

**Bestätigt: nicht erweitert.**

- Schreibrecht auf den Shell-Speicher bleibt an die Shell gebunden: `fromApp(event)` prüft `event.senderFrame.url.startsWith("academy://app/")` (`src/ipc.js:7-10`) und gilt für `academy:storage-set` (`ipc.js:50-58`) wie für die übrigen Speicher-Kanäle. Ein Modul-Frame hat die URL `academy://<id>/…` und wird mit `forbidden` abgewiesen (`ipc.js:12-16`). `ipc.js` ist nicht im Diff.
- Die Shell ist einziger Eigentümer: Schlüssel `academy.theme` wird nur in `shell.js:97-110` (`writeTheme`) geschrieben, und nur nach Allowlist (`validTheme`) und erst bei `ok:true` wirksam. Der Query-Parameter wird auf Shell-Seiten nirgends gelesen (`readTheme`, `shell.js:73-83`, liest nur den Speicher).
- Kein Modul kann den Wert aufzwingen: Ein Modul kann die URL seines eigenen Frames beeinflussen, das ändert nur die eigene Darstellung. Zielt es auf `academy://app/…`, greift `frame-ancestors 'none'` der Shell-CSP (`protocol-path.js:33`). `academy://app` als Host geht nie durch `serveModule` (`protocol.js:134`), also nie durch `applyTheme`.
- Modul → anderes Modul / extern: `withTheme` gibt dort `null` zurück (`navigation.js`, Prüfung auf `protocol !== "academy:"` und `hostname` gleich), es wird nichts angehängt. Kein Origin-String-Vergleich, URL-API.
- Keine Erweiterung der Berechtigungen: `academy-module.json:16-19` unverändert (`content.read`, `progress.write`).
- Modul-Einstellungen: Im Academy-Kontext wird das Auswahlfeld gesperrt (`anzeige-glossar.js:74`), `dataset.theme` folgt dem Root-Wert (Zeile 39). Das schreibt nur lokal ins eigene Moduldokument.

## 4. Befunde

Keine KRITISCH-, HOCH- oder MITTEL-Befunde. Die folgenden Punkte sind bestätigte Beobachtungen oder Hinweise.

| Nr. | Stufe | Befund | Beleg | Empfehlung |
|---|---|---|---|---|
| B1 | NIEDRIG (funktional, nicht sicherheitsrelevant) | Navigation, die kein `<a href>`/`<form>` im selben Modul ist (zum Beispiel `location.href` in Skripten, Wechsel zu einem anderen Modul), trägt kein `academy-theme`. Die Folge ist fail-safe `hell`, kein Fehlzustand. | `protocol.js:62-64`, `navigation.js:180-` (nur Links/Formulare, gleicher Host) | GLaDOS: Navigationspfade mit Skriptsprung gezielt im dunklen Modus prüfen. |
| B2 | NIEDRIG | „Lernmodule dürfen die Theme-Einstellung nicht unabhängig überschreiben“ ist eine Konvention im Modulcode, keine technische Durchsetzung. Das Modul läuft mit `allow-scripts` im eigenen Dokument und kann sein eigenes `data-theme` ändern. Auswirkung: nur die eigene Darstellung, keine Datenwirkung über die Modulgrenze. | `anzeige-glossar.js:39`, `module.js:96` | Regel in `DESIGN-HARMONY-2B-REGELN.md` als Prüfpunkt für neue Module führen (C-3PO), kein Sicherheitsblocker. |
| B3 | INFORMATIV | `allow-scripts` + `allow-same-origin` besteht schon vorher und ist unverändert. Die Frame-Origin `academy://<id>` ist nicht `academy://app`, daher kein Skriptzugriff auf die Shell. | `module.js:96` (unveränderter Kontext) | Beibehalten, bei Erweiterung der Modulquellen neu bewerten. |
| B4 | INFORMATIV | Das Modul ist `trust: private`, `signed: false`, ohne `signature`. Die Nutzlastprüfung ist daher eine Konsistenzprüfung gegen den mitgelieferten Index, kein Herkunftsnachweis. Das war vor 2B so. | `academy-module.json:24-28`, `manager.js:257-268` | Für Verwaltung-Ausbildung und Weitergabe an Dritte Signierung vorsehen. Nicht Teil von 2B. |
| B5 | NIEDRIG (Hygiene) | `payload-index.json` ist unstaged (` M`), die drei Moduldateien sind gestagt (`M `). Wer nur die gestagten Dateien committet, liefert Blobs ohne passenden Index. Die Installationsprüfung würde das ablehnen (fail-closed, `manager.js:125-128`), es entstünde kein unsicherer Zustand, aber ein kaputtes Paket. | `git status --short` | Beim Commit alle vier Dateien gemeinsam erfassen (Entscheidung beim Commander). |
| B6 | INFORMATIV | `build/build-info.json` ist geändert (`commit`, `builtAt`, `version: 0.3.1-dev.4`, Kanal `dev`). Das ist ein Build-Artefakt, keine Theme-Änderung. Die Datei endet jetzt ohne Zeilenende und ohne das frühere `note`. | `git diff HEAD -- build/build-info.json` | Nicht mit der Theme-Änderung vermischen, vor dem Commit klären. |
| B7 | INFORMATIV | `module.js` baut die Frame-Adresse jetzt mit `new URL(...)`. Eine ungültige `runtime.entry` löst einen Fehler aus, statt eine kaputte Adresse zu setzen. Das ist fail-closed. Der Host bleibt durch das feste Präfix `academy://<id>/` bestimmt. | `module.js:99-101` | Keine Maßnahme nötig. |

## 5. App-ID, Update, Signatur, Token, Berechtigungen

**Bestätigt: nicht angefasst.**

`git diff HEAD --stat -- . ":(exclude)docs"` listet genau diese 13 Dateien: `build/build-info.json`, `payload-index.json`, `anzeige-glossar.js`, `navigation.js`, `lf3-client-anbindung.html`, `protocol.js`, `design-tokens.css`, `host.css`, `module.js`, `settings.html`, `settings.js`, `shell.css`, `shell.js`. Nicht enthalten: `package.json`, Builder-Konfiguration (App-ID), `src/updates/*`, `src/modules/manager.js`, `src/ipc.js`, `src/preload.js`, `src/window.js`, `src/protocol-path.js`, Schlüssel-/Signaturdateien, Manifeste. `academy-module.json` ist unverändert (`sizeBytes` 62017, Berechtigungen gleich). Es gibt keinen Commit und keinen Push durch die Prüfung. `main` bleibt `2e704e3`.

Grenze: Ich habe die App-ID nicht im Builder-Konfigurationsfile gelesen. Der Schluss „nicht geändert“ stützt sich darauf, dass keine solche Datei im Diff steht.

## 6. Ist die Nutzlastprüfung noch echt?

**Bestätigt: ja, nicht umgangen.**

- Die Prüfung in `src/modules/manager.js` ist nicht im Diff. Sie vergleicht pro Eintrag Größe und SHA-256 der Datei auf dem Datenträger mit dem Index (`manager.js:125-128`) und die Manifest-Größe (`manager.js:78`).
- Die Indexänderung ist eng: 249 Einträge vor und nach der Änderung, gleiche Pfadmenge, gleiche Kopffelder, genau 3 geänderte Einträge, nämlich genau die 3 geänderten Moduldateien (`anzeige-glossar.js`, `navigation.js`, `lf3-client-anbindung.html`). Es wurde nichts entfernt, hinzugefügt, gelockert oder ein Eintrag ausgelassen.
- Eigene Nachrechnung mit `docs/operation-academy/design-harmony-2b-security/nachrechnen.js` (liest nur, `git show`/Dateien, ändert nichts). Ergebnis, wörtlich: `arbeitskopieAbweichungVomIndex: []`, `stagingBlobAbweichungVomIndex: []`, `pfadmengeGleich: true`, `kopffelderGleich: true`, `geaenderteEintraege` = die 3 genannten, `webDateienGeaendertGegenHEAD` = dieselben 3.
- `node scripts/regenerate-payload-index.js --check` lief durch: 249 Einträge, 244 Text, 5 Binär, `textEintraegeGeaendert: 3`, `binaerBlobBeschaedigt: []`, `manifestSizeBytes` 62017 unverändert, `nichtImIndex: []`. Exit 1 bei `indexDateiGeaendert: true` ist erwartbar, weil das Skript gegen den Index-Blob in Git vergleicht und die Index-Datei unstaged ist (B5). Das ist kein Integritätsfehler.
- Manifest-`sizeBytes` bleibt gleich, weil die Länge des Index gleich blieb (die Größenfelder behielten ihre Stellenzahl). Das bestätigt das Skript mit `geaendert: false`.
- Wichtige Einordnung: Der Index wurde an den Inhalt angeglichen, nicht die Prüfung an den Index. Die Frage „war das legitim“ beantwortet sich daran, dass die Dateien selbst Gegenstand dieses Diffs sind und ich sie im Abschnitt 2/3 inhaltlich geprüft habe. Die Nachrechnung beweist die Konsistenz, nicht die Harmlosigkeit der Dateien.

## 7. Grenzen der Prüfung

- **Tests nicht von mir ausgeführt.** `node --test tests/design-harmony-2b-theme.test.js` (und mit `phase-l-host`) wurde dreimal von der Station abgelehnt (`shell.exec` und `verify.run`: „launches a GUI/native runtime“). Die Zahlen 26/26 und 8/8 habe ich daher **nicht** nachgelesen. Ich lese nur, dass `tests/design-harmony-2b-theme.test.js` unter anderem prüft: Allowlist, Mehrfachwert, Roh-Query nie im HTML, kein `postMessage`, CSP/Sandbox/Referrer nicht gelockert (Test Zeile 104-117), Shell schreibt nur Allowlist (Zeile 182), `module.js` URL-API (Zeile 199). Das sind überwiegend statische Quelltextprüfungen.
- **Kein Live-Lauf.** Ich habe die Academy nicht gestartet und nicht beobachtet, dass ein Modul-Frame tatsächlich von `academy:storage-set` abgewiesen wird. Das folgt aus `ipc.js:7-16` und der Frame-URL, ist aber gelesen, nicht gemessen. Gleiches gilt für Electron-Verhalten von Preload in Unterframes.
- Nicht geprüft: Barrierefreiheit, Kontrast, 200 % Vergrößerung, Screenreader (Aufgabe von GLaDOS, hier offen).
- Nur die Theme-Weitergabe. Nicht bewertet: die übrigen ungetrackten Dokumente und `tests/phase-n1-w4-qa.test.js`, andere Module, Verwaltung-Ausbildung.
- Historische Berichte (zum Beispiel `DESIGN-HARMONY-2A-SECURITY.md`) wurden nicht als Ersatz benutzt.

## 8. Empfehlung

**Eingeschränkt freigegeben für den Theme-Transport.** Gründe: Der Diff zeigt keinen neuen Nachrichtenkanal, keine gelockerte CSP oder Sandbox, keine Erweiterung von Origins oder Berechtigungen, eine Allowlist-gebundene Einspeisung, einen Shell-eigenen Speicher mit unverändert geschützter IPC-Grenze und eine echt nachgerechnete Nutzlastintegrität.

Auflagen vor dem Rollout auf weitere Module:

1. Die Testläufe (26/26, 8/8) auf einem Rechner nachlesen lassen, der sie ausführen darf, und die Zahlen gegen diesen Bericht abgleichen (Rick/GLaDOS).
2. Einmal im laufenden Programm bestätigen, dass ein Modul-Frame den Speicher nicht beschreiben kann (GLaDOS, Browser-/Fensterprüfung).
3. Beim Commit `payload-index.json` zusammen mit den drei Moduldateien erfassen (B5) und `build-info.json` getrennt entscheiden (B6).
4. B1 und B2 in die Modulregeln und die QA aufnehmen.

Eine Sperre wäre angemessen, wenn zum Beispiel ein Modul-Frame doch in den Shell-Speicher schreiben kann oder der Index ohne Anpassung der Dateien geändert würde. Beides ist im Diff nicht belegt.

Dies ist keine Produktfreigabe. Die endgültige Entscheidung liegt beim Commander.
