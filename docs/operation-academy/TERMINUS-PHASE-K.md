# Phase K – Architekturprüfung des First Officer

Stand: 21.11.2026 · Terminus · Statische Prüfung der Academy-Basis `2b787e3` auf `feature/phase-k-stability-trust`, einschließlich der im parallelen Arbeitsstand sichtbaren LF3-Auslagerung. Lokaler `main`: `2e704e3`. Das ist weder ein QA-Lauf noch eine Freigabe.

## Bewertung

| Frage | Urteil aus dem Code |
| --- | --- |
| Bleibt der Core ohne IT-Modul nutzbar? | **Architektonisch ja.** `src/main.js` registriert eine eigene Core-Shell und behandelt eine nicht verfügbare Modulverwaltung separat. Katalog und Modul-Registry sind nicht der Core-Store. Ein Fehler der Core-Datenbank selbst hat diesen Fallback nicht; „unabhängig“ bedeutet daher nicht, dass das Modul ohne laufende Academy-Anwendung startet. |
| Ist das IT-Modul ein eigener Lernbereich? | **Ja, innerhalb der Desktop-Anwendung.** Das Manifest definiert ID, Version, Rechte, Nutzlast und Core-Kompatibilität. `src/renderer/module.js` öffnet es in einem Sandbox-iframe mit eigener Origin (`academy://desoworks.it-systemintegration`); `src/protocol.js` liefert geprüfte Moduldateien ohne Core-Bridge. `src/ipc.js` bindet Core-Operationen an die App-Origin; `src/window.js` hält Node-Integration aus und Sandbox/Web-Sicherheit an. |
| Sind Lernstand und Programm trennbar? | **Teilweise.** Paketdateien, Registry, Core-DB und natives Web-Storage sind getrennt. `module_kv` überlebt eine Modul-Deinstallation nach Code; für den Web-Lernstand sind Neustart und Wiederinstallation als separater Ende-zu-Ende-Nachweis erforderlich. Core-Backup ist kein Vollbackup aller Lernstände. |
| Sind beide unabhängig aktualisierbar? | **Datei- und Versionsgrenzen ja, Auslieferung noch nein.** Der Manager unterstützt die lokale Versionsersetzung; mitgelieferte Webpakete stammen beim installierten Produkt weiter aus Core-Ressourcen. Ein gepackter Core hat keinen betriebsbereiten Stable-Updateweg. Details: [Update-Architektur](UPDATE-ARCHITECTURE.md). |

## LF3 und Wartbarkeit

Im Basisstand enthält `modules/it-systemintegration/web/module/lf3-abnahme.html` die Logik inline; `MODULE_CSP` in `src/protocol-path.js` erlaubt Skripte nur aus derselben Origin. Die im Arbeitsstand sichtbare Auslagerung nach `web/js/lf3-abnahme.js` mit relativem `script src` passt zur bestehenden Sicherheitsarchitektur. `serveModule` liefert HTML unverändert und der Modulmanager liefert nur Dateien aus dem geprüften Index aus: Die geänderte HTML-Datei und das neue Skript müssen deshalb im Nutzlastindex konsistent erfasst werden. Keine Änderung der `script-src`, keine Inline-Ausnahme. Das ist eine Codeeinschätzung, keine bestätigte CSP-Regression. QA muss Öffnen, Eingaben, Bewertung, Ergebnis, Speicherung und erneutes Öffnen nach Neustart in einem tatsächlich installierten Testmodul prüfen.

Die heutigen Grenzen sind wartbar, wenn drei Verträge ausdrücklich getrennt bleiben: **Paketidentität und Integrität**, **Core-Kompatibilität** sowie **Lernstand/Datenschema**. Der Manager bündelt derzeit Prüfung, Installation, Laufzeitauflösung und Datenoperationen; vor weiteren Runtime-Typen sollten diese Verantwortlichkeiten an bestehenden Dateigrenzen klarer getrennt und mit gezielten Tests abgesichert werden, statt neue Repositories einzuführen. Die zwei verschiedenen Fortschrittspfade brauchen eine klare Produktanzeige und eine dazu passende Sicherungsstrategie; siehe [Migrationskonzept](MIGRATION-LEARNSTANDS.md). Der heute feste Wert `updateAvailable: false` darf fachlich nicht als nachgewiesene Aktualität gelten.

