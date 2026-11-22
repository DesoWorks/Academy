# Design Harmony 2C – QA-Bewertung

**Projekt:** IT-Ausbildung / Academy  
**Prüfumfang:** kontrollierter LF3-Rollout – fünf Seiten im Academy-iframe, Hell/Dunkel/Kontrast sowie die bereitgestellten Tastatur-, Zoom-, Reflow- und Persistenzbelege  
**Testkontext:** Modul `desoworks.it-systemintegration` Version `1.0.1`, Status `active`; temporäres `userData`. Die Installation des Commanders wurde nicht geöffnet.  
**Urteil:** **EINGESCHRÄNKT**. Die gelieferten Messungen und Screenshots stützen eine Theme-Kompatibilität der geprüften Flächen, nicht aber eine vollständige Bedienbarkeits- oder Barrierefreiheitsfreigabe. Keine Produktfreigabe; kein WCAG-Erfolg festgestellt.

## Bewertungsgrundlage

Bewertet wurden ausschließlich die mitgelieferten Dateien in `docs/operation-academy/design-harmony-2c/`: `probe-academy.json`, `probe-sketch.json`, `probe-visual.json` sowie die dort referenzierten Screenshots. Die Messungen stammen aus dem tatsächlichen Academy-iframe. Die Prüfumgebung war temporär und nicht die Installation des Commanders. Der Prüfhinweis `updates.status is not a function` stammt laut Prüfkontext vom Prüfstub und ist kein Befund über die Academy-Funktion selbst.

Getestete Seiten:

- `lf3-dhcp.html`
- `lf3-dns.html`
- `lf3-verbindung-eingrenzen.html`
- `lf3-fehlerbild-protokoll.html`
- `lf3-ipv4-konfiguration.html`

## Gemessen

- Für alle fünf Seiten meldet `probe-academy.json` in Hell `data-academy-theme=hell` und `data-theme=hell`, in Dunkel jeweils `dunkel`; die Academy-URL trägt den passenden Theme-Parameter.
- Gemessene thematische Flächen (`.skizze` beziehungsweise `.karte`):
  - **Dunkel:** Hintergrund `rgb(20, 17, 20)` (`#141114`), Text `rgb(247, 244, 245)`, Kontrastangabe `17,15:1`.
  - **Hell:** Hintergrund `rgb(255, 255, 255)`, Text `rgb(27, 36, 48)`, Kontrastangabe `15,65:1`.
  - **Kontrastmodus:** Hintergrund weiß, Text schwarz, Kontrastangabe `21:1`; Messungen umfassen die fünf Seiten. Die Theme-Auswahl ist als deaktiviert protokolliert.
- Bei 100 %, 150 % und 200 % ist für die gemessenen Fälle `overflowX=false` protokolliert. Bei 200 %: `scrollWidth=clientWidth=617`. Das belegt nur die erfasste horizontale Überlaufmessung, nicht vollständigen Reflow oder die Nutzbarkeit sämtlicher Inhalte und Bedienelemente.
- Nach `scrollIntoView` der Fläche ist `navInView=false` bei den vergrößerten Messungen. Die Messung belegt keine gleichzeitige Sichtbarkeit der Modulnavigation und der Fläche.
- Beim Tastaturlauf wurden zwölf Tab-Schritte von der Shell bis zum Skip-Link gemessen. Der Skip-Link hatte den sichtbaren Fokuswert `solid 3px rgb(255, 83, 105)` und `inView=true`. Nach Return, Enter und anschließendem Tab blieb derselbe Skip-Link fokussiert. Laut Prüfbefund ist dies eine Grenze von `sendInputEvent`, nachdem das iframe-Element im Parent fokussiert wurde. Damit ist weder die Aktivierung des Skip-Links per Enter noch der nächste Tab-Stopp nachgewiesen.
- Persistenz: Textgröße `150` und Einstellung `mehr-abstand` überlebten einen iframe-Reload. Ein gespeicherter Modulwert `theme=hell` überschieb nicht das gemessene `data-theme=dunkel`. `academy.theme=kontrast` und Modulfortschritt `2c-probe` überlebten einen zweiten Prozess auf demselben temporären Datenverzeichnis.
- Der Lektionsschlüssel `it-ausbildung.lf3-dhcp.v1` wurde nicht geschrieben. Seiten-Lernstand ist daher nicht nachgewiesen.

