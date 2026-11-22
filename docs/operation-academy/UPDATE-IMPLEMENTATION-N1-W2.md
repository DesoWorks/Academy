# Update-Implementierung N.1 / Welle 2 (JARVIS)

Branch: feature/phase-n1-release-connectivity, nicht committet, nicht gepusht.

## Geänderte Dateien

- `src/updates/github-feed.js`: `validateManifest` (Produkt, Kanal, Version, SHA-256, Paketart; mit `strict` zusätzlich releaseTag und Installername), `isAllowedFinalUrl` (nur https, nur GitHub-Hosts, keine Zugangsdaten in der URL), Verwerfen von Weiterleitungen weg von GitHub, Prüfung `verdict.ok !== true`, geprüfte Rohbytes und Signatur bleiben am Release.
- `src/updates/service.js`: erneute `verifyManifest`-Prüfung der exakten Bytes bei der Prüfung, vor dem Download, bei der Wiederaufnahme nach Neustart und vor dem Installationsplan. Abbruch bei `ok !== true`. Downgrade-Sperre vor dem Download. Signiertes Manifest wird neben dem Installer abgelegt. Im GitHub-Pfad nur Downloads unter dem festen Release-Präfix und nur GitHub-Weiterleitungen. Newer-but-unverified Releases ergeben eine verständliche Meldung statt "aktuell".
- `src/updates/messages.js`: `signatureInvalid`, `downgradeRejected`.
- `.github/workflows/academy-dev.yml`: Job bricht ohne Secret `ACADEMY_MANIFEST_SIGNING_KEY` ab; erzeugte Signatur wird gegen den öffentlichen Schlüssel geprüft. `signature=unsigned` bleibt, es beschreibt nur den Authenticode-Status des Installers.
- `tests/phase-n1-w2-updater.test.js`: neu, 27 Tests.
- `src/main.js`: unverändert. Die Kanalwahl hängt dort bereits (`channelPreference()`, Zeile 78).

## Selbst ausgeführt

- `node --test tests/phase-n1-w2-updater.test.js` mit TEMP/TMP auf D:: 27 von 27 bestanden, 0 übersprungen.
- `node --test tests/` mit TEMP/TMP auf D:: 128 Tests, 127 bestanden, 1 fehlgeschlagen, 0 übersprungen.

Abgedeckt: gültige Signatur, ungültige Signatur, manipulierte Bytes, falscher Schlüssel, falscher Kanal, Downgrade, falscher SHA-256, fremde Hosts und Weiterleitungen, Token nur an die Releaseliste, kein eingebettetes Token, Neustart und abgebrochene Installation, Lernstanddatei bleibt nach fehlgeschlagenem Download unverändert. Alle Zusicherungen prüfen `ok === true` bzw. `ok === false`.

## Offene Punkte und nicht Belegtes

1. `tests/phase-n-wiring.test.js` Zeile 32 ("fehlendes GitHub-Token sperrt Updateprüfung") ist rot. Er verlangt "blocked" ohne Token und widerspricht dem N.1-Vertrag (öffentliche Releases, kein Token nötig). Er war schon vor meinen Änderungen rot. Datei liegt außerhalb meiner Freigabe, nicht abgeschwächt, nicht gelöscht. Entscheidung durch Rick nötig: Test an den Vertrag anpassen.
2. Laufwerk C: hatte beim Lauf 0 GB frei. Ohne TEMP auf D: scheitert `phase-k-updates.test.js` mit ENOSPC im Testaufbau. Das ist ein Umgebungsproblem, kein Updatercode.
3. Der Workflow wurde nicht ausgeführt. Das Actions-Secret kann die Crew nicht anlegen. Ohne Secret schlägt der DEV-Lauf bewusst fehl.
4. Windows A/B-Installation und ein echter GitHub-Download sind nicht belegt. Die Tests nutzen ein Mock-fetch.
5. Dass der gebündelte öffentliche Schlüssel im Produktivpfad ohne `updatePublicKey`-Option geladen wird, ist nur durch die Codestruktur (`manifest-sign.js`, `PUBLIC_KEY_FILE`) angenommen, nicht in einem Produktivlauf belegt.
6. Authenticode-Signatur des Installers ist nicht Teil dieser Arbeit.
7. Hilfsdateien liegen unter `D:\jarvis-tmp` (außerhalb des Repos) und können gelöscht werden.


## Nachtrag: Schliessung von ROBOCOP-Befund H-1 (JARVIS)

Branch: feature/phase-n1-release-connectivity, nicht committet, nicht gepusht, kein Build, kein privater Schluessel.

Problem: `src/main.js` reichte `process.env.ACADEMY_UPDATE_FEED` auch im gepackten Build an den Updatedienst. Damit wurde der Legacy-Feed benutzt und die Ed25519-Pruefung uebersprungen.

Entscheidung: Ein gepackter Build ignoriert `ACADEMY_UPDATE_FEED` und benutzt nur den signierten GitHub-Weg (leere `feedUrl`). Ein ungepackter Lauf darf die Variable fuer Tests weiter nutzen.

### Geaenderte Dateien

- `src/updates/feed.js`: neue Funktion `resolveFeedUrl({ isPackaged, env })`, ohne Electron aufrufbar. Gepackt gibt sie immer `""` zurueck.
- `src/main.js`: benutzt genau diese Funktion mit `app.isPackaged` (`feedUrl: resolveFeedUrl({ isPackaged: app.isPackaged, env: process.env })`).
- `tests/phase-n-wiring.test.js`: erster Test an den oeffentlichen Vertrag angepasst (ohne Token Abruf an `https://api.github.com/repos/DesoWorks/Academy/releases`, Installation unveraendert, `error` ist nicht `no-token`, kein Authorization-Header). Die Tests fuer nightly und die ausdruecklich uebergebene Loopback-feedUrl bleiben unveraendert. Drei neue Tests fuer H-1. Kein skip.
- `.github/workflows/academy-beta.yml`: bricht ohne `ACADEMY_MANIFEST_SIGNING_KEY` ab und prueft die erzeugte Signatur gegen den oeffentlichen Schluessel, wie `academy-dev.yml`. `signature=unsigned` meint nur den Authenticode-Status des Installers, nicht ein unsigniertes Manifest.

### Hinweise

- `academy-stable.yml` wurde nicht angefasst (ausserhalb des Auftrags).
- Der Legacy-Pfad (`feedUrl` gesetzt) existiert ungepackt weiterhin fuer Tests. Er bleibt nur dort erreichbar.
