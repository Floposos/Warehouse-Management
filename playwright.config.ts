import { defineConfig, devices } from '@playwright/test';

/**
 * Rauchtest: prüft den fertigen Build (dist/index.html) einmal über http
 * (wie GitHub Pages) und einmal über file:// (wie der ZIP-Download).
 * Vorher `npm run build` ausführen.
 */
export default defineConfig({
  testDir: 'tests/smoke',
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
    launchOptions: {
      // Software-Rendering, damit WebGL auch ohne Grafikkarte (CI, Cloud) läuft.
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
  },
});
