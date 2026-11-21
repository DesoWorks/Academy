# Sicherheitsnachprüfung Phase L – Module Experience & Corporate Identity

**Projekt:** DesoWorks Academy (`D:\Desoworks\Workspace\Academy`)
**Prüfer:** RoboCop, Security Officer
**Datum:** 2026-11-21
**Prüfgegenstand:** Branch `feature/phase-l-module-experience`, Commit `ab80dfb`
**Vergleichsstand:** `aad0187` (Ende Phase K)
**Art der Prüfung:** nur lesend (Code-Review des Diffs, ein Testlauf). Es wurde kein Quellcode verändert. Diese Datei ist die einzige Schreibaktion.

## 1. Gesamturteil

**Keine blockierenden Befunde. Der lokale Betrieb ist nicht blockiert.**
Phase L erweitert die Angriffsfläche nicht. Es gibt keine neue Berechtigung, keine gelockerte CSP und keine Änderung an Sandbox oder IPC. Ein Befund der Stufe MITTEL stammt aus früheren Phasen und wird hier nur sichtbar gemacht (siehe 3.1).

Die abschließende Freigabe liegt beim Commander. Ich erteile keine Produktionsfreigabe.

## 2. Prüfpunkte

| # | Prüfpunkt | Ergebnis | Nachweis |
|---|-----------|----------|----------|
| 1 | CSP nicht gelockert | Bestätigt, mit Hinweis auf 3.1 | `src/protocol-path.js` taucht im Diff `aad0187..ab80dfb` nicht auf. `CSP` und `MODULE_CSP` sind byte-identisch zu Phase K. `script-src 'self'` unverändert. `frame-src 'none'` und `frame-ancestors academy://app` für Module unverändert. |
| 2 | Kein Inline-Skript durch `injectHost` | Bestätigt | `HOST_LINKS` ist eine Konstante aus zwei `<link rel="stylesheet">`. Kein `<script>`, kein Ereignisattribut, keine Benutzereingabe in der Ersetzung. Das Ersetzungsmuster enthält kein `$`. Test `Modul-HTML erhält die zentralen Academy-Styles ohne Inline-Skript` besteht. |
| 3 | Host-CSS durch Modul nicht überschreibbar | Bestätigt für die Auslieferung. Cascade bewusst offen (siehe 3.3) | `serveHostAsset` läuft in `serveModule` vor `resolveModuleFile`. Ein Modul kann keine eigene Datei unter `/__academy/host.css` oder `/__academy/design-tokens.css` ausliefern, der Host-Pfad hat immer Vorrang. |
| 4 | Pfad der Host-Assets bleibt im Renderer | Bestätigt | Feste Allowlist `HOST_ASSETS` mit genau zwei Pfaden. Der Dateiname kommt aus der Tabelle, nie aus der Anfrage. Aufgelöst wird gegen `desktopRoot` (`src/renderer`, gesetzt in `main.js:70`). Zusätzliche Prüfung `startsWith(root + sep)`. Der Zugriff über `/__proto__`-artige Schlüssel scheitert, weil `pathname` immer mit `/` beginnt. |
| 5 | iframe-Sandbox unverändert | Bestätigt | `module.js:94`: `allow-scripts allow-forms allow-same-origin`. Diese Zeile liegt in keinem Diff-Hunk. `referrerPolicy = "no-referrer"` unverändert. |
| 6 | Modul und Core getrennt | Bestätigt | Module laufen unter `academy://<id>`, der Core unter `academy://app`. Der Zweig `hostname !== "app"` führt nur in `serveModule`. Der Core-Zweig mit der Bridge ist nicht erreichbar. `window.js`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Diese Datei und `main.js`, `ipc.js` sind im Phase-L-Diff nicht enthalten. |
| 7 | Keine neue Berechtigung | Bestätigt | Keine neuen `ipcMain.handle`-Kanäle. `main.js:37-38` verweigert weiterhin alle Permission-Requests und -Checks. Phase L ändert nur CSS, HTML-Gerüst, `module.js`, `bridge.js` und `protocol.js`. |

## 3. Befunde

### 3.1 MITTEL (bestehend, nicht durch Phase L verursacht) – `style-src 'unsafe-inline'` in beiden CSPs
- **Beobachtung:** `CSP` (Zeile 26) und `MODULE_CSP` (Zeile 40) in `src/protocol-path.js` enthalten `style-src 'self' 'unsafe-inline'`.
- **Hinweis zum Auftrag:** Der Lead-Kontext nennt `style-src 'self'`. Das stimmt mit dem Code nicht überein. Phase L hat das nicht gelockert, der Wert war schon in Phase K so (Datei unverändert).
- **Auswirkung:** Ein Modul oder eingeschleuste Inhalte können Inline-Styles setzen (UI-Täuschung, CSS-basierte Datenabfluss-Tricks sind durch `connect-src 'self'` und `img-src 'self' data:` begrenzt). Skriptausführung bleibt durch `script-src 'self'` blockiert.
- **Teilfortschritt in Phase L:** `bridge.js` setzt den Hinweisbanner nicht mehr per `style.cssText`, sondern per Klasse `desktop-status`. Das ist ein Schritt in Richtung strengerer Style-CSP.
- **Nicht geprüft:** Ob die 102 Lernseiten und weitere Renderer-Dateien noch Inline-Styles (`style="…"`, `<style>`) benötigen. Das ist die Voraussetzung dafür, `'unsafe-inline'` zu entfernen.
- **Empfehlung:** In einer eigenen Phase Inline-Styles inventarisieren, in Dateien auslagern, dann `'unsafe-inline'` streichen. Nicht ohne Test der Lernseiten.
- **Blockierend:** nein.

