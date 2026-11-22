# Design Harmony 3 – Theme-Vertrag und Leitlinien für künftige Module

**Stand:** 22.11.2026  
**Geltungsbereich:** lokaler Quellstand der Academy, Branch `feature/phase-n1-release-connectivity`, HEAD `95f0033`.  
**Status:** technische Dokumentation; keine Freigabe, kein Release und keine Aussage einer vollständigen Laufzeit- oder Sicherheitsabnahme.

## Zweck und Nachweisstatus

Dieses Dokument beschreibt die Theme-Schnittstelle für gehostete Webmodule, den vorgesehenen Updatevertrag und praktische Leitlinien für künftige Lernmodule. Es beruht ausschließlich auf [THEME-CONTRACT-3.md](THEME-CONTRACT-3.md), [DESIGN-HARMONY-3-IMPLEMENTIERUNG.md](DESIGN-HARMONY-3-IMPLEMENTIERUNG.md), [DESIGN-HARMONY-3-SECURITY.md](DESIGN-HARMONY-3-SECURITY.md) und [DESIGN-HARMONY-3-BESTAND.md](DESIGN-HARMONY-3-BESTAND.md).

Die Implementierungsnotiz berichtet 170 bestandene Node-Tests. Sie hält zugleich ausdrücklich fest, dass Oberfläche und drei Theme-Modi nicht im laufenden Programm bzw. in einem isolierten Testprofil geprüft wurden. Die Vertrags-Abnahmekriterien sind Anforderungen an eine spätere Prüfung, keine bereits erzielten Resultate. Sicherheitsangaben sind auf die im Sicherheitsbericht genannten Quelltextbereiche beschränkt; dort aufgeführte Prüfgrenzen und offene Befunde bleiben offen.

## Kompatibilitätsvertrag `runtime.themeContract: 1`

Ein `hosted-web`-Modul deklariert im vorhandenen `academy-module.json` unter `runtime` den JSON-Ganzzahlwert `themeContract: 1`. Die `1` ist die Version des Laufzeitvertrags; die `3` in „Theme-Vertrag 3“ bezeichnet die Etappe. Ein String wie `"1"`, ein nicht positiver Wert oder ein nicht ganzzahliger Wert ist ein Manifestfehler. Fehlt das Feld oder unterstützt der Core den Wert nicht, ist ein gehostetes Webmodul inkompatibel. Reine Inhaltsmodule ohne Web-Laufzeit benötigen das Feld nicht; ihre Inhalte rendert der Core.

`formatVersion` bezeichnet weiterhin das Manifestformat, `version` die SemVer des Modulpakets und `manifest.core` die Core-Voraussetzung. Diese Felder ersetzen den Theme-Vertrag nicht. Die konkrete Mindest-Core-Version, die v1 unterstützt, ist laut Vertrags- und Implementierungsunterlagen noch nicht festgelegt. Für ein späteres Paket muss die Core-Angabe Cores ausschließen, die den deklarierten Vertrag nicht durchsetzen.

Der Manager muss Kompatibilität aus dem tatsächlich installierten bzw. konkret geprüften Manifest bestimmen. Bei `hosted-web` müssen sowohl Core-Anforderung als auch Theme-Vertrag passen. Paketversion, Feed-Angabe, Quellordner oder ein sichtbares Root-Attribut sind kein Ersatz. Eine inkompatible Installation darf nicht geöffnet und ihre Paketdateien dürfen nicht über den direkten `academy://`-Aufruf ausgeliefert werden. Das Feld ist eine Paketdeklaration, keine eigenständige Laufzeit-Konformitätsprüfung.

## Theme-Quelle und Transport

Die Academy-Shell ist alleinige Quelle des Farbmodus. Zulässige Werte sind exakt `hell`, `dunkel` und `kontrast`. Der vorgesehene Weg lautet:

`Shell-Einstellung academy.theme` → einzelner URL-Parameter `academy-theme` → Academy-Protokollhandler → `data-academy-theme` am expliziten `<html>` des Moduls.

Der Protokollhandler akzeptiert genau einen gültigen Wert. Fehlender, mehrfacher oder ungültiger Query-Wert führt laut Bestands- und Sicherheitsbericht zu `hell`; das Root-Attribut wird dennoch gesetzt. Fehlt das `<html>`-Element, ist dies ein Vertragsverstoß und kein Anlass, auf einen lokalen Modus zurückzufallen. Der Query-Parameter ändert weder Modul-ID, Origin noch Pfad und ist kein Vertrauenssignal.

Sobald `data-academy-theme` vorhanden ist, liest das Modul den validierten Modus ausschließlich von diesem Attribut. Es darf das Attribut nicht verändern oder entfernen und darf es nicht durch lokale Präferenzen, Reset, Medienabfragen zur Moduswahl oder eine zweite Palette überstimmen. Ein passiver Spiegel nach `data-theme` für vorhandene CSS-Regeln ist zulässig; Academy-Rollen behalten Vorrang. Eine lokale Farbauswahl ist in der Academy deaktiviert oder nicht sichtbar; falls sie deaktiviert angezeigt wird, soll ein Hinweis die Zuständigkeit der Academy erklären. Ohne Academy-Attribut bleibt Standalone-Verhalten möglich; allein der URL-Parameter schaltet es nicht um.

