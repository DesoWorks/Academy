# Phase N – Architektur der Updatekanäle

**Stand:** 22.11.2026 · Terminus, First Officer · Soll-Vertrag, keine Veröffentlichung

## Ausgangslage

[Phase M](PHASE-M.md) belegt DEV-Updates mit zwei vorhandenen Windows-Installern in einer isolierten Installation über `127.0.0.1:47321`, nicht den Abruf von GitHub und nicht die Migration der installierten Program-Files-Version 0.3.0. Die [Architekturprüfung aus Phase M](UPDATE-ARCHITECTURE-M.md) bleibt gültige Referenz. Der Phasenbericht nennt `7876297` als Client-Stand; der Lead nennt `49b089a` als Phase-M-Abschluss auf `feature/phase-m-live-update`. `main` bleibt laut Lead bei `2e704e3`; ein Push des Feature-Stands ist nicht nachgewiesen.

Der gelesene Client ist noch kein Drei-Kanal-Client: [`feed.js`](../../src/updates/feed.js) unterscheidet primär über das GitHub-Prerelease-Flag; [`service.js`](../../src/updates/service.js) behandelt jeden Nicht-Stable-Kanal als DEV, speichert gemeinsamen Core-Zustand und sperrt ältere oder gleiche Versionen. Das sind Implementierungslücken gegenüber dem folgenden Vertrag, keine bereits verfügbaren Funktionen.

## Eine Installation, drei Quellen

Eine installierte Academy mit einem Datenprofil. Die Einstellungen speichern den **gewählten Updatekanal**; die Updateansicht zeigt getrennt davon **Version und Herkunftskanal des tatsächlich installierten Builds**. Ein Wechsel der Präferenz ändert nur die Quelle und installiert nichts. Bei einer Neuinstallation ist STABLE die Voreinstellung, sofern nicht bewusst anders gewählt; eine noch nicht freigegebene Quelle bleibt gesperrt. Die alte 0.3.0 benötigt einmalig einen separat freigegebenen Bootstrap mit Sicherung; ein GitHub-Release allein aktualisiert sie nicht.

| Kanal | Einziger zulässiger Quellbranch | Kanaltag (Beispiel) | Versionsform | GitHub-Status |
| --- | --- | --- | --- | --- |
| DEV | `dev` | `dev/v0.3.1-dev.2` | `MAJOR.MINOR.PATCH-dev.N` | Prerelease |
| BETA | `beta` | `beta/v0.3.1-beta.1` | `MAJOR.MINOR.PATCH-beta.N` | Prerelease |
| STABLE | `main` | `stable/v0.3.1` | `MAJOR.MINOR.PATCH` | Kein Prerelease; ausdrückliche Freigabe und Herausgeberzertifikat nötig |

Veröffentlichung nur aus dem jeweils zulässigen Branch-Workflow: Der Tag muss auf den exakten geprüften Build-Commit zeigen. Die Pipeline dokumentiert Branch und vollständige Commit-ID im signierten Manifest. Ein Branch-Name aus GitHub-Metadaten allein ist kein Commitnachweis. DEV–BETA–STABLE sind getrennte Veröffentlichungen; keine Umbenennung eines vorhandenen Pakets oder nachträgliche Umetikettierung per GitHub-Flag. Build/Test benötigen keine Release-Schreibrechte; nur der getrennte Veröffentlichungsjob erhält diese, STABLE erst nach der Freigabe. Tags und veröffentlichte Assets nicht überschreiben; fehlerhafte Pakete durch neue Versionen ersetzen und gegebenenfalls sperren.

Der Client ermittelt Kandidaten **über den eindeutigen Tag-Präfix und das signierte Manifestfeld `channel`**, nie über GitHubs „Latest release“, Datum, das Prerelease-Flag allein oder die Reihenfolge der API-Liste. Tag, Manifest, erwarteter Branch, Version, Prerelease-Flag und Plattform müssen zusammenpassen. Entwürfe, unbekannte oder widersprüchliche Einträge sind nicht installierbar; widersprüchliche Manifeste zur selben Paketidentität blockieren diese Version. Nur unter gültigen Kandidaten des gewählten Kanals wird nach SemVer ausgewählt. Bei fehlender, gesperrter oder nicht erreichbarer Quelle bleibt die Installation unverändert; kein Kanal-Fallback. Die Tag-Namensräume benötigen eine Änderung der bestehenden GitHub-Abbildung, die heute nur ein führendes `v` entfernt.

## Versionierung und Kanalwechsel

