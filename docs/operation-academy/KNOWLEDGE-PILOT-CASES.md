# Knowledge Pilot – drei Fehlerfälle

Alle drei Aufträge beginnen mit derselben Meldung: „Ich kann den vorgesehenen Netzwerkdienst nicht erreichen.“ Die Oberfläche nennt die Ursache nicht. Die Reihenfolge der Aufträge wird lokal gemischt und im Pilotstand gemerkt.

Gemeinsame Sollwerte: Netz `10.20.30.0/24`, Gateway `10.20.30.1`, DNS `10.20.30.53`, Dienst-IP `10.20.30.80`, Name `auftrag.werkstatt-nord.test`.

## Fall 1 – physische Verbindung

Fakten: Link an Dose D-12 aus, Patchkabel sitzt nicht. Adresse, Maske, Gateway und DNS sind die Sollwerte. Prüfung per IP scheitert. Prüfung per Name scheitert. Gateway und DNS antworten nicht, weil der Anschluss keinen Link hat. Mira-02 am selben Switch hat Link und erreicht `10.20.30.80`.

Nötige Untersuchungen: Link und IP-Prüfung. Trennender Befund: `link-mira-down`.

Ursache: physische Unterbrechung. Maßnahme: Patchkabel neu aufstecken und den Link erneut prüfen.

Warum das kein DNS-Fehler ist: Name und IP scheitern beide. Ein DNS-Fehler verlangt, dass die IP-Prüfung gelingt und nur der Name scheitert.

## Fall 2 – IP-Konfiguration

Fakten: Link aktiv. Mira-01 hat `10.20.40.21/24`. Die Maske ist die Sollmaske. Die Adresse liegt nicht in `10.20.30.0/24`. Gateway und DNS sind die Sollwerte und damit außerhalb des Netzes, das Mira-01 aus seiner Adresse ableitet. IP-Prüfung scheitert. Namensprüfung scheitert mit, weil der Weg zum DNS-Server schon an der Netzzugehörigkeit endet. Mira-02 erreicht den Dienst.

Nötige Untersuchungen: Link, Konfiguration, IP-Prüfung. Trennender Befund: `config-falsches-netz`. Die Maske bleibt `255.255.255.0`. Falsch ist die Adresse, nicht die Maske.

Ursache: Adresse passt nicht zum vorgesehenen Netz. Maßnahme: statische Adresse auf `10.20.30.21/24` setzen und die IP-Erreichbarkeit erneut prüfen.

Der aktive Link schließt diesen Fall nicht aus. Die Namensprüfung allein belegt keinen DNS-Fehler, weil die IP-Prüfung ebenfalls scheitert und der DNS-Eintrag der vorgesehene ist.

## Fall 3 – DNS-Namensauflösung

Fakten: Link aktiv. Adresse `10.20.30.21/24` passt. Gateway `10.20.30.1` antwortet. DNS-Eintrag ist `10.20.99.53` statt `10.20.30.53` und beantwortet die Anfrage nicht. Prüfung von `10.20.30.80` gelingt. Prüfung des Hostnamens scheitert.

Nötige Untersuchungen: IP-Prüfung, Namensprüfung, und entweder Konfiguration oder Gateway/DNS-Untersuchung. Trennende Befunde: `ping-ip-ok` und `ping-name-fail`.

Ursache: Namensauflösung. Maßnahme: DNS-Server auf `10.20.30.53` korrigieren und den Namen erneut prüfen.

Ein Kabeldefekt scheidet aus, weil der Link aktiv ist und die bekannte IP antwortet. Ein Adressfehler scheidet aus, weil die eigene Adresse im vorgesehenen Netz liegt.

## Erweiterung

Neue Fälle können dieselbe Form bekommen: Fakten, Beobachtungen je Aktion, Pflichtuntersuchungen, trennende Befunde, Hilfen, Erklärungen. Die Auswahlliste enthält bereits Gateway, Dienst und DHCP als Ablenker. Diese drei sind keine implementierten Fehlerfälle.
