import type { Migration } from './index';

/**
 * Version 1 → 2 (M1): Gebäude merken sich Bauzeitpunkt und bezahlten Preis
 * für die Abriss-Erstattung. Bestehende Gebäude gelten als zu Spielbeginn
 * kostenlos gebaut (keine Erstattung beim Abriss). Neu: Straßennetz (leer).
 */
export const migrateV1ToV2: Migration = (save) => {
  const state = save['state'] as Record<string, unknown>;
  const buildings = Array.isArray(state['buildings']) ? state['buildings'] : [];
  return {
    ...save,
    state: {
      ...state,
      buildings: buildings.map((b: Record<string, unknown>) => ({
        ...b,
        builtTick: 0,
        paidCents: 0,
      })),
      roads: [],
    },
  };
};
