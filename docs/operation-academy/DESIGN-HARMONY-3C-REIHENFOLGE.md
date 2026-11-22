# Design Harmony 3C – Verbindliche Auslieferungsreihenfolge

**Stand:** 22. November 2026  
**Status:** Auslieferungsentscheidung, keine Release- oder Installationsfreigabe.  
**Grundlage:** Paket- und Updatepfade laut Bestandsaufnahme für 3C (`package.json`, `catalog/official.json`, `src/modules/manager.js`, `src/updates/service.js`) und der [lokale Nachweis aus 3B](DESIGN-HARMONY-3B-STATUS.md).

## Entscheidung: Modul zuerst paketieren, gemeinsam ausliefern

1. **Modul 1.0.3 zuerst fertigstellen und prüfen.** IT-Systemintegration 1.0.3 mit `runtime.themeContract: 1` und den dazu passenden offiziellen Katalogeintrag für denselben Core-Build vorbereiten. Der Pakettyp bleibt `trust: private`, `signed: false`; daraus folgt kein Nachweis einer Modulsignatur.
2. **Core und Modul in einem DEV-Core-Release ausliefern.** Der vorhandene Core-Paketbau übernimmt Paket und Katalog über `extraResources` nach `academy-modules` und `academy-catalog`. Der Eintrag `localPackage` verweist auf `modules/it-systemintegration`. Ausgeliefert wird erst, wenn beides im tatsächlich angebotenen Core-Artefakt vorhanden und nutzbar ist.
3. **Beim Anwender folgt auf das Core-Update das Profilupdate über den vorhandenen Katalog.** Das mitgelieferte Paket ersetzt ein installiertes Modul 1.0.2 nicht automatisch. Der Nutzer wählt **Aktualisieren** (`moduleInstallCatalog`), bevor er das Modul im neuen Core weiter nutzt. Der aktualisierte Core darf 1.0.2 nicht öffnen; er muss verständlich erklären, warum, und den vorhandenen Aktualisierungsweg direkt erreichbar machen.

## Freigabebedingung

**Kein Core-Release, solange der konkrete DEV-Releasekandidat nicht mit einem temporären Profil mit installiertem Modul 1.0.2 nachgewiesen hat, dass 1.0.3 direkt nach dem Core-Update aus dem mitgelieferten Katalog angeboten, installiert und geöffnet werden kann – ohne separaten Download, ohne Entfernen des alten Moduls und mit erhaltenem Lernstand.** Entscheidend ist das ausgelieferte Artefakt, nicht allein die Modulquelle im Repository. Für das Angebot muss 1.0.3 strikt neuer sein, Herausgeber und Vertrauensstufe müssen übereinstimmen und `compatibilityOf` muss das Paket als kompatibel einstufen. Die vorhandenen Integritäts-, Vertrauens- und Versionsprüfungen einschließlich der Downgrade-Sperre bleiben unverändert.

Ein abgelehntes Modulupdate darf den Paketbestand von 1.0.2 und dessen Lernstand nicht beschädigen. Der erhaltene Altbestand ist aber **kein** Nachweis, dass sich 1.0.2 im neuen Core öffnen lässt. Eine verständliche Sperrmeldung ist notwendig, ersetzt aber kein funktionierendes Updateangebot.

## Was diese Reihenfolge nicht ist

- **Kein Core allein mit späterer Modulnachlieferung.** Dadurch bliebe 1.0.2 im neuen Core gesperrt, ohne dass der mitgelieferte Katalog die Abhilfe bereitstellt.
- **Kein separates Modul-Release vor dem Core.** GitHub liefert in diesem Pfad Core-Updates (`kind: core`), keine Modulupdates (`moduleUpdates: []`). Der vorhandene lokale Feed für Modul-ZIPs ist nicht der Auslieferungsweg für diese Etappe.
- **Keine automatische oder atomare Aktualisierung im Nutzerprofil.** Gemeinsam ist die Auslieferung im Core-Artefakt; im Profil bleibt die Aktualisierung ein eigener Schritt im bestehenden Katalog.

Der lokale Nachweis aus 3B ersetzt den Nachweis am konkreten Releasekandidaten nicht. Diese Entscheidung erteilt keine Freigabe für Push, Merge, Veröffentlichung oder Installation.
