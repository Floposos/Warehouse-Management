import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fileUrl = new URL('../../dist/index.html', import.meta.url).href;

/** Sammelt Konsolenfehler, -warnungen und Seitenfehler. */
function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      problems.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

async function expectGameStarted(page: Page, problems: string[]): Promise<void> {
  await expect(page).toHaveTitle('Logistikum');
  await expect(page.getByRole('heading', { name: 'Logistikum' })).toBeVisible();
  await expect(page.getByTestId('build-label')).toHaveText(
    /^v\d+\.\d+\.\d+\S* · \d{2}\.\d{2}\.\d{4} · \S+$/,
  );
  // Die Szene zeichnet: Canvas hat eine echte Größe und keinen WebGL-Fehlerhinweis.
  const size = await page.locator('#scene').evaluate((c: HTMLCanvasElement) => c.width * c.height);
  expect(size).toBeGreaterThan(0);
  await expect(page.locator('.placeholder-error')).toHaveCount(0);
  // Leistungsanzeige lässt sich mit F3 einblenden und zeigt Bilder/s.
  await page.keyboard.press('F3');
  await expect(page.getByTestId('perf-overlay')).toContainText('Bilder/s');
  await page.waitForTimeout(500);
  expect(problems).toEqual([]);
}

test('Web-Version startet ohne Fehler', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await expectGameStarted(page, problems);
  await expect(page.getByRole('link', { name: 'Download (ZIP)' })).toHaveAttribute(
    'href',
    'download/logistikum-latest.zip',
  );
});

test('Download-Version startet per Doppelklick (file://) ohne Fehler', async ({ page }) => {
  test.info().annotations.push({ type: 'Datei', description: fileURLToPath(fileUrl) });
  const problems = collectProblems(page);
  await page.goto(fileUrl);
  await expectGameStarted(page, problems);
  await expect(page.getByRole('link', { name: 'Download (ZIP)' })).toHaveCount(0);
});
