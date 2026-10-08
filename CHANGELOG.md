# Changelog

Pro Version: Was ist neu, Was wurde behoben, So testest du das, Bekannte Probleme.
Versionen: M0 = 0.1.0, M1 = 0.2.0, … (siehe [ROADMAP.md](ROADMAP.md)).

## 0.3.0 – M2 Flotte & Verkehr (in Arbeit)

### Was ist neu

- Feinjustierung nach dem M1-Test (Florian, 07.10.2026). Bei Bauen, LKW-Kosten und Tempo gilt die Stufe „Mittel“, Waren- und Exportpreise bleiben unverändert.
  - Bauen: Straße 500 €/Feld (vorher 200 €), Lieferort A 250 €, B 400 €, C 400 € je Feld (vorher 100/150/150 €), Export-Ausfahrt 50.000 € (vorher 25.000 €).
  - LKW: Kauf 90.000 € (vorher 60.000 €), 400 € je Tag (vorher 200 €), 1,20 € je km (vorher 0,50 €).
  - Tempo: LKW 4 Felder/s bei 1x (vorher 5), Auf- und Abladen 3 s (vorher 2 s), C braucht ein Drittel länger je Endprodukt (3 × 3 Felder: 6 s statt 4,5 s).

- Zonen feldweise abreißen (Florian, 08.10.2026): Das Abriss-Werkzeug markiert über einer Zone nur das Feld unter dem Mauszeiger und reißt es ab (Erstattung für dieses Feld). Fällt ein Feld in der Mitte weg, zerfällt die Zone in eigenständige Zonen; der Bestand wird nach Fläche aufgeteilt, was nicht mehr ins Lager passt, geht verloren. Die ganze Zone reißt man im Infofenster mit „Ganze Zone abreißen“ (mit Rückfrage) ab.

- Touren und Wegfarben (T2.1, Florians Wunsch aus dem M1-Test): Touren sind eigene Einträge im neuen Fenster „Touren“ (Knopf oben). Dort legt man Touren an, benennt sie, wählt eine von 10 Farben, bearbeitet die Halte (wie bisher per Liste oder „Orte anklicken“) und löscht sie (ihre LKW fahren dann Automatik). Eine Tour kann von beliebig vielen LKW gefahren werden; im Infofenster des LKW wählt man unter „Fährt“ die Tour oder „Automatik“. Der Weg des gewählten Fahrzeugs erscheint in der Tourfarbe (Automatik und Zulieferer grau), „Alle Wege“ zeigt die Wege aller Fahrzeuge. Jeder eigene LKW trägt einen Farbpunkt in seiner Tourfarbe. Spielstände aus 0.2.x werden umgestellt: Jede bisherige Tour wird zu „Tour 1“, „Tour 2“ … (Spielstand-Version 4).

