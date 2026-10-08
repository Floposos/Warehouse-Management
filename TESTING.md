# Testen

## Automatische Tests

| Befehl              | Was                                                                           | Wo                                       |
| ------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| `npm run lint`      | ESLint (inkl. Schichttrennung, max. 300 Zeilen) + Prettier                    | ganzes Repo                              |
| `npm run typecheck` | TypeScript im strengen Modus                                                  | ganzes Repo                              |
| `npm test`          | Vitest: Unit-Tests der Logik                                                  | `src/**/*.test.ts`, `tests/**/*.test.ts` |
| `npm run build`     | Einzeldatei-Build nach `dist/index.html`                                      | –                                        |
| `npm run smoke`     | Playwright-Rauchtest: Build über http **und** `file://`, keine Konsolenfehler | `tests/smoke/` (braucht vorher `build`)  |
| `npm run package`   | ZIP nach `release/logistikum.zip`                                             | –                                        |
| `npm run check`     | alles außer `package` in der CI-Reihenfolge                                   | –                                        |

- Unit-Tests liegen neben der getesteten Datei (`foo.ts` + `foo.test.ts`).
- `tests/lint/` prüft, dass die Lint-Regeln die Schichttrennung wirklich erzwingen.
- `tests/fixtures/saves/` enthält je Spielstand-Version einen Beispiel-Spielstand (`v1-beispiel.json`); `src/save/fixtures.test.ts` lädt alle und rechnet weiter.
- Rauchtest in der Cloud-Umgebung: nutzt das vorinstallierte Chromium (`@playwright/test` ist deshalb exakt auf 1.56.1 festgelegt). In GitHub Actions installiert die CI Chromium selbst.
- Die CI (`.github/workflows/ci.yml`) führt alles bei jedem Pull Request aus; die Auslieferung (`deploy.yml`) startet nur, wenn alles grün ist.

## Manuelle Checkliste

Vor jeder Auslieferung in **Chrome, Edge und Firefox** durchgehen, jeweils als Link-Version und als Download-Version (ZIP entpacken, `index.html` doppelklicken). Mit jedem Meilenstein erweitern.

### Start (seit 0.1.0-dev)

- [ ] Seite lädt, Hauptmenü links (Neues Spiel, Laden, Einstellungen), dahinter kreist die Kamera über den Campus.
- [ ] Unten rechts steht Version, Build-Datum und Kurz-Commit; der Commit passt zum erwarteten Stand.
- [ ] Link-Version: Link „Download (ZIP)“ im Hauptmenü lädt das ZIP herunter.
- [ ] Download-Version: startet per Doppelklick genauso, ohne Download-Link.
- [ ] Browser-Konsole (F12): keine Fehler, keine Warnungen.
- [ ] Fenstergröße ändern: Szene passt sich an, nichts verzerrt.

### Campus und Kamera (seit 0.1.0-dev, T0.4)

- [ ] Gelände mit Raster, hellem Rand und Eingangsstraße an der Westseite; Test-Halle sitzt genau auf Rasterlinien.
- [ ] Rechte Maustaste ziehen: dreht (links/rechts) und neigt (hoch/runter) stufenlos.
- [ ] Mittlere Maustaste ziehen: verschiebt die Karte. Mausrad: zoomt.
- [ ] WASD/Pfeile verschieben, E hinein-/Q herauszoomen, R/F neigen, Y/X drehen, +/− zoomen.
- [ ] Maus an den Bildschirmrand: Karte scrollt; über Bedienelementen nicht.
- [ ] Neigen geht nie unter den Boden, Zoom hat Grenzen, Verschieben bleibt im Gelände.
- [ ] Linke Maustaste bewegt die Kamera nicht. Rechtsklick öffnet kein Kontextmenü.
- [ ] F3 blendet die Leistungsanzeige ein und aus; Bilder/s um 60 auf einem normalen Laptop.
- [ ] Seit 0.3.0: mit 300 Fahrzeugen flüssig; Zeichenaufrufe wachsen kaum mit der Zahl der Fahrzeuge.

### Zeit, Kopfleiste, Menü, Einstellungen (seit 0.1.0-dev, T0.5)

