# OPERATION ACADEMY – Phase I

Stand: 2026-11-21. Kein Release. Keine Produktionsfreigabe. Kein Push auf bestehende Hauptbranches.

## Ergebnis

Der Academy Core ist ein eigenständiges Programm. Er startet ohne installiertes Ausbildungsmodul auf einer neutralen Startseite. Die IT-Ausbildung ist nicht mehr die Anwendung und nicht mehr die Startseite. Ihre Fachinhalte liegen weiter in `DesoWorks/IT-Ausbildung` und wurden nicht migriert.

## Git

| Punkt | Wert |
| --- | --- |
| Ausgang, IT-Ausbildung | Branch `feature/operation-academy-unified-platform`, Commit `b7c60e1ae4353b6872e9af73d5e188e129420657` |
| Sicherung | Annotierter Tag `phase-h-secured-2026-11-21` auf diesem Commit. Bundle `Academy/_secure/phase-h-it-ausbildung.bundle` (nicht im Git, `.gitignore`). Kein Push dieses Branches. |
| Historie des Cores | `git subtree split -P desktop` erzeugt `split/academy-desktop`, im Academy-Repo als `main` bei `fc6ade42f3fdfb92bc8a8be6ece027814be07025` |
| IT-Ausbildung `main` / `dev` | nicht angefasst, nicht gepusht |
| Verwaltung-Ausbildung | nicht angefasst |

`DesoWorks/Academy` war am 2026-11-21 nicht vorhanden. Anlegen über die GitHub-API (`POST /orgs/DesoWorks/repos`) kam mit 404 zurück. Das ist keine Aussage, dass der Name belegt ist, sondern dass das verbundene Konto in der Organisation kein Repository anlegen darf oder die Organisation für das Token nicht sichtbar ist. Es wurde kein Ersatz-Repository im persönlichen Konto angelegt und nichts in bestehende Repos gepusht. Modul-Repositories wurden nicht angelegt. Begründung: `docs/operation-academy/REPO-NAMEN.md`. Der lokale Stand ist commit-bereit und kann gepusht werden, sobald die Org-Berechtigung steht.

## Architektur

Entscheidung: `docs/operation-academy/ADR-REPO-SPLIT.md`. Bewertung: `docs/operation-academy/TERMINUS-PHASE-I.md` (Ist-Stand vor dem letzten Code, daher dort noch die alte gebündelte Plattform erwähnt).

Der Inhaltsstamm ist `src/renderer`. Er zeigt nicht mehr auf den Parent und nicht auf das IT-Repo. `extraResources` bündelt keine fremde Plattform. Datenverzeichnis: `%APPDATA%\DesoWorks\Academy`. Alte Daten unter `DesoWorks\IT-Ausbildung` werden nicht übernommen.

## Core

- Electron-Hülle, Modulmanager, Modul-Laufzeit, Katalog, SQLite, Sicherung, Export/Import, Updateprüfung.
- Start-URL: `academy://app/home.html`.
- Core-Version `0.3.0`.
- Update-Pin: `DesoWorks/Academy`.
- Exportformat neu: `desoworks.academy.export`. Altes Format `desoworks.it-ausbildung.export` nur mit ausdrücklicher Freigabe (`allowLegacy`).

## Startseite und Navigation

Begrüßung: „Willkommen bei DesoWorks Academy.“  
Untertitel: „Entdecke Lernangebote, erweitere dein Wissen und entwickle neue Fähigkeiten.“

Erreichbar: Startseite, Meine Lernbereiche, Modul-Katalog, Einstellungen, Daten und Updates, Datensicherung, Über DesoWorks Academy. KI-Lernassistent und IDE sind als „vorgesehen“ gekennzeichnet und nicht als fertige Funktion angeboten.

Ohne Module erscheint ein leerer Zustand mit Verweis auf den Katalog. Der zuletzt geöffnete Lernbereich wird nur auf Knopfdruck wieder geöffnet, nie beim Start.

