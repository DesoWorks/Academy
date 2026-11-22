# Windows-Umgebung – Phase N.1

Aufnahme durch Rick, 2026-11-22. TARS (`87f88301-3a84-488e-8a3f-d133a2c346a2`) ist nicht fertig geworden. Sein lokales Modell `gpt-oss:20b` brach zweimal mit `cudaMalloc failed: out of memory` ab. Dieselbe Zuweisung erneut zu starten würde denselben Fehler treffen. Die folgende Aufnahme ist deshalb Ricks, nicht die von TARS.

## Gesehen

| Pfad | Befund |
| --- | --- |
| `%LOCALAPPDATA%\DesoWorksAcademyPhaseM\DesoWorks Academy.exe` | Vorhanden. FileVersion `0.3.1-dev.2`, ProductVersion `0.3.1.0`, 250000896 Bytes. |
| `C:\Program Files\DesoWorks Academy` | Nicht vorhanden. |
| `%LOCALAPPDATA%\Programs\DesoWorks Academy` | Nicht vorhanden. |
| Suche nach `DesoWorks Academy.exe` unter `C:\Program Files`, `C:\Program Files (x86)`, `%LOCALAPPDATA%\Programs` und dem Desktop | Kein weiterer Treffer. |
| TCP 47321 | Nicht belegt. Der Phase-M-Feedserver läuft nicht. |
| Ollama | `%LOCALAPPDATA%\Programs\Ollama\ollama.exe` liegt auf dem Pfad. Kein Modell wurde geladen. |

## Nicht geändert

Keine Installation, keine Deinstallation, kein Dienst, kein Modellabruf.

## Folge für den A/B-Test

Die vorhandene Fassung `0.3.1-dev.2` kennt den öffentlichen GitHub-Abruf dieser Phase nicht. Ein Update von A nach B braucht zwei neue Builds, die den N.1-Client enthalten. Die alte Installation ist kein gültiger Ausgangspunkt für den GitHub-Nachweis.
