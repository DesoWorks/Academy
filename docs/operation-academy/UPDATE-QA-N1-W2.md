# Operation Academy – Update-QA N.1 / Welle 2

**Prüfrolle:** unabhängige QA · **Arbeitsbasis laut Lead:** `feature/phase-n1-release-connectivity`, `e558c14` (nicht erneut per Git geprüft).  
**Umfang:** explizit beauftragte unabhängige Testdatei; kein Produktionscode geändert.  
**Urteil:** **EINGESCHRÄNKT**. Der gezielte Testlauf ist erfolgreich (6 bestanden, 0 fehlgeschlagen, 0 übersprungen). Das ist kein Beleg für einen vollständigen Updateablauf: insbesondere wurde ein fehlgeschlagener Download nur über den Check-/Quellenfehlerpfad geprüft, nicht nach erfolgreich vorbereitetem Updatezustand. Windows-A/B ist ausdrücklich offen.

## Testlauf

Befehl: `node --test tests/phase-n1-w2-qa.test.js`  
Ergebnis: 6 Tests, 6 bestanden, 0 fehlgeschlagen, 0 übersprungen (Exitcode 0).

| Prüffall | Ergebnis | Beleg / Einschränkung |
|---|---|---|
| Gültige Ed25519-Signatur | BESTANDEN | `verifyManifest` akzeptiert Signatur über unveränderte Rohbytes. |
| Ungültige Signatur | BESTANDEN | 64 Nullbytes als Signatur werden abgewiesen. |
| Manipulierte Manifestbytes | BESTANDEN | Abweichende Bytefolge bei sonst gültiger Signatur wird abgewiesen. |
| Falscher öffentlicher Schlüssel | BESTANDEN | Signatur mit unabhängig erzeugtem anderen Schlüssel wird abgewiesen. |
| Falscher Kanal | BESTANDEN | Strikte Kandidatenauswahl liefert kein verfügbares Update bei Kanalwiderspruch. |
| Downgrade | BESTANDEN | Version unterhalb der installierten Version wird nicht verfügbar. |
| Ungültiger Manifest-SHA-256 verhindert Download/Installation | BESTANDEN | Integrationstest mit signiertem Manifest und ungültigem Hash: Update nicht verfügbar/ready; Installer-URL wurde nicht angefordert. |
| Fehlgeschlagener Download lässt Installation unangetastet | EINGESCHRÄNKT | Quellen-/Checkfehler bei bestehender Lerndatei; Datei unverändert. Kein Download eines zuvor freigegebenen Kandidaten simuliert. |
| Abgebrochene Installation hinterlässt benannten Zustand | BESTANDEN | Persistierter `installing`-Status wird via `reconcile()` zu `interrupted`, Fehlercode `install-interrupted`. Simuliert Neustart-Reconciliation, nicht tatsächliches Prozessabwürgen während eines Windows-Installers. |
| Lernstände und Module bleiben erhalten | BESTANDEN | Update-Service-Check bleibt ohne Veränderung zweier vorher angelegter Dateien. Keine Installation ausgeführt. |

Kein Fall wurde übersprungen. Es gibt keine Behauptung, dass ein `node:test`-Lauf die Windows-Installation abdeckt.

## Offen / nicht ausgeführt

- **Windows A/B-Update:** NICHT AUSGEFÜHRT – im Paket ausdrücklich nicht beauftragt. Nachweis von Installieren A → Erkennen/Herunterladen/Prüfen/Installieren B → Neustart sowie realem Erhalt von Lernständen, Einstellungen und Modulen steht aus.
- Echter Installationsabbruch und Wiederanlauf auf Windows: nicht ausgeführt.
- Vollständige Projekttests (`npm test`), Paketbau und Git-Status: nicht ausgeführt.
- Die parallele JARVIS-Arbeit kann den geprüften Arbeitsstand nachträglich verändern; Testlauf dokumentiert nur den Zustand zum Ausführungszeitpunkt.

## Geänderte Dateien

- `tests/phase-n1-w2-qa.test.js` – unabhängige gezielte Regressionstests.
- `docs/operation-academy/UPDATE-QA-N1-W2.md` – dieser Bericht.

Keine `src`-Datei verändert. Kein Commit, kein Push.


## Nachtrag – vollständige Suite (2026-11-22)

- Ausgeführt: `node --test tests/` im Projektverzeichnis.
- Ergebnis dieses tatsächlich ausgeführten Laufs: **131 Tests, 131 bestanden, 0 fehlgeschlagen, 0 übersprungen** (Exitcode 0; Dauer 5126 ms).
- **Umgebungsabweichung:** Der geforderte Lauf mit `TEMP=D:\jarvis-tmp` und `TMP=D:\jarvis-tmp` konnte nicht gestartet werden. Der autonome Shell-/Verify-Runner verweigerte die Befehle wegen des nicht freigegebenen externen Laufwerkspfads; auch das Anlegen eines Markers dort wurde verweigert. Die obigen Testergebnisse belegen daher ausschließlich den Lauf mit der Runner-Standardumgebung und ersetzen den angeforderten D:-TEMP-Lauf nicht.
- Windows-A/B-Update: **NICHT AUSGEFÜHRT**.
- Kein Quellcode und keine Testdatei geändert; kein Commit.
