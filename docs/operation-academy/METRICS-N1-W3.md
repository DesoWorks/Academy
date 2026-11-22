# Phase N.1 – Welle 3: CI- und Update-Metriken

**Stand: 22.11.2026.** Die beiden dokumentierten Windows-Läufe von GitHub Actions scheiterten im Testjob. Beide übersprangen den Build. Für Welle 3 sind deshalb aus diesen Läufen weder ein signiertes DEV-Manifest noch Release-Artefakte belegt. Phase N.1 bleibt offen.

## Testzahlen und Laufzeiten

| Lauf | Bestanden | Fehlgeschlagen | Testjob | Gesamtlauf | Build / Artefakte |
| --- | ---: | ---: | --- | --- | --- |
| Welle 2, lokal: `node --test tests/` mit `TEMP` und `TMP` auf `D:\jarvis-tmp` | 131 | 0 | Nicht gemessen | Nicht gemessen | Nicht Teil des Testlaufs |
| [Actions-Lauf 1](https://github.com/DesoWorks/Academy/actions/runs/45011517474), `34c4c28` | Nicht belegt | 4 | 53 s, fehlgeschlagen | 58 s | Übersprungen; keine Artefakte |
| [Actions-Lauf 2](https://github.com/DesoWorks/Academy/actions/runs/45012452830), `0777690` | Nicht belegt | 4 | 42 s, fehlgeschlagen | 45 s | Übersprungen; keine Artefakte |

Der lokale Welle-2-Lauf endete mit Exit 0; kein Test wurde übersprungen. Der separat dokumentierte lokale Kontrolllauf von GLaDOS ohne die TEMP-Umleitung ergab ebenfalls 131 bestanden und 0 fehlgeschlagen. Die lokalen Zahlen werden nicht addiert und nicht auf den Windows-Runner übertragen. Quelle: [Welle-2-Abschlussbericht](PHASE-N1-WELLE-2.md), einschließlich Actions-Nachtrag.

Die Laufzeiten stammen aus den verlinkten GitHub-Übersichten. Laut API-Angaben aus Ricks Übergabe startete Lauf 2 um `10:26:30 UTC`; der Testjob lief von `10:26:33` bis `10:27:15 UTC`. Auch `publish` wurde in Lauf 2 übersprungen. **Builddauer: nicht gemessen.** Die in GitHub für den übersprungenen Build angezeigten `0 s` sind keine Buildmessung.

## Ursache des CI-Fehlers

In beiden Actions-Läufen meldeten vier Modultests `Eine Nutzlastdatei hat die falsche Größe`. Nach Ricks Messung enthält der `payload-index` Größen für Dateien mit CRLF-Zeilenenden aus der lokalen Arbeitskopie; der CI-Checkout enthält dieselben Dateien mit LF-Zeilenenden. Die Bytezahlen stimmen daher nicht mit dem Index überein. Der zweite Lauf nach der `.gitattributes`-Änderung scheiterte weiterhin mit demselben Fehler. Konkrete Soll- und Ist-Bytewerte liegen für diesen Bericht nicht vor.

## Nicht gemessene Welle-3-Werte

| Kennzahl für das Windows-DEV-Update aus GitHub Actions | Stand |
| --- | --- |
| Größe der DEV-Release-Artefakte (Bytes je Datei) | Nicht gemessen |
| Downloadzeit (Beginn bis vollständige Datei) | Nicht gemessen |
| Installationszeit (Installerstart bis Prozessende) | Nicht gemessen |

Der Windows-A/B-Lauf `0.3.1-dev.3` → `0.3.1-dev.4` aus Welle 2 nutzte lokal erstellte Builds. Er ist kein Messwert für ein Welle-3-Update aus GitHub Actions. „Nicht gemessen“ bedeutet nicht null.
