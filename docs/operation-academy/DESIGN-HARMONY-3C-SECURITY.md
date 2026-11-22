# OPERATION DESIGN HARMONY – ETAPPE 3C – Sicherheitsbewertung Modulupdate 1.0.3

Projekt: Academy (IT-Ausbildung, Modul `desoworks.it-systemintegration`)
Prüfer: RoboCop, Security Officer
Datum: 2026-11-22
Prüfgegenstand: Branch `feature/phase-n1-release-connectivity`, HEAD `95f0033`, Arbeitsbaum NICHT sauber (geänderte, nicht eingecheckte Dateien u. a. `src/main.js`, `src/modules/manager.js`, `src/modules/spec.js`, `modules/it-systemintegration/academy-module.json`). Die Bewertung gilt für den Arbeitsbaumstand, nicht für einen Commit.
Methode: ausschließlich gelesener Quellcode. Kein Code geändert, nichts ausgeführt, kein Profil des Commanders gelesen, kein Push.

## 1. Kurzurteil

Aus Sicherheitssicht gibt es keinen Befund der Stufe KRITISCH oder HOCH. Keine Prüfregel wurde abgeschwächt, und die Downgrade-Sperre ist im Code dreifach vorhanden.

Es gibt aber einen funktionalen Befund mit Sicherheitsrelevanz für die Auslieferung (F-1, MITTEL): In einem gepackten Build erreicht ein Modulupdate den Anwender über den Updatedienst gar nicht. Das ist für die Auslieferungsreihenfolge entscheidend.

**Ein privates Modul ohne Signatur entspricht dem bestehenden Vertrag. Es ist keine Lücke.** Begründung in Abschnitt 3.

## 2. Befunde

Stufen nach Operating Manual. "Bestätigt" heißt: im Code gelesen. "Verdacht" heißt: nicht durch Ausführung belegt.

### F-1 – MITTEL, bestätigt: Modulupdate-Weg ist im gepackten Build nicht erreichbar
- `src/updates/feed.js:269-274` (`resolveFeedUrl`): ein gepackter Build ignoriert `ACADEMY_UPDATE_FEED` und nutzt eine leere Feed-Adresse.
- `src/updates/service.js:401`: leere Feed-Adresse führt zu `checkGithub()`.
- `src/updates/service.js:341`: `checkGithub` setzt `state.moduleUpdates = []`.
- `src/updates/service.js:466`: `moduleUpdates` wird nur im Feed-Zweig befüllt.
- `src/updates/feed.js:204`: im Kanal `stable` liefert `selectModuleUpdates` ohnehin `[]`. `src/updates/service.js:659` erlaubt `downloadModule` nur im Kanal `dev`.
- Auswirkung: `downloadModule` und `academy:module-update-install` (`src/ipc.js:503-550`) sind nur mit einem ungepackten Lauf und gesetztem Feed erreichbar. Ein gepackter DEV-Build erhält Modul 1.0.3 nicht über diesen Weg.
- Bewertung: kein Angriffsweg, aber eine Lücke zwischen Anspruch ("vorhandenen Mechanismus nutzen") und Wirklichkeit. Siehe Abschnitt 6.
- Grenze: Ob der Kanal `dev` im gepackten Build `moduleUpdates` anderswo befüllt, habe ich in den gelesenen Stellen nicht gefunden. Die Suche nach `modules` in `feed.js`/`service.js` lieferte keine weiteren Treffer.

