# QA-Teststrategie – Operation Academy, Phase N: Continuous Delivery

**Prüfgegenstand:** Updatekanäle DEV, BETA und STABLE sowie GitHub-basierte Veröffentlichung  
**Grundlage:** Quellcode und vorhandene Tests unter `tests/`; `docs/operation-academy/UPDATE-QA-M.md`; `docs/operation-academy/WINDOWS-UPDATE-TEST-M.md`.  
**Prüfmodus:** Dokumenten- und Codeprüfung. In diesem Auftrag wurden keine Tests ausgeführt und kein Windows-Lauf durchgeführt. Vorhandene Testfälle werden daher als vorhandene Testabdeckung, nicht als von QA frisch bestandene Ausführung angegeben.

## Bewertungsmaßstab

- **VORHANDEN:** Code und/oder ein vorhandener Test decken den genannten Teilaspekt ab. Das ist keine Aussage über eine frische Ausführung.
- **LÜCKE:** Für das Kriterium ist im geprüften Code/Testbestand kein hinreichender Nachweis vorhanden oder die verlangte Funktion ist dort nicht umgesetzt.
- **NUR LOKAL BELEGT:** Der Phase-M-Bericht dokumentiert einen tatsächlichen lokalen Windows-Ablauf, aber keinen GitHub-/Remote-Nachweis. Es handelt sich um den gelesenen Fremdbericht, nicht um eine von mir reproduzierte Prüfung.

## Abnahmesätze und Belegzuordnung

