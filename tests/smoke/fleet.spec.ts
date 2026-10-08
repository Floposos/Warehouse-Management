import { expect, test } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

interface TestApp {
  session: { state: { vehicles: { id: number; kind: string; model?: string }[] } };
  selection: { select(s: { kind: string; id: number } | null): void };
}

test('Transporter leasen, ansehen und zurückgeben (T2.5)', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');

  const bar = page.getByTestId('build-bar');
  await bar.getByRole('button', { name: 'Fahrzeuge' }).click();
  await bar.getByRole('button', { name: 'Leasen' }).click();
  await expect(bar.getByTestId('buy-van-electric')).toContainText('/ Monat');
  await bar.getByTestId('buy-van-electric').click();
  await expect(
    page.getByTestId('toast').filter({ hasText: 'Transporter Elektro angeschafft' }),
  ).toBeVisible();

  const id = await page.evaluate(() => {
    const app = (window as unknown as { __logistikum: TestApp }).__logistikum;
    const van = app.session.state.vehicles.find((v) => v.model === 'van');
    if (van) app.selection.select({ kind: 'vehicle', id: van.id });
    return van?.id ?? -1;
  });
  expect(id).toBeGreaterThan(0);
  const panel = page.getByTestId('info-panel');
  await expect(panel).toContainText('Transporter 1');
  await expect(panel).toContainText('Transporter, Elektro, lädt 8');
  await expect(panel).toContainText('Geleast');

  await panel.getByTestId('truck-dispose').click();
  await page
    .getByRole('dialog', { name: 'Leasing zurückgeben' })
    .getByRole('button', { name: 'Leasing zurückgeben' })
    .click();
  await expect(panel).toBeHidden();
  const left = await page.evaluate(
    () =>
      (window as unknown as { __logistikum: TestApp }).__logistikum.session.state.vehicles.filter(
        (v) => v.kind === 'truck',
      ).length,
  );
  expect(left).toBe(0);
  expect(problems).toEqual([]);
});
