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

test('Werkstatt bauen, Fahrzeug zur Wartung schicken (T2.6)', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const bar = page.getByTestId('build-bar');
  await bar.getByRole('button', { name: 'Zonen/Gebäude' }).click();
  await expect(bar.getByRole('button', { name: /Werkstatt/ })).toBeVisible();

  const id = await page.evaluate(() => {
    const app = (window as unknown as { __logistikum: TestApp }).__logistikum;
    const s = app.session as unknown as { command(c: unknown): { ok: boolean; id?: number } };
    s.command({ type: 'build/demolish', buildingId: 1 });
    s.command({ type: 'road/build', fromX: 0, fromZ: 61, toX: 16, toZ: 61, xFirst: true });
    const truck = s.command({ type: 'vehicle/buy', model: 'truck', drive: 'diesel', lease: false });
    app.selection.select({ kind: 'vehicle', id: truck.id ?? -1 });
    return truck.id ?? -1;
  });
  const panel = page.getByTestId('info-panel');
  await expect(panel).toContainText('100 % · Wartung in ca. 150 km');
  await expect(panel).toContainText('Pannen');
  await panel.getByTestId('truck-service').click();
  await expect(panel).toContainText('Es gibt keine Werkstatt');

  await page.evaluate(() => {
    const app = (window as unknown as { __logistikum: TestApp }).__logistikum;
    const s = app.session as unknown as { command(c: unknown): { ok: boolean } };
    s.command({ type: 'zone/place', kind: 'W', fromX: 8, fromZ: 62, toX: 9, toZ: 63 });
  });
  await panel.getByTestId('truck-service').click();
  await expect(panel).toContainText('Fährt nach dem laufenden Auftrag zur Werkstatt.');
  await page.keyboard.press('Space'); // Pause aufheben
  await expect(panel).toContainText(/Fährt zur Werkstatt|Wird gewartet/, { timeout: 15_000 });
  await expect(panel).toContainText('Werkstatt 1');
  expect(id).toBeGreaterThan(0);
  expect(problems).toEqual([]);
});

test('Flottenfenster: filtern, zeigen, Sammelaktion Tour zuweisen (T2.8)', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  await page.evaluate(() => {
    const app = (window as unknown as { __logistikum: TestApp }).__logistikum;
    const s = app.session as unknown as { command(c: unknown): { ok: boolean } };
    s.command({ type: 'vehicle/buy', model: 'truck', drive: 'diesel', lease: false });
    s.command({ type: 'vehicle/buy', model: 'van', drive: 'diesel', lease: false });
    s.command({ type: 'vehicle/buy', model: 'van', drive: 'electric', lease: true });
    s.command({ type: 'tour/create', name: 'Früh' });
  });
  await page.getByRole('button', { name: 'Flotte', exact: true }).click();
  const panel = page.getByTestId('fleet-panel');
  await expect(panel).toContainText('Flotte (3)');
  await expect(panel.getByTestId('fleet-row')).toHaveCount(3);
  await panel.getByLabel('Zeigen').selectOption('van');
  await expect(panel.getByTestId('fleet-row')).toHaveCount(2);
  await panel.getByLabel('Alle auswählen').check();
  await expect(panel).toContainText('2 ausgewählt');
  await panel.getByTestId('fleet-tour').selectOption({ label: 'Früh' });
  await expect(panel).toContainText('Für 2 Fahrzeuge erledigt.');
  await expect(panel.getByTestId('fleet-row').first()).toContainText('Früh');
  await panel.getByRole('button', { name: 'Transporter 2' }).click();
  await expect(page.getByTestId('info-panel')).toContainText('Transporter 2');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  expect(problems).toEqual([]);
});
