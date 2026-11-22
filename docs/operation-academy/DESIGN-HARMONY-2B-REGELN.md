# Design Harmony 2B – Designregeln für Academy-Module

**Geltung:** Regeln für künftige Academy-Module. Der Theme-Vertrag [`DESIGN-HARMONY-2B-VERTRAG.md`](DESIGN-HARMONY-2B-VERTRAG.md) bleibt maßgeblich. Dieses Dokument ist eine Vorgabe, kein Umsetzungs-, Barrierefreiheits- oder Produktfreigabenachweis.

## Darstellungsmodus und Theme-Schnittstelle

- Die **Academy-Shell** besitzt in der Academy allein den Darstellungsmodus und dessen Einstellung `academy.theme`.
- Zulässige Werte sind exakt `hell`, `dunkel` und `kontrast`. Ein weiterer Modus ist nicht vorgesehen.
- Die Shell übergibt den Wert ausschließlich über den bestehenden Modulkanal `academy-theme` in der Modul-URL. Die Modul-HTML-Antwort setzt daraus `data-academy-theme` am Dokument-Root. Die Validierung und Fallback-Regeln des Vertrags gelten unverändert.
- Ein Modul **soll** die sieben Rollen `--farbe-hintergrund`, `--farbe-flaeche`, `--farbe-text`, `--farbe-text-leise`, `--farbe-rahmen`, `--farbe-akzent` und `--farbe-fokus` für die entsprechenden UI-Zwecke verwenden. Knight-Dunkelwerte **sollen** die vorhandenen `--dw-*`-Tokens referenzieren; Hell und Kontrast **sollen** die vorhandenen Modulwerte dieser Rollen verwenden.
- Neue Markenfarben und neue Hex-Farbwerte **dürfen nicht** eingeführt werden. Komponenten **sollen** Rollen statt eigener Farbdeklarationen verwenden. Zustände wie Fokus, Auswahl und Fehler **dürfen nicht** ausschließlich durch Farbe unterscheidbar sein.
- Ein Modul **darf nicht** die Academy-Einstellung, `data-academy-theme` oder `academy.theme` selbst überschreiben. Es **darf** den validierten Wert für vorhandene Modulregeln spiegeln, aber keine eigene aktive Darstellungswahl anbieten.
- Lokal bleiben dürfen die Leseoptionen **Textgröße**, **Zeilen-/Absatzabstand** und **reduzierte Bewegung**. Ihr Speichern oder Zurücksetzen **darf** den Academy-Modus nicht verändern. Vorhandene `prefers-reduced-motion`- und `forced-colors`-Unterstützung **soll** erhalten bleiben.
- Die spätere Verwaltungsausbildung **soll** denselben Shell-Eigentümer, Speicherkey `academy.theme`, Wertebereich, `academy-theme`-Transport, Root-Attribut und Rollenvertrag verwenden. Sie **darf nicht** eine zweite Theme-Welt, einen zusätzlichen Kanal oder ein separates Academy-Theme-Profil einführen. Eigenständige lokale Moduswahl ist nur außerhalb der Academy nach Maßgabe des Vertrags zulässig.

## LRS-gerechte Aufgaben und Bedienung

- Aufgaben **sollen** kurz sein und eine konkrete, beobachtbare Handlung nennen. Jeder Satz **soll** genau eine Aussage enthalten.
- Ein Fachwort **soll** bei der ersten Verwendung verständlich erklärt oder mit einem Glossarhinweis versehen werden.
- Die erste Hilfe **darf nicht** die Lösung nennen oder vorwegnehmen. Hilfen **sollen** schrittweise unterstützen.
- Auswahlflächen **sollen** groß genug und gut bedienbar sein, auch per Tastatur und bei vergrößerter Schrift.
- Richtig, falsch, ausgewählt und andere Zustände **dürfen nicht** ausschließlich durch Farbe vermittelt werden.
- Die linke Navigation **soll** auch bei vergrößerter Schrift erreichbar und bedienbar bleiben. Tastaturfokus **soll** sichtbar sein. Diese Soll-Regeln sind keine Prüfbestätigung.

## Textbasierte Verbindungsskizzen und Screenreader

- Eine textbasierte Verbindungsskizze **soll** als zusammenhängendes Bild mit `role="img"` ausgezeichnet und mit einem aussagekräftigen `aria-label` oder einer gleichwertigen zugänglichen Beschreibung versehen werden.
- Die Beschreibung **soll** den Weg in verständlicher Reihenfolge nennen, nicht bloß Zeichen oder einzelne Knoten aufzählen.
- Beispiel LF3: Die vorhandene Beschreibung lautet „Skizze der Verbindung von Mira-01 über ein Netzwerkkabel und die Netzwerkdose zum Switch und weiter ins fiktive Lernnetz“. Sie vermittelt den Weg Mira-01 → Netzwerkkabel/Netzwerkdose → Switch → fiktives Lernnetz. Dieses Beispiel beschreibt das Muster; die LF3-Datei wird durch diese Regel nicht geändert.
- Die tatsächliche Verständlichkeit **soll** mit Screenreader im Academy-Kontext geprüft werden. Ohne Laufzeitnachweis **darf** Screenreader-Unterstützung nicht als bestanden gemeldet werden.

## Verbote für Module

Ein Modul **darf nicht**:

1. ein eigenes `postMessage`-Theme oder einen anderen Theme-Nachrichtenkanal einführen;
2. eigene Hex-Flächen mit weißem Fallback als parallele Farbquelle definieren;
3. eine eigene App-ID oder eine Theme-abhängige Modul-ID verwenden;
4. eine eigene Updatequelle oder einen eigenen Updateweg einführen;
5. die Academy-Darstellungseinstellung überschreiben oder eine zweite Theme-Welt für ein Modul beziehungsweise die Verwaltungsausbildung schaffen.

Änderungen an Modulgrenzen, Origins, Berechtigungen, Sandbox oder Referrer-Policy sind nicht Teil dieser Regeln und **dürfen nicht** stillschweigend erfolgen. Die Einhaltung dieser Regeln ersetzt keine Prüfung: insbesondere 200-%-Vergrößerung, Screenreader-Ausgabe und offene WCAG-Befunde **dürfen nicht** ohne konkrete Nachweise als bestanden gelten.
