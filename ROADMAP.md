# Roadmap

Status: geplant · in Arbeit · im Test · fertig. Reihenfolge am 07.10.2026 von Florian freigegeben.
Jeder Meilenstein liefert eine spielbare Version als Link und als Download. Nach der Freigabe eines Meilensteins kommen nur noch Fehlerkorrekturen hinein, Erweiterungen werden als neue Punkte eingeplant.

| Meilenstein                              | Version | Status  |
| ---------------------------------------- | ------- | ------- |
| M0 Grundgerüst                           | 0.1.0   | im Test |
| M1 Bauen & erster Warenfluss             | 0.2.0   | geplant |
| M2 Flotte & Verkehr                      | 0.3.0   | geplant |
| M3 Produktion & Lager                    | 0.4.0   | geplant |
| M4 Export                                | 0.5.0   | geplant |
| M5 Aufträge & Finanzen (inkl. Insolvenz) | 0.6.0   | geplant |
| M6 Personal                              | 0.7.0   | geplant |
| M7 Firmenpolitik & Ereignisse            | 0.8.0   | geplant |
| M8 Züge, Kühl-/Gefahrgut, Produktkatalog | 0.9.0   | geplant |
| M9 Spielmodi & Feinschliff               | 0.10.0  | geplant |

## M0 Grundgerüst (0.1.0) – im Test

Ziel: Hauptmenü, Campus mit Raster, freie Kamera, Test-Halle, laufende Zeit mit Pause/1x/2x/4x, Topbar, Speichern/Laden/Export/Import, Autosave, CI und Auslieferung.
Ablauf: T0.1 → (T0.2, T0.3, T0.4 parallel) → (T0.5, T0.6a parallel) → T0.6b → T0.7.

| Aufgabe                                              | Status  | Abnahme (Kurzfassung)                                                                                                                                                                                         |
| ---------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T0.1 Projekt-Setup und Doku                          | fertig  | `dev`, `build`, `test`, `lint`, `typecheck` fehlerfrei; Ordnerstruktur; Lint verbietet Three.js/DOM in `sim/` (Test); alle Doku-Dateien                                                                       |
| T0.2 CI und Auslieferung                             | im Test | CI prüft Lint, Typen, Tests, Build, Rauchtest; Pages + `download/logistikum-latest.zip`; Tags `v*` → Release; Einzeldatei startet über http und `file://`; Version, Datum, Commit sichtbar                    |
| T0.3 Simulationskern und Spielzeit                   | im Test | Gleicher Seed + Befehle = gleicher Zustand nach 10.000 Schritten; 4x·1 s = 1x·4 s; Pause ändert nichts; Tag/Monat/Jahr-Ereignisse; JSON-Rundreise; Kontostand-Platzhalter                                     |
| T0.4 3D-Szene, Raster, Kamera                        | im Test | 128 × 128 Gelände mit Raster und Rand, Eingangsstraße angedeutet; Kamera nach gewählter Belegung inkl. Rand-Scrollen, mit Grenzen; Halle rastergenau; ~60 Bilder/s, Leistungsanzeige                          |
| T0.5 Hauptmenü, Topbar, Zeitsteuerung, Einstellungen | im Test | Menü über lebendem Campus (Neues Spiel, Laden, Einstellungen, Version, Download); Topbar Datum/Uhrzeit + Kontostand; Pause/1x/2x/4x per Klick und Taste; Einstellungen bleiben gespeichert; Texte aus `de.ts` |
| T0.6a Speicherkern                                   | im Test | Speichern/Laden identisch; Migrationskette getestet; falsche/zu neue Version gibt Meldung; abgebrochenes Speichern lässt alten Stand heil; Backups behalten genaue Anzahl; Beispiel-Spielstand v1             |
| T0.6b Speicher-Oberfläche und Autosave               | im Test | Speichern-/Laden-Dialoge mit Rückfragen; Export/Import; Chrome/Edge-Sicherungsdatei; Firefox-Backups + Hinweis alle 30 min; Signal „Gespeichert“                                                              |
| T0.7 Integration und Abnahme                         | im Test | Checkliste in Chrome, Edge, Firefox; Release v0.1.0 mit ZIP; Meilenstein-Bericht                                                                                                                              |

## M1 Bauen & erster Warenfluss (0.2.0) – geplant

Ablauf: T1.1 → (T1.2, T1.3, T1.6 parallel) → T1.4 → T1.5 → (T1.5b, T1.7 parallel) → T1.8. Vorher Folgefragen (siehe DESIGN.md).

