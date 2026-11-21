# Unabhängiger QA-Bericht – Phase K: Stability & Trust

**Prüfdatum:** 2026-11-21 (Station-Datum)  
**Projekt:** DesoWorks Academy  
**Branch:** `feature/phase-k-stability-trust`  
**Commit:** `84f7fdf`  
**Arbeitsbaum zu Prüfungsbeginn:** `git status --short` ohne Ausgabe (sauber)  
**Scope:** Nur lesende Prüfung plus Ausführung der vorhandenen Tests. Kein Produktcode, package.json, Testcode oder Git-Zustand wurde geändert. Kein Commit, Push, Merge oder Release.

## Gesamturteil: EINGESCHRÄNKT

Die automatisierte Suite besteht vollständig; ausgewählte Struktur- und Funktionsnachweise stützen Core, Modulverwaltung, LF3, Datenhaltung und F11. Das ist keine vollständige End-to-End-Abnahme. Insbesondere wurde die Fensterbedienung von mir nicht vollständig selbst geklickt. Die beiden bereitgestellten LF3-Bilder belegen sichtbare Zustände, nicht sämtliche Interaktionen. Der saubere Windows-Kontotest umfasste Installer und Start, nicht Modul, Lernstand oder Deinstallation. Das Gesamtprodukt ist daher **nicht als vollständig bestanden** zu bewerten.

## Prüfprotokoll

Selbst ausgeführt im Repository:

- `git rev-parse --short HEAD` → `84f7fdf`.
- `git status --short` → keine Ausgabe; Arbeitsbaum sauber.
- `npm test` → **64 Tests, 64 bestanden, 0 fehlgeschlagen, 0 übersprungen**, Exitcode 0, Laufzeit ca. 4,33 s.

Die Suite enthält automatisierte Prüfungen zu CSP/LF3, Shell-Seiten, Modulinstallation/-isolierung, Persistenz und Migration, Updates/Integrität, Fenstergrenzen und F11. Ein grüner Testlauf belegt nur die geprüften Fälle, nicht vollständige fachliche Korrektheit oder alle Benutzerabläufe.

## Pflichtbereiche – Einzelbewertung

| Pflichtbereich | Status | Beleg und Abgrenzung |
| --- | --- | --- |
| Core-Startseite | **bestanden** | `src/renderer/home.html` wurde gelesen: Academy-Begrüßung, Lernbereiche, Katalog-Einstieg und Core-Navigation über `shell.js`; `npm test` enthält zusätzlich „Shell-Seiten und Beispielmodul sind vorhanden“ sowie Referenzprüfungen. Belegt ist hier Quellstruktur und Testpass, nicht die vollständige interaktive Bedienung der Startseite. |
| Modulmanager (nur soweit Dateien und Tests belegen) | **bestanden** | `src/modules/manager.js` gelesen. Im Testlauf bestanden u. a. Publisher-/ID-Schutz, Signatur, Installationspfade, Installation/Deinstallation, Datenisolierung und Updatefälle. Beurteilung ausdrücklich auf diesen Code und diese automatisierten Fälle begrenzt; keine vollständige GUI-Bedienprüfung des Managers. |
| IT-Bereiche | **nicht geprüft** | `docs/operation-academy/page-smoke.json` meldet geladene Antworten für 15 konkrete academy://-URLs: Übersicht, LF1–LF9, Werkzeugkiste, PC-Explorer, RAID- und BWL-Werkstatt sowie LF3. Das ist ein Smoke-Stichproben-/URL-Beleg, keine vollständige Inhalts-, Aufgaben- oder Funktionsprüfung der IT-Ausbildung. Die Datei deckt nur die dort genannten URLs ab, nicht alle 100 HTML-Seiten. |
| LF3-Abnahme | **nicht geprüft** | `tests/lf3-csp.test.js` wurde gelesen; 4 LF3/CSP-bezogene Tests liefen erfolgreich (im Gesamtlauf enthalten): kein Inline-Skript/Ereignisattribut, externe Scriptdatei vorhanden und syntaktisch gültig, CSP `script-src 'self'` ohne unsafe-inline/unsafe-eval/nonce. Die HTML-Datei enthält am Ende den externen Verweis `<script src="../js/lf3-abnahme.js"></script>`. Die beiden vorgelegten Screenshots `fenster-lf3.png` und `fenster-lf3-neustart.png` zeigen denselben LF3-Abnahmebildschirm mit Lektion, Prüfdatum und gespeichertem Fortschritt „1 von 9 gespeichert“. Ich habe die UI nicht selbst vollständig geklickt; Eingaben, tatsächliche Aufgabenbearbeitung, Bewertung/Ergebnis und Speichern/Wiederaufruf habe ich nicht unabhängig reproduziert. Die Bilder zeigen keinen zweiten Prozessnachweis. CSP-Strukturtests schließen den Fehler im Markup ab, beweisen aber nicht die vollständige Aufgabenfunktion. |
| Datenhaltung | **bestanden** | `npm test` bestand Migration, beschädigte/neue Datenbank- und Sicherungsfälle, Restore, Export/Import-Bestätigung, Prüfsumme und Lernstandserhalt beim Modulupdate. Als automatisierte Tests belegt; keine eigene manuelle End-to-End-Prüfung der Datenhaltung im installierten Windows-Build. |
| F11 | **bestanden** | `src/window-bounds.js` und `src/window.js` gelesen; automatisierte Tests belegen F11 ohne Modifikatoren, Zurückweisung von Wiederholung/Kombinationen, Wiederherstellung von Fenstermaßen/-position sowie Controller-Umschaltung. Keine separate physische Taste im laufenden Fenster manuell gedrückt. |
| Windows-Testbuild | **nicht geprüft** | `docs/operation-academy/WINDOWS-TEST.md` dokumentiert einen unsignierten NSIS-Testbuild, Installer-Exitcode 0 in sauberem Nicht-Administrator-Benutzerkonto und anschließenden Prozessstart. Diese dokumentierte Beobachtung ist nicht von mir reproduziert. Der Test deckte Installer und Start ab, **nicht** Modulinstallation, Lernstand, Modul-/Core-Update oder Deinstallation über Windows. Langlauf ist laut Dokument wegen eines einmaligen Network-service-Restarts nicht belegt. Kein Release-Nachweis. |

