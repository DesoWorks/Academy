# Sicherheitsprüfung CI- und Release-Kette – Operation Academy N.1 / Welle 3

Prüfer: RoboCop, Security Officer
Datum: 22.11.2026
Projekt: DesoWorks Academy
Branch: `feature/phase-n1-release-connectivity`, HEAD `70dfe52`. `origin/dev` steht ebenfalls auf `70dfe52`, `main` auf `2e704e3`. Arbeitsbaum: nur `build/build-info.json` geändert.
Art: lesend, statisch. Kein Commit, kein Push, keine Änderung außer diesem Bericht. Kein Schlüssel- oder Tokenwert wurde gelesen oder wird hier genannt. Es stehen keine Namen, E-Mail-Adressen oder lokalen Benutzerpfade in diesem Bericht.

## 1. Ergebnis

**Offen: 0 KRITISCH, 0 HOCH.** Aus Sicherheitssicht blockiert damit nichts die DEV-Veröffentlichung. Für STABLE ist die Lage ausdrücklich eine andere (siehe M-6). Die Freigabe liegt beim Commander.

| Stufe | Offen | IDs |
| --- | --- | --- |
| KRITISCH | 0 | – |
| HOCH | 0 | – |
| MITTEL | 5 | M-2, M-3, M-4, M-5 (neu), M-6 (neu) |
| NIEDRIG | 7 | M-1 (herabgestuft), N-1, N-2, N-3, N-6, N-7, N-8 (neu) |
| INFORMATIV | 3 | I-1, I-2, I-3 |

## 2. Gelesen

Ich habe diese Stellen selbst gelesen (Zeilenangaben aus dem heutigen Stand):

- `.github/workflows/academy-dev.yml`, `academy-beta.yml`, `academy-stable.yml` vollständig. Alle drei sind versioniert.
- `scripts/make-release-manifest.js` vollständig, `src/updates/manifest-sign.js` vollständig, `src/updates/github-feed.js` vollständig.
- `src/updates/service.js`: Zeilen 196-225, 355-394, 498-647 sowie Suchtreffer zu Hash, Größe und Modulpfad.
- `.gitignore`, `UPDATE-SECURITY-N1-W2-NACHPRUEFUNG.md`.
- Git: Branches, Remote, Historie (21 Commits) mit gezielten Inhaltssuchen.

## 3. Geschlossen (mit Beleg)

- **pull_request erreicht den Publish-Job nicht.** Keiner der drei Workflows hat einen Trigger `pull_request` oder `pull_request_target`. DEV läuft nur auf `push` nach `dev` (Zeilen 6-8) und prüft zusätzlich `github.ref == 'refs/heads/dev'` in allen drei Jobs. BETA und STABLE laufen nur per `workflow_dispatch`. Fork-PRs bekommen keine Secrets und kein Schreibrecht.
- **Rechte nach dem Prinzip der geringsten Berechtigung.** Oberste Ebene `contents: read`. Nur der Job `publish` hat `contents: write`. Nur der Job `build` bekommt das Signaturgeheimnis. Alle Checkouts mit `persist-credentials: false`. Kein persönliches Token, nur `github.token`.
- **Kein unsigniertes Manifest.** Das Skript bricht ohne `ACADEMY_MANIFEST_SIGNING_KEY` ab (Zeile 37-38), ebenso der Workflowschritt (DEV Zeile 74-77, BETA Zeile 82-85). Zusätzlich prüft ein eigener Schritt die Signatur mit `verifyManifest` gegen den versionierten öffentlichen Schlüssel. Das Geheimnis wird nirgends ausgegeben. Die Ausgabe des Skripts nennt nur Dateiname und Hash.
- **Private Schlüsseldatei:** liegt unter `keys/`, ist ignoriert (`.gitignore:27`, belegt mit `git check-ignore`) und nicht versioniert (`git ls-files --error-unmatch` meldet unbekannt). In keinem Commit steht Schlüsselmaterial: die Textsuche nach `PRIVATE KEY` trifft nur drei Commits, und dort sucht die Mustersuche nach einem echten Ed25519-Schlüsselkörper ohne Treffer. Die Treffer sind Dokumenten- und Testtext. Die Datei selbst habe ich nicht geöffnet.
- **Öffentlicher Schlüssel** `src/updates/update-public-key.pem` ist versioniert, die `.gitignore`-Ausnahme greift (N-4 der Vorprüfung geschlossen).
- **Client-Signaturprüfung fail-closed.** `manifest-sign.js:46-68`: leere Bytes, fehlende oder nicht strikte 64-Byte-Base64-Signatur, fehlender oder kein Ed25519-Schlüssel, jede Ausnahme ergibt `ok:false`. `github-feed.js:189-209` lässt ein Manifest nur nach `ok === true` durch und prüft danach Produkt, Kanal, Version, Hash, Paketart. Im Installationspfad kommt strikt dazu: Tag-Gleichheit, sicherer `.exe`-Name, genau ein Installer, Name und Größe gegen das Manifest (`service.js:362-376`).
- **Herkunft der Datei:** Der Download muss mit `https://github.com/DesoWorks/Academy/releases/download/` beginnen und exakt auf Tag und Name passen (`github-feed.js:100-118`, `service.js:522`). Der Hash kommt aus dem signierten Manifest (`service.js:541-543`). Signatur wird vor Download (`:502`) und vor Start (`:628`) erneut geprüft, Hash vor Start nochmals (`:621`).
- **Downgrade:** Gleiche oder ältere Version wird beim Download (`:499`) und beim Start (`:618`) abgelehnt.
- **Wiederholte Veröffentlichung:** `concurrency` je Workflow ohne Abbruch laufender Läufe. Im Publish-Job bricht das Skript ab, wenn der Tag existiert (DEV Zeile 111-114). Der Tag enthält `GITHUB_RUN_NUMBER`, ein bestehender Tag wird nie überschrieben. Release wird erst als Entwurf angelegt, die beiden Manifest-Assets werden geprüft, dann erst sichtbar gemacht. Clients ignorieren Entwürfe (`github-feed.js:223`).
- **Personenbezug in Schlüssel und Tokens:** Kein Token ins Repo eingebettet (`github-feed.js:1-8`, `resolveToken` nur für die Releaseliste).

