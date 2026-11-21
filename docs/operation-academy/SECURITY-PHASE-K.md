# SECURITY PHASE K – Sicherheitsnachprüfung DesoWorks Academy

**Prüfer:** RoboCop (Security Officer)
**Datum:** 2026-11-21
**Projekt:** DesoWorks Academy (nur dieses Repository, nur lesend)
**Branch:** `feature/phase-k-stability-trust` (per `git branch --show-current` bestätigt)
**HEAD:** `2b787e3` ("Restrict hosted web installs to the bundled modules directory.") – entspricht dem dokumentierten Stand.
**Arbeitsbaum zum Prüfzeitpunkt (nicht sauber):**
- geändert: `modules/it-systemintegration/web/module/lf3-abnahme.html`
- neu: `modules/it-systemintegration/web/js/lf3-abnahme.js`
- neu: `tests/lf3-csp.test.js`

Die Prüfung bezieht sich auf den committeten Stand `2b787e3` plus die oben genannten, noch nicht committeten LF3-Änderungen (nur soweit unten erwähnt). Frühere Berichte (SECURITY-PHASE-J*, -I*) wurden als Hinweise genutzt, nicht als Beweis. Alle Aussagen stammen aus gelesenem Quellcode. **Es wurde kein Test und kein Programm ausgeführt.**

---

## 1. Kurzfazit

| Frage | Ergebnis |
|---|---|
| Hält die Phase-J-Korrektur (Web-Module nur aus dem mitgelieferten Ordner)? | **Ja, im gelesenen Code.** Bedingung siehe 2. |
| Kann ein fremdes Paket im Code-Ausführungs-Sinn als DesoWorks auftreten? | **Nein** (Laufzeit nur aus gebündeltem Ordner, Official/Reviewed nur mit hinterlegtem Schlüssel; es ist keiner hinterlegt). |
| Kann sich ein fremdes Paket **inhaltlich** als DesoWorks ausgeben? | **Ja, Restlücke (F-01, MITTEL).** Herausgeber-Bindung ist bei `private`/`community` nur ein String-Vergleich. |
| Kritische Befunde | Keine |
| Hohe Befunde | Keine |

---

## 2. Phase-J-Korrektur: Wo und unter welcher Bedingung sie hält

**Datei:** `src/modules/manager.js`, Funktion `installFromDirectory`, Zeilen 372–382.

Bedingung: Hat das Manifest `runtime.kind === "hosted-web"`, wird `pack.root` (per `realpathSync` aufgelöst, Zeile 42) gegen jeden Eintrag in `hostedWebRoots` (ebenfalls per `realpathSync`) geprüft. Liegt das Paket nicht innerhalb, wird mit `runtime-denied` abgebrochen, bevor etwas kopiert oder in die Registry geschrieben wird.

Absicherung durch Zusatzregeln:
- `src/main.js` Z. 46–48: `hostedWebRoots` ist fest verdrahtet (`process.resourcesPath/academy-modules` bzw. `<repo>/modules`), nicht aus Nutzereingabe.
- `src/modules/spec.js` `validateRuntime` (Z. 105–130): nur `kind: "hosted-web"`, nur Herausgeber `publisher.desoworks`, nur IDs mit Präfix `desoworks.`, nur `trust: "private"`, Einstieg nur `.html`, keine `..`-Pfade.
- `src/modules/manager.js` `resolveHostedFile` (Z. 496–515): Auslieferung nur für Dateien, deren Pfad **exakt** in `manifest.payloadHashes` steht und deren Hash beim Zugriff stimmt; Pfad mit `\`, `..`, `\0` abgewiesen; sonst `markFault`.
- `src/protocol.js` / `protocol-path.js`: Modulantworten tragen `MODULE_CSP` (`script-src 'self'`, `connect-src 'self'`, `frame-src 'none'`, `frame-ancestors academy://app`), `nosniff`, `no-store`. Jede Modul-ID ist ein eigener Origin (`academy://<id>`).
- Installation anderer Pakete (ohne Laufzeit): erlaubte Dateitypen nur `.json .md .png .svg .txt` (`spec.js` Z. 11), kein `.js`/`.html`.