### F-2 – NIEDRIG, bestätigt: Fehlschlag stellt den Altstand nicht aktiv wieder her, braucht es aber im Regelfall nicht
- `src/ipc.js:531-534`: vor dem Update wird ein Snapshot des Installationsordners kopiert.
- `src/ipc.js:541-548`: im Fehlerfall wird nur das Ziel `verified/<id>/<version>` gelöscht. Der Snapshot wird weder zurückgespielt noch gelöscht. Der Pfad wird nur als `rollback` gemeldet.
- Warum der Altstand trotzdem erhalten bleibt: Die neue Version landet in einem eigenen Ordner `module-packages/<id>/<version>` (`src/modules/manager.js:540`). Alle Prüfungen laufen vor der ersten Dateioperation (`manager.js:496-535`). Die Installationszeile wird erst in `manager.js:568-580` per Upsert auf die neue Version gesetzt, danach gibt es keinen fehlerträchtigen Schritt mehr. Schlägt etwas vorher fehl, zeigt `install_path` weiter auf den intakten Ordner 1.0.2.
- Offene Restfälle:
  - Der Snapshot `cpSync` (`ipc.js:534`) liegt außerhalb des `try`. Wirft er (Platte voll, Sperre), kommt kein strukturierter Fehler zurück, sondern eine unbehandelte Ausnahme im IPC-Handler. Zustand unverändert.
  - Fehler zwischen `rmSync(dest)` und `renameSync` (`manager.js:564-565`) betreffen nur den Zielordner der NEUEN Version. Der Altordner bleibt unberührt. Nur im Reparaturfall (`faulted`, gleiche Version) wird der aktuelle Ordner ersetzt.
  - Snapshots unter `updates/modules/rollback/...` werden nie aufgeräumt und nie verwendet. Das ist Plattenverbrauch, aber kein Sicherheitsrisiko. Ordner mit alten Versionen (`module-packages/<id>/1.0.2`) bleiben ebenfalls liegen.
- Hinweis: Der Fehlerpfad meldet "Die bisherige Modulversion bleibt" (`ipc.js:546`). Das stimmt nach Code-Lage, ist aber nicht durch einen Lauf bewiesen. GLaDOS' Test in Etappe 3C muss es belegen.
- Empfehlung (für Jarvis, nicht von mir umzusetzen): Snapshot in den `try`-Block ziehen, bei Erfolg Aufräumregel (letzte N Stände), Snapshot-Pfad nur melden, wenn er wirklich nutzbar ist.

### F-3 – NIEDRIG, bestätigt: Paketherkunft bei privaten Modulen beruht auf Kanal und Hash, nicht auf einer Signatur
- `src/updates/service.js:674-681, 685-688`: Zip und `.sha256` kommen aus demselben Release, beide müssen auf das gepinnte Repository zeigen (`repositoryPinned`). Der Hash schützt vor Übertragungs- und Ablagefehlern. Wer das Release schreiben kann, kann Zip und Hash gemeinsam austauschen.
- Das ist kein Bruch des Vertrags (siehe Abschnitt 3), aber der Hash ist hier keine unabhängige Echtheitsprüfung.
- Empfehlung: GitHub-Schreibrechte und Release-Erstellung für das Repo eng halten, Release-Veröffentlichung nur nach Freigabe des Commanders.

### F-4 – NIEDRIG, bestätigt: Hash wird zweimal gelesen, kleines Zeitfenster
- `src/ipc.js:524` hasht die Zip-Datei, `src/ipc.js:537` liest sie danach erneut für `extractZip` (`src/updates/zip.js:121`). Ein lokaler Angreifer mit Schreibzugriff auf `updates/modules/incoming` könnte dazwischen tauschen.
- Voraussetzung ist lokaler Schreibzugriff im Datenordner des Anwenders. Dann hat er ohnehin mehr Möglichkeiten. Die nachgelagerten Prüfungen (Manifest, Dateigrößen, Nutzlastindex mit Hashes, `readPackage`) fangen eine inhaltliche Abweichung weiterhin ab.
- Empfehlung: Zip einmal in den Speicher lesen, dort hashen und aus demselben Puffer entpacken.

