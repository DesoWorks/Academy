# Sicherheitsprüfung Updateweg – Operation Academy N.1 / Welle 2 (Basisprüfung)

Prüfer: RoboCop, Security Officer
Datum: 22.11.2026
Projekt: DesoWorks Academy (`D:\Desoworks\Workspace\Academy`)
Branch: `feature/phase-n1-release-connectivity`, HEAD `e558c14`, Arbeitsbaum geändert (`.gitignore`, `src/updates/github-feed.js`, `messages.js`, `service.js` geändert; `manifest-sign.js`, `update-public-key.pem`, drei Tests und mehrere Docs neu und unversioniert).
Art: lesend, statisch. Kein Commit, kein Push, keine Sichtbarkeitsänderung, keine Dateiänderung außer diesem Bericht. Dieser Bericht enthält keinen Schlüssel- oder Tokenwert.

**Dies ist die Basisprüfung vor JARVIS' Abschluss, nicht die Nachprüfung.** JARVIS ändert `src/updates` parallel. Alles unten gilt für den Stand, den ich gelesen habe. Die Nachprüfung steht aus.

## 1. Ergebnis

**Veröffentlichung blockiert: JA.** Ein HOCH-Befund ist offen (H-1). Kein KRITISCH-Befund.

| Stufe | Anzahl | IDs |
| --- | --- | --- |
| KRITISCH | 0 | – |
| HOCH | 1 | H-1 |
| MITTEL | 4 | M-1 bis M-4 |
| NIEDRIG | 4 | N-1 bis N-4 |

## 2. Git-Historie (selbst geprüft)

Die Shell war nutzbar. Befehle einzeln ausgeführt, Ausgaben im Lauf gelesen.

- Erreichbare Referenzen: lokale Branches `feature/phase-j-it-module`, `-k-stability-trust`, `-l-module-experience`, `-m-live-update`, `-n-continuous-delivery`, `-n1-release-connectivity`, `main`. Remote: `origin/main`, `origin/feature/phase-j-it-module`. **Tags: keine.** `git rev-list --all --count` ergab 18 Commits. (Die frühere Zählung 15 stammt von einem älteren Stand.)
- **Dateien:** `git log --all --name-only --diff-filter=AM` über alle 18 Commits gelesen. Kein Pfad mit `dist/`, `.exe`, `.sqlite`, `.db`, `.asar`, `.pem`, `.pfx`, `.p12`, `.key`, `.env`, `.npmrc`. `git ls-files keys src/updates/update-public-key.pem` ist leer: Schlüsselordner und öffentlicher Schlüssel sind noch nicht versioniert.
- **Inhalte:** `git log --all -p -G` auf Token-Präfixe (`ghp_`, `github_pat_`, `gho_`, AWS-, OpenAI-/Slack-Form), `BEGIN … PRIVATE KEY` und generische Zuweisungen (`password`, `api_key`, `secret`, `token`). Treffer nur in den Commits `e8b78f6` (`src/updates/github-feed.js`: Code mit `Bearer ${token}`, Tokenvariable aus Aufruferoption oder Umgebung; `tests/phase-n-github-feed.test.js`: Testplatzhalter `qa-test-token-not-for-url`; `docs/operation-academy/UPDATE-SECURITY-N.md`) und `54a5330` (`UPDATE-SECURITY-N.md`). Das sind Code und Dokumentation über Muster, keine Zugangsdaten. Eine gezielte Suche `BEGIN … PRIVATE KEY` in fünf Commits traf nur die Bericht-Zeile, die das Muster nennt. **Kein Geheimniswert, kein privater Schlüssel, kein Zertifikat, keine Datenbank in der Historie.**
- Objektbestand: 553 lose Objekte, 1 Pack, `garbage: 0`.
- **Personenbezug (bestätigt, Art ohne Wert):** Alle 18 Commits tragen dieselbe Autorenkennung mit E-Mail-Adresse einer privaten Domain (Autor und Committer). Vorname einer Person in ausgelieferten Lerninhalten (`modules/it-systemintegration/web/js/lf8-kontrolle.js`, `lf8-reflexion.js`, `lf9-kontrolle.js`, `lf9-zukunft.js`, Commit `4a93e1a`). Lokaler Windows-Benutzername in Pfaden in `docs/operation-academy/PHASE-M.md`, `WINDOWS-UPDATE-TEST-M.md`, `UPDATE-INVENTORY-N.md`, `PHASE-N.md`, `UPDATE-SECURITY-N.md`. Interne Sicherheitsberichte mit Befunden früherer Phasen (`SECURITY-PHASE-*.md`, `UPDATE-SECURITY-M.md`) und lokale Verzeichnisstruktur. Siehe M-4.
- **Arbeitsbaum:** `keys/academy-update-private.pem` liegt im Projektordner. Durch `.gitignore` (`keys/`, `*.pem`) ausgeschlossen, `git check-ignore` bestätigt, nie versioniert. Ich habe die Datei nicht geöffnet. Siehe M-2.

