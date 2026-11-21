# Migrationsplan: IT-Ausbildung als Academy-Modul

**Stand:** 2026-11-21 · **Status:** Planung, keine Migration durchgeführt.  
**Quellen:** Gelesene Verzeichnisinventare und Einstiegspunkte im Repository IT-Ausbildung, dessen Phase-H-ADR und `PHASE-H.md` sowie `src/modules/manager.js`, `src/modules/spec.js` und `src/modules/registry.js` im Academy-Workspace. Die nachfolgend genannten Fachpfade sind relativ zu IT-Ausbildung.

**Phase I verschiebt, kopiert und portiert keine Fachinhalte und importiert keine Altprofile.** Die bestehende IT-Webanwendung bleibt am bisherigen Ort, Verwaltung-Ausbildung bleibt unangetastet. In der Academy ist ausschließlich das Beispielpaket `modules/wissen-weitergeben/` als installierbarer Testinhalt vorgesehen.

## Lernseiten

`index.html` ist die IT-Themenübersicht. `module/computer-grundlagen.html` und Lernfeldseiten wie `module/lf1-lernziel.html`, `module/lf2-auswertung.html`, `module/lf3-dhcp.html` und `module/lf9-zukunft.html` sind vorhanden; dazu kommen seitenbezogene Skripte in `js/` und Stile wie `css/styles.css` und `css/lf89-praxis.css`. Vor einer Portierung Lernziele, Texte, Aufgaben, Medien, Bewertungsregeln und IDs inventarisieren. Texte und einfache Aufgaben in das deklarative Kursmodell übertragen. Abschlussregeln und interaktive Lehrseiten gegen das Original prüfen, statt sie auf bloße Inhaltsseiten zu reduzieren.

## Navigation

Beobachtet: `index.html` lädt unter anderem `js/module-daten.js`, `js/navigation.js`, `js/fortschritt.js` und `js/startseite.js`; `start/IT-Ausbildung starten.html` verweist auf `../index.html`. `glossar.html` und `js/glossar-daten.js` existieren. Im Ziel führt die Academy-Übersicht zum installierten IT-Modul; dessen Themenübersicht, Lernfeldverweise und Glossar bleiben modulinterne Navigation. Alte relative Links und Einstiegspunkte vorab erfassen und auf stabile Modulrouten abbilden. Der bestehende Web-Starter bleibt im Altprojekt. Keine IT-Weiterleitung auf der Academy-Startseite.

## Windows-Labor

`module/windows-werkzeugkiste.html` lädt `js/windows-labor-daten.js`, `js/windows-labor.js`, `js/windows-werkzeugkiste-daten.js` und `js/windows-werkzeugkiste.js`; `css/windows-werkzeugkiste.css` ist vorhanden. Im Inventar gibt es keine separate `module/windows-labor.html`. Nach Freigabe eignet sich das Werkzeuglabor als fachlicher Pilot: Befehlsreferenz, Fallbeispiele, simulierte Ausgaben und Übungen als Daten modellieren. Filter, Auswahl und Feedback über geprüfte Core-Komponenten anbieten. Es bleibt eine Simulation ohne Betriebssystemzugriff. Abnahme: Suche, Filter, Aufgabenfeedback und Tastaturbedienung gegen das Original prüfen.

## PC-Explorer

Vorhanden sind `module/pc-explorer.html`, `js/pc-explorer.js` und `css/pc-explorer.css`. Komponenten, Medien und Interaktionszustand getrennt erfassen. Kennzeichnung, Auswahl und Detailansicht mit einem Core-Widget nachbilden; Tastaturbedienung und alternative Auswahl prüfen. Bestehendes Skript nicht als Modulskript laden.

## RAID-Labor

Vorhanden sind `module/raid-labor.html`, `js/raid-kern.js`, `js/raid-labor.js`, `js/raid-rack-modell.js`, `js/raid-rack.js`, `css/raid-labor.css` und `css/raid-rack.css`. Vor einer Portierung Simulationsregeln, Ausgangsdaten und Darstellungszustand trennen. Ausfall, Austausch, Rebuild und Reset als explizite Zustandsübergänge modellieren und anhand von Referenzfällen prüfen. Die Simulation darf keine echten Laufwerke ansprechen. Solange das Widget nicht freigegeben ist, bleibt das Labor im Altprojekt.

## BWL-Werkstatt

Vorhanden sind `module/bwl-werkstatt.html`, `js/bwl-werkstatt.js` und `css/bwl-werkstatt.css`. Fallbeispiele, Eingabefelder, Rechenregeln und Rückmeldungen getrennt aufnehmen. Rechenlogik nur über einen geprüften Core-Aufgabentyp anbieten; Ergebnisse und Fehlerfälle gegen das Original prüfen. Kein Zusammenführen mit der eigenständigen Verwaltung-Ausbildung.

