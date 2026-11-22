# Design Harmony – Inventar für den DEV-Preview

**Stand:** 22.11.2026 · **Ausgangsstand:** uncommittete Änderungen auf `feature/phase-n1-release-connectivity`, HEAD `46283bf`. Grundlage sind die gelesenen Anwendungsdiffs, die Etappenberichte, die Workflow- und Paketdateien sowie die öffentlichen GitHub-Metadaten. Dieses Inventar ist keine Release-Freigabe.

## 1. Umfang aus Etappe 2A bis 2D

| Etappe | Gehört in den Preview |
| --- | --- |
| [2A](DESIGN-HARMONY-2A.md) | Pilot „Client-Anbindung“: Karten, Antwortoptionen und Netzskizze verwenden vorhandene Farbrollen statt weißer Fallbacks; Tastaturfokus und ausgewählte Antworten bleiben unterscheidbar. |
| [2B](DESIGN-HARMONY-2B.md) | Die Academy ist die zentrale Quelle für Hell, Dunkel und hohen Kontrast. Die Shell speichert die Wahl, das Modul übernimmt sie beim Öffnen und bei interner Navigation. Die lokale Farbwahl ist in der Academy deaktiviert; lokale Leseoptionen und die eigenständige Modulansicht behalten ihre bisherige Funktion. |
| [2C](DESIGN-HARMONY-2C.md) | Dieselbe Darstellung für die fünf weiteren LF3-Seiten DHCP, DNS, Fehlerbild-Protokoll, IPv4-Konfiguration und Verbindung eingrenzen. Die sechs Seitendiffs ändern nur CSS, keine Lerntexte, Aufgaben oder Auswertungslogik. |
| [2D](DESIGN-HARMONY-2D.md) | Sichtbarer Fokus auf `MAIN` für genau diese sechs Seiten. Der bestehende native Skip-Link bleibt unverändert: Laut 2D-Tastaturprobe springt Enter auf `MAIN`, der nächste Tab führt in den Inhalt. |

Draußen bleiben Änderungen an Lernlogik, Bewertung und gespeicherten Lernständen, die didaktische Überarbeitung, weitere Lernfelder sowie `lf3-lernziel.html` und `lf3-abnahme.html`. Auch ein Umbau von Updatekanälen, App-ID, Sandbox, CSP oder Signaturverfahren ist nicht Teil dieses Previews. Die statische Bestandsaufnahme ersetzt keinen Laufzeittest der Lernstandspersistenz.

## 2. Basisversion und erwartete DEV-Version

