# Operation Knowledge Pilot – unabhängiger QA-Bericht

**Projekt:** DesoWorks Academy / IT-Systemintegration  
**Prüfumfang:** KF-01 und LF3-Diagnoselabor, mit Schwerpunkt auf den beauftragten Prüffragen  
**Prüfdatum:** 23.11.2026  
**Branch / HEAD:** `feature/operation-knowledge-pilot` / `0494674374e804c692ba6120d7897179b42418e5`  
**Versionsstand:** gemäß Auftrags-/Testbeleg Core `0.3.1-dev.8`, Modul `1.0.4`; die angeforderte Prüfung umfasste keinen unabhängigen Versionsdatei-Abgleich.  
**Änderungen:** kein Produktcode geändert. Dieser Bericht ist die einzige von mir angelegte Datei.  

## Urteil: EINGESCHRÄNKT

Die drei implementierten Diagnosefälle unterscheiden sich fachlich; der Bewertungs-Kern verhindert einen Abschluss durch bloßes Raten und verlangt passende Untersuchung, trennenden Befund und Maßnahme. Die Tests für Status-/Zugriffstrennung sowie die Sperrung von LF8/LF9 bestehen. Die Hilfestufen sind überwiegend diagnostische Hinweise, legen die konkrete Lösung in den drei Fällen nicht unmittelbar offen. **Nicht vollständig erfüllt ist die zugesagte Feedback-Differenzierung:** bei einer falschen Diagnose nennt der Kern zwar fallbezogen den Unterschied, bewertet aber Ursache und Maßnahme nicht unabhängig. Eine falsche Ursache wird als `falsche-diagnose` gemeldet, bevor eine unpassende Maßnahme geprüft wird; folglich kann ein Azubi ein zweites Fehlkonzept nicht zugleich erkennen. Ein echter Browserklicktest wurde nicht ausgeführt; Bedienverhalten und sichtbare Darstellung sind daher nicht geprüft.

## Prüfumgebung und Belege

- Tatsächlicher HEAD wurde mit `git rev-parse HEAD` geprüft und stimmt mit dem vorgegebenen Commit überein.
- Tatsächlicher Branch: `feature/operation-knowledge-pilot` (nicht `dev`). Arbeitsbaum enthält zahlreiche vorab vorhandene staged Änderungen und untracked Dokumente. Der Bericht wurde hinzugefügt; keine dieser Änderungen wurde bereinigt oder verändert.
- Gelesen: `modules/it-systemintegration/web/js/lf3-diagnose-kern.js`, `lf3-diagnose-labor.js`, `module/lf3-diagnose-labor.html`, `css/lf3-diagnose.css`, `js/startseite.js`, `js/module-daten.js` und `tests/knowledge-pilot.test.js`.
- Ausgeführt: `node --test tests/knowledge-pilot.test.js` im Academy-Repository: **14 bestanden, 0 fehlgeschlagen** (Dauer 182.24 ms).
- Ricks separat gemeldete 191 Gesamttests sind nicht mein Prüfergebnis und werden hier nicht als eigene Ausführung gewertet.
- Kein Browserklick/keine visuelle Browserprüfung. CSS-, Fokus-, Screenreader- und End-to-End-Verhalten bleiben insoweit ungeprüft.

## Befunde nach Prüffrage

### 1. Drei fachlich unterschiedliche Fälle – BESTANDEN (Kernlogik)

Der Kern definiert genau drei Fälle (`FAELLE`, `lf3-diagnose-kern.js`):

