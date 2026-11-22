# Sicherheitsprüfung vor Veröffentlichung und Update-Pipeline – Phase N

Prüfer: RoboCop, Security Officer
Datum: 22.11.2026
Projekt: DesoWorks Academy (`D:\Desoworks\Workspace\Academy`)
Remote: `https://github.com/DesoWorks/Academy.git` (laut Lead-Kontext)
Stand laut Lead: HEAD `49b089ace795e504d2147d35c82bfc9655240a9e`, main `2e704e3`. Von mir nicht selbst verifiziert, siehe Grenzen.
Art der Prüfung: lesend, statisch. Keine Änderung, keine Bereinigung, kein Commit, kein Push, keine Netzwerk- oder Angriffstests.
Dieser Bericht enthält keine Secret-Inhalte, nur Pfad, Art und Risiko.

## 1. Empfehlung zur Public-Schaltung

**STOPPEN.** Das Repository wird nicht öffentlich geschaltet.

Gründe:
1. **Die Git-Historie habe ich in diesem Lauf nicht selbst geprüft.** Der Zugriff auf `.git` ist für meine Dateiwerkzeuge gesperrt, eine Shell habe ich nicht. Rick hat Rohdaten geliefert (Abschnitt 7, von mir bewertet, nicht selbst ausgeführt). Sie sind günstig, belegen aber nicht, dass `dist/` oder `*.sqlite`/`*.exe` nie versioniert waren: die Namensprüfung deckte diese Endungen nicht ab. Eine Veröffentlichung macht die gesamte Historie sichtbar und ist praktisch nicht rücknehmbar.
2. Im Arbeitsbaum liegt ein vollständiges Benutzerdatenprofil (F-1). Es ist per `.gitignore` ausgeschlossen, aber ob das immer so war, ist unbelegt.
3. Es gibt keinen Beleg für eine Freigabe zur Sichtbarkeitsänderung (Lead-Kontext).
4. Die Update-Kette hat für DEV/BETA keinen Echtheitsanker. Stable bleibt gesperrt (Abschnitt 4).

Aufhebung der Empfehlung erst nach: (a) Historienprüfung (Rick führt `git log`/Secret-Scan aus, ich werte aus), (b) Bestätigung, dass `dist/` nie versioniert war, (c) Entscheidung zu F-2 und F-3, (d) ausdrücklicher Freigabe durch den Commander. Die Entscheidung liegt beim Commander.

## 2. Befundliste Arbeitsbaum

Bewertung nach operating-manual. „Bestätigt“ heißt: im Arbeitsbaum gesehen.

| ID | Stufe | Status | Pfad | Art | Risiko |
| --- | --- | --- | --- | --- | --- |
| F-1 | HOCH (bei Veröffentlichung des Ordners oder falls je versioniert) | bestätigt vorhanden, Versionierungsstatus unbekannt | `dist/phase-m-data-backup/before/` | Kompletter Electron-Benutzerdatenordner einer Testinstallation: `Network/Cookies`, `Local State`, `Preferences`, `Local Storage`, `Session Storage`, Caches, `academy.sqlite` (Lernstände), `modules.sqlite`, `backups/*.sqlite`, `updates/state.json` | Persönliche Lerndaten, Browserzustand, möglicherweise Schlüsselmaterial von Chromium (`Local State`). Ich habe die Inhalte nicht geöffnet. Per `.gitignore` (`dist/`) ausgeschlossen. Schutz hängt allein an dieser Regel und an der Historie. |
| F-2 | MITTEL | bestätigt | `dist/` (Installer 0.3.0, 0.3.1-dev.1, 0.3.1-dev.2, `win-unpacked`, `phase-m-fail.exe`, `latest.yml`, ZIP-Modul) | Build-Artefakte, unsigniert. `phase-m-fail.exe` ist ein absichtlich fehlerhafter Test-Installer. | Wären sie öffentlich, könnten sie als offizielle Pakete verwechselt werden. Ausgeschlossen durch `dist/`. Releases dürfen nur über die spätere Pipeline entstehen. |
| F-3 | NIEDRIG–MITTEL | bestätigt | `docs/operation-academy/UPDATE-SECURITY-M.md`, `SECURITY-PHASE-*.md` und weitere Berichte | Interne Sicherheitsberichte mit offenen Schwachstellen (Port-Squatting, ZIP-Extraktion u. a.), Ports, Dateipfaden und Schlüsselablageort | Würde Angreifern eine Anleitung liefern, solange Befunde offen sind. Entscheidung nötig: Berichte aus dem öffentlichen Repository nehmen oder erst nach Behebung veröffentlichen. |
| F-4 | NIEDRIG | bestätigt | `docs/operation-academy/PHASE-M.md` (Z. 34), `WINDOWS-UPDATE-TEST-M.md` (Z. 19), weitere Docs | Lokaler Windows-Benutzername im Pfad `C:\Users\<Benutzer>\AppData\…` | Personenbezug (Kontoname). Vor Veröffentlichung unkenntlich machen. |
| F-5 | NIEDRIG | bestätigt | `modules/it-systemintegration/web/js/lf8-kontrolle.js`, `lf8-reflexion.js`, `lf9-kontrolle.js`, `lf9-zukunft.js` | Vorname einer Person („…bis Dennis es ausdrücklich freigibt“) in ausgelieferten Lerninhalten, dazu interne Freigabelogik | Personenbezug in einem öffentlichen Paket und Offenlegung interner Abläufe. Neutral formulieren, Entscheidung beim Commander. |
| F-6 | NIEDRIG | bestätigt | `docs/operation-academy/*.md`, `scripts/package-it-module.js`, weitere | Treffer auf `D:\Desoworks` (interne Verzeichnisstruktur) | Offenlegung der lokalen Struktur. Kein Zugang. |
| F-7 | INFORMATIV | nicht geprüft | `docs/operation-academy/*.png` | Fensterscreenshots | Ich habe die Bilder nicht auf Personendaten gesichtet. Vor Veröffentlichung kurz prüfen lassen. |
| F-8 | INFORMATIV | bestätigt | `.gitignore` | Deckt `node_modules/`, `dist/`, `out/`, `*.log`, `test-results/`, `_secure/`, `.env`, `.env.*` (außer `.env.example`), `*.asar`, `coverage/`. Es fehlen Muster für `*.pem`, `*.pfx`, `*.p12`, `*.key`, `*.sqlite`, `*.db`, `.npmrc`. | Härtung: Schlüssel- und Zertifikatsendungen aufnehmen, bevor ein Zertifikat oder ein Ed25519-Schlüssel entsteht. Das ist die wahrscheinlichste künftige Fehlerquelle. |

