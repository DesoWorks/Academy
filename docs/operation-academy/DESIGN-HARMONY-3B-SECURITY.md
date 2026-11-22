# DESIGN HARMONY 3B – Sicherheitsprüfung: Same-Version-Überschreiben

**Prüfer:** RoboCop (Security Officer)
**Projekt:** Academy (IT-Ausbildung)
**Branch / HEAD:** `feature/phase-n1-release-connectivity` / `95f0033`
**Arbeitsbaum:** nicht sauber. `src/modules/manager.js` (39 Zeilen Diff) und `src/modules/spec.js` (5 Zeilen Diff) sind uncommittet geändert. Gelesen wurde der Arbeitsbaum, nicht HEAD. Der Diff selbst wurde in dieser Prüfung nicht gelesen.
**Art der Prüfung:** rein lesend. Es wurde kein Anwendungscode geändert und das Profil nicht beschrieben.

---

## 1. Befund

**Stufe: MITTEL** (Voraussetzungen siehe 1.4)

### 1.1 Bestätigtes Verhalten (Quelle: `src/modules/manager.js`, `installFromDirectory`, Zeilen 393–478)

| Zeile | Verhalten |
|---|---|
| 427–429 | `compare(pack.manifest.version, existing.version) < 0` führt zu `downgrade-blocked`. Bei Gleichstand (`== 0`) passiert nichts. |
| 434 | `dest = packageRoot/<id>/<version>`. Bei gleicher Version ist das exakt der Ordner der laufenden Installation. |
| 458 | `if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true })`, danach `renameSync(incoming, dest)`. Der Ordner der installierten Version wird gelöscht und durch den neuen Inhalt ersetzt. |
| 460–474 | `INSERT … ON CONFLICT(id) DO UPDATE` ersetzt `manifest_json` samt neuen `fileHashes` und `payloadHashes`. |

### 1.2 Folge

Die Integritätsprüfungen beim Öffnen (`readCourse`, Zeilen 308–345, und `resolveHostedFile`, Zeilen 533–553) vergleichen gegen die **gespeicherten** Hashes. Nach dem Überschreiben sind das die Hashes des neuen Inhalts. Ein ausgetauschter Inhalt unter derselben Versionsnummer wird deshalb später als „integer" akzeptiert. Der Austausch ist weder als Versionswechsel sichtbar noch durch die Integritätsprüfung erkennbar.

### 1.3 Welche Wege erreichen die Stelle (bestätigt per Suche)

`installFromDirectory` wird in `src/ipc.js` aus vier Stellen aufgerufen: Zeile 289 (Dateidialog), 326 (Beispielmodul), 425 (Katalog, mit Bestätigungsdialog) und 539 (`academy:module-update-install`).

- Der Update-Pfad (Zeile 539) ist durch `expectedSha256` des ZIPs (ipc.js 524–527) und `assertManifestMatches` (id/version) geschützt. Er verhindert aber nicht, dass ein Paket mit **gleicher** Version und anderem Inhalt installiert wird, solange das ZIP zum erwarteten Hash passt.
- Der Dialogtext bei Zeile 417 zeigt bei Gleichstand „Ersetzt Version X", also dieselbe Nummer wie die neue. Er weist nicht darauf hin, dass sich der Inhalt ändert.

### 1.4 Einordnung und Voraussetzungen

- **Official/reviewed:** signaturpflichtig (`verifyTrust`, Zeilen 279–284). Ein Austausch braucht einen gültigen Schlüssel. Das Restrisiko ist gering.
- **Private:** keine Pflichtsignatur. Ist eine Signatur vorhanden, wird sie gegen den vom Paket selbst mitgelieferten `publicKey` geprüft (Zeile 285 und `signature.js`, Zeile 29). Das beweist nur innere Konsistenz, keine Herkunft. Die Prüfung `publisher.id` (Zeile 421) vergleicht eine selbst deklarierte Zeichenkette. Wer ein Paket mit gleicher ID, gleichem `publisher.id` und gleicher Version zur Installation vorlegen kann, ersetzt den Inhalt. Voraussetzung ist ein Installationsvorgang (Dateidialog mit Nutzer, Katalog mit Bestätigung oder ein vorbereitetes Update), kein Remote-Zugriff.
- **Hinweis zum Theme-Vertrag:** Der Vertrag wird bei Installation geprüft (Zeile 410–415). Er ändert nichts am Befund.