- [ ] „Neues Spiel“: Kopfleiste zeigt „Sa, 01.01.2000 · 00:00“, Uhr läuft; 1 Spieltag dauert bei 1x 5 Minuten.
- [ ] Kontostand in Euro mit Tausenderpunkten.
- [ ] Pause per Klick und Leertaste: „PAUSE“ sichtbar, Uhr steht. Weiter setzt mit der vorherigen Stufe fort.
- [ ] 1x/2x/4x per Klick und Tasten 1/2/3; aktive Stufe hervorgehoben; 4x läuft sichtbar viermal so schnell.
- [ ] Esc öffnet „Spiel pausiert“, Spiel pausiert; Esc/„Weiterspielen“ setzt fort. Klick neben den Dialog schließt ihn.
- [ ] „Hauptmenü“ fragt nach; Abbrechen kehrt ins Spiel zurück.
- [ ] Einstellungen (aus Hauptmenü und Esc-Menü): Autosave-Intervall, Kamera-Empfindlichkeit (wirkt sofort), Rand-Scrollen an/aus; nach Neuladen noch gesetzt.
- [ ] Tasten wirken nicht, solange ein Dialog offen ist.

### Speichern, Laden, Autosave (seit 0.1.0-dev, T0.6)

- [ ] Speichern: Name vorgeschlagen („Campus TT.MM.JJJJ“), änderbar; Meldung „Gespeichert“.
- [ ] Vorhandenen Spielstand überschreiben: Rückfrage erscheint; nach Bestätigen nur ein Eintrag mit neuem Stand.
- [ ] Laden-Liste: Name, Spielzeit (Datum/Uhrzeit im Spiel), Kontostand, Speicherdatum; neueste oben.
- [ ] Laden im laufenden Spiel fragt nach; danach stimmen Datum, Uhrzeit, Kontostand.
- [ ] Löschen mit Rückfrage; Abbrechen löscht nichts.
- [ ] Export lädt `logistikum-<Name>-<Datum>.json`; Import derselben Datei stellt den Stand her (auch in der jeweils anderen Version: Link ↔ Download).
- [ ] Import einer fremden/kaputten Datei: verständliche Meldung, Spiel läuft weiter.
- [ ] Autosave nach Intervall: Meldung „Automatisch gespeichert“; höchstens 3 automatische Sicherungen in der Liste; bei Pause ohne Fortschritt kein neuer Autosave.
- [ ] Chrome/Edge: Sicherungsdatei wählen, wird beim Autosave überschrieben; nach Browser-Neustart Knopf „Zugriff erlauben“ (im Hinweis und im Speichern-Dialog). Auch in der Download-Version (`file://`) prüfen.
- [ ] Firefox: Abschnitt „Sicherungsdatei“ erklärt, dass es sie nur in Chrome/Edge gibt; nach 30 Minuten Spielzeit Hinweis „Jetzt exportieren“.

### Bauen und Abreißen (seit 0.2.0, T1.1)

- [ ] Bauleiste unten mittig mit Reitern Straßen, Zonen/Gebäude, Fahrzeuge, Abriss; aktiver Reiter blau.
- [ ] Testhalle gewählt: Geisterbild folgt der Maus rastergenau, grün auf freier Fläche, rot über Gebäuden und am Geländerand; Hinweis zeigt Kosten bzw. Grund.
- [ ] Zu wenig Geld: rot mit „Nicht genug Geld“, Klick baut nicht.
- [ ] Klick baut; Kontostand sinkt um die Kosten; Bauen geht auch in der Pause.
- [ ] Abriss: Gebäude unter der Maus rot markiert mit Erstattung; am selben Spieltag 100 %, ab dem nächsten 50 %; leere Fläche zeigt „Hier steht nichts zum Abreißen“.
- [ ] Esc beendet das Werkzeug; erst das nächste Esc öffnet das Menü. Rechte/mittlere Maustaste bewegen weiter die Kamera.
- [ ] Spielstand aus 0.1.0 lädt; gebaute Hallen bleiben nach Speichern/Laden erhalten.

### Straßen (seit 0.2.0, T1.2)