### 3.2 NIEDRIG – Host-Assets unter jedem Modul-Host erreichbar
- **Beobachtung:** `/__academy/*.css` wird für jeden `academy://<id>`-Host ausgeliefert, auch ohne installiertes Modul dieser ID, weil `serveHostAsset` vor dem Modul-Resolver läuft.
- **Auswirkung:** Gering. Es werden nur zwei öffentliche Design-Dateien ausgegeben, ohne Geheimnisse und mit `MODULE_CSP`, `nosniff` und `no-store`.
- **Empfehlung (Härtung, optional):** Host-Assets nur ausliefern, wenn das Modul im Manager existiert.
- **Blockierend:** nein.

### 3.3 INFORMATIV – Cascade-Vorrang von Host-CSS ist absichtlich niedrig
- **Beobachtung:** `host.css` nutzt `:where(body)` und `:where(h1, …)` mit Spezifität 0. Ein Modul-Stylesheet überschreibt diese Regeln per Cascade. Das ist das gewollte Design („verliert gegen jedes Modul-Stylesheet“).
- **Bewertung:** Kein Sicherheitsrisiko. Es ist Layout-Hoheit, keine Vertrauensgrenze. Die zwei nicht gekapselten Regeln (`a.kopf-logo { display:none }` und `nav.site-nav`) wirken nur auf Modulseiten mit passenden Klassen. Ein Modul kann Host-Darstellung optisch umgehen, aber keine Rechte erlangen.
- **Blockierend:** nein.

### 3.4 INFORMATIV – Beobachtungen ohne Risiko
- `injectHost` ersetzt das erste `</head>`. Steht dieses Muster früher in einem Kommentar oder String, landen die statischen Links an unerwarteter Stelle. Folge: Darstellungsfehler, keine Ausführung.
- Modul-HTML wird jetzt als UTF-8-String gelesen. Nicht-UTF-8-Dateien könnten fehlerhafte Zeichen zeigen. Die Antwort war schon vorher als UTF-8 deklariert. Funktionsthema für GLaDOS, kein Sicherheitsthema.
- Neuer Modulwechsel (`module.js`, `fillSwitcher`): Namen werden über `shell.text` (`textContent`) geschrieben, keine HTML-Senke. Die gewählte ID geht wie bisher an `academy:modules-open`. Eine serverseitige Validierung der ID in `ipc.js` habe ich in dieser Prüfung nicht erneut gelesen, die Datei ist unverändert gegenüber Phase K.
- `verwaltung.js` nutzt `innerHTML = ""` (leerer String). Harmlos und nicht Teil von Phase L.

## 4. Verifikation

- `git log`: HEAD `ab80dfb` auf dem Phase-L-Branch, Vorgänger `aad0187`.
- `git diff --stat aad0187 ab80dfb`: 21 Dateien. Nicht enthalten: `src/protocol-path.js`, `src/main.js`, `src/window.js`, `src/ipc.js`, `src/modules/*`, `package.json`. Der gezielte Stat auf diese Dateien lieferte eine leere Ausgabe.
- `node --test tests/phase-l-host.test.js tests/lf3-csp.test.js`: 7 Tests, 7 bestanden, 0 fehlgeschlagen.
- Arbeitsbaumstatus (`git status`) konnte ich nicht abfragen, weil die Shell den verketteten Befehl abgelehnt hat. Der Prüfstand bezieht sich daher auf den Commit, nicht auf eventuell uncommittete Änderungen.

## 5. Grenzen der Prüfung

- Statische Prüfung des Codes. Kein laufender Electron-Test, kein Angriffs- oder Fuzzing-Test, keine Portscans.
- Die 102 Lernseiten und das Modul-Paket habe ich nicht inhaltlich auf Inline-Styles oder Skripte untersucht. Phase K hatte den Inline-Skript-Test (`lf3-csp`), der weiterhin besteht.
- `ipc.js` (Absendervalidierung) und `manager.js` wurden nicht neu geprüft. Sie sind in Phase L unverändert.
- Die Screenshots und `fenster-l-probe.json` wurden nicht bewertet (Aufgabe von GLaDOS).
- Dieser Bericht ersetzt keine spätere Prüfung.

## 6. Empfehlung

Aus Sicherheitssicht **keine Einwände** gegen die Übernahme von Phase L auf dem lokalen Branch. Für die nächste Phase empfehle ich den Abbau von `style-src 'unsafe-inline'` (Befund 3.1).