## Gesehen

- Die fünf Seiten besitzen bereitgestellte Screenshots in Hell und Dunkel sowie Kontrast-Screenshots. Der visuelle Stichprobenbeleg `lf3-dhcp-skizze-dunkel.png` zeigt laut Prüfdokumentation helle Schrift auf dunkler Fläche; Ablaufbild und Karten sind lesbar, die linke Themenübersicht ist sichtbar.
- `lf3-ipv4-konfiguration-skizze-hell.png` zeigt laut Prüfdokumentation dunkle Schrift auf weißen Karten.
- `lf3-dhcp-dunkel-200.png` zeigt die umgebrochene Shell-Navigation innerhalb des Fensters. Der Screenshot ist kein Nachweis dafür, dass alle Inhalte bei 200 % vollständig erreichbar oder ohne Informationsverlust nutzbar sind.
- `tastatur-nach-enter.png` zeigt den Skip-Link mit rotem Fokusrahmen. Zusammen mit dem Messlauf belegt dies einen sichtbaren Fokus auf genau diesem Skip-Link, nicht dessen erfolgreiche Aktivierung oder eine vollständige Fokusreihenfolge.

Die Sichtprüfung ist auf die bereitgestellten Screenshots beschränkt. Sie ist kein vollständiger UI-Test aller Texte, Auswahlkarten, Eingabefelder, Rückmeldungen oder Interaktionen in allen Modi.

## Nicht geprüft / nicht nachgewiesen

- **MAIN-Fokus und Tastatur:** Ein gesetzter Fokus im DOM ist kein Tastaturnachweis. Der bekannte Codebefund, dass der Schrittwechsel `main.focus()` aufruft, während `styles.css` `main:focus { outline: none }` setzt, ist ausdrücklich **kein bestandenes Kriterium**. Dieser Lauf erreichte `MAIN` nicht per Tastatur. Der programmatische Klick auf einen Schrittwechsel ist ebenfalls kein Tastaturnachweis. Fokusreihenfolge und sichtbare Fokusmarkierung für `MAIN`, Aktivierung des Skip-Links und folgende Tab-Position bleiben offen.
- **Screenreader:** Es wurde kein Screenreader gestartet; kein Narrator-, NVDA- oder JAWS-Prozess war aktiv. Screenreader-Stichprobe und tatsächliche Ansagen sind nicht geprüft.
- **Reflow / 200-%-Zoom:** `overflowX=false` und gleiche `scrollWidth`/`clientWidth` sind einzelne Messwerte, kein WCAG-1.4.10-Nachweis. 200 % ist nicht als bestanden bewertet.
- **Kontrastmodus und Einstellungen:** Die bereitgestellten Farbwerte und Persistenzmessungen belegen nur die erfassten Zustände. Vollständige Bedienung der Regler, alle fokussierten/aktiven Fehler- und Rückmeldungszustände sowie Kontrast aller Komponenten sind nicht nachgewiesen.
- **Lernstände:** Erhalt des Lektionsstands ist nicht nachgewiesen; der konkrete Lektionsschlüssel wurde nicht geschrieben. Die beobachtete Persistenz des separaten Modulfortschritts `2c-probe` ersetzt diesen Nachweis nicht.
- **Weitere Inhalte/Interaktionen:** Keine vollständige Tastaturbedienung sämtlicher Auswahlkarten, Eingabefelder, Antworten und Rückmeldungen, keine fachliche Validierung der Lerninhalte und keine vollständige Screenreader- oder WCAG-Prüfung.

## Offene Befunde