### F-5 – NIEDRIG, bestätigt: Der Updatepfad `verified` gilt als vertrauenswürdiger Modulordner
- `src/main.js:69-72`: `hostedWebRoots` enthält neben dem mitgelieferten Ordner auch `<dataDir>/updates/modules/verified`.
- `src/modules/manager.js:485-495` lässt eine Web-Lernumgebung nur aus diesen Wurzeln zu. Damit ersetzt der Datenordner die Bedingung "mitgeliefert". Die Bedingung "geprüft" hängt dann allein an `ipc.js:524-538`.
- Auswirkung: Nur Prozesse mit Schreibzugriff auf den Datenordner könnten dort ein Paket ablegen. Zusätzlich gelten weiter `validateRuntime` (`spec.js:115-120`: Herausgeber `publisher.desoworks`, ID-Präfix `desoworks.`, Trust `private`) und die Prüfsummen der Nutzlast.
- Die Änderung steht in einer nicht eingecheckten Datei (`src/main.js`). Sie sollte bewusst reviewt und committet werden.

### F-6 – NIEDRIG, bestätigt: Import-Prüfsumme ist keine Authentisierung
- `src/modules/manager.js:692-744`: Export und Import schützen mit einer SHA-256-Prüfsumme über den Inhalt. Jeder kann sie neu berechnen.
- Import verlangt `confirm: true` und einen Modus (`manager.js:711, 724`). Werte werden nur als Text gespeichert (`manager.js:734`). Ein nicht lesbarer Wert unter `progress` würde beim Lesen `JSON.parse` (`manager.js:666`) zum Werfen bringen und das Öffnen des Moduls stören.
- Auswirkung: begrenzt auf den Anwender selbst und nach bestätigtem Import. Kein Schutzbruch.
- Empfehlung: Werte beim Import als JSON prüfen und die Größe wie in `progress` begrenzen (`manager.js:671`).

### F-7 – INFORMATIV: Versionsvergleich
- `src/updates/semver.js:45-55`, Muster `semver.js:3`. Erlaubt `X.Y.Z` und `X.Y.Z-pre`, keine Build-Metadaten. `1.0.3-rc1` ist kleiner als `1.0.3`. Führende Nullen werden per `parseInt` normalisiert (`1.0.03` gleich `1.0.3`). Das führt bei gleichem Inhalt in den Pfad "gleiche Version" und ist unkritisch.
- Das Manifest prüft die Version zusätzlich in `spec.js:151` (`isSafeVersion`).

## 3. Privates Modul ohne Signatur: Vertrag oder Lücke?

**Es entspricht dem bestehenden Vertrag.** Belege:

1. `src/modules/spec.js:208-213`: Signaturpflicht gilt nur für die Vertrauensstufen `reviewed` und `official`.
2. `src/modules/spec.js:118-120`: Eine Web-Lernumgebung (`runtime`) muss `trust: private` haben. Die Meldung lautet ausdrücklich, eine unsignierte Web-Lernumgebung bleibe privat. Ein signiertes `hosted-web`-Modul ist unter dem aktuellen Vertrag gar nicht möglich.
3. `src/modules/manager.js:365-378` (`verifyTrust`): Bei `private` wird keine Signatur verlangt. Ist trotzdem eine vorhanden, muss sie stimmen (Zeilen 374-375).
4. `src/modules/manager.js:581-583`: Ein Modul ohne Signatur erzeugt die Warnung "ungeprüft", und es "erhält keine erweiterten Rechte".
5. `modules/it-systemintegration/academy-module.json` Zeilen 24-28: `trust: private`, `review.signed: false`. Rechte: nur `content.read`, `progress.write`. Diese Rechte sind in `spec.js:24-25` für Stufe `private` zugelassen. Kein Netzwerk-, Skript- oder IDE-Recht (`spec.js:29-31` verlangt `official`).
6. Das Vertrauen bleibt beim Update stabil: `manager.js:513-515` (`trust-mismatch`) lehnt eine stillschweigende Änderung der Stufe ab. `manager.js:510-512` (`publisher-mismatch`) schützt die Modul-ID vor einem anderen Herausgeber.

