# OPERATION ACADEMY – DESIGN HARMONY

**Stand:** 22.11.2026  
**Etappe:** 1, Bestandsaufnahme. Etappen 2 bis 4 sind nicht begonnen.  
**Branch:** `feature/phase-n1-release-connectivity` bei `46283bf`  
**main:** `2e704e3`, unverändert  
**Kein Commit, kein Push, kein Stable, keine Installation.** Anwendungscode wurde nicht geändert.

Die Mission ist nicht abgeschlossen. Dieser Bericht bündelt nur, was in Etappe 1 gelesen oder von der Crew geschrieben und danach stichprobenartig geprüft wurde.

## Ausgangsstand

Installiert und gemeldet ist `0.3.1-dev.5`. Der Commander sieht im Hellmodus lesbare Lerninhalte. Im Dunkelmodus sind Verbindungsskizze, Informationskarten und Multiple-Choice-Antworten nahezu weiß auf weiß. Die Updateansicht zeigt Aktionen, die im Zustand nicht ausführbar sein sollen. Unter der Navigation hängt eine technische Statuszeile.

`dev/v0.3.1-dev.5` bleibt unangetastet. Das vorbereitete In-App-Update aus Welle 4 wurde nicht installiert.

## Bestandsaufnahme

### Designquelle

Geprüft: `D:\Desoworks\Workspace\Website\website-prod-upload\shared\theme.css`, Zeilen 4–18, gegen `src/renderer/design-tokens.css`.

Die Standardpalette ist Dark Knight, nicht eine erfundene Academy-Farbe. Übereinstimmend:

| Website | Academy | Wert |
| --- | --- | --- |
| `--canvas` | `--dw-canvas` | `#070708` |
| `--surface` | `--dw-surface` | `#141114` |
| `--surface-raised` | `--dw-surface-raised` | `#24171C` |
| `--surface-accent` | `--dw-surface-accent` | `#39141E` |
| `--text` | `--dw-text` | `#F7F4F5` |
| `--text-muted` | `--dw-text-muted` | `#C4B8BD` |
| `--border` | `--dw-border` | `#55434A` |
| `--accent` | `--dw-accent` | `#FF5369` |
| `--accent-hover` | `--dw-accent-hover` | `#FF8091` |
| `--on-accent` | `--dw-on-accent` | `#16060A` |
| `--focus` | `--dw-focus` | `#FFB0BA` |

Die Academy ergänzt `--dw-ok: #b7f7c8`. Das steht nicht in diesem Website-Block. Der gelesene Standardblock hat keinen Hellmodus. `desoworks.dev` wurde in diesem Lauf nicht als Farbquelle verwendet.

Schriften in den Academy-Tokens: Consolas für Anzeige, Verdana für Text. Die IT-Seiten setzen am `body` selbst `"Segoe UI", "Helvetica Neue", Arial` (`styles.css`, Zeile 34). Das ist eine zweite Schriftfamilie, kein Token.

### Der gemeldete Dunkelmodus-Fehler

Ursache im Quelltext, nicht als Bildschirmfoto dieses Laufs:

`modules/it-systemintegration/web/module/lf3-client-anbindung.html`, Zeilen 15–22:

- `.step`, `.opt` und `.skizze` setzen `background: var(--flaeche, #fff)`.
- Dieselben Regeln setzen keine Textfarbe.

`styles.css` kennt `--farbe-flaeche`, nicht `--flaeche`. Der Fallback `#fff` greift deshalb auch im Dunkelmodus. Der Dunkelmodus setzt `--farbe-text: #f2f5f8` (`styles.css`, Zeile 430) und der `body` erbt diese Farbe (Zeile 36). Helle Schrift auf erzwungen weißem Grund. Das trifft Skizze, Infokarte und Antwortoption auf dieser Seite.

`styles.css` hat einen Dunkelmodus. Der Fehler ist nicht „das Modul kann kein Dunkel“. Der Fehler ist ein falsch benanntes Token plus weißer Fallback.