- [ ] Straße ziehen: Vorschau folgt der Maus, gerade oder mit einem Knick; Länge und Kosten am Mauszeiger; Loslassen baut.
- [ ] Durch ein Gebäude oder über den Rand: betroffene Felder rot, Loslassen baut nichts. Zu wenig Geld: ganze Strecke rot.
- [ ] Über vorhandene Straßen ziehen: vorhandene Felder kosten nichts.
- [ ] Kurven, T-Stücke, Kreuzungen sehen richtig aus; das Randfeld an der Eingangsstraße schließt nahtlos an.
- [ ] Esc während des Ziehens bricht nur das Ziehen ab; zweites Esc beendet das Werkzeug.
- [ ] Abriss eines Straßenfelds: Lücke sauber, Nachbarn passen ihre Form an.
- [ ] Viele Straßen (z. B. 20 lange Strecken): weiterhin flüssig (F3).

### Kasse (seit 0.2.0, T1.6)

- [ ] Klick auf den Kontostand öffnet die Kasse; Esc oder „Schließen“ schließt sie.
- [ ] Bauen und Abreißen erscheinen unter „Bau“ (Ausgaben bzw. Einnahmen) für heute und diesen Monat und in „Letzte Buchungen“; Summe stimmt.
- [ ] Am nächsten Spieltag ist „Heute“ wieder leer, „Diesen Monat“ nicht; am Monatswechsel beides leer.
- [ ] Bei offener Kasse und laufendem Spiel aktualisiert sie sich (z. B. nach dem Tageswechsel).
- [ ] Schwebende Beträge an der Baustelle, rot bei Ausgaben, grün bei Erstattungen; verschwinden nach gut einer Sekunde.
- [ ] Nach Speichern/Laden sind Buchungen und Summen noch da.

### Lieferorte und Export-Ausfahrt (seit 0.2.0, T1.3)

- [ ] Lieferort A, B, C aufziehen (auch 1 × 1 und in alle Richtungen gezogen); Größe, Lager je Ware und Kosten am Mauszeiger; Kosten je Art unterschiedlich.
- [ ] Zone über Straße, Gebäude, andere Zone oder den Rand: rot mit Grund.
- [ ] Jede Zone hat Farbe, Buchstabe und Torbalken; Tor zeigt zu einer angrenzenden Straße, sonst nach Süden.
- [ ] Ohne Straße vor dem Tor: rotes „!“; Straße an das Tor bauen: „!“ verschwindet; Straße abreißen: „!“ kommt wieder. Straße an einer anderen Seite hilft nicht.
- [ ] Lieferort direkt neben gleicher Art: wird Teil der Zone (Hinweis am Mauszeiger, ein Buchstabe, Gesamtlager); Zwischenfeld verbindet zwei Zonen; andere Art oder über Eck bleibt getrennt (seit 0.2.1).
- [ ] Abriss über einer Zone markiert ein Feld; Mittelfeld abreißen teilt die Zone; „Ganze Zone abreißen“ im Infofenster fragt nach (seit 0.3.0).
- [ ] Export-Ausfahrt nur am Geländerand baubar; Tor zeigt ins Gelände; ohne Straße „!“.
- [ ] Zone abreißen: ganze Zone weg, Erstattung nach Tagesregel.

### Einkauf und Warenfluss (seit 0.2.0, T1.4)

- [ ] „Einkauf“ öffnet das Fenster; Kosten je Lieferung passen zu Ware und Menge.
- [ ] Einmalige Bestellung: ein Zulieferer kommt, lädt am Tor ab, fährt hinaus; Bestellung verschwindet. Dauerauftrag bleibt mit nächstem Liefertermin.
- [ ] Zulieferer fahren rechts, biegen sauber ab, verschwinden auf der Eingangsstraße.
- [ ] Ohne Lieferort / ohne Straße / ohne Geld: Bestellung zeigt den Grund und wird später erneut versucht.
- [ ] Volles Lager: Lieferung gekürzt bzw. „Lager voll“, Schild „voll“ an der Zone.
- [ ] Straße während der Fahrt abreißen: LKW wartet; wieder bauen: fährt weiter. Zone abreißen: LKW kehrt um, Ware wird erstattet.
- [ ] B mit A und B im Lager erzeugt Kombi (Kisten in Lila); C erzeugt Endprodukt (Grün), größere C schneller.
- [ ] Speichern mit LKW unterwegs, laden: LKW fährt an derselben Stelle weiter.

### Eigene LKW (seit 0.2.0, T1.5)