1. **Physische Verbindung:** Mira-01 hat keinen Link; Adresse und DNS sind korrekt; IP- und Namensprüfung scheitern. Mira-02 am selben Switch erreicht den Dienst. Erforderlicher Trennbefund `link-mira-down`; Maßnahme Kabel/Anschluss prüfen.
2. **IP-Konfiguration:** Link aktiv, aber Mira-01 steht auf `10.20.40.21/255.255.255.0` statt im vorgesehenen `10.20.30.0/24`; bekannte Dienst-IP scheitert. Erforderlicher Trennbefund `config-falsches-netz`; Maßnahme Adresse korrigieren.
3. **DNS:** Link und Client-Adresse passen; Dienst-IP antwortet, Hostname nicht; DNS-Eintrag ist `10.20.99.53` statt `10.20.30.53`. Erforderliche Befunde `ping-ip-ok` und `ping-name-fail`; Maßnahme DNS korrigieren.

Die Fälle trennen physische Verbindung, IP-Zugehörigkeit und Namensauflösung. `konsistent()` bestätigt jeweils die erwarteten Fakten; der Test „drei Fälle sind fachlich konsistent und unterscheiden sich“ läuft erfolgreich. Einschränkung: es sind drei Ursachen, obwohl der Kern zusätzlich sechs Ursachen-/Maßnahmenoptionen anbietet. DHCP wird im HTML ausdrücklich als kein eigener Fall benannt; Gateway und Dienstausfall werden als plausible Alternativen erklärt, aber nicht als eigenständige Aufträge abgedeckt. Das ist eine klare Pilotgrenze, kein Widerspruch zu den drei beschriebenen Fällen.

### 2. Verhindert bloßes Raten den Abschluss? – BESTANDEN (Kern), UI nicht geprüft

`bewerten()` setzt `vollstaendig` nur bei Urteil `tragfaehig`. Dafür müssen erforderlich sein: die Fall-spezifischen Pflichtaktionen (plus ggf. eine Aktion aus `pflichtEineVon`), die erforderlichen Befunde, richtige Ursache und zugehörige Maßnahme. Ohne Untersuchung liefert es `ohne-untersuchung`; ohne trennenden Befund `ohne-begruendung`; eine falsche Maßnahme `unpassende-massnahme`. Die Tests für Raten ohne Untersuchung, fehlende Begründung, falsche Maßnahme sowie nicht untersuchte Befunde bestehen.

Grenze: Die Fallauswahl/`ursache` und `massnahme` werden lokal im Browser bewertet. Das ist eine Lernsimulation, keine manipulationssichere Prüfung; kein solcher Sicherheitsanspruch wird daraus abgeleitet.

### 3. Nehmen Hilfen die Lösung vorweg? – BESTANDEN (Inhalt, statische Prüfung)

Die Stufen 1–3 geben gestufte Hinweise zu Diagnoseprinzipien, nächsten Prüfungen und Interpretation. Beispiele: physisch zuerst Link prüfen; beim IP-Fall aktiver Link schließt falsche Netzzugehörigkeit nicht aus; beim DNS-Fall IP und Namen getrennt testen. In den Fallhilfen werden die im Test gesperrten konkreten Adressen bzw. direkte Reparaturformulierungen nicht genannt. Der Test „Hilfen verraten die Falllösung nicht“ besteht.

Qualitative Einschränkung: Stufe 3 grenzt die Ursache deutlich ein und kann für Lernende bereits nahezu lösungsleitend sein (insbesondere DNS: erfolgreiche IP-Prüfung plus scheiternder Name). Sie nennt aber nicht den konkreten falschen DNS-Wert. Bewertung: scaffoldendes Feedback, keine wörtliche Musterlösung; didaktische Wirkung mit Lernenden wurde nicht geprüft.

### 4. Erklärt Feedback die Unterscheidung? – EINGESCHRÄNKT

Für jede falsche Ursache gibt es fallbezogene Erklärtexte (`erklaerung.falsche`), die beobachtbare Unterschiede benennen (z. B. DNS-Fall: IP-Prüfung gelingt, Name scheitert; physischer Fall: Adresse passt, aber Link ist aus). Korrekte Diagnosen erhalten ebenfalls eine fallbezogene Erklärung. Die Testfälle prüfen ausgewählte Erklärungen.