### Gegenprobe, ohne Befund
- Mustersuche (GitHub-/Cloud-/Slack-Token-Präfixe, `BEGIN … PRIVATE KEY`, `password=`, `secret=`, `api_key=`, `token=`, `Bearer …`) im nicht ignorierten Arbeitsbaum: **0 Treffer**.
- Dateinamensuche nach `.env`, `.pem`, `.pfx`, `.p12`, `.key`, `.crt`, `.cer`, `.sqlite`, `.db`, `.bak`, `.zip`, `.exe`, `.npmrc`, `credentials`, `id_rsa` im nicht ignorierten Baum: **0 Treffer**.
- `src/` liest nur diese Umgebungsvariablen: `ACADEMY_LAB`, `ACADEMY_LAB_OUT`, `ACADEMY_UPDATE_FEED`, `ACADEMY_PUBLISHER_THUMBPRINT`, `ACADEMY_SMOKE`, `ACADEMY_HEADLESS`, `LOCALAPPDATA`, `SystemRoot`. Kein Token, kein Authorization-Header im Client.
- `package.json`: `private: true`, keine Publish-Konfiguration, keine eingebetteten Zugangsdaten. `channel.json` steht auf `dev`. `build/build-info.json` ist leer.
- `package-lock.json` vorhanden (Abhängigkeiten reproduzierbar). Eine Schwachstellenprüfung der Abhängigkeiten (Electron 45.4.1, electron-builder 26.18.0) habe ich nicht durchgeführt.
- Treffer auf IP-Adressen (`192.168.x.x`, `10.x`) betreffen nur fiktive Lernbeispiele im Modul, nicht echte Infrastruktur.
- Hinweis: Die Mustersuche folgt `.gitignore`. Der Inhalt von `dist/` wurde damit **nicht** auf Secret-Muster durchsucht (F-1).

## 3. Änderungsstand seit Phase M (aus dem Code gelesen)

- **S-1 (Prerelease-Vergleich) scheint behoben.** `src/updates/semver.js` enthält jetzt `comparePrerelease` mit numerischem Segmentvergleich (Zeilen 22-43). Die Dateien `tests/phase-m-semver-fix.test.js` und `phase-m-qa-semver.test.js` existieren. **Ich habe die Tests nicht ausgeführt** und `dev.2` gegen `dev.10` nicht neu nachgestellt. Status: gelesen, nicht nachgeprüft. Nachprüfung steht aus.
- `repositoryPinned` (`feed.js:54-76`) unverändert: GitHub-Pfade korrekt auf `DesoWorks/Academy` gepinnt, aber `127.0.0.1`/`localhost` (jeder Port) gelten als gepinnt (Z. 66) und `extraHosts` ebenfalls (Z. 68). Damit offen: S-2/S-3 aus Phase M.
- Aus Phase M weiter offen, nicht erneut geprüft: S-2 (Port-Squatting, Schlüssel geht an jede Loopback-Adresse), S-4 (ZIP: keine Ausgabegrenze beim Entpacken, NTFS-Streams/reservierte Namen, Modul-ID-Abgleich ungeklärt), S-5 (Redirect-Prüfung Module, kein Downloadlimit), S-6 (Prüf-/Startfenster), S-7 (Sicherung nur auf Existenz geprüft).