- Verkehr auf dem Campus (T2.2–T2.4): Fahrzeuge fahren nicht mehr durcheinander hindurch. Je Fahrspur und Feld steht höchstens ein Fahrzeug, wer hinten ist, wartet; Gegenverkehr stört nicht. In T-Stücke und Kreuzungen fährt immer nur ein Fahrzeug ein, und nur, wenn dahinter Platz ist. Wer zuerst darf: Fahrzeuge auf einer Vorfahrtsstraße vor allen anderen, sonst rechts vor links, bei Gleichstand wer am längsten wartet. Vorfahrtsstraßen markiert man unter „Straßen“ → „Vorfahrtsstraße“ (ziehen wie eine Straße, kostenlos, gelbe Markierung); „Vorfahrt entfernen“ nimmt die Markierung weg.
- Stellplätze am Tor (T2.3): Jeder Ort hat begrenzte Stellplätze (je angefangene 6 Felder Zonenfläche einer, höchstens 8; Export-Ausfahrt 3). Geladen und abgeladen wird nur auf einem Stellplatz (das Fahrzeug steht dann hinter dem Tor in der Zone), weitere Fahrzeuge warten in der Schlange auf der Straße. Das Infofenster zeigt „Stellplätze: belegt / gesamt · n warten“. Zulieferer nutzen dieselben Stellplätze. LKW ohne Aufgabe parken am Straßenrand und blockieren nicht.
- Stau (T2.4): Steht ein Fahrzeug im Verkehr, sucht es nach 6 Sekunden (bei 1x) einen Umweg und versucht es danach regelmäßig erneut. Nach 20 Sekunden zeigt es ein rotes Ausrufezeichen, und es erscheint eine Meldung. Neu ist der Knopf „Meldungen“ oben (mit Zahl der ungelesenen): Klick auf eine Meldung oder „Hinzeigen“ im Hinweis springt zum Ort und wählt das Fahrzeug aus.
- Transporter und LKW, Diesel und Elektro, Kaufen und Leasen (T2.5): Der Reiter „Fahrzeuge“ hat oben den Schalter „Kaufen“ / „Leasen“ und vier Einträge: Transporter Diesel, Transporter Elektro, LKW Diesel, LKW Elektro, jeweils mit Kaufpreis bzw. Monatsrate (Tooltip: Ladung, Tages- und Kilometerkosten). Der Transporter ist kürzer, fährt schneller (5,5 Felder/s statt 4), lädt 8 statt 20 Einheiten und kostet 45.000 € (200 € am Tag, 0,70 € je km). Elektro kostet 30 % mehr im Kauf und die Hälfte je km, sonst gleich; er trägt einen grünen Streifen auf dem Dach. Leasing: 12 Monate feste Laufzeit, Monatsrate 3 % des Kaufpreises (erste Rate sofort, dann monatlich unter „Fahrzeuge“), danach verlängert sich der Vertrag von selbst um 12 Monate (Meldung). Das Infofenster zeigt Fahrzeugtyp, Antrieb, Ladung, Besitz (Restwert bzw. Rate und Laufzeitende) und den Knopf „Verkaufen“ bzw. „Leasing zurückgeben“ mit Rückfrage. Verkaufen bringt den Restwert (80 % des Kaufpreises, je Monat 1,5 Prozentpunkte weniger, mindestens 20 %); vorzeitige Rückgabe kostet bis zu 3 Monatsraten (nur so viele, wie noch offen sind). Fahrzeuge heißen jetzt „Transporter 1“, „LKW 1“ … (je Typ nummeriert). Bestehende LKW aus älteren Spielständen werden gekaufte Diesel-LKW. ANNAHME: Transporter-Werte, Elektro-Faktoren und Leasing-Zahlen bis zum Balancing (alles in `src/config/vehicles.ts`).
- Verschleiß, Werkstatt und Pannen (T2.6): Eigene Fahrzeuge nutzen sich beim Fahren ab (0,4 Prozentpunkte je km). Unter „Zonen/Gebäude“ gibt es die Werkstatt (500 € je Feld, ein Werkstattplatz je angefangene 4 Felder). Fällt ein Fahrzeug unter 40 % Zustand, fährt es nach dem laufenden Auftrag (bei Touren nach dem laufenden Halt) zur nächsten Werkstatt, wird 2 Spielstunden gewartet (800 €) und ist danach wieder bei 100 %. Im Infofenster stehen Zustand mit „Wartung in ca. … km“, Pannen und letzte Wartung, dazu der Knopf „Zur Werkstatt“. Ohne Werkstatt gibt es keine Wartung und einmal die Meldung „braucht eine Wartung, aber es gibt keine erreichbare Werkstatt“. Je schlechter der Zustand, desto eher eine Panne (neu nie, bei 40 % etwa 1,8 % je km): Das Fahrzeug steht 3 Spielstunden mit Rauch und rotem Ausrufezeichen auf der Spur, Abschleppen kostet 1.500 €, es erscheint eine Meldung, und Fahrzeuge dahinter warten oder suchen einen Umweg. Danach fährt es mit 20 Prozentpunkten mehr Zustand weiter. Pannen sind zufällig, aber bei gleichem Spielstand immer gleich. ANNAHME: Schwelle, Dauer und Kosten wie im M2-Plan; Verschleiß, Pannenrisiko und Werkstatt-Baupreis bis zum Balancing (in `src/config/maintenance.ts` und `src/config/zones.ts`).

