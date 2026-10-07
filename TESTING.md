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
- `tests/fixtures/saves/` bekommt ab T0.6a je Spielstand-Version einen Beispiel-Spielstand; ein Test lädt alle.
- Rauchtest in der Cloud-Umgebung: nutzt das vorinstallierte Chromium (`@playwright/test` ist deshalb exakt auf 1.56.1 festgelegt). In GitHub Actions installiert die CI Chromium selbst.
- Die CI (`.github/workflows/ci.yml`) führt alles bei jedem Pull Request aus; die Auslieferung (`deploy.yml`) startet nur, wenn alles grün ist.

## Manuelle Checkliste

Vor jeder Auslieferung in **Chrome, Edge und Firefox** durchgehen, jeweils als Link-Version und als Download-Version (ZIP entpacken, `index.html` doppelklicken). Mit jedem Meilenstein erweitern.

### Start (seit 0.1.0-dev)

- [ ] Seite lädt, Titel „Logistikum“ sichtbar, 3D-Szene mit Rasterboden und Halle wird gezeichnet.
- [ ] Unten rechts steht Version, Build-Datum und Kurz-Commit; der Commit passt zum erwarteten Stand.
- [ ] Link-Version: Knopf „Download (ZIP)“ lädt das ZIP herunter.
- [ ] Download-Version: startet per Doppelklick genauso, ohne Download-Knopf.
- [ ] Browser-Konsole (F12): keine Fehler, keine Warnungen.
- [ ] Fenstergröße ändern: Szene passt sich an, nichts verzerrt.