## 4. Bewertung der geplanten Trennung DEV / BETA / STABLE und des Updewegs

Stand: Der Code kennt heute die Kanäle DEV und Stable (`channel.json`). **BETA ist im Code nicht vorhanden.** Die Bewertung zu BETA ist daher eine Anforderung, kein Befund.

### 4.1 Trennung
- Heute vorhanden und in Phase M nachvollzogen: Kanal kommt im gepackten Build aus `channel.json`, nicht aus der Umgebung. Stable filtert Prereleases, DEV lädt keine Stable-Versionen, Module nur auf DEV. Das ist solide.
- **Anforderung für BETA:** Eigenes Feed-Ziel, eigener Kanalwert in `channel.json`, eigene Prerelease-Kennung (`-beta.N`). BETA darf nicht aus DEV-Prereleases (`-dev.N`) auswählen und umgekehrt. `-dev.N` und `-beta.N` dürfen nicht über den Namen verwechselt werden: der Vergleich `beta` < `dev` als Zeichenkette ist kein Kanalschutz, die Kanalprüfung muss die Kennung ausdrücklich verlangen.
- **Kanalwechsel nur in eine Richtung ohne Zusatzaktion:** Stable → BETA → DEV ist eine Herabstufung der Vertrauensstufe. Der Wechsel muss ausdrücklich vom Benutzer ausgelöst werden und anzeigen, dass unsignierte oder weniger geprüfte Builds folgen. Eine Rückkehr zu Stable darf keinen Downgrade auf eine ältere Stable-Version auslösen.
- Kein Manifest darf den Kanal des Clients umstellen. Der Client entscheidet, welchen Kanal er liest.

### 4.2 HTTPS
- GitHub-Hosts sind per HTTPS gepinnt. Für Loopback ist HTTP erlaubt und gewollt (nur DEV-Test). **Auflage:** Im gepackten Release-Build darf kein HTTP-Ziel außer dem festen Loopback-Feed erlaubt sein. Die Hostliste (`isLoopbackUrl`, `extraHosts`) muss für BETA und Stable abgeschaltet sein. TLS-Prüfung nicht deaktivieren, kein Zertifikats-Override.

### 4.3 Repository-Pinning
- Korrekt für `github.com` und `api.github.com`. **Auflage:** Das Pinning muss vor GitHub-Redirects (Weiterleitung auf `objects.githubusercontent.com`) eine definierte Ausnahme erhalten, ohne einen offenen Host-Allowlist-Eintrag. Redirect-Ziele sind zu prüfen und auf bekannte GitHub-Asset-Hosts zu beschränken. Das ist nicht erprobt, weil die Releases leer sind.
- Der Besitzer des Repositories ist der Vertrauensanker bei Pinning allein. Ein kompromittierter GitHub-Account oder Maintainer-Token liefert passende Manifeste. Darum reicht Pinning nicht (siehe 4.5).
- Das Repository sollte nach Veröffentlichung: Zwei-Faktor für alle Maintainer, Branch-Schutz für `main`, geschützte Tags (`v*`), Release-Erstellung nur durch einen Workflow oder wenige Personen, keine Personal Access Tokens mit `repo`-Rechten in Workflows, Actions nur mit minimalen `permissions`.

### 4.4 SHA-256
- Prüfung gegen `.sha256`-Asset, doppelt (nach Download und vor Start), Datei wird bei Abweichung gelöscht. Gut.
- **Grenze:** Hash und Datei stammen aus derselben Quelle. Der Hash ist **kein Herkunftsnachweis**. Ohne Signatur schützt er nur vor Übertragungsfehlern und teilweiser Manipulation, nicht vor einem Angreifer, der das Release-Verzeichnis kontrolliert.
- Der Hash gehört zusätzlich in ein **signiertes** Manifest, damit Datei und Hash nicht getrennt austauschbar sind.

### 4.5 Signatur
- **Stable:** Authenticode mit festem Thumbprint ist im Code vorbereitet. Es fehlt das Herausgeberzertifikat. Stable bleibt blockiert (Beleg: `publisherThumbprint` im gepackten Build leer, Phase-M-Bericht und `main.js:87`). Ein Stable-Release ist nur nach neuer Prüfung zulässig.
- **BETA und DEV:** Es gibt keinen Echtheitsanker. Empfohlen: Ed25519-Signatur über das Manifest, öffentlicher Schlüssel im Client, privater Schlüssel offline und **nicht** im Repository und **nicht** als GitHub-Secret mit Schreibrechten für Dritte. Das Manifest enthält Version, Kanal, Dateiname, Größe, SHA-256 und Mindestversion. Ohne gültige Signatur lehnt der Client das Manifest ab.
- Signierschlüssel nie in den Arbeitsbaum legen. `.gitignore` entsprechend erweitern (F-8).
- Schlüsselrotation und Widerruf planen: Der Client muss einen zweiten, vorab hinterlegten Schlüssel akzeptieren können, sonst ist der Verlust des Schlüssels ein Totalausfall.