MAJOR steht für inkompatible Änderungen, MINOR für kompatible Erweiterungen, PATCH für kompatible Korrekturen. `N` ist eine positive, pro Kanal und Basisversion steigende Dezimalzahl ohne führende Null. Nur kanonische Versionen der obigen Formen sind zulässig; keine Build-Metadaten für die Release-Auswahl. Core-Zahlen und rein numerische Prerelease-Teile werden numerisch verglichen: **`0.3.1-dev.2 < 0.3.1-dev.10 < 0.3.1`**. Nichtnumerische Kennungen folgen der SemVer-Sortierung (`beta` vor `dev` bei gleicher Basis); diese Reihenfolge erteilt keine Freigabe zum Kanalwechsel. [`semver.js`](../../src/updates/semver.js) enthält den numerischen Vergleich aus dem Phase-M-Nachtrag; die strikte Eingabevalidierung, die Kanalbindung und gepackte Windows-Tests bleiben Phase-N-Aufgaben.

| Wechsel | Regel für die Nutzereinstellung |
| --- | --- |
| DEV → BETA, DEV → STABLE, BETA → STABLE | Manuell zulässig, sobald der Zielkanal freigegeben ist. Vor der Installation Zielversion und eventuellen Downgrade anzeigen. |
| STABLE → BETA, STABLE → DEV, BETA → DEV | Nur nach bewusstem Opt-in mit ausdrücklichem Hinweis auf Vorabversionen und bei gültiger Zugriffsberechtigung für den Zielkanal. Kein Opt-in bei gesperrter Quelle. |
| Automatischer Wechsel, Wechsel während einer laufenden Installation oder Installation aus dem nicht gewählten Kanal | Verboten. Laufenden Download vor dem Wechsel beenden oder abbrechen; ausstehende Kandidaten, Bestätigungen und vorbereitete Pakete des alten Kanals für die Installation ungültig machen. |

Im normalen Update nur höhere Versionen; gleiche Version bedeutet keine Neuinstallation. Ein **Downgrade** ist ausschließlich als bewusster Kanalwechsel möglich, wenn das Zielpaket älter, verifiziert und für den Datenstand kompatibel ist: Anzeige von Quelle/Ziel, Versionen und Datenrisiko; **separate Bestätigung für genau dieses Paket** und geprüfte Sicherung vor Installation. Kein Downgrade bei unbekannter oder nicht unterstützter Rückwärtsmigration; kein automatischer Downgrade oder Installations-Rollback. Auch beim Übergang zu STABLE gilt diese Regel: etwa `0.4.0-dev.2 → 0.3.1`. Der Zielkanal bleibt danach die einzige Quelle, während die Anzeige den installierten Build erst nach belegtem Installationserfolg aktualisiert. Download- und Installationszustand sind nach Kanal, Paketart, Version und Plattform zu trennen und beim Neustart erneut gegen die aktuelle Quelle zu prüfen.

## Versionierter Manifestvertrag

Ein Manifest pro Veröffentlichung; ein Eintrag pro Paket/Plattform. Jedes Paket ist eindeutig über Kanal, Paketart, ggf. Modul-ID, Version und Plattform identifiziert. Veröffentlichungen zunächst als Entwurf behandeln, alle Daten und Assets prüfen, erst dann sichtbar machen. Die Manifest-Signatur bindet alle Angaben einschließlich Hash, Kanal und Zeit an einen vom Client für den jeweiligen Kanal vertrauten Release-Schlüssel. Ein SHA-256-Hash alleine beweist nur Integrität gegenüber der erwarteten Prüfsumme, nicht die Herkunft.

| Feld | Verbindlicher Inhalt |
| --- | --- |
| `schemaVersion`, `product` | Unterstützte Schemaversion und feste Produktkennung `desoworks-academy`. Unbekanntes Schema ablehnen. |
| `channel`, `sourceBranch`, `releaseTag` | `dev`, `beta` oder `stable`; passender Branch und eindeutiger Kanaltag. |
| `version`, `commit`, `publishedAt` | Kanonische Paketversion, vollständige Commit-ID des Paket-Builds, Veröffentlichungszeit als ISO 8601 in UTC. Das Manifest kann verschiedene Paketversionen enthalten; die Core-Version entspricht im Core-Release dem Tag. Modul-only-Releases verwenden den Kanaltag ihrer Paketversion mit separatem Modul-Namensraum, z. B. `beta/modules/de.academy.demo/v1.0.2-beta.1`. |
| `package` | Paketart `core` oder `module`, bei Modul zusätzlich Modul-ID; eindeutiger versionierter Assetname, feste Asset-Referenz, Größe in Bytes. Core = Windows-Installer, Modul = ZIP. |
| `sha256` | 64 Hexzeichen, berechnet über das endgültige Asset nach etwaiger Paketsignierung; Vergleich nach Download und vor der Anwendung. |
| `signatureStatus` | Deklarierter Paketstatus `signed`, `unsigned` oder bei Modul-ZIP `not-applicable`; bei signiertem Core die Kennung des vorgesehenen Signierers. Kein Ersatz für lokale Prüfung. |
| `minimumCore`, `platform` | Kleinste unterstützte installierte Core-Version oder `null` nur ohne Mindestanforderung; bei Modulen Pflicht. Bei Bedarf zusätzlich obere Kompatibilitätsgrenze. Plattform umfasst Betriebssystem und Architektur, z. B. `win32-x64` oder `any` nur für plattformneutrale Module. |