### So testest du das

1. „Touren“ → „Neue Tour“, Halte A (Laden) und B (Abladen) anhängen, Farbe Rot, Name „Früh“. Zwei LKW kaufen und bei beiden unter „Fährt“ „Früh“ wählen: Beide fahren A → B, Weg und Punkt sind rot. Farbe auf Grün: sofort grün. „Alle Wege“: alle Wege sichtbar, Automatik grau.
1. Eine Kreuzung bauen, an jedem Arm einen Lieferort, fünf LKW kaufen: Sie warten an der Kreuzung nacheinander und fahren ohne Überlappung durch. Eine Straße als „Vorfahrtsstraße“ markieren: Fahrzeuge darauf fahren zuerst.
1. Kleinen Lieferort A (2 × 2) mit viel Rohware und vier LKW: Nur einer lädt auf dem Stellplatz hinter dem Tor, die anderen stehen davor; im Infofenster „1 / 1 belegt · n warten“.
1. Eine Stichstraße mit einem LKW verstopfen (z. B. Tor-Zufahrt mit vielen LKW, Zone voll): Nach etwa 20 Sekunden rotes Ausrufezeichen und Meldung „Stau“; „Meldungen“ öffnen, Meldung anklicken: Kamera springt hin.
1. „Fahrzeuge“ → „Leasen“: Die vier Einträge zeigen „… / Monat“. „Transporter Elektro“ anklicken: kurzer Wagen mit grünem Dachstreifen, Kontostand sinkt um eine Rate. Anklicken: „Transporter 1“, „Transporter, Elektro, lädt 8“, „Geleast … bis <Datum>“. „Leasing zurückgeben“ → Rückfrage nennt die Strafe → bestätigen: Fahrzeug weg, Kasse zeigt die Buchung.
1. „Kaufen“ → „LKW Diesel“, im Infofenster „Gekauft · Restwert 72.000 €“; „Verkaufen“ bestätigen: Kontostand steigt um den Restwert.
1. Ein Transporter und ein LKW in der Automatik: Der Transporter ist sichtbar schneller und holt höchstens 8 Einheiten.
1. Werkstatt 2 × 2 an die Straße bauen (am Mauszeiger „1 Werkstattplatz“). Einen LKW anklicken: „Zustand 100 % · Wartung in ca. 150 km“. „Zur Werkstatt“: Er fährt hin, Status „Wird gewartet“, danach 800 € in der Kasse und „Letzte Wartung“ mit Datum. Ohne Werkstatt sagt der Knopf „Es gibt keine Werkstatt“.
1. Panne: mehrere LKW über einige Spieltage ohne Werkstatt fahren lassen. Bei einer Panne steht der LKW mit Rauch, Meldung „Panne“, Kasse −1.500 €; nach 3 Spielstunden fährt er weiter.
1. Lieferort A als 5 × 1 aufziehen. „Abriss“ über das mittlere Feld: nur dieses Feld ist markiert, Erstattung für ein Feld. Klick: zwei Zonen „A“ links und rechts.
1. Eine Zone anklicken, „Ganze Zone abreißen“, Rückfrage mit Erstattung bestätigen: Zone ist weg.

### Was wurde behoben

- Die Kilometerkosten konnten bei krummen Preisen einen Kilometerstand mit Nachkommastellen erzeugen; der Spielstand hätte dann nicht mehr gespeichert werden können. Der Rest wird jetzt ganzzahlig übertragen.

## 0.2.1 – Zonen verschmelzen (07.10.2026, Teil von 0.3.0)

### Was wurde behoben

- Rückmeldung Florian: Wird ein Lieferort direkt neben einen Lieferort derselben Art gebaut, entsteht jetzt keine zweite Zone mehr, sondern die Felder werden Teil der bestehenden Zone (auch L-Formen und mehr). Lager, Verarbeitungsgeschwindigkeit in C, Infofenster und Kisten gelten für die Gesamtfläche. Ein Feld zwischen zwei Zonen verbindet beide zu einer; ihr Bestand wird zusammengezählt. Die Zone behält Nummer und Tor-Seite der größeren bisherigen Zone. LKW-Aufträge und Tour-Halte zeigen danach auf die verbundene Zone. Am Mauszeiger steht beim Aufziehen „wird Teil der angrenzenden Zone“ und das Lager der Gesamtfläche.
- Spielstände aus 0.2.0 werden automatisch umgestellt (Spielstand-Version 3). Dort schon nebeneinander liegende Zonen bleiben getrennt, bis daneben gebaut wird.

