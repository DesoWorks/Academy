# Phase N.1 – Metriken zur Release-Anbindung

**Befund:** Phase M belegt ein installiertes Windows-Update über einen lokalen DEV-Feed. Phase N belegt automatisierte Tests, aber kein installiertes Windows-Update über GitHub. Für Phase N.1 wurde der Windows-A/B-Lauf über öffentliche GitHub-Releases noch nicht ausgeführt; laut Auftragsstand sind keine GitHub-Releases vorhanden. Die Phase-M-Größen sind keine Messwerte für GitHub-Downloads.

**Quellen:** [PHASE-M.md](PHASE-M.md), [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md) und [PHASE-N.md](PHASE-N.md). Die Tabellen übernehmen die protokollierten Angaben mit Fundstelle. Bytewerte sind ungerundet; es wurden keine Binärdateien nachgemessen und keine neuen Tests ausgeführt.

## Phase M – installierter Windows-Lauf, lokaler DEV-Feed

| Befund | Version / Ergebnis | Größe (Bytes) | Quelle |
| --- | --- | ---: | --- |
| Core A: Bootstrap in separater Installation | `0.3.1-dev.1`, installiert | 133 425 738 | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 7–12, 18–19 |
| Core B: Update aus A | `0.3.1-dev.2`, danach als Dateiversion und in der Registry bestätigt | 133 425 695 | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 7–12, 22–24; [PHASE-M.md](PHASE-M.md), Z. 34–36 |
| Prüfung mit falscher Prüfsumme für B | Download verworfen; A blieb `0.3.1-dev.1` | 133 425 695 | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 22 |
| Modulupdate über denselben Feed | `1.0.1` → `1.0.2`; Core blieb `0.3.1-dev.2`, Lernstand erhalten | 11 925 259 | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 20, 24–25 |
| Absichtlich fehlschlagender Installer | Ziel `0.3.1-dev.3`, Prozesscode `1`; Core blieb `0.3.1-dev.2`, Status nach Neustart `interrupted` | Nicht dokumentiert | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 26–27 |
| Vorhandene Program-Files-Installation | `0.3.0`, nicht aktualisiert | Nicht dokumentiert | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 14, 31–36 |

Die Core-Builds waren unsigniert ([WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 9–12). Nach dem Core-Update waren der Einstellungsmarker, das Sicherungsintervall von 24 Stunden, der Modulstand, der Lernstand und die Sicherung weiterhin vorhanden. Die im Setup eingestellte Zahl von 6 Sicherungen wurde nach dem Update nicht als Anzahl vorhandener Sicherungen nachgezählt ([WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 20, 24; [PHASE-M.md](PHASE-M.md), Z. 37–38). Der gezielt herbeigeführte Installerabbruch belegt keinen Rollback eines teilweise geschriebenen Installationsverzeichnisses ([PHASE-M.md](PHASE-M.md), Z. 44–50).

## Protokollierte Testläufe

| Stand | Bestanden | Fehlgeschlagen | Quelle |
| --- | ---: | ---: | --- |
| Phase M, `npm test` vor den Builds | 72 | 0 | [PHASE-M.md](PHASE-M.md), Z. 40 |
| Phase M, `npm test` nach SemVer- und Manifestkorrektur | 78 | 0 | [PHASE-M.md](PHASE-M.md), Z. 52–56 |
| Phase N, Paket B nach dem ersten Lauf; Ausführung durch Rick | 87 | 0 | [PHASE-N.md](PHASE-N.md), Z. 80–84 |
| Phase N, nach Anschluss der GitHub-Prüfung; Ausführung durch Rick | 87 | 0 | [PHASE-N.md](PHASE-N.md), Z. 91–97 |

Das installierte `0.3.1-dev.2` enthielt die SemVer-Korrektur für den Vergleich mit `0.3.1-dev.10` noch nicht ([PHASE-M.md](PHASE-M.md), Z. 52–56). Die beiden Phase-N-Zeilen sind getrennt protokollierte Stände derselben Testsuite und werden nicht addiert. Die Testresultate belegen keine Fehlerquote bei realen Updates; dafür fehlen eine definierte Stichprobe und vergleichbare Versuche. Auch die gezielt ausgelösten Fehlerfälle aus Phase M sind dafür keine Stichprobe.

## Protokollierte Commit-Stände

| Bezug | Commit | Quelle |
| --- | --- | --- |
| Phase M: Client-/Feed-Stand | `7876297` | [PHASE-M.md](PHASE-M.md), Z. 3; [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 12 |
| Phase M und N: berichteter `main`-Stand | `2e704e3` | [PHASE-M.md](PHASE-M.md), Z. 3, 12; [PHASE-N.md](PHASE-N.md), Z. 5–7, 49, 93 |
| Phase N: Ausgangsbasis und HEAD vor Dispatch | `49b089ace795e504d2147d35c82bfc9655240a9e` (kurz `49b089a`) | [PHASE-N.md](PHASE-N.md), Z. 5–7, 25–28 |
| Phase N: Abschluss Paket A | `54a5330` | [PHASE-N.md](PHASE-N.md), Z. 56–58 |
| Phase N: geprüfter Anschluss der GitHub-Prüfung | `e8b78f6` | [PHASE-N.md](PHASE-N.md), Z. 91–97 |

## Fehlende Messwerte

**Phase M:** Der Windows-Bericht nennt Dateigrößen, Aktionen und Ergebnisse, aber keine Download- oder Installationsdauer und keine vergleichbare Update-Fehlerquote ([WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 5–29).

**Phase N.1 – Windows A/B über öffentliche GitHub-Releases:** Alle Felder bleiben bis zum jeweiligen tatsächlich ausgeführten Lauf offen. „Fehlt“ bedeutet weder null noch erfolgreich.

| Zu erfassen | DEV | BETA | STABLE |
| --- | --- | --- | --- |
| Installierte Startversion A | Fehlt | Fehlt | Fehlt |
| Zielversion B, GitHub-Release/Tag und Build-Commit | Fehlt | Fehlt | Fehlt |
| Größe des heruntergeladenen GitHub-Assets (Bytes) | Fehlt | Fehlt | Fehlt |
| Downloadzeit (Downloadbeginn bis vollständige Datei) | Fehlt | Fehlt | Fehlt |
| Installationszeit (Installerstart bis Prozessende) | Fehlt | Fehlt | Fehlt |
| Installierte Version beim Neustart und Ergebnis der Datenübernahme | Fehlt | Fehlt | Fehlt |
| Updateversuche und fehlgeschlagene Versuche | Fehlt | Fehlt | Fehlt |
| Fehlerquote (fehlgeschlagene Versuche / alle vergleichbaren Versuche) | Fehlt | Fehlt | Fehlt |

Phase N nennt Workflows und den GitHub-Prüfpfad, dokumentiert aber weder einen Workflow-Lauf noch einen Windows-A/B-Lauf ([PHASE-N.md](PHASE-N.md), Z. 82–84, 91–97). Deshalb werden Testzahlen und lokale Dateigrößen nicht als Ersatz für Messwerte aus GitHub-Releases verwendet.