## Community-Vertrauen: genau zwei geplante Stufen

**Iststand:** Der Katalogeintrag heißt nicht „signiert“: Das mitgelieferte IT-Modul ist `private` und unsigniert. `src/modules/manager.js` begrenzt `hosted-web` auf den realen mitgelieferten Modulstamm und prüft bei bestehender ID Herausgeber-ID und Vertrauensstufe. Eine Zeichenkette wie `publisher.desoworks` oder der Katalogname ist für sich kein Identitätsnachweis. `src/modules/signature.js` kann Ed25519 über Manifest und Hashes prüfen; für `official`/`reviewed` erwartet der Manager vorab vertraute Schlüssel, die der Desktop-Start derzeit nicht konfiguriert. Bestehende interne Code-Einstufungen (`private`, `official`, `reviewed` usw.) sind nicht mit dem folgenden Produktmodell gleichzusetzen.

| Geplante Vertrauensstufe | Herkunft und Updates | Laufzeit und Daten |
| --- | --- | --- |
| **Offiziell – DesoWorks** | Reservierter Namensraum; offizielle ID und DesoWorks-Identität durch eine separat verwaltete Bindung an vertrauenswürdige Signaturschlüssel bestätigen. Signatur bindet Manifest, Version und vollständige Nutzlast (direkt oder über den signierten Hash des Nutzlastindex). Verteilung über überprüfbare DesoWorks-Quellen; Rotation und Sperrung der Schlüssel als eigener Prozess. | Auch offizielle Inhalte laufen mit minimalen Rechten. Signatur ist kein Zugriff auf Core, andere Module oder unbeschränkte Systemfunktionen. |
| **Community – eigenständige Identität** | Eigener Herausgeber mit eigenem Schlüssel und Namensraum; Erstbezug und Updates müssen zur verifizierten Identität und Modul-ID passen. Keine Übernahme offizieller IDs, kein Wechsel der Vertrauensstufe über ein Manifest. Herkunft, Prüfstatus und Rechte für Nutzer sichtbar machen. | Zunächst nur deklarative Inhalte in einem kontrollierten Renderer als denkbarer Einstieg. Eine etwaige spätere Laufzeit braucht eigene Isolation mit minimalen Fähigkeiten, ohne Core-/Dateisystem-/IPC-Zugriff und ohne Netzwerk standardmäßig. Lernstände nur im eigenen geprüften Namensraum. |

**Entscheidung für Phase K:** Die Sperre auf mitgelieferte Webmodule bleibt unverändert. Sie ist mit einem zukünftigen Community-Angebot vereinbar, wenn dafür eine separate, nachgewiesen eingeschränkte Laufzeit und ein eigener Vertrauenspfad gebaut werden. Keine Lockerung oder Abschaltung der bestehenden Sperre, keine Aktivierung fremder Webmodule und keine automatische Aufwertung vorhandener Pakete. Vor einer späteren Freigabe sind ein unabhängiger Sicherheitsreview und nachvollziehbare Isolationstests Pflicht.

## Prioritäten für Rick

1. **Phase-K-Abnahme:** LF3 samt korrektem Nutzlastindex und persistentem Wiederaufruf; daneben Core ohne IT-Modul sowie Deinstallation/Wiederinstallation mit nachweislich erhaltenen Testdaten prüfen. Security- und Windows-Urteil getrennt erheben.
2. **Vor einem Stable-Update:** Prüfung der Kompatibilität bestehender Module beim neuen Core, überprüfbare Zustände nach Installerende und Sicherung aller tatsächlich betroffenen Lernstandsspeicher verbindlich machen. Manuelle Windows-Testinstallation nicht mit Stable-Freigabe verwechseln.
3. **Später:** Explizite, versionierte Altstand-Übernahme und Community-Vertrauensmodell als getrennte Vorhaben. Beide bleiben in Phase K Konzept.
