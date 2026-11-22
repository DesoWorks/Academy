# Design Harmony 2B – unabhängige QA-Bewertung

**Projekt:** IT-Ausbildung / DesoWorks Academy  
**Prüfumfang:** Theme-Weitergabe und repräsentative LF3-Seite „Client-Anbindung“ im Academy-Kontext  
**Bewertungsgrundlage:** ausschließlich die im Belegordner gelesene Messdatei und Screenshots  
**Urteil:** **EINGESCHRÄNKT** – Theme-Wechsel Hell/Dunkel ist im tatsächlichen Academy-iframe belegt. Tastaturbedienung, 200-%-Vergrößerung und Screenreader-Unterstützung sind nicht nachgewiesen; der Tastatur-Fokusbeleg weist sogar auf einen fehlenden sichtbaren Fokus hin. Keine Produktfreigabe.

## Belege und Umfang

Gelesene Belege unter `docs/operation-academy/design-harmony-2b/`:

- `probe-academy.json`
- `academy-hell.png`
- `academy-dunkel.png`
- `academy-dunkel-150.png`
- `academy-dunkel-200.png`

Der Auftrag erwähnte `academy-dunkel-200.png` und `academy-hell.png` nochmals; beide Dateien sind vorhanden. Zusätzlich ist `academy-dunkel-150.png` vorhanden und wurde visuell geprüft. Der Messbeleg nennt Academy Core `0.3.0` und das aktive Modul `desoworks.it-systemintegration` `1.0.1`. Die Screenshots zeigen Academy-Kopfbereich, Modulwechsel und eingebettete LF3-Lernseite. Damit handelt es sich nicht um eine isolierte HTML-Datei.

Die JSON-Datei gibt für beide Modi `academyTheme`, `dataTheme` und eine Modul-URL mit `academy-theme` passend zum Modus aus. Der Messdatensatz enthält außerdem den Text der Skizzenbeschreibung und Kontrastwerte. Das sind Mess-/DOM-Angaben; sie beweisen für sich allein weder die Verständlichkeit für einen Screenreader noch die vollständige Tastaturbedienbarkeit.

## Einzelbefunde

| Kriterium | Ergebnis | Nachweis und Einschränkung |
|---|---|---|
| Theme im echten Academy-iframe | **Bestanden für die geprüfte LF3-Seite** | Screenshots zeigen Academy-Chrome und eingebetteten Inhalt. JSON meldet in `frameUrl` und `href` jeweils `academy://desoworks.it-systemintegration/module/lf3-client-anbindung.html?academy-theme=…`, mit `academyTheme` und `dataTheme` passend zum aktiven Modus. |
| Hellmodus | **Bestanden, visuell und messtechnisch** | `academy-hell.png` zeigt helle Academy-Oberfläche und LF3-Inhalt. JSON: Hintergrund `rgb(255, 255, 255)`, Text `rgb(27, 36, 48)`, Kontrast **15,65:1**. |
| Dunkelmodus | **Bestanden, visuell und messtechnisch** | `academy-dunkel.png` zeigt dunklen Academy-Kopfbereich und dunklen iframe-Inhalt mit heller Schrift. JSON: Hintergrund `rgb(20, 17, 20)`, Text `rgb(247, 244, 245)`, Kontrast **17,15:1**. |
| Kontrast | **Messwerte ausreichend für die erfassten Vorder-/Hintergrundpaare; Umfang eingeschränkt** | Angegeben sind 15,65:1 (Hell) und 17,15:1 (Dunkel). Die Datei weist keine vollständige Prüfung aller Texte, Zustände, Bedienelemente, Grafiken oder Kontrastanforderungen aus. Diese Zahlen sind kein pauschaler WCAG-Konformitätsnachweis. |
| Unabhängige Modul-Darstellungswahl | **Bestanden für den geprüften Selektor** | JSON `selectDisabled: true` in Hell und Dunkel; Screenshot zeigt den Modulwechsel-Selektor im Academy-Chrome. Belegt ist die Deaktivierung dieses Selektors, nicht jede denkbare Möglichkeit eines Moduls, Styles zur Laufzeit zu überschreiben. |
| Tastaturfokus | **Nicht bestanden / kritischer offener Befund** | JSON meldet beim Fokus auf `MAIN` `outline: "none 3px …"` in beiden Modi. Die Screenshots zeigen keinen eindeutigen Fokusindikator. Ein `outline`-Wert `none` ist kein sichtbarer Fokusnachweis. Eine vollständige sequenzielle Tastaturprüfung (Tab-Reihenfolge, alle Bedienelemente, Aktivierung, Fokusverlust) ist nicht dokumentiert. |
| 150 % Vergrößerung | **Eingeschränkt geprüft** | JSON dokumentiert einen Zoomfaktor `1.5`; `academy-dunkel-150.png` zeigt vergrößerte Darstellung. Der Screenshot zeigt weiterhin sichtbare Inhalte, jedoch ist die Navigation stark umgebrochen; ein Teil des Inhalts liegt außerhalb des Ausschnitts und es sind mehrere Scrollbereiche/Scrollleisten sichtbar. Kein systematischer Nachweis, dass alle Funktionen ohne Informations- oder Funktionsverlust bedienbar bleiben. |
| 200 % Vergrößerung | **Eingeschränkt geprüft, nicht bestanden als Abnahmekriterium** | JSON dokumentiert `factor: 2`; `academy-dunkel-200.png` zeigt stark vergrößerte Inhalte und mehrere Scrollleisten. Die Oberfläche ist nicht vollständig im Bild; Teile der Skizze reichen unter den Viewport. Screenshot und Messdatensatz belegen keine vollständige Reflow-/Bedienbarkeitsprüfung oder das Ausbleiben von horizontalem Scrollen. Daher kein Bestehen für 200 %. |
| Linke/vorhandene Navigation | **Eingeschränkt bestanden** | Im normalen Screenshot ist die linke Lernplattform-Navigation sichtbar, einschließlich Themenübersicht, Link „Den Computer kennenlernen“ und aufklappbarer Lernfelder. JSON misst `navText: "Themenübersicht"`, Höhe rund 45 px, Breite 269 px. Im Hell-150-Bild ist die Academy-Hauptnavigation auf mehrere Zeilen umgebrochen; im Dunkel-200-Bild ebenfalls. Sichtbarkeit ist belegt, vollständige Bedienbarkeit bei 150/200 % nicht. |
| Screenreader-Beschreibung der Verbindungsskizze | **Beschreibung im DOM-Beleg vorhanden; Screenreader-Unterstützung nicht nachgewiesen** | JSON enthält `role: "img"` und den zugänglichen Namen „Skizze der Verbindung von Mira-01 über ein Netzwerkkabel und die Netzwerkdose zum Switch und weiter ins fiktive Lernnetz“. Das ist ein positiver struktureller Beleg. Es gibt keinen Nachweis eines Tests mit Screenreader/Accessibility Tree, keine Prüfung der tatsächlichen Ansage oder ihrer Verständlichkeit. Kein Screenreader-Bestehen. |
| Statusanzeige | **Nicht bewertet als Theme-Fehler** | Screenshot zeigt „Status konnte nicht gelesen werden. Die Lernseiten bleiben nutzbar.“ Laut vorgegebenem Prüfkontext stammt dies vom Prüf-Stub ohne `updates.status`, nicht von der Theme-Änderung. Die Screenshots allein beweisen diese Ursache nicht; für die Bewertung wird der Hinweis als bekannte Testumgebungs-Einschränkung behandelt und nicht der Theme-Implementierung zugerechnet. |

