# Update-Fehlercodes und Fehlersuche – N.1

**Stand:** 22. November 2026  
**Geprüfter Arbeitsstand:** Branch `feature/phase-n1-release-connectivity`, HEAD `e558c14e65d546b77a5305346bf5957c2424bb2c`  
**Geltungsbereich:** Fehlercodes und Meldungstexte aus den zuletzt selbst gelesenen Quelldateien. Keine Meldungen hinzuerfunden.

## Fehlercodes aus `src/updates/service.js`

| Code | Bedeutung im Code | Zugehörige vorhandene Meldung / Einordnung |
|---|---|---|
| `source-locked` | GitHub-API antwortet mit 401, 403 oder 404. | `githubLocked`: GitHub verweigert Zugriff oder Quelle nicht gefunden; später erneut prüfen. |
| `source-unreachable` | Netzwerkfehler oder nicht erfolgreicher Abruf. | `githubUnreachable`: Prüfung später wiederholen; Anwendung und Lernfortschritte bleiben unverändert. |
| `metadata-invalid` | Antwort oder Release-Metadaten sind ungültig bzw. unvollständig. | `metadataInvalid`: nichts herunterladen oder installieren. |
| `metadata-rejected` | Release-Kandidat wird abgelehnt, unter anderem wegen fehlender/ungültiger Metadaten oder Prüfsumme. | `metadataInvalid` bzw. `hashMissing`, abhängig vom konkreten Zweig. |
| `hash-missing` | Keine verwendbare SHA-256-Prüfsumme vorhanden. | `hashMissing`: ohne Integritätsprüfung keine Installation. |
| `hash-mismatch` | Datei stimmt nicht mit der erwarteten SHA-256-Prüfsumme überein. | `hashMismatch`: Datei verwerfen, nicht installieren. |
| `unknown-channel` | Gespeicherter Kanalwert ist ungültig. | `channelRejected`: DEV, BETA oder STABLE sind zulässig; die sichtbare Auswahl ist in der gelesenen UI nicht verdrahtet. |
| `channel-switched` | Vorbereitetes Paket gehört nicht mehr zum aktuellen Kanal. | `channelSwitched`: Updateprüfung neu starten. |
| `dev-feed-unauthorized` | Lokaler DEV-Feed lehnt die Freigabe ab. | `devFeedUnauthorized`: lokale Freigabe prüfen. |
| `check-failed` | Allgemeiner Fehler beim Prüfen eines expliziten Feeds. | `checkFailed`: Prüfung wiederholen. |
| `host-rejected` | Updatequelle oder Weiterleitung wird durch die Hostprüfung abgewiesen. | `hostRejected`: freigegebene Quelle verwenden. |
| `download-failed` | Download scheitert ohne spezifischeren Fehlercode. | `downloadFailed`: nichts installiert. |
| `aborted` | Download wurde abgebrochen. | `aborted`: unvollständige Datei wird verworfen. |
| `bad-version` | Versionswert darf nicht als Installer-Dateiname verwendet werden. | Spezifische Fehlermeldung wird im Fehlerobjekt gesetzt. |
| `bad-path` | Zielpfad liegt außerhalb des Updateordners. | Pfad wird abgewiesen. |
| `download-interrupted` | Beim Neustart wurde ein unvollständiger Download erkannt. | `interrupted`: Teildatei verworfen. |
| `install-interrupted` | Gespeicherter Zustand meldete eine unterbrochene Installation. | `installInterrupted`: Lerndaten sollen im Datenverzeichnis verbleiben. |

Der aktuell gelesene `checkGithub()`-Pfad verlangt kein Token vor dem Abruf. In `src/updates/github-feed.js` ist das Token optional. Der Code enthält weiterhin `githubNoToken` als Meldungskonstante, doch daraus folgt nicht, dass dieser Code im aktuellen öffentlichen GitHub-Pfad gesetzt wird.

Weitere IPC-/Modulcodes stehen in `src/ipc.js`, zum Beispiel `forbidden`, `unknown-channel` und `hash-mismatch` beim Modulpaket. Diese Handler geben teils eigene Texte zurück und sind keine zentralen `MESSAGES`-Einträge.

## Wo nachsehen?

- `src/updates/service.js`: Zustände und Fehlercodes für Prüfung, Download und Installation.
- `src/updates/messages.js`: Meldungstexte.
- `src/updates/github-feed.js`: Releaseabruf. Kein Fetcher ergibt intern `no-fetch`; Netzwerkfehler `source-unreachable`; HTTP 401/403/404 `source-locked`; andere HTTP-Fehler `http-<Status>`; ungültige Antwortmetadaten `metadata-invalid`.
- `src/updates/channels.js`: Ablehnungsgründe wie `unknown-channel`, `wrong-channel`, `wrong-platform`, `manifest-missing`, `manifest-invalid`, `version-conflict` und `duplicate-conflict`. `reason` ist nicht automatisch gleichbedeutend mit `state.error`.
- `src/updates/manifest-sign.js`: Signaturverifikation von Manifestbytes und Signatur.

## Offene Lücken gegenüber dem Auftrag

- **Offen – öffentlicher Abruf ohne Token:** Der aktuelle Codepfad erlaubt Abruf ohne Token; ein tatsächlicher erfolgreicher Abruf und die vollständige Kandidatenauswahl über öffentliches GitHub wurden hier nicht ausgeführt.
- **Offen – Manifestsignatur:** Verifikationscode ist vorhanden (`github-feed.js` → `manifest-sign.js`), aber eine reale Release-Signatur wurde in diesem Arbeitsschritt nicht abgerufen und verifiziert.
- **Offen – gelaufene Actions:** Lokale Fehlercodes oder Workflowdateien belegen keinen GitHub-Actions-Lauf.
- **Offen – Windows-A/B:** Fehlerpfade sind kein Nachweis eines reproduzierbaren Updates von einer installierten Windows-Version A auf B.

## Gelesene Dateien

`src/updates/service.js` (Fehlerzustände), `src/updates/messages.js` (Meldungen), `src/updates/github-feed.js` (öffentlicher Abruf und Abruffehler), `src/updates/manifest-sign.js` (Manifestverifikation), `src/updates/channels.js` (Kandidatengründe), `src/updates/signature.js` (Authenticode) und `src/ipc.js` (IPC-/Modulcodes).
