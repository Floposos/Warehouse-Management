/**
 * Migrationen: je Versionssprung eine Datei (`v1-to-v2.ts` …), hier eingetragen
 * unter der Ausgangsversion. Sie werden der Reihe nach angewendet.
 * Version 1 ist die erste; es gibt noch keine Migration.
 */
export type Migration = (save: Record<string, unknown>) => Record<string, unknown>;

export const migrations: Readonly<Record<number, Migration>> = {};

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
