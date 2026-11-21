# Phase K – Stability & Trust

**Stand:** 2026-11-21  
**Branch:** `feature/phase-k-stability-trust`  
**Ausgang:** `2b787e3` auf `feature/phase-j-it-module`  
**Abschlusscommit der Umsetzung:** `84f7fdf`  
**main:** unverändert `2e704e3`  
**Push:** keiner. **Merge:** keiner. **Release:** keines.

Phase K ist lokal stabilisiert und nicht produktionsfreigegeben. GLaDOS bewertet den Stand eingeschränkt, weil sie die Fensterbedienung nicht selbst geklickt hat. Ein nicht durchgeführter Test gilt nicht als bestanden.

## Was sich geändert hat

Die LF3-Abnahme hatte ein Inline-Skript. `MODULE_CSP` erlaubt nur `script-src 'self'`. Die Policy wurde nicht gelockert. Der Skriptblock liegt jetzt in `modules/it-systemintegration/web/js/lf3-abnahme.js` und wird mit `<script src="../js/lf3-abnahme.js"></script>` geladen. Der Nutzlastindex und `sizeBytes` wurden nachgezogen. Die Modulversion ist `1.0.1`, damit ein bereits installiertes `1.0.0` ersetzt werden kann.

`package.json` nutzt `signExecutable: false` statt `signAndEditExecutable: false`. Sonst schreibt der Builder weder Icon noch Produktnamen ins EXE.

## Nachweise, die Rick selbst ausgeführt hat

- `npm test`: 64 bestanden, 0 fehlgeschlagen. Darin `tests/lf3-csp.test.js` und `tests/phase-k-updates.test.js`.
- Electron-Fenster, separates Datenverzeichnis, nicht das Academy-Profil des Commanders: Seite geladen, 9 Lektionen, 78 Radios, Speichern mit der Meldung „Gespeichert, nur in diesem Browser.“ Zweiter Prozess: „Gespeicherter Stand von 21.11.2026, 22:41:01 geladen.“ Bilder: `fenster-lf3.png`, `fenster-lf3-neustart.png`.
- Modulupdate `1.0.0` auf `1.0.1` behält `module_kv`. Beschädigter Index, inkompatibler Core und Downgrade ersetzen die Installation nicht. Ein Core-Download mit falscher Prüfsumme endet mit `hash-mismatch` und lässt das Modul liegen.
- Seitenrauch für 15 URLs in `page-smoke.json`. Das sind nicht alle 100 HTML-Seiten.
- Laborzeiten mit abgeschalteter Hardwarebeschleunigung: bereit 46 ms, Startseite 197 ms, Modulindex 268 ms, LF3 352 ms, RSS etwa 103 MB. Das ist kein Kaltstart des Installers und kein Langlauftest.
- Windows-Testbuild unsigniert. Details in `WINDOWS-TEST.md`.

## Crew

| Wer | Datei | Grenze |
| --- | --- | --- |
| Jarvis | CSP-Auslagerung und `tests/lf3-csp.test.js` | Hat den Nutzlastindex nicht nachgezogen. Rick hat das danach getan. |
| Terminus | `TERMINUS-PHASE-K.md`, `MIGRATION-LEARNSTANDS.md`, `UPDATE-ARCHITECTURE.md` | Konzept. Keine automatische Übernahme alter Lernstände. |
| RoboCop | `SECURITY-PHASE-K.md` | Code gelesen, Tests nicht selbst ausgeführt. Phase-J-Sperre auf den mitgelieferten Modulordner hält. Kein blockierender Befund. Community nur als zwei Stufen konzipiert. |
| Rick | `SECURITY-PHASE-K-NACHPRUEFUNG.md` | Index und 64 Tests nach RoboCops Lesestand. |
| GLaDOS | `QA-PHASE-K.md` | Selbst `npm test` mit 64/64. Gesamturteil eingeschränkt. |

## Abschlusskriterien

| Kriterium | Stand |
| --- | --- |
| LF3 CSP-konform und bedienbar | Bestanden im Electron-Fensterlauf von Rick. GLaDOS hat diesen Klick nicht wiederholt. |
| Regressionstest | Bestanden. |
| RoboCop-Nachprüfung der Phase-J-Korrektur | Codeprüfung bestanden. Laufzeittests danach von Rick. |
| GLaDOS-Gesamtprüfung | Eingeschränkt. Keine vollständige Fensterabnahme. |
| Lernstände überleben einen Neustart | LF3-localStorage im zweiten Electron-Prozess bestanden. Auf dem sauberen Windows-Konto nicht geprüft. |
| Sicherung und Wiederherstellung | Vorhandene automatisierte Tests bestanden. Kein frischer Fensterlauf. |
| Updatekonzept | Lokale Testpakete bestanden. Kein produktiver Feed, kein Stable-Update. |
| Aktueller Windows-Testbuild | Vorhanden, unsigniert, Version 0.3.0. Nicht der Phase-G-Installer. |
| Saubere Installation | Installer-Exit 0 und Prozessstart als `AcademyKTest`. Modul, Aufgabe, Lernstand, Updates und Deinstallation dort nicht geprüft. Konto danach entfernt. |
| Alte Lernstandsmigration | Dokumentiert, nicht implementiert. |
| Einschränkungen genannt | Diese Datei. |

## Offen für Phase L, nicht für einen Release

- Herausgeberzertifikat. Ohne Signatur kein Stable-Release.
- Mehrstufiges ICO.
- Automatische Übernahme alter Desktop-Lernstände, mit Backup und ausdrücklicher Zustimmung. Core-Backup deckt den Web-localStorage nicht ab.
- Stable-Updatepfad für den gepackten Core und ein unabhängiger Modulfeed.
- Vollständige fachliche Durchsicht aller 100 Lernseiten.
- Deinstallation über die Windows-Systemsteuerung auf einem sauberen Konto.

IT-Ausbildung und Verwaltung-Ausbildung wurden nicht verändert. Kein Push auf `DesoWorks/Academy`.
