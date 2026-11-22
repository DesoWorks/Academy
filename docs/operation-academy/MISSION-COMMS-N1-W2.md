# OPERATION ACADEMY – PHASE N.1 / WELLE 2
## Kommunikations- und Entscheidungsübergabe

### Blockaden und Entscheidungen mit Auswirkung auf den weiteren Verlauf

- **Integration wartet auf drei unabhängige Ergebnisse:** JARVIS-Code zur Update-Implementierung, ROBOCOPs Basis-Sicherheitsprüfung und GLaDOS-Tests. Die Integration und abschließende Prüfung beginnen mit Vorliegen dieser Ergebnisse.
- **GitHub-Actions-Signatur:** Ein Actions-Secret kann die Crew nicht selbst anlegen. Damit bleibt die automatische Signatur in GitHub Actions blockiert, bis der Commander das erforderliche Secret über GitHub bereitstellt.
- **DEV-Testrelease:** Ein Actions-Secret ist keine Voraussetzung für einen lokal signierten DEV-Test, sofern der private Schlüssel lokal vorhanden ist und nicht committed wird. Ob dieser Weg genutzt werden kann, hängt davon ab, ob ein geeigneter lokaler Schlüssel tatsächlich vorhanden ist.
- **STABLE:** Das fehlende Herausgeberzertifikat blockiert ausschließlich STABLE; es blockiert keinen lokal signierten DEV-Test.

### Bereits festgelegte Grenzen

Feature-Branch und DEV-Pfad bleiben maßgeblich. Kein Merge nach `main`, kein Stable-Release, kein VPS, keine Änderung der Sichtbarkeit, kein Abschalten von Signatur oder Hash und keine Löschung von Lernständen. Der private Schlüssel bleibt außerhalb des Repositories. Die Installation `0.3.1-dev.2` ist kein gültiger A/B-Ausgang; Releases bestehen derzeit nicht.