Dieselbe Suche nach `var(--flaeche,#fff)` in `modules/it-systemintegration/web/module/*.html` lieferte eine lange Trefferliste und brach bei 79+ ab. Das sind Kandidaten, keine 79 bestätigten Bildschirmfehler. LF3-Seiten in der Liste: Client-Anbindung, DHCP, DNS, Fehlerbild, IPv4, Verbindung eingrenzen.

`host.css` setzt mit `:where(body)` Canvas und `--dw-text`. Das verliert gegen die Modulregel. Es erklärt den Konflikt nicht allein.

### Module

Zwei Modulwurzeln:

- `modules/it-systemintegration`: eigene HTML- und CSS-Welt, helle Standardtokens, eigener Dunkelmodus über `html[data-theme="dunkel"]`, Leseoptionen und Glossar in `styles.css`.
- `modules/wissen-weitergeben`: kein eigenes HTML und kein eigenes CSS. Der Core rendert `content/course.json`.

Die 12 Modul-CSS-Dateien importieren `design-tokens.css` nicht. Das Protokoll kann die Tokens trotzdem in den Rahmen hängen. Die Lernseiten benutzen ihre eigenen `--farbe-*`-Namen.

Zwei Navigationen: Academy-Shell und Modul-`site-nav` / Lernschritte. Noch nicht vereinheitlicht.

### Updateoberfläche

`src/renderer/verwaltung.html`, Zeilen 72–77, zeigt immer:

- Erneut prüfen
- Core herunterladen
- Download abbrechen
- Core-Update installieren
- Modulupdate herunterladen
- Modulupdate installieren

`verwaltung.js` schaltet diese Buttons nicht über `disabled` oder `hidden`. `paint()` liest `update.phase` nicht. Die Modulbuttons prüfen nur, ob eine Modul-ID im Textknoten steht. Die Core-Buttons rufen den Dienst direkt auf.

`src/updates/service.js` sperrt in der Logik einen Teil der unzulässigen Fälle. `download()` lehnt fremden Kanal, fehlendes Prerelease, fehlenden Hash, Downgrade und ungültige Signatur ab. `installPlan()` verlangt zusätzlich `phase === "ready"`, einen vorhandenen Installer, Hash, Manifest und eine Sicherung. Stable verlangt die Herausgebersignatur. `check()` und `abortDownload()` haben keine Phasenprüfung. Das ist keine Oberfläche, die pro Phase nur eine Hauptaktion zeigt.

`about.js` schreibt in „Über“ nur Programm und Core, ohne Kanal (`about.js`, Zeile 12). Version und Kanal stehen schon in der Verwaltung. Ein späteres Verlagern der Statuszeile muss `about.js` ändern, nicht nur `about.html`. `tests/modules-preserved.test.js` verlangt, dass `verwaltung.html` existiert. Die Datei darf nicht umbenannt werden.

### Statuszeile

`src/renderer/bridge.js`, Zeilen 7–9 und 61–78: erzeugt `.desktop-status`, hängt das Element an `.kopf-inhalt` und schreibt Desktop-Version, Kanal und Updatemeldung. Dieselben Angaben stehen bereits in der Verwaltung (`verwaltung.js`, `paint`). Nichts davon wurde entfernt.

### Didaktik und LRS, nur Stichprobe

C-3PO hat in drei LF3-Lektionen 24 Multiple-Choice-Fragen gezählt, dazu Übungen der Windows-Werkzeugkiste und eine kurze Textaufgabe in `course.json`. Das ist keine Vollerhebung. Schriftgröße und Absatzabstand sind in `styles.css` vorgesehen (`--text-scale`, `html.mehr-abstand`). Eine Vorlesefunktion hat C-3PO in der Stichprobe nicht gefunden. Smith nennt Lesefunktionen in LF3. Das ist nicht gegeneinander aufgelöst.

Smith meldet zusätzlich, eine leere Prüfungsantwort im Beispielmodul könne als Index 0 richtig gewertet werden. Diesen Codepfad habe ich in diesem Lauf nicht gelesen. Er ist kein bestätigter Befund.