## Weitere Inhalte

`module/ipv4-rechner.html`, `module/netzmaske.html`, `module/subnetting.html`, `module/einheiten.html` und `module/zahlensysteme.html` sind vorhanden; dazu passen unter anderem `js/ipv4-rechner.js`, `js/netzmaske.js`, `js/subnetting.js`, `js/einheiten.js` und `js/zahlensysteme.js`. Zuerst Text, Glossar und Offline-Medien erfassen; Rechner, Prüflogik und Reset-Verhalten getrennt bewerten. Für jedes Werkzeug entscheiden, ob das Kursformat ausreicht oder ein freizugebender Aufgabentyp fehlt. Keine Altseiten unbemerkt in den Core-Build aufnehmen.

## Lernfortschritte und Datenübernahme

`js/fortschritt.js` liest bestehende, versionierte Schlüssel aus `localStorage` (etwa `it-ausbildung.computer-grundlagen.v1`) und leitet Abschlüsse daraus ab. Desktop-Daten unter `DesoWorks/IT-Ausbildung` und Browserdaten sind getrennt zu inventarisieren. Alte `academy.sqlite`, gegebenenfalls vorhandene `modules.sqlite`, Sicherungen und Browserprofile sind mögliche Quellen, keine bestätigten Nutzerdaten dieses Laufs. Der beobachtete Academy-Manager speichert modulspezifische Werte in `modules.sqlite` (`module_kv`), nicht in `academy.sqlite`.

1. Nur nach Freigabe und ausdrücklicher Auswahl der Quelle: Altbestand lesend exportieren und eine wiederherstellbare Sicherung bereitstellen. Kein Profilverzeichnis pauschal kopieren; Herkunft und Schema jeder Quelle erfassen.
2. Eine versionierte Zuordnung Alt-Schlüssel → Ziel-Modul-ID/Lernziel/Aufgabe definieren, einschließlich abgeleiteter Abschlüsse und nicht zuordenbarer Einträge. Den bestehenden Import für Moduldaten nicht als Importer für Altprofile ausgeben.
3. Trockenlauf mit Summen je Lernfeld, erkannten Konflikten und nicht übernommenen Datensätzen vorlegen. Unbekanntes separat protokollieren; nichts stillschweigend überschreiben. Wiederholungsimport und Kollisionen gegen eine isolierte Zielkopie prüfen.
4. Nach Bestätigung atomar ins Ziel schreiben oder bei Fehler zurückrollen. Stichproben zu Aufgaben, Bewertungen und Abschlüssen im jeweiligen Lernbereich nach Neustart nachweisen; Sicherung und Wiederherstellung mit Testbestand prüfen und das Altprofil unverändert lassen.

**Vollmigration erst nach prüfbarer Datenübernahme:** dokumentierte Zuordnung, abgestimmte Ausnahmen, reproduzierbare Tests mit Referenzdaten und nachgewiesener Rückfallweg. Bis dahin bleibt die alte IT-Ausbildung nutzbar.

## Nötige Modul-API-Anpassungen

- Der gelesene Manager erwartet einen deklarativen JSON-Einstieg und liefert bereinigte Kursdaten. `src/modules/spec.js` lässt keine HTML-, CSS- oder JS-Pakete zu und begrenzt Anzahl und Größe der Dateien. Deshalb versionierte Aufgabentypen, Core-eigene Simulations-Widgets, modulinterne Navigation und Medienzugriff spezifizieren; Größenlimits auf echte Paketgrößen prüfen. Keine Freischaltung von Legacy-JavaScript, Shell, Dateisystem oder Netzwerk als Abkürzung.
- Stabile Lern- und Aufgaben-IDs, versionierte Fortschrittsdaten und eine explizite, bestätigte Import-Schnittstelle festlegen. Zugriff nach Modul und Herausgeber trennen; Identitätsbindung muss auch nach einer Deinstallation erhalten bleiben.
- `dev.desoworks.it-ausbildung` ist im gelesenen Manager und Manifestvalidator für die gebündelte Altplattform reserviert. Für das echte Modul eine offizielle, dauerhafte ID samt Herausgeberschlüssel festlegen; eine etwaige Überleitung der alten ID ist getrennt zu prüfen. Anforderung, Signatur und Vertrauensregeln zuerst freigeben.
- Reihenfolge: neutralen Core und Beispielpaket abnehmen, Modulvertrag freigeben, Windows-Labor als Pilot prüfen, danach weitere Inhalte in Wellen prüfen und den vollständigen Wechsel erst nach der Datenabnahme freigeben.