### So testest du das

1. Lieferort A als 3 × 3 aufziehen, dann direkt rechts daneben ein einzelnes Feld Lieferort A: Am Mauszeiger steht „wird Teil der angrenzenden Zone“. Nach dem Bauen gibt es nur ein „A“; ein Klick zeigt „10 Felder“ und Lager 100.
2. Zwei Lieferorte C mit einem Feld Abstand bauen, das Feld dazwischen ebenfalls als C: eine Zone, Bestand beider bleibt.
3. Lieferort B direkt neben A: bleiben zwei Zonen (andere Art). Ein Feld nur über Eck: bleibt getrennt.
4. Einen Spielstand aus 0.2.0 laden: lädt ohne Meldung.

## 0.2.0 – M1 Bauen & erster Warenfluss (07.10.2026)

### Was ist neu

- Bau-Grundlage (T1.1): Bauleiste unten mittig mit den Reitern Straßen, Zonen/Gebäude, Fahrzeuge und Abriss. Unter „Zonen/Gebäude“ stehen Lieferorte, Export-Ausfahrt und die Testhalle. Mit gewähltem Werkzeug zeigt ein Geisterbild unter dem Mauszeiger, ob gebaut werden kann (grün) oder nicht (rot), daneben ein Hinweis mit Kosten oder Grund („Fläche ist belegt“, „Außerhalb des Geländes“, „Nicht genug Geld“). Linksklick baut, der Kontostand sinkt. „Abriss“ markiert das Gebäude unter dem Mauszeiger rot mit der Erstattung: 100 % am selben Spieltag, danach 50 %. Esc bricht das Werkzeug ab (erst ein zweites Esc öffnet das Menü). Bauen und Abreißen geht auch in der Pause.
- Straßen und Wegfindung (T1.2): Reiter „Straßen“ → „Straße“, dann klicken, ziehen, loslassen: gerade oder mit einem Knick (L-Form; der Knick folgt der längeren Richtung). Länge und Kosten stehen vorher am Mauszeiger, blockierte Felder sind rot. Vorhandene Straßenfelder werden übernommen und kosten nichts. Kurven, T-Stücke und Kreuzungen fügen sich von selbst zusammen; ein Feld am Westrand auf Höhe der Eingangsstraße ist mit ihr verbunden. Abriss entfernt einzelne Straßenfelder (gleiche Erstattungsregel). Die Wegfindung findet den kürzesten Weg und erkennt „kein Weg“.
- Kasse (T1.6): Jede Zahlung wird mit Bereich gebucht (Bau, Fahrzeuge, Betrieb, Rohware, Export-Erlös). Klick auf den Kontostand öffnet die Kasse: Kontostand, Einnahmen und Ausgaben je Bereich für heute und diesen Monat (beginnen jeden Tag bzw. Monat bei null) und die letzten Buchungen. Bauen und Abreißen zeigen den Betrag kurz schwebend an der Baustelle (rot Ausgabe, grün Einnahme).
- Lieferorte und Export-Ausfahrt (T1.3): Unter „Zonen/Gebäude“ gibt es Lieferort A, B und C. Eine Zone wird als Rechteck aufgezogen (keine Mindestgröße); am Mauszeiger stehen Größe, Lagerplatz je Ware und Kosten. Jede Zone hat ihre Farbe und ihren Buchstaben sowie eine Tor-Seite (dunkler Balken), über die später die LKW ein- und ausfahren. Das Tor zeigt beim Bauen zu einer angrenzenden Straße, sonst nach Süden; ohne Straße vor dem Tor erscheint ein rotes „!“ (nicht angeschlossen), das verschwindet, sobald eine Straße an das Tor gebaut ist. Die Export-Ausfahrt ist ein Gebäude, das am Geländerand stehen muss; ihr Tor zeigt ins Gelände. Abriss entfernt ganze Zonen samt Bestand.
- Warenzufluss und Produktkette (T1.4): Knopf „Einkauf“ oben: Rohware A oder B mit Menge einmalig oder als Dauerauftrag (täglich, wöchentlich, monatlich) bestellen; die erste Lieferung kommt sofort. Bezahlt wird beim Losschicken (Kasse: „Rohware“). Zulieferer-LKW kommen über die Eingangsstraße, fahren rechts zum Tor des passenden Lieferorts (A bzw. B, bei mehreren der mit dem meisten Platz), laden ab und fahren wieder hinaus. Bestand erscheint als farbige Kisten in der Zone. Volles Lager: Lieferung wird gekürzt bzw. wartet („Lager voll“ in der Bestellliste, Schild „voll“ an der Zone). Ohne Lieferort, ohne Straße oder ohne Geld wartet die Bestellung mit Grund. B kombiniert 1 A + 1 B zur Kombi, C verarbeitet Kombi zum Endprodukt (größere Zone = schneller). Die Export-Ausfahrt kauft Kombi und Endprodukt zum festen Preis (dorthin liefern die eigenen LKW).
- Eigene LKW (T1.5): Reiter „Fahrzeuge“ → „LKW kaufen“ (60.000 €). Der LKW (orangefarbenes Führerhaus) erscheint an der Einfahrt und sucht sich in der Automatik selbst Arbeit, dringendste zuerst: Endprodukt von C zur Export-Ausfahrt, Kombi von B nach C (ist C voll oder fehlt, direkt zum Export), Rohware A von A nach B. Er fährt erst ab 5 Einheiten los, lädt bis zu 20, reserviert Bestand und Platz (zwei LKW holen nicht dieselbe Ware), zeigt die Ladung als Kisten und fährt rechts. Fällt das Ziel weg, sucht er mit der Ladung ein neues; ohne Aufgabe, ohne Weg oder ohne Ziel wartet er mit Grund (im Infofenster). Kosten: Kaufpreis, 200 € je Tag und 0,50 € je km (1 Feld = 10 m), am Tageswechsel unter „Fahrzeuge“ gebucht.
- Feste Touren (T1.5b): Im Infofenster eines LKW zwischen „Automatik“ und „Feste Tour“ umschalten. Halte per Liste („Halt hinzufügen“) oder per Klick ins Gelände („Orte anklicken“, Esc beendet) anhängen; je Halt Laden oder Abladen und die Ware wählen (Vorschlag: was der Ort hergibt bzw. was vorher geladen wurde), mit ↑ verschieben, mit × entfernen. Der LKW fährt die Halte der Reihe nach und beginnt dann von vorn; der aktuelle Halt ist hervorgehoben. Er nimmt mit, was da ist, und wartet nicht auf volle Ladung. Unpassende Halte (z. B. an der Ausfahrt laden) werden abgelehnt. Touren werden gespeichert.
- Auswahl und Infofenster (T1.7): Linksklick (ohne Bauwerkzeug) auf Zone, Gebäude oder Fahrzeug öffnet rechts ein Infofenster, das sich laufend aktualisiert; Überfahren zeigt den Namen am Mauszeiger. Zone: Größe, Status (verarbeitet, wartet auf Ware, Ausgangslager voll), Anschluss an die Straße, Lager je Ware mit Kapazität und Knöpfe für die Tor-Seite. Export-Ausfahrt: angenommene Waren mit Preis. LKW: Status mit Grund beim Warten, Ladung, Ziel, Betriebsart, Tour; sein Fahrweg erscheint als blaues Band. Zulieferer: Status, Ladung, Ziel. Esc oder × schließt.
- Balancing-Platzhalter (07.10.2026, „großzügig“, Florian justiert nach dem M1-Test): Startkapital 2.000.000 €, Straße 200 €/Feld, Zonen A 100 €, B 150 €, C 150 € je Feld, 10 Einheiten Lager je Feld und Ware, Export-Ausfahrt 25.000 €, Testhalle 50.000 €, Rohware A 15 €, B 20 €, Export Kombi 110 €, Endprodukt 130 €. Die Tor-Seite lässt sich im Infofenster der Zone ändern.
- Spielstände aus 0.1.0 werden automatisch umgestellt (Spielstand-Version 2).

