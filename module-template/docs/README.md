# Modulvorlage

1. ID, Herausgeber, Lizenz und Lernziel ersetzen.
2. `content/course.json` füllen. Lösungen stehen nur in `answer` und verlassen den Hauptprozess nicht.
3. Keine `.js`-Dateien in `files` aufnehmen. Der Core führt Modulcode nicht aus.
4. Lokal installieren über die Modulverwaltung oder `createModuleManager().installFromDirectory`.
5. `tests/course.test.js` mit Node starten, bevor das Paket weitergegeben wird.
6. Signatur und Prüfstatus erst setzen, wenn ein hinterlegter Schlüssel wirklich signiert hat. Ein erfolgreicher Test ist keine Veröffentlichung.


## Academy-Laufzeit

Ein hosted-web-Modul bekommt vom Protokoll zwei Stylesheets, bevor `</head>` schließt:

- `/__academy/design-tokens.css` – Markentokens, Namen `--dw-*`
- `/__academy/host.css` – Einbettung. Blendet das doppelte Markenlogo aus und nimmt der Modulleiste den eigenen Scroll.

`:where()`-Regeln verlieren gegen jedes eigene Stylesheet. Ein neues Modul muss keine globalen CSS-Regeln schreiben, um Grundfläche, Text und Schrift zu bekommen. Fachseiten dürfen eigene Flächen behalten.

Die Academy-Navigation bleibt außen. Die Modulnavigation bleibt im Modul. Zurück zur Startseite und zu den Lernbereichen geht über die Academy-Navigation, nicht über eine zweite Leiste.