**Mangel:** Bewertungsreihenfolge in `bewerten()` verwirft die Prüfung nach Feststellung einer falschen Ursache (`else if (ursache !== eintrag.ursache)`), bevor die Passung von Maßnahme und Ursache ausgewertet wird. Bei einer Kombination aus falscher Ursache und falscher Maßnahme erhält der Lernende nur `falsche-diagnose`; das Feedback erklärt die Ursachenunterscheidung, aber nicht zusätzlich, dass die Maßnahme zu einer anderen Ursache gehört. Zudem wird eine falsche Ursache auch dann als primäres Urteil gesetzt, wenn die erforderlichen Untersuchungen/Befunde fehlen. Das ist kein Fehler in der Abschlussverhinderung, aber eine didaktische Schwäche der Fehlerrückmeldung und einer nachvollziehbaren Bewertung.

### 5. LF8/LF9 bleiben geschlossen – BESTANDEN (Katalog-/Logikprüfung, kein UI-Klick)

`module-daten.js` führt LF8 und LF9 mit `status: "kommt-bald"` und `abdeckung: "in-vorbereitung"`; ihre Unterthemen tragen zwar einzelne `status: "verfuegbar"`, jedoch verlangt `UEBERSICHT_STATUS.lektionOffen()` sowohl den freigegebenen Feldstatus als auch den Lektionstatus und einen Dateipfad. Damit bleiben sie geschlossen. `statusInfo().offen` hängt ebenfalls am Feldstatus. Die Tests bestätigen für LF8/LF9 `offen === false`, `lektionOffen(...) === false` trotz verfügbarem Unterthema und die Anzeige „In Vorbereitung · nicht freigegeben“. LF10b–LF12b sind als geplant ohne Unterthemen modelliert. Kein Zugriff wurde aufgrund bloßer Dateien freigegeben.

UI-Darstellung/Navigation nicht durch Browserklick verifiziert.

## Weitere Abnahmebeobachtungen

- KF-01 unterscheidet die vier Abdeckungsstati und trennt diese vom Zugriffsstatus. LF1–LF7 sind im Aufbau und offen; die Statuslegende sagt ausdrücklich, dass erreichbare Karten keine vollständige Abdeckung bedeuten. Der Katalogtest bestätigt LF1–LF7 sowie LF8/LF9 und LF10b–LF12b.
- Das Labor ist mit `fortschritt: "isoliert"` markiert; vorhandener Fortschrittscode wird nicht um den Pilot-Key erweitert. Test besteht.
- HTML kennzeichnet die Simulation als fiktiv und ohne Netzwerk-/Windows-Zugriff. Kern deklariert `simulation: true`, `netzwerkzugriff: false`; der statische Test prüft verbotene Zugriffsmuster und Inline-Handler in den ausgewählten Dateien. Das ist ein begrenzter statischer Sicherheitsbeleg, keine vollständige Sicherheitsanalyse.
- Bedienoberfläche verwendet semantische Gruppen, Feldsets/Legenden, `aria-live`, Fokusziele und sichtbare Fokusregeln im CSS. Ohne Browser-/Assistenztechniktest ist daraus keine Barrierefreiheitsfreigabe abzuleiten.

## Abschluss / Freigabeempfehlung

**EINGESCHRÄNKT – keine uneingeschränkte QA-Freigabe auf Basis dieses Laufs.** Die geforderten Kernmechaniken für drei unterschiedliche Fälle, Rateverhinderung und geschlossene Lernfelder sind durch Quellcode und 14 gezielte Tests belegt. Vor einer vollständigen Abnahme sollten mindestens die gekoppelte Fehlkombination aus falscher Ursache und falscher Maßnahme mit eindeutigem Mehrfach-/Prioritätsfeedback behandelt und die Oberfläche in einem Browser tatsächlich geklickt werden. Die fachliche Korrektheit der drei Szenarien ist bestanden; die vollständige didaktische Rückmeldung und reale UI-Bedienbarkeit sind nicht vollständig nachgewiesen.