1. **Fokus auf `MAIN` – offen, mit konkretem Risikohinweis.** `outline: none` für `main:focus` ist im Codebefund genannt; echte Tastaturerreichbarkeit und sichtbarer Fokus wurden nicht demonstriert. Keine Freigabe aufgrund eines programmatisch gesetzten Fokus oder eines programmgesteuerten Schrittwechsels.
2. **Tastaturaktivierung und Fokusreihenfolge – offen.** Enter-Auslösung des Skip-Links und nächster Tab-Stopp sind wegen der Grenze des Prüfstubs nicht belegt. Den Lauf nicht als bestanden werten.
3. **Lektions-Lernstand – nicht nachgewiesen.** `it-ausbildung.lf3-dhcp.v1` wurde nicht geschrieben. Erhalt von Lernständen ist somit offen.
4. **Screenreader – ungeprüft.** Kein Screenreader-Test durchgeführt.
5. **200-%-Reflow – ungeprüft als Erfolgskriterium.** Die gemessene Abwesenheit horizontalen Überlaufs ersetzt keinen vollständigen Reflow- und Funktionsnachweis.

## Seitenbezogene Bewertung

| Seite | Vorliegende Theme-Belege | Ergebnis / Einschränkung |
|---|---|---|
| LF3 DHCP | Hell, Dunkel und Kontrast gemessen; Hell-/Dunkel-Screenshots; eigene 200-%-Messung und Screenshot; Tastatur-Screenshot stammt aus dem Prüflauf, nicht als Nachweis vollständiger Seitenbedienung | Theme-Flächen für die erfassten Zustände kompatibel. 200-%-Bedienbarkeit, Tastaturfluss, `MAIN`-Fokus und Lektions-Lernstand nicht freigegeben. |
| LF3 DNS | Hell, Dunkel und Kontrast gemessen; Hell-/Dunkel-Screenshots; eigene 150-/200-%-Messwerte und 200-%-Screenshot | Theme-Flächen für die erfassten Zustände kompatibel. Reflow/Bedienbarkeit, Tastatur und Screenreader nicht nachgewiesen. |
| LF3 Verbindung eingrenzen | Hell, Dunkel und Kontrast gemessen; Hell-/Dunkel-Screenshots; eigene 150-/200-%-Messwerte und 200-%-Screenshot | Theme-Flächen für die erfassten Zustände kompatibel. Reflow/Bedienbarkeit, Tastatur und Screenreader nicht nachgewiesen. |
| LF3 Fehlerbild protokollieren | Hell, Dunkel und Kontrast gemessen; Hell-/Dunkel-Screenshots; eigene 150-/200-%-Messwerte und 200-%-Screenshot | Theme-Flächen für die erfassten Zustände kompatibel. Reflow/Bedienbarkeit, Tastatur und Screenreader nicht nachgewiesen. |
| LF3 IPv4-Konfiguration | Hell, Dunkel und Kontrast gemessen; Hell-/Dunkel-Screenshots; eigene 150-/200-%-Messwerte und 200-%-Screenshot; Hell-Skizze visuell dokumentiert | Theme-Flächen für die erfassten Zustände kompatibel. Reflow/Bedienbarkeit, Tastatur und Screenreader nicht nachgewiesen. |

„Theme-Flächen kompatibel“ bedeutet hier ausschließlich, dass die genannten Farb-/Attributmessungen und Screenshots für die geprüften Flächen vorliegen. Es ist keine Seiten- oder Produktfreigabe.

## QA-Urteil

**EINGESCHRÄNKT.** Die gelieferten Belege unterstützen die Theme-Anwendung der fünf LF3-Seiten in Hell und Dunkel und enthalten Kontrastmodus-Messungen. Die konkrete Tastatur- und Fokusprüfung ist unvollständig; der Befund `main:focus` mit `outline: none` bleibt offen. Die Tastaturgrenze des Prüfstubs erlaubt keine Schlussfolgerung zugunsten einer erfolgreichen Aktivierung. Screenreader und Lernstandserhalt wurden nicht ausreichend nachgewiesen. Die 200-%-Messung ist kein WCAG-1.4.10-Erfolg. Daher weder Produktfreigabe noch WCAG-Bestanden-Meldung.

**Empfohlene Nachprüfung:** echte Tastaturbedienung bis `MAIN` mit sichtbarem Fokus und verifizierter Skip-Link-Aktivierung sowie vollständiger Tab-Reihenfolge; Screenreader-Stichprobe; Reflow und Bedienbarkeit bei 200 %; gezielter Schreib-/Wiederherstellungstest des Lektions-Lernstands. Bis dahin bleibt die Gesamtmission DESIGN HARMONY offen.
