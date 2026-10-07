import { expect, test } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

test('Bauen und Abreißen über die Bauleiste (auch in der Pause)', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const balance = page.getByTestId('balance');
  const tip = page.getByTestId('cursor-tip');
  const bar = page.getByTestId('build-bar');
  const size = page.viewportSize() ?? { width: 1280, height: 720 };
  const center = { x: size.width / 2, y: size.height / 2 };

  await bar.getByRole('button', { name: 'Zonen/Gebäude' }).click();
  await bar.getByRole('button', { name: /Testhalle/ }).click();
  await page.mouse.move(center.x, center.y);
  await expect(tip).toContainText('Kosten: 50.000 €');
  await page.mouse.click(center.x, center.y);
  await expect(balance).toHaveText('1.950.000 €');
  // Gleiche Stelle ist jetzt belegt.
  await page.mouse.move(center.x + 1, center.y);
  await expect(tip).toContainText('Fläche ist belegt');

  // Esc bricht das Werkzeug ab, ohne das Menü zu öffnen.
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await bar.getByRole('button', { name: 'Abriss' }).click();
  await page.mouse.move(center.x, center.y);
  await expect(tip).toContainText('Erstattung: 50.000 €');
  await page.mouse.click(center.x, center.y);
  await expect(balance).toHaveText('2.000.000 €');
  await expect(tip).toContainText('Hier steht nichts zum Abreißen');

  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Spiel pausiert' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('Straße ziehen und ein Feld abreißen', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const balance = page.getByTestId('balance');
  const tip = page.getByTestId('cursor-tip');
  const bar = page.getByTestId('build-bar');
  const size = page.viewportSize() ?? { width: 1280, height: 720 };
  const start = { x: size.width / 2, y: size.height / 2 + 60 };

  await bar.getByRole('button', { name: 'Straßen' }).click();
  await bar.getByRole('button', { name: /je Feld/ }).click();
  await page.mouse.move(start.x, start.y);
  await expect(tip).toContainText('1 Feld · Kosten: 200 €');
  await page.mouse.down();
  await page.mouse.move(start.x + 200, start.y + 40, { steps: 5 });
  await expect(tip).toContainText(/\d+ Felder · Kosten/);
  await page.mouse.up();
  await expect(balance).not.toHaveText('2.000.000 €');

  await bar.getByRole('button', { name: 'Abriss' }).click();
  await page.mouse.move(start.x, start.y);
  await expect(tip).toContainText('Erstattung: 200 €');
  expect(problems).toEqual([]);
});

test('Kasse zeigt die Bau-Buchung, schwebender Betrag erscheint', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const bar = page.getByTestId('build-bar');
  const size = page.viewportSize() ?? { width: 1280, height: 720 };
  await bar.getByRole('button', { name: 'Zonen/Gebäude' }).click();
  await bar.getByRole('button', { name: /Testhalle/ }).click();
  await page.mouse.move(size.width / 2, size.height / 2);
  await page.mouse.click(size.width / 2, size.height / 2);
  await expect(page.getByTestId('floating-amount').first()).toHaveText('−50.000 €');
  await page.keyboard.press('Escape');

  await page.getByTestId('balance').click();
  const dialog = page.getByRole('dialog', { name: 'Kasse' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('cash-table').getByRole('row', { name: /^Bau/ })).toContainText(
    '−50.000 €',
  );
  await expect(dialog.locator('.cash-recent li')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(problems).toEqual([]);
});

test('Zone aufziehen zeigt Größe, Lager und fehlenden Anschluss', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const tip = page.getByTestId('cursor-tip');
  const bar = page.getByTestId('build-bar');
  const size = page.viewportSize() ?? { width: 1280, height: 720 };
  const start = { x: size.width / 2 + 100, y: size.height / 2 + 80 };

  await bar.getByRole('button', { name: 'Zonen/Gebäude' }).click();
  await bar.getByRole('button', { name: /Lieferort A/ }).click();
  await page.mouse.move(start.x, start.y);
  await expect(tip).toContainText('1 × 1 Felder');
  await page.mouse.down();
  await page.mouse.move(start.x + 80, start.y + 40, { steps: 4 });
  await expect(tip).toContainText(/Lager \d+ je Ware/);
  await expect(tip).toContainText('Nicht angeschlossen');
  await page.mouse.up();
  const zones = await page.evaluate(
    () =>
      (window as unknown as { __logistikum: { session: { state: { zones: unknown[] } } } })
        .__logistikum.session.state.zones.length,
  );
  expect(zones).toBe(1);
  expect(problems).toEqual([]);
});
