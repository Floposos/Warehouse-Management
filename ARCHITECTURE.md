# Architektur

Kurzfassung der technischen Entscheidungen. Begründungen je ein bis zwei Sätze. Stand: 07.10.2026.

## Werkzeuge

| Bereich     | Wahl                                  | Warum                                                                                                                       |
| ----------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sprache     | TypeScript (strikt)                   | Viele Systeme teilen Datenmodelle, viele Threads arbeiten nacheinander; Typen fangen falsch verbundene Teile beim Build ab. |
| Build       | Vite                                  | Schnell, Standard für Three.js, Version und Build-Datum lassen sich einsetzen (`vite.config.ts`).                           |
| 3D          | Three.js                              | Vorgabe.                                                                                                                    |
| Lint/Format | ESLint (typescript-eslint) + Prettier | Einheitlicher Stil; ESLint erzwingt auch die Schichttrennung und die Dateigröße.                                            |
| Tests       | Vitest                                | Nutzt die Vite-Konfiguration, schnell, ideal für reine Logik.                                                               |
| Rauchtest   | Playwright (Chromium)                 | Prüft, dass der fertige Build über http und `file://` startet und die Konsole sauber bleibt.                                |
| Einzeldatei | vite-plugin-singlefile                | Packt alles in eine `index.html`, damit der Download ohne Server startet.                                                   |
| UI          | kein Framework                        | Schlankes TypeScript mit HTML/CSS über der Szene. Falls Panels/Diagramme (M5) das zu mühsam machen, wird vorher gefragt.    |

Weitere Bibliotheken nur mit Begründung; alles über ein kleines Hilfspaket vorher mit Florian abstimmen.

## Ordnerstruktur

```
src/
├─ main.ts         Einstieg
├─ app/            Spielablauf: Hauptschleife, Wechsel Menü ↔ Spiel, verbindet die Schichten
├─ sim/            SIMULATION, reine Logik (kein Three.js, kein DOM)
│  ├─ core/        Takt (Fixed Timestep), Zufall mit Seed, Event-Bus, Spielzeit
│  ├─ state/       Datenmodell des Spielzustands (JSON-fähig)
│  ├─ systems/     ein System pro Datei: transport, production, finance, …
│  ├─ world/       Raster, Belegung, Wegegraph, Wegfindung, Reservierungen
│  └─ commands/    Spieleraktionen: bauen, abreißen, kaufen, …
├─ render/         DARSTELLUNG (Three.js): scene/, camera/, models/, views/
├─ ui/             OBERFLÄCHE: components/, screens/, hud/, texts/de.ts, styles.css
├─ input/          EINGABE: Maus, Tastatur, Belegung, Bauwerkzeuge, Auswahl
├─ save/           SPEICHERN: Format, Versionen, migrations/, backends/
├─ config/         BALANCING als Daten: Preise, Löhne, Geschwindigkeiten, Kapazitäten
├─ content/        DEFINITIONEN: Produkte, Rezepte, Zonen-, Gebäude-, Fahrzeugtypen, Ereignisse
└─ shared/         Hilfsfunktionen: Mathe, Koordinaten, IDs, Formatierung, Build-Info
tests/
├─ smoke/          Playwright-Rauchtests (http und file://)
├─ lint/           Nachweis, dass die Schichtregeln greifen
└─ fixtures/saves/ alte Spielstände je Version (Migrationstests)
scripts/           ZIP-Paketierung
.github/workflows/ ci.yml (Prüfung), deploy.yml (Pages + Release)
```

Leere Ordner tragen eine `.gitkeep`, bis die erste Datei kommt. Unit-Tests liegen neben der getesteten Datei.

## Schichten und Abhängigkeiten

```
config, content, shared  ←  sim  ←  save
                             ↑
             app  →  render, ui, input   (lesen den Zustand, schicken Befehle)
```

- `sim/` importiert nur `config/`, `content/`, `shared/`. Kein Three.js, kein `window`/`document`/`indexedDB` usw.
- `config/`, `content/`, `shared/` importieren keine höheren Schichten und kein Three.js.
- `save/` kennt `sim`, `config`, `content`, `shared`, aber keine Darstellung, UI oder Eingabe.
- `render/`, `ui/`, `input/` lesen den Zustand und hören Ereignisse, ändern ihn aber nie direkt. Jede Spieleraktion wird ein Befehl, den die Simulation im nächsten Takt prüft und ausführt.
- Durchgesetzt in `eslint.config.js` (`no-restricted-imports`, `no-restricted-globals`), nachgewiesen in `tests/lint/layerBoundaries.test.ts`.

Warum: Die Logik bleibt ohne Browser testbar, Grafik- und UI-Änderungen können die Regeln nicht beschädigen, und die Simulation kann bei Bedarf ohne Umbau in einen Web Worker wandern.