**Grenzen der Historienprüfung:** Muster sind begrenzt (Bekanntes, keine Entropiesuche). Binärdateien (PNG-Screenshots, Icons, `windows-update-evidence.json` nur als Pfad) nicht inhaltlich gesichtet. Reflog, Stash und nicht erreichbare Objekte nicht untersucht. `historyComplete` gilt für alle erreichbaren Branches und Tags, nicht für diese Lücken.

## 3. Befunde Updatepfad

Gelesen: `github-feed.js`, `manifest-sign.js`, `service.js`, `signature.js`, `channels.js`, zusätzlich `feed.js` und den Aufruf in `src/main.js`. Tests nicht ausgeführt.

### H-1 HOCH – Ungeprüfter Legacy-Feed per `ACADEMY_UPDATE_FEED` umgeht die Ed25519-Signatur, auch im gepackten Build
- **Beleg:** `src/main.js:76` `feedUrl: process.env.ACADEMY_UPDATE_FEED || ""`. Im Gegensatz dazu sind Kanal (`main.js:41`) und Herausgeber-Thumbprint (`main.js:91`) mit `app.isPackaged` abgesichert. `service.js:324` `if (!feedUrl) return checkGithub();` bei gesetzter Variable läuft der alte Pfad `check()` (Zeilen 325-397): `selectRelease` aus `feed.js`, Prüfsumme aus dem Schwester-Asset `<name>.sha256` derselben Quelle (`service.js:456-459`), **keine Manifest-Signatur**.
- **Erreichbarkeit der Quelle:** `feed.js:26-28` erlaubt `http://127.0.0.1` und `localhost` auf jedem Port. `repositoryPinned` (`feed.js:66`) gilt Loopback pauschal als gepinnt. Der Hash stammt von derselben Stelle wie die Datei und beweist keine Herkunft.
- **Auswirkung:** Wer die Umgebung des Academy-Prozesses setzen kann (Benutzervariable, Verknüpfung, Startskript), lässt die installierte DEV-Version einen beliebigen Installer annehmen. Dieser läuft mit `/S` (`installPlan`, `service.js:552-559`). Auf DEV/BETA gibt es keine Authenticode-Prüfung (Thumbprint gepackt leer). Das hebt die Zusage der Mission auf: keine Sicherheitsprüfung für den DEV-Kanal umgehen. Stable ist nicht betroffen, weil ohne Thumbprint fail-closed (`service.js:539-543`).
- **Voraussetzung:** Zugriff auf die Prozessumgebung des Benutzers. Das ist keine Fernausnutzung, daher nicht KRITISCH. Der Bypass ist aber ein Standardweg für dauerhafte Persistenz und hebt das neue Sicherheitsversprechen auf.
- **Gegenmaßnahme:** Im gepackten Build `ACADEMY_UPDATE_FEED` ignorieren (`app.isPackaged ? "" : …`), analog zu Kanal und Thumbprint. Alternativ den Legacy-Pfad nur hinter einem expliziten Entwickler-Schalter außerhalb von Release-Builds. Test: Variable gesetzt plus gepackter Modus ergibt `checkGithub`-Pfad.
- **Status:** offen, blockiert die Veröffentlichung. Ein Dokument schließt ihn nicht.

