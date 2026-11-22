# Design Harmony · Etappe 2A: LF3-Tokenprüfung

**Stand:** 22.11.2026 · `feature/phase-n1-release-connectivity`, HEAD `46283bf` mit bereits geändertem LF3-Arbeitsstand. **Status:** Quelltextprüfung, keine visuelle Abnahme und keine Änderung am Anwendungscode durch diesen Teilauftrag.

## 1. Wie die Academy Styles an das Lernmodul übergibt

- `src/window.js:8,110` öffnet `academy://app/home.html`. Für `hosted-web` erzeugt `src/renderer/module.js:90–100` ein Sandbox-iframe mit `academy://<Modul-ID>/<runtime.entry>`. Die IT-Systemintegration startet laut `modules/it-systemintegration/academy-module.json:34–37` über `index.html`; auch die daraus aufgerufene LF3-HTML-Seite wird über den Modul-Host ausgeliefert.
- `src/main.js:108–115` registriert das Protokoll mit `src/renderer` als `desktopRoot` und übergibt die Moduldateiauflösung an `modules.resolveHostedFile`. `src/protocol.js:90–100` leitet Nicht-`app`-Hosts an `serveModule` weiter. Bei Modul-HTML fügt `injectHost` vor `</head>` die Links `/__academy/design-tokens.css` und `/__academy/host.css` ein; `serveHostAsset` liefert beide aus dem Renderer-Verzeichnis (`src/protocol.js:10–14,39–67,70–87`). Das ist eine Einbindung **im iframe-Dokument**, keine CSS-Vererbung aus der Shell.
- LF3 selbst lädt `../css/styles.css`, `../css/netzwerk.css` und `../js/anzeige-glossar.js` (`modules/it-systemintegration/web/module/lf3-client-anbindung.html:11–12,104`). Beim direkten Browseraufruf ohne Academy-Protokoll fehlen die beiden injizierten Stylesheets. In der Academy sind deren Knight-Tokens dagegen im Modul verfügbar. `host.css:7–13` nutzt `--dw-canvas` und `--dw-text` als schwache `:where(body)`-Vorgaben; die spezifischere Modulregel `body` setzt ihren eigenen Hintergrund und Text (`styles.css:32–38`). `shell.css` wird nicht in das Modul geladen.
- Den aktiven Modus und die Textgröße verwaltet das IT-Modul selbst: `anzeige-glossar.js:4–33,60–67,94–102` liest `it-ausbildung.anzeige.v1` aus dem `localStorage` des Dokuments und setzt `html[data-theme]` und `--text-scale`. Standard ist `hell`; beim Start kann die Systemeinstellung `prefers-contrast: more` den Modus `hell` zu `kontrast` machen. Die Host-Injektion überträgt Stylesheets, aber keinen ausgewählten Modus.

## 2. Verfügbare Farbrollen in LF3

Die Werte unten sind **vorhandene Quellwerte**, keine neuen Farbstandards. `styles.css:4–11,54–58,429–449` definiert den hellen Grundstand in `:root`, die Überschreibungen in `html[data-theme="dunkel"]` bzw. `html[data-theme="kontrast"]` und nutzt den Akzent für den regulären Tastaturfokus. `netzwerk.css` definiert diese Rollen nicht um.

| Rolle | In LF3 als Pilot-Token | Hell | Dunkel | Kontrast |
| --- | --- | --- | --- | --- |
| Fläche | `--farbe-flaeche` | `#ffffff` | `#1c2733` | `#fff` |
| Text | `--farbe-text` | `#1b2430` | `#f2f5f8` | `#000` |
| Rahmen | `--farbe-rahmen` | `#c9d4e4` | `#8293a5` | `#333` |
| Fokus der Antwortoption | `--farbe-akzent` | `#1d5fb4` | `#80b8ff` | `#003a70` |

Das Modul hat kein eigenes `--farbe-fokus`; `--farbe-akzent` ist seine bestehende modusabhängige Fokusfarbe, kein dediziertes Fokustoken. Davon getrennt stellt `src/renderer/design-tokens.css:8–19` in der Academy `--dw-surface`, `--dw-text`, `--dw-border` und `--dw-focus` bereit. Ihre Werte entsprechen dem Dark-Knight-Standard aus `Website/website-prod-upload/shared/theme.css:4–17`. Die injizierte Academy-Datei hat keine Hell- oder Kontrast-Überschreibungen. Ein direkter Wechsel auf `--dw-*` würde deshalb die Modulmodi nicht abbilden und außerhalb der Academy die Tokenquelle verlieren.

## 3. Warum der alte Ausdruck weiß blieb

In HEAD `46283bf` nutzten `.step`, `.opt` und `.skizze` `background: var(--flaeche,#fff)`. In der Modulseite war `--flaeche` nicht definiert: Der Alias steht in `src/renderer/shell.css:7`, nicht in den injizierten Stylesheets oder den eingebundenen Modul-Styles. Die Verfügbarkeit von `--dw-surface` definiert den Alias nicht automatisch, und CSS-Variablen aus dem Shell-Dokument überschreiten die iframe-Grenze nicht. Daher griff in allen Modi der weiße Fallback `#fff`. Die Textfarbe kam vom Modul-`body`, im Dunkelmodus also `#f2f5f8`. Die Lesart ist damit korrigiert: **Knight-Tokens sind in der eingebetteten Seite vorhanden, der Shell-Alias nicht.** Der bei der Prüfung bereits geänderte LF3-Arbeitsstand enthält die Umstellung; der weiße Fallback beschreibt den Git-Ausgangsstand, nicht den aktuellen Diff.

## 4. Empfehlung für den Pilotumfang

Nur in `lf3-client-anbindung.html` die drei Selektoren `.step`, `.opt` und `.skizze` auf `background: var(--farbe-flaeche)`, `color: var(--farbe-text)` und `border-color: var(--farbe-rahmen)` (oder denselben Token im vorhandenen `border`-Shorthand) umstellen. Für `.opt:focus-within` den bestehenden 3-px-Fokusrahmen mit `var(--farbe-akzent)` statt des alten `--fokus`-Fallbacks verwenden. Der vorhandene Arbeitsdiff entspricht dieser Token-Empfehlung; er setzt den Akzent auch für den Auswahlrahmen ein. Keine neuen Hex-Werte und keine Ersetzung in anderen Selektoren oder Lernseiten. Ob Fokus und Auswahl zusammen klar erkennbar sind und ob Karten und Skizze bei Textvergrößerung funktionieren, bleibt der gerenderten QA vorbehalten.

## 5. Offene Architekturfrage für Etappe 2B

2B muss einen gemeinsamen, modusabhängigen Token- und Komponentenvertrag für Shell, eingebettete Module und eigenständig geöffnete Lernseiten festlegen: Wer besitzt den Modus, wie werden Dark Knight, Hell und Hochkontrast auf semantische Rollen einschließlich eines dedizierten Fokus-Tokens abgebildet, und wie erhalten gemeinsame Komponenten diese Rollen ohne Abhängigkeit von Shell-Aliasen? In 2A werden weder Host-Injektion, Sandbox oder Modulgrenzen noch globale Tokens, Modusspeicherung, gemeinsame Komponenten oder andere Lernseiten umgebaut. Weitere `--flaeche`-Fundstellen bleiben Inventar, keine automatisch bestätigten Fehler. Updatefunktion, App-ID, Installation und Release bleiben außerhalb des Auftrags; 2B wird nicht gestartet.