- [ ] „Fahrzeuge“ → „LKW Diesel“ (Kaufen): Hinweis, Kontostand sinkt um den Kaufpreis; ohne Geld Hinweis „Nicht genug Geld“.
- [ ] Ganze Kette läuft mit 2 LKW von allein: A → B → C → Export, Kontostand steigt über einen Spieltag.
- [ ] LKW fahren rechts, Ladung als Kisten sichtbar, leer ohne Kisten.
- [ ] Unter 5 Einheiten fährt kein LKW los; zwei LKW holen nicht dieselbe Ware doppelt.
- [ ] C voll oder abgerissen: Kombi geht direkt zur Export-Ausfahrt.
- [ ] Ziel während der Fahrt abreißen: LKW sucht mit Ladung ein neues Ziel.
- [ ] Tageswechsel: Kasse zeigt unter „Fahrzeuge“ Tages- und Kilometerkosten.
- [ ] Speichern mit LKW unterwegs (beladen), laden: fährt weiter und liefert ab.

### Fahrzeugtypen, Kauf und Leasing (seit 0.3.0, T2.5)

- [ ] „Fahrzeuge“: Schalter „Kaufen“/„Leasen“ ändert die Preise der vier Einträge (Kaufpreis bzw. „/ Monat“); Tooltip nennt Ladung, Tages- und Kilometerkosten.
- [ ] Transporter ist kürzer als der LKW, Elektro hat einen grünen Dachstreifen; Transporter fährt schneller und lädt höchstens 8.
- [ ] Ohne Geld: Hinweis „Nicht genug Geld“, kein Fahrzeug.
- [ ] Infofenster: Typ, Antrieb, Ladung, Besitz (Restwert bzw. Rate und Laufzeitende).
- [ ] „Verkaufen“ und „Leasing zurückgeben“ fragen nach und nennen den Betrag; danach ist das Fahrzeug weg, Kasse zeigt die Buchung.
- [ ] Monatswechsel: Leasingrate unter „Fahrzeuge“; nach 12 Monaten Meldung „Leasing läuft weiter“.
- [ ] Spielstand aus 0.2.x laden: LKW sind gekaufte Diesel-LKW.

### Werkstatt und Pannen (seit 0.3.0, T2.6)

- [ ] „Werkstatt“ unter „Zonen/Gebäude“ aufziehen: Mauszeiger zeigt Werkstattplätze und Kosten; Infofenster zeigt „Werkstattplätze“, kein Lager.
- [ ] Infofenster eines Fahrzeugs: Zustand mit km bis zur Wartung, Pannen, letzte Wartung.
- [ ] „Zur Werkstatt“ ohne Werkstatt: Hinweis; mit Werkstatt: fährt nach dem Auftrag hin, „Wird gewartet“, danach 100 % und 800 € in der Kasse.
- [ ] Zustand unter 40 %: fährt von selbst zur Werkstatt; ohne Werkstatt einmal die Meldung „keine erreichbare Werkstatt“.
- [ ] Panne: Fahrzeug steht mit Rauch und rotem „!“, Meldung, 1.500 € Abschleppen; Fahrzeuge dahinter warten oder fahren um; nach 3 Spielstunden geht es weiter.
- [ ] Werkstatt erscheint nicht als Tour-Halt.
- [ ] Speichern während einer Panne bzw. Wartung und laden: läuft genauso weiter.

### Einfahrt und Rushhour (seit 0.3.0, T2.7)

- [ ] Bundesstraße am Ende der Eingangsstraße mit Autos in beiden Richtungen; 7–9 und 16–18 Uhr dichter.
- [ ] „Rushhour“ neben der Uhr nur zu diesen Zeiten.
- [ ] Mehrere Zulieferer gleichzeitig: Sie fädeln einzeln ein, in der Rushhour sichtbar langsamer; hinaus ebenso.
- [ ] Langer Stau vor der Einfahrt: Meldung „Stau“.
- [ ] Speichern in der Rushhour mit Schlange vor der Einfahrt, laden: geht genauso weiter.

### Flottenfenster (seit 0.3.0, T2.8)

