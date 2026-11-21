# Modulvorlage

1. ID, Herausgeber, Lizenz und Lernziel ersetzen.
2. `content/course.json` füllen. Lösungen stehen nur in `answer` und verlassen den Hauptprozess nicht.
3. Keine `.js`-Dateien in `files` aufnehmen. Der Core führt Modulcode nicht aus.
4. Lokal installieren über die Modulverwaltung oder `createModuleManager().installFromDirectory`.
5. `tests/course.test.js` mit Node starten, bevor das Paket weitergegeben wird.
6. Signatur und Prüfstatus erst setzen, wenn ein hinterlegter Schlüssel wirklich signiert hat. Ein erfolgreicher Test ist keine Veröffentlichung.
