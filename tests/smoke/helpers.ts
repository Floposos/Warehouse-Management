import { expect, type Page } from '@playwright/test';

/** Sammelt Konsolenfehler, -warnungen und Seitenfehler. */
export function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      problems.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

/** Klickt „Neues Spiel“ und wartet auf die laufende Uhr in der Kopfleiste. */
export async function startNewGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Neues Spiel' }).click();
  await expect(page.getByTestId('clock')).toHaveText(/^Sa, 01\.01\.2000 · \d\d:\d\d$/);
}