### 4.6 Downgrade und Replay
- Doppelte Prüfung `compare(neu, installiert) > 0` in `feed.js` und `service.js`. Die Wirksamkeit hängt am Versionsvergleich (S-1, siehe oben, wirkt behoben, nicht nachgeprüft).
- **Anforderung:** Das signierte Manifest enthält einen Zeitstempel oder eine laufende Manifest-Nummer und eine Ablaufzeit. Der Client merkt sich die höchste gesehene Nummer pro Kanal und lehnt ältere Manifeste ab (Schutz gegen Zurückspielen eines alten, verwundbaren Manifests, auch wenn dessen Signatur gültig ist). Ohne das ist ein Rollback-Angriff mit gültiger Signatur möglich.
- Kanalspezifische Mindestversion im Manifest, damit bekannt verwundbare Builds nicht mehr angeboten werden.

### 4.7 Manipulierte Manifeste und Pakete
- Manifestfelder werden validiert (`isSafeVersion`, `safeAssetName`, Containment-Prüfung). Gut.
- Offen: ZIP-Entpacken ohne Ausgabegrenze (S-4), Größenangabe nicht gegen tatsächliche Bytes geprüft, kein Download-Maximum (S-5).
- Pakete in einem vom Benutzer beschreibbaren Ordner zwischen Prüfung und Start (S-6).
- GitHub-Releases sollten **unveränderlich** sein (Immutable Releases aktivieren, sofern verfügbar), damit ein Asset nachträglich nicht ausgetauscht werden kann.

### 4.8 Authentifizierung gegenüber GitHub
- Der Client trägt kein Token (bestätigt, keine `Authorization`-Treffer in `src/`). Solange das Repository privat ist, bekommt der Client für Releases ein 401/404. Nach Veröffentlichung entfällt die Anmeldung, **und der Update-Weg wird öffentlich lesbar**. Kein Token darf je in den Client oder in die Installer kommen. Private Releases mit Client-Token sind keine Option.
- Rate-Limit der unauthentifizierten GitHub-API (60 Anfragen pro Stunde je IP) ist eine Verfügbarkeitsfrage: Der Client muss Fehler und Limit sauber behandeln und darf nicht in eine Schleife laufen. Nicht geprüft.

### 4.9 CI und Build-Kette (geplant, nicht vorhanden)
Im Arbeitsbaum existiert kein `.github/`-Ordner und keine Pipeline. Für die GitHub-Release-Pipeline gilt:
- Workflow-Berechtigungen minimal (`contents: write` nur im Release-Job), keine `pull_request_target`-Ausführung fremden Codes mit Secrets, Actions auf Commit-SHA pinnen.
- Release nur aus geschützten Tags auf `main`. Keine Signaturschlüssel in GitHub-Secrets, die Forks oder Pull Requests erreichen.
- Reproduzierbarkeit: `npm ci` mit `package-lock.json`, keine Build-Skripte, die aus dem Netz nachladen.

## 5. Empfohlene Maßnahmen (Reihenfolge)

1. **Rick:** `git log --all`, `git rev-list --objects --all` und einen Secret-Scan über die Historie ausführen und mir die Ausgabe geben. Zusätzlich prüfen, ob je Pfade unter `dist/` oder `*.sqlite` versioniert waren. Ich werte aus.
2. **Commander:** Entscheidung zu F-3 (interne Berichte), F-5 (Vorname und Freigabelogik in Lerninhalten), F-4/F-6 (Pfade bereinigen). Änderungen führt Jarvis nach Auftrag aus, nicht ich.
3. `.gitignore` ergänzen (F-8), bevor irgendein Schlüssel entsteht.
4. `dist/phase-m-data-backup/` außerhalb des Projektordners ablegen oder löschen, nach Entscheidung des Commanders (ich lösche nichts).
5. Manifest-Signatur (Ed25519) mit Nummer, Ablauf, Kanal und Hash; Client nimmt nur signierte Manifeste an; Rollback-Zähler pro Kanal.
6. Phase-M-Befunde S-2 bis S-7 schließen und von mir nachprüfen lassen (S-1 nachprüfen).
7. BETA als eigener Kanal mit eigener Kennung und eigener Prüfung anlegen. Release-Hosts im gepackten Build ohne Loopback.
8. Repository-Härtung: Branch-/Tag-Schutz, 2FA, Immutable Releases, minimale Actions-Rechte.
9. Stable bleibt gesperrt bis Zertifikat, eingebetteter Thumbprint, Test mit echter Signatur und neue Prüfung.

## 6. Grenzen der Prüfung