### 1.5 Weitere Beobachtungen (nicht Teil der Korrektur)

- **INFORMATIV, unbestätigt:** Der Signaturinhalt (`signature.js`, `payloadFor`) deckt Manifest und `files`-Hashes ab. Ob `academy-module.json` selbst in `manifest.files` steht, wurde nicht geprüft. Eine Rechteänderung im Manifest bei identischen Dateihashes ist daher nicht ausgeschlossen. Die vorgeschlagene Korrektur schließt sie für gleiche Versionen mit ab (Manifestvergleich).
- **NIEDRIG:** Zeile 458/459 ist nicht atomar. Bricht der Prozess zwischen `rmSync(dest)` und `renameSync` ab, zeigt die Datenbank auf einen fehlenden Ordner. Beim nächsten Öffnen wird das Modul als `faulted` markiert (`readCourse`). Daten gehen nicht verloren, das Modul fällt aber aus.
- **NIEDRIG:** Der Rollback-Snapshot (`ipc.js` 531–534) wird angelegt, aber im Fehlerfall nicht automatisch zurückgespielt. Bei Fehlern **vor** Zeile 458 ist das unkritisch, da `dest` dort nicht angefasst wurde.
- **UNBEKANNT:** `VERSION_PATTERN` (`semver.js`) erlaubt führende Nullen (`01.0.2`), und `compare` parst per `parseInt`. `compare("01.0.2","1.0.2") == 0` bei unterschiedlichen Zeichenketten und damit unterschiedlichen Zielordnern. Ob `spec.js` das vorher ablehnt, wurde nicht geprüft.

---

## 2. Lerndaten

- `module_kv` ist eine eigene Tabelle (`registry.js` Zeile 58). Der Installationspfad schreibt nur `module_install`. Beim Überschreiben wird `module_kv` nicht berührt (Zeilen 462–474 enthalten keine Anweisung dafür).
- `uninstall` lässt `module_kv` bewusst erhalten (Zeilen 504–506). Test `tests/modules.test.js` Zeile 314–331 belegt das.
- Das Risiko des Befunds liegt also im **Paketinhalt**, nicht im Lernstand.

---

## 3. Bewertung der Sperre

### 3.1 Naive Sperre (`compare <= 0` abweisen): **abgelehnt**

Sie bricht zwei erlaubte Abläufe:

1. **Neuinstallation nach Deinstallation** mit gleicher Version. Der Test `modules.test.js` Zeile 327 installiert dasselbe Paket nach `uninstall` erneut und erwartet den erhaltenen Lernstand. Die Zeile in `module_install` bleibt mit `state = 'uninstalled'` bestehen, also greift der Block `if (existing)`.
2. **Reparatur eines `faulted`-Moduls.** `setState` verweigert die automatische Reaktivierung (Zeile 485–487). Der einzige Weg zurück ist eine Neuinstallation, die bei gleicher Version scheitern würde.

### 3.2 Inhaltsgleichheit bei gleicher Version: **erlaubt**

Bei `compare == 0` wird installiert, **nur wenn der eingehende Inhalt dem gespeicherten entspricht**. Es braucht keine Datenmigration und keine Schemaänderung.

**Empfohlene Korrektur (genau eine):**

In `installFromDirectory`, direkt nach dem Downgrade-Check (nach Zeile 429) und vor jeder Dateioperation (vor Zeile 434):

```js
if (compare(pack.manifest.version, existing.version) === 0) {
  assertSameVersionIdentical(previous, pack);   // neue lokale Funktion
}
```

