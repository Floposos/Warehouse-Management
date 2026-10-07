# Logistikum

3D-Logistik-Managementspiel im Browser: Du leitest aus der Vogelperspektive einen großen Logistik-Campus, baust Straßen, Zonen und Hallen und bringst Waren durch mehrstufige Produktketten bis zum Export. Low-Poly-Grafik, Oberfläche komplett auf Deutsch.

**Aktueller Stand:** M0 Grundgerüst fertig zum Test (Version `0.1.0`): Hauptmenü, Campus mit Kamera, laufende Zeit mit Pause/1x/2x/4x, Speichern/Laden/Export/Import und Autosave.

## Spielen

- **Im Browser:** https://floposos.github.io/Warehouse-Management/
- **Download (immer aktuell):** https://floposos.github.io/Warehouse-Management/download/logistikum-latest.zip
- **Download je Meilenstein:** unter [Releases](https://github.com/Floposos/Warehouse-Management/releases)

Download-Version: ZIP entpacken, `index.html` doppelklicken. Keine Installation, kein Server nötig. Empfohlen: aktuelles Chrome, Edge oder Firefox.

Steuerung: rechte Maustaste ziehen = drehen/neigen, mittlere Maustaste ziehen = verschieben, Mausrad oder E/Q = zoomen, WASD = verschieben, R/F = neigen, Y/X = drehen, Bildschirmrand = verschieben. Leertaste = Pause, 1/2/3 = 1x/2x/4x, Esc = Menü, F3 = Leistungsanzeige.

Version, Build-Datum und Kurz-Commit stehen unten rechts im Bild (z. B. `v0.1.0 · 12.11.2026 · a1b2c3d`). Bitte bei Feedback mit angeben.

## Dokumentation

| Datei                              | Inhalt                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------- |
| [DESIGN.md](DESIGN.md)             | Spieldesign, Entscheidungen mit Datum, offene Designfragen             |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Ordnerstruktur, Schichten, technische Entscheidungen, Netzwerk-Domains |
| [ROADMAP.md](ROADMAP.md)           | Meilensteine, Aufgaben, Abnahmekriterien, Status                       |
| [CHANGELOG.md](CHANGELOG.md)       | Änderungen je Version mit „So testest du das“                          |
| [TESTING.md](TESTING.md)           | Manuelle Test-Checkliste, automatische Tests                           |
| [CLAUDE.md](CLAUDE.md)             | Regeln für Entwicklungs-Threads                                        |

## Entwicklung

Voraussetzung: Node.js 22.

```bash
npm ci            # Abhängigkeiten installieren
npm run dev       # Entwicklungsserver
npm run check     # alles: Lint, Typen, Tests, Build, Rauchtest
```

Einzelbefehle: `lint`, `format`, `typecheck`, `test`, `build`, `preview`, `smoke`, `package` (siehe [TESTING.md](TESTING.md)).