| Aufgabe                                     | Abnahme (Kurzfassung)                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1.1 Bau-Grundlage                          | Bauleiste unten mittig; Vorschau grün/rot mit Grund; Bauen kostet Geld; Abriss mit Erstattung (100 % am selben Tag, sonst 50 %); Esc bricht ab                      |
| T1.2 Straßen und Wegfindung                 | Straßen ziehen (gerade/L-Form, Kosten vorab); Kurven, T-Stücke, Kreuzungen automatisch; Ein-/Ausfahrt angeschlossen; kürzester Weg, „kein Weg“, Reaktion auf Abriss |
| T1.3 Lieferorte A, B, C und Export-Ausfahrt | Frei aufziehbare Zonen, Größe = Kapazität; Farbe/Symbol; Zufahrt an Straße, sonst Warnsymbol; Lager mit Kapazität aus `config/`                                     |
| T1.4 Warenzufluss und Produktkette          | Daueraufträge und Einzelbestellungen; Zulieferer-LKW sichtbar; Rezept A+B → Kombi; volle Lager stoppen sichtbar; Export zum festen Preis                            |
| T1.5 LKW kaufen und automatisch fahren      | LKW kaufen; fährt rechts, lädt/entlädt mit sichtbarer Ladung; findet Aufgaben selbst; Stillstand mit Grund; Kauf + Tages- + Kilometerkosten                         |
| T1.5b Feste Touren                          | Tour mit Haltestellen und Aktion je Halt anlegen/ändern/löschen; Umschalten Automatik/Tour; wird gespeichert                                                        |
| T1.6 Kasse                                  | Startkapital; Buchungen mit Kategorien; Übersicht heute/Monat; schwebende +/−-Beträge                                                                               |
| T1.7 Auswahl und Infopanels                 | Klick wählt aus; Panels für Gebäude (Bestand, Kapazität, Status) und Fahrzeuge (Ladung, Status, Ziel, Route); Tooltip; live                                         |
| T1.8 Migration und Abnahme                  | M0-Spielstand lädt (v1 → v2); Speichern mitten im Warenfluss setzt exakt fort; Release v0.2.0                                                                       |

## M2–M9 (Skizze)

- **M2 Flotte & Verkehr:** mehrere Fahrzeuge, Kreuzungsreservierung, Vorfahrt, Ladezonen-Warteschlangen, Stau-Erkennung; Transporter vs. LKW; Kauf und Leasing; Wartung, Verschleiß, Pannen (Ereignis-Grundsystem); Diesel vs. Elektro; externer Verkehr mit Rushhour; Flottenübersicht.
- **M3 Produktion & Lager:** Hallen mit Innenbereichen, Zonen Wareneingang/Lager/Verpackung/Warenausgang, Lagerkapazitäten, Stufen Lagern/Verpacken/Etikettieren/Qualitätsprüfung, Gabelstapler, Förderbänder.
- **M4 Export:** Hafen und Flughafen am Rand, Fahrpläne, Verspätungsstrafen, mietbare und erweiterbare Lagerplätze.
- **M5 Aufträge & Finanzen:** Express-Aufträge, Rahmenverträge, Reputation, Kostenstellen, Kredite, Monatsbericht mit Diagrammen, Insolvenz mit Warnstufen; Campus-Erweiterung (Vorschlag).
- **M6 Personal:** Pools, Schlüsselpersonen, Schichten, Löhne, Krankheit, Zertifikate, Einstellen/Entlassen.
- **M7 Firmenpolitik & Ereignisse:** Richtlinien, Betriebsrat/Gewerkschaft/Streiks, Behörden/Genehmigungen/Lobbying, Strategie und Image, Zufallsereignisse.
- **M8 Züge, Kühl-/Gefahrgut, Produktkatalog:** Schienen und Züge, Kühl-/Gefahrgut-Zonen, -Fahrzeuge, -Zertifikate und -Aufträge, mehrstufige Ketten.
- **M9 Spielmodi & Feinschliff:** Freies Spiel, Kampagne, Szenarien, Schwierigkeitsgrade, Einführung, Balancing, Leistung, optional Sound.

## Offen

- Sicherungsdatei in der Download-Version (`file://`): Funktion ist in Chrome verfügbar (automatisch geprüft); Erhalt des Zugriffs nach Browser-Neustart manuell prüfen.
- Bestätigung offen: Drehen per Y/X (Q/E sind Zoom), F3 Leistungsanzeige, Startkapital.
- Campus-Erweiterung einem Meilenstein zuordnen (Vorschlag M5).
