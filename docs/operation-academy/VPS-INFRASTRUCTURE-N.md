# Phase N – Infrastrukturentscheidung: GitHub zuerst, kein VPS-Eingriff

**Stand:** 22.11.2026 · Terminus, First Officer · Bewertung, keine produktive Änderung

## Genügen GitHub Actions und GitHub Releases?

**Für Windows-Builds, Tests und die Ablage der Releases: ja. Für automatische Desktop-Updates aus dem heute privaten Repository: nur mit einem freigegebenen, berechtigten Abrufweg; anonym funktionieren sie nicht.** Diese Zugriffslücke ist kein Grund, jetzt einen VPS zu betreiben.

| Bedarf | Bewertung |
| --- | --- |
| Windows-Build und CI-Tests | GitHub-gehostete Windows-Runner können die Jobs ausführen. Kein eigener Runner und kein dauerhaft laufender Server nötig. Organisationsrichtlinien und Actions-Kontingent vor der Aktivierung prüfen. Ein CI-Build ersetzt nicht die unabhängige A/B-Abnahme auf Windows. |
| Paketablage und Veröffentlichung | GitHub Releases kann Installer, Modul-ZIPs und signierte Manifeste an eindeutigen Kanaltags bereitstellen; nicht die kurzlebigen Workflow-Artefakte als Updatequelle verwenden. GitHub dokumentiert weniger als 2 GiB pro Asset; der in [Phase M](PHASE-M.md) gemessene Download von 133 425 695 Bytes liegt darunter. Schreibrechte und die tatsächliche Veröffentlichung sind gesondert nachzuweisen. |
| Desktop-Abruf aus `DesoWorks/Academy` | Private Release-Assets setzen Repo-Lesezugriff voraus. Die Berechtigung des Actions-Jobs gilt nicht für Desktop-Clients. Ein berechtigter GitHub-Nutzerzugriff mit individuellen, kurzlebigen Anmeldedaten kann für einen kontrollierten Pilot ohne VPS genügen, sofern Repo-/Org-Richtlinie und Client-Anmeldung dafür freigegeben sind. Der Phase-M-Client ist dafür nicht eingerichtet. Keine gemeinsam genutzten Tokens oder festen Secrets in App oder Git. |
| Nutzer ohne GitHub-Repo-Zugriff | Actions und private Releases alleine genügen nicht. Bei diesem Bedarf die Auslieferungsstrategie freigeben lassen (z. B. öffentlich freigegebene Artefakte oder ein verwalteter HTTPS-Zugang mit serverseitiger Berechtigung), ohne daraus eine automatische Freigabe des Quellcode-Repositorys abzuleiten. Erst bei einem nachgewiesenen Bedarf, den ein verwalteter Abrufweg nicht sinnvoll abdeckt, wäre ein eigener Dienst neu zu bewerten. |

## VPS-Aktenlage und Empfehlung

| Angabe | Befund |
| --- | --- |
| Für Academy vorgesehener VPS, Host/Adresse, Benutzer, Port | **Unbekannt.** In den geprüften Academy-Akten ist kein konkreter VPS für Phase N benannt. |
| Ressourcen, Betreiber und Betriebsverantwortung | Unbekannt; keine seriöse Dimensionierung möglich und für GitHub-gehostete CI nicht erforderlich. |
| `desoworks.dev` und lokaler Phase-M-Feed | Die Akten dokumentieren HTTP 401 am Webhost und einen lokalen Loopback-Test. Beides weist keinen Academy-VPS und keinen funktionierenden Remote-Feed nach. |

**Empfehlung: GitHub Actions und GitHub Releases als Basis verwenden. Keine VPS-Änderung, kein eigener Runner, keine Beauftragung oder Konfiguration eines Servers.** Vor einem Desktop-Piloten nachweisen, dass der gepackte Client ohne lokalen Feed und ohne eingebettete Zugangsdaten ein autorisiertes Manifest und Paket abrufen kann. Die Kanal- und Integritätsprüfung gilt unabhängig vom Transport; siehe [Kanalarchitektur](CHANNEL-ARCHITECTURE-N.md). Die Erreichbarkeit von [github.com](https://github.com) wurde direkt geprüft; daraus folgt weder Zugriff auf das private Repo noch ein funktionsfähiger Desktop-Abruf.

## Offene Commander-Freigaben

- Nach der Sicherheitsprüfung: GitHub-Push des freizugebenden Stands, Aktivierung der dafür nötigen Actions-/Release-Berechtigungen und konkrete DEV-/BETA-Veröffentlichung.
- Berechtigten HTTPS-Abrufweg und Zielgruppe freigeben. Eine Änderung der Repo-Sichtbarkeit oder öffentliche Auslieferung bleibt separat zu entscheiden und ist nicht Voraussetzung für einen internen Pilot.
- Signaturschlüssel und Vorab-Signaturrichtlinie freigeben. STABLE bleibt bis zur Bereitstellung des fehlenden Windows-Herausgeberzertifikats, unabhängiger Abnahme und ausdrücklicher Release-Freigabe gesperrt.
- Separater Bootstrap für die alte Program-Files-Installation, falls sie in den Remote-Nachweis einbezogen werden soll. Keine VPS-Freigabe für die empfohlene Basis erforderlich; nur bei später belegtem Bedarf gesondert entscheiden.

**Quellen:** [Phase M](PHASE-M.md), [Phase-M-Architektur](UPDATE-ARCHITECTURE-M.md), GitHub-Dokumentation zu [gehosteten Runnern](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners), [Releases und Größenlimits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) und [Release-Asset-Zugriff](https://docs.github.com/en/rest/releases/assets).