## Belege und Grenzen im Detail

- `tests/lf3-csp.test.js`: vier tatsächlich ausgeführte LF3/CSP-Tests; der Testname und Assertionsumfang betreffen CSP-Markup, Scriptreferenz/Existenz/Syntax und CSP-Direktive, nicht das vollständige Lernaufgabenverhalten.
- `modules/it-systemintegration/web/module/lf3-abnahme.html`: geprüft wurde insbesondere die Script-Einbindung am Dateiende; sie verweist auf die externe Datei.
- `docs/operation-academy/page-smoke.json`: 15 dokumentierte URL-Einträge; weder Vollabdeckung noch Prüfung aller 100 HTML-Dateien.
- `docs/operation-academy/fenster-lf3.png` und `fenster-lf3-neustart.png`: beide 1264×775 PNG. Sichtbar ist der LF3-Abnahmebildschirm und ein Status „1 von 9 gespeichert“. Die Screenshots sind vorhandene Artefakte, nicht von mir während einer neuen Fensterbedienung aufgenommen.
- `docs/operation-academy/WINDOWS-TEST.md`: Dokumentation des unsignierten Testbuilds und begrenzten sauberen Benutzerkontotests; keine eigenständige Wiederholung in diesem QA-Lauf.

## Nicht geprüft

1. Vollständiges manuelles Klicken/Bedienen der Academy-Fenster, einschließlich LF3-Aufgaben, Eingabegrenzen, Bewertungslogik, Ergebnisdarstellung, Speichern und Wiederaufruf.
2. Alle 100 HTML-Seiten und sämtliche IT-Lerninhalte; `page-smoke.json` ist nur eine URL-Stichprobe.
3. Modulmanager-GUI-End-to-End-Ablauf im installierten Build, einschließlich vollständiger Installation, Wiederinstallation und Deinstallation als Benutzer.
4. Eigene Wiederholung des Windows-Installers, Startverhaltens, Langlaufs, Modul-/Core-Updates und Deinstallation. Der dokumentierte Windows-Test umfasst nur Installer und Start.
5. LF3-Speicherung nach Neustart bzw. in einem zweiten Prozess aus eigener Reproduktion; die Screenshots allein belegen das nicht.
6. Produktivsignatur, Release, Merge oder Push. Diese waren nicht Teil des Auftrags und wurden nicht ausgeführt.

**Schluss:** Die automatisierte Testbasis ist mit 64/64 bestanden. Das ist ein belastbarer Teilbefund, aber kein Ersatz für die ausstehenden vollständigen Fenster-, LF3- und Windows-End-to-End-Prüfungen. Keine Produktionsfreigabe wird ausgesprochen.
