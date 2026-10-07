import { expect, test } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

test('Zeit läuft, Pause hält sie an, Esc öffnet das Menü', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await expect(page.getByTestId('balance')).toHaveText('1.000.000 €');

  const clock = page.getByTestId('clock');
  await page.keyboard.press('Digit3');
  await expect(clock).not.toHaveText('Sa, 01.01.2000 · 00:00');

  await page.keyboard.press('Space');
  await expect(page.getByText('PAUSE')).toBeVisible();
  const frozen = await clock.textContent();
  await page.waitForTimeout(800);
  await expect(clock).toHaveText(frozen ?? '');

  await page.keyboard.press('Space');
  await expect(page.getByText('PAUSE')).toBeHidden();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Spiel pausiert' })).toBeVisible();
  await expect(page.getByText('PAUSE')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('PAUSE')).toBeHidden();
  expect(problems).toEqual([]);
});

test('Einstellungen bleiben nach Neuladen erhalten', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await page.getByLabel('Autosave-Intervall').selectOption('10');
  await page.getByRole('button', { name: 'Schließen' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await expect(page.getByLabel('Autosave-Intervall')).toHaveValue('10');
});