| Phase-N-Abnahmesatz / Kriterium | Einstufung | Beleg und Grenze |
|---|---|---|
| Releases werden nach dem ausgewählten Kanal gefiltert: DEV darf Prereleases erhalten; STABLE darf keine Prereleases installieren. | **VORHANDEN** für DEV/STABLE-Filterlogik | `tests/phase-m-updates.test.js` prüft DEV-Prerelease-Auswahl und, dass STABLE das DEV-Angebot nicht als verfügbar meldet. `tests/updater.test.js` prüft, dass ein DEV-Build kein produktives Stable-Release installiert. `src/updates/feed.js` setzt `stable` gegen `release.prerelease`. Kein GitHub-Lauf. |
| DEV, BETA und STABLE sind drei getrennte und auswählbare Kanäle mit jeweils eigener Filter- und Updatepolitik. | **LÜCKE** | In `src/updates/service.js` wird nur `stable` gesondert behandelt; jeder andere Wert wird intern zu `dev`. `src/updates/feed.js` unterscheidet `stable` von allen Nicht-Stable-Kanälen. BETA besitzt damit keine belegte eigene Filterung. In geprüften Update-Tests findet sich kein BETA-Testfall. |
| Versionsreihenfolge ist SemVer-korrekt, insbesondere `0.3.1-dev.2 < 0.3.1-dev.10`; Downgrades werden verhindert. | **VORHANDEN** für Vergleich/Installationsschutz; Lauf nicht frisch ausgeführt | `tests/phase-m-semver-fix.test.js` und `tests/phase-m-qa-semver.test.js` prüfen den konkreten Zahlenvergleich und weitere Prerelease-Rangfolgen. `tests/phase-m-semver-fix.test.js` prüft außerdem sichere Versionsstrings. `src/updates/service.js` verhindert im `installPlan` gleiche oder ältere Core-Versionen. `tests/modules.test.js` prüft einen Modul-Downgrade. Kein Test belegt eine tatsächlich installierte GitHub-Version. |
| Releasepakete werden vor Bereitstellung gegen SHA-256 geprüft; falsche oder fehlende Hashes werden abgewiesen. | **VORHANDEN** für lokale Service-/Modulpaketfälle | `tests/updater.test.js` prüft falschen und korrekten Installer-Hash, fehlenden Hash und die Entfernung unvollständiger Downloads. `tests/phase-m-updates.test.js` prüft falsche Modulprüfsumme. `tests/update-integrity.test.js` prüft fehlende Prüfsumme und Downloadabbruch. Zusätzlich dokumentiert `WINDOWS-UPDATE-TEST-M.md` einen falschen und anschließend korrekten Hash im lokalen DEV-A/B-Lauf (**NUR LOKAL BELEGT**). GitHub-Artefakt und Remote-Redirect-Kette sind dadurch nicht als End-to-End-Lauf bestätigt. |
| Signaturstatus wird kanalabhängig korrekt ausgewertet; STABLE startet nur mit erwarteter Herausgebersignatur. | **VORHANDEN** als Unit-/Planprüfung; echte Stable-Signatur **LÜCKE** | `tests/updater.test.js` prüft, dass Stable ohne Signatur bzw. Prüffunktion blockiert wird und mit injizierter erfolgreicher Prüffunktion einen Installationsplan erhält. `tests/update-integrity.test.js` prüft die Ablehnung einer unsignierten Datei durch `verifyPublisher`. `tests/phase-m-updates.test.js` dokumentiert DEV ohne Herausgeberzertifikat und Stable gesperrt. Im `WINDOWS-UPDATE-TEST-M.md` waren beide Installer unsigniert; ein echtes signiertes GitHub-Stable-Paket mit echtem Zertifikat ist nicht belegt. |
| Ein Release aus einem anderen Kanal darf nicht versehentlich als Update akzeptiert werden. | **TEILWEISE VORHANDEN; BETA-Abdeckung LÜCKE** | DEV-vs-STABLE wird in `tests/phase-m-updates.test.js` geprüft. Ein eigenständiger BETA-Kanal und Übergänge DEV↔BETA↔STABLE sind nicht implementiert/belegt. Für Release-Quellen-Pinning existieren Fälle in `tests/update-integrity.test.js`, dies ersetzt keinen Kanaltest. |
| Nutzer können den Kanal wechseln; Wechsel und Folgeverhalten sind sicher und nachvollziehbar. | **LÜCKE** | Kein gelesener Test prüft Kanalwechsel, persistierte Kanalauswahl, ungültige Kanalwerte, Übergang auf niedrigere Versionen oder Bestätigung beim Wechsel. Der aktuelle Service normalisiert Kanäle auf `stable` oder `dev`; eine vollständige Wechselpolitik ist damit nicht nachgewiesen. |
| Ein Core-Update ersetzt bzw. verändert keine Moduldateien. | **TEILWEISE VORHANDEN** | `tests/phase-m-updates.test.js` prüft, dass ein Core-Download kein ZIP-Modulpaket mitnimmt. `tests/modules-preserved.test.js` prüft Core-Paketierung/Abgrenzung, nicht den echten Austausch aller installierten Moduldateien durch einen Core-Installer. Der Bericht `WINDOWS-UPDATE-TEST-M.md` dokumentiert Core-Update, bei dem das Modul auf `1.0.1` blieb (**NUR LOKAL BELEGT**); keine Dateihash-Inventur vor/nach GitHub-Update. |
| Lernstand und Daten bleiben nach Core-Update, Modulupdate und fehlgeschlagenem Update erhalten. | **TEILWEISE VORHANDEN; Windows-A/B nur lokal belegt** | `tests/phase-m-updates.test.js` prüft bei fehlgeschlagenem Modulupdate Modulversion und Lernstand. `tests/updater.test.js` und `tests/persistence.test.js` prüfen Datenintegrität in Update-/Persistenzfehlerfällen. `WINDOWS-UPDATE-TEST-M.md` dokumentiert erhaltenen Lernstand nach Core- und Modulupdate sowie nach fehlgeschlagenem Installer (**NUR LOKAL BELEGT**). Ein Windows-A/B-Test über GitHub ist offen, bis ein echter Lauf vorliegt. |
| GitHub-Releasepipeline veröffentlicht die drei Kanäle mit korrekten Versionen, Manifesten, Assets und Hashes. | **LÜCKE** | Die gelesenen Phase-M-QA-Berichte dokumentieren einen temporären lokalen Feed auf `127.0.0.1:47321`; `UPDATE-QA-M.md` hält GitHub-/Remote-Veröffentlichung ausdrücklich für nicht nachgewiesen. Code-/Testbelege für die Phase-N-GitHub-Pipeline wurden in diesem Prüfbestand nicht gefunden. |
| GitHub-Clientintegration lädt nur aus dem vorgesehenen Repository und prüft Metadaten/Assets. | **VORHANDEN** auf Unit-Ebene; Remote-Lauf **LÜCKE** | `tests/update-integrity.test.js` prüft Repository-Pinning gegen fremde Repositories, Pfadtricks und ungültige Metadaten. `src/updates/feed.js` enthält `PINNED_REPOSITORY` und Asset-Prüfungen. Kein echter GitHub-Release- oder Redirect-End-to-End-Test in den gelesenen Protokollen. |
| Windows-Installation/A-B-Update über GitHub ist erfolgreich und erhält Module sowie Lernstand. | **LÜCKE / offen** | `WINDOWS-UPDATE-TEST-M.md` dokumentiert A/B nur über den lokalen Loopback-Feed, nicht GitHub. Die frühere lokale Evidenz ist ausdrücklich kein GitHub-Nachweis. Abnahme bleibt offen, bis ein echter Windows-Lauf den GitHub-Feed verwendet und Version, Hash/Signaturstatus, Moduldateien und Lernstand protokolliert. |