## 4. Offen

Kein Befund unten ist HOCH oder KRITISCH. Die Einstufung begründe ich jeweils mit Voraussetzungen und Wirkung.

### MITTEL

**M-4 MITTEL – Personenbezug in der öffentlichen Historie (priorisiert).** Bestätigt, nicht nur vermutet. Das Repository ist öffentlich und `origin/dev` enthält alles bis `70dfe52`.
- *Autorenmetadaten:* Alle 21 Commits (gesamter Bereich `4d7f205` bis `70dfe52`) tragen eine Autoren-Adresse, die keine `noreply`-Adresse ist (die Suche nach `noreply` ergibt 0 Treffer). Den Wert habe ich nicht gelesen. Ob es mehrere verschiedene Adressen gibt, habe ich nicht ermittelt (der Zählbefehl wurde von der Umgebung abgelehnt).
- *Lokaler Windows-Benutzername in Pfaden:* Er steht in Dokumentation, eingeführt in den Commits `49b089a` (Phase M) und `54a5330` (Phase N), und ist in den heutigen Dateien `PHASE-M.md`, `WINDOWS-UPDATE-TEST-M.md`, `UPDATE-INVENTORY-N.md` weiterhin enthalten. Zusätzlich nennt `UPDATE-SECURITY-N.md` den Befund selbst, dort nur als Platzhalter.
- *Nicht personenbezogen:* Der Treffer in Commit `4a93e1a` (`windows-labor-daten.js`) ist ein Beispielpfad eines Lernlabors und kein Personenbezug.
- *Gesucht, nicht gefunden:* `@hotmail` und `@gmail` im Dateiinhalt aller Commits (0 Treffer). Andere Anbieter, Klarnamen und Telefonnummern habe ich nicht gesucht.
- *Bewertung:* Es sind Daten des Projektinhabers selbst, kein Fremdbezug gefunden, aber die Veröffentlichung ist praktisch nicht rücknehmbar (Forks, Caches). Deshalb MITTEL und nicht NIEDRIG. Hoch wäre es bei Fremddaten.
- *Entscheidung beim Commander.* Optionen: (a) akzeptieren und künftig `noreply`-Adresse und Platzhalterpfade verwenden, (b) die heutigen Dokumente bereinigen (neuer Commit, entfernt die Daten nicht aus der Historie), (c) Historie umschreiben und neu veröffentlichen (Force-Push, bricht alle Klone und den Branch-Bezug, nur mit ausdrücklicher Freigabe).

