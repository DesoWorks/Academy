# Späterer Anwendertest – noch nicht freigegeben

Diese Anleitung gilt erst, nachdem ein DEV-Release ausdrücklich freigegeben und veröffentlicht wurde. Der lokale Kandidat `0.3.1-dev.6.local` darf nicht auf dem Arbeitsrechner installiert werden. Ein Setup derselben App-ID kann eine bestehende Installation verdrängen.

## Was der Anwender danach sieht

1. Die Academy bietet ein Core-Update über den bestehenden DEV-Kanal an. Modul `1.0.2` wird dabei nicht von selbst ersetzt.
2. Nach dem Core-Update bleibt das alte Modul sichtbar, aber nicht startbereit. Der Text nennt den Grund: das Modul übernimmt den Darstellungsmodus nicht.
3. Wenn der mitgelieferte Katalog `1.0.3` enthält, gibt es eine Aktion: **Aktualisieren**. Kein zweiter Download, kein manuelles Kopieren.
4. Nach erfolgreicher Aktualisierung bleibt der bisherige Lernstand erhalten. Abgeschlossene und begonnene Aufgaben sollen noch da sein.
5. Hell, Dunkel und hoher Kontrast bleiben in den Einstellungen wählbar. „Jetzt lernen“ muss in allen drei Modi lesbar sein.

## Was der Anwender nicht tun soll

- Den lokalen Kandidaten aus `dist/` installieren.
- Modulordner von Hand überschreiben.
- Eine ältere Modulversion über eine neuere legen. Das wird abgelehnt.
- Einen Fehlschlag durch Löschen der Lerndaten „reparieren“. Ein abgelehntes Modulupdate darf den alten Stand liegen lassen.

## Woran ein Fehlschlag zu erkennen ist

- Kein **Aktualisieren**, obwohl das Modul gesperrt ist: der Core hat kein neueres kompatibles Paket mitgeliefert. Nicht weiterarbeiten und den Stand melden.
- Nach **Aktualisieren** fehlt eine zuvor abgeschlossene Aufgabe: stoppen, nichts erneut installieren, den Stand melden.
- Die Fläche ist dunkel und „Jetzt lernen“ ist kaum zu sehen: der Theme-Vertrag greift nicht. Modul nicht als in Ordnung melden.