Die Manifest-Signatur ist in allen Remote-Kanälen Pflicht; eine fehlende, ungültige oder kanal-fremde Signatur blockiert die Installation. Für STABLE-Core ist zusätzlich lokal validiertes Authenticode mit dem freigegebenen Herausgeberzertifikat Pflicht (vgl. [`signature.js`](../../src/updates/signature.js)). Nicht Authenticode-signierte DEV-/BETA-Core-Pakete kommen nur bei ausdrücklich freigegebener Richtlinie für Vorabversionen infrage und werden als solche angezeigt; eine als signiert deklarierte, aber lokal nicht gültige EXE wird abgelehnt. HTTPS und gebundene Repo-/Asset-Herkunft gelten für Remote-Downloads. Keine persönlichen oder dauerhaft eingebetteten GitHub-Zugangsdaten im Client; siehe [Infrastruktur](VPS-INFRASTRUCTURE-N.md).

## Core und Module bleiben getrennt

Core-Updates verwenden den geprüften Installer, verlangen vor dem Start eine Lerndatensicherung und aktualisieren Module nicht nebenbei. Modulupdates betreffen nur die jeweilige installierte Modul-ID, vergleichen deren eigene Version und prüfen Mindest-Core sowie ggf. zusätzliche Kompatibilitätsgrenzen. Ein Modul-ZIP wird separat geprüft und erst nach Abgleich des internen `academy-module.json` mit dem Release-Eintrag angewendet; kein NSIS, keine Änderung der Core-Version. Der bestehende Modulabgleich prüft ID und Version ([`module-manifest.js`](../../src/updates/module-manifest.js)); Paketgrenzen beim Entpacken bleiben erhalten ([`zip.js`](../../src/updates/zip.js)). Der Kanalwechsel löst keine Modul-Downgrades aus. Inkompatible vorhandene Module werden vor einem Core-Wechsel angezeigt; ist keine sichere Weiterverwendung oder Wiederherstellung möglich, bleibt der Wechsel gesperrt.

## Übergabe und offene Commander-Freigaben

1. **GitHub-Push und Releases:** Freigabe des konkreten Stands und der DEV-/BETA-Veröffentlichung nach Sicherheitsprüfung von Historie, Berechtigungen und Kanaltrennung. Repo-Sichtbarkeit nicht stillschweigend ändern; den berechtigten HTTPS-Abrufweg für das private Repository gesondert freigeben. Öffentliche Distribution oder Repo-Sichtbarkeit erfordern eine separate Entscheidung.
2. **Vertrauensmaterial:** Signaturschlüssel pro Kanal und Richtlinie für nicht Authenticode-signierte DEV-/BETA-Pakete freigeben; Windows-Herausgeberzertifikat für STABLE fehlt. STABLE erst mit bereitgestelltem Zertifikat, unabhängiger Windows-Abnahme und ausdrücklicher Release-Freigabe.
3. **Bestehende Program-Files-Installation:** Einmaligen Bootstrap mit Sicherung und geklärtem Wiederherstellungsweg separat freigeben. Bis dahin nur isolierte Windows-Profile für den Phase-N-Nachweis.

Jarvis implementiert, ROBOCOP prüft Vertrauen und Berechtigungen, GLaDOS nimmt die gepackten A/B-Updates ab. Mindestnachweis: remote ohne Loopback in jedem freigegebenen Kanal; fremde Kanalmarkierung, widersprüchliches Flag, falsche Plattform, fehlende Berechtigung, fehlerhafter Hash/Signatur und Neustart mit kanal-fremdem vorbereitetem Paket werden abgewiesen; numerisches Prerelease-Ranking, Downgrade mit getrenntem Opt-in, Datenerhalt und ein reines Modulupdate sind unabhängig nachzuweisen. Phase M bleibt Ausgangsevidenz, kein Ersatz für diese Tests.
