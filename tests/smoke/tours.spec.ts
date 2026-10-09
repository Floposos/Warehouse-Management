import { expect, test, type Page } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

interface TestApp {
  session: {
    command(c: unknown): { ok: boolean };
    state: {
      zones: { id: number }[];
      vehicles: { id: number; tourId?: number | null }[];
      tours: { id: number; name: string; color: number; stops: unknown[] }[];
    };
  };
  selection: { select(s: { kind: string; id: number } | null): void };
}

async function setup(page: Page): Promise<{ a: number; b: number; truck: number }> {
  return page.evaluate(() => {
    const s = (window as unknown as { __logistikum: TestApp }).__logistikum.session;
    s.command({ type: 'build/demolish', buildingId: 1 });
    s.command({ type: 'road/build', fromX: 0, fromZ: 61, toX: 16, toZ: 61, xFirst: true });
    s.command({ type: 'zone/place', kind: 'A', fromX: 4, fromZ: 62, toX: 7, toZ: 64 });
    s.command({ type: 'zone/place', kind: 'B', fromX: 12, fromZ: 62, toX: 15, toZ: 64 });
    s.command({ type: 'vehicle/buyTruck' });
    const [a, b] = s.state.zones;
    return { a: a?.id ?? -1, b: b?.id ?? -1, truck: s.state.vehicles.at(-1)?.id ?? -1 };
  });
}

function state(page: Page): Promise<TestApp['session']['state']> {
  return page.evaluate(() => {
    const s = (window as unknown as { __logistikum: TestApp }).__logistikum.session.state;
    return JSON.parse(JSON.stringify({ zones: s.zones, vehicles: s.vehicles, tours: s.tours }));
  });
}

test('Tour im Fenster „Touren“ anlegen, färben und einem LKW zuweisen', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  const { a, b, truck } = await setup(page);
  await page.getByRole('button', { name: 'Touren', exact: true }).click();
  const tours = page.getByTestId('tours-panel');
  await expect(tours).toContainText('Noch keine Touren');
  await tours.getByRole('button', { name: 'Neue Tour' }).click();
  await tours.getByLabel('Halt hinzufügen').selectOption(String(a));
  await tours.getByRole('button', { name: 'Halt hinzufügen' }).click();
  await tours.getByLabel('Halt hinzufügen').selectOption(String(b));
  await tours.getByRole('button', { name: 'Halt hinzufügen' }).click();
  await expect(tours.getByTestId('tour-list').locator('li')).toHaveCount(2);
  await tours.getByRole('button', { name: 'Blau', exact: true }).click();
  await tours.getByLabel('Name').fill('Frühschicht');
  await tours.getByLabel('Name').press('Enter');
  await expect(tours.locator('.tours-item')).toContainText('Frühschicht');

  await page.evaluate(
    (id) =>
      (window as unknown as { __logistikum: TestApp }).__logistikum.selection.select({
        kind: 'vehicle',
        id,
      }),
    truck,
  );
  const info = page.getByTestId('info-panel');
  await expect(info.getByTestId('truck-tour')).toHaveValue('');
  await info.getByTestId('truck-tour').selectOption({ label: 'Frühschicht' });
  await page.getByRole('button', { name: 'Alle Wege' }).click();
  const s = await state(page);
  const tour = s.tours[0];
  expect(tour).toMatchObject({
    name: 'Frühschicht',
    color: 1,
    stops: [
      { siteId: a, action: 'load', product: 'rawA' },
      { siteId: b, action: 'unload', product: 'rawA' },
    ],
  });
  expect(s.vehicles.find((v) => v.id === truck)?.tourId).toBe(tour?.id);
  await page.screenshot({ path: 'test-results/tours.png' });
  await tours.getByRole('button', { name: 'Tour löschen' }).click();
  await page.getByRole('button', { name: 'Löschen', exact: true }).click();
  await expect(tours).toContainText('Noch keine Touren');
  expect((await state(page)).vehicles.find((v) => v.id === truck)?.tourId).toBeNull();
  expect(problems).toEqual([]);
});
