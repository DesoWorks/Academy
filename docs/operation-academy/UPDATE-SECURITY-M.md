# Sicherheitsprüfung Update-Prozess – Phase M (Live Update)

Prüfer: RoboCop, Security Officer
Datum: 22.11.2026
Projekt: DesoWorks Academy (`D:\Desoworks\Workspace\Academy`)
Prüfgegenstand: Updateprozess, Stand `HEAD 78762972a6b7f17c7fd95add2bbb503344d4e339`
Arbeitsbaumstatus: nicht ermittelt (`git status` wurde von der Harness abgelehnt). Gelesen wurde der Dateistand zum Zeitpunkt der Prüfung. Es gibt keine Aussage, ob er committet ist.
Art der Prüfung: lesend. Kein Quellcode geändert, kein Commit, kein Angriffs- oder Netzwerktest.

Gelesen: `src/updates/feed.js`, `service.js`, `dev-feed.js`, `semver.js`, `signature.js`, `zip.js`, `src/main.js`, `src/ipc.js` (Update- und Modulhandler), `src/config.js`, `scripts/dev-feed-server.js`, `scripts/publish-dev-feed.js` (Schlüsselanlage), `docs/operation-academy/WINDOWS-UPDATE-TEST-M.md`. Einen Befund habe ich per `node -e` nachgestellt (S-1).

Nicht von mir ausgeführt: der Windows-Installationstest. Ich habe nur den Bericht gelesen und kann ihn nicht bestätigen.

## 1. Gesamturteil

| Kanal | Sicherheitsempfehlung |
| --- | --- |
| **Stable** | **NEGATIV. Bleibt blockiert.** Ohne Herausgeberzertifikat installiert Stable nichts. Das ist im Code erzwungen, nicht nur dokumentiert. |
| **DEV, heutiger Test (`0.3.1-dev.1` → `dev.2`) auf der Commander-Maschine** | **Vertretbar mit Auflagen.** Kein Stable-Vertrauen wird berührt. Die DEV-Schwächen unten sind bekannt und begrenzt. |
| **DEV, breitere Nutzung oder Build ab `dev.10`** | **Nicht freigeben**, bis S-1 (Versionsvergleich) behoben und nachgeprüft ist. |

Die endgültige Freigabe liegt beim Commander.

## 2. Was blockiert und was nicht

**Blockiert (Stable):**
- Fehlendes Herausgeberzertifikat. Im gepackten Build steht `publisherThumbprint` fest auf `""` (`main.js:87`). `installPlan` gibt dann für Stable `ok:false` zurück (`service.js:401-405`).
- Zusätzlich hat ein gepackter Stable-Client keine Feed-Adresse (`main.js:74-76`, Stable und gepackt ergibt `""`). `check()` meldet dann „kein Feed“. Stable kann also schon nichts finden.
- Beide Sperren sind aktiv und unverändert. **Keine Stable-Sicherheitsregel wurde gelockert.**

**Nicht blockiert (DEV):**
- Unsignierte Prereleases werden nur mit SHA-256-Prüfung, nur auf dem DEV-Kanal und nur nach einer Datensicherung installiert (`service.js:372-399`).
- Der Kanal kommt im gepackten Build aus `channel.json`. Umgebungsvariablen werden ignoriert (`main.js:40`, `resolveChannel({})`). Im ungepackten Build kann `ACADEMY_CHANNEL` nur von Stable auf DEV zurückstufen, nie umgekehrt (`config.js:20-23`).

**Ein Loopback-Feed ist kein Stable-Vertrauensanker.** Er ist es auch für DEV nicht im Sinn von Echtheit (siehe S-2). Er liefert Bereitstellung, keine Herkunftsgarantie.

## 3. Bewertung nach Prüfpunkt

### 3.1 Repository-Pinning
`repositoryPinned` (`feed.js:54-76`) prüft für `github.com` den Pfad `/DesoWorks/Academy/releases/download/…`. Für `api.github.com` prüft es `/repos/DesoWorks/Academy/releases…`. Beides ist korrekt und unabhängig von Groß-/Kleinschreibung. Es gilt für Core- und Modulpakete.