Bei interner Dokumentnavigation innerhalb desselben Academy-Moduls wird der validierte Root-Wert im `academy:`-Host weitergegeben, einschließlich dynamischer Ziele und Formularnavigation. Andere Zielparameter und Fragmente bleiben erhalten. Der Modus wird nicht an externe Hosts, Assets, Downloads oder reine Ankersprünge weitergereicht. Beim Modulöffnen oder -wechsel setzt die Shell ihren aktuellen Wert; ein zusätzlicher Live-Synchronisationskanal ist nicht vorgesehen. Die gemeinsame Rollenmatrix `design-tokens.css` ist Integrationsgrundlage; daraus folgt keine Erlaubnis, eine zweite Bridge, Palette oder Änderungen an Sandbox, CSP oder Origins einzuführen.

## Pakete, Benutzerdaten und Updates

Paketdateien liegen versionsbezogen unter `dataDir/module-packages/<id>/<version>`. Die Registrierung `module_install` in `dataDir/modules.sqlite` verweist auf die aktive Paketversion. Lernfortschritt in `module_kv` bleibt an der stabilen Modul-ID gebunden, nicht an die Paketversion. Hosted-Web-Lernstände und Einstellungen im Chromium-Speicher des stabilen `academy://<modul-id>`-Origins, insbesondere `localStorage`, sind davon getrennte Benutzerdaten.

Ein Paketersatz darf Profil, Partition, Origin und bestehende Speicher- oder Fortschritts-IDs nicht ändern, Webspeicher nicht leeren oder zurücksetzen und kein neues Profil anlegen. Ein Paket-Snapshot ist kein Backup des Lernfortschritts. `sessionStorage` wird nicht absichtlich gelöscht; daraus folgt keine zugesicherte Persistenz über das Sitzungsende hinaus. Eine Datenmigration zwischen SQLite und Webspeicher ist nicht Teil dieses Vertrags.

Updates erfolgen ausschließlich über den vorhandenen Academy-Manager und dessen bestehende Katalog-/Update- und Installationsstrecke bis `installFromDirectory`, nicht durch manuelles Kopieren, Umbenennen, Registry-Manipulation oder Deinstallieren und Neuinstallieren. Der Manager prüft das konkrete Paket erneut. Bestehende Prüfungen zu Manifest, Dateiintegrität, Core-/Theme-Kompatibilität, Abhängigkeiten, Herkunft, Herausgeber und Trust bleiben maßgeblich. Die bestehenden Signaturregeln bleiben unverändert; kein zweiter Signaturmechanismus und kein nachträgliches Patchen eines installierten Manifests.

Ein reguläres Update setzt dieselbe Modul-ID und eine **streng neuere** Paketversion voraus. Eine gleiche Version ist kein Update; ein älteres Paket wird beim Installationsversuch blockiert. Insbesondere darf der Repo-Stand `1.0.1` das installierte Modul `1.0.2` nicht ersetzen. Der dokumentierte Quellstand bleibt Version `1.0.1` mit `runtime.themeContract: 1`; laut übergebenem Bestands-/Profilbefund ignoriert das installierte `1.0.2` `data-academy-theme`. Kein Update des installierten Moduls aus diesem älteren Quellstand ist vorgesehen. Kein Core-Update als Ersatz für ein Modulupdate, keine Änderung der App-ID und keine Änderung der Signaturregeln.

Die vorhandenen Unterlagen beschreiben bekannte Grenzen des Updatewegs: gleiche Paketversion kann im Manager überschrieben werden; Dateisystem und Registry sind nicht transaktional; der im IPC-Weg angelegte Snapshot wird bei Fehler nicht automatisch zurückgespielt. Diese Punkte sind nicht durch die beschriebene Implementierung behoben. Die Implementierungsnotiz sagt ausdrücklich, dass die Sicherheitsbefunde zu gleicher Version, Rollback und Transaktion außerhalb ihres Auftrags blieben. Fehler- und Absturzsicherheit ist daher nicht als nachgewiesen zu behandeln.

## Prüfvorgehen für eine spätere Umsetzung

Die folgenden Punkte sind Prüfkriterien aus dem Theme-Vertrag, keine Behauptung, dass sie bereits ausgeführt wurden:

