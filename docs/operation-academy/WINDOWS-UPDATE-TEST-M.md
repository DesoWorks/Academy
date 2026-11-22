# Windows-Update-Test Phase M

Stand: 22.11.2026. Maschine des Commanders. Kein simulierter Dateitausch als Erfolgsbeleg.

## Builds

| Stand | Datei | Dateiversion | Größe |
| --- | --- | --- | --- |
| A, Bootstrap | `dist/DesoWorks-Academy-Setup-0.3.1-dev.1.exe` | 0.3.1-dev.1 | 133 425 738 |
| B, Update | `dist/DesoWorks-Academy-Setup-0.3.1-dev.2.exe` | 0.3.1-dev.2 | 133 425 695 |

Beide unsigniert (`signExecutable: false`). Kein Shortcut erzeugt. Commit im Feed: `7876297`.

Die bestehende Installation `C:\Program Files\DesoWorks Academy`, Anzeigeversion 0.3.0, wurde nicht ersetzt.

## Ablauf

1. Sicherung der Lerndaten nach `dist/phase-m-data-backup/before` (nicht im Git).
2. Version A still installiert nach `C:\Users\Denni\AppData\Local\DesoWorksAcademyPhaseM`. Dateiversion danach `0.3.1-dev.1`.
3. In `%APPDATA%\DesoWorks\Academy` gesetzt: Marker `gehalten`, Intervall 24 Stunden, 6 Sicherungen, Sicherung `phase-m-before-update-2026-11-22T08-30-21-683Z-2fe0f0.sqlite`. Modul `desoworks.it-systemintegration` war `1.0.1`, Lernstand `phase-m.correct=true`.
4. Feed über `node scripts/publish-dev-feed.js` nach `%LOCALAPPDATA%\DesoWorks\AcademyDevFeed`. Server `node scripts/dev-feed-server.js` nur auf `127.0.0.1:47321`.
5. Falsche SHA-256 für Stand B. Die laufende Version A hat geprüft, 133 425 695 Bytes geladen und mit `hash-mismatch` verworfen. Datei nicht installiert. Anwendung blieb `0.3.1-dev.1`.
6. Richtige Summe. Dieselbe Anwendung hat geladen und die Installation gestartet. Der Installer lief mit `/S`. Danach Dateiversion und Registry: `0.3.1-dev.2`.
7. Nach dem Core-Update gelesen, nicht angenommen: Marker `gehalten`, Intervall 24, Modul noch `1.0.1`, Lernstand erhalten, Sicherung vorhanden.
8. Modulpaket `desoworks.it-systemintegration-1.0.2.zip`, 11 925 259 Bytes, über denselben Feed. Die Anwendung meldete, der Core werde nicht neu installiert. Installation `ok`. Danach Modul `1.0.2`, Lernstand erhalten, Core weiter `0.3.1-dev.2`.
9. Installer `dist/phase-m-fail.exe`, Version `0.3.1-dev.3`, gültige Summe, Prozess endet mit Code 1. Die Anwendung beendete sich für die Installation. Dateiversion blieb `0.3.1-dev.2`. Nach dem Neustart: Phase `interrupted`, Text „Eine frühere Installation wurde nicht abgeschlossen“, Marker `gehalten`.
10. Feed wieder auf den letzten guten Stand `0.3.1-dev.2` gestellt. Der fehlschlagende Installer liegt nicht mehr im Manifest.

Rohdaten: `docs/operation-academy/windows-update-evidence.json`. Der erste Hash-Fehler steht im Laufprotokoll; die JSON-Datei beginnt beim Folgelauf, weil der erste Lauf am WebSocket endete, nachdem der Installer die Anwendung beendet hatte.

## Nicht nachgewiesen

- Update der Program-Files-Installation 0.3.0 aus sich selbst heraus.
- Download von GitHub oder `desoworks.dev`.
- Signaturprüfung an einem echten Zertifikat. Der Stable-Pfad bleibt im Unit-Test auf eine fehlende Signatur blockiert.
- Zurückrollen eines halb geschriebenen NSIS-Verzeichnisses unter `C:\Program Files`.
- Dass der Feed-Server nach diesem Lauf noch lauscht. Port 47321 war danach nicht belegt.
