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

## Simulationskern (seit T0.3)

- **Fester Takt** (`sim/core/stepClock.ts`): 10 Schritte pro Echtzeit-Sekunde bei 1x (`config/time.ts`). Die Hauptschleife rechnet vergangene Echtzeit × Geschwindigkeit in Schritte um, höchstens 40 pro Bild. Pause = keine Schritte. `alpha` erlaubt der Darstellung, zwischen Schritten zu interpolieren. So ist 4x exakt 4 × 1x, unabhängig von der Bildrate.
- **Spielzeit** (`sim/core/gameTime.ts`): Der Zustand speichert nur den Schrittzähler `tick`; Datum und Uhrzeit werden daraus berechnet (1 Tag = 3000 Schritte = 5 min bei 1x; Start 01.01.2000, 00:00). `systems/calendar.ts` meldet Tages-, Monats- und Jahreswechsel.
- **Determinismus** (`sim/core/rng.ts`): Mulberry32 mit Seed, Zustand `state.rng` wird mitgespeichert; Systeme laufen in fester Reihenfolge (`systems/index.ts`), Listen nach ID. Gleicher Seed + gleiche Befehle = gleiches Ergebnis (Test über 10.000 Schritte).
- **Datenmodell** (`sim/state/gameState.ts`): ein reines Datenobjekt mit Tabellen je Objektart (`buildings`, später `vehicles`, `roads`, …), nur JSON-Werte, Verweise nur über IDs, Geld als ganze Cent. Speichern = serialisieren.
- **Systeme mit Datenobjekten** statt vollem ECS: je System eine Datei mit `update(state, ctx)` (`sim/systems/`). Für klar unterscheidbare Objektarten einfacher zu verstehen und gut testbar.
- **Befehle** (`sim/commands/commands.ts`): Befehle werden mit `simulation.submit()` eingereicht und am Anfang des nächsten Schritts geprüft und ausgeführt, Ablehnung als Ereignis `command/rejected`. Spieleraktionen laufen über `simulation.execute()` (bzw. `GameSession.command()`) sofort zwischen zwei Schritten: gleichwertig, da Befehle auch im Schritt vor `tick + 1` laufen (Test), wirkt aber auch in der Pause und liefert das Ergebnis direkt.
- **Bauen** (seit T1.1, `sim/commands/build.ts`): `build/place` und `build/demolish`. `checkPlaceBuilding` prüft Gelände, Belegung und Geld und wird von Vorschau und Befehl gleich benutzt. Die Belegung (`sim/world/occupancy.ts`, Raster in `sim/world/grid.ts`) wird aus dem Zustand abgeleitet, nicht gespeichert. Gebäude merken sich `builtTick` und `paidCents` für die Erstattung (Anteile und Kosten in `config/build.ts`).
- **Event-Bus** (`sim/core/eventBus.ts`, Typen in `events.ts`): Ereignisse werden während eines Schritts gesammelt und am Schrittende in Meldereihenfolge verteilt. UI und Darstellung hören dieselben Ereignisse.
- **Ablauf je Schritt** (`sim/core/simulation.ts`): Befehle → `tick + 1` → Systeme → Ereignisse verteilen.
- **Straßen** (seit T1.2): `state.roads` = Liste von Straßenfeldern. `sim/world/roadLine.ts` berechnet die gezogene Strecke (gerade/L-Form), `sim/commands/roads.ts` prüft und baut/reißt ab (`road/build`, `road/demolish`). `sim/world/roadNetwork.ts` leitet das Netz ab (Einfahrt als virtuelles Feld westlich von (0, `entranceZ`)), Verbindungsmaske und Form (gerade, Kurve, T-Stück, Kreuzung, Ende). `sim/world/pathfinding.ts`: A* mit festem Gleichstands-Entscheid. Darstellung `render/views/roadsView.ts` mit zwei InstancedMesh (Asphalt, Markierung).
- **Kasse** (seit T1.6, `sim/finance/ledger.ts`): Jede Geldbewegung läuft über `book()` mit Kategorie und optionalem Ort. `state.finance` hält Kontostand, die letzten Buchungen (Anzahl in `config/economy.ts`) und Summen für den laufenden Tag und Monat; ein abgelaufener Zeitraum zählt als leer und wird bei der nächsten Buchung neu begonnen (kein eigenes System nötig). Ereignis `finance/booked` speist die schwebenden Beträge (`app/financeFeedback.ts` → `ui/hud/floatingAmounts.ts`); die Übersicht ist `ui/screens/cashDialog.ts`.
- **Wegfindung (ab M1):** Graph je Netz (Straße, Schiene, Förderband, Stapler-Wege), aus gebauten Feldern abgeleitet; A* mit Zwischenspeicher, bei Bauänderung verworfen. Reservierungen für Kreuzungen und Ladezonen ab M2.

## Darstellung

- Ziel ca. 60 Bilder/s auf einem Büro-Laptop (Chrome, Edge, Firefox aktuell).
- Instancing (InstancedMesh) für gleichartige Objekte von Anfang an; Detailstufen vorbereitet.
- Low-Poly-Modelle aus Code, keine externen Modelldateien. Farbstil „Hell & freundlich“.
- Einblendbare Leistungsanzeige (`ui/hud/perfOverlay.ts`, F3), Leistungstest der Simulation mit vielen Fahrzeugen (ab M2).
- Koordinaten: 1 Welteinheit = 1 Feld; Campus von (0, 0) bis (128, 128) in x/z, y nach oben. Gebäude-`x`/`z` = Feld der linken oberen Ecke.
- `render/scene/gameRenderer.ts` besitzt Renderer, Szene, Licht und Kamera; `terrain.ts` Gelände, Raster, Rand, Eingangsstraße; `views/` spiegeln den Zustand (z. B. `buildingsView.ts`), `models/` erzeugen Low-Poly-Modelle.
- Kamera: `render/camera/cameraRig.ts` hält Blickpunkt, Abstand, Drehung, Neigung als reine Zahlen mit Grenzen (getestet); `input/cameraInput.ts` übersetzt Maus/Tastatur/Rand-Scrollen. Grenzen und Geschwindigkeiten in `config/camera.ts`.

