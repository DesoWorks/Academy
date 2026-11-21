# Sicherheitsprüfung Phase J – IT-Systemintegration als hosted-web-Modul

**Prüfer:** RoboCop (Security Officer, unabhängig)
**Projekt:** DesoWorks Academy (`D:\Desoworks\Workspace\Academy`)
**Stand:** Branch `feature/phase-j-it-module`, HEAD `4a93e1a` ("Add the IT training module as a hosted Academy package."), Arbeitsbaum sauber, Branch trackt `origin/feature/phase-j-it-module`.
**Datum:** 2026-11-21
**Art der Prüfung:** rein lesend, statische Codeprüfung plus Ausführung der vorhandenen Tests. Keine Codeänderung, keine Rechteänderung, keine Laufzeit-/Angriffstests, keine Secrets gelesen oder ausgegeben.

## 1. Prüfgegenstand

Gelesen und bewertet: `src/modules/spec.js`, `src/modules/manager.js`, `src/protocol.js`, `src/ipc.js`, `modules/it-systemintegration/academy-module.json`. Zusätzlich, weil für die Fragen nötig: `src/modules/catalog.js`, `src/protocol-path.js`, `src/main.js`, `src/window.js`, `src/preload.js`, `src/renderer/module.js` (Einbettung), `catalog/official.json` und eine Stichwortsuche über die Nutzlast `modules/it-systemintegration/web/`.

Testlauf: `node --test tests/hosted-module.test.js tests/modules.test.js` -> 20 von 20 bestanden.

## 2. Gesamtergebnis

**Kein Stopp für den Phase-J-Stand im lokalen, privaten Betrieb** (gebündeltes Paket, Installation nur per Commander-Dialog).
**Bedingter Stopp für jede Verteilung oder Fremdpaket-Annahme:** Befund F1 muss vorher behoben sein.

Die endgültige Freigabe liegt beim Commander. Dies ist eine Sicherheitsempfehlung, keine Produktionsfreigabe.

| ID | Schwere | Status | Stopp? |
|----|---------|--------|--------|
| F1 | MITTEL | bestätigt (Code) | Nein für lokal. Ja vor Verteilung/Fremdpaketen |
| F2 | NIEDRIG | bestätigt (Code) | Nein |
| F3 | NIEDRIG | bestätigt (Code), Wirkung nicht live getestet | Nein |
| F4 | NIEDRIG | bestätigt (Code) | Nein |
| F5 | INFORMATIV | Beobachtung | Nein |
| F6 | INFORMATIV | Beobachtung | Nein |

## 3. Antworten auf die vier Prüffragen

### 3.1 Herausgeberbindung
**Teilweise wirksam.** Für bereits installierte IDs: `installFromDirectory` (manager.js 376-388) vergleicht `publisher.id` mit dem gespeicherten Manifest und lehnt bei Abweichung mit `publisher-mismatch` ab. Auch Vertrauensstufen-Wechsel (`trust-mismatch`) und Downgrade werden blockiert. Der Test "deinstallierte Modul-ID bleibt an den bisherigen Herausgeber gebunden" belegt das.

**Schwäche:** `publisher.id` ist ein frei deklarierter String ohne kryptografische Bindung (siehe F1).

### 3.2 Modul-ID-Schutz
**Wirksam.** `dev.desoworks.it-ausbildung` wird dreifach gesperrt: spec.js 165 (`reserved-id`), manager.js 389 (`install`) und manager.js 469 (`open` gibt "nicht installiert"). Jede ID mit Präfix `dev.desoworks.` verlangt `trust: official` und damit eine hinterlegte Ed25519-Signatur. Die Modul-ID `desoworks.it-systemintegration` liegt außerhalb des reservierten Präfixes. Es gibt dort jedoch keinen Schutz außer der Herausgeberprüfung aus 3.1 (F1).

