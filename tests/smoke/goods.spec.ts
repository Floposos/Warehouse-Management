import { expect, test } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

interface TestApp {
  session: {
    command(c: unknown): { ok: boolean };
    state: { zones: { kind: string; stock: Record<string, number> }[]; vehicles: unknown[] };
  };
}

test('Rohware bestellen: Zulieferer bringt sie nach Lieferort A', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  const built = await page.evaluate(() => {
    const s = (window as unknown as { __logistikum: TestApp }).__logistikum.session;
    return [
      s.command({ type: 'road/build', fromX: 0, fromZ: 61, toX: 8, toZ: 61, xFirst: true }),
      s.command({ type: 'zone/place', kind: 'A', fromX: 4, fromZ: 62, toX: 7, toZ: 64 }),
    ].every((r) => r.ok);
  });
  expect(built).toBe(true);

  await page.getByRole('button', { name: 'Einkauf' }).click();
  const dialog = page.getByRole('dialog', { name: 'Einkauf' });
  await dialog.getByLabel('Ware', { exact: true }).selectOption('rawA');
  await dialog.getByLabel('Lieferung', { exact: true }).selectOption('daily');
  await dialog.getByRole('button', { name: 'Bestellen' }).click();
  await expect(dialog.getByTestId('order-list')).toContainText(
    'Rohware A · 20 Einheiten · Täglich',
  );
  await page.keyboard.press('Escape');
  await page.keyboard.press('Digit3');

  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as unknown as { __logistikum: TestApp }).__logistikum.session.state.zones[0]
              ?.stock['rawA'] ?? 0,
        ),
      { timeout: 20_000 },
    )
    .toBe(20);
  expect(problems).toEqual([]);
});

test('LKW kaufen: bringt Rohware A von A nach B', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Digit3');
  const built = await page.evaluate(() => {
    const s = (window as unknown as { __logistikum: TestApp }).__logistikum.session;
    const ok = [
      s.command({ type: 'build/demolish', buildingId: 1 }),
      s.command({ type: 'road/build', fromX: 0, fromZ: 61, toX: 16, toZ: 61, xFirst: true }),
      s.command({ type: 'zone/place', kind: 'A', fromX: 4, fromZ: 62, toX: 7, toZ: 64 }),
      s.command({ type: 'zone/place', kind: 'B', fromX: 12, fromZ: 62, toX: 15, toZ: 64 }),
    ].every((r) => r.ok);
    const a = s.state.zones.find((z) => z.kind === 'A');
    if (a) a.stock['rawA'] = 20;
    return ok;
  });
  expect(built).toBe(true);

  const bar = page.getByTestId('build-bar');
  await bar.getByRole('button', { name: 'Fahrzeuge' }).click();
  await bar.getByTestId('buy-truck-diesel').click();
  await expect(
    page.getByTestId('toast').filter({ hasText: 'LKW Diesel angeschafft' }),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as unknown as { __logistikum: TestApp }).__logistikum.session.state.zones.find(
              (z) => z.kind === 'B',
            )?.stock['rawA'] ?? 0,
        ),
      { timeout: 20_000 },
    )
    .toBe(20);
  expect(problems).toEqual([]);
});
