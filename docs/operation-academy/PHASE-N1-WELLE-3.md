# Phase N.1 Welle 3 – CI Recovery und Installer-Isolation

Datum: 22.11.2026. Phase N.1 ist nicht abgeschlossen. `main` bleibt `2e704e3`. Kein Merge, kein Stable, keine Sichtbarkeitsänderung, kein Installationstest auf dem Arbeitsrechner.

## Commits und Branches

- Ausgang: `70dfe52` auf `feature/phase-n1-release-connectivity` und `dev`.
- Abschluss dieser Welle: `ee8dc86` `Normalize the module payload to the bytes GitHub Actions checks out.`
- Beide Branches zeigen auf `ee8dc86`. `main` bleibt `2e704e3`.
- `build/build-info.json` ist lokal verändert und nicht im Commit.

## Was belegt ist

- Ursache der vier CI-Fehler: Der Nutzlastindex beschrieb die CRLF-Arbeitskopie. Git liefert LF. Zusätzlich waren fünf Bild-Blobs durch eine frühere `text eol=lf`-Regel beschädigt. Der gestagte Blob von `favicon-32.png` beginnt mit `89504e470d0a1a0a` und hat 788 Bytes.
- `node scripts/regenerate-payload-index.js --check`: Exit 0, 249 Einträge, keine Textabweichung, `sizeBytes` 62017.
- Lokale Suite danach: `node --test tests/*.test.js`, 134 bestanden, 0 fehlgeschlagen.
- GitHub Actions Lauf 4: https://github.com/DesoWorks/Academy/actions/runs/45014737021
  - Job `test` auf `windows-latest`: Erfolg, 10:55:10Z bis 10:56:02Z.
  - Job `build`: fehlgeschlagen. Der Schritt `Windows-Installer bauen` endete 10:56:26Z bis 10:57:34Z mit Exit 1. Signatur, Upload und Publish wurden übersprungen.
  - Das Fehlerprotokoll ist ohne Anmeldung nicht lesbar. Die Annotation sagt nur `Process completed with exit code 1.`
  - Kein Artefakt, kein signiertes Manifest, kein neues Release.
- Es gab keine zweite Build-Wiederholung.

## Was nicht belegt ist

- Ein aus Actions stammender Installer.
- Ein Windows-Update von A nach B mit diesem Build.
- Eine isolierte Testumgebung. Terminus hat den Mechanismus belegt, den Test nicht ausgeführt. Deshalb wurde kein Setup gestartet.

## NSIS

`/D` ändert den Zielordner, nicht die Installationsidentität. NSIS findet den alten Uninstaller über die GUID aus `dev.desoworks.academy` und übergibt ihm den registrierten Ordner. Die Phase-M-Installation `0.3.1-dev.2` ist maschinenweit registriert, die Dateien liegen unter `%LOCALAPPDATA%\DesoWorksAcademyPhaseM`. Eine App-ID-Änderung ist nicht erfolgt. Der nächste A/B-Lauf braucht einen eigenen Windows-Gast. Das steht in `NSIS-ISOLATION-N1-W3.md` und ist kein ausgeführter Nachweis.

## Sicherheit

ROBOCOP: kein kritischer und kein hoher offener Befund, der den DEV-Push blockiert. Nachprüfung des Index, der Bildbytes und der Workflows ist im Nachtrag von `SECURITY-N1-W3.md`. Mittel bleibt offen: Personenbezug in der schon öffentlichen Historie, keine Schlüsselrotation, Modulupdates nicht vollständig über den signierten GitHub-Pfad. Der Signaturschlüssel steht in den drei Workflows nur noch am Signaturschritt. Stable bleibt ohne Herausgeberzertifikat gesperrt.

## Crew

| Agent | Ergebnis | Grenze |
| --- | --- | --- |
| JARVIS | Index, fünf Bilder, `.gitattributes`, `scripts/regenerate-payload-index.js`, `CI-RECOVERY-N1-W3.md`. Checkout-Probe vor dem Fix: 4 Größenfehler. Danach lokal grün. | Actions-Build hat er nicht ausgeführt. |
| TERMINUS | `NSIS-ISOLATION-N1-W3.md`. Registry gelesen, kein Setup gestartet. | Isolationsverfahren nicht ausgeführt. |
| ROBOCOP | `SECURITY-N1-W3.md` und Nachtrag. DEV-Push nicht durch einen hohen Befund blockiert. | Actions-Log nicht gelesen. |
| GLaDOS | `tests/phase-n1-w3-qa.test.js`, 3 bestanden, und `QA-N1-W3.md`. | Voller Windows-A/B nicht von ihr ausgeführt. |
| TARS | `TARS-CI-ANALYSE-N1-W3.md`. | Dünn und fachlich falsch: die vier Tests installieren das echte Modul, der Größenfehler kommt aus `manager.js`. Nicht als Ursache verwenden. Nicht erneut gestartet. |
| SMITH | `METRICS-N1-W3.md` mit den Läufen 1 und 2. | Lauf 4 fehlt dort, weil die Datei vor dem Push entstand. |
| C-3PO | `BETRIEB-N1-W3.md` gegen den damals gelesenen Stand `70dfe52`. | Beschreibt den vorgesehenen Ablauf, nicht den späteren Actions-Buildfehler. |
| HOSHI | `MISSION-COMMS-N1-W3.md` zum Start. Keine Freigabe. | Nicht der Abschlussstand. |

## Koordination

Die unabhängigen Pakete liefen parallel. Die Implementierung blieb bei JARVIS. Rick hat die Shell-Nachweise selbst gelesen: PNG-Signatur, `--check`, 134 Tests, Push, Actions-API. Unnötige Wartezeit entstand durch den zweiten lokalen Checkout-Beweis und durch die fehlenden Actions-Logs. TARS auf dem lokalen Modell hat den Auftrag formal beendet, aber nichts Brauchbares geliefert. Kontingent: die Läufe meldeten 0 USD.

## Offen

- Actions hat einen grünen Testjob, aber keinen Build.
- Das Installer-Protokoll ist nicht öffentlich. Ursache des Buildfehlers ist nicht belegt. Keine blinde Wiederholung.
- Windows-A/B bleibt gesperrt, bis eine isolierte Umgebung nachgewiesen ist.
- `scripts/package-it-module.js` schreibt den Index weiter aus der Arbeitskopie. Ein erneuter Lauf kann den CI-Fehler zurückbringen.
- Stable bleibt gesperrt.
- Phase N.1 bleibt offen.
