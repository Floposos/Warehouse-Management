import { describe, expect, it } from 'vitest';
import { BUILD_INFO, formatBuildLabel } from './buildInfo';

describe('formatBuildLabel', () => {
  it('setzt Version, Datum und Commit zusammen', () => {
    const label = formatBuildLabel({
      version: '0.1.0',
      date: '2026-11-12T10:00:00Z',
      commit: 'a1b2c3d',
    });
    expect(label).toBe('v0.1.0 · 12.11.2026 · a1b2c3d');
  });

  it('erhält die Werte vom Build', () => {
    expect(BUILD_INFO.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(Number.isNaN(Date.parse(BUILD_INFO.date))).toBe(false);
    expect(BUILD_INFO.commit.length).toBeGreaterThan(0);
  });
});