**M-5 MITTEL (neu) – Signaturgeheimnis auf Job-Ebene.** In DEV und BETA steht `ACADEMY_MANIFEST_SIGNING_KEY` im `env` des gesamten Jobs `build` (DEV Zeile 38-39, BETA Zeile 46-47). Damit sehen es auch `npm ci` (Install-Skripte aller Abhängigkeiten), `electron-builder` und alle Schritte dazwischen. Ein kompromittiertes npm-Paket könnte den Schlüssel auslesen und gültige Updates für alle Clients signieren. Voraussetzung: ein bösartiges Paket in der Abhängigkeitskette. Wirkung: Übernahme des Updatewegs. Empfehlung: das Geheimnis nur im Schritt „Manifest erzeugen und signieren“ als `env` setzen. Nur dieser Schritt liest es. Für STABLE gilt dasselbe (Zeile 77-81, dort zusätzlich das Zertifikat).

**M-6 MITTEL (neu, blockiert nur STABLE) – Schutz des Environments `stable-release` unbewiesen.** `academy-stable.yml` verlässt sich auf ein Environment mit Pflichtprüfern (Kommentar Zeile 3). Ich konnte die GitHub-Einstellungen nicht prüfen. Ein nie angelegtes Environment wird von GitHub beim ersten Lauf automatisch ohne Schutzregeln erzeugt. Zudem liest der Job `guard` die Geheimnisse ohne Environment, und die Freigabe „FREIGEGEBEN“ ist nur ein Textfeld, das jeder mit Schreibrecht eintragen kann. Für DEV unerheblich, vor jedem STABLE-Lauf zu belegen: Environment existiert, Pflichtprüfer gesetzt, Branch-Regel `main`, Geheimnisse an das Environment gebunden. STABLE ist ohnehin nicht lauffähig (Herausgeberzertifikat fehlt).

**M-2 MITTEL – Ein Signaturschlüssel ohne Key-ID, Rotation, Widerruf (unverändert).** Heute neu bestätigt: Der Schlüssel liegt zusätzlich als Repository-Geheimnis in Actions (laut Lead). Ob die lokale Schlüsseldatei passwortgeschützt ist, ist unbekannt. Es gibt kein Verfahren, einen kompromittierten Schlüssel im Client zu widerrufen; der öffentliche Schlüssel ist im ausgelieferten Paket fest. Ein Schlüsselwechsel verlangt dann ein neues manuell installiertes Release. Vor BETA/STABLE Notfallplan festlegen und den Schlüssel einmal offline sichern.

**M-3 MITTEL – Modulupdates (teilweise entschärft, nicht geschlossen).** Im GitHub-Pfad wird `state.moduleUpdates = []` gesetzt (`service.js:341`). Der unsignierte Legacy-Modulpfad (`:466`) hängt an einer gesetzten `feedUrl`, die im gepackten Build leer ist. `downloadModule` (`:658`) braucht einen Eintrag aus `moduleUpdates`. Nicht gelesen: das Laden des gespeicherten Zustands (`service.js` Zeilen 120-254) und `zip.js`. Ob ein manipulierter `state.json` einen Moduleintrag einschleusen kann, ist ungeprüft. Deshalb bleibt die Stufe bestehen.

### NIEDRIG

