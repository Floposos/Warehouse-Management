import { expect, test } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

interface TestApp {
  session: {
    command(c: unknown): { ok: boolean };
    setSpeed(s: number): void;
    state: {
      roads: { priority: boolean }[];
      zones: { id: number; kind: string; stock: Record<string, number> }[];
      vehicles: { id: number; bayAt: number | null }[];
    };
  };
  selection: { select(s: { kind: string; id: number } | null): void };
}

test('Vorfahrtsstraße markieren und wieder entfernen', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const tip = page.getByTestId('cursor-tip');
  const bar = page.getByTestId('build-bar');
  const size = page.viewportSize() ?? { width: 1280, height: 720 };
  const start = { x: size.width / 2, y: size.height / 2 + 60 };
  const drag = async (): Promise<void> => {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 200, start.y, { steps: 5 });
    await page.mouse.up();
  };
  await bar.getByRole('button', { name: 'Straßen' }).click();
  await bar.getByRole('button', { name: /je Feld/ }).click();
  await drag();
  await bar.getByRole('button', { name: /^Vorfahrtsstraße/ }).click();
  await page.mouse.move(start.x, start.y);
  await expect(tip).toContainText('1 Feld als Vorfahrtsstraße markieren');
  await drag();
  const priority = () =>
    page.evaluate(
      () =>
        (window as unknown as { __logistikum: TestApp }).__logistikum.session.state.roads.filter(
          (r) => r.priority,
        ).length,
    );
  expect(await priority()).toBeGreaterThan(3);
  await page.screenshot({ path: 'test-results/priority.png' });
  await bar.getByRole('button', { name: /^Vorfahrt entfernen/ }).click();
  await drag();
  expect(await priority()).toBe(0);
  expect(problems).toEqual([]);
});

test('Mehrere LKW: Stellplätze und Warteschlange im Infofenster, Meldungsliste', async ({
  page,
}) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  const zoneA = await page.evaluate(() => {
    const s = (window as unknown as { __logistikum: TestApp }).__logistikum.session;
    s.command({ type: 'build/demolish', buildingId: 1 });
    s.command({ type: 'road/build', fromX: 0, fromZ: 61, toX: 24, toZ: 61, xFirst: true });
    s.command({ type: 'zone/place', kind: 'A', fromX: 4, fromZ: 62, toX: 5, toZ: 63 });
    s.command({ type: 'zone/place', kind: 'B', fromX: 14, fromZ: 62, toX: 19, toZ: 66 });
    const a = s.state.zones[0];
    if (a) a.stock['rawA'] = 40;
    for (let i = 0; i < 6; i++) s.command({ type: 'vehicle/buyTruck' });
    s.setSpeed(4);
    return a?.id ?? -1;
  });
  await page.evaluate(
    (id) =>
      (window as unknown as { __logistikum: TestApp }).__logistikum.selection.select({
        kind: 'zone',
        id,
      }),
    zoneA,
  );
  const info = page.getByTestId('info-panel');
  await expect(info).toContainText(/Stellplätze\s*\d \/ 1 belegt/);
  await expect
    .poll(
      () =>
        page.evaluate(
          (id) =>
            (
              window as unknown as { __logistikum: TestApp }
            ).__logistikum.session.state.vehicles.some((v) => v.bayAt === id),
          zoneA,
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
  await page.screenshot({ path: 'test-results/traffic.png' });
  await page.getByTestId('notices-button').click();
  await expect(page.getByTestId('notices-panel')).toBeVisible();
  expect(problems).toEqual([]);
});

test('Rushhour: Hinweis oben morgens, mittags nicht (T2.7)', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  const setHour = (h: number) =>
    page.evaluate((hour) => {
      const app = (window as unknown as { __logistikum: { session: { state: { tick: number } } } })
        .__logistikum;
      app.session.state.tick = Math.round((hour * 3000) / 24);
    }, h);
  await setHour(8);
  await expect(page.getByTestId('rush-badge')).toBeVisible();
  await expect(page.getByTestId('clock')).toContainText('08:');
  await setHour(12);
  await expect(page.getByTestId('rush-badge')).toBeHidden();
  expect(problems).toEqual([]);
});
