import { expect, test, type Page } from '@playwright/test';
import { collectProblems, startNewGame } from './helpers';

const fileUrl = new URL('../../dist/index.html', import.meta.url).href;

async function expectMenuShown(page: Page, problems: string[]): Promise<void> {
  await expect(page).toHaveTitle('Logistikum');
  await expect(page.getByRole('heading', { name: 'Logistikum' })).toBeVisible();
  for (const name of ['Neues Spiel', 'Laden', 'Einstellungen']) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
  await expect(page.getByTestId('build-label')).toHaveText(
    /^v\d+\.\d+\.\d+\S* · \d{2}\.\d{2}\.\d{4} · \S+$/,
  );
  // Die Szene zeichnet: Canvas hat eine echte Größe und keinen WebGL-Fehlerhinweis.
  const size = await page.locator('#scene').evaluate((c: HTMLCanvasElement) => c.width * c.height);
  expect(size).toBeGreaterThan(0);
  await expect(page.locator('.webgl-error')).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(problems).toEqual([]);
}

test('Web-Version startet ohne Fehler', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await expectMenuShown(page, problems);
  await expect(page.getByRole('link', { name: 'Download (ZIP)' })).toHaveAttribute(
    'href',
    'download/logistikum-latest.zip',
  );
});

test('Download-Version startet per Doppelklick (file://) ohne Fehler', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto(fileUrl);
  await expectMenuShown(page, problems);
  await expect(page.getByRole('link', { name: 'Download (ZIP)' })).toHaveCount(0);
  await startNewGame(page);
  expect(problems).toEqual([]);
});

test('Leistungsanzeige lässt sich mit F3 einblenden', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('F3');
  await expect(page.getByTestId('perf-overlay')).toContainText('Bilder/s');
});