### So testest du das

1. Neues Spiel, unten „Zonen/Gebäude“ und dann „Testhalle“ klicken.
2. Mit der Maus über das Gelände fahren: grünes Geisterbild mit „Kosten: 50.000 €“; über der vorhandenen Halle oder am Rand wird es rot mit Grund.
3. Linksklick auf eine freie Stelle: Halle steht, Kontostand sinkt um 50.000 €.
4. Esc: Geisterbild verschwindet, Menü bleibt zu.
5. „Straßen“ → „Straße“: an der Eingangsstraße (Westrand) klicken und ins Gelände ziehen, unterwegs Länge und Kosten ablesen, loslassen: Straße liegt, Kontostand sinkt. Eine Abzweigung und eine Kreuzung ziehen: Markierungen passen sich an.
6. „Abriss“ klicken, über die neue Halle fahren: rote Markierung mit „Erstattung: 50.000 €“; Klick reißt ab, Kontostand steigt wieder. Nach einem Spieltag (5 Minuten bei 1x) gibt es nur noch 50 %.
7. Nach dem Bauen: über der Baustelle schwebt kurz „−50.000 €“. Kontostand oben anklicken: die Kasse zeigt unter „Bau“ die Ausgaben von heute und diesem Monat und die Buchung in der Liste; Esc schließt.
8. „Abriss“ über einem Straßenfeld: nur dieses Feld wird markiert und entfernt, die Lücke ist sauber.
9. „Zonen/Gebäude“ → „Lieferort A“: ein Rechteck aufziehen, unterwegs Größe, Lager und Kosten ablesen. Ohne Straße am Tor: rotes „!“ über der Zone. Eine Straße an den Torbalken bauen: das „!“ verschwindet.
10. „Export-Ausfahrt“ mitten im Gelände: rot „Muss am Geländerand stehen“; am Rand baubar.
11. Straße von der Einfahrt zu Lieferort A und B bauen (Tore an der Straße). „Einkauf“: Rohware A, Täglich, Bestellen; dasselbe für Rohware B. Bei 4x zuschauen: weiße LKW fahren rechts herein, laden ab, fahren hinaus; Kisten erscheinen in A und B, Kasse zeigt „Rohware“.
12. Sehr viel bestellen, bis die Zone voll ist: Schild „voll“, die Bestellung zeigt „Wartet: Lager voll“.
13. Einen Spielstand aus 0.1.0 laden: lädt ohne Meldung.
14. Aufbau aus Schritt 11 plus Lieferort C und Export-Ausfahrt am Rand, alles mit Straßen verbunden. „Fahrzeuge“ → „LKW kaufen“ zweimal: Hinweis „LKW gekauft“, Kontostand −60.000 € je LKW. Bei 4x: orange LKW holen Rohware A nach B, Kombi nach C, Endprodukt zur Ausfahrt; dort steigt der Kontostand (grüner Betrag), Kasse zeigt „Export-Erlös“. Am Tageswechsel erscheinen unter „Fahrzeuge“ die Tages- und Kilometerkosten.
15. Einen LKW anklicken: Infofenster mit Status, Ladung, Ziel; blaues Band zeigt den Weg. Eine Zone anklicken: Lager und Status; „Tor Nord“ usw. legt das Tor um (ohne Straße davor erscheint „Nicht angeschlossen“ und das „!“).
16. LKW anklicken → „Orte anklicken“ → Lieferort A und dann B im Gelände anklicken: Tour „Laden Rohware A“, „Abladen Rohware A“. „Feste Tour“ wählen: der LKW pendelt zwischen A und B. Ware oder Aktion in der Liste ändern, mit ↑ umsortieren, mit × löschen. „Automatik“ schaltet zurück.
17. Mitten im Betrieb speichern und laden: LKW, Ladungen, Touren und Bestände sind wie vorher, alles läuft weiter.

