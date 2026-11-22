# DESIGN HARMONY – Etappe 2A: Sicherheitsprüfung des Piloten

**Prüfer:** RoboCop (Security Officer)
**Projekt:** Academy, Modul it-systemintegration
**Branch:** feature/phase-n1-release-connectivity (selbst geprüft)
**HEAD:** 46283bf laut Lead, in diesem Lauf nicht selbst per `git rev-parse` bestätigt (der Befehl wurde vom Harness abgelehnt)
**Prüfgegenstand:** uncommittete Änderung in `modules/it-systemintegration/web/module/lf3-client-anbindung.html`
**Art der Prüfung:** nur lesend. Kein Code geändert, kein Commit, kein Push.

## Ergebnis

**FREIGEGEBEN aus Sicherheitssicht** für den Pilot (Etappe 2A, nur diese Datei). Es gibt keinen Befund ab Stufe NIEDRIG, die Beobachtungen unten sind INFORMATIV.

Die Freigabe gilt nur für diesen Diff. Sie ist keine Produktionsfreigabe und ersetzt nicht die Entscheidung des Commanders.

## Was geändert wurde (Beleg: `git diff`)

Der Diff der Datei umfasst 9 Einfügungen und 8 Löschungen, alle im Inline-`<style>`-Block (Zeilen 14 bis 23):

| Selektor | Änderung |
|---|---|
| `.step` | `var(--rahmen,#bdcde3)` und `var(--flaeche,#fff)` ersetzt durch `var(--farbe-rahmen)` und `var(--farbe-flaeche)`; `color:var(--farbe-text)` neu |
| `.opt` | wie `.step` |
| `.opt:focus-within` | `var(--fokus,#0754a6)` ersetzt durch `var(--farbe-akzent)`; `outline-offset:2px` neu |
| `.opt:has(:checked)` | neu: `border-color:var(--farbe-akzent);font-weight:700` |
| `.skizze` | wie `.step` |

Ausschließlich Farb-, Rahmen- und Schriftgewichts-Eigenschaften sowie `outline-offset`. Es gibt keine `url()`, `@import`, `expression`, `content:` oder `behavior`-Konstrukte in den geänderten Zeilen.

## Prüfpunkte mit Beleg

1. **Kein Script, keine Ereignisse.** Die geänderten Zeilen sind reines CSS. Die Script-Einbindungen (Zeilen 100 bis 106) und der Markup-Teil sind im Diff nicht enthalten.
2. **Keine neue Ressource und kein externer Zugriff.** Der Diff enthält keine neuen `url()`-Aufrufe und keine neuen `<link>`-Elemente. Die Ladepfade bleiben unverändert: `../css/styles.css`, `../css/netzwerk.css` und die lokalen Skripte.
3. **CSP unberührt.** `MODULE_CSP` in `src/protocol-path.js` enthält `style-src 'self' 'unsafe-inline'`. Inline-Styles waren schon vorher erlaubt, die Änderung braucht keine Lockerung und verändert die Richtlinie nicht. `src/protocol-path.js` ist nicht im Diff.
4. **`injectHost` unberührt.** `src/protocol.js` (Zeilen 39 bis 45) hängt `HOST_LINKS` (`design-tokens.css`, `host.css`) per String-Ersetzung vor `</head>` ein. Die Funktion arbeitet nur mit der Zeichenfolge `</head>`. Die geänderten CSS-Zeilen enthalten diese Zeichenfolge nicht, das Einfügeverhalten bleibt gleich. `src/protocol.js` ist nicht im Diff.
5. **`academy-module.json` unberührt.** Berechtigungen bleiben `content.read` und `progress.write`. Die Datei ist nicht im Diff. Sie ist nicht von der Änderung betroffen. Die Felder `sizeBytes: 62017` und `files` können sich durch die geänderte HTML-Datei theoretisch von der Wirklichkeit entfernen. Die Datei selbst wurde nicht geändert (siehe offene Punkte 1).
6. **Tokens existieren.** `modules/it-systemintegration/web/css/styles.css` definiert `--farbe-flaeche`, `--farbe-text`, `--farbe-akzent` und `--farbe-rahmen` (Zeilen 6 bis 11), dazu Varianten für dunkles Thema (Zeilen 430 bis 432) und hohen Kontrast (Zeilen 441 bis 442). Es werden keine neuen Marken- oder Farbwerte eingeführt.
7. **Modulgrenze.** Nur eine Datei im Modul ist geändert. Eine Ausweitung auf andere Lernmodule fand nicht statt.

