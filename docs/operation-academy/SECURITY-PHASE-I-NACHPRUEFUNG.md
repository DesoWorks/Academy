# Sicherheitsnachprüfung Phase I – Herausgeberbindung nach Deinstallation

**Datum:** 2026-11-21  
**Auslöser:** `SECURITY-PHASE-I.md`, Befund MITTEL: nach Deinstallation prüfte `installFromDirectory` die Herausgeber-ID nicht mehr, weil die Zeile den Zustand `uninstalled` hatte. Ein fremdes Paket mit derselben Modul-ID hätte die liegenden Lernstände geerbt.

## Änderung

In `src/modules/manager.js` gilt die Herausgeberprüfung jetzt für jeden vorhandenen Installationseintrag, auch nach Deinstallation. Vertrauensstufe und Downgrade-Sperre gelten weiter nur für einen noch installierten Stand. Die Lernstände werden nicht gelöscht und nicht an den fremden Herausgeber übergeben. Die Installation wird abgelehnt (`publisher-mismatch`).

## Nachweis

Neuer Test: `deinstallierte Modul-ID bleibt an den bisherigen Herausgeber gebunden` in `tests/modules.test.js`.

`npm test` im Academy-Root danach: 52 Tests, 52 bestanden, 0 fehlgeschlagen.

Das ist eine Code- und Testnachprüfung, keine Produktionsfreigabe.
