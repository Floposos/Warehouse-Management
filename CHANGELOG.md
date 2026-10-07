# Changelog

Pro Version: Was ist neu, Was wurde behoben, So testest du das, Bekannte Probleme.
Versionen: M0 = 0.1.0, M1 = 0.2.0, … (siehe [ROADMAP.md](ROADMAP.md)).

## [Unveröffentlicht] – 0.1.0-dev

### Was ist neu

- Projektgerüst: TypeScript, Vite, Three.js, Vitest, ESLint, Prettier, Playwright-Rauchtest.
- Ordnerstruktur mit getrennten Schichten; Lint-Regeln verhindern Three.js- und Browser-Zugriffe in der Spiellogik und Dateien über 300 Zeilen.
- Version, Build-Datum und Kurz-Commit unten rechts im Bild.
- Automatische Prüfung bei jedem Pull Request (Lint, Typen, Tests, Build, Rauchtest über http und `file://`).
- Automatische Auslieferung von `main` auf GitHub Pages mit aktuellem ZIP unter `download/logistikum-latest.zip`; Tags `v*` erzeugen ein Release mit ZIP.
- Dokumentation: README, DESIGN, ARCHITECTURE, ROADMAP, CHANGELOG, TESTING, CLAUDE.md.
- Simulationskern (T0.3): fester Takt (10 Schritte pro Sekunde bei 1x), Spielzeit ab 1. Januar 2000 (1 Spieltag = 5 Minuten bei 1x), Tages-, Monats- und Jahreswechsel als Ereignisse, Zufall mit Seed, Befehle und Ereignis-Bus, Kontostand als Platzhalter. Noch nicht sichtbar; die Uhr erscheint mit der Kopfleiste (T0.5).
- Campus und Kamera (T0.4): Gelände 128 × 128 Felder mit Raster (jedes 8. Feld kräftiger), hellem Rand und angedeuteter Eingangsstraße an der Westseite; Test-Halle (8 × 6 Felder) rastergenau. Kamera im Aufbauspiel-Stil: rechte Maustaste ziehen = drehen und neigen, mittlere Maustaste ziehen = verschieben, Mausrad = zoomen, WASD/Pfeiltasten = verschieben, Q/E = drehen, R/F = neigen, +/− = zoomen, Maus an den Bildschirmrand = verschieben. Leistungsanzeige mit F3.
- Hauptmenü, Kopfleiste, Zeit und Einstellungen (T0.5): Hauptmenü links über dem langsam umkreisten Campus (Neues Spiel, Laden, Einstellungen, Download-Link in der Web-Version). Kopfleiste mit Wochentag, Datum und Uhrzeit, Kontostand, Zeitsteuerung (Pause, 1x, 2x, 4x) und Menü. Tasten: Leertaste = Pause/Weiter, 1/2/3 = 1x/2x/4x, Esc = Menü (pausiert das Spiel). Einstellungen: Autosave-Intervall, Kamera-Empfindlichkeit, Rand-Scrollen; bleiben nach Neuladen erhalten.
- Speicherkern (T0.6a): versioniertes Spielstand-Format mit Migrationen, beliebig viele benannte Speicherplätze im Browser-Speicher, rotierende Autosave-Backups (3), Export/Import als Datei, Sicherungsdatei für Chrome/Edge. Fehlerhafte oder zu neue Dateien geben eine Meldung statt eines Absturzes. Bedienbar mit T0.6b.

### So testest du das

1. Link https://floposos.github.io/Warehouse-Management/ öffnen: Hauptmenü links, dahinter kreist die Kamera über den Campus; unten rechts die Version.
2. Im Hauptmenü „Download (ZIP)“ klicken, ZIP entpacken, `index.html` doppelklicken: gleiche Ansicht, nur ohne Download-Link.
3. „Neues Spiel“: Kopfleiste zeigt „Sa, 01.01.2000“, die Uhr läuft (1 Spieltag = 5 Minuten), Kontostand 1.000.000 €.
4. Leertaste: „PAUSE“ erscheint, Uhr steht. Taste 2 bzw. 3: Uhr läuft doppelt bzw. vierfach so schnell, der aktive Knopf ist blau. Dasselbe per Klick.
5. Esc: Menü „Spiel pausiert“ öffnet sich, Spiel pausiert; nochmal Esc oder „Weiterspielen“: läuft weiter. „Hauptmenü“ fragt vorher nach.
6. Einstellungen ändern (z. B. Autosave „alle 10 Minuten“), Seite neu laden: Einstellung ist noch da.
7. Kamera: rechte Maustaste gedrückt halten und ziehen (drehen/neigen), mittlere Maustaste ziehen (verschieben), Mausrad (zoomen). Dasselbe mit WASD, Q/E, R/F, +/−. Maus an den Bildschirmrand bewegen: Karte scrollt.
8. Versuchen, unter den Boden zu neigen oder aus dem Gelände zu fahren: geht nicht. Die Halle sitzt genau auf den Rasterlinien.
9. F3 drücken: unten links erscheint die Leistungsanzeige (Bilder/s); nochmal F3 blendet sie aus.

### Bekannte Probleme

- ANNAHME: R/F zum Neigen, +/− zum Zoomen und F3 für die Leistungsanzeige sind nicht festgelegt worden; Rückmeldung erwünscht.

- Der Link funktioniert erst, wenn GitHub Pages im Repo auf „GitHub Actions“ gestellt ist (einmalig: Settings → Pages → Source „GitHub Actions“).
