# Spieldesign – Logistikum

Spiel-Entscheidungen trifft Florian. Neue Entscheidungen hier mit Datum eintragen, offene Fragen unten sammeln und vor dem passenden Meilenstein stellen.

## Vision

3D-Management-Spiel im Browser. Du leitest aus der Vogelperspektive einen großen privaten Logistik-Campus, baust Hallen, Straßen, Schienen, Förderbänder und Ladezonen selbst und steuerst Warenflüsse, Flotte, Personal, Aufträge, Finanzen und Firmenpolitik. Tief, aber übersichtlich; Low-Poly statt Realismus. Insolvenz = Game Over.

## Kernprinzip Warenfluss

Rohware kommt von abstrakten Zulieferern über Eingangsstraßen (später Schiene) auf den Campus. Produkt A wird von Lieferort A nach B gebracht und dort mit Produkt B kombiniert. Die Kombi geht nach C (Verarbeitung/Lager) und dann zum Export an Hafen oder Flughafen am Campusrand (nicht dargestellt, nur Export-Punkte).

## Spielsysteme

| #   | System            | Zweck und Regeln (Kurzfassung)                                                                                                                                           | Meilenstein          |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| 1   | Bauen             | Hallen, Zonen (Wareneingang, Lager, Verpackung, Kühlung, Gefahrgut, Warenausgang), Straßen, Kreuzungen, Schienen, Förderbänder frei platzieren und ausbauen              | M1, M3, M8           |
| 2   | Produktketten     | Start mit A+B → Kombi, später mehrstufig (Lagern, Verpacken, Etikettieren, Qualitätsprüfung)                                                                             | M1, M3, M8           |
| 3   | Transport         | LKW/Transporter, Gabelstapler, Förderbänder, Züge; Aufträge mit automatischer Wegfindung, optional feste Touren                                                          | M1–M3, M8            |
| 4   | Verkehr           | Kein Fremdverkehr auf dem Campus; eigene Fahrzeuge stauen sich (Kreuzungen, Vorfahrt, Ladezonen). Externer Verkehr mit Rushhour und Störungen nur an Ein-/Ausfahrten     | M2                   |
| 5   | Export            | Hafen und Flughafen mit festen Fahrplänen; Verspätung kostet Geld/Reputation; mietbare Lagerplätze mit erweiterbarer Kapazität                                           | M4                   |
| 6   | Flotte            | Kaufen oder Leasen, Wartung und Verschleiß, Pannen, Diesel vs. Elektro, Typen mit Kapazität, Kühlung, Gefahrgut-Eignung                                                  | M2, M8               |
| 7   | Personal          | Abteilungs-Pools mit Durchschnittswerten plus Schlüsselpersonen mit Namen, Skills, Moral; Schichten, Löhne, Krankheit, Zertifikate                                       | M6                   |
| 8   | Sonderaufträge    | Express mit Deadline, Rahmenverträge, Kunden-Reputation; Kühl-/Gefahrgut-Aufträge mit passenden Fahrzeugen, Zonen, Zertifikaten                                          | M5, M8               |
| 9   | Finanzen          | Einnahmen/Ausgaben, Kostenstellen, Kredite, Monatsbericht mit Diagrammen, Insolvenz mit Warnstufen                                                                       | M1 (Kasse), M5       |
| 10  | Firmenpolitik     | Richtlinien mit messbaren Effekten, Betriebsrat/Gewerkschaft/Streiks, Behörden und Genehmigungen, Lobbying, Unternehmensstrategie                                        | M7                   |
| 11  | Zufallsereignisse | Wetter, Personal, Markt, Unfälle und Pannen                                                                                                                              | M2 (Grundsystem), M7 |
| 12  | Zeit              | Echtzeit mit Pause und 1x/2x/4x                                                                                                                                          | M0                   |
| 13  | Spielmodi         | Freies Spiel, Kampagne, Szenarien                                                                                                                                        | M9                   |
| 14  | Speichern         | Beliebig viele benannte Spielstände, Export/Import, Autosave (Chrome/Edge: Sicherungsdatei; sonst IndexedDB mit Backups und Export-Erinnerung), versionierte Spielstände | M0                   |

## Entscheidungen