## Vorhandene relevante Tests (nicht in diesem Auftrag ausgeführt)

- `tests/phase-m-updates.test.js` – DEV-Prerelease, Stable-Filter, Hashfehler eines Moduls, Trennung Core-/Moduldownload, Modulmanifest-/Fehlerfall.
- `tests/phase-m-semver-fix.test.js` – numerische Prerelease-SemVer, Rangfolge, sichere Versionswerte.
- `tests/phase-m-qa-semver.test.js` – SemVer-Rangfolge, einschließlich `dev.2` gegen `dev.10`.
- `tests/updater.test.js` – DEV/STABLE-Schranke, SHA-256, Abbruch, Wiederanlaufstatus, Sicherung, Installationsplan, Downgrade-Schutz.
- `tests/update-integrity.test.js` – Repository-Pinning, ungültige Metadaten, Abbruch, Herausgeberprüfung, fehlende Prüfsumme.
- `tests/modules.test.js` – Modul-Downgrade, Daten-/Modulisolation und Signaturregeln für Module (nicht die Core-Update-Signatur).
- `tests/modules-preserved.test.js` – Core-Bündelung und Moduldatei-/Plattformabgrenzung; kein vollständiger Core-Update-Dateivergleich.
- `tests/persistence.test.js` – Erhalt von Lerndaten bei Migrations-, Import- und Sicherungsfehlern.

## Vorgeschlagene neue Testdateien und Testfälle

Die folgenden Dateien sind Vorschläge, keine in diesem Auftrag angelegten Testdateien. Die Tests sollen erst nach Implementierung der Phase-N-Funktionen erstellt und ausgeführt werden.

1. **`tests/phase-n-channel-selection.test.js`**
   - DEV akzeptiert nur die festgelegte DEV-Releaseklasse; BETA akzeptiert nur BETA; STABLE akzeptiert nur stabile Releases.
   - Für jeden Kanal gemischten Feed mit Releases aller drei Kanäle anbieten; nur korrekte Klasse darf ausgewählt/heruntergeladen werden.
   - Fremde Kanalpakete, fehlende Kanalmetadaten und widersprüchliche Prerelease-Flags ablehnen; Download darf nicht starten.
   - Sicherstellen, dass ungültige/alte Kanalwerte nicht stillschweigend zu DEV normalisiert werden.

2. **`tests/phase-n-semver-downgrade.test.js`**
   - Prüfen `0.3.1-dev.2 < 0.3.1-dev.10` in Auswahl, Angebot und Installationsplan, nicht nur im isolierten Comparator.
   - Gleichstand, Rückwärtsversion, Stable→älteres BETA/DEV sowie Wechsel mit niedrigerer Kanalversion blockieren oder gemäß expliziter Produktentscheidung bestätigen lassen.
   - Ungültige SemVer-Metadaten ohne Datei-/Download-Nebenwirkung ablehnen.

