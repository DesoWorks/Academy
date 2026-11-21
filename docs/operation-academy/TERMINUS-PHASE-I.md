# Terminus: Architekturbewertung für Phase I

**Stand:** 2026-11-21 · **Bewertung:** Der Repo-Schnitt ist als Architektur tragfähig; dies ist keine Produktionsfreigabe.  
**Prüfumfang:** Lesender Zwischenstand im Academy-Workspace während paralleler Umsetzung. Kein Build, Installerlauf oder Fensterlauf durch Terminus. Historische Phase-H-Tests sind keine Phase-I-Abnahme.

## Tragfähige Basis

- Der lokale `main` auf `fc6ade42` ist als Startpunkt beobachtet. Der Subtree-Split aus `desktop/` ist von Rick bestätigt. Die bestehenden Fach-Repositories müssen für die Entwicklung des neuen Produkts nicht umgebaut werden.
- `src/window.js` setzt Kontextisolierung, Sandbox und deaktivierte Node-Integration. Neue Fenster und Webviews sind gesperrt. Diese Grenzen im neutralen Core beibehalten. Das ist eine Quellcodebeobachtung, kein Sicherheitsnachweis.
- `src/modules/manager.js` prüft Manifest, Dateiliste, Kompatibilität und Signaturregeln und trennt Paketdateien von Moduldaten. `src/modules/registry.js` öffnet `modules.sqlite` getrennt von der in `src/store/database.js` benannten `academy.sqlite`. `catalog/official.json` führt das lokale Beispielpaket in `modules/wissen-weitergeben/`, keinen verbundenen Onlineshop.

## Befunde und offene Abnahme

| Thema | Beobachtet beim Lesen | Offen / Nachweis für Phase I |
| --- | --- | --- |
| Protokoll und Content-Root | `src/config.js` steigt relativ zu `src/` zwei Ebenen auf. Im Stand nach dem Split ist das das übergeordnete Workspace-Verzeichnis, nicht der Academy-Ordner; im Paket ist `resources/platform` konfiguriert. `src/protocol.js` bedient daraus `academy://app/`; `src/window.js` lädt `/index.html` und trägt noch den IT-Titel. In der gelesenen Academy-Repo-Wurzel fehlt `index.html`; eine neutrale Startseite war im gelesenen Renderer-Inventar nicht vorhanden. | Positiv definierter Core-Ressourcenbereich, getrennt von Quellcode, Sicherungen, Nutzerdaten und Nachbarprojekten. Start in Entwicklung und im Paket überprüfen, einschließlich nicht freigegebener Routen. |
| Gebündelte Plattform | `package.json` weist `extraResources` aus `../` nach `platform` an. Der Manager liefert `BUNDLED_PLATFORM` mit, öffnet den Sonderfall über `/index.html` und reserviert dessen ID. Das ist kein installiertes IT-Modul. | IT-Sonderfall aus Core-Paketierung und Lernbereichsdarstellung entfernen. Academy ohne Nachbarrepo bauen; Ressourcenliste auf Abwesenheit alter Fachseiten prüfen. Leerer Lernbereich ohne Autoöffnung, Beispielmodul nur bewusst installieren und öffnen. |
| Datenpfad und Produktidentität | `src/config.js` nutzt `DesoWorks/IT-Ausbildung`; `src/main.js` setzt daraus `userData`. Paketkonfiguration und App-User-Model-ID nutzen noch die IT-Identität. | Umstellung auf `DesoWorks/Academy`, eigene Produktkennung und passende Update-Konfiguration. Mit getrennten Testprofilen belegen, dass der Core Altdateien weder übernimmt noch verändert. Sicherung, Wiederherstellung und Modulzustände im neuen Pfad getrennt prüfen. |
| Windows-ICO | Im Academy-Inventar wurde keine `.ico` gefunden; unter `build.win` in `package.json` steht kein eigener Icon-Pfad. Das im IT-Repository vorhandene `assets/desoworks/favicon.ico` ist kein Academy-Installer-Asset. | Eigenes geeignetes Academy-ICO vorsehen und die tatsächlich sichtbaren Symbole von Fenster, Taskleiste, Installer und Verknüpfung auf Windows prüfen. Keine Fertigmeldung aus der bloßen Paketkonfiguration. |
| Fensterabnahme | Für Phase I wurde hier kein Fenster geöffnet oder geklickt. `PHASE-H.md` vermerkt automatisierte Tests und ausdrücklich keine Fensterabnahme für Phase H. | Unabhängig prüfen: frischer Offline-Start, neutrale Navigation und leerer Lernbereich, Installation des Beispiels, Aufgabenstand nach Neustart, Daten und Updates, Datensicherung, Info und klar gekennzeichnete Platzhalter für KI und IDE. Entwicklung und installierter Build sind getrennte Prüffälle. |

## Offene Punkte vor echten Modulen

Phase H nennt unter anderem Herausgeberbindung nach Deinstallation, erneutes Lesen zwischen Vorschau und Installation und unvollständige Dateisystemtests. Der gelesene Manager prüft die Herausgeberbindung beim Ersetzen, aber nicht im Zweig mit bestehendem Zustand `uninstalled`. Außerdem sind Paketdateien und Registry-Eintrag keine gemeinsame Transaktion. Vor echten Fachmodulen Identitätsbindung, konsistente Installation bei Abbruch, Schlüsselverwaltung sowie Datenübernahme gesondert prüfen. Leer hinterlegte Schlüssel sind kein Grund, Signaturpflichten zu lockern.

**Entscheidung für die Übergabe:** Die Trennung weiter umsetzen, aber Phase I erst nach Nachweis von neutralem Start, eigenem Datenprofil und fachinhaltsfreiem Windows-Paket zur Abnahme vorlegen. Eine spätere Produktionsfreigabe ist eine eigene Entscheidung.
