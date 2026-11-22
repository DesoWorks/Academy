# Operation Academy – Metriken zur Secure Update Bridge (Phase N.1, Welle 2)

**Für den DEV-Windows-Lauf über GitHub fehlen Downloadzeit, Installationsdauer und Speicherbedarf.** Ein solcher A/B-Lauf ist nicht dokumentiert; die veröffentlichten Test-Releases fehlen. Der belegte Windows-Lauf aus Phase M nutzte einen lokalen DEV-Feed und ist kein GitHub-Nachweis. Quellen: [PHASE-N1.md](PHASE-N1.md), Z. 36–49; [MISSION-COMMS-N1-W2.md](MISSION-COMMS-N1-W2.md), Z. 11–13; [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 18–37.

## Fehlende Messwerte für den DEV-Windows-Lauf über GitHub

| Messwert oder Nachweis | Status | Abgrenzung / Quelle |
| --- | --- | --- |
| Downloadzeit | **Fehlt** | Vom Beginn des Asset-Downloads bis zur vollständigen Datei; [METRICS-N1.md](METRICS-N1.md), Z. 45–53. |
| Installationsdauer | **Fehlt** | Vom Installerstart bis zum Prozessende; der Neustart ist eine separate Prüfung. [METRICS-N1.md](METRICS-N1.md), Z. 52–54. |
| Speicherbedarf auf dem Datenträger | **Fehlt** | Weder die Größe der vollständigen Installation noch der zusätzliche Spitzenbedarf während des Updates ist gemessen. Die Bestandsaufnahme nennt nur die Größe einer einzelnen EXE. [WINDOWS-ENV-N1.md](WINDOWS-ENV-N1.md), Z. 5–22. |
| Startversion A, Zielversion B, Release-Tags und Build-Commits | **Fehlen** | Kein passendes A/B-Release-Paar dokumentiert; die vorhandene Phase-M-Installation ist kein gültiger Ausgangspunkt. [METRICS-N1.md](METRICS-N1.md), Z. 45–51; [WINDOWS-ENV-N1.md](WINDOWS-ENV-N1.md), Z. 20–22. |
| Größe des GitHub-Download-Assets | **Fehlt** | Lokale Installer- und Modulgrößen sind keine GitHub-Messwerte. [METRICS-N1.md](METRICS-N1.md), Z. 45–58. |
| Installierte Version nach Neustart; Erhalt von Einstellungen, Lernständen und Modulen | **Fehlt** | Die Regression für den GitHub-Pfad wurde nicht ausgeführt. [UPDATE-QA-N1.md](UPDATE-QA-N1.md), Z. 14–26. |
| Vergleichbare Updateversuche, Fehlschläge und Fehlerquote | **Fehlen** | Kein belastbarer Nenner. Testfallzähler und absichtlich ausgelöste Fehler aus Phase M zählen nicht als reale GitHub-Updateversuche. [METRICS-N1.md](METRICS-N1.md), Z. 29, 45–58. |

„Fehlt“ bedeutet nicht gemessen oder nicht belegt, nicht null. Für BETA und STABLE weist der bisherige Metrikbericht ebenfalls keine Windows-A/B-Messwerte aus ([METRICS-N1.md](METRICS-N1.md), Z. 45–56).

## Belegte Dateigrößen – kein GitHub-Download und kein Gesamtspeicherbedarf

| Datei / Kontext | Größe in Bytes | Quelle |
| --- | ---: | --- |
| Phase M, Core-Installer A (`0.3.1-dev.1`), Bootstrap | 133 425 738 | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 7–12, 18–19. |
| Phase M, Core-Installer B (`0.3.1-dev.2`), lokaler DEV-Feed | 133 425 695 | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 7–12, 21–24. |
| Phase M, Modulpaket `1.0.2`, lokaler DEV-Feed | 11 925 259 | [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 25; [windows-update-evidence.json](windows-update-evidence.json), Z. 17–27. |
| Windows-Bestandsaufnahme, installierte `DesoWorks Academy.exe` (`0.3.1-dev.2`), nur diese Datei | 250 000 896 | [WINDOWS-ENV-N1.md](WINDOWS-ENV-N1.md), Z. 7–9, 20–22. |

Phase M dokumentiert den Erhalt von Einstellungen, Lernstand und Modulbestand nach dem lokalen Core-Update. Die Bestandsaufnahme dokumentiert dagegen nur die vorhandene Installation, keinen Update-Lauf. Quellen: [WINDOWS-UPDATE-TEST-M.md](WINDOWS-UPDATE-TEST-M.md), Z. 20–26; [WINDOWS-ENV-N1.md](WINDOWS-ENV-N1.md), Z. 5–22.

## Protokollierte automatisierte Tests – keine Windows-Update-Stichprobe

| Lauf | Bestanden | Fehlgeschlagen | Quelle |
| --- | ---: | ---: | --- |
| Phase M, `npm test` vor den Builds | 72 | 0 | [PHASE-M.md](PHASE-M.md), Z. 40. |
| Phase M, `npm test` nach SemVer- und Manifestkorrektur | 78 | 0 | [PHASE-M.md](PHASE-M.md), Z. 52–56. |
| Phase N, `npm test` nach dem ersten Lauf von Paket B | 87 | 0 | [PHASE-N.md](PHASE-N.md), Z. 80–84. |
| Phase N, `npm test` nach Anschluss der GitHub-Prüfung | 87 | 0 | [PHASE-N.md](PHASE-N.md), Z. 91–97. |
| Phase N.1, Welle 1: Ricks gezielter Lauf vor Korrektur der Signatur-Assertions | 5 | 0 | [PHASE-N1.md](PHASE-N1.md), Z. 45–49. |
| Phase N.1, Welle 1: gezielter QA-Lauf laut Bericht | 5 | 0 | [UPDATE-QA-N1.md](UPDATE-QA-N1.md), Z. 5, 28–32. |
| Phase N.1, Welle 1: separater QA-Lauf mit Namensmuster laut Bericht | 91 | 4 | [UPDATE-QA-N1.md](UPDATE-QA-N1.md), Z. 5, 28–32. |

Die Teststände werden nicht addiert. Ricks gezielter Lauf enthielt zunächst unwirksame Signatur-Assertions; die Quelle nennt einen erneuten Lauf der korrigierten Datei, aber keinen separaten Ergebniszähler dafür ([PHASE-N1.md](PHASE-N1.md), Z. 49). Der QA-Bericht dokumentiert keinen vollständigen unabhängigen Suite-Lauf ([UPDATE-QA-N1.md](UPDATE-QA-N1.md), Z. 28–37).

**Methode:** Die Werte sind mit der jeweiligen Fundstelle aus vorhandenen Dateien übernommen. Für diesen Bericht wurden keine Installationsdateien neu vermessen, keine Tests ausgeführt und keine Laufzeiten aus Zeitstempeln abgeleitet.