### M-1 MITTEL – Manifest ohne Frische: kein Zähler, kein Ablauf, keine Mindestversion
- **Beleg:** `channels.js` `judge` (Zeilen 89-111) prüft `product`, `channel`, `version`, `platform`, `package`, `sha256`. Es gibt weder laufende Nummer noch `expires`, noch `minVersion`. `github-feed.js` kennt keinen Rollback-Zähler.
- **Auswirkung:** Downgrade auf eine ältere Version als die installierte ist verhindert (`allowDowngrade: false`, `service.js:272`; zusätzlich `installPlan` `compare(...) <= 0`, Zeile 526). Offen bleibt: Wer Releases löschen oder verstecken kann (Konto- oder Token-Kompromittierung, kein Schlüssel nötig), friert Clients auf einer verwundbaren, aber gültig signierten Version ein oder bietet eine ältere, noch höhere gültig signierte Version an, obwohl eine neuere Korrektur existiert. Widerruf einer fehlerhaften Version ist nicht möglich.
- **Gegenmaßnahme:** Signierte Felder `sequence` (pro Kanal, Client merkt höchsten Wert), `expiresAt`, `minVersion`. Client lehnt ältere Nummer und abgelaufene Manifeste ab.

### M-2 MITTEL – Ein einziger Signaturschlüssel ohne Kennung, Rotation oder Widerruf; privater Schlüssel liegt unverschlüsselt (nicht geprüft) im Projektordner
- **Beleg:** `manifest-sign.js` kennt einen Schlüssel (`update-public-key.pem`), keine Key-ID, keinen Zweitschlüssel. `keys/academy-update-private.pem` im Arbeitsbaum, ignoriert, nicht versioniert.
- **Auswirkung:** Der Schlüssel ist die Wurzel des Vertrauens für alle DEV- und BETA-Installer. Kompromittierung ergibt beliebige Codeausführung bei allen Clients. Verlust ohne Zweitschlüssel macht ein Client-Update zur Wiederherstellung nötig. Ob die PEM-Datei passwortgeschützt ist, habe ich nicht festgestellt.
- **Gegenmaßnahme:** Privaten Schlüssel aus dem Repository-Arbeitsordner entfernen (offline oder Passwortmanager/Hardware), Sicherung getrennt. Key-ID im Manifest, zweiter vorab eingebetteter Schlüssel für Rotation, Widerrufsweg. Nicht als GitHub-Secret mit breitem Zugriff ablegen.

### M-3 MITTEL – Modulupdates: GitHub-Pfad unterstützt sie nicht, Legacy-Pfad ohne Signatur
- **Beleg:** `service.js:279` `state.moduleUpdates = []` im GitHub-Pfad. Modul-Tags werden von `judge` als `other-package` abgelehnt und in `service.js:23,287` still als „aktuell“ gewertet. `downloadModule` (Zeilen 562-620) nutzt nur den Legacy-Pfad: Hash aus `<name>.sha256` derselben Quelle, nur Kanal `dev`, Quelle durch H-1 erreichbar. `zip.js` habe ich nicht gelesen. Die Phase-M-Befunde zur ZIP-Entpackung (S-4) sind damit **nicht neu geprüft**.
- **Auswirkung:** Core- und Modul-Pfad sind getrennt, aber das Vertrauensniveau ist es nicht: Core läuft auf GitHub signiert, Module nur über den ungeprüften Legacy-Feed. Sobald Modulupdates über GitHub angebunden werden, gilt dasselbe Manifest-Signaturgebot samt Modulkennung im signierten Manifest. Aktuell funktional nicht vorhanden.
- **Gegenmaßnahme:** Modulpakete nur mit signiertem Manifest (`package.kind=module`, `moduleId` signiert, `core`-Kompatibilität signiert), Legacy-Modulpfad mit H-1 schließen, ZIP-Prüfung in der Nachprüfung lesen.