## Offene Punkte (keine Sicherheitslücken)

1. **Hash/Größe des Moduls (INFORMATIV, unbestätigt).** Das Manifest nennt `sizeBytes` und eine `payload-index.json`. Ob dort Hashes der HTML-Datei geführt werden und eine Prüfung (Test oder Installer) bei geänderter Datei anschlägt, habe ich nicht geprüft. `payload-index.json` wurde nicht gelesen. Vor einem Release sollte der Index neu erzeugt werden. Das gehört zum Release-Ablauf und ist nicht Teil der CSS-Änderung. Signaturprüfung und Updatecode wurden nicht angefasst.
2. **Rückfallwerte entfernt (NIEDRIG, Robustheit).** Die alten `var(--rahmen,#bdcde3)`-Fallbacks sind weg. Wird `styles.css` nicht geladen, fehlen Fläche und Rahmen (transparent beziehungsweise Standardfarbe). Das ist ein Darstellungs- und Lesbarkeitsthema, kein Sicherheitsthema. Die Datei lädt `styles.css` in Zeile 11 vor dem Style-Block.
3. **Reihenfolge der Host-Styles (unbestätigt).** `injectHost` hängt `host.css` hinter den Inline-Style-Block. Ob `host.css` oder `design-tokens.css` dieselben Selektoren überschreiben, habe ich nicht geprüft, beide Dateien wurden nicht gelesen. Das betrifft nur das Aussehen.
4. **`:has(:checked)`.** Setzt eine Chromium-Version mit `:has()` voraus. Das Ziel ist die Electron-Umgebung, die Version habe ich nicht geprüft. Ohne Unterstützung fiele nur die Markierung der gewählten Option weg. Der Fokusrahmen bleibt über `:focus-within` erhalten.
5. **Unabhängige Änderung im Arbeitsbaum.** `build/build-info.json` ist ebenfalls geändert (Commit `34c4c283…`, `builtAt` 2026-11-22T10:16:19Z, `version 0.3.1-dev.4`, ohne Zeilenumbruch am Dateiende). Das gehört nicht zum Piloten. Es sollte nicht zusammen mit dem Pilot-Commit eingecheckt werden, außer der Commander entscheidet es bewusst so. Ich habe es nicht bewertet, nur festgestellt.
6. **Nicht geprüft:** `.result` nutzt weiterhin `var(--primaer,#0754a6)` mit Fallback und ist nicht Teil des Piloten. Die übrigen Selektoren und die nicht geänderten Lernmodule wurden nicht untersucht.

## Grenzen der Prüfung

- Geprüft wurden Diff, die HTML-Datei, `src/protocol.js` (Zeilen 1 bis 30 sowie die Suchtreffer zu `injectHost` und `MODULE_CSP`), `src/protocol-path.js` (Ausschnitt `MODULE_CSP`), `academy-module.json` und die Token-Definitionen in `styles.css` (Suchtreffer).
- Nicht gelesen: der Rest von `src/protocol.js` (ab Zeile 31), `host.css`, `design-tokens.css`, `payload-index.json`, Tests.
- Keine Ausführung der App, keine Browserprüfung, keine Kontrastmessung. Barrierefreiheit und Optik sind Aufgabe von QA und Design.
- Aussagen zur Wirkung der Änderung auf andere Dateien stützen sich auf den Diff (`git diff --stat`: nur zwei Dateien geändert, davon `build-info.json` unabhängig).