- **Git-Historie in diesem Lauf nicht von mir geprüft.** Zugriff auf `.git` ist für meine Werkzeuge gesperrt, eine Shell habe ich nicht. Nicht geprüft: Commits, Branches, Tags, Reflog, gelöschte Dateien, Autor-E-Mails, Remote-Konfiguration, ob `dist/` je getrackt war. Eine Aussage „sauber“ gebe ich dafür nicht ab.
- Branch, HEAD und Arbeitsbaumstatus habe ich nicht selbst festgestellt. Die genannten Commit-Hashes stammen aus dem Lead-Kontext.
- Unversioniert vs. versioniert kann ich im Arbeitsbaum nicht unterscheiden. Die Mustersuche folgt `.gitignore` und hat `dist/` ausgelassen. Der Inhalt von `dist/` (Cookies, SQLite, Caches, Installer, `app.asar`) wurde **nicht** geöffnet oder durchsucht.
- Binärdateien (PNG, EXE, ASAR, SQLite) nicht inhaltlich geprüft.
- Mustersuche ist regelbasiert. Unbekannte Geheimnisformate, kodierte Werte oder Klartextpasswörter ohne Schlüsselwort fängt sie nicht.
- Abhängigkeiten nicht auf bekannte Schwachstellen geprüft (kein `npm audit`, kein Netzzugriff).
- Code der Update-Kette habe ich in diesem Lauf nur an `semver.js` vollständig und an `feed.js` Z. 40-89 sowie per Suche gelesen. Aussagen zu `service.js`, `ipc.js`, `zip.js`, `signature.js` und den Skripten beruhen auf dem Phase-M-Bericht, nicht auf neuer Lesung. Seit Phase M können sich Dateien geändert haben (HEAD wechselte von `7876297…` auf `49b089a…`).
- Keine Tests ausgeführt, keine Portscans, keine Netzwerkzugriffe, keine Prüfung der GitHub-Einstellungen (Berechtigungen, Branch-Schutz, Secrets, Actions), weil kein Zugriff und kein Auftrag dafür bestand.
- BETA existiert noch nicht im Code. Die Aussagen dazu sind Anforderungen.
- Historische Berichte ersetzen diese Prüfung nicht und wurden nicht als Beleg gewertet.
- Die endgültige Entscheidung liegt beim Commander.

## 7. Von Rick gesammelte Befunde (Historie und GitHub), von mir bewertet

**Herkunft:** Diese Daten hat Rick erhoben und mir nachgereicht. Ich habe keinen dieser Befehle selbst ausgeführt und die Ausgaben nicht unabhängig reproduziert. Ich werte sie als Aussage von Rick, nicht als eigenen Nachweis. Es wurden keine Secret-Werte übermittelt.

### 7.1 Gemeldete Rohdaten (Stand 22.11.2026)
- Aktueller Branch `feature/phase-n-continuous-delivery`, HEAD `49b089ace795e504d2147d35c82bfc9655240a9e`.
- `git rev-list --all --count`: 15 Commits.
- Autor aller Commits: eine einzige Kennung (Pseudonym `theMisteryDE` mit E-Mail-Adresse einer privaten Domain).
- Lokale Branches: `feature/phase-j-it-module`, `-k-stability-trust`, `-l-module-experience`, `-m-live-update`, `-n-continuous-delivery`, `main`. Auf `origin` nur `main` und `feature/phase-j-it-module`. Phase K, L, M und N liegen nicht auf origin. (Rick nennt für K keine Aussage; K ist lokal vorhanden, auf origin nicht aufgeführt.) `dev` und `beta` existieren nicht.
- Historiensuche (`git log --all --name-only -G`) auf die Muster `ghp_`, `github_pat_`, `AKIA`, `BEGIN PRIVATE KEY`, `BEGIN OPENSSH PRIVATE KEY`, `BEGIN RSA PRIVATE KEY`, `xox[baprs]-`, `sk_live_`, `sk-ant-`: keine Treffer.
- `git ls-files` mit Namensfilter `env/key/pem/p12/pfx/secret/credential/token/id_rsa/passwd`: einziger Treffer `src/renderer/design-tokens.css` (Namensfehltreffer auf „token“, keine Schlüsseldatei; passt zu meinem Arbeitsbaumbefund).
- `git ls-files .github`: leer. Keine GitHub-Actions-Workflows (deckt sich mit meiner Beobachtung, kein `.github/` im Baum).
- GitHub-Connector: angemeldet als `DesoWorks`, Typ **User**, nicht Organisation. Repository `DesoWorks/Academy` existiert, **Sichtbarkeit privat**, Berechtigung admin und push. Gelesener Remote-HEAD `2e704e3`, `pushed_at` 2026-11-21T21:28:13Z. Sichtbarkeit wurde nicht geändert.
- Eine API-Antwort enthielt einen kurzlebigen Download-Link mit eingebettetem Token. Es war eine API-Antwort, keine Datei im Baum. Das Token steht nicht in diesem Bericht und ist nicht als Repository-Secret zu werten.

### 7.2 Bewertung

