# Design Harmony 2C – Sicherheitsprüfung des LF3-Rollouts

**Prüfer:** RoboCop (Security Officer) · **Datum:** 2026-11-22
**Projekt:** Academy (`D:\Desoworks\Workspace\Academy`)
**Prüfstand:** Branch `feature/phase-n1-release-connectivity`, HEAD `46283bf` (per `git rev-parse` gelesen), nichts gestagt (`git diff --cached --stat` leer). `main` = `2e704e3` laut Lead, von mir nicht erneut gelesen.
**Gegenstand:** `git diff` der fünf LF3-HTML-Dateien und von `modules/it-systemintegration/content/payload-index.json`.
**Art:** nur lesend. Keine Codeänderung, kein Commit. Einzige neue Datei ist dieser Bericht.

## Ergebnis in einem Satz

**Der 2C-Änderungsumfang ist eng, rein stilistisch und ohne Sicherheitsbefund.** Es gibt keinen Befund der Stufen KRITISCH, HOCH oder MITTEL. Das ist keine Produktfreigabe und keine WCAG-Aussage.

## 1. Geänderte Dateien und Umfang

`git diff --stat` zeigt für 2C: fünf HTML-Dateien mit je 9 Zeilen (`lf3-dhcp`, `lf3-dns`, `lf3-fehlerbild-protokoll`, `lf3-ipv4-konfiguration`, `lf3-verbindung-eingrenzen`) und `payload-index.json` mit 32 Zeilen.

`lf3-abnahme.html` und `lf3-lernziel.html` stehen nicht in `git status`. Sie sind unverändert.

Der Arbeitsbaum enthält weiterhin die uncommitteten 2B-Dateien (`build-info.json`, `anzeige-glossar.js`, `navigation.js`, `lf3-client-anbindung.html`, `src/*`). Sie gehören nicht zum 2C-Umfang.

## 2. Inhalt des HTML-Diffs

Ich habe alle fünf Diffs gelesen. Es sind nur Zeilen im lokalen `<style>`-Block geändert, in allen fünf Dateien dasselbe Muster:

- `var(--rahmen,#bdcde3)` wird zu `var(--farbe-rahmen)`.
- `var(--flaeche,#fff)` wird zu `var(--farbe-flaeche)`.
- `color:var(--farbe-text)` kommt auf `.step`, `.opt`, `.skizze` bzw. `.karte` dazu.
- `.opt:focus-within` nutzt `var(--farbe-akzent)` statt `var(--fokus,#0754a6)` und bekommt `outline-offset:2px`.
- Neue Regel `.opt:has(:checked){border-color:var(--farbe-akzent);font-weight:700}`.

Nicht im Diff, bestätigt durch Lesen der Diff-Zeilen:

| Prüfpunkt | Ergebnis |
|---|---|
| Neues `<script>`, Skriptänderung | nein, nur CSS-Zeilen geändert |
| `postMessage`, Nachrichtenkanal | nein |
| CSP-Meta (`http-equiv`) oder CSP-Änderung | nein |
| App-ID, Signaturprüfung | nein, keine solche Datei im Diff |
| ARIA-, Markup-, Formularänderung | nein |
| neue Berechtigung, `academy-module.json` | nein, Datei nicht im Diff |
| neue Hexwerte | nein, im Gegenteil: drei Hex-Fallbacks pro Datei entfallen |
| Textinhalt, Lernziele, Aufgaben | nein |

Die Tokens `--farbe-flaeche`, `--farbe-text`, `--farbe-akzent`, `--farbe-rahmen` sind in `modules/it-systemintegration/web/css/styles.css` definiert (Zeilen 6-11 hell, 430-432 dunkel, 441-442 Kontrast). Die Seiten binden diese Datei ein (`lf3-dns.html:11`). Es entstehen keine undefinierten Variablen.

Hinweis zur Methode: Meine erste Mustersuche über die fünf Dateien mit einem Datei-Glob lieferte „keine Treffer“, obwohl `<script>` in den Dateien vorkommt. Ich werte sie deshalb nicht als Beleg. Der Beleg ist das Lesen der Diffs. Eine zweite, ungefilterte Suche über `web/` fand `academy-theme` nur in `anzeige-glossar.js` und `navigation.js`, nicht in den fünf HTML-Dateien, und keinen Treffer für `postMessage`, `http-equiv`, `Content-Security-Policy`, `appId`, `signature`.

