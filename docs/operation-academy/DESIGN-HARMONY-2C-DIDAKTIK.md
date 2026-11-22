# Design Harmony 2C – Didaktikprüfung LF3

**Status:** dokumentarischer Sprach- und LRS-Befund; keine Inhaltsänderung, keine didaktische oder WCAG-Freigabe. Geprüft wurden die acht LF3-HTML-Dateien am 22.11.2026. Fachliche Lernziele und Aufgabentexte bleiben unverändert. Zitate sind kurze Ausschnitte aus den geprüften Dateien.

## Bereits verständlich

- `lf3-abnahme.html`: „Das Ergebnis bleibt in diesem Browser und wird nicht übertragen.“ benennt Zweck und Speichergrenze in einfacher Sprache.
- `lf3-dhcp.html`: „Wähle pro Aufgabe eine Antwort.“ ist eine kurze, konkrete und wiederkehrende Handlungsanweisung. DHCP wird bei erster Nennung ausgeschrieben und erklärt; die Simulation wird ausdrücklich von einer echten Konfiguration abgegrenzt.
- `lf3-dns.html`: Die Übungstabelle und das Beispiel trennen Name und Antwortwert klar. DNS wird ausgeschrieben und knapp erklärt; die Grenze „Eine Zuordnung beweist keine Erreichbarkeit“ ist präzise.
- `lf3-fehlerbild-protokoll.html`: „Beobachtung, getesteten Schritt und Ergebnis … voneinander trennen“ macht die Lernhandlung deutlich. „Befund“ wird erklärt und von einer Vermutung unterschieden.
- `lf3-ipv4-konfiguration.html`: Lernziel, vorgegebene Anzeige und Testnetz-Karte sind voneinander abgegrenzt. Gateway wird erklärt; Präfix und Netzmaske werden als zwei Schreibweisen derselben Angabe verknüpft.
- `lf3-lernziel.html`: „24 Fragen · ohne Zeitdruck“ und die Erklärung, dass Antworten vor Abgabe geändert werden können, setzen klare Erwartungen. Die Bedingungen für Bestehen und erneuten Versuch sind benannt.
- `lf3-verbindung-eingrenzen.html`: Die Aufgabe beschränkt sich klar auf vorgegebene Beobachtungen; „Eingrenzen“ wird erklärt. Die Schritte Lesen, Trennen und Auswählen machen die Reihenfolge nachvollziehbar.

## Konkrete Verbesserungsmöglichkeiten ohne Lernzieländerung

| Datei | Beobachtung und kurzes Zitat | Mögliche sprachliche Verbesserung (nicht umgesetzt) |
|---|---|---|
| `lf3-abnahme.html` | „Dieselben Kriterien wie bei der LF2-Abnahme“ setzt Kenntnis einer anderen Abnahme voraus. | Kriterien kurz ausschreiben oder auf die Kriterienliste verweisen, damit die Seite für sich verständlich bleibt. |
| `lf3-abnahme.html` | „Prüfung durch“ ist ein verkürztes Feldlabel. | „Name der prüfenden Person“ wäre als Eingabeaufforderung eindeutiger. |
| `lf3-dhcp.html` | „Adresse, Präfix, Gateway und DNS-Server als gelieferte Angaben unterscheiden“ enthält mehrere Fachbegriffe und eine dichte Aussage. | Satz in zwei kurze Aussagen teilen; die Begriffe mit einer einheitlichen Glossarhilfe verknüpfen. |
| `lf3-dns.html` | „Eine vorbereitete Namensauflösung … erklären“ und „Anfrage-/Antwortdarstellung“ verwenden kompakte Fachsprache. | In der Aufgabenanweisung knapp erläutern, dass ein Name einem Antwortwert zugeordnet wird; Schrägstrichformulierung ausschreiben. |
| `lf3-fehlerbild-protokoll.html` | „Für den fiktiven Laptop … liegt eine Meldung vor. Bereitgestellt sind nur drei Angaben … Daraus entsteht ein Supportprotokoll.“ verlangt, die Beziehung der drei Sätze selbst zusammenzusetzen. | Mit kurzen nummerierten Schritten markieren: Angaben lesen, Beobachtung/Schritt/Ergebnis zuordnen, offene Frage kennzeichnen. |
| `lf3-ipv4-konfiguration.html` | „IPv4-Adresse, Präfix bzw. Netzmaske und Gateway-Angabe“ bündelt mehrere Benennungen in einem Lernzielsatz. | Satzaufteilung und einheitliche Schreibweise der gleichbedeutenden Begriffe erwägen; fachlichen Inhalt beibehalten. |
| `lf3-lernziel.html` | „Die zusammenhängende Übungsaufgabe bleibt eine Übung und ist nicht diese Kontrolle.“ ist korrekt, aber abstrakt. | Den Bezug explizit benennen, etwa „Die Übungsaufgabe in den Lektionen zählt nicht zu dieser Lernzielkontrolle.“ |
| `lf3-verbindung-eingrenzen.html` | „Namensauflösung und IP-Erreichbarkeit als verschiedene Beobachtungen unterscheiden“ setzt zwei zusammengesetzte Fachwörter voraus. | Beide Begriffe direkt im Aufgabenkontext mit einem kurzen Beispiel erläutern, ohne den nächsten Lösungsschritt vorwegzunehmen. |

