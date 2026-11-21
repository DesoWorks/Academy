# Phase L – Module Experience und Corporate Identity

Stand: 2026-11-21. Branch `feature/phase-l-module-experience`. Abschluss nach Nachbesserung: folgt dem Commit dieser Datei. Ausgang war `aad0187` auf `feature/phase-k-stability-trust`. `main` bleibt `2e704e3`. Kein Push, kein Merge, kein Release. Das IT-Ausbildungsrepository wurde nicht angefasst.

## Ergebnis

Die Academy-Shell spricht die DesoWorks-Markensprache der Website. Ein geöffnetes Modul bekommt die restliche Fensterfläche. Die 102 Lernseiten wurden nicht umgeschrieben. `git diff aad0187 -- modules/it-systemintegration` ist leer.

Implementierungscommit: `ab80dfb`. Danach eine kleine Korrektur am Fehlerpfad von `show()`: eine fehlgeschlagene Öffnung blendet die vorherige Modulansicht wieder aus. GLaDOS hatte den Pfad als Codeverdacht notiert. Er ist nicht erneut im Fenster durchgespielt.

## Ursache

Der iframe saß in einer 1080-Pixel-Spalte, 70vh hoch, mit eigener Scrollbar, unter einer zweiten Shell-Scrollbar und einem zweiten DesoWorks-Logo. Das ist in `docs/operation-academy/MODULE-EXPERIENCE.md` festgehalten. Alter Vergleich: `fenster-modul.png`.

## Was geändert wurde

- `src/renderer/design-tokens.css` – Knight-Tokens aus der lokalen Website-Produktion. `desoworks.dev` antwortete mit HTTP 401.
- `src/renderer/shell.css` – Shell auf diese Tokens. Modulmodus ohne 70vh.
- `src/renderer/host.css` – nur bei Einbettung. Doppeltes Logo weg, Modulleiste ohne eigene Scrollbar.
- `src/protocol.js` – zwei Stylesheet-Links, keine Inline-Skripte, Host-Dateien vor dem Modul-Resolver.
- `src/renderer/bridge.js` – Statuszeile im Kopf, alte Cyan-Inlinefarbe weg.
- `src/renderer/module.html`, `module.js` – Modulwechsel, volle Fläche, Fehlerpfad schließt die alte Ansicht.
- `build/icon.ico` – sechs Größen aus der vorhandenen PNG. Unsigniert.
- Tests: `tests/phase-l-host.test.js`. `npm test` nach der Fehlerpfad-Korrektur: 67 bestanden, 0 fehlgeschlagen.

## Fenster

Electron-`capturePage`, temporäres Datenverzeichnis, nicht die Lernstände des Commanders.

- Start: `fenster-l-start.png`. Begrüßung bleibt. Akzent im Bild ist das Knight-Rot, nicht Cyan.
- Modul 1280×840: `fenster-l-modul-1280x840.png`. Volle Breite, eine Scrollbar rechts.
- F11: `fenster-l-modul-f11.png`, 2560×1440. Das Bild entstand vor dem Entfernen der doppelten Knöpfe „Alle Lernbereiche“ und „Startseite“. Der Code hat sie nicht mehr. Die Academy-Navigation deckt dieselben Ziele ab. Ein neues F11-Bild nach dieser Streichung fehlt.

Probe bei 1920×1080: Rahmen 1904×832, `overflow: hidden`, Akzent `#FF5369`, Canvas `#070708`. Datei: `fenster-l-probe.json`.

## Crew

- GLaDOS: `QA-PHASE-L.md`. Gesamturteil eingeschränkt. Sie hat die Bilder und den Code gesehen, `npm test` nicht selbst ausgeführt, den Katalog nicht geklickt und den IT-Diff nicht selbst gezogen.
- ROBOCOP: `SECURITY-PHASE-L.md`. Nicht blockierend. CSP nicht gelockert. `style-src 'unsafe-inline'` ist alt, nicht aus Phase L. Host-Dateien sind nicht vom Modul ersetzbar.
- TERMINUS: `TERMINUS-PHASE-L.md`. Die Shell war die Ursache, nicht ein CSS-Pflaster auf den Lernseiten. Grenze: Shell vergibt den Platz, das Modul scrollt seinen Inhalt.

## Abschlusskriterien

| Kriterium | Stand |
| --- | --- |
| Designsystem dokumentiert | Ja, `DESIGN-SYSTEM.md` |
| Academy an die Website angeglichen | Shell ja. Lernseiten behalten ihre eigene Fläche. |
| Logo integriert | Vorhandenes Signet, nicht neu gezeichnet. |
| Modulansicht nutzt die Fläche | Ja, im Fensterlauf. |
| Verschachtelte Shell-Scrolls weg | Shell scrollt im Modulmodus nicht. Der iframe scrollt den Lerninhalt. |
| Doppelte Navigation | Die zweite Ziel-Leiste ist entfernt. Modulnavigation bleibt, weil sie andere Ziele hat. |
| IT-Ausbildung bedienbar | Seiten unverändert. Nicht jede der 102 Seiten wurde in Phase L angeklickt. |
| Fenstergrößen | 1280×720, 1280×840, 1920×1080 und F11 als Bilder. |
| F11 | Weiter im Core. Bild zeigt Vollbild. Taste nicht von GLaDOS gedrückt. |
| Laufzeit wiederverwendbar | Protokoll hängt die Tokens an jedes Modul-HTML. |
| Unabhängige Berichte | Liegen vor. QA ist eingeschränkt, nicht bestanden im engen Sinn. |

## Offen

- Signet bleibt im Kleinformat türkis. Nicht umgefärbt.
- ICO ist unsigniert. Kein Stable-Release.
- Einzelne Fach-CSS mit fester Breite (`pc-explorer.css`, `raid-rack.css`) sind nicht neu vermessen.
- F11-Bild zeigt noch die entfernten Kontextknöpfe.
- Kein Merge auf `main`. Kein Push.

## Phase M, eng

Die Einbettung im echten Fenster gegen die Fachseiten mit fester Breite prüfen. Keine neue Plattformfunktion, bevor das Bild zur aktuellen Leiste nachgezogen ist.
