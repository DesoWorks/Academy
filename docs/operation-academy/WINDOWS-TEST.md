# Phase K – Windows-Testbuild

**Stand:** 2026-11-21  
**Branch:** `feature/phase-k-stability-trust`  
**Art:** unsignierter Testbuild. Kein Release, keine Verteilung.

## Build

Befehl: `npm run dist:nsis`  
electron-builder 26.18.0, Electron 45.4.1, Windows x64.

Der erste Lauf mit `signAndEditExecutable: false` hat Icon und Metadaten am EXE übersprungen. Danach steht in `package.json` nur noch `signExecutable: false`. Der zweite Lauf hat die Signierung übersprungen und die Ressourcen geschrieben.

| Datei | Größe | Zeitpunkt |
| --- | --- | --- |
| `dist/win-unpacked/DesoWorks Academy.exe` | 249978368 Bytes | 2026-11-21 22:45 |
| `dist/DesoWorks-Academy-Setup-0.3.0.exe` | 133328158 Bytes | 2026-11-21 22:45 |

`FileVersionInfo`: Produkt `DesoWorks Academy`, Version `0.3.0`, Beschreibung `DesoWorks Academy`.  
Authenticode beider Dateien: `NotSigned`.  
Zugeordnetes EXE-Icon: 32×32, Pixelfarbe nahe am dunklen Signethintergrund, nicht das helle Electron-Standardsymbol. Das ICO selbst hat eine 256-Pixel-Stufe, siehe `build/ICON-HINWEIS.txt`. Ein mehrstufiges ICO mit 16/32/48/64 fehlt weiterhin.

`dist/` ist Bauergebnis und wird nicht committet.

## Sauberes Benutzerkonto

Lokaler Benutzer `AcademyKTest`, kein Administrator, Passwort nicht protokolliert. Installer lief als dieser Benutzer mit `/S` nach `C:\AcademyKTestInstall`.

- Exitcode des Installers: 0.
- `DesoWorks Academy.exe` war danach vorhanden.
- Start als derselbe Benutzer: Prozess blieb nach 8 Sekunden laufen. Pfad `C:\AcademyKTestInstall\DesoWorks Academy.exe`. Electron hat mehrere Kindprozesse gestartet. Im Log stand einmal `Network service crashed or was terminated, restarting service.` Das ist kein bestandener Langlauftest.
- Nicht geprüft auf diesem Konto: Modulinstallation, Aufgabenbearbeitung, Lernstand nach Neustart, Modulupdate, Core-Update, Deinstallation über die Windows-Systemsteuerung.

Konto, Profil und Installationsordner wurden danach entfernt. `user` und `dest` waren weg, das Profil nach einer zweiten Löschung ebenfalls.

Der alte Phase-G-Installer wurde nicht verwendet.
