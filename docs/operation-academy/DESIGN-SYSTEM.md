# DesoWorks Academy – Designsystem

Stand: 2026-11-21. Branch `feature/phase-l-module-experience`.

## Quelle

Primärquelle war https://desoworks.dev/. Der Abruf kam mit HTTP 401 zurück. Verwendet wurde die lokale Produktion:

- `D:\Desoworks\Workspace\Website\website-prod-upload\shared\theme.css`
- `D:\Desoworks\Workspace\Website\website-prod-upload\deck.css`

Standard der Website ist `dark + knight`, nicht Neon und nicht Magenta.

Nicht verwendet: die frühere Academy-Cyanfläche `#10141c` / `#20B9D8`. Die stand nicht in den Website-Tokens.

## Zentrale Datei

`src/renderer/design-tokens.css`

Die Shell lädt sie über `@import` in `src/renderer/shell.css`. Eingebettete Module bekommen dieselbe Datei vom Protokoll unter `/__academy/design-tokens.css`. Ein neues Modul muss dafür keine eigene globale CSS-Datei schreiben.

## Tokens

| Rolle | Token | Wert | Herkunft |
| --- | --- | --- | --- |
| Hintergrund | `--dw-canvas` | `#070708` | theme.css `--canvas` |
| Fläche | `--dw-surface` | `#141114` | `--surface` |
| Erhobene Fläche | `--dw-surface-raised` | `#24171C` | `--surface-raised` |
| Akzentfläche | `--dw-surface-accent` | `#39141E` | `--surface-accent` |
| Text | `--dw-text` | `#F7F4F5` | `--text` |
| Gedämpfter Text | `--dw-text-muted` | `#C4B8BD` | `--text-muted` |
| Rahmen | `--dw-border` | `#55434A` | `--border` |
| Akzent | `--dw-accent` | `#FF5369` | `--accent` |
| Akzent, Hover | `--dw-accent-hover` | `#FF8091` | `--accent-hover` |
| Text auf Akzent | `--dw-on-accent` | `#16060A` | `--on-accent` |
| Fokus | `--dw-focus` | `#FFB0BA` | `--focus` |
| Anzeige-Schrift | `--dw-font-display` | Consolas, Cascadia Mono, Liberation Mono, monospace | deck.css |
| Text-Schrift | `--dw-font-text` | Verdana, Segoe UI, sans-serif | deck.css |

`--dw-ok` ist `#b7f7c8`. Das ist eine Funktionsfarbe der Academy. Sie steht nicht in den Website-Tokens. Fehler verwenden den Markenakzent, damit keine zweite Rotfamilie erfunden wird.

Abstände: 4, 8, 12, 16, 24, 32. Radius 3px, wie die Website-Plaques. Bedienelemente mindestens 44px hoch.

## Komponenten

- Kopf: volle Breite, Signet, Markenname in der Anzeige-Schrift, Navigation mit Akzentstrich auf der aktuellen Seite.
- Karten und Bereiche: Surface auf Canvas, 1px Border.
- Buttons: Surface, Border, Hover auf Surface-Accent. Keine Laufanimation.
- Status: Klasse `.desktop-status` im Kopf. Nicht mehr fix über dem Lerninhalt. Die alte Inline-Farbe `#172033` ist dort entfernt.
- Dialoge und Meldungen: bestehende `role="status"`-Absätze, Farbe über `--fehler` und `--ok`.
- Geplante Bereiche bleiben als „vorgesehen“ markiert. Sie sind nicht als fertig dargestellt.

## Was ein Modul automatisch bekommt

`host.css` setzt mit `:where()` Hintergrund, Textfarbe und Schrift. Jede eigene Modulregel gewinnt. Die IT-Ausbildung behält deshalb ihre hellen Lernseiten. Ein Modul ohne eigene Fläche fällt auf Knight zurück.

## Logo und Icon

- Fenster und Shell: vorhandenes `assets/brand/signet.svg`. Nicht neu gezeichnet.
- `build/icon.png` bleibt die 256-Pixel-Quelle.
- `build/icon.ico` ist ein Vista-Paket mit 16, 32, 48, 64, 128 und 256. Erzeugt durch `scripts/build-icon.ps1` aus der PNG. Kopf geprüft: Typ 1, sechs Bilder.
- EXE, Installer und Deinstaller zeigen in `package.json` weiter auf `build/icon.ico`.
- Kein Herausgeberzertifikat. Ein Testbuild bleibt unsigniert. Kein Release in dieser Phase.

## Offen

Das Signet ist im Kleinformat noch blau-türkis. Es wurde nicht umgefärbt, weil das vorhandene Logo Vorrang hat. Eine eigene Academy-Wortmarke neben dem Signet ist nicht neu gestaltet.
