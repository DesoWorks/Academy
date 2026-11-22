# Unabhängiger QA-Bericht – Operation Academy, Phase M

**Prüfgegenstand:** Live-Update-Infrastruktur der DesoWorks Academy (Phase M)  
**Prüfgrundlage:** `PHASE-M.md`, `WINDOWS-UPDATE-TEST-M.md`, `windows-update-evidence.json`  
**Dokumentierter Stand:** 22.11.2026; Branch `feature/phase-m-live-update`; Client-Commit `7876297`; laut Phase-Dokument kein Push, Merge oder Stable-Release.  
**Prüfmodus:** Dokumentenprüfung. Ich habe den Windows-Lauf nicht selbst ausgeführt oder angeklickt und hatte für diesen Prüflauf kein Terminal. Die Windows-Befunde sind daher von Rick dokumentierte Beobachtungen, keine von mir unabhängig reproduzierten Ergebnisse.

## Gesamturteil

**EINGESCHRÄNKT – die bereitgestellten Belege stützen einen begrenzten DEV-Update- und Modulupdate-Pfad auf einer separat installierten Testinstallation. Sie belegen keine vollständige Phase-M-Abnahme und keine produktive Update-Infrastruktur für die bestehende Program-Files-Installation.**

Die Dokumentation benennt selbst wesentliche offene Abnahmepunkte: Die installierte Version 0.3.0 kann sich nicht selbst aktualisieren; ein entfernter, vom Client erreichbarer Feed fehlt; Stable bleibt mangels Herausgeberzertifikat gesperrt. Der lokale Feed lief nur während des Testlaufs. Das ist ein funktionierender kontrollierter Testpfad, aber noch kein selbstständig verfügbarer Updatekanal für den Commander.

## Kriterienabgleich anhand der Belege