### 3.3 Bekommt hosted-web Node oder Core-IPC?
**Nein, nach Code- und Konfigurationslage.** Belege:
- `window.js`: `nodeIntegration:false`, `contextIsolation:true`, `sandbox:true`. `nodeIntegrationInSubFrames` ist nirgends gesetzt (Suche in `src/`: kein Treffer), der Electron-Standard ist aus. Der Preload mit `academyDesktop` läuft damit nur im Hauptframe.
- protocol.js: Die Bridge (`/__desktop/bridge.js`) wird nur für Host `app` in HTML injiziert. `serveModule` liefert Modul-HTML unverändert aus.
- ipc.js: Jeder Handler prüft `fromApp(event)` -> `senderFrame.url` beginnt mit `academy://app/`. Ein Modul-Frame hat die URL `academy://<modul-id>/...`. Die ID `app` ist nicht möglich: `ID_PATTERN` verlangt mindestens ein Trennzeichen, `app.x` ist ein anderer Host als `app`.
- `module.js` bettet mit `sandbox="allow-scripts allow-forms allow-same-origin"` ein, ohne `allow-top-navigation`, `allow-popups`, `allow-modals`. `setWindowOpenHandler` verweigert Popups.
- MODULE_CSP: `script-src 'self'`, `connect-src 'self'`, `frame-src 'none'`, `object-src 'none'`, `frame-ancestors academy://app`, `form-action 'self'`.
- Spec: Rechte `shell`, `filesystem`, `node`, `core-admin`, `native`, `process` sind verboten. `network`, `script`, `ide.workspace` verlangen `official` und sind nicht freigegeben. Das Modul fordert nur `content.read` und `progress.write`.
- Nutzlast `web/`: Keine Treffer für `eval(`, `new Function`, `postMessage`, `window.top/parent`, `window.open`, `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `academy://`, `__desktop`, `bridge`. Keine `http(s)://`-Adressen in JS/HTML/CSS.

Grenze: Das ist Code- und Konfigurationsnachweis. Ein Laufzeittest (z. B. `window.academyDesktop` im Modul-Frame) wurde nicht gemacht, weil das ein aktiver Test wäre.

### 3.4 Kann der Katalogpfad aus dem Paket ausbrechen?
**Nein.** `resolveBundledPackage` (catalog.js 32-66) verlangt Präfix `modules/`, verbietet `..` und absolute Pfade, löst gegen eine feste Wurzel auf und prüft danach per `realpathSync` die Einordnung (Symlinks werden aufgelöst). Ein leerer Rest (`modules/`) wird abgewiesen. `ipc.js` 399 prüft zusätzlich `preview.id === id`. `readPackage` prüft pro Datei `lstat` (keine Symlinks) und `realpath`. `installFromDirectory` prüft die Zielpfade ein zweites Mal. Test "catalog resolution stays inside the bundled modules directory" bestanden.

### 3.5 Ermöglicht eine Deinstallation fremden Zugriff auf Lernstände?
**Nein, mit der Einschränkung aus F1.**
- `uninstall` löscht nur `packageRoot/<id>/<version>`, bestätigt den Pfad vorher gegen `install_path` und verweigert Symlinks. Die Registry-Zeile bleibt mit Status `uninstalled` (inklusive Manifest und Herausgeber), `module_kv` bleibt unberührt.
- Weil die Zeile erhalten bleibt, greift die Herausgeberprüfung auch nach der Deinstallation. Ein anderer Herausgeber kann die ID nicht übernehmen (Test vorhanden).
- Lernstände in `module_kv` sind nach `module_id` getrennt. Es gibt keinen IPC-Weg, den ein Modul-Frame erreicht. `exportModule`/`importModule` sind nicht über IPC verdrahtet.

## 4. Befunde

### F1 – MITTEL – hosted-web-Freigabe und ID-Besitz beruhen auf einem selbst deklarierten Herausgeber
**Beobachtet:** `validateRuntime` (spec.js 114-119) erlaubt hosted-web, wenn `publisher.id === "publisher.desoworks"`, die ID mit `desoworks.` beginnt und `trust === "private"`. Der Wert steht im Manifest des Pakets selbst. Es gibt keine Signatur, keine Prüfsumme gegen eine gebündelte Referenz und keine Bindung an den Katalogpfad. `installFromDirectory` gilt für beliebige Ordner aus dem Ordnerdialog (`academy:modules-install`) genauso wie für gebündelte Pakete. Der Installationsdialog zeigt "Herausgeber: DesoWorks", ebenfalls aus dem Manifest.
Der vorhandene Test "a foreign publisher cannot ship a hosted web runtime" prüft nur einen *anderen* Herausgeberwert. Ein Paket, das `publisher.desoworks` einfach behauptet, wird nicht getestet.