### M-4 MITTEL – Öffentliches Repository enthält Personenbezug und interne Berichte
- **Beleg:** Siehe Abschnitt 2. Repository laut Lead öffentlich; ich habe die Sichtbarkeit nicht selbst abgefragt.
- **Auswirkung:** Autor-E-Mail in allen 18 Commits, Vorname und Freigabelogik in Lerninhalten, Benutzername und lokale Pfade, frühere Sicherheitsberichte mit offenen Schwächen. Öffentliche Historie ist nicht zurückholbar, Bereinigung nur durch Historienumschreibung. Kein Zugangsdatum betroffen.
- **Gegenmaßnahme (Entscheidung Commander):** Künftige Commits mit `noreply`-Adresse. Inhalte (Vorname, Pfade) in kommenden Commits neutralisieren. Interne Berichte vor weiteren Pushes (Phase K bis N) sichten. Historienumschreibung nur auf ausdrücklichen Auftrag.

### N-1 NIEDRIG – Download ohne Größengrenze im Speicher, Größe aus unsignierten Metadaten
- **Beleg:** `writeResponse` (`service.js:144-169`) sammelt alle Chunks im Speicher, keine Obergrenze. Das Manifest enthält keine Größe. `asset.size` kommt aus der unsignierten API-Antwort. Der Hash wird erst nach dem vollständigen Download geprüft. Die Prüfung der Endadresse (`service.js:449`) erfolgt nach dem Request, Weiterleitungen zu `localhost` per HTTP gelten als erlaubt (`feed.js:28`).
- **Auswirkung:** Ein Release-Angreifer ohne Schlüssel kann Speicher oder Platte belasten (Verfügbarkeit). Installation bleibt durch den Hash verhindert. Für Manifest und Signatur gilt ein Limit (`github-feed.js:17-18`).
- **Gegenmaßnahme:** Signierte `size` im Manifest, Abbruch bei Überschreitung, Streaming in die `.partial`-Datei, Weiterleitungsziel auf feste GitHub-Asset-Hosts begrenzen (kein Loopback).

### N-2 NIEDRIG – Lokaler Zustand wird nicht erneut an die Signatur gebunden
- **Beleg:** `reconcile` (`service.js:203-232`) stellt `ready` aus `state.json` wieder her, solange Hash der Datei und `expectedSha256` aus derselben Datei übereinstimmen. `installPlan` vergleicht gegen `state.expectedSha256` (Zeile 529), nicht gegen das signierte Manifest. Zustände ohne `channel`-Feld werden akzeptiert (Zeile 206). Zwischen Hash und Start besteht ein Zeitfenster (Phase M S-6).
- **Auswirkung:** Nur mit Schreibzugriff des Benutzers auf `updates/` ausnutzbar, also mit bereits vorhandener lokaler Kontrolle. Niedrig.
- **Gegenmaßnahme:** Beim Wiederherstellen und vor dem Start `manifest.json`/`.sig` mit dem Paket im Zustandsordner speichern und erneut prüfen, Datei vor dem Start in einen exklusiv geöffneten Pfad kopieren.

### N-3 NIEDRIG – `ACADEMY_UPDATE_TOKEN` aus der Umgebung
- **Beleg:** `github-feed.js:23-31`. Das Token geht nur an `SOURCE_URL` (`api.github.com/.../releases`), nicht an Downloads (`fetchAssetBytes` ohne Token, Zeile 131). Es wird nicht gespeichert und nicht protokolliert. Zeichensatz begrenzt. Kein eingebettetes Token.
- **Bewertung:** Positiv. Nur Hinweis: Ein Token im Benutzerumfeld ist ein Geheimnis, das nicht in Berichte oder Logs gehört. Da die Quelle öffentlich ist, wird es nie gebraucht.

### N-4 NIEDRIG – Öffentlicher Schlüssel und Änderungen unversioniert
- **Beleg:** `src/updates/update-public-key.pem`, `manifest-sign.js` und `.gitignore` (mit Regeln für `keys/`, `*.pem`, Ausnahme für den öffentlichen Schlüssel) sind nicht committet. Die Ignore-Regel `*.pem` mit der Ausnahme ist wirksam (`git status` zeigt die Datei als `??`).
- **Hinweis:** Beim Commit prüfen, dass nur der öffentliche Schlüssel (Kopfzeile `BEGIN PUBLIC KEY` bestätigt) hinzukommt und `keys/` ignoriert bleibt. Packaging: Dass der öffentliche Schlüssel im gepackten Build enthalten ist, habe ich nicht geprüft.