- [ ] „Flotte“ oben öffnet links die Liste mit Anzahl im Titel; „Touren“ schließt sie und umgekehrt; Esc schließt.
- [ ] Zeilen zeigen Name, Zustand (rot unter 40 % oder bei Panne), Typ, Tour und Status und aktualisieren sich laufend.
- [ ] Filter und Sortierung wirken; Auswahl bleibt beim Umsortieren erhalten.
- [ ] Sammelaktion „Tour zuweisen …“ (auch Automatik) und „Zur Werkstatt“ (ohne Werkstatt Hinweis) für die ausgewählten.
- [ ] Klick auf einen Namen: Kamera springt hin, Infofenster öffnet sich.
- [ ] Mit vielen Fahrzeugen (z. B. 300) bleibt das Spiel flüssig, solange das Fenster offen ist.

### Auswahl und Infofenster (seit 0.2.0, T1.7)

- [ ] Ohne Bauwerkzeug: Überfahren zeigt den Namen, Klick öffnet das Infofenster; Klick ins Leere, × oder Esc schließt (Esc öffnet dabei nicht das Menü).
- [ ] Zone: Lager je Ware mit Kapazität ändert sich live; Status passt (B ohne Ware: „Wartet auf Ware“); Tor-Knöpfe legen das Tor um, Anschluss-Hinweis und „!“ passen.
- [ ] Export-Ausfahrt: zeigt Waren und Preise.
- [ ] LKW: Status mit Grund (keine Aufgabe, kein Weg, kein Ziel, Tour ohne Halte), Ladung, Ziel; blaues Band zeigt den restlichen Weg.
- [ ] Mit Bauwerkzeug wählt ein Klick nichts aus.

### Feste Touren (seit 0.2.0, T1.5b; seit 0.3.0 im Fenster „Touren“, T2.1)

- [ ] „Touren“ oben öffnet links das Fenster; „Neue Tour“ legt „Tour n“ mit eigener Farbe an.
- [ ] Halte per Liste und per „Orte anklicken“ anhängen; Vorschlag für Aktion und Ware ist sinnvoll.
- [ ] Aktion/Ware ändern, verschieben, entfernen; unpassende Halte werden mit Hinweis abgelehnt.
- [ ] Name ändern (Enter) und Farbe wählen: Liste, Weg und Farbpunkt am LKW übernehmen sie sofort.
- [ ] Im Infofenster eines LKW unter „Fährt“ die Tour wählen; zwei LKW auf derselben Tour fahren beide.
- [ ] Weg des gewählten LKW in Tourfarbe, Automatik grau; „Alle Wege“ zeigt die Wege aller Fahrzeuge.
- [ ] Zurück auf „Automatik“ mit Ladung an Bord: Ladung wird sinnvoll abgeliefert.
- [ ] „Tour löschen“ mit Rückfrage: ihre LKW fahren wieder Automatik.
- [ ] Spielstand aus 0.2.x laden: bisherige Touren erscheinen als „Tour 1“, „Tour 2“ … mit Farbe.
- [ ] Speichern und Laden: Touren, Farben und Zuweisungen bleiben erhalten.

### Verkehr (seit 0.3.0, T2.2–T2.4)

- [ ] Zwei LKW hintereinander auf einer Straße: halten Abstand, überholen nicht; Gegenverkehr fährt ungehindert.
- [ ] Kreuzung mit LKW aus mehreren Richtungen: immer nur einer in der Kreuzung, alle kommen durch.
- [ ] Ohne Markierung: rechts vor links. „Vorfahrtsstraße“ ziehen: gelbe Markierung, Fahrzeuge darauf fahren zuerst; „Vorfahrt entfernen“ nimmt sie weg.
- [ ] Kein Fahrzeug bleibt in einer Kreuzung stehen, wenn dahinter kein Platz ist.
- [ ] Kleine Zone, viele LKW: nur so viele laden wie Stellplätze, die anderen warten davor; Infofenster zeigt belegt/gesamt und wartende.
- [ ] Fahrzeuge auf Stellplätzen stehen hinter dem Tor in der Zone; LKW ohne Aufgabe parken am Rand.
- [ ] Stau: nach kurzer Zeit Umweg (wenn es einen gibt); sonst rotes Ausrufezeichen und Meldung; Meldung anklicken springt hin.
- [ ] Speichern mitten im Stau und laden: läuft genauso weiter.
