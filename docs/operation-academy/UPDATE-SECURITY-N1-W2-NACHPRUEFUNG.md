# Nachprüfung Updateweg – Operation Academy N.1 / Welle 2 (Nachtrag zu H-1)

Prüfer: RoboCop, Security Officer
Datum: 22.11.2026
Projekt: DesoWorks Academy (`D:\Desoworks\Workspace\Academy`)
Branch: `feature/phase-n1-release-connectivity`, HEAD `e558c14`. Der Arbeitsbaum ist geändert und unversioniert (`git status --short`: u. a. `src/main.js`, `src/updates/feed.js`, `service.js`, `github-feed.js`, `messages.js` geändert; `manifest-sign.js`, `update-public-key.pem` und Tests neu).
Art: lesend, statisch. Kein Commit, kein Push, keine Änderung außer diesem Nachtrag. Die Basisprüfung `UPDATE-SECURITY-N1-W2.md` bleibt unverändert. Der private Schlüssel wurde nicht geöffnet. Dieser Bericht enthält keinen Schlüssel- und keinen Tokenwert.

## 1. Ergebnis

**H-1 ist im gepackten Build geschlossen.** Es ist kein HOCH- und kein KRITISCH-Befund mehr offen. **Veröffentlichung für ein DEV-Testrelease: aus Sicherheitssicht nicht blockiert.** Die Freigabe selbst liegt beim Commander.

| Stufe | Offen | IDs |
| --- | --- | --- |
| KRITISCH | 0 | – |
| HOCH | 0 | – (H-1 geschlossen) |
| MITTEL | 4 | M-1, M-2, M-3, M-4 (unverändert, nicht blockierend für DEV) |
| NIEDRIG | 4 | N-1, N-2, N-3, N-4 (unverändert) plus N-5 (neu) |
| INFORMATIV | 2 | I-1, I-2 (neu) |

## 2. H-1: Belege aus der Lesung

Ich habe die Stellen selbst gelesen, nicht die Testergebnisse übernommen.

1. `src/updates/feed.js:269-275` `resolveFeedUrl(options)`: `if (opts.isPackaged) return "";`. Das ist die erste Anweisung nach der Initialisierung. Die Umgebungsvariable wird im gepackten Fall nicht einmal gelesen. Ungepackt wird nur ein getrimmter String zurückgegeben, sonst `""`. Nicht-String-Werte ergeben `""`.
2. `src/main.js:77` `feedUrl: resolveFeedUrl({ isPackaged: app.isPackaged, env: process.env })`. Die Zeile 11 importiert die Funktion aus `./updates/feed`. In `src/` ist dies der einzige Aufrufer von `createUpdateService` (Suche über `src`; die übrigen Aufrufer liegen in `scripts/` und `tests/`). `ACADEMY_UPDATE_FEED` kommt in `src/` nur in `feed.js` und im Kommentar in `main.js` vor. Es gibt keinen zweiten Lesepfad für diese Variable und kein `extraHosts` in `main.js`.
3. `src/updates/service.js:42` `explicitFeed = options.feedUrl || ""`, Zeile 63 `feedUrl = explicitFeed`. Mit `""` gilt:
   - `check()` Zeile 401: `if (!feedUrl) return checkGithub();`. Der Legacy-Zweig (Zeilen 402-473) wird nicht erreicht.
   - `resolveChannel()` Zeile 49: Die gespeicherte Kanalwahl steuert, nicht der Build-Kanal. Ein fremder Wert ergibt `null` und wird in `check()` (Zeile 400) abgelehnt.
   - `download()` Zeile 502: `if (!feedUrl && !pendingManifestOk())` bricht mit `signature-invalid` ab. Zeile 522: Der Asset-URL muss mit `github.DOWNLOAD_PREFIX` beginnen. Zeile 535: Die Endadresse nach der Weiterleitung muss `github.isAllowedFinalUrl` erfüllen. Zeile 541-542: Der erwartete Hash kommt aus dem signierten Manifest (`fromManifest`).
   - `installPlan()` Zeile 628: `if (!feedUrl && !storedManifestOk(...))` prüft die gespeicherte Signatur erneut vor dem Start. Zeile 618 verhindert Downgrade und gleiche Version.
   - `reconcile()` Zeile 266: `explicitFeed || storedManifestOk(...)`. Mit leerer Adresse ist die Signaturprüfung Pflicht. Der Zweig ist nur im Test-/Entwicklungsmodus lockerer.
