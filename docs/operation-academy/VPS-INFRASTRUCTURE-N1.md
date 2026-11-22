# Phase N.1 – Infrastrukturentscheidung: Öffentliche GitHub-Releases ohne VPS

**Status:** Festgelegte Entscheidung · 22.11.2026 · Terminus, First Officer. Keine produktive Änderung. Aktualisiert die [Infrastrukturbewertung aus Phase N](VPS-INFRASTRUCTURE-N.md), die von einem privaten Repository ausging.

## Entscheidung und Alternativen

**Der Academy-Client bezieht normale Updates direkt aus den öffentlichen GitHub-Releases von `DesoWorks/Academy`. GitHub Actions sind für Build, Test und Veröffentlichung vorgesehen. Für Phase N.1 wird kein VPS eingesetzt.** Laut Lead ist das Repository öffentlich, aber ohne Releases; die lokalen Workflows und der Updatecode sind noch nicht auf `origin`. Die Infrastrukturentscheidung ist deshalb kein Nachweis eines laufenden Updatebetriebs.

| Variante | Vorteil | Nachteil und Entscheidung |
| --- | --- | --- |
| **A – Öffentliche GitHub-Releases, anonym** | GitHub übernimmt Release-Metadaten und Asset-Auslieferung. Keine Desktop-Credentials und kein eigener Server. | **Gewählt.** GitHub-Verfügbarkeit, REST-Limits und Netzrestriktionen bleiben Abhängigkeiten. Kontrollierte Prüffrequenz, Pagination, Backoff und verständliche Fehler statt zusätzlicher Infrastruktur. |
| B – Direktabruf mit GitHub-Token | Sinnvoll für ausdrücklich private Inhalte und Nutzer mit GitHub-Repo-Zugriff; Authentifizierung kann das REST-Limit erhöhen. | **Für normale Updates abgelehnt.** Kein privater Inhalt benötigt. Ablauf, Widerruf und GitHub-Berechtigungen schaffen unnötigen Support- und Sicherheitsaufwand. Ein eingebettetes oder gemeinsam genutztes Token ist unzulässig. Separate Prüfung nur bei einem späteren privaten Pilot mit individuellen, eng begrenzten und widerrufbaren Leserechten. |
| C – VPS als Vermittler (Proxy/Cache oder Zugangsdienst) | Könnte bei einer belegten Anforderung Releases zwischenspeichern oder Zugang unabhängig von GitHub-Nutzerkonten vermitteln. | **Abgelehnt, solange kein belegter Bedarf vorliegt.** Zusätzliche Ausfallstelle, TLS-, Patch-, Monitoring- und Betriebsaufwand; Cache kann veraltete Releases liefern. Ein privater Vermittler würde außerdem serverseitige Zugangsdaten verwalten. Keine dieser Kosten löst in N.1 ein bestehendes Problem. |

