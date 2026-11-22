# Update-Benutzerhandbuch – N.1, Welle 2

**Stand:** 22. November 2026  
**Arbeitsstand laut Lead:** `feature/phase-n1-release-connectivity`, HEAD `e558c14e65d546b77a5305346bf5957c2424bb2c`. Arbeitsbaum ändert sich parallel; diese Dokumentation beschreibt den während der Prüfung gelesenen Code und ist kein Nachweis eines ausgelieferten Builds.

## Updatekanal wählen und wechseln

1. Öffne in der Academy **Einstellungen**.
2. Wähle im Abschnitt **Updatekanal** DEV, BETA oder STABLE. Die aktuelle Auswahl wird angezeigt und gespeichert. Beim ersten Start ohne gespeicherte Wahl gilt STABLE.
3. Ein Wechsel von STABLE zu DEV oder BETA öffnet eine Bestätigung, weil diese Kanäle Vorabversionen liefern können. Ein Wechsel während Download, Verifikation oder Installation wird zurückgewiesen; warte, bis der Vorgang beendet ist oder brich den Download ab.
4. Die Wahl ändert die Updatequelle, installiert aber nichts und verändert keine Module. Ein bereits vorbereitetes Paket des alten Kanals ist danach ungültig; führe die Updateprüfung erneut aus.

Die Wahl wird unter `academy.updateChannel` gespeichert. Der Update-Service liest sie bei der Prüfung und verlangt passende Kanal-Tags und Manifestfelder. DEV passt zu `dev/v…-dev.N`, BETA zu `beta/v…-beta.N`, STABLE zu `stable/v…`. Eine ältere Zielversion wird bei der Core-Installation nicht gestartet.

## Update suchen und installieren

Öffne **Daten und Updates**. Dort kannst du **Erneut prüfen**, **Core herunterladen**, **Download abbrechen** und **Core-Update installieren** verwenden. Die Prüfung lädt noch kein Paket; der Download installiert noch nichts. Erst die ausdrücklich ausgelöste Installation erstellt über die vorhandene Datenablage eine Sicherung, prüft den Installationsplan und startet den geprüften Installer, sofern alle Voraussetzungen erfüllt sind. Das Programm beendet sich dafür.

Für den Core-Download verlangt der gelesene GitHub-Pfad ein gültig signiertes Manifest, gültigen Kanal und Versionsbezug, ein passendes Windows-Plattformmanifest, ein genau passendes öffentliches Release-Asset sowie dessen SHA-256. Der Download erfolgt aus dem festgelegten Repository. Die Manifest-Signatur wird mit Ed25519 geprüft. Eine optionale GitHub-Zugangskennung ist nicht erforderlich für öffentliche Releases; laut Code wird sie nur an die API-Releaseliste gesendet, nicht an Asset-Downloads. Es gibt keinen eingebetteten GitHub-Token im Updatepfad.

## Was Kanal und Oberfläche tatsächlich können

`src/renderer/settings.html` und `settings.js` bieten die sichtbare Auswahl DEV/BETA/STABLE und speichern sie über die Desktop-API. `src/renderer/verwaltung.html` und `verwaltung.js` enthalten die Updateaktionen, aber keine Kanalwahl. Der gespeicherte Kanal steuert den Backend-Updatecheck, nicht die aktuell installierte Build-Herkunftsanzeige.

Core-Updates und Modulupdates sind getrennte Abläufe. Die sichtbare Modulupdateaktion zeigt ausschließlich gemeldete Modulupdates; der aktuelle Code lässt Moduldownloads nur für DEV-Prereleases zu. Ein Core-Update ersetzt nicht ausdrücklich Module über diesen Modulpfad.

## Fehler und Grenzen

Bei ungültigen Metadaten, falscher Signatur, falschem Hash, fremder Quelle oder fehlgeschlagenem Download wird die Installation nicht gestartet. Abgebrochene oder beim Neustart erkannte Teil-Downloads werden verworfen. Ein Update ist erst nach tatsächlichem Download, Prüfung und bestätigter Installationsaktion installiert.

**Offen:** GitHub-Releases sind laut Lead derzeit nicht vorhanden; lokale Actions-Workflows sind nicht gelaufen. Die installierte Version `0.3.1-dev.2` enthält den GitHub-Client nicht. Es gibt keinen Windows-A/B-Nachweis. Daher belegt dieses Handbuch die Codeoberfläche im Arbeitsbaum, nicht die Verfügbarkeit einer funktionierenden GitHub-Updatequelle in einer installierten Version.

## Gelesene Quellen

`src/renderer/settings.html`, `src/renderer/settings.js`, `src/renderer/verwaltung.html`, `src/renderer/verwaltung.js`, `src/ipc.js`, `src/main.js`, `src/updates/channel-preference.js`, `src/updates/channels.js`, `src/updates/github-feed.js`, `src/updates/manifest-sign.js`, `src/updates/service.js`, `src/updates/feed.js` sowie `docs/operation-academy/WINDOWS-ENV-N1.md`.