| Datum      | Thema                       | Entscheidung                                                                                                                                                           |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 07.10.2026 | Titel                       | **Logistikum**                                                                                                                                                         |
| 07.10.2026 | Zeitmaßstab                 | 1 Spieltag = 5 Minuten bei 1x (Monat ≈ 2,5 h bei 1x, ≈ 37 min bei 4x)                                                                                                  |
| 07.10.2026 | Startgelände                | 128 × 128 Felder, später erweiterbar (1 Feld = Straßenbreite)                                                                                                          |
| 07.10.2026 | Startkapital                | Großzügig (Betrag beim Balancing in `config/`)                                                                                                                         |
| 07.10.2026 | Kamera                      | Aufbauspiel-Stil: rechte Taste drehen/neigen, mittlere verschieben, Rad zoomen, WASD verschieben, Q/E drehen, plus Rand-Scrollen. Linke Taste frei für Bauen/Auswählen |
| 07.10.2026 | Hauptmenü                   | Lebender Campus: Kamera kreist über Beispiel-Campus, Menü links                                                                                                        |
| 07.10.2026 | Bauleiste                   | Unten mittig mit Reitern (Straßen, Zonen/Gebäude, Fahrzeuge, Abriss)                                                                                                   |
| 07.10.2026 | Farbstil                    | Hell & freundlich: Pastell, weiche Schatten, kräftige Akzentfarben für Produkte/Fahrzeuge                                                                              |
| 07.10.2026 | Autosave                    | Alle 5 Minuten Echtzeit, in Einstellungen änderbar                                                                                                                     |
| 07.10.2026 | Speicherplätze              | Beliebig viele mit eigenem Namen (Liste mit Datum, Spielzeit, Kontostand)                                                                                              |
| 07.10.2026 | Export-Erinnerung (Firefox) | Dezenter Hinweis alle 30 Minuten Spielzeit mit Knopf „Jetzt exportieren“                                                                                               |
| 07.10.2026 | Startdatum                  | 1. Januar 2000                                                                                                                                                         |
| 07.10.2026 | Straßenbau                  | Ziehen von Start nach Ziel, gerade oder L-Form, Kosten vorab angezeigt                                                                                                 |
| 07.10.2026 | Lieferorte A/B/C            | Frei aufziehbare Zonen, Größe bestimmt Kapazität                                                                                                                       |
| 07.10.2026 | Abriss                      | 100 % Erstattung am selben Spieltag, danach 50 %                                                                                                                       |
| 07.10.2026 | Rohware                     | Daueraufträge (täglich/wöchentlich/monatlich, bei Erstellung wählbar) plus Einzelbestellungen; Preis je Ware unterschiedlich                                           |
| 07.10.2026 | LKW-Steuerung M1            | Automatik als Standard plus optionale feste Tour                                                                                                                       |
| 07.10.2026 | LKW-Kosten                  | Kaufpreis + feste Tageskosten + Kilometerkosten                                                                                                                        |
| 07.10.2026 | Exportpreis M1              | Fester Preis je Ware                                                                                                                                                   |
| 07.10.2026 | Warendarstellung            | Farbige Kisten auf der Ladefläche + Bestandssymbole an Gebäuden                                                                                                        |
| 07.10.2026 | Kamera-Tasten               | Q/E zoomen (E hinein, Q heraus), R/F neigen; Drehen vorläufig auf Y/X (ANNAHME, wird bestätigt)                                                                        |
| 07.10.2026 | Meilenstein-Reihenfolge     | Aufträge & Finanzen (M5) vor Personal (M6); Insolvenz zu den Finanzen; Kühl-/Gefahrgut-Aufträge nach M8; Ereignis-Grundsystem in M2 (siehe ROADMAP.md)                 |

## Offene Designfragen

Werden vor dem jeweiligen Meilenstein als Auswahlfragen gestellt.

**Vor M1**

- Zonen: Mindestgröße, Kosten je Feld, Zufahrtsregel (wo muss die Straße angrenzen?)
- Feste Touren: Bedienung (Haltestellen anlegen, Aktion je Halt, Umschalten Automatik/Tour)
- Konkrete Startkapital-, Bau-, Waren- und Fahrzeugpreise (Balancing-Richtung)

**M2 Flotte & Verkehr**

- Maximale Fahrzeuganzahl (Leistungsgrenze)?
- Einbahnstraßen, Ampeln oder nur Vorfahrt?
- Wie wird Wartung ausgelöst (automatisch, Werkstatt-Gebäude)? Wie stark bestrafen Pannen?
- Elektro: Ladesäulen bauen?
- Wie stark wirken Rushhour und Störungen an den Ein-/Ausfahrten?

**M3 Produktion & Lager**

- Wie genau funktioniert Kombinieren A+B (Dauer, Personalbedarf, Zwischenlager)?
- Sieht man das Innere der Hallen (Dach ausblenden)?
- Gabelstapler einzeln sichtbar oder abstrakt als Hallenleistung?
- Förderbänder: Raster, Höhenstufen?
- Lagerverwaltung: Regalplätze oder Gesamtkapazität?

**M4 Export**

- Wie streng sind Fahrpläne (Toleranz, Strafen)? Gehen nicht abgeholte Waren verloren?
- Wie teuer sind Mietlager und Erweiterung?
- Unterschied Hafen/Flughafen (Menge vs. Tempo, Preise)?

**M5 Aufträge & Finanzen**

- Woher kommen Aufträge (Auftragsbörse, Kundenanfragen)?
- Insolvenz: wie viele Warnstufen, gibt es eine Rettungsoption?
- Kreditbedingungen? Welche Diagramme im Monatsbericht?
- Campus-Erweiterung: Grundstücke zukaufen (Vorschlag: in M5)? Preise, Größe der Erweiterungen?

**M6 Personal**

- Wirkt Personalmangel als langsamere Arbeit oder als Stillstand?
- Wie viele Schlüsselpersonen? Schichtplanung über Vorlagen oder frei?
- Wie erwirbt man Zertifikate (Schulung, Dauer, Kosten)?

**M7 Firmenpolitik & Ereignisse**

- Welche Kennzahlen (Moral, Image, Produktivität, Sicherheit) gibt es und wie hängen sie zusammen?
- Wie laufen Verhandlungen mit Betriebsrat/Gewerkschaft ab (Dialog mit Angeboten, Kartenmechanik)?
- Wie wirken Behörden, Auflagen und Genehmigungen beim Ausbau?
- Wie häufig und hart sind Ereignisse, lassen sie sich abschalten?

**M8 Züge, Kühl-/Gefahrgut, Produktkatalog**

- Wie werden externe Zulieferer per Zug dargestellt?
- Signale und Blockabschnitte oder einfache Gleise?
- Was passiert bei unterbrochener Kühlkette?
- Wie viele Produkte und Ketten insgesamt?

**M9 Spielmodi**

- Wie viele Kampagnen-Missionen, welche Ziele? Szenarien?
- Tutorial ja/nein? Sound und Musik ja/nein?