| ID | Stufe | Einordnung |
| --- | --- | --- |
| H-1 | INFORMATIV (positiv) | Keine Treffer auf neun typische Token- und Schlüsselmuster in 15 Commits über alle lokalen Branches. Das bestätigt, was ich im Arbeitsbaum fand (0 Treffer). Die Musterliste ist eng: generische Zuweisungen (`password=`, `secret=`, `api_key=`), Azure-/Google-/Stripe-Test-Schlüssel, `.npmrc`-Auth und Base64-kodierte Werte sind nicht abgedeckt. Es ist ein Beleg gegen die häufigsten Fälle, kein Freispruch. |
| H-2 | HOCH (Prüflücke, kein Fund) | **`dist/`, `*.sqlite`, `*.exe`, Cookies und `Local State` wurden in der Historie nicht gesucht.** Der Namensfilter lief über `git ls-files` (nur aktueller Stand), die Inhaltssuche über Muster. Ob F-1 (Benutzerdatenprofil) oder Installer je in einem Commit lagen, ist damit nicht belegt. Nachforderung an Rick: `git log --all --diff-filter=A --name-only --format= -- dist "*.sqlite" "*.db" "*.exe" "*.asar" "*.pfx" "*.pem" "*.key"` und `git count-objects -vH`. Erst dann kann F-1 für die Historie abgeschlossen werden. Der Blob-Bestand ist mit 15 Commits überschaubar. |
| H-3 | NIEDRIG–MITTEL | **Autorenkennung in allen 15 Commits** (Pseudonym plus E-Mail-Adresse einer privaten Domain). Das ist Personenbezug und bei Veröffentlichung dauerhaft lesbar, auch für die Mail-Adresse. Es ist kein Secret und kein Verstoß. Es ist eine Entscheidung des Commanders, ob diese Kennung öffentlich sein soll. Möglichkeit: GitHub-`noreply`-Adresse für künftige Commits. Eine Umschreibung der Historie ist nicht Teil dieses Auftrags und nur nach Freigabe sinnvoll, solange das Repository privat und kaum verbreitet ist. Zusätzlich: Die Kennung unterscheidet sich vom GitHub-Konto `DesoWorks`. Das ist kein Mangel, sollte aber bewusst sein, damit Beitragende und Herausgeber nicht verwechselt werden. |
| H-4 | MITTEL (für Release-Governance) | **Der Repository-Eigentümer ist ein persönliches Konto (User), keine Organisation.** Es gibt keinen zweiten Menschen mit eigenen Rechten, keine Teams, kein Vier-Augen-Prinzip für Releases und keine organisationsweite Durchsetzung von 2FA, Secret Scanning oder Push Protection. Ein einzelnes kompromittiertes Konto oder Token reicht, um Release, Tag und Assets zu ersetzen. Das ist für die Update-Kette zentral, weil das Repository-Pinning das Konto als Vertrauensanker nimmt (siehe 4.3). Empfehlung: 2FA mit Hardware-Schlüssel oder Passkey, Branch- und Tag-Schutz, Immutable Releases, Signaturschlüssel getrennt vom Konto (4.5). Prüfen, ob eine Organisation sinnvoll ist, bevor Dritte Schreibrechte erhalten. Ich habe die tatsächlichen Kontoeinstellungen nicht geprüft. |
| H-5 | INFORMATIV | Es existiert kein Workflow. Eine CI-Pipeline muss erst entstehen. Damit gibt es heute keine Workflow-Angriffsfläche, aber auch keinen reproduzierbaren Build auf GitHub. Beim Anlegen gelten die Vorgaben aus 4.9. |
| H-6 | MITTEL (Veröffentlichungsumfang) | Auf origin liegen nur `main` (2e704e3) und `feature/phase-j-it-module`. **Phase K bis N sind nicht auf origin.** Eine Sichtbarkeitsänderung würde heute nur diesen Teilstand offenlegen. Ein späterer Push der Phasen K bis N (inklusive F-3 interne Berichte und F-1, falls je versioniert) ist ein eigener Veröffentlichungsschritt, der vor dem Push geprüft werden muss. Nach dem Push von Branches in ein öffentliches Repository sind sie nicht mehr zurückholbar. |
| H-7 | NIEDRIG | **Kurzlebiges Token in einer API-Antwort (Downloadlink).** Zustimmung zu Ricks Einordnung: kein Repository-Secret, keine Datei im Baum. Hygiene: solche URLs nicht in Berichte, Logs, Notizen, Gedächtnisdateien oder Commit-Texte übernehmen und nicht an Dritte weitergeben. Das Token ist kurzlebig, aber ein Link in einem Log wäre innerhalb seiner Gültigkeit nutzbar. Ich habe den Link nicht gesehen. |
| H-8 | INFORMATIV | Die Zahl 15 Commits bezieht sich auf `--all`. Zwischen Rick-Angabe (`main` = `2e704e3` auf origin) und lokalem Stand `49b089a` liegen die Phasen K bis N. Das passt zu „Feature-Stand nicht gepusht“. |

