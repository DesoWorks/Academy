# Operation Knowledge Pilot – Fachprüfung durch Terminus

**Urteil: tragfähig.** Alle vier Prüffragen sind für die untersuchten Daten, die beiden Navigationswege und den Bewertungskern mit Ja zu beantworten. Eine fachlich falsche Formulierung im Fallblatt sollte korrigiert werden; die Diagnose im Kern ist richtig.

**Prüfrahmen:** Statische Prüfung der sieben beauftragten Dateien. Die Markdown-Belege liegen unter `docs/operation-academy/`, die JavaScript-Belege unter `modules/it-systemintegration/web/js/`. Kein Fenster- oder Installationstest; die Testangaben in `KNOWLEDGE-PILOT-IMPLEMENTATION.md:47–51` sind keine eigenen Testergebnisse.

1. **Zugriff und Abdeckung sind getrennt.** LF1–LF7 sind offen und als „Im Aufbau“ gekennzeichnet; LF10b–LF12b stehen ohne Lektionen auf „Geplant“ (`module-daten.js`, Lernfelddefinitionen bis Z. 166). `statusInfo` bestimmt den Anzeigetext aus der Abdeckung, die Freigabe dagegen aus `field.status`. `lektionOffen` verlangt zusätzlich Lektionsfreigabe und Dateipfad. Die Anzahl abgeschlossener Karten ändert das Label nicht (`module-daten.js:171–211`; `startseite.js:20–35, 80–85`). Das entspricht `KNOWLEDGE-PILOT-CONCEPT.md:71–82`.
2. **LF8/LF9 bleiben in Übersicht und Navigation gesperrt.** Beide Felder haben `kommt-bald` und `in-vorbereitung`, obwohl ihre Unterthemen verfügbare Dateien nennen (`module-daten.js:134–156`). Die Übersicht erzeugt nur bei erfolgreicher Freigabeprüfung einen Link, sonst einen Statustext (`startseite.js:21–25, 37–55`); die Seitennavigation entscheidet ebenso (`navigation.js:71–84`). Damit ist die Aussage in `KNOWLEDGE-PILOT-IMPLEMENTATION.md:39–43` für beide Wege belegt. Ein Zugriffsschutz gegen direkte Dateiaufrufe folgt daraus nicht.
3. **Die drei Fälle sind fachlich verschieden.** Bei gleicher Eingangsmeldung trennt jeweils ein anderer Befund die Ursachen:

   | Fall | Trennender Befund und passende Maßnahme | Belege: `KNOWLEDGE-PILOT-CASES.md` / `lf3-diagnose-kern.js` |
   |---|---|---|
   | Physische Verbindung | Kein Link an Mira-01; der Nachbar am selben Switch erreicht den Dienst. Patchkabel neu stecken und Link prüfen. | Z. 7–15 / 135–156 |
   | IPv4-Konfiguration | Link aktiv, aber `10.20.40.21/24` liegt außerhalb des Sollnetzes `10.20.30.0/24`; selbst die bekannte Dienst-IP ist nicht erreichbar. Clientadresse korrigieren. | Z. 17–25 / 169–190 |
   | Namensauflösung | Dienst-IP erreichbar, Name nicht; der eingetragene DNS-Server weicht vom Sollwert ab. DNS-Eintrag am Client korrigieren und Namen erneut prüfen. | Z. 27–35 / 203–225 |

   **Korrekturhinweis:** `KNOWLEDGE-PILOT-CASES.md:19` nennt eine „falsche Maske“. Das Präfix ist in Ist und Soll `/24`; falsch ist die **Adresse**. Der Kernsatz in `lf3-diagnose-kern.js:190` beschreibt die Abweichung korrekt.

4. **Ein Abschluss verlangt Untersuchungen und Befunde.** `lf3-diagnose-kern.js:137–138, 171–172, 205–207` definiert die Pflichtaktionen und Pflichtbefunde je Fall. Im DNS-Fall sind IP- und Namensprüfung sowie *entweder* Konfiguration *oder* Gateway/DNS nötig. Ein ausgewählter Befund ohne zugehörige gemeldete Aktion ist ungültig (`lf3-diagnose-kern.js:269–305`). Selbst die richtige Ursache reicht nicht: Fehlen Untersuchungen, passende Maßnahme oder trennender Befund, bleibt der Fall offen; nur `tragfaehig` setzt `vollstaendig` (`lf3-diagnose-kern.js:306–331`; Soll: `KNOWLEDGE-PILOT-CONCEPT.md:47–63`). Bewertet wird die Auswahl beobachteter Befunde, keine frei formulierte Erklärung.
