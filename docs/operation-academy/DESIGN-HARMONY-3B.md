# Design Harmony – Etappe 3B: vollständige Updateprobe

**Stand:** 22.11.2026 · **Dokumentationsstatus:** beobachtete Ergebnisse von Rick; keine Produkt-, Installations- oder Releasefreigabe. Keine Veröffentlichung, kein Push auf `dev` und kein Core-Release.

## Ablauf und Ergebnisse

### 1. Seed – temporäres Profil mit vorhandenem Lernstand

Rick führte die Probe mit `probe-update.js` gegen eine Kopie des Profils mit installiertem Modul `desoworks.it-systemintegration` **1.0.2** aus. Das temporäre Profil lag unter `academy-3b-93ZvOG`. Als vorhandener Lernstand wurde unter anderem der Marker `lf3-dhcp` verwendet. Das Produktivprofil `C:\Users\<Benutzer>\AppData\Roaming\DesoWorks\Academy` wurde nicht geschrieben.

Der vorgesehene Kandidat ist **1.0.3**, also ein Versionsübergang von **1.0.2 auf 1.0.3**. Er führt den Quellstand und die benötigten Inhalte zusammen; Theme-Vertrag **1** bleibt enthalten. Der geprüfte Quellstand enthält unter anderem `anzeige-glossar.js` mit `data-academy-theme`. Im bisherigen Paketordner 1.0.2 fehlte dieses Attribut. Der Quellstand bleibt damit maßgeblich für die Theme-Korrekturen; die Updateprobe bestätigte, dass der installierte neue Paketstand das Attribut enthält.

### 2. Fehlschlag – Schutz von Paketstand und Lerndaten

Rick löste in der temporären Kopie zwei ablehnende Fälle aus:

- `same-version-different-content`
- `incompatible-theme`

Beide Versuche änderten weder den Marker noch den Lernstand. Die installierte Version blieb **1.0.2**. Damit ist für diese beiden beobachteten Fälle belegt, dass der abgelehnte Versuch den vorhandenen Marker/Lernfortschritt und den Versionsstand nicht veränderte. Die Same-Version-Codeprüfung liegt vor dem Löschen des bestehenden Paketordners.

Diese Beobachtung ist keine pauschale Garantie für jede Fehlerstelle oder jeden Updatepfad. Sie gilt für die genannten Proben und das temporäre Profil. Es fand keine Datenmigration statt.

### 3. Erfolg – Installation des Kandidaten

Anschließend installierte Rick über den vorhandenen Pfad `installFromDirectory` den Quellstand in das temporäre Profil. Beobachtet wurden:

- installierte Version **1.0.3**;
- `compatible: true`;
- `themeContract: 1`;
- vorhandener Lernstand `lf3-dhcp` weiterhin vorhanden;
- `anzeige-glossar.js` im neuen Paket enthält `data-academy-theme`;
- der alte Paketordner **1.0.2** blieb erhalten und unverändert; darin fehlte das Attribut weiterhin.

Das belegt den erfolgreichen Updateablauf in der temporären Profilkopie und den Erhalt des genannten Lernstands. Es belegt nicht die Installation in das Produktivprofil. Die vom Prüfstub ausgegebene Meldung `updates.status is not a function` stammt aus dem Probe-Stub; sie ist kein beobachteter Fehler des Academy-Updates und begrenzt die Aussagekraft dieses Stubs für genau diese API.

### 4. Darstellung – Academy-iframe

Rick prüfte die Darstellung im echten Academy-iframe. Beobachtete Kontrastverhältnisse für „Jetzt lernen“:

| Modus | Kontrast |
|---|---:|
| Dunkel (`#141114`) | **5,98:1** |
| Hell | **8,78:1** |
| Hoher Kontrast | **14,89:1** |

Der Fokus war über `focus()` sichtbar und maß **3 px**. Der Maus-Hover wurde nicht getroffen; ein Hover-Ergebnis ist daher **offen**.

Bei Zoomstufen **150 %** und **200 %** blieb der Link sichtbar; `scrollWidth` entsprach jeweils `clientWidth`. Die Tastaturprobe erreichte den Skip-Link der Academy-Shell. Dass Tab-Navigation in den iframe selbst hinein und durch dessen Inhalte geführt wurde, ist damit **nicht nachgewiesen**. Ein vollständiger Tastaturdurchlauf im iframe bleibt offen.

## Fünf UI-Zustände

Die Academy soll Status verständlich und unterscheidbar ausweisen, statt inkompatible Module kommentarlos zu sperren:

1. **Kompatibel und startbereit**
2. **Aktualisierung verfügbar**
3. **Inkompatibel, Aktualisierung erforderlich**
4. **Keine Aktualisierung verfügbar**
5. **Aktualisierung fehlgeschlagen**

Die fünf Sätze sind die geforderten verständlichen Zustandsbezeichnungen. Diese Dokumentation bestätigt nicht, dass sämtliche Zustände in allen Academy-Ansichten praktisch angeklickt und geprüft wurden. Insbesondere die UI-Probe für fehlgeschlagene Aktualisierung und ein tatsächlich nutzbarer sicherer Updateweg bei Inkompatibilität bleiben als vollständiger End-to-End-Nachweis offen.

## Offene Punkte und Abgrenzung

- Hover-Verhalten wurde nicht erfolgreich getroffen und bleibt ungeprüft.
- Die Tab-Probe hat den Shell-Skip-Link erreicht, nicht nachweislich den iframe-Inhalt; Tastaturbedienung im iframe ist offen.
- Der Stub-Fehler `updates.status is not a function` begrenzt die Aussagekraft des Prüfstubs für diese API.
- Die Updatefehler-Probe belegt die zwei genannten Ablehnungsfälle, nicht jede mögliche Fehlerursache.
- Die fünf Zustandsbezeichnungen sind dokumentiert; vollständige interaktive Prüfung aller Zustände, insbesondere „Aktualisierung fehlgeschlagen“ und eines sicheren Update-Angebots, ist nicht belegt.
- Die Resultate sind Ricks beobachtete Prüfergebnisse, keine unabhängige QA- oder Sicherheitsfreigabe.
- Es erfolgte kein Push; der von Rick angegebene Stand war `main` bei Commit `2e704e3`. Kein Produktivprofil wurde geändert.

**Einordnung:** Die temporäre Updateprobe lieferte positive Nachweise für den Übergang 1.0.2 → 1.0.3, den Theme-Vertrag 1, den Erhalt des beobachteten Lernstands und die drei Kontrastmessungen. Wegen der offenen Tastatur-, Hover- und UI-End-to-End-Prüfungen wird hieraus ausdrücklich keine Freigabe abgeleitet. Die Releaseentscheidung verbleibt beim Commander.