Grenzen:
- **Für jede Loopback-Adresse (jeder Port) und jeden `extraHosts`-Eintrag gibt die Funktion `true` zurück** (Zeilen 66-68). Beim Loopback-Feed bindet das Pinning also nichts.
- Im gepackten Build wird `extraHosts` nicht gesetzt (`main.js:70-89`). Dieser Weg ist dort aus.
- Das Pinning ist heute **nicht live erprobt**. Die GitHub-Releases sind leer, das Repository ist privat und der Client hat kein Token (Lead-Kontext). Es ist per Code gesichert, nicht per Praxis belegt.

Bewertung: Informativ.

### 3.2 Hash
SHA-256 wird gegen das mitgelieferte `.sha256`-Asset geprüft (`service.js:326-345`). Bei Abweichung wird die Datei gelöscht und `hash-mismatch` gemeldet. Vor dem Start prüft `installPlan` den Hash erneut (Zeile 391). Das Windows-Protokoll zeigt einen Lauf mit falscher Summe, der verworfen wurde (nicht von mir nachvollzogen).

Grenzen:
- **Der Hash beweist Unversehrtheit, nicht Herkunft.** Installer und Prüfsumme kommen aus derselben Quelle. Wer den Feed kontrolliert, liefert beides passend.
- Kein Größenlimit beim Download. Die Daten werden vollständig im Speicher gesammelt (`writeResponse`, Zeilen 107-123). Die gemeldete `size` wird nicht gegen die tatsächlichen Bytes geprüft.

Bewertung: Informativ (Echtheit), Niedrig (Größenlimit).

### 3.3 Signatur
`verifyPublisher` (`signature.js`) ruft `Get-AuthenticodeSignature` über den festen Systempfad von PowerShell auf. Die Datei geht per Umgebungsvariable hinein, nicht als Befehlstext, es gibt also keine Befehlsinjektion. Gültig ist nur `Status == Valid` und genau passender Thumbprint.

Grenzen:
- Der Pfad ist nur für Stable aktiv (`service.js:401`) und mangels Zertifikat nicht erprobt. Der Windows-Bericht bestätigt das selbst.
- Zwischen Signaturprüfung und Start liegt ein kleines Zeitfenster (Datei liegt in `updates/incoming`, vom Benutzer beschreibbar). Siehe S-6.
- Sobald ein Zertifikat existiert, muss der Thumbprint (öffentlicher Wert) in den gepackten Build. Das ist eine Codeänderung mit eigener Nachprüfung.

Bewertung: Stable-Blocker bleibt bestehen. Es handelt sich nicht um eine Schwachstelle.

### 3.4 DEV/Stable-Trennung
Im Code durchgängig vorhanden und nachvollzogen:
- `selectRelease` Stable: Prereleases werden herausgefiltert. DEV: eine neuere Stable-Version wird nur als „blockiert“ angezeigt, nicht geladen (`feed.js:170-182`).
- `download` und `installPlan` verlangen auf DEV `state.prerelease === true` (`service.js:280`, `373`).
- Stable gibt für Module `[]` zurück (`feed.js:204`). `downloadModule` verlangt `channel === "dev"` (`service.js:426`).

Bewertung: bestanden.

### 3.5 Downgrade
`selectRelease` und `installPlan` verlangen `compare(neu, installiert) > 0` (`feed.js:171,185`; `service.js:388`). Der Schutz ist doppelt, hängt aber vollständig an `compare()` – und die ist für Prerelease-Zähler fehlerhaft (S-1).