**Mögliche Auswirkung:** Ein manipuliertes Paket aus einem lokalen Ordner, das sich als DesoWorks ausgibt, erhält (a) JavaScript-Ausführung im eigenen Origin `academy://<id>/` und (b) bei gleicher ID (`desoworks.it-systemintegration`) und gleicher oder höherer Version die Übernahme des bestehenden Moduleintrags samt Lernständen aus `module_kv` und aus dem Browserspeicher dieses Origins (siehe F2). Ein Ausbruch in den Core ist durch 3.3 nicht gegeben, die Wirkung bleibt auf Täuschung (Phishing in der Lernoberfläche) und Lernstände dieses Moduls begrenzt.

**Voraussetzungen / vorhandene Schutzmaßnahmen:** Der Nutzer muss den Ordner selbst wählen und im Dialog bestätigen. Das Paket bleibt auf `private` und ohne erweiterte Rechte. Prüfsummen schützen nur die Integrität nach der Installation, nicht die Herkunft.

**Empfehlung:**
1. hosted-web nur zulassen, wenn das Paket über `resolveBundledPackage` (Katalog der Anwendung) kommt, oder wenn Manifest-Hash und ID gegen eine in der Anwendung hinterlegte Allowlist passen.
2. Alternativ: hosted-web erst mit `reviewed`/`official` und gültiger, hinterlegter Signatur.
3. Test ergänzen: Fremdpaket mit `publisher.desoworks` und hosted-web aus einem Ordner muss abgewiesen werden.
4. Im Installationsdialog unsignierte Herausgeber deutlich als "nicht verifiziert" kennzeichnen.

**Stopp:** Nein für den lokalen Phase-J-Betrieb. **Ja** vor Verteilung, Online-Katalog oder Annahme von Paketen Dritter.

### F2 – NIEDRIG – Deinstallation lässt Lernstände ohne Löschweg zurück, Origin-Speicher wird nicht bereinigt
**Beobachtet:** `uninstall` entfernt Moduldateien und behält `module_kv` bewusst ("Lernstände dieses Moduls bleiben liegen"). Das hosted Modul speichert seine Stände über `localStorage` im Origin `academy://desoworks.it-systemintegration` (viele `web/js/*.js` nutzen Browserspeicher). In `src/` gibt es kein `clearStorageData` und keine eigene Session-Partition. Der Origin-Speicher bleibt daher nach Deinstallation bestehen. Einen Weg, die Stände gezielt und bestätigt zu löschen, gibt es für Module nicht.
**Auswirkung:** Kein fremder Zugriff (siehe 3.5), aber Datenschutz: Lernstände sind nicht ohne Weiteres entfernbar. Verstärkt F1 bei ID-Übernahme.
**Empfehlung:** Optionale, bestätigte Aktion "Lernstände dieses Moduls löschen" (module_kv und Origin-Speicher). Lernstände des hosted Moduls dokumentieren (wo sie liegen, wie sie exportiert werden).
**Stopp:** Nein.

### F3 – NIEDRIG – Navigation innerhalb des Modul-Frames ist nicht eingeschränkt
**Beobachtet:** `will-navigate` in window.js gilt nur für den Hauptframe. Es gibt keinen Handler für Navigation in Unterframes. `MODULE_CSP` hat keine Navigationsbeschränkung. Modulcode könnte seinen eigenen iframe auf eine externe URL umleiten und dort fremden Inhalt in der Lernoberfläche anzeigen.
**Auswirkung:** Phishing/Täuschung. Kein IPC-Zugriff, weil `fromApp` die URL prüft und der Preload in Unterframes nicht läuft. Die Nutzlast des gebündelten Moduls enthält keine externen Adressen und keine Navigations-APIs (Suche s. o.). Live nicht getestet.
**Empfehlung:** `will-frame-navigate` bzw. `webRequest`-Filter, der Navigation auf `academy://` begrenzt.
**Stopp:** Nein.