## 4. Bewertung nach Prüfpunkten

| Punkt | Ergebnis | Beleg |
| --- | --- | --- |
| Ed25519-Implementierung | Solide. Rohbytes, strenges Base64 mit genau 64 Byte, Schlüsselart ed25519 verlangt, jede Ausnahme ergibt `ok:false` mit Grund (fail-closed). | `manifest-sign.js:36-68` |
| Manipuliertes Manifest | Abgewiesen durch Signatur über die exakten Bytes, danach erst `JSON.parse` derselben Bytes. Größenlimit 256 KiB, Signatur 1 KiB. | `github-feed.js:144-163` |
| Fremde Quelle | Feste Quelle. Assets nur exakt `https://github.com/DesoWorks/Academy/releases/download/<Tag>/<Name>`, kein Query, keine Credentials. Ausnahme: H-1. | `github-feed.js:98-118`, `service.js:298` |
| Falscher Kanal | Tag-Kanal, signiertes `manifest.channel`, Version und Prerelease-Flag müssen übereinstimmen. Kanal kommt aus Build/Nutzerwahl, nicht aus dem Manifest. Unbekannter Wert wird abgelehnt statt ersetzt. | `channels.js:89-111`, `service.js:41-52,323` |
| Downgrade | Doppelt verhindert (Auswahl und `installPlan`). Frische/Widerruf fehlt: M-1. | `service.js:272,526` |
| Weiterleitung | Manifest und Signatur durch die Signatur geschützt. Installer-Inhalt durch signierten Hash geschützt. Weiterleitungsziel wird nur nachträglich geprüft: N-1. | `service.js:449` |
| Reicht ein gültiges Manifest allein? | Für den Core-Download auf DEV/BETA ja als einzige Vertrauensquelle: Signatur bindet Hash, Version, Kanal, Plattform. Zusatzprüfungen bestehen (Hash nach Download, erneut vor Start, Vergleich der Datei, Backup vorhanden). Es fehlen Frische (M-1), Schlüssel-Rotation (M-2) und die erneute Bindung am Start (N-2). Für Stable genügt es nicht: zusätzlich Authenticode-Thumbprint, fail-closed solange leer. | `service.js:526-548` |
| Core gegen Module | Core: signiert (GitHub-Pfad). Module: nur Legacy-Pfad ohne Signatur (M-3). | siehe M-3 |
| Release-Notes-Darstellung | `textContent`, kein HTML. | `src/renderer/verwaltung.js:56` |

## 5. Offene Blocker für die Veröffentlichung

1. **H-1** schließen und in der Nachprüfung testen (gepackter Modus ignoriert `ACADEMY_UPDATE_FEED`).
2. M-1 bis M-4: für DEV-Testrelease nicht blockierend, vor BETA und Stable und vor weiterem öffentlichen Push zu entscheiden. M-2 (Schlüsselablage) vor dem ersten signierten Release klären.

## 6. Grenzen der Prüfung

- Basisstand während laufender Änderungen von JARVIS. Alle Aussagen beziehen sich auf den Arbeitsbaum zum Zeitpunkt des Lesens. `service.js` wurde vollständig gelesen, `feed.js` vollständig, `main.js` nur Zeilen 36-105.
- Nicht gelesen oder nicht neu geprüft: `zip.js`, `module-manifest.js`, `dev-feed.js`, `ipc.js`, Installationsstart nach `installPlan`, Sicherung der Lernstände (Phase-M-Befunde S-2 bis S-7). Tests nicht ausgeführt. Kein `npm audit`.
- Nicht geprüft: GitHub-Kontoeinstellungen (2FA, Branch- und Tag-Schutz, Secrets), Sichtbarkeit des Repositories (Angabe aus dem Lead-Kontext), echte GitHub-Redirect-Ziele (keine Releases vorhanden), Packaging des öffentlichen Schlüssels, PEM-Schutz des privaten Schlüssels.
- Es wurden keine Netzwerkzugriffe, Portscans oder Angriffsversuche ausgeführt. Die Historienprüfung ist regelbasiert (Abschnitt 2).
- Historische Berichte wurden nicht als Beleg verwendet. Die endgültige Entscheidung liegt beim Commander.
