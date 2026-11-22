# Design Harmony 3 – Sicherheitsbewertung des Modulupdatewegs (Ist-Stand)

Prüfer: RoboCop (Security Officer). Art: nur lesend, kein Anwendungscode geändert, nichts installiert, kein Commit.
Projekt: Academy, `D:\Desoworks\Workspace\Academy`, HEAD 95f0033, Arbeitsbaum mit offenen Änderungen (design-tokens.css, tests/design-harmony-2b-theme.test.js, neue Docs).
Datum: 2026-11-22.

## Grundsatz

Ein stilles Ersetzen des installierten Profilpakets 1.0.2 durch den Repo-Stand 1.0.1 ist ein verbotener Downgrade. Dieser Bericht empfiehlt keine Lockerung von Signaturregeln, Vertrauensstufen oder Pfadprüfungen.

## Geprüft (Dateien und Zeilen, bestätigt durch Lesen)

- `src/modules/manager.js` (640 Zeilen), `src/modules/signature.js`, `src/modules/spec.js`, `src/updates/semver.js`
- `src/protocol.js` (Theme-Weg), `src/renderer/module.js` Z. 98-101, `src/renderer/shell.js` Z. 85-94
- `src/ipc.js` Z. 395-553 (Katalog- und Modulupdate-Installation), `src/main.js` Z. 50-79

Nicht geprüft: `src/updates/*` außer `semver.js` (Download, Zip-Entpacken, `assertManifestMatches`, Feed-Signatur), `src/protocol-path.js` (CSP-Inhalt), `src/modules/registry.js` im Detail, Tests. Aussagen dazu sind unten als Grenze markiert.

## Was ein späterer Updateweg nicht schwächen darf (bestätigt)