3. **`tests/phase-n-update-integrity.test.js`**
   - Korrekten SHA-256 akzeptieren; falsche, fehlende, ungültig formatierte oder während Download/Redirect abweichende Prüfsumme zurückweisen; keine Installerdatei zurücklassen.
   - Signaturzustände `Valid`, fehlend, ungültig, falscher Herausgeber und Prüfwerkzeugfehler je Kanal prüfen.
   - DEV/BETA-Verhalten und STABLE-Sperre anhand der vereinbarten Richtlinie prüfen; niemals Signaturstatus mit bloßem Hash gleichsetzen.

4. **`tests/phase-n-channel-switch.test.js`**
   - Persistenz und Neustart nach DEV↔BETA↔STABLE-Wechsel prüfen.
   - Prüfen, dass Wechsel keine bereits vorbereitete Datei eines anderen Kanals installiert; Kanalwechsel muss laufende/alte Angebote invalidieren oder sicher neu verifizieren.
   - Wechsel in einen Kanal mit niedrigerer Version, ungültige Einstellung und Abbruch während des Wechsels prüfen.

5. **`tests/phase-n-core-module-isolation.test.js`**
   - Vor/nach Core-Update Moduldateien per Pfad und Hash vergleichen; alle Moduldateien müssen unangetastet bleiben.
   - Core-Installer darf keine Modulupdate-ZIP-Datei konsumieren; Modulupdate darf keine Core-Dateien ersetzen.
   - Fehler-/Abbruch-/Neustartfälle sowie mehrere installierte Module prüfen.

6. **`tests/phase-n-learning-state.test.js`**
   - Lernstand, Bewertungen, Einstellungen und Sicherungen vor/nach Core-Update, Modulupdate, Kanalwechsel und Neustart vergleichen.
   - Fehler vor Backup, während Download, beim Installerstart und nach unterbrochener Installation prüfen; keine Datenverluste oder stillen Rücksetzungen.

7. **`tests/phase-n-github-release.test.js`**
   - GitHub-Release-Manifest und Assets für DEV/BETA/STABLE gegen Repository-Pinning, Tags, Kanalmetadaten, Hashdateien und Signaturartefakte testen.
   - Drafts, falsche Tags, fehlende/duplizierte Assets, fremde Repository-URLs und Redirects ablehnen.
   - Authentifizierungs-/Rate-Limit-/Offlinefehler ohne Geheimnisleck oder unvollständige Installation behandeln.

8. **`tests/phase-n-windows-github-ab.test.js`** (Windows-Integrationstest bzw. reproduzierbares manuelles Protokoll)
   - Saubere A-Installation, Update auf B aus echtem GitHub-Release, Dateiversion und Kanal verifizieren.
   - Hash und Signaturstatus protokollieren; Moduldatei-Hashes sowie Lernstand vor/nachher vergleichen.
   - Fremdkanalangebot, absichtlich falschen Hash und abgebrochenen Lauf prüfen; erwartete Ablehnung und Datenintegrität belegen.
   - Rohprotokoll, Release-URL, Build-/Commit-Identität, Windows-Version und Ergebnisartefakte sichern. Dieser GitHub-Windows-A/B-Test bleibt offen, bis ein echter Lauf vorliegt.

## Abnahmehinweise

- Der Phase-M-Bericht `docs/operation-academy/UPDATE-QA-M.md` ist ein gelesener QA-Bericht, aber keine Phase-N-Abnahme. Er stellt den damaligen GitHub-/Remote-Weg als nicht vorhanden bzw. nicht nachgewiesen dar.
- `docs/operation-academy/WINDOWS-UPDATE-TEST-M.md` dokumentiert einen lokalen A/B-Lauf `0.3.1-dev.1` → `0.3.1-dev.2` über `http://127.0.0.1:47321`; das Modul blieb zunächst `1.0.1`, danach erfolgte ein getrenntes Modulupdate auf `1.0.2`. Diese Beobachtung ist **nur lokal belegt**.
- Der SemVer-Fix für `dev.2` gegen `dev.10` ist im Quell-/Testbestand belegt, nicht als Verhalten eines installierten Builds `0.3.1-dev.2`.
- Die Testdateien wurden in diesem Auftrag gelesen, aber nicht ausgeführt. Es wird kein Testlauf als bestanden behauptet.
- Keine Produktionsdatei, Testdatei, Build- oder Installerdatei wurde in diesem Auftrag geändert oder erzeugt.