### 3.6 Pfad
- Installer: Dateiname nur aus `installerFile(version)`. `isSafeVersion` erlaubt nur `\d+.\d+.\d+(-[0-9A-Za-z.]+)?`, also keine Trennzeichen. Zusätzlich prüft `contained()` die Lage im Updateordner.
- Modul-ZIP: Dateiname `${id}-${version}.zip`, `safeModuleId` und `isSafeVersion` schließen Pfadtrenner aus. Dazu kommt eine Containment-Prüfung (`service.js:432-437`).
- `safeAssetName` verbietet `/`, `\` und NUL im Asset-Namen.
- Feed-Server: `decodeURIComponent` und danach Ablehnung von `..`, `/`, `\`, NUL, dazu eine Relative-Prüfung (`dev-feed-server.js:34-41`). Nur Dateien direkt im Feedordner, nur GET unter `/dev/`.

Bewertung: bestanden. Kleine Lücke in der ZIP-Extraktion, siehe S-4.

### 3.7 Loopback-Feed
Der Server bindet nur `127.0.0.1:47321` und verlangt den Header `x-academy-dev-key`. Der Client kennt die Adresse fest (`dev-feed.js`) und lässt sie im gepackten Build nicht umlenken.

**Der Schlüssel schützt den Server vor dem Client, nicht den Client vor dem Server.** Der Client sendet den Schlüssel an *jede* Loopback-Adresse (`service.js:39`, `isLoopbackUrl`) und akzeptiert danach jede Antwort. Siehe S-2.

### 3.8 Lokaler Schlüssel
- 32 Zufallsbytes, hex, in `%APPDATA%\DesoWorks\Academy\updates\dev-feed.key` (`publish-dev-feed.js:37-39`). Nicht im Git.
- `mode: 0o600` hat unter Windows keine Wirkung. Der Schutz hängt an den ACLs des Benutzerprofils. Ich habe die ACL der Datei nicht geprüft.
- Keine Rotation, kein Ablauf. Der Server liest die Datei bei jeder Anfrage neu (praktisch, aber ohne Rate-Limit).
- Vergleich `presented !== key` ist nicht zeitkonstant. Bei Loopback und 256-Bit-Schlüssel praktisch ohne Gewicht.

Bewertung: Niedrig.

### 3.9 Modul-ZIP
Positiv: Pfadprüfung (`safeRelative`, Containment), Verschlüsselung abgelehnt, Entry-, Größen- und Dateianzahl-Limits, Hash-Prüfung vor dem Entpacken und erneut im IPC-Handler, vorheriger Modulstand wird als Rollback-Kopie gesichert (`ipc.js:469-488`).
Grenzen: S-4.

## 4. Befunde

Stufen nach operating-manual. „Bestätigt“ heißt: im Code gelesen. „Nachgestellt“ heißt: mit Ausgabe belegt.

### S-1 – Versionsvergleich bei Prerelease-Zählern: Downgrade-Umgehung (MITTEL, DEV, nachgestellt)
`compare()` vergleicht den Prerelease-Teil als Zeichenkette (`semver.js:29`, `a.pre < b.pre`). Beleg (Ausgabe von `node -e`, ausgeführt im Projektordner):

```
dev.2 vs dev.10: 1 | dev.10 vs dev.2: -1
```

`0.3.1-dev.2` gilt damit als **neuer** als `0.3.1-dev.10`.
- Wirkung 1: Ein installierter `dev.10` würde `dev.2` als „Update“ angeboten bekommen. `installPlan` hat dieselbe Prüfung und lässt es durch. Das ist ein Downgrade auf einen älteren unsignierten Build.
- Wirkung 2: Ein neuer `dev.10` wird gegenüber `dev.2` nie gefunden.
- Voraussetzung: Feed liefert einen entsprechenden Eintrag, installierte Version ab `dev.10`. Gilt auch für Modul-Updates (`feed.js:210`).
- Heute nicht ausgelöst: Die getesteten Stände sind `dev.1` und `dev.2`.

Empfehlung: Prerelease-Teil nach SemVer vergleichen (Segmente an `.` trennen, numerische Segmente als Zahlen). Testfall `dev.2 < dev.10` ergänzen. Danach Nachprüfung durch mich.
**Auflage:** Kein DEV-Build mit Zähler ≥ 10 veröffentlichen, bis das behoben ist.

### S-2 – Loopback-Feed liefert keine Echtheit; Port-Squatting (MITTEL, DEV, plausibel, nicht ausgenutzt)
Der Client sendet den Schlüssel an `127.0.0.1:47321`, ohne zu prüfen, wer dort lauscht. Ist der Feed-Server nicht gestartet (der Windows-Bericht bestätigt, dass der Port danach frei war), kann ein anderer Prozess den Port belegen. Er erhält den Schlüssel und kann Manifest, Installer und passende SHA-256 liefern. Der Client installiert still (`/S`) nach einem Klick des Commanders.
- Voraussetzung: ein zweiter Prozess oder Benutzer auf derselben Maschine. Ein Prozess mit Rechten des Commanders kann ohnehin Code ausführen. Der Befund wiegt darum vor allem bei weiteren Konten oder niedriger privilegierten Prozessen.
- Betrifft Stable nicht. Dort ist die Signatur Pflicht, und die Feed-Adresse fehlt.

Empfehlung (ohne Zertifikat umsetzbar): Das Manifest bekommt eine Ed25519-Signatur. Der öffentliche Schlüssel kommt in den Client, der private bleibt offline beim Commander. Der Client verwirft jedes Manifest ohne gültige Signatur. Das schafft einen echten DEV-Vertrauensanker.
Bis dahin: Feed-Server nur während eines Tests laufen lassen, vor dem Test prüfen, dass der Port frei ist, nur auf der eigenen Maschine.

### S-3 – Repository-Pinning ist für Loopback und extraHosts wirkungslos (NIEDRIG, bestätigt)
Siehe 3.1. Die Funktion ist für GitHub korrekt, gibt aber `true` für jede Loopback-Adresse. Ein Manifest vom Loopback-Feed kann daher Assets auf beliebige lokale Ports verweisen, und dorthin wird der Schlüssel geschickt (`service.js:39`).
Empfehlung: Schlüssel nur an die feste Feed-Adresse (Host und Port) senden. Asset-URLs auf demselben Ursprung wie das Manifest oder auf das gepinnte GitHub-Repository beschränken.

### S-4 – ZIP-Extraktion (NIEDRIG–MITTEL, bestätigt, nicht ausgenutzt)
- `zlib.inflateRawSync(compressed)` hat kein `maxOutputLength` (`zip.js:152`). Die Größenprüfung kommt erst nach dem Entpacken. Ein ZIP-Bomben-Eintrag kann vorher den Speicher füllen. Voraussetzung: passender Hash, also Kontrolle über den Feed.
- `safeRelative` verbietet Laufwerksbuchstaben nur am Anfang. Namen wie `datei.txt:strom` (NTFS-Alternate-Data-Stream) und reservierte Windows-Namen (`CON`, `NUL`) werden nicht abgelehnt.
- **Nicht geprüft / Verdacht:** Ich habe in `ipc.js:461-498` keinen Vergleich zwischen `prepared.id` und der Manifest-ID des entpackten Pakets gefunden (`installFromDirectory` wurde nur zu Beginn gelesen). Falls es keinen gibt, könnte ein Paket mit abweichender Modul-ID ein anderes Modul ersetzen. Bitte von Jarvis klären lassen, ich prüfe danach.
- Module sind nur per Hash gesichert, nicht signiert. Das ist auf DEV begrenzt, Stable liefert keine Modulupdates.

Empfehlung: `maxOutputLength: MAX_ENTRY_BYTES` setzen, `:` und reservierte Namen ablehnen, Modul-ID nach dem Entpacken gegen `prepared.id` prüfen.

### S-5 – Redirects und Downloadgröße (NIEDRIG, bestätigt)
- Core-Download prüft nach Redirect den Host (`service.js:320, 324`). Modul-Download tut das nicht (Zeilen 449-453). Die Host-Liste erlaubt zudem Loopback über HTTP in beiden Kanälen.
- Kein Größenlimit (siehe 3.2).
Empfehlung: Redirect-Prüfung für Module angleichen, Download an `Content-Length` und ein Maximum binden.

### S-6 – Zeitfenster zwischen Prüfung und Start (NIEDRIG, plausibel)
Hash, Signatur und Start laufen nacheinander auf einer Datei in einem vom Benutzer beschreibbaren Ordner (`service.js:391-417`, `main.js:133`). Ein Prozess mit Benutzerrechten kann die Datei theoretisch dazwischen tauschen. Für Stable relevant, sobald ein Zertifikat existiert. Gegenmaßnahme: Datei unmittelbar vor dem Start exklusiv öffnen oder in einen schreibgeschützten Ordner verschieben und erst dort prüfen und starten.

### S-7 – Sicherung wird nur auf Existenz geprüft (NIEDRIG, bestätigt)
`installPlan` prüft `fs.existsSync(backupPath)` (Zeile 398), nicht Größe oder Lesbarkeit. Eine leere oder beschädigte Sicherung würde die Sperre bestehen. Empfehlung: Größe und Integrität prüfen.

### S-8 – Gepackter Stable-Pfad auf Entwicklungsmaschine (INFORMATIV)
Im ungepackten Build akzeptiert der Code `ACADEMY_UPDATE_FEED` und `ACADEMY_PUBLISHER_THUMBPRINT` aus der Umgebung (`main.js:75-76, 87`). Das gilt nur für Entwicklungsläufe. Im gepackten Build sind beide fest aus. Kein Befund, nur der Hinweis, dass ein Entwicklungslauf kein Stable-Beleg ist.

## 5. Positive Nachweise (im Code gelesen)

- Kein Token und keine Zugangsdaten im Client.
- Feed-Server nur Loopback, nur GET, nur Dateien im Feedordner, Schlüssel nötig.
- DEV und Stable sind an drei Stellen getrennt (Feed-Auswahl, Download, Installationsplan).
- Hash wird zweimal geprüft (nach Download, vor Start). Abweichung löscht die Datei.
- Installer-Pfad aus validierter Version, mit Containment.
- Unterbrochene Downloads und Installationen werden beim Start erkannt (`reconcile`) und nicht als Erfolg gezeigt.
- Update braucht eine Aktion des Benutzers. Die Startprüfung lädt nicht automatisch.
- Datensicherung vor der Installation ist Pflicht.

## 6. Empfohlene Reihenfolge

1. **S-1** Versionsvergleich korrigieren (vor `dev.10`, vor breiterer Nutzung).
2. **S-2/S-3** Manifest signieren, Schlüssel nur an die feste Feed-Adresse senden.
3. **S-4** ZIP: Ausgabegrenze, Namensregeln, Modul-ID-Abgleich.
4. S-5 bis S-7 als Härtung.
5. **Stable bleibt gesperrt**, bis Herausgeberzertifikat, eingebetteter Thumbprint und ein Test mit echter Signatur vorliegen. Danach neue Prüfung durch mich.

## 7. Grenzen der Prüfung

- Statische Lesung. Außer dem `compare`-Aufruf (S-1) habe ich nichts ausgeführt. Keine Tests gestartet, keine Netzwerkversuche, keine Portscans.
- Nicht geprüft: `fromApp`-Absicherung im IPC, `store.backup`, Modul-Spezifikation und `readPackage`, Preload, CSP, `protocol.js`, NSIS-Installer-Skript, die tatsächliche ACL der Schlüsseldatei.
- Der Windows-Test (`WINDOWS-UPDATE-TEST-M.md`) und die Rohdaten wurden gelesen, aber nicht von mir wiederholt.
- GitHub-Zustand (leere Releases, 401 auf `desoworks.dev`) stammt aus dem Lead-Kontext und wurde von mir nicht neu abgefragt.
- Historische Prüfberichte (`SECURITY-PHASE-*.md`) ersetzen diese Prüfung nicht. Ich habe sie nicht als Beleg verwendet.
- Die Windows-Installation unter `C:\Program Files` (Version 0.3.0) kann den neuen Client nicht selbst nachziehen. Das ist funktional, nicht sicherheitsrelevant, und bleibt offen.