4. Alle Stellen, an denen `verifyManifest` aufgerufen wird (`service.js` Zeilen 81, 96, 323; `github-feed.js:199`), prüfen mit `options.updatePublicKey` oder dem Standardschlüssel und lassen nur `ok === true` durch. `manifest-sign.js:46-68` ist fail-closed: Bytes leer, Signatur fehlt oder ist kein striktes Base64 mit 64 Byte, Schlüssel fehlt oder ist kein Ed25519-SPKI, Ausnahme bei `crypto.verify`: jeweils `ok:false`. Die Lesung entspricht der Basisprüfung, ohne Abweichung.
5. Der Weg zu einem Installer im gepackten Build läuft damit zwingend über: GitHub-API mit fester Quelle, signiertes Manifest, Hash aus dem Manifest, Download nur unter `https://github.com/DesoWorks/Academy/releases/download/`, erneute Signaturprüfung vor Download und vor Start. Eine Umgebungsvariable kann diesen Weg im gepackten Build nicht ersetzen.
6. Ergänzende Tests (gelesen, nicht von mir ausgeführt): `tests/phase-n-wiring.test.js:81-101` prüft `resolveFeedUrl` gepackt (Loopback und fremde Adresse ergeben `""`), ungepackt und den Service-Aufruf (nur Anfrage an `api.github.com/repos/DesoWorks/Academy/releases`). Rick meldet 39 bestanden. Das ist eine Bestätigung, kein Ersatz für die Lesung.

**Entscheidung: H-1 geschlossen (`h1Closed: true`).**

Restannahme: Der gepackte Zustand hängt an `app.isPackaged` von Electron. Wer die Electron-Binärdatei oder die App-Dateien manipulieren kann, hat bereits lokale Codeausführung. Das liegt außerhalb dessen, was H-1 beschrieben hat.

## 3. Verbleibende Befunde

Die Einstufungen aus der Basisprüfung bleiben, soweit nicht anders vermerkt. Keiner ist HOCH oder KRITISCH.