### 7.3 Folgen für die Empfehlung
- **Public-Empfehlung bleibt STOPPEN.** Die Rohdaten entlasten (keine Token-/Schlüsselmuster, keine Schlüsseldatei im aktuellen Stand, privates Repository, nichts veröffentlicht), schließen aber H-2 nicht, und F-3 bis F-6 sowie die offenen Update-Befunde bestehen weiter.
- Ein Wechsel zu „freigeben durch den Commander“ ist vertretbar, wenn: H-2 sauber beantwortet ist, F-1 weiter nur lokal liegt und nicht in der Historie, der Commander über F-3, F-5 und H-3 entschieden hat, nur der heutige origin-Stand (nicht K bis N) betroffen ist oder K bis N vorab von mir geprüft wurden.
- Alles hier ist keine Historienbereinigung. Ich empfehle keine Umschreibung ohne ausdrücklichen Auftrag.

### 7.4 Erweiterte Grenzen
- Die Historienangaben und die GitHub-Angaben stammen von Rick. Ich habe sie nicht nachgemessen.
- Die GitHub-Kontoeinstellungen (2FA, Branch-Schutz, Secret Scanning, Deploy-Keys, Webhooks, Collaborators) habe ich nicht gesehen.
- Die Muster der Historiensuche waren eng (siehe H-1). Auf `*.sqlite`, `dist/` und `.exe` in der Historie wurde nicht gesucht (H-2).


## 8. Nachtrag 22.11.2026: Antwort auf die Nachforderung H-2 und Abnahmekriterien

**Herkunft:** Die folgenden Daten stammen von Rick. Ich habe keinen der Befehle selbst ausgeführt und die Ausgaben nicht reproduziert. Kein Eintrag der Abschnitte 1 bis 7 wurde gelöscht oder geändert. Die Empfehlung bleibt: **Public STOPPEN.**

### 8.1 H-2 (Rick-Befund, geschlossen für Installer und Datenbanken)
Rick meldet nach meiner Nachforderung:
- `git ls-files` auf `exe`, `sqlite`, `asar`, `pem`, `pfx`, `p12`, `key`, `env` und `dist/*`: keine Datei.
- `git log --all --diff-filter=A --name-only`: keine dieser Endungen und kein `dist/` in der Historie.
- `git count-objects`: 507 lose Objekte, 1 Pack, kein Garbage.

Bewertung (auf Grundlage von Ricks Angaben): H-2 gilt für Installer, Datenbanken, Schlüssel- und Zertifikatsendungen als **geschlossen, als Rick-Befund markiert**. F-1 (Benutzerdatenprofil in `dist/`) war danach nie versioniert, F-2 (Installer) ebenfalls nicht. Grenzen: Die Prüfung beruht auf Dateinamen und Endungen. Cookies und `Local State` haben keine eigene Endung und liegen unter `dist/`, das ebenfalls leer gemeldet ist. Binärinhalte wurden nicht gescannt. Das Pack wurde nicht auf nicht erreichbare Objekte untersucht, die Objektzahl allein belegt keine Sauberkeit, passt aber zu einer kleinen Historie.

### 8.2 Gründe für STOPPEN, die weiter bestehen
1. **Personenbezüge in den Berichten** (F-4, F-5, F-6, H-3: Windows-Benutzername, Vorname in Lerninhalten, Autorenkennung mit E-Mail-Adresse).
2. **Persönliches User-Konto** als Eigentümer (H-4): kein Vier-Augen-Prinzip, kein Organisationsschutz.
3. **Interne Dokumente** (F-3, F-6): Sicherheitsberichte mit offenen Schwachstellen und lokaler Struktur.
4. **Fehlendes Zertifikat** (4.5): Stable ohne Echtheitsanker, DEV/BETA ohne signiertes Manifest.
5. Fehlende ausdrückliche Freigabe des Commanders. Phase K bis N sind nicht auf origin (H-6).

Ich bereinige nichts und schreibe keine Historie um. Entscheidungen zu den Punkten 1 bis 3 liegen beim Commander, Änderungen führt Jarvis nach Auftrag aus.

### 8.3 Abnahmekriterien für die laufende Implementierung
Jedes Kriterium ist mit Beleg nachzuweisen. Ich prüfe nach Fertigmeldung unabhängig nach. Bis dahin gilt keines als erfüllt.

**A-1 Kein Token im Quelltext**
- Mustersuche über Arbeitsbaum, `.github/` und neue Commits (Präfixe `ghp_`, `github_pat_`, `gho_`, `ghs_`, `AKIA`, `xox`, `sk_live_`, `sk-ant-`, `BEGIN … PRIVATE KEY`, `Authorization`, `Bearer`): 0 Treffer.
- `src/` enthält keinen `Authorization`-Header, keine Token-Variable, keine Zugangsdaten. Neue Umgebungsvariablen nur ohne Geheimnisse und im Bericht aufgelistet.
- Gepackter Build (`app.asar`) enthält nach Entpacken keinen Treffer des gleichen Musters.
- `.gitignore` enthält `*.pem`, `*.pfx`, `*.p12`, `*.key`, `*.sqlite`, `*.db`, `.npmrc` (F-8). Der private Signaturschlüssel liegt nicht im Repository.

