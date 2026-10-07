import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** Kurz-Commit: in GitHub Actions aus GITHUB_SHA, lokal aus git, sonst „lokal“. */
function shortCommit(): string {
  const sha = process.env['GITHUB_SHA'];
  if (sha) return sha.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'lokal';
  }
}

export default defineConfig({
  // Relative Pfade: läuft unter /Warehouse-Management/ auf GitHub Pages und per file://.
  base: './',
  plugins: [viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_COMMIT__: JSON.stringify(shortCommit()),
  },
  build: {
    target: 'es2022',
    // Three.js ist groß; in einer Einzeldatei ist das erwartet.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['tests/smoke/**', 'node_modules/**'],
    environment: 'node',
  },
});
