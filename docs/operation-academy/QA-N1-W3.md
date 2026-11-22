# QA-Bericht – Operation Academy, Phase N.1 / Welle 3

**Prüfer:** GLaDOS, unabhängige QA  
**Datum:** 22.11.2026  
**Branch:** `feature/phase-n1-release-connectivity`  
**HEAD:** `70dfe52f0db6ec4d0cf091ec03411f5ea84ce7a7`  
**Abgrenzung:** Dieser Bericht beurteilt nur die hier ausgeführten synthetischen Updater-Regressionen. Er ist keine Freigabe für Phase N.1 und kein Beleg für Windows-CI oder Installationsverhalten.

## Ergebnis

**EINGESCHRÄNKT.** Die drei neu angelegten synthetischen Regressionstests bestehen lokal. Sie belegen Zurückweisung manipulierter Manifestbytes, Zurückweisung eines falschen SHA-256 sowie Unverändertheit lokaler Installations-/Lernstandmarker nach einem simulierten abgebrochenen Download. Der Test verwendet ausschließlich ein synthetisches Installer-Bytepaket und startet keinen Installer.

Nicht nachgewiesen sind Windows-GitHub-Actions, ein Build/Release-Artefakt aus Actions, ein Update aus einem solchen Build und die Ursache bzw. sichere Isolation der NSIS-Nebenwirkung. Phase N.1 bleibt offen.

## Ausgangslage und Scope

Der bereitgestellte Lead-Kontext hält fest: Lauf `45012452830` ist rot mit vier Modulinstallations-Testfehlern wegen falscher Nutzlastgröße; diese vier Tests dürfen nicht umgeschrieben werden. Die lokale Welle-2-Suite mit 131 Erfolgen ist kein CI-Nachweis. Der Windows-A/B-Test aus Actions ist nicht gelaufen. NSIS entfernte eine bestehende Installation derselben App-ID. Die Installation `%LOCALAPPDATA%\DesoWorksAcademyPhaseM` wurde ausdrücklich nicht als Testziel verwendet.

Der tatsächliche lokale Stand wurde zusätzlich geprüft:

- Branch: `feature/phase-n1-release-connectivity`, Tracking `origin/feature/phase-n1-release-connectivity`.
- HEAD: `70dfe52f0db6ec4d0cf091ec03411f5ea84ce7a7`.
- Vorhandene Änderung außerhalb dieses Auftrags: `M build/build-info.json`; nicht verändert.
- Bereits unversionierte Dateien anderer Arbeiten waren vorhanden: `docs/operation-academy/BETRIEB-N1-W3.md`, `METRICS-N1-W3.md`, `MISSION-COMMS-N1-W3.md` und `scripts/regenerate-payload-index.js`; nicht verändert.
- Einzige von dieser QA neu angelegte Testdatei: `tests/phase-n1-w3-qa.test.js`.

Prüfgrundlage im Code: `src/updates/service.js` und `src/updates/manifest-sign.js`; bestehende synthetische Fixture-Methodik in `tests/phase-n1-w2-updater.test.js`. Produktionscode, bestehende Tests, `payload-index.json` und Workflows wurden nicht geändert. Die neuen Pakete enthalten keine echten Moduldateien; keine Zeilenenden- oder Payload-Größenannahmen eines realen Moduls.

## Ausgeführte Tests

Befehl:

```text
node --test tests/phase-n1-w3-qa.test.js
```

Ergebnis: **3 bestanden, 0 fehlgeschlagen, 0 übersprungen**, Exitcode 0 (Node.js `node:test`; Laufzeit 557.5972 ms).

| Testfall | Ergebnis | Beleg / Aussage |
|---|---|---|
| Manipulierte Manifestbytes bei unveränderter Signatur | BESTANDEN | `service.check()` liefert `phase: rejected`, kein verfügbares Update; `updates/incoming` bleibt leer. |
| Falscher SHA-256 im gültig signierten Manifest | BESTANDEN | Paket wird als verfügbar erkannt, Download endet mit `phase: failed`, `error: hash-mismatch`; kein Installerpfad und keine Incoming-Datei. |
| Downloadabbruch | BESTANDEN | Fetch für Installer wirft synthetisch einen Verbindungsfehler. Lokale Markerdatei `installed-version.txt` sowie `learning-progress.json` sind bytegleich zum Zustand vor dem Versuch; Incoming bleibt leer. |

Die Markerdateien sind synthetische Dateien innerhalb eines temporären Testdatenordners. Das beweist, dass dieser Downloadpfad sie nicht verändert; es ist kein echter Installerlauf und keine direkte Prüfung einer produktiven SQLite-Datenbank.

## Nicht geprüft / nicht bestanden

- **Vollständige Suite auf GitHub-Windows-Runner:** NICHT GEPRÜFT in diesem Auftrag. Die bekannten vier CI-Fehler bleiben offen; keine Behauptung, sie seien behoben.
- **Actions-Build und Release-Artefakte/Manifest-Signatur:** NICHT GEPRÜFT.
- **Update aus einem Actions-Artefakt unter Windows:** NICHT GEPRÜFT.
- **NSIS-Identität, Registry-/Uninstall-Schlüssel und parallele Installationen:** NICHT GEPRÜFT. Kein Installer wurde gestartet und keine vorhandene Installation berührt.
- **Erhalt einer echten `academy.sqlite` beim Installerupdate:** NICHT GEPRÜFT; nur synthetischer Download-Abbruch mit Markerdateien geprüft.
- **Gesamte Testsuite lokal:** NICHT GEPRÜFT in diesem Lauf; nur der neue fokussierte Test wurde ausgeführt.

## QA-Urteil

Die neuen, eng abgegrenzten synthetischen Tests bestehen und liefern einen lokalen Regressionstest für die drei angefragten Schutzfälle. Sie ersetzen weder den Nachweis des parallelen CI-/Payload-Index-Fixes noch einen Windows-Installer-A/B-Test. Keine Änderung der App-ID wurde vorgenommen oder empfohlen. Für einen Installationstest ist vorab eine nachgewiesene Isolation erforderlich; `%LOCALAPPDATA%\DesoWorksAcademyPhaseM` bleibt ausgeschlossen.
