# Knowledge Pilot – Konzept

Stand: 2026-11-23. Branch `feature/operation-knowledge-pilot`, aufgesetzt auf `0494674374e804c692ba6120d7897179b42418e5`. Keine Veröffentlichung.

## Ziel

Zwei Maßnahmen der Knowledge-Foundation-Roadmap, lokal:

1. KF-01: Die Lernfeldübersicht sagt, was bearbeitbar ist, und behauptet keine fachliche Vollständigkeit.
2. LF3-Pilot: Drei fiktive Diagnoseaufträge, in denen die Ursache aus Beobachtungen folgt.

## Lernziele des Labors

Der Azubi kann an einem fiktiven Arbeitsplatz:

- eine Meldung eingrenzen, ohne die Ursache vorab zu kennen
- Link, IPv4-Zugehörigkeit und Namensauflösung als getrennte Befunde lesen
- eine Ursache wählen und eine Maßnahme, die zu dieser Ursache passt
- erklären, welche Beobachtung die Ursache von den anderen trennt

Vorwissen aus den vorhandenen LF3-Karten: Client-Anbindung, Lesen einer IPv4-Anzeige, Unterschied zwischen Name und IP-Adresse.

Nicht Bestandteil: DHCP-Ausfall, falsches Gateway als eigener Fall, deaktivierter Switchport, VLAN, nicht erreichbarer Dienst als eigener Fall. Diese Ursachen stehen nur als Ablenker in der Auswahlliste, damit Raten nicht zwischen drei offensichtlichen Karten entscheidet.

## Fiktive Umgebung

Lernnetz Werkstatt-Nord. Kein Bezug zu einem echten Netz.

- Mira-01 an Dose D-12, Switch SW-EG Port 12
- Mira-02 an Port 14, als Vergleichsarbeitsplatz
- vorgesehenes Netz `10.20.30.0/24`, Gateway `10.20.30.1`, DNS `10.20.30.53`
- Dienst Auftragskarte: `auftrag.werkstatt-nord.test` unter `10.20.30.80`
- vorgesehene Adresse von Mira-01: `10.20.30.21/24`

Die vorgesehene Karte ist vor der Untersuchung sichtbar. Der tatsächliche Link und die tatsächliche Konfiguration nicht.

## Aktionen

1. Verkabelung und Linkstatus prüfen
2. Netzwerkkonfiguration anzeigen
3. Dienst per bekannter IP prüfen
4. Dienst per Hostname prüfen
5. Gateway und DNS untersuchen

Jede Aktion liefert fest hinterlegte, fallabhängige Sätze. Es gibt keinen Eingabetext, der ausgewertet wird. Es gibt keinen Netzwerkzugriff und keinen Betriebssystembefehl.

## Bewertung

Ein Abschluss ist nur `tragfaehig`:

1. die für den Fall nötigen Untersuchungen sind gelaufen
2. die Ursache ist richtig
3. die Maßnahme passt zur Ursache
4. die Begründung enthält den Befund, der die Ursache von den anderen trennt

Andere Urteile, alle ohne Abschluss:

- `ohne-untersuchung`: richtige Ursache, Untersuchungen fehlen
- `ohne-begruendung`: Ursache und Maßnahme passen, der trennende Befund fehlt
- `unpassende-massnahme`: Ursache nach Untersuchung richtig, Maßnahme passt nicht
- `falsche-diagnose`: Ursache falsch, auch wenn untersucht wurde
- `unzureichend`: keine Ursache gewählt
- `ungueltig`: unbekannte Angabe oder ein Befund ohne die zugehörige Untersuchung

Hilfen haben drei Stufen. Sie erklären den Zusammenhang und nennen keine fallspezifische Korrektur. Die Musterlösung erscheint erst nach tragfähigem Abschluss oder nach ausdrücklichem Aufgeben. Verwendete Hilfestufen werden im Pilotprotokoll gespeichert und ändern die Wertung nicht.

## Lernstand

Der Pilot schreibt nur `it-ausbildung.lf3-diagnose-pilot.v1`. Er steht nicht in `fortschritt.js` und zählt nicht in die Abschlusszahl der Lernfeldübersicht. Lernzielkontrollen und Reset-Regeln bleiben unverändert.

## KF-01

`status` bleibt die Zugriffsschranke. Neu ist `abdeckung`, nur für die Anzeige.

| Abdeckung | Bedeutung im aktuellen Modul |
|---|---|
| Verfügbar | Zustand existiert. Kein Lernfeld trägt ihn, weil keines den Lernfeldumfang abdeckt. |
| Im Aufbau | LF1 bis LF7. Karten sind offen. Der Umfang ist nicht vollständig. |
| In Vorbereitung | LF8 und LF9. Seiten existieren und bleiben gesperrt. |
| Geplant | LF10b bis LF12b. Keine Lektionen. |

Eine Lektion öffnet sich nur, wenn das Lernfeld `status: "verfuegbar"` hat und die Lektion selbst verfügbar ist und eine Datei nennt. Dateien von LF8 und LF9 schalten nichts frei.
