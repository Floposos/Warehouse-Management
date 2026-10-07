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
- Campus und Kamera (T0.4): Gelände 128 × 128 Felder mit Raster (jedes 8. Feld kräftiger), hellem Rand und angedeuteter Eingangsstraße an der Westseite; Test-Halle (8 × 6 Felder) rastergenau. Kamera im Aufbauspiel-Stil: rechte Maustaste ziehen = drehen und neigen, mittlere Maustaste ziehen = verschieben, Mausrad = zoomen, WASD/Pfeiltasten = verschieben, Q/E = drehen, R/F = neigen, +/− = zoomen, Maus an den Bildschirmrand = verschieben. Leistungsanzeige mit F3.

### So testest du das

1. Link https://floposos.github.io/Warehouse-Management/ öffnen: Titel „Logistikum“, darunter die Szene mit Halle; unten rechts die Version.
2. Auf der Seite „Download (ZIP)“ klicken, ZIP entpacken, `index.html` doppelklicken: gleiche Ansicht, nur ohne Download-Knopf.
3. Kamera: rechte Maustaste gedrückt halten und ziehen (drehen/neigen), mittlere Maustaste ziehen (verschieben), Mausrad (zoomen). Dasselbe mit WASD, Q/E, R/F, +/−. Maus an den Bildschirmrand bewegen: Karte scrollt.
4. Versuchen, unter den Boden zu neigen oder aus dem Gelände zu fahren: geht nicht. Die Halle sitzt genau auf den Rasterlinien.
5. F3 drücken: unten links erscheint die Leistungsanzeige (Bilder/s); nochmal F3 blendet sie aus.
6. Simulationskern: nichts zu sehen; die automatischen Tests (`npm test`) prüfen Determinismus, 4x = 4 × 1x, Pause und Kalender.

### Bekannte Probleme

- ANNAHME: R/F zum Neigen, +/− zum Zoomen und F3 für die Leistungsanzeige sind nicht festgelegt worden; Rückmeldung erwünscht.

- Der Link funktioniert erst, wenn GitHub Pages im Repo auf „GitHub Actions“ gestellt ist (einmalig: Settings → Pages → Source „GitHub Actions“).