### Bekannte Probleme

- Alle Preise, Kosten, Lagergrößen und Geschwindigkeiten sind Platzhalter („großzügig“); Feinjustierung nach Florians M1-Test.
- LKW fahren durcheinander hindurch (kein Stau, keine Vorfahrt); kommt mit M2 Flotte & Verkehr.
- Ein LKW in der festen Tour wartet nicht auf volle Ladung (ANNAHME, siehe DESIGN.md).
- Abgerissene Straße unter einem stehenden LKW: er wartet mit „kein Weg“, bis wieder eine Verbindung besteht.

## 0.1.0 – M0 Grundgerüst (07.10.2026)

### Was ist neu

- Projektgerüst: TypeScript, Vite, Three.js, Vitest, ESLint, Prettier, Playwright-Rauchtest.
- Ordnerstruktur mit getrennten Schichten; Lint-Regeln verhindern Three.js- und Browser-Zugriffe in der Spiellogik und Dateien über 300 Zeilen.
- Version, Build-Datum und Kurz-Commit unten rechts im Bild.
- Automatische Prüfung bei jedem Pull Request (Lint, Typen, Tests, Build, Rauchtest über http und `file://`).
- Automatische Auslieferung von `main` auf GitHub Pages mit aktuellem ZIP unter `download/logistikum-latest.zip`; Tags `v*` erzeugen ein Release mit ZIP.
- Dokumentation: README, DESIGN, ARCHITECTURE, ROADMAP, CHANGELOG, TESTING, CLAUDE.md.
- Simulationskern (T0.3): fester Takt (10 Schritte pro Sekunde bei 1x), Spielzeit ab 1. Januar 2000 (1 Spieltag = 5 Minuten bei 1x), Tages-, Monats- und Jahreswechsel als Ereignisse, Zufall mit Seed, Befehle und Ereignis-Bus, Kontostand als Platzhalter. Noch nicht sichtbar; die Uhr erscheint mit der Kopfleiste (T0.5).
- Campus und Kamera (T0.4): Gelände 128 × 128 Felder mit Raster (jedes 8. Feld kräftiger), hellem Rand und angedeuteter Eingangsstraße an der Westseite; Test-Halle (8 × 6 Felder) rastergenau. Kamera im Aufbauspiel-Stil: rechte Maustaste ziehen = drehen und neigen, mittlere Maustaste ziehen = verschieben, Mausrad = zoomen, WASD/Pfeiltasten = verschieben, Q/E = zoomen (E hinein, Q heraus), R/F = neigen, Y/X = drehen, +/− = zoomen, Maus an den Bildschirmrand = verschieben. Leistungsanzeige mit F3.
- Hauptmenü, Kopfleiste, Zeit und Einstellungen (T0.5): Hauptmenü links über dem langsam umkreisten Campus (Neues Spiel, Laden, Einstellungen, Download-Link in der Web-Version). Kopfleiste mit Wochentag, Datum und Uhrzeit, Kontostand, Zeitsteuerung (Pause, 1x, 2x, 4x) und Menü. Tasten: Leertaste = Pause/Weiter, 1/2/3 = 1x/2x/4x, Esc = Menü (pausiert das Spiel). Einstellungen: Autosave-Intervall, Kamera-Empfindlichkeit, Rand-Scrollen; bleiben nach Neuladen erhalten.
- Speicherkern (T0.6a): versioniertes Spielstand-Format mit Migrationen, beliebig viele benannte Speicherplätze im Browser-Speicher, rotierende Autosave-Backups (3), Export/Import als Datei, Sicherungsdatei für Chrome/Edge. Fehlerhafte oder zu neue Dateien geben eine Meldung statt eines Absturzes.
- Speichern, Laden und Autosave im Spiel (T0.6b): Esc-Menü „Speichern“ (Name vergeben oder vorhandenen Spielstand mit Rückfrage überschreiben, „Als Datei exportieren“, Sicherungsdatei wählen) und „Laden“ (Liste mit Name, Spielzeit, Kontostand und Speicherdatum; Löschen mit Rückfrage; automatische Sicherungen; „Datei importieren …“). Autosave im eingestellten Intervall (Standard 5 Minuten) in 3 rotierende Sicherungen im Browser und, falls gewählt, in die Sicherungsdatei (Chrome/Edge); kurze Meldung „Automatisch gespeichert“. Ohne Sicherungsdatei (z. B. Firefox) alle 30 Minuten Spielzeit ein Hinweis mit Knopf „Jetzt exportieren“. Nach einem Browser-Neustart fragt das Spiel per Knopf nach dem Zugriff auf die Sicherungsdatei.