### Barrierefreiheit

Keine gerenderte Ansicht, kein gemessener Kontrast, kein Tastaturdurchlauf, kein Screenreader. WCAG 2.2 AA ist nicht nachgewiesen und nicht widerlegt, außer an der genannten Quelle: weißer Fallback gegen `#f2f5f8` kann den Kontrast nicht erfüllen. `styles.css` respektiert `prefers-reduced-motion` und `forced-colors` an einigen Klassen. Das ist kein Gesamtnachweis.

## Designentscheidung für Etappe 2

Noch nicht umgesetzt. Empfehlung, keine Freigabe eines neuen Looks:

1. Zuerst den belegten Fallback schließen. `.step`, `.opt` und `.skizze` dürfen nicht auf ein undefiniertes `--flaeche` mit `#fff` fallen. Fläche und Text müssen aus demselben Paar kommen: entweder die vorhandenen `--farbe-*` oder die `--dw-*`-Tokens. Keine dritte Palette.
2. Danach dieselben Fallback-Stellen in den anderen HTML-Seiten der Trefferliste, nicht blind alle Module umfärben.
3. Hell und Dunkel bleiben zwei Zustände derselben Rollen. Die Website liefert den dunklen Standard. Die hellen Lernseiten bleiben die vorhandene Arbeitsfläche, bis ein Hell-Token-Satz aus einer gelesenen Quelle kommt. Kein Cream-Template, kein zweites Rot neben `#FF5369`.
4. Update-Buttons und Statuszeile sind der nächste Schnitt, nicht derselbe Patch wie der Farbfallback. Die Signaturprüfung, die App-ID und die Lerndaten bleiben außen vor.

## Agenten

| Agent | Ergebnis | Von Rick geprüft |
| --- | --- | --- |
| TERMINUS | `docs/operation-academy/DESIGN-HARMONY-ARCHITEKTUR.md` | Tokenvergleich und die drei Selektoren in `lf3-client-anbindung.html` bestätigt. |
| SMITH | `docs/operation-academy/DESIGN-HARMONY-ANALYSE.md` | Fallback-Muster und die immer sichtbaren Update-Buttons bestätigt. Die 79er-Zahl ist eine Suchgrenze, kein Sichtnachweis. Der Index-0-Befund ist nicht nachgelesen. |
| GLaDOS | `docs/operation-academy/DESIGN-HARMONY-QA.md` | Datei vorhanden. Kein Sichttest beansprucht. Nicht Zeile für Zeile nachgelesen. |
| C-3PO | `docs/operation-academy/DESIGN-HARMONY-DIDAKTIK.md` | Stichprobenumfang übernommen. Keine Aufgaben geändert. |
| HOSHI | `docs/operation-academy/DESIGN-HARMONY-COMMS.md` | Startstand. Die Datei sagt noch, die anderen Berichte lägen nicht vor. Das ist überholt. Keine Freigabe. |
| JARVIS | `docs/operation-academy/DESIGN-HARMONY-JARVIS-UI.md`, nach dem Kontingent-Reset abgeglichen und korrigiert. Modell `claude-sonnet-5-5`. | Buttons, `installPlan()` nur bei `ready`, Startprüfung in `main.js` Zeile 97 und die Lücke in `about.js` selbst gelesen. |
| TARS | Keine Datei. Die Schema-Rückgabe ist durchgefallen. Die Farbtabelle aus `styles.css` steht oben als Rick-Lesung, nicht als TARS-Befund. |
| ROBOCOP | `docs/operation-academy/DESIGN-HARMONY-SECURITY.md`. Modell `claude-sonnet-5-5`. | App-ID `dev.desoworks.academy` in `package.json` Zeile 20 bestätigt. Die drei `--flaeche`-Stellen und die Signaturgrenzen stimmen mit der eigenen Lesung überein. `styles.css` hat ROBOCOP nicht selbst gelesen. Keine Freigabe. |

Die Station hat für diese Läufe 0 USD gemeldet. Die Kosten sitzen in den acht Spezialistenläufen, nicht in einem zweiten Build.