## Offene WCAG-/Barrierefreiheitsbefunde

1. **Fokus sichtbar:** Messung meldet `outline: none` für `MAIN`. Sichtbare, verlässlich erkennbare Fokusdarstellung für Tastaturnutzung ist nicht belegt. Fehlerverdacht mit konkretem Messhinweis; vollständiger Tastaturtest fehlt.
2. **Vergrößerung und Reflow bei 200 %:** Screenshot zeigt starke Vergrößerung, aber nicht die komplette Seite. Funktions- und Informationsverlustfreiheit sowie Vermeidung unnötigen horizontalen Scrollens sind nicht nachgewiesen.
3. **150-%-Bedienbarkeit:** Navigation und Inhalte bleiben teilweise sichtbar, aber die umgebrochene Kopfzeile und verschachtelten Scrollbereiche verhindern eine belastbare Aussage über alle Interaktionen.
4. **Screenreader:** Zugänglicher Name und `role="img"` sind im Messdatensatz erfasst; tatsächliche Ausgabe und Nutzbarkeit mit Screenreader wurden nicht getestet.
5. **Kontrastabdeckung:** Die zwei Zahlenwerte betreffen die gemessenen Farbpaare. Vollständige Kontrastprüfung über sämtliche UI-Zustände und Komponenten fehlt.
6. **Tastaturfluss:** Keine nachvollziehbare vollständige Tab-Reihenfolge, Aktivierung von Navigation/Modulschritten oder Prüfung von Fokusfallen dokumentiert.

## Abnahmeurteil

Die Theme-Weitergabe für die repräsentative LF3-Seite ist im tatsächlichen Academy-Kontext für Hell und Dunkel durch URL-/DOM-Messwerte und sichtbare Screenshots belegt. Die Kontrastwerte der erfassten Farbpaare sind hoch. Der Modulwechsel-Selektor ist als deaktiviert gemessen.

Die Abnahme ist insgesamt **EINGESCHRÄNKT**. Insbesondere ist sichtbarer Tastaturfokus nicht belegt und der Messwert `outline: none` spricht dagegen. 150 % und 200 % sind nicht als vollständig bedienbar nachgewiesen. Screenreader-Unterstützung ist trotz vorhandener Beschreibung nicht getestet. Eine vollständige Barrierefreiheits- oder Produktfreigabe wäre durch diese Belege nicht gedeckt.

**Empfehlung:** Vor weiterem Rollout den Fokusbefund reproduzierbar beheben und Tastatur-, 200-%-Reflow- sowie Screenreader-Prüfungen mit dokumentiertem Testaufbau ergänzen. Diese Bewertung nimmt keine Änderungen am Anwendungscode vor und erteilt keine Produktionsfreigabe.