- **M-1 MITTEL** Manifest ohne Frische (kein Zähler, kein Ablauf, keine Mindestversion). Im geänderten Code nicht behoben. Vor BETA/Stable entscheiden.
- **M-2 MITTEL** Ein Signaturschlüssel ohne Key-ID, Rotation und Widerruf. Der private Schlüssel liegt im Arbeitsbaum unter `keys/` (ignoriert, nicht versioniert, nicht geöffnet). Ablage klären, bevor das erste Release signiert wird. Ob der Schlüssel passwortgeschützt ist, ist unbekannt.
- **M-3 MITTEL** Modulupdates. Im gepackten Build ist der unsignierte Legacy-Modulpfad jetzt nicht mehr erreichbar: `check()` läuft über `checkGithub()`, das `state.moduleUpdates = []` setzt (Zeile 341), und `downloadModule` (Zeile 658) verlangt einen Eintrag daraus. Ich habe den Initialzustand von `state` und `writeState` nicht gelesen; deshalb senke ich die Stufe nicht. Sobald Modulupdates über GitHub angebunden werden, gilt für sie dasselbe Signaturgebot samt signierter Modulkennung. `zip.js` wurde auch jetzt nicht neu geprüft.
- **M-4 MITTEL** Öffentliches Repository enthält Personenbezug und interne Berichte. Entscheidung beim Commander (siehe Basisprüfung Abschnitt 2 und M-4). Verschärfung: Die neuen unversionierten Dokumente unter `docs/operation-academy/` enthalten laut Basisprüfung teils lokale Pfade. Vor dem Push sichten.
- **N-1 NIEDRIG** Download ohne Größengrenze im Speicher, Weiterleitungsziel wird nur nachträglich geprüft (`service.js:532-537`, unverändert).
- **N-2 NIEDRIG** `state.json` wird beim Wiederherstellen nur teilweise an die Signatur gebunden. Teilweise verbessert: `reconcile` (Zeile 266) und `installPlan` (Zeile 628) rufen im GitHub-Pfad `storedManifestOk` auf. Offen bleibt das Zeitfenster zwischen Hashprüfung und Start. Die Stufe bleibt NIEDRIG.
- **N-3 NIEDRIG** `ACADEMY_UPDATE_TOKEN` aus der Umgebung. Nur für die API-Quelle, nicht für Downloads. Kein eingebettetes Token.
- **N-4 NIEDRIG** Öffentlicher Schlüssel und Änderungen sind unversioniert (`??` für `manifest-sign.js` und `update-public-key.pem`). Beim Commit nur `BEGIN PUBLIC KEY` aufnehmen, `keys/` ignoriert lassen.
- **N-5 NIEDRIG (neu)** Packaging des öffentlichen Schlüssels nicht bewiesen. `package.json` `build.files` enthält `src/**/*`, das die Datei einschließt. Ich habe kein Installer-Artefakt geöffnet. Fehlt die Datei im Paket, ergibt jede Prüfung `key-missing` und es wird nichts installiert (fail-closed, keine Sicherheits-, aber eine Funktionslücke). Mit dem ersten gebauten DEV-Installer prüfen, dass `resources/app.asar` die Datei enthält.
- **I-1 INFORMATIV (neu)** Ungepackt (`isPackaged` false) darf `ACADEMY_UPDATE_FEED` weiterhin einen Loopback-Feed setzen, ebenso `ACADEMY_PUBLISHER_THUMBPRINT`. Das ist der dokumentierte Testweg und im installierten Build wirkungslos. Es darf nicht als Prüfbeleg für den installierten Build dienen.
- **I-2 INFORMATIV (neu)** Die Tests decken `resolveFeedUrl` und den Service ab, nicht den Aufruf in `src/main.js`, weil `main.js` Electron braucht. Dass Zeile 77 die Funktion mit `app.isPackaged` aufruft, belegt hier nur die Lesung. Ein statischer Test auf diese Zeile oder der Windows-Test mit gesetzter Variable im installierten Build schließt die Lücke.

## 4. Empfohlene Schritte vor dem DEV-Testrelease (alle nicht blockierend)

1. Im ersten installierten DEV-Build `ACADEMY_UPDATE_FEED` setzen und bestätigen, dass die Anfrage nur an `api.github.com` geht (schließt I-2 praktisch).
2. Nach dem Build prüfen, dass der öffentliche Schlüssel im Paket liegt (N-5).
3. Vor dem Commit Dokumente aus `docs/operation-academy/` auf Benutzernamen, lokale Pfade und Autor-E-Mail sichten (M-4). Commit mit `noreply`-Adresse.
4. Schlüsselablage für M-2 festlegen, bevor das erste Manifest signiert wird.

## 5. Grenzen der Prüfung

- Statische Lesung des Arbeitsbaums bei HEAD `e558c14`. Gelesen: `feed.js` (Zeilen 255-288), `main.js` (Zeilen 55-124), `manifest-sign.js` vollständig, `service.js` Zeilen 1-119 und 255-733, `github-feed.js` nur die Treffer um `verifyManifest`, Test `phase-n-wiring.test.js` nur Zeilen 79-101.
- Nicht erneut gelesen: `channels.js`, `zip.js`, `module-manifest.js`, `ipc.js`, `service.js` Zeilen 120-254 (Zustandsfunktionen, `writeResponse`, `fetchFeed`) und `github-feed.js` außerhalb der Treffer. Die Ergebnisse dazu stammen aus der Basisprüfung und sind nicht neu bestätigt.
- Keine Tests, kein Build, kein Netzwerkzugriff, kein Installer-Artefakt geprüft. Kein `npm audit`. GitHub-Kontoeinstellungen (2FA, Branch- und Tag-Schutz, Secrets) nicht geprüft.
- Die Git-Historie wurde in diesem Lauf nicht neu durchsucht. Es gilt die Basisprüfung (18 Commits, keine Tags, kein Geheimniswert gefunden). Neue unversionierte Dateien sind noch nicht in der Historie.
- Dieser Nachtrag ist keine Produktionsfreigabe. Die endgültige Entscheidung liegt beim Commander.
