# Phase M – Live Update

Stand: 22.11.2026. Branch `feature/phase-m-live-update`, Client-Commit `7876297`. `main` bleibt `2e704e3`. Kein Push, kein Merge, kein Stable-Release.

Phase M ist nicht als vollständig abgeschlossen zu werten. Der DEV-Kanal funktioniert auf einer eigenen Installation. Die bisherige Program-Files-Installation 0.3.0 kann sich nicht selbst aktualisieren. Ein entfernter, ohne lokalen Feed-Server erreichbarer Veröffentlichungsweg fehlt.

## Warum die installierte 0.3.0 nichts findet

Geprüft, nicht vermutet:

1. Lokal entwickelt ist nicht veröffentlicht. GitHub `DesoWorks/Academy` hat keine Releases (`list_releases` lieferte `[]`).
2. `main` auf GitHub ist `2e704e3`. Die Phasen J bis M liegen nur lokal.
3. Der gepackte Client setzte `feedUrl` immer auf leer. `src/main.js` gab die Quelle nur einem ungepackten Stable-Build über eine Umgebungsvariable.
4. `selectRelease`, `download` und `installPlan` blockierten jeden Nicht-Stable-Kanal, auch mit Prüfsumme.
5. `installPlan` verlangte zusätzlich eine Herausgebersignatur. Ein Zertifikat ist nicht vorhanden.
6. `desoworks.dev` antwortet mit HTTP 401. Ein Download von dort wäre ohne eingebettetes Geheimnis nicht möglich.
7. Das Repository ist privat. Ein Release-Asset wäre für die Anwendung ohne Token nicht ladbar. Ein Token wird nicht in die Anwendung gelegt.

## Was gebaut wurde

DEV und Stable bleiben getrennt.

- Stable installiert weiterhin nur Nicht-Prereleases, nur mit SHA-256, nur mit erwarteter Herausgebersignatur, nur nach Sicherung. Ohne Zertifikat startet Stable nichts.
- DEV installiert nur Prereleases, nur mit SHA-256, nur nach Sicherung, ohne Herausgeberzertifikat. Eine stabile Version auf dem DEV-Kanal wird angezeigt und nicht heruntergeladen.
- Der gepackte DEV-Client fragt fest `http://127.0.0.1:47321/dev/manifest.json`. Die Adresse ist nicht über eine Umgebungsvariable umlenkbar.
- Der Feed-Server bindet nur `127.0.0.1` und verlangt den Schlüssel aus `%APPDATA%\DesoWorks\Academy\updates\dev-feed.key`. Der Schlüssel liegt nicht im Git.
- Core- und Modulpakete sind getrennte Einträge. Ein Core-Download legt kein Modulpaket ab. Ein Modulupdate startet den NSIS-Installer nicht.
- Die Seite „Daten und Updates“ zeigt Kanal, Commit, verfügbare Core-Version, Notizen, Größe, Modulupdates und die Startprüfung ohne automatischen Download.

## Getestete Installation

Nicht die Program-Files-Fassung 0.3.0. Die kann den neuen Client nicht nachziehen.

- Version A `0.3.1-dev.1` still nach `C:\Users\Denni\AppData\Local\DesoWorksAcademyPhaseM` installiert. Das war der einmalige Bootstrap.
- Dieselbe Anwendung hat `0.3.1-dev.2` erkannt, 133 425 695 Bytes geladen, eine falsche Summe verworfen und danach die passende Summe installiert.
- Dateiversion danach: `0.3.1-dev.2`. Registry-Anzeigename ebenfalls `0.3.1-dev.2`.
- Marker `phase-m-marker=gehalten`, Sicherungsintervall 24 Stunden, Modul danach noch `1.0.1`, Lernstand erhalten, Sicherung vorhanden.
- Modulupdate auf `1.0.2` aus demselben Feed, Core blieb `0.3.1-dev.2`, Lernstand erhalten.
- Ein absichtlich fehlschlagender Installer `0.3.1-dev.3` hat die Dateiversion nicht geändert. Nach dem Neustart meldet die Anwendung `interrupted` und der Marker ist noch da.
- `npm test`: 72 bestanden, 0 fehlgeschlagen, vor den Builds.

Der Feed-Server lief nur während des Tests. Danach war Port 47321 nicht mehr belegt. Ohne `node scripts/dev-feed-server.js` findet auch die neue Installation nichts. Das ist kein entfernter Updatekanal.

## Offen

- Program-Files-Installation `C:\Program Files\DesoWorks Academy` bleibt 0.3.0. Kein Desktop- oder Startmenü-Shortcut wurde ersetzt.
- Kein GitHub-Release, kein Push, kein für die Anwendung erreichbares Remote-Manifest.
- Kein Herausgeberzertifikat. Stable bleibt blockiert.
- Kein Nachweis, dass ein halb geschriebener NSIS-Stand in Program Files zurückgerollt wird. Nachgewiesen ist: ein Installer, der sofort mit Code 1 endet, ersetzt die Dateien nicht, und der Client meldet den Abbruch.
- Die unabhängigen Berichte stehen in den Dateien dieser Phase. Sie ersetzen nicht einen zweiten Windows-Lauf durch GLaDOS, weil die Spezialisten kein Terminal haben. Der Windows-Lauf ist der von Rick ausgeführte, in `WINDOWS-UPDATE-TEST-M.md` belegte Lauf.

## Nachtrag: SemVer-Kennung

ROBOCOP hat `compare("0.3.1-dev.2", "0.3.1-dev.10")` als `1` nachgestellt. Das wäre ein Downgrade ab `dev.10`. Jarvis hat die Prerelease-Teile numerisch sortiert und den Manifest-Abgleich beim Modulupdate ergänzt. Rick hat danach `npm test` ausgeführt: 78 bestanden, 0 fehlgeschlagen, darunter GLaDOS' Datei `tests/phase-m-qa-semver.test.js`.

Der installierte Stand `0.3.1-dev.2` enthält diesen Fix nicht. `dev.1` gegen `dev.2` war davon nicht betroffen. Ein Build ab `dev.10` darf erst aus dem korrigierten Stand erzeugt werden.

## Delegation

| Agent | Auftrag | Ergebnis | Abhängigkeit | Status |
| --- | --- | --- | --- | --- |
| Jarvis | Update-Client, zwei Windows-Builds, danach SemVer- und Manifest-Fix | Builds lagen schon vor, als die Korrektur kam. Fix in `semver.js`, `module-manifest.js`, `ipc.js`. Kein dritter Build. | Feed-Regeln aus dem bestehenden Client | Fix im Arbeitsbaum, Tests durch Rick belegt |
| Terminus | Architektur und Veröffentlichungsweg | `UPDATE-ARCHITECTURE-M.md` | Bestehender Client | Geschrieben, Windows-Lauf nicht selbst ausgeführt |
| ROBOCOP | Sicherheitsprüfung | `UPDATE-SECURITY-M.md`, S-1 belegt | Quellstand `7876297` plus Arbeitsbaum | S-1 im Quellstand behoben, von ROBOCOP nicht erneut gelesen |
| GLaDOS | Unabhängige Kriterien und SemVer-Test | `UPDATE-QA-M.md`, `tests/phase-m-qa-semver.test.js` | Belege, kein Terminal | Test von Rick ausgeführt, Windows-Lauf nicht von GLaDOS |
| Rick | Koordination, Builds, Windows-Lauf, Suite | `PHASE-M.md`, `WINDOWS-UPDATE-TEST-M.md` | Shell | Windows-Lauf belegt, Phase nicht vollständig geschlossen |
