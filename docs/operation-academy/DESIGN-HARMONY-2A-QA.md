# OPERATION ACADEMY – DESIGN HARMONY / QA Etappe 2A

**Prüfurteil: EINGESCHRÄNKT**  
**Prüfgegenstand:** ausschließlich `modules/it-systemintegration/web/module/lf3-client-anbindung.html`  
**Stand laut Übergabe:** HEAD `46283bf`, uncommitted Änderungen; kein eigener Browser und keine Shell in diesem Prüflauf.  
**Prüfmittel:** gerenderte PNGs und `docs/operation-academy/design-harmony-2a/messwerte.json`; die Aufnahmen stammen laut Übergabe aus headless Chrome unter `http://127.0.0.1:8765/module/lf3-client-anbindung.html`, nicht aus Electron oder dem Academy-iframe.

## Ergebnis nach Kriterien

| Kriterium | Ergebnis | Beleg / Einschränkung |
| --- | --- | --- |
| Verbindungsskizze, Hellmodus | **BESTANDEN** | `hell-skizze.png`: Skizze auf hellem Untergrund, Text lesbar. Messwert `.skizze`: `rgb(27, 36, 48)` auf Weiß, Kontrast 15,65:1. |
| Informationskarten, Hellmodus | **BESTANDEN** | `hell-skizze.png`: Karteninhalt sichtbar und lesbar. Messwert `.step`: gleiche Text-/Hintergrundfarben und 15,65:1. |
| Antwortoptionen, Hellmodus | **BESTANDEN** | `hell-uebung.png`: Optionen klar abgegrenzt und lesbar. Messwert `.opt`: 15,65:1. |
| Verbindungsskizze, Dunkelmodus | **BESTANDEN** | `dunkel-skizze.png`: Skizze sichtbar. Messwert `.skizze`: `rgb(242, 245, 248)` auf `rgb(28, 39, 51)`, 13,83:1. |
| Informationskarten, Dunkelmodus | **BESTANDEN** | `dunkel-skizze.png` / `dunkel-uebung.png`: Karten lesbar. Messwert `.step`: 13,83:1. |
| Antwortoptionen, Dunkelmodus | **BESTANDEN** | `dunkel-uebung.png`: Optionen lesbar. Messwert `.opt`: 13,83:1. |
| Auswahlzustand | **BESTANDEN** | `dunkel-uebung-auswahl.png`: ausgewählte Option hebt sich durch Rahmen, 3-px-Outline und Fettschrift ab. `messwerte.json`: Rahmen und Outline `rgb(128, 184, 255)`, `fontWeight: 700`. |
| Tastaturfokus | **BESTANDEN, eingeschränkt auf geprüften Ablauf** | `dunkel-tastatur-radio.png`: Radio erhält sichtbaren Fokus. `messwerte.json` dokumentiert vom Inhalt aus die erste Radio-Option und eine 3-px-Outline. Die Seitenleiste liegt in der Tab-Reihenfolge davor; das ist laut Prüfvorgabe kein neuer Fehler dieses CSS-Diffs und wird hier nicht als solcher gewertet. |
| Leseskalierung 150 % | **BESTANDEN** | `dunkel-150.png`: Leseskalierung ist die maximale Leseoption. Messwerte zeigen umfließende und vergrößerte Skizze/Karten; keine Inhalte rechts außerhalb des Viewports (`offRight: false`). |
| 200 % Textskalierung | **EINGESCHRÄNKT** | `dunkel-200-skizze-sichtbar.png` zeigt die Skizze nach erzwungenem `--text-scale`; sie bleibt lesbar, benötigt aber deutlich mehr vertikalen Raum. 200 % ist kein angebotener Leseoptionswert und wird nicht als Erfüllung einer 200-%-Anforderung gewertet. |

## Offene WCAG-2.2-AA-Befunde

