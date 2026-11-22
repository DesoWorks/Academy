# OPERATION DESIGN HARMONY – ETAPPE 3C
## Ablauf und Ergebnis der lokalen DEV-Aktualisierungsprobe

**Stand:** 22. November 2026  
**Prüfgegenstand:** Academy, Modul `desoworks.it-systemintegration` 1.0.2 → 1.0.3  
**Prüfstatus:** Lokaler Nachweis im temporären Profil; keine Releasefreigabe.  
**Arbeitsstand:** Branch `feature/phase-n1-release-connectivity`, HEAD `95f0033dfa3ba3f6b51155c014dbc19a4178a7f3`; Arbeitsbaum nicht sauber. Das Dokument beschreibt Rick übermittelte Messungen und gespeicherte Proben, nicht einen von C-3PO neu ausgeführten Test.

## Kurzbefund

Im temporären Profil wurde ein vorhandenes Modul 1.0.2 ohne Theme-Vertrag als inkompatibel erkannt. Der vorhandene lokale Katalogweg bot 1.0.3 an. Zwei fehlgeschlagene Installationsversuche ließen Version, Paketmarker/-hash, Pfad und Lernstand unverändert. Anschließend wurde das Katalogpaket aus dem lokalen Verzeichnis installiert: Version 1.0.3 mit `themeContract: 1` war kompatibel, und die in der Probe erfassten abgeschlossenen sowie begonnenen Lernstände blieben erhalten. Die installierte Academy des Commanders blieb unberührt.

Der Standard-GitHub-Modulupdateweg ist nicht angebunden: `checkGithub` setzt `moduleUpdates` auf eine leere Liste. `extraResources` kopiert Moduldateien in den Core-Build, ist aber kein Installer und aktualisiert kein vorhandenes Profilmodul. Der getestete Katalogwechsel belegt daher nicht die vollständige Kette eines gebauten Core-Installers bis zum Profil. Die Ergebnisse reichen nicht für eine DEV-Releasefreigabe.

## 1. Vorhandene Wege und Rollen

### Lokaler Katalog – verwendeter Modulweg

Der Academy-Katalog enthält das Modul `desoworks.it-systemintegration` als lokales Paket. Der Manager vergleicht installierte und verfügbare Version, Kompatibilität, Herausgeber und Vertrauensstufe. Bei einem geeigneten höheren Katalogpaket kann der Nutzer **Aktualisieren** auslösen. Der Katalog-IPC löst den lokalen Paketordner auf und übergibt das Paket an `installFromDirectory`.

In der Probe war dies der tatsächlich benutzte Installationsweg: Das Paket aus `modules/it-systemintegration` wurde über `installFromDirectory` in das temporäre Profil eingebracht. Die Probe belegt diesen lokalen Manager-/Katalogschritt, nicht den Bau oder die Ausführung eines Core-Installers.

### GitHub-Modulweg – nicht angebunden

Der vorhandene GitHub-Updatecheck prüft Core-Releases; bei `checkGithub` ist `moduleUpdates` leer. Nur der konfigurierte Feed befüllt das Feld für Modulangebote, und der Feed wird in einem gepackten Build nicht über die dort verwendete Konfiguration aktiviert. Für diese Probe wurde kein GitHub-Modul-ZIP geladen oder installiert. Daher ist kein angebundener GitHub-Modulweg und kein GitHub-Modulupdate nachgewiesen.

### `extraResources` – Beilage, kein Profilupdate

Die Buildkonfiguration kopiert `modules` in `academy-modules` (und Katalogressourcen in den Build). Das macht die Dateien im Core-Artefakt verfügbar, führt aber nicht automatisch `installFromDirectory` für ein Nutzerprofil aus. In dieser Etappe wurde kein Installer gebaut. Die bloße Beilage eines Moduls in `extraResources` darf deshalb nicht als abgeschlossener Updateweg dokumentiert werden.

## 2. Paket 1.0.3 und Integritätsdaten

Das lokale Paketmanifest für 1.0.3 weist `themeContract: 1` aus. Die Probe dokumentiert `trust: private`, `signed: false` und kein Signaturfeld. Das ist kein Nachweis einer Modulsignatur; der SHA-256-Wert schützt die referenzierte Datei vor unbemerkter Abweichung, ersetzt aber keine Herausgeberauthentisierung.

Für das in der Probe erzeugte ZIP sind dokumentiert:

- Größe: **11.924.920 Bytes**
- SHA-256: `bce122626fffddf3fc9526ee394794c68bc405045248899310e2179fc31ebd7a`
- Manifestabgleich für Version 1.0.3: `match`
- künstlich abweichende Manifestversion 9.9.9: abgelehnt mit `manifest-mismatch`
- veränderter Hash: abgelehnt (`hashRejected: true`)

Diese Werte belegen die in der Probe ausgeführten Hash- und Manifestabgleiche. Eine Signaturprüfung kann nicht als bestanden gelten: Das Paket hat keine Signatur. Ebenso ist damit keine unabhängige Herkunftsprüfung des privaten Pakets belegt.

## 3. Versionsübergang im temporären Profil

Die Probe begann mit einer Kopie eines vorhandenen Moduls **1.0.2**, das keinen Theme-Vertrag deklariert. Das Profil enthielt vor dem Wechsel den Marker unter dem Versionspfad 1.0.2. Der Manager meldete:

- `compatible: false`; Grund: Das Modul deklariert keinen Theme-Vertrag und übernimmt den Darstellungsmodus der Academy nicht.
- `updateAvailable: true`, verfügbare Version **1.0.3**, `canUpdate: true`.
- Signatur: nicht vorhanden.

Vor der erfolgreichen Installation wurden zwei Negativfälle erprobt:

1. Inhalt mit derselben Versionsnummer, aber abweichendem Inhalt: `same-version-different-content`.
2. Inkompatibles Theme-Paket: `incompatible-theme`.

Nach beiden Fehlschlägen blieben laut Probe die aktive Version **1.0.2**, Paketmarker/-hash, Installationspfad und Lernstand unverändert. Das belegt Bestandserhalt für genau diese beiden geprüften Ablehnungsfälle. Es belegt nicht alle denkbaren Fehler während Download, Entpacken, Dateikopie oder Aktivierung.

Danach installierte `installFromDirectory` das Katalogpaket aus `modules/it-systemintegration`. Im Ergebnis war **1.0.3** aktiv, kompatibel, mit `themeContract: 1`; ein weiteres Update wurde nicht angeboten. Der lokale Profilmarker der installierten Academy des Commanders blieb zeitlich unverändert. Das Update lief ausschließlich in einem temporären Datenverzeichnis (`profileUntouched: true`).

**Grenze des Nachweises:** Es wurde kein vollständiger Ablauf vom Core-Update eines bestehenden Anwenderprofils bis zur Kataloginstallation im ausgelieferten Core-Artefakt dokumentiert. Ebenso wenig wurde geprüft, ob ein Abbruch nach einem konkreten Fehlerzeitpunkt automatisch einen benutzbaren Altstand wiederherstellt. Der Erhalt der Dateien und Daten ist nicht gleichbedeutend mit der Öffnbarkeit von 1.0.2 unter einem Core, der den Theme-Vertrag verlangt.

## 4. Lernstand und Datenintegrität

Im temporären Profil wurden nach dem Wechsel folgende Lernwerte gelesen:

| Bereich | Schlüssel | gespeicherter Stand nach Update |
|---|---|---|
| Aufgabe | `lf3-dhcp` | `correct: true`, Status `abgeschlossen` |
| Aufgabe | `lf3-skizze` | `correct: false`, Status `begonnen`, Antwort `unvollstaendig` |
| Prüfung | `q1` | `correct: true` |
| Prüfung | `q2` | `correct: false`, Antwort `offen` |

Die Probe meldet `progressKept: true`; dieselben Werte wurden im Ergebnisobjekt nach der Installation ausgewiesen. Damit sind in diesem temporären Lauf ein abgeschlossener Stand und teilweise bearbeitete Stände erhalten geblieben. Daraus folgt keine allgemeine Garantie für andere Datenbankzustände oder für eine Migration aller möglichen Webspeicherwerte.

Bei den beiden fehlgeschlagenen Installationsversuchen blieben Lernstand und Versionspfad ebenfalls unverändert. Der Datenbestand der installierten Academy des Commanders wurde nicht für diese Probe verwendet und nicht verändert.

## 5. Inkompatibilitätsanzeige

Die gespeicherte Kartenprobe zeigt für das installierte 1.0.2 verständlich:

> Inkompatibel, Aktualisierung erforderlich: Das Modul deklariert keinen Theme-Vertrag und übernimmt den Darstellungsmodus der Academy nicht.

Sie weist **Installiert: 1.0.2**, **Verfügbar: 1.0.3** und den Button **Aktualisieren** aus; ein Öffnen-Button war nicht vorhanden (`open: null`). Das ist ein konkreter Nachweis der Karte und ihrer sicheren angebotenen Aktion in dieser Probe. Es belegt nicht das Verhalten sämtlicher Ansichten, jedes Fehlers oder eines Abbruchs.

