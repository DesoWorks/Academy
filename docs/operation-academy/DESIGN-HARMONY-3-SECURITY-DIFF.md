# Design Harmony 3 – Sicherheitsprüfung des Diffs (Theme-Vertrag 3)

Prüfer: RoboCop (Security Officer). Art: nur lesend; kein Anwendungscode geändert, nichts installiert, kein Commit.
Projekt: Academy, `D:\Desoworks\Workspace\Academy`, Branch-Stand HEAD 95f0033 mit offenem Arbeitsbaum.
Datum: 2026-11-22. Maßstab: `DESIGN-HARMONY-3-SECURITY.md` (Ist-Stand und Grenzen).

## Ergebnis

- Signaturprüfung geschwächt: **nein**
- Downgrade-Sperre geschwächt: **nein**
- Pfadvalidierung geschwächt: **nein**
- Trennung `module_kv` geschwächt: **nein**
- Stilles Ersetzen von 1.0.2 durch 1.0.1: **weiter blockiert**

Bestätigte Befunde mit Schweregrad MITTEL oder höher aus diesem Diff: **keine**.

## Geprüfter Diff

`git diff` für `src/modules/manager.js`, `src/modules/spec.js`, `src/renderer/module.js`, `src/renderer/shell.js`, `modules/it-systemintegration/academy-module.json`. Die Tests (`tests/hosted-module.test.js`, `tests/design-harmony-3-theme-contract.test.js`) habe ich nicht gelesen und nicht ausgeführt.

## Einzelbewertung

1. **Downgrade-Sperre** (`manager.js` Z. 427-429, `compare(neu, existing.version) < 0` führt zu `downgrade-blocked`): im Diff **nicht berührt**. Die Sperre liegt weiter hinter den Prüfungen auf Herausgeber und Vertrauensstufe und vor jedem Schreibzugriff. Repo 1.0.1 gegen installiert 1.0.2 wird weiter abgewiesen. Die Manifestversion im Repo bleibt 1.0.1 (`academy-module.json` Z. 11); der Diff hebt sie nicht an und führt keinen Sonderweg ein.
2. **Signatur und Vertrauen** (`verifyTrust`, `signature.js`, `trustedKeys`): unverändert. Der Aufruf `verifyTrust(...)` steht weiter vor Abhängigkeitsprüfung und Downgrade-Sperre. Die Repo-Manifestdatei ist `trust: private` ohne Signatur; das neue Feld `runtime.themeContract: 1` (Z. 36 des Manifests) macht daher keine bestehende Signatur ungültig. Sollte das Paket später signiert werden, deckt die Signatur das Feld ab.
3. **Neue Prüfung `incompatible-theme`** (`manager.js` ca. Z. 410-415, in `installFromDirectory`): zusätzliche Ablehnung für Hosted-Web-Pakete ohne oder mit nicht unterstütztem Theme-Vertrag. Sie steht **vor** `verifyTrust` und vor dem ersten Schreibzugriff. Das ändert nur die Reihenfolge der Ablehnungsgründe, nicht ihre Wirksamkeit. Sie verschärft die Annahme, sie lockert nichts.
4. **Neue Laufzeitprüfung** (`manager.js` ca. Z. 516-522 in der Öffnen-Funktion und ca. Z. 539 in `resolveHostedFile`): ein inkompatibles Hosted-Modul wird weder geöffnet noch ausgeliefert (`return null`). Das ist strenger als vorher. Der Allowlist-Mechanismus über `payloadHashes` und die Hashprüfung sind unverändert.
5. **Pfadvalidierung** (`assertRelativeFile`, `assertPayloadPath`, `realpath`/`lstat`, Zielpfadprüfung beim Kopieren, `resolveHostedFile`-Pfadprüfung): keine Änderung im Diff. `spec.js` ergänzt nur die Validierung von `runtime.themeContract` (positive Ganzzahl, sonst `invalid-manifest`) und die Konstante `THEME_CONTRACT_SUPPORTED`.
6. **Trennung `module_kv`**: Der Diff enthält keine Zeile, die `module_kv` liest, schreibt oder löscht. `publicRow` liefert zusätzliche Anzeigefelder (`compatibilityReason`, `themeContract`, `availableVersion`); der Fortschritt bleibt separat.
7. **Renderer** (`module.js`, `shell.js`): Texte werden weiter über `text(...)`/`el(...)` gesetzt (kein `innerHTML` im Diff). Die Öffnen-Schaltfläche entfällt bei inkompatiblen oder nicht aktiven Modulen; das ist reine Anzeige und kein Sicherheitsmerkmal (die Sperre liegt im Manager). `encodeURIComponent` für den Link bleibt.
8. **`updateAvailable`** wechselt von `false` auf `null`, `availableVersion` ist `null`. Das behauptet nicht mehr „Aktuell“ ohne Prüfung; fachlich korrekt und ohne Sicherheitsauswirkung.

## Beobachtungen (NIEDRIG/INFORMATIV, keine Schwächung)

- INFORMATIV: Ein bereits installiertes Hosted-Modul 1.0.2, dessen Manifest kein `themeContract` trägt, würde durch die neue Logik als inkompatibel angezeigt und nicht geöffnet. Das ist Verhalten, keine Sicherheitslücke. Ich habe das installierte Paket nicht geprüft; ob 1.0.2 das Feld trägt, ist **nicht verifiziert**.
- INFORMATIV: Die bestehenden Lücken aus `DESIGN-HARMONY-3-SECURITY.md` (Überschreiben gleicher Version, fehlende Transaktion, ungeprüfte Zip-Entpackung und Feedsignatur) sind durch diesen Diff weder behoben noch verschlimmert.

## Grenzen der Prüfung

Reine Quelltextprüfung des Diffs. Keine Testausführung, kein Laufzeitversuch einer Installation, installiertes Paket und Registry-Datenbank nicht angesehen, `src/updates/*`, `signature.js` und `protocol.js` nicht erneut gelesen (dort zeigt der Diff keine Änderungen). Die abschließende Freigabe liegt beim Commander. Kein Push, kein Merge nach main, keine Änderung an App-ID oder Signaturregeln.