Einschränkung: Der Schutz vor Kopien der Herausgeber-ID `publisher.desoworks` ist bei privaten Modulen ein selbst deklarierter Wert (siehe F-3, F-5). Er wird durch Kanal, Repo-Pinning und Installationswurzeln gestützt, nicht durch Kryptografie. Das ist die bekannte Eigenschaft der Stufe `private`. Eine Signatur würde erst eine Vertragsänderung bringen (Stufe `reviewed` plus Erlaubnis für `runtime`). Das ist eine Architekturentscheidung für den Commander, nicht Teil dieser Etappe, und sie darf nicht nebenbei geschehen.

## 4. Geprüfte Kontrollen (ohne Befund)

| Kontrolle | Fundstelle | Ergebnis |
|---|---|---|
| Hash des geladenen Zips gegen `.sha256`-Asset | `service.js:685-695` | bei Abweichung Datei gelöscht, `preparedModule = null` |
| Erneute Hashprüfung vor Installation | `ipc.js:524-527` | bei Abweichung `hash-mismatch`, nichts installiert |
| Nur gepinnte Repository-URLs für Zip und Hash | `service.js:674-681`, `feed.js:236` | Fremdhost wird abgelehnt |
| Zip-Entpacken: Zip-Slip, absolute Pfade, `..`, verschlüsselte Einträge, Größen- und Eintragslimits | `zip.js:112-164` | abgesichert. Links werden nicht aufgelöst, da nur reguläre Dateien geschrieben werden |
| Manifest im Paket gegen geprüftes Update (id, version) | `module-manifest.js:18-22` | bei Abweichung Fehler, Ziel wird gelöscht |
| Symlinks, Pfadflucht, Größen, Nutzlastindex samt Hashes | `manager.js:63-158` | abgesichert |
| Core-Kompatibilität und Theme-Vertrag vor jeder Dateioperation | `manager.js:496-504` | `incompatible-core` / `incompatible-theme` |
| Downgrade-Sperre bei Installation | `manager.js:516-518` | `downgrade-blocked`, gilt auch für Zeilen mit Status `uninstalled` |
| Downgrade-Sperre bei Update-Auswahl | `feed.js:210`, `manager.js:333` | gleiche oder ältere Version wird nicht angeboten |
| Gleiche Version, anderer Inhalt | `manager.js:521-531` | `same-version-different-content`, vor jeder Dateioperation |
| Reservierte Plattform-ID | `manager.js:537-539`, `spec.js:169-174` | abgelehnt |
| Zur Laufzeit: Integritätsprüfung der Moduldateien und der Nutzlast | `manager.js:405-427`, `639-658` | bei Abweichung `faulted`, keine Auslieferung |
| Inkompatibles installiertes Modul wird nicht geöffnet | `manager.js:622-628`, `645` | Fehler `module-incompatible` mit Begründung aus `compatibilityOf` (`manager.js:252-265`) |

## 5. Schutz der Lerndaten (`module_kv`)

- Tabelle: `src/modules/registry.js:58-64`, Schlüssel `(module_id, key)`, getrennt von `module_install`.
- Das Update berührt `module_kv` nicht. Der Upsert in `manager.js:568-580` schreibt nur `module_install`. Es gibt in der gelesenen Installationsstrecke keinen `DELETE`/`UPDATE` auf `module_kv`.
- Deinstallation löscht nur Dateien und setzt den Status. Lernstände bleiben (`manager.js:609-613`).
- Schreibzugriff ist an die Berechtigung `progress.write` gebunden (`manager.js:669`), Größe auf 200000 Zeichen begrenzt (`manager.js:671`). Der Schlüssel ist fest `progress`.
- Offen: Ein Backup der Moduldatenbank vor einem Modulupdate gibt es im Modul-Handler nicht. Das Core-Update sichert mit `store.backup("pre-update")` (`ipc.js:493`). Ob diese Sicherung die Moduldatenbank einschließt, habe ich nicht geprüft. Der Code schreibt beim Modulupdate nicht in `module_kv`, deshalb besteht nach Lage des Codes kein Datenverlust.
- Nicht geprüft: wie das Modul im iframe seine Lernstände über die Brücke liest und schreibt (Renderer, `preload.js`). Das gehört in die Funktionsprüfung von GLaDOS (teilweise bearbeitete Lektionen).
- Der Beleg durch einen Lauf mit einem Profil mit 1.0.2 steht aus (Anforderung 5 und 6 gehören der Testkette).

