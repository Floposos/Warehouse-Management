import { expect, test, type Page } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

interface TestApp {
  session: {
    command(c: unknown): { ok: boolean };
    state: {
      zones: { id: number; kind: string; gate: string; stock: Record<string, number> }[];
      vehicles: { id: number }[];
    };
  };
  selection: { select(s: { kind: string; id: number } | null): void };
}

/** Aufbau per Befehl: Straße, A und B, ein LKW. */
async function setup(page: Page): Promise<{ a: number; b: number; truck: number }> {
  return page.evaluate(() => {
    const app = (window as unknown as { __logistikum: TestApp }).__logistikum;
    const s = app.session;
    s.command({ type: 'build/demolish', buildingId: 1 });
    s.command({ type: 'road/build', fromX: 0, fromZ: 61, toX: 16, toZ: 61, xFirst: true });
    s.command({ type: 'zone/place', kind: 'A', fromX: 4, fromZ: 62, toX: 7, toZ: 64 });
    s.command({ type: 'zone/place', kind: 'B', fromX: 12, fromZ: 62, toX: 15, toZ: 64 });
    s.command({ type: 'vehicle/buyTruck' });
    const [a, b] = s.state.zones;
    const truck = s.state.vehicles.at(-1);
    return { a: a?.id ?? -1, b: b?.id ?? -1, truck: truck?.id ?? -1 };
  });
}

function select(page: Page, kind: string, id: number): Promise<void> {
  return page.evaluate(
    ([k, i]) =>
      (window as unknown as { __logistikum: TestApp }).__logistikum.selection.select({
        kind: k as string,
        id: i as number,
      }),
    [kind, id],
  );
}

test('Zone auswählen: Lager, Status und Tor umschalten', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const { a } = await setup(page);
  await select(page, 'zone', a);
  const panel = page.getByTestId('info-panel');
  await expect(panel).toContainText('Lieferort A 1');
  await expect(panel).toContainText('Rohware A: 0 / 120');
  await expect(panel).toContainText('An die Straße angeschlossen');
  await panel.getByRole('button', { name: 'Tor Süd' }).click();
  await expect(panel).toContainText('Nicht angeschlossen');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Ganze Zone abreißen mit Rückfrage.
  await select(page, 'zone', a);
  await panel.getByRole('button', { name: 'Ganze Zone abreißen' }).click();
  await page
    .getByRole('dialog', { name: 'Ganze Zone abreißen' })
    .getByRole('button', { name: 'Abreißen' })
    .click();
  await expect(panel).toBeHidden();
  const zones = await page.evaluate(
    () =>
      (window as unknown as { __logistikum: TestApp }).__logistikum.session.state.zones.filter(
        (z) => z.kind === 'A',
      ).length,
  );
  expect(zones).toBe(0);
  expect(problems).toEqual([]);
});

test('Klick ins Gelände wählt aus, Überfahren zeigt den Namen', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const { a } = await setup(page);
  // Bildschirmposition der Zonenmitte (Zone A: x 4–7, z 62–64).
  const pos = await page.evaluate(() => {
    const app = (
      window as unknown as {
        __logistikum: {
          renderer: { projectToScreen(x: number, y: number, z: number): { x: number; y: number } };
        };
      }
    ).__logistikum;
    return app.renderer.projectToScreen(6, 0, 63.5);
  });
  await page.mouse.move(pos.x, pos.y);
  await expect(page.getByTestId('hover-tip')).toContainText('Lieferort A 1');
  await page.mouse.click(pos.x, pos.y);
  await expect(page.getByTestId('info-panel')).toContainText('Lieferort A 1');
  expect(a).toBeGreaterThan(0);
  expect(problems).toEqual([]);
});
