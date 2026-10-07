import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * Weist nach, dass die Lint-Regeln die Schichttrennung erzwingen (ARCHITECTURE.md).
 * Die „absichtlich falschen“ Dateien existieren nur im Speicher.
 */
const eslint = new ESLint();

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId ?? 'parse-error');
}

describe('Schichttrennung per Lint', () => {
  it('lehnt Three.js in der Simulation ab', async () => {
    const ids = await ruleIds(
      "import { Scene } from 'three';\nexport const s = Scene;\n",
      'src/sim/core/probe.ts',
    );
    expect(ids).toContain('no-restricted-imports');
  });

  it('lehnt UI-Importe in der Simulation ab', async () => {
    const ids = await ruleIds(
      "import { de } from '../../ui/texts/de';\nexport const t = de;\n",
      'src/sim/systems/probe.ts',
    );
    expect(ids).toContain('no-restricted-imports');
  });

  it('lehnt DOM-Zugriffe in der Simulation ab', async () => {
    const ids = await ruleIds('export const w = window.innerWidth;\n', 'src/sim/core/probe.ts');
    expect(ids).toContain('no-restricted-globals');
  });

  it('lehnt Simulations-Importe in shared ab', async () => {
    const ids = await ruleIds(
      "import { x } from '../sim/core/x';\nexport const y = x;\n",
      'src/shared/probe.ts',
    );
    expect(ids).toContain('no-restricted-imports');
  });

  it('erlaubt der Simulation Importe aus shared und config', async () => {
    const ids = await ruleIds(
      "import { formatDateDe } from '../../shared/format';\nexport const f = formatDateDe;\n",
      'src/sim/core/probe.ts',
    );
    expect(ids).toEqual([]);
  });

  it('erlaubt der Darstellung Three.js', async () => {
    const ids = await ruleIds(
      "import { Scene } from 'three';\nexport const s = Scene;\n",
      'src/render/scene/probe.ts',
    );
    expect(ids).toEqual([]);
  });

  it('meldet Dateien über 300 Zeilen', async () => {
    const code =
      Array.from({ length: 301 }, (_, i) => `export const v${i} = ${i};`).join('\n') + '\n';
    const ids = await ruleIds(code, 'src/shared/probe.ts');
    expect(ids).toContain('max-lines');
  });
});