## Sicherheit

ROBOCOP hat `docs/operation-academy/DESIGN-HARMONY-SECURITY.md` geschrieben. Ich habe die harten Grenzen nachgelesen, nicht das ganze Gutachten nachgebaut.

Unzulässig für den Dunkelmodus-Fix und die spätere UI-Arbeit:

- Manifest- oder Signaturprüfung abschalten.
- Ein Token in den Buildjob legen.
- Die App-ID `dev.desoworks.academy` ändern.
- Die bestehende Installation ungefragt ersetzen.
- `dev/v0.3.1-dev.5` oder ein anderes bestehendes DEV-Release überschreiben.

Erlaubt, eng: Renderer-CSS und Tokens, die Statuszeile nur lesend gegen den echten Updatezustand, Aufgabenhilfe ohne ausgelagerte Bewertung. Geschützte Dateien bleiben `src/updates/service.js`, `manifest-sign.js`, `signature.js`, `channels.js`, der Workflow und der Build-Block in `package.json`.

## Testergebnisse

- Kein `npm test` in diesem Lauf. Es gab keine Codeänderung, die eine Suite hätte belegen müssen.
- Keine gerenderte Hell-/Dunkelprüfung.
- `git status`: Anwendungsdateien unverändert. Neu und unversioniert sind die Design-Harmony-Berichte plus ältere Welle-4-Dokumente. `build/build-info.json` war schon vor diesem Lauf geändert. HEAD bleibt `46283bf`. `main` bleibt `2e704e3`.

## Einschränkungen

- Etappe 1 ist keine Abnahme.
- Der Kontrastfehler ist im Quelltext der Client-Anbindung belegt, nicht im installierten Fenster dieses Laufs.
- Didaktik, LRS und WCAG sind Stichprobe und Matrix, keine bestandene Prüfung.
- TARS hat keinen gültigen Abschluss geliefert. JARVIS und ROBOCOP haben nach dem Kontingent-Reset geliefert.
- HOSHIs Statusdatei ist der Startstand, nicht der Endstand.

## Nächster Schritt

Etappe 2 eng schneiden: den belegten `--flaeche`-Fallback auf der Client-Anbindung und den gleich gebauten LF3-Seiten schließen, Hell und Dunkel an einem gerenderten Beispiel prüfen, dann erst die Update-Zustandsmaschine. Die Statuszeile wandert nicht durch Umbenennen von `verwaltung.html`. Kanal und Version brauchen eine Änderung in `about.js`, nicht nur eine neue Überschrift. Kein modulweiter Umbau und kein Release in demselben Schritt.


## Etappe 2A – LF3-Pilot, 22.11.2026

Die Bestandsaufnahme bleibt gültig. Der Pilot ändert nur das Inline-CSS in `modules/it-systemintegration/web/module/lf3-client-anbindung.html`. Der Diff ist uncommitted. HEAD bleibt `46283bf`. `main` bleibt `2e704e3`. Kein Commit, kein Push, keine Installation, keine Update- oder App-ID-Änderung.

Die drei Selektoren `.step`, `.opt` und `.skizze` nutzen `--farbe-flaeche`, `--farbe-text` und `--farbe-rahmen` aus `styles.css`. Der Fokus der Antwort liegt auf `--farbe-akzent`. Es gibt keine neuen Hex-Werte.

Gerendert mit headless Chrome gegen die Moduldatei, nicht im Electron-iframe. Dunkelmodus: Text `rgb(242, 245, 248)` auf Fläche `rgb(28, 39, 51)`, Kontrast 13,83:1. Hellmodus: 15,65:1. Der weiße Fallback ist in dieser Datei weg. GLaDOS wertet den Piloten als eingeschränkt bestanden. Offene WCAG-Punkte stehen in `DESIGN-HARMONY-2A-QA.md`.

Etappe 2B ist nur vorbereitet: `DESIGN-HARMONY-2B-VORBEREITUNG.md`. Nicht gestartet.