Ergebnis: **Die Korrektur hält**, solange (a) `hostedWebRoots` unverändert fest verdrahtet bleibt, (b) der mitgelieferte Ordner nicht durch Fremde beschreibbar ist und (c) die Prüfung in `installFromDirectory` vor jedem Schreibzugriff bleibt. Das ist der Punkt, den Regressionstests absichern sollten (siehe Empfehlung E-02).

---

## 3. Befunde (nach Schweregrad)

Einstufung: KRITISCH / HOCH / MITTEL / NIEDRIG / INFORMATIV. „Bestätigt" = im Code gelesen und nachvollzogen, aber nicht ausgeführt.

### F-01 – MITTEL (bestätigt im Code, nicht ausgeführt): Herausgeber- und ID-Bindung bei `private`/`community` nur per Selbstangabe

**Dateien:** `src/modules/manager.js` Z. 388–400 (Prüfung `publisher-mismatch`, `trust-mismatch`); `src/modules/spec.js` Z. 18–19, 165–170 (Reservierungen); `src/modules/manager.js` Z. 257–270 (`verifyTrust`).

Beobachtung:
- Reserviert sind nur der Präfix `dev.desoworks.` und die Herausgeber-ID `dev.desoworks` (beide nur mit `trust: official`).
- Die tatsächlich verwendete Kennung der gebündelten Module (`publisher.desoworks`, ID-Präfix `desoworks.`, z. B. `desoworks.it-systemintegration`) ist **nicht** reserviert.
- `publisher-mismatch` vergleicht nur `publisher.id` (String) mit dem gespeicherten Manifest. Ein Paket mit ID `desoworks.it-systemintegration`, `publisher: { id: "publisher.desoworks", name: "DesoWorks" }`, `trust: "private"`, **ohne** `runtime`, höherer Version, besteht `validateManifest`, umgeht den Webroot-Test (der greift nur bei `hosted-web`) und passt zu allen Prüfungen in Z. 388–400.

Mögliche Auswirkung (aus Code abgeleitet):
1. **Ersetzen:** Ein installiertes offizielles Hosted-Modul kann durch ein Inhaltsmodul mit gleicher ID ersetzt werden. Es wird in der Liste als Herausgeber „DesoWorks" angezeigt, übernimmt die vorhandenen Lernstände (`module_kv` hängt an der ID) und bewertet danach Aufgaben nach eigenen Antworten (`check`/`grade`). Folge: falsche oder manipulierte Lernbewertung unter dem Namen DesoWorks.
2. **Vorab-Besetzung:** Wird die ID `desoworks.*` vor der ersten Installation des offiziellen Moduls mit anderem `publisher.id` belegt, schlägt die spätere offizielle Installation mit `publisher-mismatch` fehl (Verfügbarkeit).
3. Kein Codeausführung, kein Dateizugriff: das Inhaltsmodul wird durch `sanitizeCourse` (Tags entfernt, Längen begrenzt, Antworten entfernt) gefiltert, `resolveHostedFile` liefert für Nicht-Hosted nichts aus.

Voraussetzungen: Der Nutzer muss den Ordner selbst wählen und im Dialog (`src/ipc.js` Z. 251–291) bestätigen. Der Dialog zeigt aber genau den selbstdeklarierten Herausgebernamen „DesoWorks" und `Vertrauen: private` – eine Täuschung wird dadurch nicht ausgeschlossen.

Vorhandene Tests (`tests/modules.test.js` Z. 294–331) prüfen nur Fremdherausgeber mit **anderer** Herausgeber-ID (`example.attacker`) und den Präfix `dev.desoworks.`. Ein Test mit **gleicher** Herausgeber-ID, aber ohne Schlüsselbindung, fehlt (Beleg: `fs_search` auf `tests/`).