## 6. Auslieferungsreihenfolge aus Sicherheitssicht

Die folgenden Aussagen stützen sich auf Code, nicht auf einen Lauf.

1. Modul 1.0.3 verlangt `themeContract: 1` und lässt sich nur auf einem Core installieren, der den Vertrag kennt (`manager.js:499-504`). Ein altes Modul 1.0.2 ohne Vertrag wird von einem neuen Core nicht mehr geöffnet (`manager.js:622-628`, `645`), aber auch nicht gelöscht oder verändert. Lerndaten bleiben erhalten.
2. Wer den Core zuerst aktualisiert, hat also ein Fenster mit gesperrtem Modul, falls 1.0.3 nicht gleichzeitig ankommt.
3. Wegen F-1 kommt 1.0.3 in einem gepackten Build nicht über den Updatedienst. Der vorhandene Weg ohne zweiten Mechanismus ist der lokale Katalog: `availableUpdate` (`manager.js:312-336`) bietet die im Core mitgelieferte, neuere und kompatible Version an, `installFromDirectory` installiert sie aus `academy-modules` (`main.js:69-71`).
4. Empfehlung: Modul 1.0.3 im selben Core-Release bündeln (Ordner `academy-modules`, Katalogeintrag). Das Core-Update bringt dann das passende Modul mit, das Fenster mit inkompatiblem Modul entfällt, und die Downgrade-Sperre bleibt unverändert. Ein Nur-Modul-Weg über den Feed kann später folgen, sobald F-1 entschieden ist.
5. Ob und wann der Katalogweg das gebündelte Modul beim ersten Start einspielt oder nur anbietet, habe ich nicht verfolgt (`annotate`/`availableUpdate` liefern nur den Hinweis). Das muss Terminus oder Jarvis klären, damit ein Anwender nicht mit gesperrtem Modul und ohne klaren Handlungsweg zurückbleibt.

## 7. Sicherheitsempfehlung

- Sicherheitsfreigabe für ein DEV-Release aus meiner Sicht: **bedingt möglich.** Es steht kein Blocker der Stufe KRITISCH oder HOCH im Weg.
- Bedingungen vor der Freigabe:
  1. Der Arbeitsbaum muss eingecheckt und reviewt sein (der geprüfte Stand ist nicht reproduzierbar, solange er nicht committet ist).
  2. Die Auslieferung als Paket im Core (Abschnitt 6, Punkt 4) ist entschieden, oder F-1 ist anders aufgelöst.
  3. GLaDOS belegt per Lauf: Update 1.0.2 auf 1.0.3 im temporären Profil, Erhalt der Lernstände, Fehlschlag mit erhaltenem Altstand, Downgrade-Ablehnung, inkompatible Version mit verständlicher Meldung.
- F-2 bis F-6 sind Härtungen und blockieren nicht.
- Die endgültige Entscheidung liegt beim Commander. Ich erteile keine Produktionsfreigabe.

## 8. Grenzen der Prüfung

- Nur Quellcode gelesen. Keine Ausführung, keine Tests, keine Netzwerkzugriffe, keine Abhängigkeitsprüfung.
- Nicht gelesen: Renderer (`module.js`, `shell.js`), `preload.js`, `catalog.js`, `errors.js`, Rest von `feed.js` (Zeilen 1-190, 285-288) und `service.js` außerhalb der genannten Bereiche, Sicherung der Datenbank (`store.backup`).
- Das Profil des Commanders wurde nicht gelesen. Die installierte Academy wurde nicht verändert.
- Zeilennummern gelten für den Arbeitsbaum am 2026-11-22. Änderungen danach verschieben sie.
