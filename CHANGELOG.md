# Changelog

Pro Version: Was ist neu, Was wurde behoben, So testest du das, Bekannte Probleme.
Versionen: M0 = 0.1.0, M1 = 0.2.0, … (siehe [ROADMAP.md](ROADMAP.md)).

## [Unveröffentlicht] – 0.1.0-dev

### Was ist neu

- Projektgerüst: TypeScript, Vite, Three.js, Vitest, ESLint, Prettier, Playwright-Rauchtest.
- Ordnerstruktur mit getrennten Schichten; Lint-Regeln verhindern Three.js- und Browser-Zugriffe in der Spiellogik und Dateien über 300 Zeilen.
- Platzhalter-Bildschirm: Titel „Logistikum“ über einer kleinen 3D-Szene (Rasterboden, Test-Halle, kreisende Kamera).
- Version, Build-Datum und Kurz-Commit unten rechts im Bild.
- Automatische Prüfung bei jedem Pull Request (Lint, Typen, Tests, Build, Rauchtest über http und `file://`).
- Automatische Auslieferung von `main` auf GitHub Pages mit aktuellem ZIP unter `download/logistikum-latest.zip`; Tags `v*` erzeugen ein Release mit ZIP.
- Dokumentation: README, DESIGN, ARCHITECTURE, ROADMAP, CHANGELOG, TESTING, CLAUDE.md.
- Simulationskern (T0.3): fester Takt (10 Schritte pro Sekunde bei 1x), Spielzeit ab 1. Januar 2000 (1 Spieltag = 5 Minuten bei 1x), Tages-, Monats- und Jahreswechsel als Ereignisse, Zufall mit Seed, Befehle und Ereignis-Bus, Kontostand als Platzhalter. Noch nicht sichtbar; die Uhr erscheint mit der Kopfleiste (T0.5).

### So testest du das

1. Link https://floposos.github.io/Warehouse-Management/ öffnen: Titel „Logistikum“, darunter die Szene mit Halle; unten rechts die Version.
2. Auf der Seite „Download (ZIP)“ klicken, ZIP entpacken, `index.html` doppelklicken: gleiche Ansicht, nur ohne Download-Knopf.
3. Simulationskern: nichts zu sehen; die automatischen Tests (`npm test`) prüfen Determinismus, 4x = 4 × 1x, Pause und Kalender.

### Bekannte Probleme

- Der Link funktioniert erst, wenn GitHub Pages im Repo auf „GitHub Actions“ gestellt ist (einmalig: Settings → Pages → Source „GitHub Actions“).
