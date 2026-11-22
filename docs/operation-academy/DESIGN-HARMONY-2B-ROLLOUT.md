# Design Harmony – Rollout nach 2B

**Status:** vorbereitet, nicht gestartet.

2B hat den Vertrag und eine repräsentative Seite. Es hat die übrigen Fundstellen nicht umgeschrieben.

## Reihenfolge, wenn der Commander den Rollout freigibt

Zuerst nur die von SMITH benannten LF3-Seiten, eine Datei nach der anderen, im Academy-iframe in Hell und Dunkel gesehen:

1. `lf3-dhcp.html`
2. `lf3-dns.html`
3. `lf3-verbindung-eingrenzen.html`
4. `lf3-fehlerbild-protokoll.html`
5. `lf3-ipv4-konfiguration.html`

Danach je ein abweichendes Muster: `lf2-kriterien.html`, `lf1-ausbildungsbetrieb.html`, `lf7-fluesse.html`. `lf9-infrastruktur.html` erst, wenn der Lernweg freigegeben ist.

Keine pauschale Ersetzung. Eine Stelle ohne weißen Fallback und ohne gesehenen Fehler bleibt stehen.

## Mitnahme aus 2B

- Dieselben sieben Rollen. Keine neuen Hex-Werte.
- `data-academy-theme` bleibt die Quelle. Das Modul setzt sie nicht selbst.
- Jede geänderte Moduldatei braucht im selben Stand den Nutzlastindex. Getrennte Commits machen die Installation kaputt.
- Vorher den sichtbaren Fokus auf der Antwort klären. 2B hat ihn nicht belegt.
- Screenreader und 200-%-Reflow bleiben offene Abnahmepunkte, auch wenn eine Seite farblich stimmt.

## Nicht Teil dieses Rollouts

Updateoberfläche, Statuszeile, App-ID, `main`, Stable, Installation auf dem Benutzerprofil.
