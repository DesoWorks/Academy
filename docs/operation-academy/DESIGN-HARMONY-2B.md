# Design Harmony – Etappe 2B

**Status:** umgesetzt und im Academy-iframe gemessen. Keine Produktfreigabe. Kein Rollout. Kein Commit.

**HEAD:** `46283bf` auf `feature/phase-n1-release-connectivity`. **main:** `2e704e3`. Kein Push, kein Merge, keine Installation auf dem Benutzerprofil, keine App-ID-Änderung, kein Stable.

## Was gilt

Die Shell besitzt den Darstellungsmodus. Schlüssel `academy.theme` in `academy.sqlite`. Werte nur `hell`, `dunkel`, `kontrast`. Standard `hell`. Dunkel ist Knight über die vorhandenen `--dw-*`. Hell und Kontrast übernehmen vorhandene Modulwerte, ohne neue Hex-Farben.

Der einzige Transport ist der Query-Parameter `academy-theme` an der iframe-URL. `protocol.js` setzt daraus genau ein `data-academy-theme`. Kein `postMessage`, keine gelockerte CSP, keine neue Sandbox-Erlaubnis. Das Modul spiegelt den Wert nach `data-theme` und schaltet die eigene Darstellungswahl ab. Textgröße, Abstand und reduzierte Bewegung bleiben im Modulspeicher.

Vertrag: `docs/operation-academy/DESIGN-HARMONY-2B-VERTRAG.md`.

## Geänderte Anwendungsdateien

- `src/protocol.js`
- `src/renderer/shell.js`, `settings.html`, `settings.js`, `module.js`
- `src/renderer/design-tokens.css`, `shell.css`, `host.css`
- `modules/it-systemintegration/web/js/anzeige-glossar.js`
- `modules/it-systemintegration/web/js/navigation.js`
- `modules/it-systemintegration/content/payload-index.json`
- `tests/design-harmony-2b-theme.test.js`
- `modules/it-systemintegration/web/module/lf3-client-anbindung.html` war schon aus 2A geändert und wurde nicht neu geschrieben.

Die 137 weißen `var(--flaeche, #fff)`-Stellen sind nicht angefasst.

## Prüfung

`node --test tests/design-harmony-2b-theme.test.js tests/phase-l-host.test.js`: 26 bestanden, 0 fehlgeschlagen, Exit 0.

Nach der Indexangleichung `node --test tests/phase-k-updates.test.js tests/phase-m-updates.test.js`: 8 bestanden, 0 fehlgeschlagen, Exit 0. Vorher scheiterten 4 Tests an der Größe von `anzeige-glossar.js`. Der Index wurde mit `scripts/regenerate-payload-index.js` aus den Git-Blobs geschrieben, nicht von Hand. Drei Einträge änderten sich: `anzeige-glossar.js` 6869 → 8098, `navigation.js` 10155 → 13328, `lf3-client-anbindung.html` 7427 → 7587. `sizeBytes` blieb 62017. Nichts ist gestagt. Ein Commit ohne den Index würde die Installationsprüfung wieder ablehnen.

## Academy-iframe

Die installierte Academy des Commanders lief parallel und wurde nicht angefasst. Der Nachweis lief in einem versteckten Electron-Fenster mit dem echten Protokoll, der echten Shell und einem temporären Datenverzeichnis. Modul `desoworks.it-systemintegration` 1.0.1, Zustand `active`.

LF3 im iframe:

| Modus | Fläche | Text | Kontrast | Attribut |
| --- | --- | --- | --- | --- |
| dunkel | `rgb(20, 17, 20)` Knight-Surface `#141114` | `rgb(247, 244, 245)` | 17,15:1 | `data-academy-theme=dunkel`, gespiegelt nach `data-theme` |
| hell | `rgb(255, 255, 255)` | `rgb(27, 36, 48)` | 15,65:1 | `data-academy-theme=hell` |

Die Darstellungswahl im Modul war in beiden Läufen `disabled`. Der gespeicherte Wert `dunkel` stand beim Start am Shell-Root, bevor jemand geklickt hat. `AcademyShell.writeTheme('hell')` gab `true` zurück. Ein zweiter Prozess nach diesem Schreiben wurde nicht gestartet.

Die Skizze im Dunkelmodus bei 200 % Zoom ist lesbar: helle Schrift auf dunkler Fläche, kein Weiß-auf-Weiß.

![Verbindungsskizze im Academy-iframe, dunkel, 200 %](docs/operation-academy/design-harmony-2b/academy-dunkel-200.png)

Die Lernseite im Hellmodus zeigt dunkle Schrift auf heller Fläche. Die Skizzenzeichen selbst liegen in diesem Bild unter der Falz. Ihre berechnete Farbe kommt aus demselben iframe-Knoten.

![LF3 im Academy-iframe, hell](docs/operation-academy/design-harmony-2b/academy-hell.png)

Die linke Modulnavigation („Themenübersicht“) ist bei 100 % sichtbar. Die Shell-Navigation bricht bei 200 % um und bleibt im Fenster. Der Modulwechsel bleibt bedienbar. Die Lernseite braucht vertikalen Scroll. Das ist kein bestandenes WCAG-1.4.10.

## Nicht bestanden, und so benannt

- Tastaturfokus: der gemessene Fokus lag auf `MAIN` mit `outline-style: none`. Kein Nachweis eines sichtbaren Fokus auf der Antwort.
- Screenreader: `role="img"` und das vorhandene `aria-label` sind im iframe gelesen. Eine Ausgabe mit einem Screenreader gibt es nicht.
- 150 % ist nur als Zoomfaktor 1,5 gesetzt, nicht als eigener Bediennachweis.
- Kontrastmodus ist implementiert und nicht visuell geprüft.
- Der Textgrößenregler wurde nicht durchgeklickt. Der Code lässt ihn lokal.
- Die Meldung „Status konnte nicht gelesen werden“ kommt vom Prüfstub ohne `updates.status`, nicht aus der Theme-Änderung.
- Ein Modul kann `data-theme` im eigenen Dokument weiter setzen, wenn es das Skript umgeht. Der Shell-Speicher ist davon getrennt. ROBOCOP: eingeschränkt für den Transport, keine Produktfreigabe.

## Crew

- TERMINUS: Vertrag.
- JARVIS: Umsetzung. Die Theme-Tests hat Rick nachgelesen.
- SMITH: 141 Fundstellen in 80 Dateien, 137 mit weißem Fallback. Inventar, keine Fehlerliste.
- C-3PO: `DESIGN-HARMONY-2B-REGELN.md`.
- ROBOCOP: `DESIGN-HARMONY-2B-SECURITY.md`.
- GLaDOS: `DESIGN-HARMONY-2B-QA.md`, Urteil eingeschränkt.
- TARS: kein Auftrag.

Die Station hat für die Crew-Läufe 0 USD gemeldet.

## Nicht gestartet

Der Rollout steht nur als Plan in `docs/operation-academy/DESIGN-HARMONY-2B-ROLLOUT.md`.