1. **Downgrade-Sperre** `manager.js` Z. 402-404: `compare(neu, installiert) < 0` führt zu `downgrade-blocked`. Sie greift auch bei Zeilen im Zustand `uninstalled`, da `row()` ohne Zustandsfilter liest. Vorabversionen werden durch `semver.compare` korrekt unter die Release-Version eingeordnet (1.0.2-x < 1.0.2). Repo 1.0.1 gegen installiert 1.0.2 wird damit abgewiesen.
2. **Reihenfolge der Prüfungen** in `installFromDirectory`: Paket lesen, Laufzeitwurzel, Core-Kompatibilität, Signatur/Vertrauen, Abhängigkeiten, Herausgeber, Vertrauensstufe, Downgrade, reservierte ID, erst danach Schreiben. Alle Ablehnungen liegen vor dem ersten Dateisystemschreibzugriff.
3. **Manifest- und Paketintegrität**: Manifest max. 64 KiB, Pflichtfelder, ID-Muster, Dateiliste max. 32 Einträge ohne Doppelungen, Dateien max. 512 KiB, Summe max. 2 MiB und exakt gleich `sizeBytes` (Z. 78). Pro Datei SHA-256, bei `readCourse` und `resolveHostedFile` bei jedem Zugriff erneut geprüft; Abweichung setzt das Modul auf `faulted`, löscht nichts, liefert nichts aus.
4. **Signatur** `signature.js`: Ed25519 über stabil sortiertes Manifest (ohne `signature`) plus alle Dateihashes. `verifyPackage` verlangt `algorithm === "ed25519"` und dass `signature.publicKey` dem übergebenen Schlüssel entspricht. Für `official` und `reviewed` muss der Schlüssel in `trustedKeys` stehen (`manager.js` Z. 260-265), sonst `signature-rejected`. `spec.js` Z. 204-209 verlangt die Signaturfelder für beide Stufen.
5. **Vertrauensstufe und Herausgeber sind fest**: anderer Herausgeber (Z. 396) und geänderte Stufe (Z. 399) werden abgelehnt. Reservierte IDs/Präfix `dev.desoworks.` nur für `official`, `dev.desoworks.it-ausbildung` nie installierbar (spec Z. 165 und manager Z. 406).
6. **Pfadvalidierung** `spec.js`: `assertRelativeFile` (kein `\`, kein NUL, kein absoluter/Laufwerkspfad, kein `..`/`.`, Endungen nur .json/.md/.png/.svg/.txt) und `assertPayloadPath` (nur `web/`, kein `..`, Endungsliste). `manager.js` ergänzt `path.relative`-Prüfung, `lstat` (keine Symlinks, nur Dateien), `realpath`-Prüfung gegen Paketwurzel, nochmals Zielpfadprüfung beim Kopieren (Z. 415-432), Nutzlast nur unter `web/`. `resolveHostedFile` liefert nur Dateien, die in `payloadHashes` stehen (Allowlist), mit Hash-Prüfung.
7. **Verbotene und nicht freigegebene Rechte**: `FORBIDDEN_PERMISSIONS` und `granted:false` für `ide.workspace`, `network`, `script`. Hosted-Web nur für Herausgeber `publisher.desoworks`, ID-Präfix `desoworks.`, Trust `private` (spec Z. 114-119) und nur aus `hostedWebRoots` (manager Z. 377-387).
8. **Trennung Paket und Benutzerdaten**: Pakete unter `dataDir/module-packages/<id>/<version>`, Lernstände in der SQLite-Tabelle `module_kv` (Schlüssel `progress`). Deinstallation löscht nur den erwarteten Pfad (Pfad- und Symlinkprüfung Z. 471-477) und lässt `module_kv` bestehen. Ein Update schreibt nur Paketdateien und die Zeile `module_install`, nicht `module_kv`.
9. **Fail-closed bei Schlüsseln**: `main.js` Z. 60-67 übergibt kein `trustedKeys`; der Default in `manager.js` Z. 203 ist leer. Heute ist damit keine `official`/`reviewed`-Installation möglich. Das darf ein Update nicht „reparieren“, indem Schlüssel aus dem Paket selbst übernommen werden.

## Theme-Weg: neuer Nachrichtenkanal? Bewertung: nein (bestätigt)

- Einziger Transport ist der Query-Parameter `academy-theme` an der Frame-URL (`module.js` Z. 98-101), gesetzt von der Shell aus dem validierten Root-Attribut.
- Der Host (`protocol.js`) wertet genau einen Wert gegen die Allowlist `hell|dunkel|kontrast` aus und schreibt immer ein Literal aus `THEMES`, nie den Rohwert (`themeFromUrl` Z. 55-65, `applyTheme` Z. 69-78). Mehrfachwerte, unbekannte Werte und Fehler ergeben `hell`.
- Rückkanal: Suche nach `postMessage` in `src/` ergab keinen Treffer. Das Modul kann über das Attribut nichts an die Shell senden; die Shell liest nur ihr eigenes `<html>`-Attribut.
- `resolveHostedFile` bekommt nur `url.pathname`; die Query beeinflusst weder Dateiauswahl noch Hashprüfung.
- Das Modul kann sein eigenes `data-academy-theme` beliebig setzen. Das betrifft nur seine eigene Darstellung, keine Rechte.

## Rollback bei fehlgeschlagener Installation heute

- Vor dem Schreiben abgelehnte Pakete (Signatur, Downgrade, Pfad, Größe): kein Schreibzugriff, bisheriger Stand unverändert.
- Kopierphase in `<id>/<version>.incoming`; Fehler dort hinterlässt höchstens ein `.incoming`-Verzeichnis, das beim nächsten Versuch gelöscht wird. Der alte Zielordner bleibt dabei unberührt.
- Danach `rmSync(dest)` und `renameSync(incoming, dest)` (Z. 433-434), dann der Registry-Upsert (Z. 437-449). Das ist keine Transaktion.
- Modulupdate über IPC (`ipc.js` Z. 512-550): vor der Installation wird nur das Paketverzeichnis des alten Standes nach `updates/modules/rollback/<id>/<Zeitstempel>` kopiert. Bei Fehler wird das entpackte `verified`-Verzeichnis entfernt und gemeldet, „die bisherige Modulversion bleibt“. Es gibt keinen Code, der den Snapshot zurückspielt.

## Lücken (bestätigt, sofern nicht anders markiert)

1. **Gleiche Version wird überschrieben** (MITTEL): Die Downgrade-Sperre prüft nur `< 0`. Ein Paket mit identischer Version, gleichem Herausgeber und gleicher Stufe ersetzt den Ordner (`rmSync(dest)` Z. 433). Für `private` ist das ohne Signatur möglich; ein anderer Inhalt unter derselben Versionsnummer wird nicht bemerkt.
2. **Rollback nicht belastbar bei gleicher Version** (MITTEL): Wird `dest` entfernt und danach scheitert `renameSync` oder der Registry-Upsert, existiert für dieselbe Version kein alter Ordner mehr; `readCourse` setzt das Modul danach auf `faulted`. Der Snapshot im IPC-Weg wird nicht automatisch zurückgespielt. Bei höherer Version bleibt der alte Ordner erhalten und die Registry zeigt weiter auf ihn; der neue Ordner bleibt verwaist liegen (Folge-Befund).
3. **Keine Transaktion zwischen Dateisystem und Registry** (MITTEL): Reihenfolge Rename, dann DB. Ein Abbruch dazwischen lässt Dateisystem und Registry auseinanderlaufen.
4. **Snapshot-Wildwuchs und kein Aufräumen** (NIEDRIG): `rollback/<id>/<Zeitstempel>` und alte Versionsordner werden nie bereinigt. Deinstallation löscht nur die aktuelle Version.
5. **Unsignierte `private`-Pakete tragen ihren Schlüssel selbst** (NIEDRIG/Hinweis): `verifyTrust` Z. 266 prüft eine mitgelieferte Signatur gegen den mitgelieferten Schlüssel. Das belegt Konsistenz, nicht Herkunft. Hosted-Web ist deshalb nur über `hostedWebRoots` und Herausgeberregeln geschützt, nicht über eine Signatur.
6. **`hostedWebRoots` enthält `dataDir/updates/modules/verified`** (`main.js` Z. 66; MITTEL, Teilbefund): Ein dort entpacktes Hosted-Web-Paket besteht die Herkunftsprüfung. Die Sicherheit hängt damit vollständig an Zip-Entpackung, Hashprüfung und `assertManifestMatches` im Updatedienst. Diese Teile wurden nicht gelesen und sind nicht bewertet.
7. **Zip-Entpackung und Feedsignatur ungeprüft** (Prüfgrenze, kein Befund): `extractZip`, `assertManifestMatches`, `downloadModule` und die Feed-/GitHub-Signaturkette wurden nicht geöffnet.
8. **Mögliche unbehandelte Ausnahme** (NIEDRIG, Verdacht, nicht ausgeführt): `serveModule` ruft `decodeURIComponent(url.hostname)` außerhalb von try/catch auf (`protocol.js` Z. 108, Aufruf Z. 134). Ob eine Hostangabe die Dekodierung zum Werfen bringt, wurde nicht getestet.
9. **Lernstände sind nicht versioniert** (NIEDRIG): `module_kv` führt keine Modulversion am Eintrag. Nach einem Update können Aufgaben-IDs aus einer älteren Version ins Leere zeigen; das ist ein Integritäts-, kein Rechteproblem. Ein Snapshot sichert `module_kv` nicht mit.
10. **Downgrade-Schutz nur in `installFromDirectory`** (INFORMATIV): Er gilt für alle drei Aufrufer in `ipc.js`, ist aber nicht in `preview` enthalten. Die Bestätigungsdialoge zeigen „Ersetzt Version X“ auch für einen späteren Downgrade und enden erst danach in `downgrade-blocked`. Das ist sicher, aber irreführend.

## Bezug auf das Repo 1.0.1 gegen installiert 1.0.2

Der Code lehnt dies über `downgrade-blocked` ab (Z. 402). Ein Update der installierten 1.0.2 aus dem Repo-Stand 1.0.1 darf nicht versucht, nicht umgangen und nicht durch Löschen der Registry-Zeile oder Umgehung von `row()` ermöglicht werden. Eine Installation wurde in dieser Prüfung nicht ausgeführt und das installierte Paket nicht angefasst.

## Grenzen der Prüfung

Reine Quelltextprüfung ohne Laufzeittest, ohne Ausführung der Tests und ohne Blick auf das installierte Paket oder die Registry-Datenbank. Historische Berichte ersetzen keine aktuelle Prüfung; die obigen Zeilenangaben gelten für HEAD 95f0033 mit dem genannten Arbeitsbaum. Die abschließende Freigabe liegt beim Commander.