Bewertung: MITTEL. Die Phase-J-Aussage „ein fremdes Paket gibt sich als DesoWorks aus" ist für Codeausführung behoben, für **Identitätsanzeige und Lernstandsbindung bleibt eine Restlücke**.

Empfohlene Gegenmaßnahme (keine bestehende Maßnahme entfernen, nur ergänzen), siehe Abschnitt 5:
- `desoworks.` und `publisher.desoworks` als reservierte Präfixe/IDs behandeln: nur zulässig, wenn das Paket aus `hostedWebRoots` stammt **oder** `official` mit hinterlegtem Schlüssel signiert ist; sonst `reserved-id`.
- Bei Ersetzung eines vorhandenen Moduls zusätzlich verlangen: `runtime`-Art und `publisher.id` unverändert **und** gleicher Signaturschlüssel (Schlüssel-Pinning, siehe 5).
- Regressionstest „gleiche Herausgeber-ID, fremde Herkunft, ohne Laufzeit" ergänzen.

### F-02 – NIEDRIG (bestätigt im Code): Import von Modul-Lernständen wird nicht inhaltlich geprüft

**Datei:** `src/modules/manager.js` `importModule` (Z. 565–600) und `progress` (Z. 516–533).

- Die Prüfsumme (`checksumOf`, SHA-256 ohne Schlüssel) belegt nur Unverfälschtheit gegenüber der Datei selbst, nicht Herkunft. Wer die Datei neu schreibt, berechnet die Summe selbst mit.
- Schlüssel und Werte werden unbesehen als Text eingetragen (`String(value)`), ohne Größenlimit (beim normalen Schreiben gilt 200000, Z. 527) und ohne JSON-Prüfung für den Schlüssel `progress`.
- `progress(id)` ruft später `JSON.parse(saved.value)` ohne Fehlerbehandlung (Z. 522). Ein beschädigter Wert führt zu einem Fehler beim Öffnen/Prüfen dieses Moduls (Verfügbarkeit des Moduls, nicht des Cores).
- `importModule` prüft nicht, ob die Modul-ID installiert ist (kein `row(id)`), sodass Einträge für beliebige IDs entstehen können.
- Hinweis: `importModule`/`exportModule` sind **nicht** im Preload (`src/preload.js`) und nicht in `src/ipc.js` verdrahtet. Aktuell ist das nur über direkten Aufruf im Hauptprozess erreichbar, also kein erreichbarer Angriffsweg aus der Oberfläche. Bei späterer Verdrahtung wird die Lücke relevant.

Empfehlung: Beim Import Schlüssel-Allowlist (`progress`), Größenlimit, JSON-Prüfung, Existenzprüfung der ID; `progress()` Lesepfad mit `try/catch` und Rückfall auf leeren Stand ohne Löschen.

### F-03 – NIEDRIG (bestätigt im Code): Update eines Moduls ist nicht atomar

**Datei:** `src/modules/manager.js` Z. 428–429: `if (fs.existsSync(dest)) fs.rmSync(dest …)` vor `renameSync(incoming, dest)`.

Bricht `renameSync` nach dem Löschen ab, zeigt die Registry weiter auf ein fehlendes Verzeichnis. Beim nächsten Öffnen markiert `readCourse` das Modul als `faulted` (Z. 289–296) statt Dateien still zu ändern; es entsteht also kein Sicherheitsproblem, sondern ein Verfügbarkeits- und Zuverlässigkeitsproblem. Außerdem bleibt beim Versionswechsel das Verzeichnis der Vorversion liegen (`dest` enthält die Version; `uninstall` löscht nur die aktuelle). Das ist Restmüll, keine Rechteausweitung.

Empfehlung: Registry-Update und Verzeichniswechsel in eine Reihenfolge bringen, die bei Abbruch den alten Stand erhält (umbenennen statt löschen, erst nach Erfolg altes Verzeichnis entfernen).