| Kriterium | Urteil | Beleglage und Grenze |
|---|---|---|
| Update-Erkennung und manuell gestarteter DEV-Download | **Teilweise belegt** | `WINDOWS-UPDATE-TEST-M.md` dokumentiert, dass eine separat installierte `0.3.1-dev.1` über einen Feed auf `127.0.0.1:47321` `0.3.1-dev.2` erkannte und 133 425 695 Bytes lud. Die JSON enthält beim Fortsetzungslauf das Modulangebot, aber nicht den ersten Core-Updateablauf. Die Core-Angaben beruhen damit auf dem Testbericht, nicht auf einer vollständigen JSON-Aufzeichnung. |
| SHA-256-Integritätsprüfung | **Belegt für den dokumentierten Testfall** | Der Testbericht hält fest, dass eine falsche Prüfsumme mit `hash-mismatch` verworfen und danach mit korrekter Summe installiert wurde. Der erste Hash-Fehler steht laut Bericht nicht in der JSON. Die nachfolgenden JSON-Daten belegen Modul- und Fehlerlauf, nicht diesen ersten Hashlauf. |
| Core-Update auf `0.3.1-dev.2` | **Belegt, eingeschränkt** | Testbericht: Dateiversion und Registry-Anzeigename nach dem Update `0.3.1-dev.2`. Die JSON-Fortsetzung startet mit `core-already: 0.3.1-dev.2`, bestätigt somit den Zustand vor dem Modulupdate. Keine unabhängige Ausführung durch QA. |
| Schutz von Daten und Update-Einstellungen | **Teilweise belegt** | Bericht und JSON dokumentieren erhaltenen Lernstand (`correct: true`), Marker `gehalten` und vorhandene Sicherung. Im JSON sind diese Werte insbesondere nach dem Modulupdate und nach dem fehlgeschlagenen Installationsversuch sichtbar. Ein umfassender Wiederherstellungstest ist damit nicht gezeigt. |
| Trennung von Academy Core und Modulaktualisierung | **Belegt für den dokumentierten Modulfall** | JSON zeigt Modul `1.0.1` → `1.0.2`, Meldung, dass der Core nicht neu installiert wird, und anschließend Core `0.3.1-dev.2`. Das stützt die getrennte Aktualisierung dieses Moduls; es ist kein Nachweis aller Module oder Fehlerpfade. |
| Fehlerhafter Installer / Abbruchbehandlung | **Teilweise belegt; Recovery nicht bestanden als Abnahmekriterium** | Bericht und JSON zeigen, dass der absichtlich fehlschlagende Installer die Dateiversion `0.3.1-dev.2` nicht änderte. Nach Neustart meldet die App `phase: interrupted`; der Marker blieb erhalten. Das zeigt Erkennung eines unterbrochenen Vorgangs, nicht erfolgreiche automatische Wiederherstellung oder Rollback. Der Testbericht schließt einen Rollback eines teilweise geschriebenen NSIS-Verzeichnisses ausdrücklich aus. |
| Update der bestehenden Program-Files-Installation 0.3.0 | **Nicht bestanden / nicht nachgewiesen** | Laut Testbericht blieb `C:\Program Files\DesoWorks Academy` bei 0.3.0 und wurde nicht ersetzt. Ein Update aus dieser laufenden Installation wurde nicht demonstriert. Ein erfolgreicher Updatepfad aus dem separat gebootstrappten Testverzeichnis ist hierfür kein Ersatz. |
| Vom Client erreichbarer, dauerhaft verfügbarer DEV-Feed | **Nicht bestanden** | Belegt ist nur der lokale Feed auf `127.0.0.1:47321`, gestartet während des Tests. Laut Bericht war der Port danach nicht mehr belegt. Ein Remote-Manifest oder ein von der installierten App unabhängiger, dauerhaft erreichbarer Veröffentlichungsweg ist nicht belegt; Phase M nennt dies als offen. |
| GitHub-/Remote-Veröffentlichung ohne Geheimnis im Client | **Nicht bestanden / nicht vorhanden** | Phase M dokumentiert keine GitHub-Releases, keinen Push und kein Remote-Manifest; das Repository ist privat und `desoworks.dev` antwortet laut Phase-Dokument mit HTTP 401. Ein sicherer, für den Client nutzbarer Remote-Verteilungsweg ist nicht nachgewiesen. |
| Stable-Signaturprüfung und Stable-Update | **Nicht geprüft; Stable blockiert** | Es gibt laut Phase M kein Herausgeberzertifikat. Das Dokument beschreibt Stable als weiterhin blockiert; ein echtes signiertes Update wurde nicht ausgeführt. DEV ohne Herausgeberzertifikat ist kein Beleg für Stable-Sicherheit. |
| Update-UI mit geforderten Angaben und ohne ungefragte Unterbrechung | **Teilweise dokumentiert, nicht unabhängig UI-geprüft** | Phase M beschreibt die Anzeige von Kanal, Commit, Version, Notizen, Größe, Modulupdates und Startprüfung sowie keinen automatischen Download. Die vorgelegten Belege enthalten keine von mir erhobene visuelle/UI-Prüfung und keine vollständige dokumentierte Prüfung jedes angeforderten Felds, etwa Veröffentlichungsdatum und Update-Status, im konkreten Core-UI-Ablauf. |
| Automatische Prüfung beim Start (optional) | **Nicht geprüft** | Keine ausreichenden Laufzeitbelege vorgelegt. |
| Testsuite | **Nur als Fremdbericht berücksichtigt** | `PHASE-M.md` nennt `npm test`: 72 bestanden, 0 fehlgeschlagen, ausdrücklich vor den Builds. Ich habe den Test nicht ausgeführt; dies belegt für sich weder das Laufzeitverhalten noch die gebauten Installer. |

## Abweichungen, Lücken und Hinweise