- [`package.json`, Zeile 4](../../package.json#L4): Die Basisversion ist `0.3.1` und bleibt unverändert. **Nicht auf `0.3.1-dev.6` setzen.** Der Workflow akzeptiert an dieser Stelle nur `MAJOR.MINOR.PATCH` ohne Zusatz.
- [`academy-dev.yml`, Zeilen 54–61 und 69](../../.github/workflows/academy-dev.yml#L54): Der Workflow liest die Basisversion, bildet `version="${base}-dev.${GITHUB_RUN_NUMBER}"` (hier `0.3.1-dev.${GITHUB_RUN_NUMBER}`) und den Tag `dev/v${version}`. Der Installer erhält die erzeugte Version als Build-Metadatum; die Paketdatei bleibt bei `0.3.1`.
- Der zuletzt erfolgreiche [DEV-Lauf `45024904270`](https://github.com/DesoWorks/Academy/actions/runs/45024904270) lief auf `dev`, hatte `run_number = 5` und erzeugte das öffentliche Prerelease [`dev/v0.3.1-dev.5`](https://github.com/DesoWorks/Academy/releases/tag/dev/v0.3.1-dev.5). In der geprüften DEV-Laufliste war er auch der jüngste Lauf.
- Der nächste auslösende Push auf `dev` ergibt ohne zwischenzeitlichen neuen Workflow-Lauf voraussichtlich `0.3.1-dev.6` (`dev/v0.3.1-dev.6`). `dev.6` liegt in der SemVer-Reihenfolge nach `dev.5`. Erst der neue Actions-Lauf belegt die Nummer; erst ein erfolgreicher Publish-Job und das öffentliche Prerelease belegen die Veröffentlichung.

## 3. Branch und Workflow-Auslöser

[`academy-dev.yml`, Zeilen 6–8](../../.github/workflows/academy-dev.yml#L6) definiert ausschließlich `push` auf den Branch `dev`; die Jobs prüfen zusätzlich `refs/heads/dev`. Ein Push nur auf `feature/phase-n1-release-connectivity` startet den DEV-Workflow nicht. Der Feature-Branch bleibt der Arbeitsbranch; ein Push auf `dev` ist ein separater Veröffentlichungsschritt nach den Prüfungen. `main` bleibt unangetastet: kein Merge nach `main`, kein Stable-Release, keine automatische Installation auf dem Rechner des Commanders.

## 4. Build-Artefakt und Nutzlastindex

- `build/build-info.json` ist auf HEAD zurückgesetzt und gehört nicht in den Feature-Commit. Der Workflow erzeugt die Datei beim Build aus `GITHUB_SHA` und Build-Zeitpunkt ([Zeilen 62–65](../../.github/workflows/academy-dev.yml#L62)); für diesen Arbeitsstand nicht erneut lokal schreiben.
- Erst die endgültigen Moduldateien stagen, dann `node scripts/regenerate-payload-index.js` ausführen. Das [Skript](../../scripts/regenerate-payload-index.js#L70) liest die Blob-IDs mit `git ls-files -s` und die kanonischen Bytes mit `git cat-file blob`. SHA-256 und Dateigröße müssen zu diesen Bytes passen, nicht zur Windows-Arbeitskopie mit möglichen CRLF-Zeilenenden. Der 2D-Bericht nennt für `styles.css` eine Messung an der Arbeitskopie; diese ersetzt die Prüfung gegen die gestagten Blobs nicht.
- Danach `modules/it-systemintegration/content/payload-index.json` und gegebenenfalls das vom Skript aktualisierte `academy-module.json` stagen. `node scripts/regenerate-payload-index.js --check` muss den endgültigen Indexstand bestätigen; zusätzlich gemeldete, im Nutzlastindex fehlende Dateien prüfen und die vollständige Testsuite ausführen. In dieser Bestandsaufnahme wurde weder gestagt noch regeneriert.

## 5. Gelesene Änderungen an Anwendungsdateien

Alle Pfade sind relativ zur Projektwurzel. Gelesen wurden die Diffs der 18 bereits geänderten Anwendungs- und Nutzlastdateien.

| Datei | Einordnung |
| --- | --- |
| `src/protocol.js` | Academy-Theme: validiert den Theme-Parameter und setzt das Root-Attribut in eingebetteten Modul-HTML-Dokumenten. |
| `src/renderer/design-tokens.css` | Academy-Theme: Farbrollen für Hell, Dunkel und hohen Kontrast. |
| `src/renderer/host.css` | Academy-Theme: Hintergrund und Textfarbe des Modul-Hosts folgen den Farbrollen. |
| `src/renderer/module.js` | Academy-Theme: gibt den Shell-Modus beim Start an den Modulrahmen weiter. |
| `src/renderer/settings.html` | Academy-Theme: Bedienelemente für den Farbmodus. |
| `src/renderer/settings.js` | Academy-Theme: lädt und speichert die Auswahl; meldet Speicherfehler. |
| `src/renderer/shell.css` | Academy-Theme und Darstellung: Farb- und Fokusrollen, Umbruch der Navigation und Mindesthöhe des Modulrahmens bei großer Darstellung. |
| `src/renderer/shell.js` | Academy-Theme: liest und speichert `academy.theme`, validiert die Auswahl und setzt den wirksamen Modus. |
| `modules/it-systemintegration/web/css/styles.css` | Nur sechs LF3-Seiten: sichtbarer Fokusring auf `MAIN`. |
| `modules/it-systemintegration/web/js/anzeige-glossar.js` | Academy-Theme in gemeinsam genutztem Modulcode: übernimmt den Shell-Modus; Standalone-Farbwahl und lokale Leseoptionen bleiben erhalten. |
| `modules/it-systemintegration/web/js/navigation.js` | Academy-Theme in gemeinsam genutztem Modulcode: reicht den Modus an interne Seitenziele desselben Moduls weiter; reine Sprungmarken und Downloads bleiben davon ausgenommen. |
| `modules/it-systemintegration/web/module/lf3-client-anbindung.html` | LF3: CSS für Karten, Optionen und Skizze (Pilot). |
| `modules/it-systemintegration/web/module/lf3-dhcp.html` | LF3: CSS für Karten, Optionen und Skizze. |
| `modules/it-systemintegration/web/module/lf3-dns.html` | LF3: CSS für Karten, Optionen und Skizze. |
| `modules/it-systemintegration/web/module/lf3-fehlerbild-protokoll.html` | LF3: CSS für Karten, Optionen und Skizze. |
| `modules/it-systemintegration/web/module/lf3-ipv4-konfiguration.html` | LF3: CSS für Karten und Optionen einschließlich IPv4-Karte. |
| `modules/it-systemintegration/web/module/lf3-verbindung-eingrenzen.html` | LF3: CSS für Karten, Optionen und Skizze. |
| `modules/it-systemintegration/content/payload-index.json` | Abgeleitete Prüfdaten zu den sechs LF3-HTML-Dateien, einem Stylesheet und zwei Modulskripten. |

**Abgrenzung:** Die konkreten Lernseitenänderungen und der neue `MAIN`-Fokusring sind auf die sechs LF3-Seiten begrenzt. Academy-Shell und gemeinsam genutzter Modulcode wirken über LF3 hinaus, wo derselbe Host oder dieselben Skripte genutzt werden. Das ist zentrale Theme-Infrastruktur, kein gezielter Rollout auf weitere Lernfelder.

## 6. Bekannte Einschränkungen

- **DHCP-Didaktik offen:** Die Übung zeigt erwartete Angaben vor der Aufgabe; eine falsche Antwort nennt die richtige Aussage direkt. Das bleibt im Preview unverändert ([2D-Bericht](DESIGN-HARMONY-2D.md)).
- **Keine WCAG-Freigabe:** Einzelne Fokus-, Zoom- und Reflow-Messungen ersetzen keine vollständige Prüfung. Insbesondere ist der Vorwärtsweg aus dem Modulrahmen nicht bis zum Ende belegt.
- **Kein Screenreader-Nachweis:** Vorhandene ARIA-Attribute belegen keine tatsächliche Screenreader-Ausgabe.
- **Kein Rollout weiterer Lernfelder:** Die Gesamtmission Design Harmony bleibt offen. Der DEV-Preview dient ausschließlich der praktischen Erprobung dieses Stands.
