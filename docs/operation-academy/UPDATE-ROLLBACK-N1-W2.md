# Update-Wiederherstellung – N.1, Welle 2

**Stand:** 22. November 2026  
**Arbeitsstand laut Lead:** `feature/phase-n1-release-connectivity`, HEAD `e558c14e65d546b77a5305346bf5957c2424bb2c`. Arbeitsbaum ändert sich parallel. Dieses Dokument beschreibt nur im gelesenen Code bzw. vorhandenen lokalen Belegen sichtbare Wiederherstellungsmechanismen; es behauptet keinen erfolgreichen Rollback-Test.

## Core-Update

Vor dem Start des Core-Installers erzeugt der IPC-Handler `academy:update-install` über `store.backup("pre-update")` eine Sicherung. Erst danach wird der Installationsplan angefordert; bei einem blockierten Plan wird der Installer nicht gestartet. Die Installationsplanung verlangt eine vorhandene Sicherungsdatei, ein im Updateordner vorhandenes geprüftes Paket, einen weiterführenden Versionsstand und einen zur gespeicherten Prüfsumme passenden Installer. STABLE verlangt zusätzlich eine erwartete Herausgebersignatur. Der Installer wird anschließend mit `/S` gestartet und die Anwendung beendet sich.

Der Code bietet in **Daten und Updates** eine Sicherungsauswahl und „Ausgewählte Sicherung zurückholen“. Eine Wiederherstellung erfordert eine Bestätigung im Hauptprozess; der Dialog sagt, dass die Sicherung den aktuellen Lernstand ersetzt und zuvor ein Sicherheitsstand angelegt wird. Bei Erfolg wird der Datenbank-Store aus der Sicherung neu geöffnet. Das ist eine belegte Datenwiederherstellung, aber kein belegtes automatisches Downgrade oder automatisches Zurückrollen der installierten Programmdateien.

## Unterbrochener Download oder Installationsstart

Beim Abbruch verwirft der Update-Service `.partial`-Dateien und schreibt den Zustand `aborted`. Beim Start der Anwendung bereinigt `reconcile()` Teil-Downloads. Ein zuvor als `installing` gespeicherter Zustand wird in `interrupted` überführt; die Meldung verweist darauf, dass Lerndaten im Datenverzeichnis verbleiben und die Prüfung wiederholt werden kann. Der Code dokumentiert hier einen nachvollziehbaren Status, jedoch keinen automatischen Wiederanlauf des Installers oder Rücktausch auf die vorige Core-Version.

Ein fehlgeschlagener Core-Download entfernt die unvollständige Datei und startet keine Installation. Die bestehende Installation wird durch diesen Downloadpfad nicht ersetzt.

## Modulupdate

Der Modulinstallations-IPC prüft den SHA-256 des vorbereiteten ZIP-Pakets erneut. Vor Austausch kopiert er, sofern ein bisheriger Installationspfad besteht, dessen Verzeichnis nach `updates/modules/rollback/<Modul-ID>/<Zeitstempel>`. Scheitert Extraktion, Manifestabgleich oder Installation, wird das neu vorbereitete Zielverzeichnis entfernt; die Fehlermeldung besagt, dass die bisherige Modulversion bleibt, und der Core bleibt unberührt. Der Erfolgsrückgabewert nennt den Snapshot-Pfad.

Der gelesene Code belegt das Anlegen eines Modul-Snapshots, aber keinen sichtbaren automatischen oder manuellen Befehl, der diesen Snapshot zurückspielt. Daher wird hier kein vollständiger Modul-Rollback behauptet.

## Grenzen und offene Nachweise

- **Offen:** Es wurde kein Rollback- oder Wiederherstellungslauf ausgeführt.
- **Offen:** Kein Windows-A/B-Test belegt, dass eine installierte Version nach Core-Update oder Fehlschlag tatsächlich wiederhergestellt werden kann.
- **Offen:** Das vorhandene lokale Protokoll `docs/operation-academy/WINDOWS-ENV-N1.md` hält fest, dass die installierte `0.3.1-dev.2` kein gültiger Ausgangspunkt für den GitHub-Update-A/B-Nachweis ist.
- Eine vorhandene Sicherung des Lernstands ist nicht mit einem Rollback der Anwendungsversion gleichzusetzen. Vor einem realen Versuch müssen Sicherungszustand und Testumgebung nachvollziehbar dokumentiert werden.

## Gelesene Quellen

`src/updates/service.js` (Downloadzustand, Wiederabgleich, Installationsplan und Moduldownload), `src/ipc.js` (Sicherung vor Core-Installation, Wiederherstellungsdialog und Modul-Installer), `src/renderer/verwaltung.html`, `src/renderer/verwaltung.js`, `src/main.js` sowie `docs/operation-academy/WINDOWS-ENV-N1.md`.