### So testest du das

1. Link https://floposos.github.io/Warehouse-Management/ öffnen: Hauptmenü links, dahinter kreist die Kamera über den Campus; unten rechts die Version.
2. Im Hauptmenü „Download (ZIP)“ klicken, ZIP entpacken, `index.html` doppelklicken: gleiche Ansicht, nur ohne Download-Link.
3. „Neues Spiel“: Kopfleiste zeigt „Sa, 01.01.2000“, die Uhr läuft (1 Spieltag = 5 Minuten), Kontostand 1.000.000 €.
4. Leertaste: „PAUSE“ erscheint, Uhr steht. Taste 2 bzw. 3: Uhr läuft doppelt bzw. vierfach so schnell, der aktive Knopf ist blau. Dasselbe per Klick.
5. Esc: Menü „Spiel pausiert“ öffnet sich, Spiel pausiert; nochmal Esc oder „Weiterspielen“: läuft weiter. „Hauptmenü“ fragt vorher nach.
6. Einstellungen ändern (z. B. Autosave „alle 10 Minuten“), Seite neu laden: Einstellung ist noch da.
7. Kamera: rechte Maustaste gedrückt halten und ziehen (drehen/neigen), mittlere Maustaste ziehen (verschieben), Mausrad (zoomen). Dasselbe mit WASD (verschieben), Q/E (zoomen), R/F (neigen), Y/X (drehen). Maus an den Bildschirmrand bewegen: Karte scrollt.
8. Speichern: Esc → „Speichern“ → Namen eingeben → „Speichern“, Meldung „Gespeichert“. Dann Esc → „Hauptmenü“ → „Neues Spiel“ → Esc → „Laden“ → den Spielstand laden: Datum und Uhrzeit stimmen wieder.
9. Exportieren: Esc → „Speichern“ → „Als Datei exportieren“, eine `.json`-Datei wird heruntergeladen. Seite neu laden → „Laden“ → „Datei importieren …“ → Datei wählen: der Stand ist wieder da.
10. Chrome/Edge: Esc → „Speichern“ → „Sicherungsdatei wählen …“, Ort wählen. Spiel 5 Minuten laufen lassen: Meldung „Automatisch gespeichert“, das Änderungsdatum der Datei ändert sich. Browser schließen und wieder öffnen, Spiel starten: Hinweis „Zugriff erlauben“ erscheint.
11. Firefox: 5 Minuten spielen → „Laden“ zeigt unter „Automatische Sicherungen“ einen Eintrag, der sich laden lässt. Nach 30 Minuten Spielzeit erscheint oben der Hinweis mit „Jetzt exportieren“.
12. Versuchen, unter den Boden zu neigen oder aus dem Gelände zu fahren: geht nicht. Die Halle sitzt genau auf den Rasterlinien.
13. F3 drücken: unten links erscheint die Leistungsanzeige (Bilder/s); nochmal F3 blendet sie aus.

### Bekannte Probleme

- Startkapital 1.000.000 € ist ein Platzhalter; der Betrag wird vor M1 festgelegt.
- Der Beispiel-Campus im Hauptmenü zeigt bisher nur Gelände, Eingangsstraße und Test-Halle.
- Sicherungsdatei in der Download-Version (`file://`): Chrome bietet die Funktion dort an; ob der Zugriff nach einem Browser-Neustart erhalten bleibt, ist noch manuell zu prüfen.

- Der Link funktioniert erst, wenn GitHub Pages im Repo auf „GitHub Actions“ gestellt ist (einmalig: Settings → Pages → Source „GitHub Actions“).