### F4 – NIEDRIG – Zeitfenster zwischen Vorschau und Installation
**Beobachtet:** `preview()` und `installFromDirectory()` lesen das Paket jeweils neu (ipc.js 263/287, 395/423). Zwischen Dialog und Installation kann sich ein beschreibbarer Quellordner ändern. Der Installationsdialog zeigt dann Daten des ersten Lesens. Das Paket wird aber beim zweiten Lesen vollständig neu validiert. Zwischen Hash und Kopie (manager.js 397-415) gespeicherte Hashes stammen aus dem Lesen, eine Änderung führt später zu `module-faulted` (fail-closed).
**Auswirkung:** Gering, setzt lokalen Schreibzugriff auf den Quellordner voraus. Beim gebündelten Katalogpfad (Programmordner) praktisch ohne Relevanz.
**Empfehlung:** Vorschau und Installation auf demselben eingelesenen Paketobjekt ausführen oder die Manifest-Hash-Bindung zwischen beiden Schritten prüfen.
**Stopp:** Nein.

### F5 – INFORMATIV – iframe `sandbox` mit `allow-scripts allow-same-origin`
Diese Kombination hebt die Sandbox auf, wenn der Inhalt dieselbe Herkunft wie die einbettende Seite hat. Hier ist die Herkunft je Modul eigen (`academy://<id>` gegenüber `academy://app`), daher kein Ausbruch. Das Schutzprinzip hängt am Hostnamen-Isolationsschema. Ein Regressionstest, der sicherstellt, dass Modulinhalt nie von Host `app` ausgeliefert wird, wäre sinnvoll.

### F6 – INFORMATIV – Weitere Beobachtungen
- `lf3-abnahme.html` enthält ein Inline-`<script>`. `MODULE_CSP` (`script-src 'self'`) blockiert es voraussichtlich. Sicherheitlich korrekt, funktional möglicherweise defekt. **Für GLaDOS** zur Prüfung (nicht live verifiziert).
- Ein privates Paket mit eigener, selbst mitgelieferter Signatur wird als `signature: present` angezeigt und mit Hinweis "Modul installiert." (Stufe `info`) protokolliert. Es gilt nur als intern konsistent, nicht als vertrauenswürdig. Anzeige sollte das unterscheiden.
- Bei einer Neuinstallation wird das Zielverzeichnis vor dem DB-Update ersetzt (manager.js 416-432). Ein Fehler dazwischen lässt Dateien und Registry auseinanderlaufen. Fail-closed durch Hash-Prüfung beim Öffnen.
- Eine gleiche Version vom selben Herausgeber ersetzt die Installation (nur `<` wird blockiert). Für F1 relevant.
- `decodeURIComponent(url.hostname)` in `serveModule` kann bei fehlerhafter Kodierung werfen. Kein Sicherheitsrisiko, aber Fehlerbehandlung fehlt.
- `resolveHostedFile` liefert nur Dateien aus `payloadHashes` (Allowlist) und prüft den Hash bei jedem Abruf. Das ist die stärkste Einzelmaßnahme der Lösung.

## 5. Grenzen der Prüfung
- Nur statische Prüfung und vorhandene Tests. Kein Start der Anwendung, keine Laufzeitprüfung von Preload, CSP oder Frame-Navigation.
- Nutzlast nur per Stichwortsuche geprüft, nicht Zeile für Zeile gelesen (rund 190 Dateien).
- Nicht geprüft: Abhängigkeiten auf bekannte Schwachstellen, Updatemechanismus (`src/updates`), Signaturmodul, Build-/Paketkonfiguration (ob das Paket wie erwartet unter `resources` landet), `src/store`, `src/renderer` außer der Einbettung.
- Die Prüfung ersetzt keine spätere Nachprüfung nach Korrekturen.

## 6. Empfohlene Reihenfolge
1. F1 beheben (Pflicht vor Verteilung), danach Nachprüfung durch RoboCop.
2. F3 und F2 als Härtung in Phase K einplanen.
3. F6 (Inline-Skript) an GLaDOS zur Funktionsprüfung.