1. In einem isolierten Testprofil die Modi Hell, Dunkel und Kontrast beim Einstieg sowie bei interner Navigation prüfen; jeweils eine abweichende gespeicherte Modulwahl als Gegenprobe verwenden.
2. Fehlenden und unbekannten Theme-Vertrag sowie eine unpassende Core-Anforderung sichtbar sperren. Auch direkte `academy://`-Aufrufe prüfen. Reine Inhaltsmodule bei passendem Core gesondert behandeln.
3. Den Versuch `1.0.1` über installiertem `1.0.2` ausführen und die erwartete Downgrade-Ablehnung prüfen; keine Umgehung vornehmen.
4. Bei einem gültigen, streng neueren Paket die Lernstände sowohl in `module_kv` als auch im Webspeicher kontrollieren.
5. Ein abgelehntes Paket und einen Fehler vor Aktivierung untersuchen; bisherigen Registereintrag, Paketdateien und Benutzerdaten vergleichen. Nicht aus dem vorhandenen Snapshot allein auf Wiederherstellbarkeit schließen.
6. Status und Hauptaktion in allen relevanten Ansichten kontrollieren: installierte und verfügbare Version samt Prüfstatus und Grund unterscheiden; pro Modul höchstens eine primäre Aktion; inkompatible Module nicht öffnen.
7. Browser-/Electron-Laufzeit und tatsächliche Oberfläche gesondert prüfen. Statische Tests oder Quelltextprüfung belegen keine visuelle oder vollständige Tastatur-/Barrierefreiheitsprüfung.

Die Implementierungsnotiz verzeichnet `node --test tests/*.test.js` mit 170 bestandenen Tests. Diese Testausführung belegt die dort beschriebenen Testfälle im Quellstand, nicht die obigen offenen Laufzeit-, Oberflächen-, Update- oder Sicherheitskriterien.

## Leitlinien für künftige Lernmodule

- Zuerst festlegen, ob das Modul reine Inhalte oder `hosted-web` ist. Nur für gehostete Webmodule ist `runtime.themeContract` verbindlich.
- Bei Webmodulen das Feld als JSON-Ganzzahl deklarieren und nur dann `1` angeben, wenn das Modul den Vertrag tatsächlich einhält. Die Deklaration allein beweist keine Konformität.
- Die Academy-Farbmodi aus `data-academy-theme` beziehen; lokale Darstellungspräferenzen dürfen Textgröße, Abstände und reduzierte Bewegung betreffen, aber nicht die Academy-Farbhoheit übergehen.
- Interne Navigation im selben Modul korrekt weiterführen und externe Ziele, Assets, Downloads sowie reine Ankersprünge ausnehmen.
- Auf bestehende Academy-Rollen und die gemeinsame Rollenmatrix aufsetzen. Keine konkurrierende Palette oder zweite Theme-Transportstrecke einführen.
- Modul-ID, stabilen Origin, Profil und Speicher-IDs über Versionen hinweg erhalten. Lerninhalte und Datenmigration nicht stillschweigend an Paketversionen koppeln.
- Paketupdates nur über den vorhandenen Manager und nur auf eine streng neuere Version vorsehen. Core-Voraussetzung, Theme-Kompatibilität und die bestehenden Herkunfts-, Integritäts-, Trust- und Signaturprüfungen müssen zusammenpassen.
- Tests auf Vertragsebenen dokumentieren und Ergebnisse eng abgrenzen: Unit-Tests, statische Prüfung, Laufzeitprüfung und Sicherheitsprüfung sind unterschiedliche Nachweise. Offene Prüfungen ausdrücklich offen lassen.

## Umsetzungsstand und Einschränkungen

Laut Implementierungsbericht ergänzt der lokale Quellstand `runtime.themeContract: 1` beim IT-Systemintegrationsmodul, Version `1.0.1`. Validator, Manager-Kompatibilitätsprüfung, Sperren für inkompatible gehostete Module und Statusdarstellung wurden angepasst. `availableVersion` und `updateAvailable` bleiben mangels echtem Kandidaten `null`; die Oberfläche zeigt „Nicht geprüft“, und es wurde kein Aktualisieren- oder Update-prüfen-Button gebaut.

Nicht umgesetzt bzw. nicht nachgewiesen sind unter anderem: eine neuere Paketversion, eine festgelegte erste unterstützende Core-Version, Laufzeitprüfung aller drei Modi im isolierten Profil, Browser-/Electron-Prüfung der geänderten Oberfläche sowie ein Fehler-/Absturzsicherheitsnachweis der Updateaktivierung. Die installierte Academy bleibt unverändert; die Implementierung erfolgte nur im Arbeitsbaum. Laut Arbeitsstandsbericht wurde nichts committet oder gepusht und kein Release durchgeführt.

Die Bestandsaufnahme kennzeichnet mehrere Belege zum installierten `1.0.2` als offen bzw. nur berichtsbasiert, darunter den direkten Dateizugriff und die Herkunft bestimmter Probe-Dateien. Die hier wiedergegebene Aussage, dass das installierte Modul `data-academy-theme` ignoriert, ist deshalb als übergebener Profilbefund zu lesen und nicht als in dieser Dokumentationsarbeit unabhängig verifizierter Dateibefund. Die Bestandsaufnahme hält außerdem Screenreader, 150-%-/200-%-Zoom, laufende Installation und Produktions-/WCAG-Freigabe offen. Diese Dokumentation erteilt keine technische, fachliche oder sicherheitsbezogene Freigabe.