- **WCAG 1.4.10 Reflow – nicht bestanden bei erzwungenen 200 % (begründeter Befund aus der Aufnahme):** In `dunkel-200-skizze-sichtbar.png` wird der lange monospaced Verbindungsweg stark umgebrochen; die vertikale Ausdehnung wächst erheblich. Das vorliegende Bild zeigt keinen eindeutigen horizontalen Seitenüberlauf, belegt aber keine vollständige Reflow-Konformität aller Inhalte und Interaktionen. Messwert `offRight: false` allein prüft nicht beide Scrollrichtungen bzw. alle Inhalte. 200 % wurden ausdrücklich per `--text-scale` erzwungen, nicht über die maximale Leseoption. Daher kein pauschales Bestehen dieses Kriteriums.
- **WCAG 2.4.11 Fokus nicht verdeckt (Minimum) – nicht vollständig geprüft:** Die Tastaturaufnahme belegt einen sichtbaren Fokus an der ersten Radio-Option, aber keine systematische Prüfung, ob Fokus bei allen Ansichten/Scrollzuständen teilweise oder vollständig verdeckt wird. Keine Aussage „bestanden“ aus diesem einzelnen Fokusbild.
- **WCAG 1.4.11 Nicht-Text-Kontrast – nicht vollständig geprüft:** Die Textkontraste der drei betroffenen Selektoren sind aus den Messwerten deutlich ausreichend. Kontrastmessungen aller relevanten nichttextlichen UI-Komponenten, insbesondere Zustandsindikatoren und übriger Bedienelemente, sind nicht enthalten. Für diesen Umfang daher kein Gesamtbestehen des Kriteriums.

Die oben als **BESTANDEN** markierten Punkte beziehen sich auf die benannten Komponenten, Modi und Aufnahmen, nicht auf die gesamte Seite oder die gesamte WCAG-Konformität.

## Grenzen der Prüfung

- Kein eigener Browserlauf, keine Bedienung der Seite durch diesen Prüfer und keine Prüfung in Electron oder im Academy-iframe. Sicht- und Messbewertung beschränkt auf die bereitgestellten Artefakte.
- `messwerte.json` weist bei einigen Probeaufnahmen Selektorgrößen von `0 × 0` aus, weil das Element in diesem Aufnahmezustand nicht im DOM-Ausschnitt bzw. Messbereich lag. Für diese Zustände wurden keine Abmessungen als positives Ergebnis herangezogen.
- Der Eintrag `hostInjection` in `messwerte.json` hält fest, dass nachträgliches Einhängen von `host.css` die Skizzenfarben nicht änderte; das ersetzt keine Prüfung weiterer Host- oder Laufzeitumgebungen.
- Keine fachliche Prüfung des Lerninhalts, keine Screenreader-/AT-Prüfung, kein vollständiger Tastatur- oder Browser-Kompatibilitätstest.
- Die genannten Aufnahmen und Messwerte weisen ausschließlich diese LF3-Datei nach. Keine Übertragung des Ergebnisses auf andere Lernmodule.

## Nachweisdateien

- `docs/operation-academy/design-harmony-2a/hell-skizze.png`
- `docs/operation-academy/design-harmony-2a/hell-uebung.png`
- `docs/operation-academy/design-harmony-2a/dunkel-skizze.png`
- `docs/operation-academy/design-harmony-2a/dunkel-uebung.png`
- `docs/operation-academy/design-harmony-2a/dunkel-uebung-auswahl.png`
- `docs/operation-academy/design-harmony-2a/dunkel-150.png`
- `docs/operation-academy/design-harmony-2a/dunkel-200-skizze-sichtbar.png`
- `docs/operation-academy/design-harmony-2a/dunkel-tastatur-radio.png`
- `docs/operation-academy/design-harmony-2a/messwerte.json`

**Abgrenzung:** Dieser Bericht dokumentiert eine eingeschränkte QA-Abnahme des visuellen Piloten. Er ändert keine Produktionsdatei und erteilt keine Freigabe für andere Module oder für den Gesamt-Release.