## 6. Darstellung und Bedienbarkeit nach dem Update

Die gespeicherte iframe-Probe wurde in einem temporären Datenverzeichnis mit 1.0.3 ausgeführt. Sie erfasste die Themenübersicht in Hell, Dunkel und hohem Kontrast. Gemessener Kontrast des Links „Jetzt lernen“:

| Modus | Kontrast |
|---|---:|
| Dunkel | 5,98:1 |
| Hell | 8,78:1 |
| Hoher Kontrast | 14,89:1 |

Diese Zahlen sind Messwerte an der erfassten Link-Stichprobe, keine WCAG-Gesamtfreigabe. Die Probe berichtet außerdem sichtbaren Link bei 150 % Zoom in Dunkel und 200 % in Hell sowie Kontrast; `scrollWidth` entsprach dort `clientWidth`. Das sind begrenzte Stichproben und kein vollständiger Reflow-Test.

Offene bzw. nicht als bestanden belegte Bedienprüfungen:

- **Tastatur:** Tab blieb in der Shell; eine vollständige Fokusnavigation im iframe ist nicht nachgewiesen.
- **Screenreader:** kein dokumentierter Screenreader-Lauf.
- **Hover:** Hover wurde nicht getroffen; damit ist Hover-Darstellung nicht geprüft.
- **Zoom/Reflow:** einzelne Link-Sichtbarkeit ohne gemessene Überbreite belegt nur diese Ausschnitte; kein vollständiger 150-/200-%- und Reflow-Test über alle Ansichten.
- **Darstellungswechsel:** die Modi wurden separat erfasst; ein vollständiger Wechsel während einer Sitzung samt Navigation und Lernstanddarstellung ist nicht nachgewiesen.

## 7. Auslieferungsreihenfolge und Freigabeentscheidung

Die Empfehlung aus der dokumentierten Reihenfolge bleibt: 1.0.3 zuerst als passendes Paket bereitstellen und den Core samt Modul und Katalog gemeinsam ausliefern. Anschließend muss der bestehende Katalogweg im aktualisierten Core ein vorhandenes Profilmodul 1.0.2 zuverlässig als Update anbieten. Ein Core allein darf den Anwender nicht ohne verständlichen Hinweis und sichere Aktualisierungsmöglichkeit mit gesperrtem Altmodul zurücklassen. Das ist eine Empfehlung; die vollständige Kette im konkreten Core-Artefakt ist mit dieser Probe nicht belegt.

**DEV-Release-Empfehlung: nicht freigeben.** Die lokale Probe bestätigt den temporären Katalogwechsel, die geprüften Paketabgleiche, den Bestandserhalt in zwei Ablehnungsfällen, die genannten Lernstände und die begrenzten iframe-Messungen. Sie bestätigt weder den Updateweg im gebauten Installer noch einen angebundenen GitHub-Modulweg, eine Modulsignatur, vollständige Fehlerrückkehr, umfassende Barrierefreiheit oder die vollständige Auslieferungskette. Eine spätere Freigabeentscheidung benötigt den Nachweis am konkreten Core-Kandidaten mit temporärem Altprofil. Die Commander-Installation bleibt unangetastet.

## Quellen und Prüfgrenzen

- Rick übermittelte Messungen, dokumentiert in [`probe-chain.json`](design-harmony-3c/probe-chain.json), [`probe-card.json`](design-harmony-3c/probe-card.json) und [`probe-uebersicht.json`](design-harmony-3c/probe-uebersicht.json).
- Bestandsaufnahme: [`DESIGN-HARMONY-3C-BESTAND.md`](DESIGN-HARMONY-3C-BESTAND.md).
- Reihenfolgeentscheidung: [`DESIGN-HARMONY-3C-REIHENFOLGE.md`](DESIGN-HARMONY-3C-REIHENFOLGE.md).
- Sicherheitsbewertung: [`DESIGN-HARMONY-3C-SECURITY.md`](DESIGN-HARMONY-3C-SECURITY.md).
- Vorheriger lokaler Nachweis: [`DESIGN-HARMONY-3B-STATUS.md`](DESIGN-HARMONY-3B-STATUS.md).

Dieses Dokument fasst vorhandene Nachweise zusammen. Es enthält keine neue Laufzeitprüfung und erteilt keine technische, sicherheitsbezogene oder Releasefreigabe. Kein Code, kein Push, kein Merge, keine Veröffentlichung und keine Installation auf der Commander-Academy wurden im Rahmen dieser Dokumentation ausgeführt.