## 3. Theme-Transport `academy-theme`

**Nicht erweitert durch 2C.** Die fünf HTML-Dateien enthalten kein `academy-theme`. Der Transport liegt unverändert in Dateien, die schon zu 2B gehören:

- `src/protocol.js:12` (`THEME_PARAM`), Allowlist-Einspeisung Zeilen 67-76.
- `src/renderer/module.js:100` (`searchParams.set`).
- `navigation.js:171-176`, `anzeige-glossar.js:8-12` (nur lesen des eigenen `<html>`-Attributs).
- In `src/` gibt es keinen `postMessage`-Treffer und keinen `message`-Listener.

Grenze: Ob `src/*` seit dem 2B-Bericht (`DESIGN-HARMONY-2B-SECURITY.md`) byte-identisch geblieben ist, kann ich nicht beweisen. Ich habe keinen Schnappschuss von damals. Die Fundstellen und Zeilenbereiche stimmen mit dem 2B-Bericht überein, das ist ein Indiz, kein Beweis.

## 4. Nutzlastindex

- `git diff -U0` zeigt 8 geänderte Einträge, je `sha256` und `size`. Es wurden keine Einträge hinzugefügt oder entfernt.
- Die 8 Einträge sind: 3 aus 2B (`anzeige-glossar.js`, `navigation.js`, `lf3-client-anbindung.html`) und 5 aus 2C. Jeder 2C-Eintrag wächst um genau 160 Byte (7849, 8147, 8746, 7779, 8809), das passt zu 9 geänderten Stilzeilen.
- Ich habe `docs/operation-academy/design-harmony-2b-security/nachrechnen.js` (liest nur) erneut ausgeführt. Ergebnis wörtlich: 249 Einträge in Arbeitskopie und HEAD, `kopffelderGleich: true`, `pfadmengeGleich: true`, `arbeitskopieAbweichungVomIndex: []`, `webDateienGeaendertGegenHEAD` = dieselben 8 Dateien. Der Index passt also zur Arbeitskopie, es gibt keine Hash-Abweichung.
- `academy-module.json` ist nicht im Diff. `sizeBytes` bleibt 62017 laut Lead und Diffstatus.
- Die Nutzlastprüfung (`src/modules/manager.js`) steht nicht im Diff. Der Index wurde an die Dateien angeglichen, die Prüfung nicht an den Index. Die Nachrechnung beweist Konsistenz, nicht Harmlosigkeit. Die Harmlosigkeit der 2C-Dateien folgt aus Abschnitt 2.

Das Feld `stagingBlobAbweichungVomIndex` im Skript listet alle 8 Dateien. Das ist erwartbar: Es ist nichts gestagt, der Git-Blob entspricht noch HEAD. Es ist kein Integritätsfehler, siehe B1.

## 5. Modulgrenzen, Update, Berechtigungen

- Die fünf Dateien liegen alle im Modul `it-systemintegration/web/module/`. Kein Pfad außerhalb des Moduls, kein neuer Verweis auf andere Module oder externe Adressen im Diff.
- Update-Integrität: Index und Dateien sind konsistent (Abschnitt 4). Kein Eingriff in Updater, Manifest, Signatur oder App-ID. Das Modul bleibt `trust: private`, `signed: false` (aus dem 2B-Bericht übernommen, nicht neu gelesen). Der Index ist damit eine Konsistenzprüfung, kein Herkunftsnachweis.
- Berechtigungen: keine Änderung an `content.read`, `progress.write` (Manifest nicht im Diff).
- Lernstände und Einstellungen: Es gibt keine Skript- oder Speicheränderung. Das tatsächliche Erhalten der Lernstände ist ein Laufzeitthema und nicht von mir beobachtet.

## 6. Befunde

Keine KRITISCH-, HOCH- oder MITTEL-Befunde.

