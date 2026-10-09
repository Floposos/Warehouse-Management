import { migrateV1ToV2 } from './v1-to-v2';
import { migrateV2ToV3 } from './v2-to-v3';
import { migrateV3ToV4 } from './v3-to-v4';

/**
 * Migrationen: je Versionssprung eine Datei (`v1-to-v2.ts` …), hier eingetragen
 * unter der Ausgangsversion. Sie werden der Reihe nach angewendet.
 */
export type Migration = (save: Record<string, unknown>) => Record<string, unknown>;

export const migrations: Readonly<Record<number, Migration>> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
};

/** Hebt einen Spielstand Schritt für Schritt auf `target`. Fehlt ein Schritt, gibt es einen Fehler. */
export function migrateSave(
  save: Record<string, unknown>,
  target: number,
  registry: Readonly<Record<number, Migration>> = migrations,
): Record<string, unknown> {
  let current = save;
  let version = current['saveVersion'] as number;
  while (version < target) {
    const step = registry[version];
    if (!step) throw new Error(`Keine Migration von Version ${version}`);
    current = { ...step(current), saveVersion: version + 1 };
    version += 1;
  }
  return current;
}
