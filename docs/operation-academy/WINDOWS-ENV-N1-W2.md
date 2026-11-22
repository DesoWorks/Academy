# Windows-Umgebung – Phase N.1 Welle 2

Geprüft am 22.11.2026 durch Dateilesen und `FileVersionInfo`. Kein Setup gestartet.

## Vorhandene Installation

`%LOCALAPPDATA%\DesoWorksAcademyPhaseM` existiert.

- `DesoWorks Academy.exe`: 250000896 Bytes
- `FileVersion`: `0.3.1-dev.2`
- `ProductVersion`: `0.3.1.0`
- `ProductName`: DesoWorks Academy
- `resources\app-update.yml` nennt `owner: DesoWorks`, `repo: Academy`, `provider: github`

Diese Installation ist der Phase-M-Stand. Sie ist kein gültiger Ausgang für den GitHub-A/B-Test der Welle 2, weil sie den neuen Update-Client nicht enthält.

## Falsche Zuordnung

`resources\academy-modules\it-systemintegration\web\js\version.js` setzt `global.APP_VERSION = "0.16.3-alpha.1"`. Das ist die Modul-Webfassung, nicht die Academy-Programmversion. TARS hatte diese Zahl als installierte Academy-Version gemeldet. Das ist falsch.

## Program Files

Nicht vorhanden:

- `C:\Program Files\DesoWorks Academy`
- `C:\Program Files\DesoWorksAcademy`
- `C:\Program Files (x86)\DesoWorks Academy`

## Blocker

Kein Speichermangel in diesem Lauf. Für den A/B-Test fehlen zwei neue DEV-Builds mit dem GitHub-Client. Die vorhandene Installation wird nicht überschrieben.