| Nr. | Stufe | Befund | Beleg | Empfehlung |
|---|---|---|---|---|
| B1 | NIEDRIG (Hygiene) | Der Index ist geändert, aber nichts ist gestagt. Wer nur einen Teil der Dateien committet, liefert Blobs ohne passenden Index. Die Installationsprüfung würde das fail-closed ablehnen (laut 2B-Bericht `manager.js:125-128`, hier nicht erneut gelesen). Es ist kein unsicherer Zustand, aber ein kaputtes Paket. | `git status`, `git diff --cached --stat` leer, Skriptausgabe `stagingBlobAbweichungVomIndex` | Beim Commit alle 5 HTML-Dateien, die 3 Moduldateien aus 2B und `payload-index.json` gemeinsam erfassen. Entscheidung beim Commander. |
| B2 | NIEDRIG (Vermischung) | Der Index enthält 2B- und 2C-Änderungen gemeinsam, ebenso der Arbeitsbaum. Eine Trennung in zwei Commits ist am Index nicht ohne Neuberechnung möglich. | Abschnitt 4 | Bewusst als ein Paket committen oder den Index je Commit neu erzeugen und mit dem Skript prüfen. |
| B3 | INFORMATIV | `.opt:has(:checked)` und `font-weight:700` ändern bei Auswahl das Layout leicht (Textbreite). Das ist funktional, nicht sicherheitsrelevant. | HTML-Diff | GLaDOS: Reflow bei 200 % Zoom prüfen. |
| B4 | INFORMATIV | `.result` nutzt weiter `var(--primaer,#0754a6)` mit Hex-Fallback und ist in 2C nicht umgestellt. Kein Sicherheitsthema, aber ein offener Theme-Rest. | HTML-Diff (Kontextzeile) | An SMITH als verbleibende Fundstelle melden. |
| B5 | INFORMATIV | Der 2B-Vorbehalt bleibt: Das Modul läuft mit `allow-scripts allow-same-origin` und kann sein eigenes `data-theme` ändern. Nur die eigene Darstellung ist betroffen. | `DESIGN-HARMONY-2B-SECURITY.md` B2, B3 | unverändert beibehalten |

## 7. Grenzen der Prüfung

- Es wurde nur der Diff gelesen. Ich habe die Academy nicht gestartet und kein gerendertes Verhalten beobachtet. Theme, Fokus, Kontrast und Zoom prüft GLaDOS.
- Die Tests (`node --test`) habe ich nicht ausgeführt. Der Nutzlast-Nachrechner lief (Abschnitt 4), die Teststufe nicht.
- `src/*` und `build/build-info.json` sind 2B-Umfang. Ich habe sie nicht erneut bewertet, nur auf Transport-Muster durchsucht.
- Meine Aussagen zu App-ID, Updater und Signaturprüfung stützen sich darauf, dass keine solche Datei im `git status` steht. Ich habe die Builder-Konfiguration nicht gelesen.
- Der Umfang „fünf Seiten“ folgt dem Auftrag. `lf3-abnahme` und `lf3-lernziel` wurden nicht geändert. Ob sie einen Theme-Bruch haben, ist hier nicht bewertet.
- Das Skript `nachrechnen.js` stammt aus der 2B-Prüfung. Es ist hier unverändert wiederverwendet.

## 8. Empfehlung

**Sicherheitlich unbedenklich im geprüften 2C-Diff.** Keine App-ID, keine Signaturprüfung, keine CSP, kein `postMessage`, keine neue Berechtigung, `academy-theme` nicht erweitert, Nutzlastindex konsistent mit der Arbeitskopie.

Auflagen:
1. Beim Commit den Index und alle betroffenen Moduldateien gemeinsam erfassen (B1, B2).
2. Nach dem letzten Dateieintrag `regenerate-payload-index.js --check` und `nachrechnen.js` erneut laufen lassen.
3. Laufzeitbelege für Hell, Dunkel, Kontrast, Fokus und Zoom stammen von GLaDOS. Diese Prüfung ersetzt sie nicht.

Dies ist keine Produktfreigabe und keine WCAG-Aussage. Die Entscheidung liegt beim Commander.
