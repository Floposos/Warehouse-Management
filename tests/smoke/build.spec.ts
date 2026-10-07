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
  await expect(balance).toHaveText('950.000 €');
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
  await expect(balance).toHaveText('1.000.000 €');
  await expect(tip).toContainText('Hier steht nichts zum Abreißen');

  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Spiel pausiert' })).toBeVisible();
  expect(problems).toEqual([]);
});