Für den öffentlichen Weg nennt GitHub ein primäres anonymes REST-Limit von 60 Anfragen pro Stunde je Ursprungs-IP; gemeinsam genutzte Netze sind daher relevant. Das ist das dokumentierte API-Limit, kein gemessenes Limit für Asset-Downloads. Prüffrequenz, bedingte Anfragen, begrenzte Pagination und Behandlung von `403`/`429` beziehungsweise Rate-Limit-Headern vor der Freigabe unter realistischen Netzbedingungen prüfen. Bei Quellenausfall oder Limit bleibt die Installation unverändert; keinen VPS und kein Token stillschweigend als Fallback heranziehen. Quellen: [GitHub REST-Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), [Release-Assets](https://docs.github.com/en/rest/releases/assets).

## Zuständigkeiten und Vertrauensgrenzen

| Ebene | Vorgesehene Aufgabe | Nachweisgrenze |
| --- | --- | --- |
| GitHub Actions | Windows-Test und Build, endgültiges Paket und Manifest erzeugen und signieren. Ein separater Veröffentlichungsjob nutzt das laufgebundene `GITHUB_TOKEN` mit `contents: write`, nicht der Desktop-Client. | Die lokalen [DEV](../../.github/workflows/academy-dev.yml)-, [BETA](../../.github/workflows/academy-beta.yml)- und [STABLE](../../.github/workflows/academy-stable.yml)-Workflows definieren getrennte Build- und Publish-Jobs. STABLE referenziert `stable-release`; wirksame Environment-Regeln, Secret-Scope, tatsächliche Runner und Läufe sind damit nicht belegt. Der gelesene Build erhält den Signierschlüssel auf Job-Ebene; vor Freigabe prüfen, wie der Zugriff auf den nötigen Schritt begrenzt wird. |
| GitHub Releases | Dauerhafte Bezugspunkte pro Kanaltag für Installer und `manifest.json`/`.sig`. Die Workflows sehen Prüfung der Manifest-Assets im Entwurf vor Veröffentlichung vor. | GitHub Actions-Artefakte dienen der Job-Übergabe, nicht dem Desktop-Abruf. Zielpfad ist öffentliche Release-Liste plus `browser_download_url`; der gelesene Client nutzt noch Token-Gate und API-Asset-Pfad. |
| Desktop-Client | Ausschließlich der gewählte Kanal, Ed25519-Prüfung der unveränderten Manifestbytes mit eingebautem öffentlichem Schlüssel, Paketbindung und SHA-256; für STABLE zusätzlich Authenticode. | Transport und Release-Zugang ersetzen keine lokale Vertrauensprüfung. Der private Signierschlüssel gehört weder in das Repo noch auf einen Download-Vermittler. Der [Kanal-ADR](CHANNEL-ARCHITECTURE-N1.md) dokumentiert Ist-Stand und Prüfvertrag. |

## VPS-Aktenlage und Anlass für eine Neubewertung

Ein für Academy bestimmter VPS ist **nicht benannt**. Hostname, Ressourcen, Betreiber und Betriebsverantwortung sind unbekannt; frühere Webhosts oder ein Loopback-Feed sind kein Nachweis. Keine Serverkonfiguration, keine DNS-Änderung und kein eigener Runner sind Teil dieses Auftrags.

Nur neu bewerten, wenn ein konkreter Bedarf nachgewiesen ist: etwa wiederholt gemessene Ausfälle oder Rate-Limit-Probleme, die nach konservativer Taktung und Backoff fortbestehen, oder ein ausdrücklich freigegebener privater Vertrieb an Nutzer ohne GitHub-Zugang. Zuerst einen verwalteten Bereitstellungsweg mit einem selbst betriebenen Dienst vergleichen; bei einem Vermittler End-to-End-Signaturprüfung unverändert lassen. Dienstziel, Betreiber, Zugriff, Aktualität und Wiederanlauf vor gesonderter Freigabe klären. Eine Neubewertung ist keine Betriebsfreigabe.

## Offen vor dem Releasebetrieb

- ROBOCOP prüft den freizugebenden Stand, Workflow-Berechtigungen, Secret-Scope und Schutz der Release-Branches, Tags und Environments. Push, Merge und Veröffentlichung bleiben bis zur jeweiligen Freigabe ausgesetzt.
- Öffentliche Release-Assets, anonymer Abruf, Limit-/Fehlerverhalten und echter Windows-A→B-Lauf je freigegebenem Kanal sind noch nicht belegt. Die Abnahme schließt den Erhalt vorhandener Lern- und Anwendungsdaten ein.
- Bereitstellung und Rotation der Signaturschlüssel, Herausgeberzertifikat und geprüfter Thumbprint im gepackten STABLE-Client bleiben offen. Ohne Zertifikat und ausdrückliche Freigabe kein STABLE-Release. Kein VPS ist nötig, um diese Voraussetzungen zu erfüllen.
