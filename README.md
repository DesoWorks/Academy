# IT-Ausbildung Desktop

OPERATION ACADEMY. Diese Hülle startet die vorhandene Lernplattform ohne installierten Browser.

## Entwicklung

```bat
cd desktop
npm install
npm test
npm start
```

Daten liegen unter `%APPDATA%\DesoWorks\IT-Ausbildung`, nicht im Programmordner und nicht im Workspace.

Der Kanal in `channel.json` ist `dev`. Dieser Build lädt keine produktiven Updates herunter und installiert sie nicht.

## Testbuild

```bat
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist:nsis
```

Der Installer heißt `desktop\dist\IT-Ausbildung-Setup-0.1.0.exe`. Er ist nicht signiert und nicht zur Verteilung freigegeben.

Ein Stable-Release ist ein gesonderter Auftrag. Dafür muss `channel.json` auf `stable` stehen, die Release-Assets eine `.sha256`-Datei haben, und der Commander die Veröffentlichung freigeben.