## LRS-Lücken und Unterstützungsbedarf

- **Glossar/Fachwörter:** Erläuterungen und Glossarlinks sind nicht durchgehend gleich verteilt. DHCP, DNS und Gateway haben lokale Erklärungen; andere Begriffe wie „Client“, „Präfix“, „Namensauflösung“, „IP-Erreichbarkeit“, „Link-Status“, „Relay“ und „Lease-Zeiten“ erscheinen ohne Erklärung direkt an der ersten Stelle oder nur in Randhinweisen. Prüfen, ob jede erstmalige Verwendung entweder eine knappe Erklärung oder einen klaren Glossarzugang erhält. `lf3-lernziel.html` enthält in der HTML-Datei keine entsprechende Fachworterklärung; die Fragen selbst werden dynamisch aus JavaScript erzeugt und waren nicht Teil dieser HTML-Prüfung.
- **Lesereihenfolge:** Die fünf Lektionen mit Schritt-Navigation strukturieren Überblick, Fall, Übung und Abschluss konsistent. Einzelne Erklärbereiche umfassen jedoch mehrere Schritte und Einschränkungen in einem Absatz. Kürzere Absätze, nummerierte Arbeitsfolgen und konsistente Bezeichnungen für „Fall“, „Übung“ und „Abschluss“ würden das Wiederfinden erleichtern. Die Abnahme-Seite nutzt eine lange Folge von Prüfkriterien; eine kurze Erläuterung, wie die Kriterien auszufüllen sind, ist im HTML nicht sichtbar.
- **Aufgabenanweisungen:** In den fünf interaktiven Lektionen wiederholt sich „Wähle pro Aufgabe eine Antwort.“; das ist verständlich und einheitlich. Auf `lf3-lernziel.html` lautet die Anweisung „Wähle je Frage eine Antwort.“; die kleine Variantenabweichung kann vereinheitlicht werden, ohne die Aufgabe zu ändern. Die Abgabe- und Sperrbedingungen sind vorhanden, aber dicht in einem einzigen Hinweisabsatz zusammengefasst.
- **Lesehilfen:** Die LF3-HTML-Seiten verweisen teilweise auf Glossar und Grundlagen. Aus den geprüften HTML-Dateien lässt sich nicht bestätigen, dass Textgrößen- oder Abstandsregler für diese Inhalte tatsächlich vorhanden und wirksam sind; dies ist eine offene Prüfaufgabe, kein behaupteter Fehler.

## Textbasierte Skizzen und Screenreader

**Befund:** In `lf3-dhcp.html`, `lf3-dns.html`, `lf3-fehlerbild-protokoll.html`, `lf3-ipv4-konfiguration.html` und `lf3-verbindung-eingrenzen.html` stehen textbasierte Darstellungen in `div`-Elementen mit `font-family: monospace` und `white-space: pre-wrap`. Diese fünf Elemente tragen jeweils `role="img"` und ein `aria-label`, das den wesentlichen Ablauf bzw. die wesentlichen Werte in Prosa zusammenfasst. Damit ist im HTML eine textuelle zugängliche Beschreibung vorgesehen; es handelt sich nicht ausschließlich um unbeschriftetes `pre`/Monospace. Ob Rolle und Beschreibungen im tatsächlichen Academy-iframe von einem Screenreader sinnvoll ausgegeben werden, wurde hier nicht getestet und ist **offen**. Insbesondere ist die detailreiche Zeilenansicht nicht vollständig im jeweiligen `aria-label` wiedergegeben.

In `lf3-abnahme.html` und `lf3-lernziel.html` ist keine textbasierte Verbindungsskizze enthalten. Für `lf3-lernziel.html` sind die dynamischen Fragen nicht durch diese HTML-Prüfung bewertet.

## Umfang und Grenzen

Geprüft wurden ausschließlich die acht angeforderten HTML-Dateien sowie die vorhandenen Dokumente `DESIGN-HARMONY-2B-REGELN.md` und `DESIGN-HARMONY-DIDAKTIK.md`. Die bestehenden LRS-Regeln verlangen kurze Aufgaben, eine konkrete Handlung und Erklärung oder Glossarhinweis beim ersten Fachwort; die Befunde oben sind Beobachtungen und Vorschläge, keine Umsetzung. JavaScript-generierte Frageformulierungen und Feedbacktexte wurden nicht untersucht. Keine Lernseite, kein Lernziel und kein Aufgabentext wurde geändert. Keine Screenreader-Laufzeitprüfung und keine WCAG-Freigabe erfolgt.