- **M-1 (jetzt NIEDRIG, vorher MITTEL) – Manifest ohne Frische.** Neu bewertet gegen den heutigen Code: Ein altes signiertes Manifest kann den Client nicht mehr zurücksetzen, weil Downgrade und gleiche Version in `download()` und `installPlan()` abgelehnt werden. Offen bleibt das Zurückhalten neuer Releases (Freeze) und das Fehlen von `minimumCore` (immer `null`) sowie eines Ablaufs. Wirkung: ein Angreifer mit Kontrolle über die Releaseliste kann Updates verzögern, nicht installieren. Vor STABLE erneut bewerten. Ich habe die Vergleichsfunktion `compare` nicht gelesen.
- **N-1 – Download im Speicher ohne Größenbegrenzung.** `writeResponse` (`service.js:204-220`) sammelt alle Chunks, prüft weder `Content-Length` noch das Manifest-`size` vor dem Schreiben. Der Hash schützt die Integrität, nicht den Speicher. Zusätzlich vergleicht `:374` die Größe nur, wenn beide Werte gesetzt sind. Der Weiterleitungsfilter läuft erst nach der Anfrage (`:533-537`). Quelle ist auf GitHub festgelegt, daher nur theoretisch ausnutzbar.
- **N-2 – `state.json` nur teilweise an die Signatur gebunden.** Siehe Vorprüfung. Im GitHub-Pfad prüfen `reconcile` und `installPlan` die gespeicherte Signatur erneut; offen ist das Zeitfenster zwischen Hashprüfung und Start.
- **N-3 – `ACADEMY_UPDATE_TOKEN` aus der Umgebung.** Nur für die Releaseliste, nie für Downloads (`github-feed.js:172-175`), Zeichenmenge eingeschränkt (`:23-31`).
- **N-6 (neu) – Aktionen nicht an Commit-SHA gepinnt.** `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `download-artifact@v4` folgen beweglichen Tags. Ein manipulierter Tag würde im Job `build` mit dem Signaturgeheimnis laufen (siehe M-5).
- **N-7 (neu) – Publish prüft Inhalt nicht erneut.** Der Job `publish` lädt das Artefakt und prüft nur, dass die Assetnamen vorhanden sind (DEV Zeile 118-120). Die Signaturprüfung fand im Job `build` statt. Ein Eingriff zwischen Upload und Download innerhalb desselben Laufs würde der Client durch Signatur und Hash abweisen (Ausfall, kein Schaden). Empfehlung: Signatur und SHA-256 im Publish-Job mit `node` erneut prüfen, bevor veröffentlicht wird.
- **N-8 (neu) – Entwurfsreste nach Abbruch.** Scheitert `gh release edit` oder die Assetprüfung nach `gh release create`, bleibt ein Entwurf mit dem Tag stehen. Ob `gh release view` Entwürfe findet und ein Wiederholungslauf mit gleicher Run-Nummer sauber scheitert, habe ich nicht getestet. Clients sind nicht betroffen.

### INFORMATIV

- **I-1** Ungepackt darf `ACADEMY_UPDATE_FEED` einen Loopback-Feed setzen. Im installierten Build wirkungslos (Vorprüfung H-1, heute unverändert gelesen). Kein Prüfbeleg für den installierten Build.
- **I-2** DEV- und BETA-Installer sind nicht Authenticode-signiert (`signature=unsigned`). Die Echtheit ruht allein auf Ed25519-Manifest und SHA-256. SmartScreen-Hinweise sind zu erwarten. Der Wert `unsigned` beschreibt nur den Installer, das Manifest wird immer signiert.
- **I-3 – CRLF-Indexfehler als Integritätsbefund.** Vom Lead übernommen, von mir nicht selbst untersucht. Bewertung: Weicht die Bytefolge der Testdaten im CI-Checkout von der im Index ab, ist die Aussage „Tests grün“ nichts wert, bis die Ursache behoben ist. Die richtige Reaktion ist, die Zeilenenden der betroffenen Dateien über `.gitattributes` festzulegen (Binärdateien als `-text`), den Index neu zu normalisieren, einzuchecken und im CI-Checkout die Bytegröße und den Hash der Nutzlastdateien zu belegen. Hash- oder Größenprüfungen abzuschalten ist kein zulässiger Fix. Ein Fix, der nur die Erwartungswerte an den Runner anpasst, bräuchte eine fachliche Begründung.

## 5. Nicht geprüft / Grenzen

- GitHub-Einstellungen: Branch- und Tag-Schutz für `dev`, `beta`, `main`, Environments, Secret-Scope, 2FA, Fork-Workflow-Einstellungen, Collaborator-Liste. Das wirkt sich besonders auf DEV aus: wer nach `dev` pushen darf, löst Build, Signatur und Veröffentlichung aus und kann den Workflow selbst ändern. Empfehlung: `dev` schützen (kein Force-Push, Pflichtprüfung), `.github/` per CODEOWNERS absichern, das Geheimnis an ein Environment mit Branchbeschränkung binden.
- Kein Build, kein Test, kein Netzwerkzugriff, kein Installer geöffnet. Ob der öffentliche Schlüssel im Paket liegt (N-5 der Vorprüfung), ist weiter ungeprüft. Der zweite Actions-Lauf hat den Build übersprungen, daher gibt es noch keinen CI-Beleg für die Signaturschritte.
- Nicht gelesen: `service.js` Zeilen 120-254 und 648-733, `channels.js`, `zip.js`, `ipc.js`, `package.json`-Skripte, `npm audit` (Abhängigkeiten ungeprüft).
- Historiensuche nur nach festen Mustern (Pfadmuster, zwei Maildomänen, Schlüsselkopf). Kein vollständiger Geheimnisscan, kein Tool wie gitleaks.
- Dieser Bericht ist keine Produktionsfreigabe. Die endgültige Entscheidung liegt beim Commander.

## 6. Empfohlene Reihenfolge

1. Vor dem ersten CI-Build: M-5 beheben (Geheimnis nur im Signaturschritt), `dev` schützen.
2. Entscheidung des Commanders zu M-4 (Autor-Adresse und Pfade) vor weiteren Pushes.
3. Nach grünem Build: Paket auf den öffentlichen Schlüssel prüfen, Manifest, Signatur und Hash der Release-Dateien unabhängig nachrechnen.
4. Vor BETA/STABLE: M-2, M-6, M-1 und N-6 abarbeiten.


---

# Nachtrag 1 – Nachprüfung des CI-Fixes und von M-5

Prüfer: RoboCop, Security Officer
Datum: 22.11.2026
Art: lesend. Kein Commit, kein Push, kein Stagen, keine Änderung an Produktionscode. Geschrieben wurde nur dieser Nachtrag. Der Bericht oben bleibt unverändert. Keine Schlüssel- oder Tokenwerte, keine Namen, Adressen oder lokalen Benutzerpfade in diesem Nachtrag.

Stand bei der Prüfung: Branch `feature/phase-n1-release-connectivity`, `origin/dev` und `main` unverändert gegenüber dem Bericht oben (`main` bleibt `2e704e3`). Der Fix liegt zum Teil gestagt, zum Teil unstaged und zum Teil untracked vor (siehe Punkt 6).

## A. Ergebnis

**Offen: 0 KRITISCH, 0 HOCH. Kein kritischer oder hoher Befund blockiert den DEV-Push.** Die Freigabe liegt beim Commander.

Der Fix verhält sich wie beschrieben. M-5 ist für DEV und BETA geschlossen und für STABLE zur Hälfte geschlossen. Dazu kommen zwei kleine neue Hinweise (N-9, N-10) und ein Restpunkt M-5b, der nur STABLE betrifft.

## B. Prüfung der fünf Punkte

### 1. Größenprüfung und SHA-256 bleiben an, kein Test entfernt – BESTÄTIGT

- `git diff HEAD --stat -- tests scripts src` ist leer. Es gibt also keine Änderung an einem versionierten Test, am Skriptverzeichnis oder an `src/`. Der Prüfcode für Größe und Hash (`src/modules/manager.js`) ist damit unverändert. Ich habe `manager.js` selbst nicht gelesen, der Beleg ist der leere Diff.
- Neu und untracked sind nur `scripts/regenerate-payload-index.js` und `tests/phase-n1-w3-qa.test.js`. Es wurde nichts gelöscht.
- `payload-index.json` (gestagt): In jedem geänderten Eintrag ändern sich `sha256` und `size` gemeinsam. Beide Felder sind weiterhin für alle 249 Einträge vorhanden. Geändert sind nur Texteinträge. Der Index wird aus den kanonischen LF-Blobs berechnet, nicht aus der Windows-Arbeitskopie.
- `academy-module.json`: `sizeBytes` 62021 auf 62017. Der Wert ist die Summe der deklarierten Dateien. Das Skript berechnet ihn selbst (Zeilen 171-189) und bricht bei CR in einer deklarierten Datei ab.
- Das Skript ist im Prüfmodus rein lesend (`--check` verbietet schreibende Optionen, Zeile 48-51). Es schaltet nichts ab, es berechnet gegen die Blobs. Ich habe es selbst ausgeführt: Exit 0, 249 Einträge, 244 Text, 5 Binär, 0 Textabweichungen, `binaerBlobBeschaedigt` leer, `manifestSizeBytes` 62017 unverändert.
- Gesamte Suite selbst ausgeführt: 134 Tests, 134 bestanden, 0 fehlgeschlagen, 0 übersprungen, 0 abgebrochen. Gegenüber Welle 2 (131) sind das 3 mehr. Das passt zur einen neuen Testdatei, ich habe die Tests darin nicht einzeln gezählt.

Bewertung: Die Prüfung wurde nicht gelockert. Die Erwartungswerte wurden neu aus den Blobs abgeleitet, und das Skript begründet das (Kopfkommentar, Verweis auf `CI-RECOVERY-N1-W3.md`). Das ist die ursächliche Korrektur und keine Anpassung an den Runner.

### 2. Fünf Binärdateien: Wiederherstellung, keine Abschaltung – BESTÄTIGT

Gestagte Blobs, direkt aus dem Git-Index gelesen (`git show :pfad`):

| Datei | Blobgröße | Anfangsbytes |
| --- | --- | --- |
| `favicon-32.png` | 788 | `89504e470d0a1a0a` (gültige PNG-Signatur) |
| `favicon.ico` | 2600 | `0000010003001010` (ICO-Kopf) |
| `LGA_1155_socket-6510.jpg` | 3091012 | `ffd8ffe1…` (JPEG/EXIF) |
| `Solder_ball_grid.jpg` | 4097171 | `ffd8ffe1…` |
| `Pentium_4_Underside_…PGA_Socket.JPG` | 3993600 | `ffd8ffe1…` |

- `favicon-32.png` hat Länge 788 und die korrekte PNG-Signatur. Die Signatur enthält `0d0a`, also genau die Bytefolge, die die frühere CRLF-Umschreibung beschädigt hatte. Der alte Blob hatte 787 Bytes (`git diff --cached --stat`: 787 auf 788).
- Alle fünf Blobs stimmen mit den Index-Einträgen überein. `--check` meldet keinen beschädigten Binärblob mehr.
- Die Binäreinträge im Index wurden vom Skript bewusst nicht verändert (Zeilen 119-144). Die Wiederherstellung passt den Blob an den Index an, nicht umgekehrt. Das ist die richtige Richtung für eine Integritätsprüfung.

### 3. `.gitattributes` – BESTÄTIGT, mit einem Hinweis

Der gestagte Diff fügt genau diese sieben Zeilen hinzu: `*.jpg`, `*.JPG`, `*.jpeg`, `*.gif`, `*.webp`, `*.woff`, `*.woff2` jeweils als `binary`. Die bisherigen Einträge (`png`, `ico`, `exe`, `zip`, `asar`, `dll`, `node`) bleiben.

- **N-9 NIEDRIG (neu): Groß-/Kleinschreibung.** `.gitattributes` unterscheidet Groß- und Kleinschreibung. Abgedeckt sind `.jpg`, `.JPG`, `.jpeg`. Nicht abgedeckt wären `.PNG`, `.JPEG`, `.GIF`, `.WEBP`, `.ICO` und Mischformen. Heute existiert nach meiner Kenntnis keine solche Datei im Modul (nicht vollständig durchsucht). Kein Fehler im Fix, aber dieselbe Fehlerklasse käme beim ersten Asset mit anderer Schreibweise wieder. Empfehlung: die fehlenden Schreibweisen ergänzen oder die Binär-Regel für `modules/**` zentral fassen.

### 4. M-5: Signaturschlüssel nur am Signaturschritt – BESTÄTIGT für DEV und BETA, TEILWEISE für STABLE

Die drei Workflows habe ich vollständig gelesen.

- **DEV** (`academy-dev.yml`): Der Job `build` hat kein `env` auf Job-Ebene. `ACADEMY_MANIFEST_SIGNING_KEY` steht ausschließlich im Schritt „Manifest erzeugen und signieren“ (Zeilen 69-72). Davor laufen `npm ci` und `electron-builder` ohne das Geheimnis. Der Schritt bricht bei leerem Wert ab (Zeilen 74-77). Danach prüft ein eigener Schritt die Signatur gegen den öffentlichen Schlüssel.
- **BETA** (`academy-beta.yml`): gleiches Bild, Schritt Zeilen 77-80, Prüfung auf Vorhandensein Zeilen 82-85.
- **STABLE** (`academy-stable.yml`):
  - Der Schlüssel steht im Build nur am Signaturschritt (Zeilen 120-123).
  - Der Job `guard` prüft das Secret nur mit `[ -z ... ]` auf Vorhandensein (Zeilen 52-55), druckt es nicht und führt keine Installation oder fremden Code aus. Das ist vertretbar. Das Geheimnis steht dort zwar im Job-`env` (Zeile 35), aber der Job führt nur diesen einen Shell-Block aus.
  - `CSC_LINK`, `CSC_KEY_PASSWORD` und `PUBLISHER_THUMBPRINT` stehen weiter im `env` des gesamten Jobs `build` (Zeilen 77-80). Das entspricht der Aussage, dass `CSC_LINK` beim Bauen gebraucht wird.
- Weitere Befunde beim Lesen: Es gibt keinen Treffer für `pull_request` oder `pull_request_target`. Alle Checkouts haben `persist-credentials: false`. Rechte sind pro Job gesetzt. Das Geheimnis wird nirgends ausgegeben.

**M-5 Status:** DEV und BETA geschlossen. Die Wirkung der Schwachstelle (ein kompromittiertes npm-Paket liest den Signaturschlüssel in `npm ci`) ist dort beseitigt.

**M-5b MITTEL (neu, nur STABLE): Zertifikat und Passwort für `npm ci` sichtbar.** Weil `CSC_LINK` und `CSC_KEY_PASSWORD` am Job hängen, sehen auch `npm ci` und seine Install-Skripte das Herausgeberzertifikat und sein Passwort. Ein bösartiges Paket könnte damit Code als DesoWorks signieren. Voraussetzung: bösartiges Paket in der Abhängigkeitskette. Die Wirkung wäre bei STABLE groß, weil Authenticode die Vertrauensbasis ist. Das ist von Rick bewusst so belassen und technisch begründet, bleibt aber ein Restrisiko. Empfehlung: `CSC_LINK` und `CSC_KEY_PASSWORD` nur im Schritt „Signierten Windows-Installer bauen“ als `env` setzen. `npm ci` braucht sie nicht. Das ist eine kleine Änderung, und `electron-builder` liest sie aus der Umgebung seines eigenen Schritts. Einstufung MITTEL, blockiert nur STABLE und nicht DEV. STABLE ist ohnehin nicht lauffähig (Zertifikat fehlt, M-6).

**N-10 NIEDRIG (neu, nur STABLE): Kein eigener Prüfschritt für die Manifest-Signatur.** DEV und BETA prüfen die Signatur nach dem Signieren gegen den öffentlichen Schlüssel. STABLE hat diesen Schritt nicht und im Signaturschritt keine eigene Abbruchprüfung. Das Skript bricht ohne Schlüssel selbst ab (Bericht oben, Zeile 37-38), und `guard` prüft das Secret vorher. Der Schutz hängt also an zwei Stellen, aber ohne die Gegenprobe. Vor dem ersten STABLE-Lauf angleichen.

### 5. Kein privater Schlüssel in den geänderten Dateien – BESTÄTIGT

- Textsuche nach PEM-Kopf eines privaten Schlüssels, nach dem Ed25519-Schlüsselanfang im DER-Format und nach einem direkt zugewiesenen Secret-Wert über das ganze Repository (Dateitypen `js`, `json`, `md`, `yml`, `yaml`, `txt`): 0 Treffer. Das schließt die geänderten Dateien, die drei Workflows, `regenerate-payload-index.js` und die neuen Berichte ein. Die private Schlüsseldatei unter `keys/` ist ignoriert (Bericht oben) und wurde nicht geöffnet.
- Die drei geänderten Bilddateien und die Icons habe ich nicht nach Schlüsseltext durchsucht (Binärdaten). Es gibt keinen Grund dafür, sie sind Originale (Blobs entsprechen dem Index).
- In `.github/` gibt es keinen Treffer für Mailadressen der beiden gesuchten Anbieter oder lokale Benutzerpfade.
- Der Test „im Updatecode steckt kein eingebettetes Token und kein privater Schlüssel“ besteht.

## C. Zusätzliche Beobachtungen

### 6. Vor dem Commit beachten (Vollständigkeit, kein Sicherheitsbefund)

Aus `git status` ergibt sich:

- **Gestagt:** `.gitattributes`, `academy-module.json`, `payload-index.json` und die fünf Binärdateien.
- **Nur geändert, nicht gestagt:** die drei Workflows (`academy-dev.yml`, `academy-beta.yml`, `academy-stable.yml`) und `build/build-info.json`.
- **Untracked:** `scripts/regenerate-payload-index.js`, `tests/phase-n1-w3-qa.test.js` und die Berichte der Welle 3.

Folgen: Wird nur das Gestagte committet, geht M-5 nicht mit nach `dev`, und der Build läuft mit dem alten Workflow. Fehlen Skript und Test im Commit, passt die Aussage „134 Tests grün“ nicht zum CI-Stand. Die Workflows müssen also ausdrücklich mit in den Commit. `build/build-info.json` ist ein Build-Artefakt und gehört nicht hinein.

### 7. N-11 NIEDRIG (neu): Personenbezug in einem neuen Bericht

Die Suche nach Mailanbietern und lokalen Benutzerpfaden trifft in `NSIS-ISOLATION-N1-W3.md` zweimal. Ich habe die Fundstellen nicht ausgegeben und nicht kopiert. Die Datei ist untracked und noch nicht veröffentlicht. Vor dem Commit prüfen und durch Platzhalter ersetzen. Das bestätigt M-4 aus dem Bericht oben: Wird jeder neue Bericht ungeprüft eingecheckt, wächst der Personenbezug in der öffentlichen Historie weiter. Der Treffer in `SECURITY-N1-W3.md` ist die Befundbeschreibung zu M-4 selbst und enthält keine Adresse. Ich habe die Datei nicht auf eine Adresse im Klartext durchsucht, nur auf Muster mit Anbieternamen.

M-4 bleibt wie im Bericht oben offen und beim Commander. Er ist kein Blocker für den DEV-Push, aber jeder Push macht es endgültiger. Die Entscheidung (a/b/c) sollte vor dem ersten Push fallen.

## D. Aktualisierte Befundlage

| Stufe | Offen | IDs |
| --- | --- | --- |
| KRITISCH | 0 | – |
| HOCH | 0 | – |
| MITTEL | 5 | M-2, M-3, M-4, M-5b (STABLE), M-6 (STABLE) |
| NIEDRIG | 10 | M-1, N-1, N-2, N-3, N-6, N-7, N-8, N-9, N-10, N-11 |
| INFORMATIV | 3 | I-1, I-2, I-3 |

Geschlossen: **M-5** für DEV und BETA (Beleg Punkt 4). **I-3** (CRLF-Indexfehler): Ursache nach Aktenlage behoben, Blobs und Index stimmen überein, `--check` Exit 0. Der endgültige Beleg fehlt noch, bis der GitHub-Windows-Runner die Suite grün meldet.

## E. Antwort auf die Kernfrage

**Blockiert ein kritischer oder hoher Befund den DEV-Push? Nein.**

Voraussetzungen aus Sicherheitssicht, keine Blocker im Sinne der Risikostufen, aber Bedingungen für einen sauberen Push:

1. Die drei Workflowdateien und das Skript samt Test gehören in den Commit (Punkt 6).
2. `NSIS-ISOLATION-N1-W3.md` vor dem Commit von Personenbezug befreien (N-11) oder nicht mit einchecken.
3. Entscheidung des Commanders zu M-4, bevor weitere Berichte in die öffentliche Historie gehen.
4. Der Push dient nur dem Actions-Lauf. Ein Installationstest bleibt unberührt, solange die Isolation nicht belegt ist (Auftragslage unverändert, Terminus-Bericht nicht von mir geprüft).

## F. Grenzen dieser Nachprüfung

- Kein Build und kein Lauf auf dem GitHub-Runner. Ob die Suite dort grün wird, ist ungeprüft. Der lokale Lauf (134 von 134) beweist es nicht, weil der Fehler zeilenendenabhängig war. Der Beleg kommt erst mit dem Actions-Lauf.
- `manager.js`, `package-it-module.js` und die Nutzlast-Grenzen habe ich nicht gelesen. Aussagen darüber stützen sich auf den leeren Diff gegenüber HEAD und auf die Testergebnisse.
- Die Arbeitskopie der Textdateien kann auf Windows noch CRLF haben, der Blob ist LF. Ich habe nicht geprüft, ob das lokale Paketieren (`package-it-module.js`) daraus wieder einen abweichenden Index bildet. Das Skript bietet dafür `--sync-worktree`, ich habe es nicht ausgeführt.
- Nicht geprüft: GitHub-Einstellungen (Branchschutz, Environments, Secret-Scope), Abhängigkeiten per `npm audit`, die Terminus- und Jarvis-Berichte inhaltlich. Alles andere aus dem Bericht oben gilt unverändert.
- Dieser Nachtrag ist keine Produktionsfreigabe. Die endgültige Entscheidung liegt beim Commander.