## Modulmanager

Beispielmodul `example.local.wissen-weitergeben` bleibt. Installation über den Katalogpfad und über den Ordnerdialog. Deinstallation löscht die Paketdateien im Installationspfad und behält Lernstände. Eine deinstallierte Modul-ID bleibt an den bisherigen Herausgeber gebunden. Siehe `SECURITY-PHASE-I-NACHPRUEFUNG.md`.

## Branding

Signet aus der IT-Ausbildung übernommen (`assets/brand/signet.svg`, `src/renderer/brand/signet.svg`). Fenstericon `build/icon.png` (256×256). Installer-Icon `build/icon.ico` (PNG-in-ICO, 256 px). `package.json` verweist darauf. Das Electron-Atom ist nicht das Produkticon, solange `build/icon.png` liegt.

## F11

Core-Handler in `src/window.js` über `before-input-event`. Kein zweiter Menü-Accelerator. Menü „Ansicht > Vollbild / Vollbild beenden“ nutzt dieselbe Funktion. Die Menüleiste bleibt im Vollbild sichtbar.

Fensterprüfung am 2026-11-21, echte Electron-Instanz, Datenverzeichnis `%TEMP%\academy-phase-i-check`:

- Start: Titel „DesoWorks Academy“, 1280×840 bei 640,276, neutrale Begrüßung, kein IT-Themenüberblick. Bild: `docs/operation-academy/fenster-start.png`.
- F11: 0,0 2560×1440, keine Titelleiste, Menüleiste sichtbar, dieselbe Begrüßung.
- Erneutes F11: wieder 640,276 1280×840.

Das ist eine Bedienprüfung dieses Laufs, kein Dauerbeleg für alle Monitore.

## IT-Migration

Nicht durchgeführt. Plan: `docs/operation-academy/MIGRATION-IT.md`. Windows-Labor, PC-Explorer, RAID-Labor, BWL-Werkstatt und die Lernseiten bleiben im bisherigen Repository.

## Tests

`npm test` im Academy-Root nach der Herausgeber-Nachbesserung: 52 bestanden, 0 fehlgeschlagen.

Unabhängige Berichte:

- GLaDOS: `docs/operation-academy/QA-PHASE-I.md`. Urteil eingeschränkt, solange nur sie keinen Fensterlauf hatte. Der Fensterlauf steht oben und wurde von Rick ausgeführt, nicht von GLaDOS.
- RoboCop: `docs/operation-academy/SECURITY-PHASE-I.md`. Die genannte Lücke ist nachgebessert und nachgetestet.
- Terminus: `docs/operation-academy/TERMINUS-PHASE-I.md`.

## Einschränkungen

- Keine Vollmigration der IT-Ausbildung und keine Verwaltung als Modul.
- Kein Installer-Lauf (`dist:nsis`) in diesem Durchgang.
- Kein Release, kein Push auf `IT-Ausbildung` `main` oder `dev`.
- Update-Feed `DesoWorks/Academy` hat noch keine Releases. Die Prüfung bleibt lokal und lädt nichts Fremdes.
- F11 ist auf einem Monitor geprüft, nicht auf einem Mehrschirm-Aufbau.
- Das ICO ist ein einzelnes 256-px-PNG im ICO-Container, kein klassisches Mehrgrößen-BMP-ICO.

## Phase J

1. IT-Ausbildung als echtes Modulpaket schneiden, erst wenn Datenübernahme, Navigation und Labore gegen den Plan geprüft werden können.
2. Verwaltungsmodul erst danach, eigenes Repo erst nach Freigabe.
3. SDK-Repo erst, wenn die Modul-API nach der IT-Migration noch hält.
4. Installer einmal bauen und das ICO in der Taskleiste und im Setup gegenprüfen.
5. Update-Feed für `DesoWorks/Academy` erst mit einem echten, signierten Kanal, nicht vorher.
