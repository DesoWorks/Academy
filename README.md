# DesoWorks Academy

Eigenständige Desktop-Plattform (Electron) mit neutralem Academy Core. Der Core enthält Startseite, Navigation, Modulmanager, Modul-Laufzeit, Datenhaltung mit Sicherung, Update-Verwaltung und Einstellungen. Lernangebote kommen als installierbare Module.

Dieses Repository enthält keine IT-Ausbildungsinhalte und keine Inhalte der Verwaltungs-Ausbildung. Mitgeliefert ist nur das Beispielmodul `modules/wissen-weitergeben`. Die Academy startet immer auf der neutralen Startseite und öffnet nie automatisch ein Modul.

Der KI-Lernassistent und die IDE sind vorgesehen, aber noch nicht verfügbar.

## Entwicklung

```bat
npm install
npm test
npm start
```

Daten liegen unter `%APPDATA%\DesoWorks\Academy`, nicht im Programmordner. Eine Übernahme von Daten der früheren IT-Ausbildung findet nicht automatisch statt.

Der Kanal in `channel.json` ist `dev`. Dieser Stand ist kein Release und nicht signiert. Ein App-Icon im Format `build/icon.ico` fehlt noch, siehe `build/ICON-HINWEIS.txt`.
