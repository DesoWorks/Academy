# Kanalwahl und Updateverhalten – N.1

**Stand:** 22. November 2026  
**Geprüfter Arbeitsstand:** Branch `feature/phase-n1-release-connectivity`, HEAD `e558c14e65d546b77a5305346bf5957c2424bb2c`  
**Status:** Dokumentation des selbst gelesenen Codes; kein Freigabevermerk.

## Wo liegt die Kanalwahl?

Im sichtbaren Bereich **Daten und Updates** (`src/renderer/verwaltung.html`) gibt es Updateprüfung, Download- und Installationsknöpfe. In dieser HTML-Datei steht kein Auswahlfeld für DEV, BETA oder STABLE. `src/renderer/verwaltung.js` verbindet die Updateknöpfe mit der Desktop-API; dort ist ebenfalls keine Kanalwahl verdrahtet.

Im Backend gibt es bereits Kanal-Schnittstellen: `src/preload.js` stellt `updateChannel()` und `setUpdateChannel(channel)` bereit; `src/ipc.js` registriert `academy:update-channel` und `academy:update-channel-set`. Die Wahl wird unter `academy.updateChannel` gespeichert (`src/updates/channel-preference.js`). Der Code stellt somit Backend-Schnittstellen bereit, aber die geprüfte Nutzeroberfläche bietet keinen sichtbaren Ort für die Kanalwahl.

## Was steuert die gespeicherte Wahl?

`src/updates/channels.js` definiert DEV als Versionen mit `-dev.N`, BETA als `-beta.N` und STABLE als freigegebene Versionen ohne Vorabversionszusatz. `src/updates/service.js` liest die gespeicherte Wahl und übergibt sie an die Release-Auswahl. Der Wechsel installiert laut `switchConsequences()` in `channels.js` nichts; ein vorbereitetes Paket des vorherigen Kanals wird ungültig. Ein Downgrade erfordert eine eigene Bestätigung.

Der aktuell gelesene Backendpfad verwendet `src/updates/github-feed.js` mit der festen öffentlichen API-Adresse `https://api.github.com/repos/DesoWorks/Academy/releases`. Ein Token ist optional und wird laut Datei nur an die API-Releaseliste gesendet; die Asset-Downloads erfolgen ohne Token. Die Kanalwahl steuert also den Backend-Check, aber ein sichtbarer Nutzerablauf ist nicht verdrahtet.

## Heute geltende Einschränkungen und offene Punkte

- **Offen – sichtbare Verwaltung:** In `verwaltung.html`/`verwaltung.js` gibt es kein Bedienelement zum Auswählen und Speichern des Kanals.
- **Offen – Manifestsignatur:** `src/updates/github-feed.js` ruft `verifyManifest()` aus `src/updates/manifest-sign.js` auf und setzt `manifestVerified` nur bei erfolgreicher Prüfung. Der Codepfad ist vorhanden; die tatsächliche Freigabe/Validierung der Schlüsselkonfiguration und ein durchgelaufener End-to-End-Abruf sind hier nicht belegt.
- **Offen – gelaufene Actions:** Lokale Workflowdateien beweisen keinen GitHub-Actions-Lauf.
- **Offen – Windows-A/B:** Ein reproduzierbarer Updateversuch einer installierten Windows-Version A auf B ist durch den gelesenen Code nicht nachgewiesen.

## Gelesene Dateien

`src/renderer/verwaltung.html` (Updatebereich), `src/renderer/verwaltung.js` (Bedienlogik), `src/preload.js` (Update-API), `src/ipc.js` (Kanal-IPC), `src/updates/channel-preference.js` (gespeicherte Wahl), `src/updates/channels.js` (Kanalregeln), `src/updates/service.js` (Prüf-/Installationspfad), `src/updates/github-feed.js` (öffentliche Quelle und Manifestverifikation), `src/updates/manifest-sign.js` (Manifestprüfung) und `src/updates/signature.js` (Authenticode-Prüfung).
