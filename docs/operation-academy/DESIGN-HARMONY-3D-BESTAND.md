# Design Harmony 3D – Bestand gegen 0.3.1-dev.6

**Vergleich:** Arbeitsbaum gegen Commit `89a5d1da3c958ac04545f90de5b6793c891c60e6`, das öffentliche DEV `0.3.1-dev.6`.  
**Gemessen mit:** `git diff --name-status 89a5d1d` und `git diff --stat` am 22. November 2026.  
**SMITH** hat die Datei nicht fertiggestellt und wurde abgebrochen. Die Liste stammt aus diesem Git-Vergleich, nicht aus einer Schätzung.

## Erwartete Produktänderungen, uncommittet gegenüber HEAD und damit auch gegenüber 89a5d1d

| Datei | Einstufung |
| --- | --- |
| `modules/it-systemintegration/academy-module.json` | erwartet: Version `1.0.3`, `runtime.themeContract: 1` |
| `src/modules/manager.js` | erwartet: Theme-Vertrag, gleiche-Version-Sperre, Katalogangebot |
| `src/modules/spec.js` | erwartet: `themeContract` im Manifest |
| `src/renderer/design-tokens.css` | erwartet: Kontrastkorrektur über vorhandene Tokens |
| `src/renderer/module.js` | erwartet: Status und Aktualisieren |
| `src/renderer/shell.js` | erwartet: fünf Zustandssätze, keine zweite Updatequelle |
| `src/main.js` | erwartet: eine gemeinsame `catalogFile` für Manager und IPC |
| `tests/design-harmony-2b-theme.test.js` | erwartet: Test an die Tokenregel angepasst |
| `tests/hosted-module.test.js` | erwartet: Vertrag im Hosted-Web-Test |

## Nur im Arbeitsbaum, nicht in Git

`tests/design-harmony-3-theme-contract.test.js` und `tests/design-harmony-3b-update.test.js` sind untracked. Sie laufen lokal mit, ein Actions-Lauf ohne Commit sieht sie nicht.

Die Berichte unter `docs/operation-academy/DESIGN-HARMONY-3*.md` und die Probeordner sind Dokumentation. Sie liegen nicht im Installer.

## Bereits in HEAD, nicht in 0.3.1-dev.6

`DESIGN-HARMONY-DEV-ANLEITUNG.md`, `DESIGN-HARMONY-DEV-PREVIEW.md` und `DESIGN-HARMONY-DEV-STATUS.md` sind nach `89a5d1d` committed. Sie ändern die Anwendung nicht.

## Nebenwirkung des lokalen Builds

`build/build-info.json` wurde für den Kandidaten mit einem lokalen Hinweis überschrieben und ist im asar. Das ist kein Produktunterschied zu `0.3.1-dev.6` außer dem Build-Stempel. Die Datei gehört nicht in einen Commit, solange sie nur den lokalen Lauf beschreibt.

## Fehlende Dateien

Gegen `89a5d1d` fehlt im Arbeitsbaum keine der geprüften Modulnutzlastdateien. Der Index-Check meldete 249 Einträge, 0 Abweichungen, `nichtImIndex` leer. Ein signiertes Release-Manifest ist nicht fehlend im Repository. Es entsteht erst im Actions-Build und ist lokal absichtlich nicht erzeugt.