## Simulationskern (Plan, Umsetzung ab T0.3)

- **Fester Takt:** feste Schritte pro Spielsekunde (Wert in `config/`). Die Hauptschleife rechnet vergangene Echtzeit × Geschwindigkeit in Schritte um, mit Obergrenze pro Bild. Pause = keine Schritte. Die Darstellung interpoliert zwischen Schritten. So ist 4x exakt 4 × 1x, unabhängig von der Bildrate.
- **Determinismus:** Zufall mit Seed, Zustand des Generators im Spielstand; feste Reihenfolge der Systeme, Listen nach ID. Gleicher Seed + gleiche Befehle = gleiches Ergebnis.
- **Datenmodell:** ein reines Datenobjekt mit Tabellen je Objektart (`vehicles`, `buildings`, `roads`, …), nach ID geordnet, nur JSON-Werte, Verweise nur über IDs. Speichern = serialisieren.
- **Systeme mit Datenobjekten** statt vollem ECS: je System eine Datei mit `update(state, ctx)`. Für klar unterscheidbare Objektarten einfacher zu verstehen und gut testbar.
- **Event-Bus:** typisierte Ereignisse, während eines Schritts gesammelt und am Schrittende in fester Reihenfolge verteilt. UI und Darstellung hören dieselben Ereignisse.
- **Wegfindung:** Graph je Netz (Straße, Schiene, Förderband, Stapler-Wege), aus gebauten Feldern abgeleitet; A* mit Zwischenspeicher, bei Bauänderung verworfen. Reservierungen für Kreuzungen und Ladezonen ab M2, Datenmodell ab M1 dafür ausgelegt.

## Darstellung

- Ziel ca. 60 Bilder/s auf einem Büro-Laptop (Chrome, Edge, Firefox aktuell).
- Instancing (InstancedMesh) für gleichartige Objekte von Anfang an; Detailstufen vorbereitet.
- Low-Poly-Modelle aus Code, keine externen Modelldateien. Farbstil „Hell & freundlich“.
- Einblendbare Leistungsanzeige (ab T0.4), Leistungstest der Simulation mit vielen Fahrzeugen (ab M2).

## Speichern (Plan, Umsetzung ab T0.6a)

- Format `{ format: "logistikum-save", saveVersion, gameVersion, createdAt, seed, state }`.
- Migrationen: eine Datei pro Versionssprung in `save/migrations/`, nacheinander angewendet; Beispiel-Spielstand je Version in `tests/fixtures/saves/`.
- Slots in IndexedDB (beliebig viele mit Namen); Export/Import als `.json`.
- Autosave Chrome/Edge: Sicherungsdatei über die File System Access API. Firefox/Fallback: IndexedDB mit rotierenden Backups und Export-Erinnerung.
- Nie halb geschrieben: erst komplett erzeugen und prüfen, dann in einem Schritt schreiben.

## Auslieferung

- `vite build` erzeugt **eine** `dist/index.html` (Skripte, Styles eingebettet, `base: './'`). Dieselbe Datei läuft auf GitHub Pages und per Doppelklick.
- Version aus `package.json`, Build-Datum und Kurz-Commit werden beim Build eingesetzt (`src/shared/buildInfo.ts`) und unten rechts angezeigt.
- `ci.yml`: bei jedem Pull Request Lint, Typen, Tests, Build, Rauchtest, ZIP.
- `deploy.yml`: bei Push auf `main` erst die komplette Prüfung, dann GitHub Pages mit `download/logistikum-latest.zip`. Bei Tag `v*` (muss zu `package.json` passen) ein GitHub-Release mit `logistikum-vX.Y.Z.zip`.
- Voraussetzung im Repo: Settings → Pages → Source „GitHub Actions“.

## Repo-Organisation

- `main` ist immer lauffähig und wird ausgeliefert. Arbeit in Feature-Branches, Merge nur per Pull Request mit grüner CI (Squash).
- Conventional Commits. Versionen `0.<Meilenstein+1>.<Patch>`, zwischen Meilensteinen `-dev`.

## Netzwerk-Domains

Domains, die die Cloud-Entwicklungsumgebung braucht (Netzwerkstufe „Vertraut“). Neue Domains hier eintragen.

| Domain                         | Wofür                   | Status                             |
| ------------------------------ | ----------------------- | ---------------------------------- |
| `registry.npmjs.org`           | npm-Pakete installieren | in der Standardliste, funktioniert |
| `github.com`, `api.github.com` | Repo, Pull Requests     | in der Standardliste, funktioniert |

Nicht nötig in der Cloud-Umgebung: Playwright-Browser-Downloads (Chromium ist dort vorinstalliert, `@playwright/test` ist passend auf 1.56.1 festgelegt). Die GitHub-Actions-Läufe laden Chromium selbst; das betrifft nicht die Cloud-Umgebung.
