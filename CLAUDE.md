# Regeln für Entwicklungs-Threads

Spiel: **Logistikum**, 3D-Logistik-Managementspiel (Three.js, TypeScript, Vite). Oberfläche komplett **Deutsch**, Kommunikation mit Florian auf Deutsch.

Vor der Arbeit lesen: dein Briefing, [ARCHITECTURE.md](ARCHITECTURE.md), nur die Dateien, die deine Aufgabe betrifft.

## Zuständigkeiten

- Spiel-Entscheidungen (alles, was der Spieler sieht, erlebt oder bedient) trifft **Florian**. Threads treffen keine; stoßen sie auf eine, melden sie sie an den Koordinator. Unvermeidbare Annahmen deutlich mit „ANNAHME:“ kennzeichnen.
- Technische Umsetzung entscheiden die Threads im Rahmen von ARCHITECTURE.md.

## Qualitätsregeln

1. Keine Auslieferung ohne grüne Tests und erfolgreichen Build (`npm run check`).
2. Jede neue Spiellogik bekommt automatisierte Tests (neben der Datei: `x.ts` + `x.test.ts`).
3. Jeder gefundene Fehler bekommt zuerst einen Test, der ihn nachweist, dann die Korrektur.
4. TESTING.md enthält die manuelle Checkliste; mit jedem Meilenstein erweitern, vor jeder Auslieferung durchgehen.
5. Keine großen Umbauten bestehender Systeme ohne Absprache mit dem Koordinator (bei spürbaren Auswirkungen auch mit Florian).
6. Eine Datei = eine Verantwortung, max. ca. 300 Zeilen (Lint prüft das). Lieber aufteilen.
7. Balancing-Werte (Preise, Löhne, Geschwindigkeiten, Kapazitäten) nur in `src/config/`, nie im Code.
8. Keine Fehler oder Warnungen in der Browser-Konsole (der Rauchtest prüft das).
9. Spielstände der Vorversion müssen ladbar bleiben: jede Formatänderung = neue `saveVersion` + Migration + Beispiel-Spielstand in `tests/fixtures/saves/`.
10. Keine Zugangsdaten, Tokens oder persönlichen Daten im Repo.

## Definition of Done

Abnahmekriterien erfüllt · Tests geschrieben und grün · Lint und Build fehlerfrei · manuelle Checkliste für betroffene Bereiche bestanden · CHANGELOG.md mit „Was ist neu“ und „So testest du das“ ergänzt · DESIGN.md, ROADMAP.md, ARCHITECTURE.md aktuell.

## Konventionen

- Schichten: `src/sim/` ist reine Logik (kein Three.js, kein DOM); Darstellung, UI und Eingabe ändern den Zustand nie direkt, sondern über Befehle. Details in ARCHITECTURE.md.
- Alle Oberflächentexte in `src/ui/texts/de.ts`.
- Branch pro Aufgabe, Pull Request mit grüner CI, Squash-Merge. `main` bleibt immer lauffähig.
- Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`).
- Neue Abhängigkeiten nur mit Begründung; alles über ein kleines Hilfspaket vorher mit Florian abstimmen.
- Blockierte Netzwerk-Domain: nicht umgehen, sondern Domain, Zweck und Alternative melden; bekannte Domains stehen in ARCHITECTURE.md.
- Rückmeldung an den Koordinator nur als Zusammenfassung: erledigt, Dateien, Testergebnis, Abweichungen, offene Punkte.