**A-2 Kein Abruf von GitHub „Latest“**
- Kein Zugriff auf `/releases/latest`, `releases/latest/download` oder die Auswahl „neuestes Release“ in Client, Skripten und Workflows (Mustersuche `latest` auf URLs und API-Pfade: 0 Treffer, `latest.yml` aus dem alten Builder-Weg ausgenommen, wenn nicht ausgewertet).
- Der Client holt pro Kanal ein festes, kanalbezogenes Manifest (Tag oder Feed je Kanal) und wählt die Version selbst nach SemVer und Kanal.
- Test: ein Feed, der unter „latest“ eine Version eines anderen Kanals liefert, hat keinen Einfluss.

**A-3 Kanalfremde Pakete werden abgelehnt**
- Manifest und Paket tragen die Kanalkennung. Der Client lehnt ab: Stable-Client mit `-dev.N` oder `-beta.N`, BETA-Client mit `-dev.N` und Stable, DEV-Client mit `-beta.N`, falsches Kanalfeld im Manifest, Kanalname nur im Dateinamen.
- Der Kanal kommt aus dem gepackten Build (`channel.json`) oder der ausdrücklichen Benutzerauswahl, nie aus dem Manifest.
- Ablehnungen sind getestet (negative Tests je Kanalpaar) und protokolliert, ohne Pfade mit Benutzernamen.
- Kanalwechsel zu geringerer Vertrauensstufe nur durch ausdrückliche Benutzeraktion mit Warnung. Rückkehr zu Stable löst kein Downgrade aus.

**A-4 Workflows schreiben keine Secrets**
- Keine Ausgabe von Secrets in Logs, Artefakten, Release-Notes, Manifesten, Caches (`echo`, `set -x`, `env`-Dumps, `::debug::` geprüft). Kein Secret wird in Dateien geschrieben, die als Artefakt oder Release-Asset hochgeladen werden.
- `permissions:` auf Workflow-Ebene `contents: read`, `contents: write` nur im Release-Job. Kein `pull_request_target` mit Checkout fremden Codes. Kein Secret für Fork-Pull-Requests.
- Actions auf Commit-SHA gepinnt. `npm ci` mit `package-lock.json`, keine Nachlade-Skripte aus dem Netz.
- Der Ed25519-Signaturschlüssel liegt nicht als GitHub-Secret mit Zugriff durch normale Branches. Falls für Automatik nötig, nur an eine geschützte Umgebung mit Genehmigung gebunden.

**A-5 STABLE startet nicht durch einen Push**
- Der Stable-Workflow reagiert nicht auf `push` auf Branches (auch nicht `main`). Auslöser nur: ein geschütztes Tag `v*` ohne Prerelease-Anteil oder ein manueller `workflow_dispatch` mit Genehmigung einer geschützten Umgebung (`environment` mit Reviewer).
- Tag-Schutzregel für `v*` aktiv, Release-Erstellung nur durch den Workflow oder berechtigte Person. DEV und BETA werden über eigene Auslöser (`-dev.N`, `-beta.N` Tags) gestartet und können nie ein Stable-Release erzeugen.
- Stable-Build bricht ab, solange `publisherThumbprint` leer ist oder die Authenticode-Prüfung fehlschlägt.
- Test: ein Push auf `main` und ein `-dev`-Tag starten keinen Stable-Job (Workflow-Datei und Trockenlauf belegen das).

**A-6 Ergänzend (aus Abschnitt 4, nicht gestrichen)**
- Signiertes Manifest mit Kanal, Nummer, Ablauf, Größe, SHA-256. Rollback-Zähler je Kanal.
- Gepackter Release-Build ohne Loopback- oder `extraHosts`-Ausnahme für BETA und Stable. GitHub-Redirects nur zu festen Asset-Hosts.
- Phase-M-Befunde S-2 bis S-7 behoben, S-1 durch eigenen Testlauf bestätigt.
- Der Commit, der Pipeline und Client zusammenführt, geht zur Nachprüfung an mich, bevor ein Push von Phase K bis N oder eine Sichtbarkeitsänderung erwogen wird.

### 8.4 Grenzen des Nachtrags
- Alle Daten aus 8.1 stammen von Rick, nicht von meiner eigenen git-Ausführung.
- Ich habe in diesem Nachtrag keine Dateien außer diesem Bericht geschrieben und keinen Code geändert, nichts committet oder gepusht.
- Die Kriterien sind Anforderungen. Es gibt noch keine Pipeline und keinen BETA-Kanal im Code. Erfüllung ist offen.
- Die Entscheidung über eine Veröffentlichung liegt beim Commander.
