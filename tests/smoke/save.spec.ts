import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectProblems, startNewGame } from './helpers';

async function openPauseItem(page: Page, item: string): Promise<void> {
  await page.keyboard.press('Escape');
  await page
    .getByRole('dialog', { name: 'Spiel pausiert' })
    .getByRole('button', { name: item })
    .click();
}

async function saveAs(page: Page, name: string): Promise<void> {
  await openPauseItem(page, 'Speichern');
  await page.getByLabel('Name des Spielstands').fill(name);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Gespeichert' })).toBeVisible();
}

test('In Slot speichern, neues Spiel, Slot laden: Uhrzeit stimmt', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Digit3');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');
  const savedClock = await page.getByTestId('clock').textContent();
  await saveAs(page, 'Test A');

  await openPauseItem(page, 'Hauptmenü');
  await page.getByRole('button', { name: 'Zum Hauptmenü' }).click();
  await startNewGame(page);
  await page.keyboard.press('Space');

  await openPauseItem(page, 'Laden');
  await page.getByRole('button', { name: 'Laden: Test A' }).click();
  await page
    .getByRole('dialog', { name: 'Spielstand laden?' })
    .getByRole('button', { name: 'Laden' })
    .click();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('clock')).toHaveText(savedClock ?? '');
  expect(problems).toEqual([]);
});

test('Exportieren und Importieren', async ({ page }) => {
  await page.goto('/');
  await startNewGame(page);
  await page.keyboard.press('Space');
  const clock = await page.getByTestId('clock').textContent();
  await openPauseItem(page, 'Speichern');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Als Datei exportieren' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^logistikum-.*\.json$/);
  const text = readFileSync((await download.path()) ?? '', 'utf8');
  expect(JSON.parse(text)).toMatchObject({ format: 'logistikum-save', saveVersion: 1 });
  await page.getByRole('button', { name: 'Schließen' }).click();

  await page.reload();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Laden' }).click();
  await page.getByRole('button', { name: 'Datei importieren …' }).click();
  await (
    await chooser
  ).setFiles({ name: 'stand.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await page.keyboard.press('Space');
  await expect(page.getByTestId('clock')).toHaveText(clock ?? '');
});

test('Kaputte Datei gibt eine Meldung statt eines Absturzes', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Laden' }).click();
  await page.getByRole('button', { name: 'Datei importieren …' }).click();
  await (
    await chooser
  ).setFiles({
    name: 'x.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"logistikum-save","saveVersion":99}'),
  });
  await expect(
    page.getByRole('dialog', { name: 'Spielstand kann nicht geladen werden' }),
  ).toContainText('neueren Spielversion');
  expect(problems).toEqual([]);
});

test('Autosave legt Sicherungen an und zeigt „Automatisch gespeichert“', async ({ page }) => {
  await page.goto('/');
  await startNewGame(page);
  await page.waitForTimeout(300);
  await page.evaluate(() =>
    (
      window as unknown as { __logistikum: { saves: { autosave(): Promise<void> } } }
    ).__logistikum.saves.autosave(),
  );
  await expect(
    page.getByTestId('toast').filter({ hasText: 'Automatisch gespeichert' }),
  ).toBeVisible();
  await openPauseItem(page, 'Laden');
  await expect(page.getByRole('button', { name: 'Laden: Automatische Sicherung' })).toHaveCount(1);
});

test('Kamera: E zoomt hinein, Q heraus', async ({ page }) => {
  await page.goto('/');
  await startNewGame(page);
  const distance = () =>
    page.evaluate(
      () =>
        (window as unknown as { __logistikum: { cameraRig: { distance: number } } }).__logistikum
          .cameraRig.distance,
    );
  const start = await distance();
  await page.keyboard.down('KeyE');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyE');
  const closer = await distance();
  expect(closer).toBeLessThan(start);
  await page.keyboard.down('KeyQ');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyQ');
  expect(await distance()).toBeGreaterThan(closer);
});