`assertSameVersionIdentical` wirft `same-version-different-content` (Meldung: „Gleiche Versionsnummer, aber anderer Inhalt. Bitte die Version erhöhen. Es wurde nichts verändert."), wenn eines davon abweicht:

1. `pack.files[*].sha256` ≠ `previous.fileHashes` (gleiche Schlüsselmenge und Werte).
2. `pack.payload.files[*].sha256` ≠ `previous.payloadHashes`.
3. Das Manifest ohne `signature`, `fileHashes`, `payloadHashes`, `payloadBytes`, `sizeBytes` ist nach `stable()` nicht JSON-gleich. Das deckt Rechte, Laufzeit, Theme-Vertrag und Herausgeber ab.
4. `previous.fileHashes` oder `previous.payloadHashes` fehlen (Altzeile): **geschlossen scheitern**. Der Commander sollte wissen, dass das eine Altzeile ohne Hashes nur über eine höhere Version erneuern lässt.

**Warum das sicher ist:**

- Alle Vergleichswerte liegen schon vor (`pack.files`, `pack.payload.files`, `existing.manifest_json`). Es gibt keinen neuen I/O-Pfad und kein neues Datenformat.
- Die Prüfung läuft vor `rmSync` und vor dem `INSERT`. Bei Ablehnung bleiben Paketordner, Datenbankzeile und `module_kv` unverändert.
- `verifyTrust`, Trust-Mismatch, Publisher-Mismatch, Downgrade-Check und der Hash-Check des ZIPs bleiben unverändert und laufen davor. Die Korrektur fügt nur eine Bedingung hinzu und lockert nichts.
- Die erlaubten Abläufe (Neuinstallation nach Deinstallation, Reparatur von `faulted`) bleiben möglich, weil dort derselbe Inhalt erneut eingespielt wird.
- Ein Entwickler, der denselben Versionsstand mit geändertem Inhalt testen will, muss die Version erhöhen. Das ist gewollt.

**Status der Korrektur: ERLAUBT.** Ohne Freigabe des Commanders wurde sie nicht umgesetzt.

**Zu testen (für GLaDOS/Jarvis):** (a) gleiche Version, anderer Dateiinhalt wird abgelehnt, Ordner und DB unverändert; (b) gleiche Version, anderes `permissions`-Feld bei gleichen Dateien wird abgelehnt; (c) Deinstallation und identische Neuinstallation klappt weiter (vorhandener Test Zeile 314); (d) `faulted`-Modul mit identischem Paket wird repariert; (e) höhere Version installiert weiter; (f) `module_kv` vorher/nachher identisch.

---

## 4. Was ein Updateversuch nicht anfassen darf

| Objekt | Grund |
|---|---|
| `module_kv` (alle Zeilen) | Lernstände. Ein fehlgeschlagener oder abgelehnter Versuch darf sie nicht lesen-ändern, schreiben, löschen oder migrieren. |
| Benutzerprofil `C:\Users\<Benutzer>\AppData\Roaming\DesoWorks\Academy` | Produktivdaten des Commanders. Proben laufen nur gegen ein temporäres Profil. |
| Signaturregeln (`verifyTrust`, `trustedKeys`, `signature.js`) | Keine Lockerung, keine neue Ausnahme. Das Private-Vertrauensmodell bleibt unverändert. |
| App-ID | Muss gleich bleiben, sonst wechselt das Profilverzeichnis und die Lernstände scheinen zu verschwinden. |
| Downgrade-Sperre (Zeile 427) | Bleibt. Die neue Prüfung wird ergänzt, nicht ersetzt. |
| Hash-Prüfungen (`expectedSha256`, `assertManifestMatches`, Payload-Index) | Bleiben unverändert und laufen vor der Installation. |
| Publisher-/Trust-Mismatch (Zeilen 421–426) | Bleiben unverändert. |
| Installierter Paketordner und `module_install`-Zeile bei Fehlschlag | Müssen nach einem abgelehnten Versuch byte-gleich bleiben. |

---

## 5. Grenzen der Prüfung

- Reine Codelesung. Es wurde nichts ausgeführt, keine Tests gestartet, kein Same-Version-Paket praktisch eingespielt. Die Wirkung (Überschreiben, Hash-Neuberechnung) ist aus dem Code abgeleitet, nicht durch einen Lauf bewiesen.
- `src/modules/spec.js` (Validierung, Theme-Vertrag, `files`-Regeln) und der uncommittete Diff in `manager.js` wurden nicht gelesen.
- Die Frage, ob `academy-module.json` in `manifest.files` steht, ist offen.
- Das Verhalten bei führenden Nullen in der Version ist ungeprüft.
- Historische Berichte (`DESIGN-HARMONY-3-SECURITY*.md`) wurden nicht als Beleg verwendet.
- Die Freigabe über Release und Umsetzung liegt beim Commander.
