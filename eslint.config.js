// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Browser-Globals, die in reiner Logik (sim, config, content, shared) verboten sind. */
const browserGlobals = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'HTMLElement',
  'fetch',
].map((name) => ({
  name,
  message: 'Reine Spiellogik darf nicht auf den Browser zugreifen (siehe ARCHITECTURE.md).',
}));

/** Erzeugt Import-Verbote für eine Schicht. */
function forbidImports(groups, message) {
  return {
    'no-restricted-imports': ['error', { patterns: [{ group: groups, message }] }],
  };
}

const pureMessage =
  'Diese Schicht ist reine Logik: kein Three.js, kein DOM, keine Darstellung/UI/Eingabe/Speicher (siehe ARCHITECTURE.md).';

export default tseslint.config(
  {
    ignores: ['dist/', 'release/', 'coverage/', 'test-results/', 'playwright-report/'],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Richtwert aus den Qualitätsregeln: eine Datei = eine Verantwortung, max. ca. 300 Zeilen.
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Simulation: nur config, content, shared.
    files: ['src/sim/**/*.ts'],
    rules: {
      ...forbidImports(
        ['three', 'three/*', '**/render/**', '**/ui/**', '**/input/**', '**/save/**', '**/app/**'],
        pureMessage,
      ),
      'no-restricted-globals': ['error', ...browserGlobals],
    },
  },
  {
    // Config, Inhalte, Hilfsfunktionen: Basis-Schichten ohne Abhängigkeiten nach oben.
    files: ['src/config/**/*.ts', 'src/content/**/*.ts', 'src/shared/**/*.ts'],
    rules: {
      ...forbidImports(
        [
          'three',
          'three/*',
          '**/sim/**',
          '**/render/**',
          '**/ui/**',
          '**/input/**',
          '**/save/**',
          '**/app/**',
        ],
        pureMessage,
      ),
      'no-restricted-globals': ['error', ...browserGlobals],
    },
  },
  {
    // Speichern: kennt den Zustand, aber keine Darstellung/UI/Eingabe.
    files: ['src/save/**/*.ts'],
    rules: forbidImports(
      ['three', 'three/*', '**/render/**', '**/ui/**', '**/input/**', '**/app/**'],
      'save/ kennt nur sim, config, content und shared (siehe ARCHITECTURE.md).',
    ),
  },
  prettier,
);
