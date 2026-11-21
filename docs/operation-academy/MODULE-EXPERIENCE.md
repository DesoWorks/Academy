# Modul-Laufzeit

Stand: 2026-11-21. Branch `feature/phase-l-module-experience`.

## Ursache, nicht das Symptom

Die IT-Seiten waren nicht zu schmal. Die Shell war es.

`module.html` war eine normale Dokumentseite mit `max-width: 1080px`. Das Modul lief in einem iframe mit `height: 70vh` und eigenem Rahmen. Die Seite darüber scrollte noch einmal. Dazu kam der eigene Kopf der IT-Ausbildung mit DesoWorks-Logo. Drei Scroll-Ebenen und zwei Markenköpfe.

Die 102 HTML-Seiten wurden nicht umgeschrieben.

## Zielbild, wie es jetzt liegt

Academy-Kopf:

- Signet und „DesoWorks Academy“.
- Globale Navigation, inklusive Rückweg zur Startseite und zu „Meine Lernbereiche“.
- Statuszeile der Desktop-Version, im Kopf, nicht über dem Inhalt.
- Modulwechsel, nur wenn ein Modul offen ist.

Modul-Arbeitsbereich:

- Volle Breite unter dem Kopf.
- Höhe über die Flex-Kette, nicht über `70vh` und nicht über die iframe-Standardhöhe von 150px.
- Modulnavigation bleibt die Navigation der IT-Ausbildung.
- Lernseiten, Aufgaben und Übungen bleiben die vorhandenen Dateien.

Die zweite Leiste mit „Alle Lernbereiche“ und „Startseite“ ist entfernt. Dieselben Ziele stehen in der Academy-Navigation. Der Modulwechsel bleibt, weil die Academy-Navigation kein Modul wählt.

## Scrollverantwortlicher

Im Modulmodus scrollt die Shell nicht (`body.modul-offen { overflow: hidden }`). Der iframe füllt den Rest und ist der Scrollverantwortlicher für den Lerninhalt.

`host.css` setzt `nav.site-nav` auf `overflow: visible` und `position: static`. Die Modulleiste scrollt nicht mehr zusätzlich. Eine eigene Scrollfläche bleibt zulässig, wo eine Seite sie fachlich braucht, zum Beispiel eine Tabelle oder ein Editor. Das ist dann die Seite selbst, nicht die Shell.

Druck: das ausgeblendete Modullogo kommt per `@media print` zurück.

## Protokoll

`serveModule` liefert HTML mit zwei Link-Tags vor `</head>`. Kein Inline-Skript. Die CSP bleibt `style-src 'self'`. Die beiden Dateien werden nur unter den festen Pfaden `/__academy/design-tokens.css` und `/__academy/host.css` aus dem Renderer ausgeliefert, bevor ein Modulpfad aufgelöst wird. Ein Modul kann diese Dateien nicht durch eigene Dateien ersetzen.

## Fenster

Gemessen mit Electron `capturePage`, nicht mit einem CSS-Mock. Datenverzeichnis war ein temporärer Ordner, nicht die Academy-Daten des Commanders.

| Situation | Ergebnis |
| --- | --- |
| Startseite 1280×840 | Knight-Fläche, Akzent `#FF5369`, Begrüßung unverändert. |
| Modul 1280×720, 1280×840, 1920×1080 | Rahmen füllt die Fläche. Bei 1920×1080 war der Rahmen 1904×832. |
| F11 | 2560×1440, Vollbild, eine Scrollbar rechts, Titelleiste weg. Menüleiste der Anwendung bleibt, wie in Phase I festgelegt. |

Nachweise: `docs/operation-academy/fenster-l-start.png`, `fenster-l-modul-1280x840.png`, `fenster-l-modul-f11.png`, `fenster-l-probe.json`.

Alter Stand zum Vergleich: `fenster-modul.png` aus Phase J.

## Lernseiten

Nicht angefasst: HTML, Aufgaben, Bewertung, Bilder, Formulare, Druckregeln der einzelnen Seiten. Die gemeinsame Laufzeit reicht für die Einbettung.

Bekannte Grenze: die Startkarte „Den Computer kennenlernen“ füllt die Inhaltsfläche nicht. Das ist das Layout der Lernseite, kein Rest der 1080-Pixel-Shell. Eine pauschale Umschrift der 102 Seiten ist dafür nicht gerechtfertigt.

Einzelansichten mit eigener fester Breite bleiben in ihren CSS-Dateien (`pc-explorer.css`, `raid-rack.css` und andere). Sie wurden in Phase L nicht neu gesetzt. Wenn eine davon horizontal überläuft, ist das ein Folgepunkt, kein stillschweigend behobener.

## Schnittstelle für das nächste Modul

1. Manifest mit `hosted-web` und einem HTML-Einstieg.
2. Keine eigene globale Farbdatei nötig. `--dw-*` ist da.
3. Eigene Fachflächen dürfen die Tokens überschreiben.
4. Keine zweite globale Navigation für Startseite oder Katalog.
5. Kein eigenes F11. Das bleibt im Core (`src/window.js`).
