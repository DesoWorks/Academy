# OPERATION ACADEMY – DESIGN HARMONY / Etappe 2A

**Stand:** 22.11.2026  
**Branch:** `feature/phase-n1-release-connectivity`  
**HEAD:** `46283bf`  
**main:** `2e704e3`  
**Status:** Pilot geprüft, nicht freigegeben, nicht committed.

## Ergebnis

Der belegte Dunkelmodus-Fehler in `modules/it-systemintegration/web/module/lf3-client-anbindung.html` ist im gerenderten Hell- und Dunkelmodus für Verbindungsskizze, Informationskarten und Antwortoptionen nicht mehr das weiße-auf-weiß-Bild.

Geändert ist nur der Inline-Style dieser Datei: `.step`, `.opt`, `.skizze`, dazu `.opt:focus-within` und `.opt:has(:checked)`. Die Werte kommen aus den vorhandenen Modul-Tokens `--farbe-flaeche`, `--farbe-text`, `--farbe-rahmen` und `--farbe-akzent`. Keine neuen Markenfarben. Keine Änderung an anderen Lernmodulen, an der Updatefunktion oder an der App-ID.

Der Diff lag beim Start dieses Laufs schon im Arbeitsbaum. Eine Jarvis-Berichtsdatei für 2A gibt es nicht. Die Zeilen stimmen mit der Tokenempfehlung in `DESIGN-HARMONY-2A-TOKENS.md` überein. Ich habe sie selbst gelesen und nicht noch einmal umgeschrieben.

## Prüfung

Headless Chrome, Seite `http://127.0.0.1:8765/module/lf3-client-anbindung.html`. Der Stations-Testbrowser hat den lokalen Server abgelehnt. Das ist kein Electron-Lauf und kein Academy-iframe. `host.css` wurde nachträglich eingehängt und hat die Skizzenfarben nicht geändert.

| Ansicht | Text | Fläche | Kontrast |
| --- | --- | --- | --- |
| Hell, `.skizze` / `.step` / `.opt` | `rgb(27, 36, 48)` | `rgb(255, 255, 255)` | 15,65:1 |
| Dunkel, dieselben drei | `rgb(242, 245, 248)` | `rgb(28, 39, 51)` | 13,83:1 |

Auswahl und Fokus der ersten Antwort: Rahmen und Outline `rgb(128, 184, 255)`, Schriftstärke 700. Vom Inhalt aus erreicht ein Tab die erste Radio-Option. Die Seitenleiste liegt in der Tab-Reihenfolge davor. Das ist kein neuer Fehler dieses Diffs.

150 % ist das Maximum der Leseoption und bleibt im Viewport. 200 % wurde erzwungen. Die Skizze läuft nicht nach rechts aus dem Fenster, braucht aber vertikalen Scroll. Das ist kein bestandenes WCAG-1.4.10.

GLaDOS: `DESIGN-HARMONY-2A-QA.md`, Urteil eingeschränkt. Kein eigener Browser in dem Prüflauf. Die Aufnahmen hat dieser Lauf erzeugt.

ROBOCOP: `DESIGN-HARMONY-2A-SECURITY.md`, für diesen CSS-Diff freigegeben, keine Produktionsfreigabe. `payload-index.json` hat er nicht gelesen. Eine Suche nach dem Dateinamen in `tests`, `payload-index.json` und `academy-module.json` traf nichts. Das ist keine Aussage, dass ein Release den Index nicht neu braucht.

SMITH: `DESIGN-HARMONY-2A-FLAECHE.md`. Eine eigene Zählung von `var(--flaeche` in `modules` und `src` ergibt 141. Das trifft die Anwendungscode-Zahl im Inventar. Die übrigen Fundstellen sind nicht gerendert und keine bestätigten Fehler.

## Grenzen

- Nicht committed. `build/build-info.json` bleibt eine fremde Arbeitsbaumänderung und gehört nicht in denselben Commit.
- Kein `npm test` in diesem Lauf. Der Diff ist CSS in einer HTML-Datei.
- Keine Screenreader-Prüfung. Keine Abnahme der übrigen Module.
- TARS hatte keinen Auftrag.

## Nächster Schritt

Etappe 2B nicht starten, bis der Commander den Komponentenvertrag freigibt. Vorbereitung: `DESIGN-HARMONY-2B-VORBEREITUNG.md`.