## Ablauf und Oberfläche (seit T0.5)

- `app/startApp.ts` legt Versionsanzeige und Renderer an; `app/appController.ts` schaltet zwischen Hauptmenü (Kamera kreist, Simulation steht) und Spiel um und verbindet Kopfleiste, Menüs, Tastenkürzel und Kamera.
- `app/gameSession.ts`: Simulation + Takt + Geschwindigkeit (0 = Pause, merkt die letzte Stufe für „Weiter“). `app/frameLoop.ts`: Bildschleife (requestAnimationFrame, max. 250 ms pro Bild).
- `ui/components/`: `dom.ts` (Helfer), `dialog.ts` (modal, Esc schließt den obersten), `confirm.ts`, `toast.ts`. `ui/hud/topbar.ts` schreibt nur bei geänderter Anzeige. `ui/screens/`: Hauptmenü, Esc-Menü, Einstellungen.
- Einstellungen: `shared/settings.ts` (Prüfung, Laden/Speichern über injizierten Speicher, localStorage im Browser), Standardwerte in `config/settings.ts`.
- `input/gameShortcuts.ts`: Leertaste, 1/2/3, Esc (bricht zuerst ein Werkzeug ab, sonst Menü); inaktiv im Hauptmenü und bei offenem Dialog.
- Bauwerkzeuge (seit T1.1): `app/buildController.ts` verbindet Bauleiste (`ui/hud/buildBar.ts`), Maus (`input/buildPointer.ts`, nur linke Taste), Vorschau (`input/buildTool.ts` → `render/views/ghostView.ts` und `ui/hud/cursorTip.ts`) und schickt beim Klick den Befehl. Der Bodenpunkt unter der Maus kommt aus `render/camera/groundPicker.ts`.

## Speichern (seit T0.6a)

- **Format** (`save/format.ts`): `{ format: "logistikum-save", saveVersion, gameVersion, createdAt, meta: { name, tick, balanceCents }, state }`. `meta` dient Listen ohne den ganzen Zustand. `parseSave` liefert Fehlercodes (`notJson`, `wrongFormat`, `tooNew`, `invalidVersion`, `migrationFailed`, `invalidState`) statt abzustürzen; `save/validate.ts` prüft die Form des Zustands.
- **Migrationen** (`save/migrations/`): eine Datei pro Sprung, eingetragen unter der Ausgangsversion, nacheinander angewendet. Jede Formatänderung = neue `saveVersion` + Migration + Beispiel-Spielstand in `tests/fixtures/saves/` (`save/fixtures.test.ts` lädt alle).
- **Nie halb geschrieben:** `serializeSave` erzeugt den Text und liest ihn zur Probe zurück, erst dann wird geschrieben. IndexedDB schreibt Eintrag (`saveMeta`) und Inhalt (`saveData`) in einer Transaktion; die Sicherungsdatei wird über eine Temporärdatei ersetzt.
- **Ablagen** (`save/backends/`): `SaveStorage`-Schnittstelle mit `IndexedDbSaveStorage` (Browser) und `MemorySaveStorage` (Tests/Rückfall). `save/saveRepository.ts`: beliebig viele benannte Slots, rotierende Autosave-Backups (Anzahl in `config/save.ts`, neues zuerst schreiben, dann älteste löschen), Export-Text.
- **Sicherungsdatei** (`backends/backupFile.ts`): File System Access API (Chrome/Edge), Dateizugriff wird in IndexedDB gemerkt; nach Browser-Neustart einmal per Klick bestätigen. **Export/Import** (`backends/fileTransfer.ts`): Download als `.json`, Import über Dateiauswahl.
- **Bedienung** (seit T0.6b): `app/saveController.ts` verbindet Ablage, Dialoge (`ui/screens/saveDialog.ts`, `loadDialog.ts`, Liste `ui/components/saveList.ts`) und Autosave. `app/autosaveTimer.ts` zählt Echtzeit im Spiel (eigener Sekunden-Takt, unabhängig von der Bildrate): Autosave im Intervall aus den Einstellungen, nur bei Fortschritt; Export-Erinnerung alle 30 Minuten, solange keine Sicherungsdatei aktiv ist. Ohne IndexedDB fällt das Spiel auf den Arbeitsspeicher zurück und sagt es.
- `window.__logistikum` gibt Rauchtests und der Konsole Zugriff auf die App (z. B. `saves.autosave()`).

## Auslieferung

- `vite build` erzeugt **eine** `dist/index.html` (Skripte, Styles eingebettet, `base: './'`). Dieselbe Datei läuft auf GitHub Pages und per Doppelklick.
- Version aus `package.json`, Build-Datum und Kurz-Commit werden beim Build eingesetzt (`src/shared/buildInfo.ts`) und unten rechts angezeigt.
- `ci.yml`: bei jedem Pull Request Lint, Typen, Tests, Build, Rauchtest, ZIP.
- `deploy.yml`: bei Push auf `main` erst die komplette Prüfung, dann GitHub Pages mit `download/logistikum-latest.zip`. Bei Tag `v*` (muss zu `package.json` passen) ein GitHub-Release mit `logistikum-vX.Y.Z.zip`. Der Tag kann auch über GitHub → Releases → „Draft a new release“ entstehen (Cloud-Sitzungen dürfen keine Tags pushen); der Workflow hängt das ZIP dann an das vorhandene Release.
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
