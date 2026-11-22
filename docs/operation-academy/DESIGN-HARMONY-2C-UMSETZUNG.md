# Design Harmony 2C – Umsetzungsnotiz LF3-Rollout

**Stand:** 22.11.2026 · **Bearbeiter:** Jarvis (Chief Engineer)
**Grundlage:** [DESIGN-HARMONY-2C-REIHENFOLGE.md](DESIGN-HARMONY-2C-REIHENFOLGE.md), Muster `lf3-client-anbindung.html` Z. 15-23 (nicht angefasst).

**Aussagegrenze:** Diese Notiz dokumentiert nur Quelländerungen und deren Zurücklesen. Es liegt kein gerenderter Nachweis vor, keine Hell/Dunkel-Prüfung, keine Tastatur-, Zoom- oder Screenreader-Prüfung und keine WCAG-Aussage. Diese Prüfungen liegen bei GLaDOS.

Pfade relativ zu `modules/it-systemintegration/web/module/`. Reihenfolge: eine Datei nach der anderen, nach jeder Änderung wurden die Zeilen 13-24 zurückgelesen, bevor die nächste Datei begann. Alle fünf Dateien entsprachen vorab dem beschriebenen Ist-Muster (Z. 15, 17, 18, 22); keine Datei war blockiert.

## Geänderte Selektoren je Datei

| Nr. | Datei | Geänderte Selektoren im lokalen `<style>` | Zeilen vorher → nachher |
|---|---|---|---|
| 1 | `lf3-dhcp.html` | `.step`, `.opt`, `.opt:focus-within`, neu `.opt:has(:checked)`, `.skizze` | 109 → 110 |
| 2 | `lf3-dns.html` | `.step`, `.opt`, `.opt:focus-within`, neu `.opt:has(:checked)`, `.skizze` | 107 → 108 |
| 3 | `lf3-verbindung-eingrenzen.html` | `.step`, `.opt`, `.opt:focus-within`, neu `.opt:has(:checked)`, `.skizze` | 111 → 112 |
| 4 | `lf3-fehlerbild-protokoll.html` | `.step`, `.opt`, `.opt:focus-within`, neu `.opt:has(:checked)`, `.skizze` | 112 → 113 |
| 5 | `lf3-ipv4-konfiguration.html` | `.step`, `.opt`, `.opt:focus-within`, neu `.opt:has(:checked)`, `.karte` (keine `.skizze` eingeführt) | 105 → 106 |

## Inhalt der Änderung (in allen fünf Dateien gleich)

- `.step`, `.opt`, `.skizze` bzw. `.karte`: `background:var(--flaeche,#fff)` → `background:var(--farbe-flaeche)`; `border:2px solid var(--rahmen,#bdcde3)` → `border:2px solid var(--farbe-rahmen)`; `color:var(--farbe-text)` ergänzt.
- `.opt:focus-within`: `outline:3px solid var(--fokus,#0754a6)` → `outline:3px solid var(--farbe-akzent);outline-offset:2px`.
- Neue Regel direkt danach: `.opt:has(:checked){border-color:var(--farbe-akzent);font-weight:700}`.
- Keine neuen Hex-Farben. Die verbleibenden Hex-Fallbacks stehen nur in `.result` (`var(--primaer,#0754a6)`), das bewusst unverändert blieb.

## Unangetastet geblieben

Je Datei: alle übrigen Deklarationen der geänderten Selektoren (z. B. `padding`, `border-radius`, `line-height`, `font-family`, `white-space`, `cursor`), `.steps`, `.opts`, `.opt input`, `.result`, `.result[hidden]`, sämtlicher Text, ARIA-Markup, Skript, Navigation. Bei `lf3-ipv4-konfiguration.html` bleibt `overflow-wrap:anywhere` auf `.karte` erhalten.

Nicht angefasst: `lf3-client-anbindung.html`, `lf3-lernziel.html`, `lf3-abnahme.html`, `css/styles.css`, `navigation.js`, `payload-index.json`, Tests, `src/`.

## Offen / Hinweise

- **Nutzlastindex nicht aktualisiert** (Vorgabe: nicht schreiben). Die fünf Moduldateien haben sich geändert; `payload-index.json` muss anschließend lokal nachgezogen und geprüft werden, sonst ist die Updateintegrität nicht gegeben.
- Gerenderte Prüfung im Academy-iframe (Hell, Dunkel, Kontrast, 150 %/200 %, Reflow, Regler, Lernstand, Fokus per echter Tastatur, Screenreader-Stichprobe) steht aus.
- `git status` zeigt weitere geänderte Dateien (u. a. `payload-index.json`, `navigation.js`, `src/`, `lf3-client-anbindung.html`), die aus früheren Etappen stammen und von dieser Umsetzung nicht verändert wurden. Kein Commit erfolgt.