1. **Der erfolgreiche Test betrifft nicht die produktiv installierte 0.3.0.** Stand A `0.3.1-dev.1` wurde einmalig in ein separates Verzeichnis unter `%LOCALAPPDATA%` installiert. Damit wurde ein Update von diesem Bootstrap auf `0.3.1-dev.2` geprüft, nicht die Selbstaktualisierung der Program-Files-Installation.
2. **Der Verteilungsweg ist lokal und temporär.** Ein Client mit festem Loopback-Feed kann nur aktualisieren, wenn auf derselben Maschine der Feed-Server aktiv und der Feed dort verfügbar ist. Der dokumentierte Zustand nach dem Test – Port 47321 nicht belegt – widerlegt eine Behauptung, der Feed sei danach dauerhaft verfügbar.
3. **„Unterbrochen erkannt“ ist nicht gleich „sicher zurückgerollt“.** Der Code-1-Installer ließ die gemeldete Version unverändert und erzeugte beim Neustart den Zustand `interrupted`. Für teilweise ersetzte Dateien in einem Installationsverzeichnis ist kein Rollbackbeleg vorhanden.
4. **Die JSON-Evidenz ist unvollständig für den Core-Hashlauf.** Sie beginnt laut Testbericht beim Folgelauf; der erste falsche Hash steht nur im Laufprotokoll/Testbericht. Den Hash-Mismatch daher nicht als durch die bereitgestellte JSON unabhängig bestätigt ausgeben.
5. **Provenienz und unabhängige Reproduzierbarkeit sind begrenzt.** Dieser QA-Bericht prüft die drei genannten Dokumente und JSON-Felder. Ich habe weder den Windows-Ablauf selbst bedient noch Builds installiert oder Tests ausgeführt. Ein Git-Status/HEAD konnte in diesem Lauf ebenfalls nicht verifiziert werden; die Versionsangaben sind aus `PHASE-M.md` übernommen.

## Erforderliche Nachweise für eine vollständige Abnahme

- Einen vom Client tatsächlich erreichbaren DEV-Veröffentlichungsweg nachweisen, der nicht von einem manuell laufenden Loopback-Server abhängt, ohne Zugangstoken oder andere Geheimnisse in der Anwendung.
- Den Updatepfad aus der bestehenden Program-Files-Installation 0.3.0 oder einen klar abgegrenzten, reproduzierbaren Migrations-/Bootstrap-Pfad erfolgreich testen; Version, Installationsort und Startmenü-/Desktop-Verhalten danach festhalten.
- Fehlerfall mit teilweise veränderten Installationsdateien prüfen und Datenintegrität sowie Wiederherstellung/Rollback belegen; `interrupted` allein reicht nicht.
- Die UI-Felder und den manuellen Such-/Downloadablauf auf der tatsächlich laufenden Anwendung prüfen; den optionalen Startcheck nur dann als bestanden werten, wenn er umgesetzt und getestet ist.
- Stable erst nach echtem Zertifikat und erfolgreicher Signaturprüfung eines Pakets separat abnehmen.
- Rohprotokoll und JSON-Evidenz für den gesamten Core-Hash- und Updateablauf konsistent sichern; den zeitlichen Zustand des Feeds nach dem Test dokumentieren.

## QA-Schluss

Die Dokumente stützen, dass ein DEV-Core-Update und ein davon getrenntes Modulupdate auf einer eigens installierten Testversion unter lokaler Feed-Bereitstellung durchgeführt wurden. Sie stützen außerdem die Zurückweisung einer falschen Prüfsumme laut Testbericht und die Erkennung eines fehlgeschlagenen Installerlaufs. Sie tragen **nicht** die Aussage, dass Phase M vollständig abgeschlossen ist, dass die Program-Files-Version 0.3.0 aktualisierbar ist, dass ein Remote-DEV-Kanal verfügbar ist oder dass Stable-Updates sicher funktionieren. Eine Produktionsfreigabe lässt sich aus diesen Belegen nicht ableiten.
