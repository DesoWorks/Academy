# ADR: Academy Core und IT-Ausbildung in getrennten Repositories

**Stand:** 2026-11-21 · **Status:** Architekturentscheidung für Phase I, keine Produktionsfreigabe.  
**Quellen:** Ricks Phase-I-Übergabe, lokaler Academy-HEAD/Reflog sowie `docs/operation-academy/ADR-ACADEMY-CORE.md` und `PHASE-H.md` im Repository IT-Ausbildung.

## Entscheidung

- `DesoWorks/Academy` ist das neue Repository für Electron-Hülle, neutrale Startseite, Navigation, Modulmanager, Laufzeit und Modul-API. Gemeinsame Einstellungen, Daten, Sicherung und Updates gehören in den Core. KI, IDE und SDK bleiben vorbereitete Schnittstellen; nicht verfügbare Funktionen werden als geplant gekennzeichnet.
- Die lokale Basis wurde laut Rick per Subtree-Split aus `IT-Ausbildung/desktop/` gewonnen. Der gelesene Academy-HEAD und Reflog zeigen `main` auf `fc6ade42`. Der Split erhält die auf `desktop/` bezogene Historie mit neu berechneten Commit-IDs, nicht den vollständigen Verlauf des Eltern-Repositories. Der Elternstand ist laut Übergabe durch `phase-h-secured-2026-11-21` auf `b7c60e1` und ein lokales Bundle gesichert; die Sicherung wurde hier weder geprüft noch verändert.
- `contentRoot` muss in Entwicklung und Paket auf eigene, ausdrücklich vorgesehene Core-Ressourcen zeigen, nicht auf das IT-Repository, ein gemeinsames Workspace-Elternverzeichnis oder ein eingebundenes Abbild der IT-Plattform. Installierte Module werden vom Manager geöffnet und nie als Ersatz für die Core-Startseite geladen.
- Das Standard-Datenverzeichnis ist `DesoWorks/Academy` unter Electron `appData` (Windows regulär `%APPDATA%`). `DesoWorks/IT-Ausbildung` wird weder automatisch gelesen noch kopiert, eingebunden, umbenannt oder gelöscht. Die Plattform startet mit einem eigenen Datenbestand.
- IT-Fachinhalt bleibt im bestehenden Repository, bis Modularchitektur und Migration ausdrücklich freigegeben sind. Verwaltung-Ausbildung bleibt unangetastet. Das Beispielmodul ist der einzige installierbare Testinhalt der Phase I; die Academy muss auch ohne installierte Module offline starten.

## Begründung und verworfene Alternative

Der Core ist als Produkt eigenständig, wenn Start, Daten und Paketierung nicht von einem Nachbarprojekt abhängen. Der Subtree-Split bewahrt die Entwicklung der Desktop-Hülle, ohne Fachinhalte oder deren Verlauf in den Core zu übernehmen. Getrennte Profile verhindern, dass ein Start der Academy versehentlich alte Daten verändert.

**Verworfen:** Die IT-Seite weiter als gebündelte Plattform ausliefern, etwa unter einer vorgeschalteten neutralen Startseite. Das wäre kurzfristig kompatibel, behielte aber die IT-Plattform als Sonderfall in Paket, Navigation, Modulmanager und Datenzugriff. Eine Startseite allein ist keine technische Trennung.

## Folgen

- Entwicklung und Windows-Build müssen aus dem Academy-Repository allein funktionieren. Der Installer enthält keine IT-Fachseiten. Modul-ID, Core-App-ID und Update-Ziel dürfen nicht über die alte Produktidentität gekoppelt bleiben.
- Core- und Modulversionen sind getrennt. Der Modulvertrag muss stabil und freigegeben sein, bevor Modul-Repositories angelegt und echte Fachpakete veröffentlicht werden.
- Vor einem späteren Wechsel der IT-Ausbildung ist eine prüfbare Datenübernahme mit Rückfallweg nötig. Es gibt keine automatische Übernahme in Phase I.
- Bestehende Repositories bleiben erhalten. Kein Push auf bestehende Hauptbranches, kein Merge und kein Release ohne ausdrückliche Freigabe. Die Namensprüfung ist keine Bestätigung einer GitHub-Anlage.

Siehe [Migrationsplan](MIGRATION-IT.md), [Repo-Namen](REPO-NAMEN.md) und [Architekturbewertung](TERMINUS-PHASE-I.md).