### F-04 – NIEDRIG (bestätigt im Code): Zeitfenster zwischen Hash-Prüfung und Kopie

**Datei:** `src/modules/manager.js` `readPackage` (Z. 41–83) hasht die Quelldateien, `installFromDirectory` kopiert sie später (Z. 409–427) ohne erneute Prüfung des Hashes der Kopie.

Wer die Quelldatei in diesem Fenster austauscht, schreibt ein anderes Ziel als gehasht. Das wird beim ersten Öffnen erkannt (`readCourse` vergleicht den Inhalt mit dem aufgezeichneten Hash, Z. 297–303; `resolveHostedFile` Z. 510), das Modul wird dann `faulted` statt ausgeführt. Ausnutzbar nur mit lokalem Schreibzugriff auf den Quellordner. Kein praktisches Risiko, aber Härtungsmöglichkeit: Hash der Kopie nach dem Kopieren erneut berechnen.

### F-05 – NIEDRIG (bestätigt im Code): Selbstsignierte Pakete werden wie „signiert" dargestellt

**Dateien:** `src/modules/manager.js` Z. 266–268 (Prüfung gegen den im Paket mitgelieferten Schlüssel), Z. 253 (`signature: "present"`), Z. 445–447 (Meldung „Modul installiert." bei vorhandener Signatur).

Eine Signatur mit mitgeliefertem Schlüssel beweist nur, dass das Paket seit dem Signieren unverändert ist, nicht, wer es signiert hat. Die Oberfläche/Meldung unterscheidet nicht zwischen „Signatur gültig, Schlüssel unbekannt" und „Schlüssel vertrauenswürdig". Nutzer könnten das als Herkunftsnachweis lesen. Positiv: für `official`/`reviewed` wird der Schlüssel gegen `trustedKeys` geprüft (Z. 260–265).

### F-06 – INFORMATIV: `trustedKeys` ist leer, Official/Reviewed-Installation damit praktisch gesperrt

**Datei:** `src/main.js` Z. 43–49 übergibt kein `trustedKeys`; `src/modules/manager.js` Z. 203 nimmt dann leere Listen. Folge: Jedes Paket mit `trust: official|reviewed` wird mit `signature-rejected` abgewiesen. Das ist sicher (fail-closed), bedeutet aber: Die Vertrauensstufe „Offiziell mit Signatur" existiert im Code, ist im Produkt aber nicht aktiv. Das gebündelte IT-Modul läuft deshalb als `private` mit Hosted-Runtime nur über den Webroot-Schutz (siehe 2). Das ist der eigentliche Grund, warum der Ordnerschutz tragend ist.

### F-07 – INFORMATIV: Update-Pfad bleibt in der gepackten App geschlossen

**Dateien:** `src/main.js` Z. 57–59 (`feedUrl` leer wenn gepackt, `publisherThumbprint` leer wenn gepackt); `src/updates/service.js` Z. 356–363; `src/updates/signature.js`.

Gelesen: Update nur für Kanal `stable`, Repo gepinnt (`DesoWorks/Academy`, `feed.js` Z. 6, 54–76), nur HTTPS auf GitHub-Hosts, SHA-256-Prüfung gegen Begleitdatei, Downgrade-Sperre, Sicherung vor Installation, Authenticode-Prüfung gegen erwarteten Fingerabdruck (`Get-AuthenticodeSignature`, Status `Valid` **und** Fingerabdruck gleich). Da der Fingerabdruck in der gepackten App leer ist, endet `installPlan` immer mit „Es wurde nichts gestartet". Updates sind damit **fail-closed**, aber im Produktivbetrieb nicht nutzbar. Vor einem echten Update-Release muss ein fest eingebauter erwarteter Fingerabdruck (nicht per Umgebungsvariable) festgelegt werden. Die Prüfsumme aus demselben Release schützt gegen Beschädigung, nicht gegen kompromittierte Release-Assets; der Schutz dort ist allein die Authenticode-Prüfung. Ein kleines Restfenster zwischen Signaturprüfung (`installPlan`) und `spawn` (`main.js` Z. 95–98) ist aus dem Code ersichtlich, erfordert lokalen Schreibzugriff auf das Updateverzeichnis.

### F-08 – INFORMATIV: Weitere gelesene Schutzmaßnahmen (bestätigt gelesen)

- **Modulpfade:** `assertRelativeFile`/`assertPayloadPath` (`spec.js`), `readPackage`/`readPayload` (`manager.js`): kein `..`, kein absoluter Pfad, keine Laufwerksangabe, kein `\`, keine Symlinks (per `lstatSync` und `realpathSync`), Größen- und Dateianzahlgrenzen, Doppelungen abgewiesen, Hashliste des Index geprüft.
- **Deinstallation:** `uninstall` (Z. 461–478) verlangt Bestätigung, löscht nur wenn `install_path` exakt `packageRoot/<id>/<version>` ist und kein Symlink; Lernstände bleiben (`module_kv`). Test dazu: `tests/modules.test.js` Z. 333–345.
- **Wiederinstallation:** Die Registry-Zeile bleibt mit Status `uninstalled` bestehen. Dadurch gelten `publisher-mismatch`, `trust-mismatch` und `downgrade-blocked` auch nach Deinstallation (Test Z. 314–331). Nebenwirkung: Nach Deinstallation einer neueren Version kann nur dieselbe oder eine höhere Version wieder installiert werden.
- **Manifest:** Pflichtfelder, Format, ID-Muster, Versionsformat, erlaubte Rechte-Liste; gesperrt: `shell`, `filesystem`, `node`, `core-admin`, `native`, `process`; `ide.workspace`, `network`, `script` sind Official-only und noch nicht freigegeben (`spec.js` Z. 22–33).
- **Core-Zugriff:** Hauptfenster mit `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` (`src/window.js` Z. 69–78). Preload (`src/preload.js`) ist nur im Hauptframe wirksam (`nodeIntegrationInSubFrames` nicht gesetzt). Zusätzlich lehnt jeder IPC-Kanal in `src/ipc.js` Anfragen ab, deren `senderFrame.url` nicht mit `academy://app/` beginnt (`fromApp`, Z. 5–8). `setWindowOpenHandler` verweigert, `will-navigate` nur auf `academy://app/`, `will-attach-webview` verhindert. Berechtigungsanfragen werden verweigert (`main.js` Z. 37–38). Hosted-Modul-Frame: `sandbox="allow-scripts allow-forms allow-same-origin"` (`src/renderer/module.js` Z. 87) ohne Top-Navigation; `allow-same-origin` ist hier vertretbar, weil der Origin (`academy://<id>`) ein anderer ist als der des Core (`academy://app`).
- **SQLite-Isolierung:** Zwei getrennte Dateien: Core `academy.sqlite` (`src/store/database.js`), Module `modules.sqlite` (`src/modules/registry.js`). Modulspeicher `module_kv` ist durch `module_id` getrennt, alle Zugriffe parametrisiert (Prepared Statements; keine Stringverkettung von Nutzerwerten). Defekte oder neuere Moduldatenbank blockiert nur die Modulverwaltung, löscht nichts (Z. 21–38).
- **Modulzugriff auf Core-Daten:** In den gelesenen Hosted-Dateien des IT-Moduls (`modules/it-systemintegration/web/**`) fand `fs_search` keinen Treffer auf `academyDesktop`, `postMessage`, `window.parent`, `window.top`.
- **Katalog:** `src/modules/catalog.js` `resolveBundledPackage`: Pfad muss mit `modules/` beginnen, kein `..`, `realpath` muss unter dem Programm-Modulordner liegen; `src/ipc.js` Z. 399 prüft zusätzlich, dass die ID im Paket der Katalog-ID entspricht.
- **Hinweis zu CSP:** Beide CSPs enthalten `style-src 'self' 'unsafe-inline'` (`protocol-path.js` Z. 26, 40). `script-src` ist strikt `'self'`. Bekannte Einschränkung, kein Skriptrisiko; Ziel für eine spätere Härtung.

### F-09 – INFORMATIV (Zustand des Arbeitsbaums, nicht committet): LF3-Korrektur und Nutzlastindex

Der Arbeitsbaum enthält die noch nicht committete LF3-Änderung. `modules/it-systemintegration/content/payload-index.json` ist laut `git status` **nicht** geändert und enthält für `web/module/lf3-abnahme.html` weiterhin den Hash `40b8646a…b126` (Größe 24488); einen Eintrag für `web/js/lf3-abnahme.js` fand `fs_search` nicht. Nach den Regeln in `manager.js` (`readPayload`, `resolveHostedFile`) würde ein geänderter Dateiinhalt ohne aktualisierten Index entweder die Installation mit `integrity` abweisen oder die Datei nicht ausliefern. Das ist **keine Schwachstelle, sondern der Integritätsschutz, der wie vorgesehen arbeitet**, und ein klarer Auftrag für Jarvis: Index und `manifest.sizeBytes` (aktuell 61866; bezieht sich auf die Dateien der Liste `files`) nach der Änderung neu erzeugen, dann nachprüfen. Ob der Hash der geänderten Datei inzwischen zum Index passt, habe ich nicht berechnet.

---

## 4. Was ich nicht ausführen konnte / nicht geprüft habe

- **Keine Tests ausgeführt** (kein `npm test`, keine Einzeltests). Alle Aussagen beruhen auf Lektüre. Aussagen wie „besteht" betreffen die Codelogik, nicht ein gemessenes Testergebnis.
- **Kein Laufzeitnachweis** für F-01 (Ersetzungsszenario nicht praktisch durchgespielt; Ableitung aus `spec.js` und `manager.js`).
- **Keine Prüfung der gepackten Windows-Anwendung** (Installationspfad, Schreibrechte des Ressourcenordners, `resources\academy-modules`). Die Tragfähigkeit von Abschnitt 2 hängt davon ab, dass dieser Ordner für normale Nutzer nicht beschreibbar ist; bei Installation in ein Nutzerverzeichnis (z. B. `%LOCALAPPDATA%`) ist er für denselben Nutzer beschreibbar. Das ist unverändert ein Angreifer mit Schreibrechten in der Programminstallation und damit keine Ausweitung, sollte aber bewusst bleiben.
- **Keine Prüfung der Signatur des Windows-Builds** (Testbuild laut Auftrag unsigniert).
- **Nicht gelesen:** der gesamte Hosted-Inhalt des IT-Moduls im Detail (rund 150 HTML/JS-Dateien) und `src/lab-run.js`, `src/extensions/ports.js`, `src/modules/ide.js`, `src/modules/tutor.js`, `src/renderer/*` (außer `module.js`). Die Aussage „kein Zugriff auf `academyDesktop`" beruht auf einer Textsuche, nicht auf Code-Review aller Dateien. Wie der Fortschritt im Hosted-Modul tatsächlich gespeichert wird, ist Gegenstand von QA; die Suche nach `localStorage` im `web/js`-Ordner fand keinen Treffer.
- **Keine Abhängigkeitsprüfung** (`npm audit` o. ä. nicht ausgeführt, `package.json` nicht ausgewertet).
- **Kein Test der Windows-Installation, kein Update-Durchlauf, keine Prüfung der Migration alter Lernstände.**
- **Keine Netzwerk- oder Portprüfungen** (nicht beauftragt).
- Historische Berichte (`SECURITY-PHASE-J*.md`) wurden nicht als Beweis übernommen.

---

## 5. Konzept: zwei Vertrauensstufen (nur Konzept, nicht implementiert)

Grundsatz: **Keine bestehende Sicherheitsmaßnahme entfällt.** Das Konzept erweitert das System; die heutige Beschränkung auf den mitgelieferten Modulordner bleibt als Rückfallebene für alles bestehen, was nicht ausdrücklich in einer der beiden Stufen zugelassen ist.

### Stufe A – Offizielle Module

| Merkmal | Festlegung |
|---|---|
| Herausgeber | `publisher.desoworks`, reserviert; zusätzlich ID-Präfix `desoworks.` reserviert (schließt F-01). |
| Herkunft | Aus dem mitgelieferten Ordner **oder** über den kontrollierten Veröffentlichungsweg (siehe unten). |
| Signatur | Pflicht: Ed25519 (`signature.js`), Schlüssel im Core fest hinterlegt (`trustedKeys.official`), Rotation über neue Core-Version, Widerruf durch Eintrag in einer Sperrliste, die mit dem Core ausgeliefert wird. |
| Veröffentlichung | Kontrolliert: Freigabe durch den Commander, Build in sauberer Umgebung, Signatur mit einem Schlüssel, der nicht im Repository liegt (Offline-/Hardware-Schlüssel), Veröffentlichung nur als Teil eines signierten Core-Releases oder als signiertes Paket von gepinntem Ort. |
| Rechte | Heutige Rechteliste; neue Rechte (`ide.workspace`, `network`, `script`) nur für diese Stufe und nur einzeln per Core-Release freigegeben. |
| Laufzeit | `hosted-web` zulässig, bei Signatur zusätzlich zur Ordnerbindung (zwei unabhängige Bedingungen statt einer). |
| Updates | Gleiche Herausgeber-ID, gleicher Schlüssel, höhere Version, keine Rückstufung, kein Wechsel der Vertrauensstufe. |

### Stufe B – Community-Module

| Merkmal | Festlegung |
|---|---|
| Identität | Eigene Herausgeber-ID mit eigenem Schlüssel; Herausgeber-ID wird an den **öffentlichen Schlüssel** gebunden (Schlüssel-Pinning beim ersten Installieren, wie bei SSH „trust on first use"). Eine spätere Version mit anderem Schlüssel wird nur nach ausdrücklicher Nutzerbestätigung mit deutlicher Warnung akzeptiert. |
| Namensraum | Eigener Präfix je Herausgeber (z. B. `community.<herausgeber>.<modul>`); `desoworks.*` und `dev.desoworks.*` sind für Stufe B gesperrt. |
| Signatur | Pflicht: eigene Ed25519-Signatur. Gültige Signatur beweist **Unverändertheit und Schlüsselkontinuität**, nicht Vertrauenswürdigkeit. Die Oberfläche trennt „Signatur gültig, Schlüssel unbekannt" von „Schlüssel vertrauenswürdig" (schließt F-05). |
| Deklarierte Rechte | Rechte stehen im Manifest und sind Teil der Signatur. Beim Installieren zeigt der Dialog die Rechte in Klartext; es gelten nur die Rechte, die der Nutzer bestätigt. Die gesperrte Liste (`shell`, `filesystem`, `node`, `core-admin`, `native`, `process`) bleibt für die Stufe B **dauerhaft gesperrt**. `network` und `script` bleiben Stufe A vorbehalten, bis eigene Prüfung vorliegt. |
| Laufzeit | Eingeschränkt: zunächst nur Inhaltsmodule (wie heute). Eine spätere Web-Laufzeit nur in zusätzlich isolierter Form: eigener Origin je Modul (vorhanden), strikte CSP, kein `allow-same-origin` ohne Notwendigkeit, kein Zugriff auf `academyDesktop`, kein Netzwerk, Speicher nur im eigenen Namensraum, Größen- und Zeitlimits; bis zum Nachweis bleibt `runtime-denied` bestehen. |
| Vertrauen | **Kein automatisches Vertrauen.** Installation nur durch ausdrückliche Handlung des Nutzers, Anzeige „Community – nicht von DesoWorks geprüft", dauerhaft sichtbar in Liste und Kopfzeile des Moduls. Kein Auto-Update; Aktualisierung ist ein neuer Installationsvorgang mit Vergleich von Rechten und Schlüssel. |
| Lernstände | Weiterhin je Modul-ID getrennt; Deinstallation bewahrt Lernstände (wie heute); Übernahme der ID durch anderen Schlüssel ausgeschlossen. |
| Rücknahme | Sperrliste auch für Community-Schlüssel; gesperrte Module werden deaktiviert, nicht gelöscht, Lernstände bleiben. |

### Voraussetzungen vor Umsetzung der Stufe B (Reihenfolge)
1. F-01 schließen (Reservierung `desoworks.*`, Schlüssel-Pinning auch für Ersetzungen).
2. Anzeige der Vertrauenslage in Dialog und Liste vereinheitlichen (F-05).
3. Prüfpfad für Importdaten härten (F-02).
4. Eigene Sicherheitsprüfung für jede Stufe-B-Laufzeit vor Freigabe; Commander entscheidet.

### Wichtig
Die heutige Beschränkung auf den mitgelieferten Ordner **bleibt bestehen** und wird nicht abgeschwächt. Sie ist zugleich eine Obergrenze: Stufe-B-Module erhalten keine Hosted-Laufzeit, solange die obigen Bedingungen und eine eigene Prüfung nicht erfüllt sind.

---

## 6. Empfehlungen (priorisiert)

| Nr. | Priorität | Empfehlung | Bezug |
|---|---|---|---|
| E-01 | Mittel | `desoworks.`/`publisher.desoworks` reservieren und nur aus dem Ordner oder mit Official-Signatur zulassen; Ersetzung an gleiche Laufzeit und gleichen Schlüssel binden; Regressionstest ergänzen. | F-01 |
| E-02 | Mittel | Regressionstest, der `runtime-denied` für ein Hosted-Paket außerhalb von `hostedWebRoots` sowie die Ordnerbedingung in `installFromDirectory` absichert, falls noch nicht vorhanden (`tests/hosted-module.test.js` wurde in dieser Prüfung nicht gelesen). | Abschnitt 2 |
| E-03 | Niedrig | Import von Modul-Lernständen validieren, `progress()` fehlertolerant. | F-02 |
| E-04 | Niedrig | Modulupdate atomar; Hash nach Kopie erneut prüfen. | F-03, F-04 |
| E-05 | Niedrig | Oberfläche: Signatur ohne vertrauenswürdigen Schlüssel nicht als „signiert" darstellen. | F-05 |
| E-06 | Vor Update-Release | Erwarteten Authenticode-Fingerabdruck fest in die gepackte App einbauen; Updates erst danach aktivieren. | F-07 |
| E-07 | Jarvis, nach LF3-Fix | Nutzlastindex und `sizeBytes` neu erzeugen, danach erneute Nachprüfung durch RoboCop. | F-09 |
| E-08 | Später | `style-src 'unsafe-inline'` abbauen. | F-08 |

---

## 7. Sicherheitsempfehlung

Für den **Testbuild** und die Fortführung von Phase K: **keine Blockade durch einen kritischen oder hohen Befund.** Die Phase-J-Korrektur trägt im gelesenen Code.

Vor einer **Freigabe für Dritte oder für Community-Module** empfehle ich, F-01 zuerst zu schließen und danach eine erneute Nachprüfung (mit tatsächlich ausgeführten Tests) durchzuführen. Die Freigabeentscheidung liegt beim Commander.

*Grenzen der Prüfung: siehe Abschnitt 4. Es wurde kein Quellcode verändert, kein Commit erstellt, nichts gepusht. Einzige Schreibaktion: diese Datei.*
