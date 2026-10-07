import type { Migration } from './index';

/**
 * Version 2 → 3 (0.2.1): Zonen bestehen aus Teilen (Rechtecken), damit angrenzende Zonen
 * gleicher Art verschmelzen können. Die bisherige Zone wird zu genau einem Teil; Bautag und
 * Preis wandern in den Teil. Bereits nebeneinander liegende Zonen bleiben getrennt, bis
 * daneben gebaut wird. Bewusst als feste Werte, damit spätere Codeänderungen diese Migration
 * nicht verändern.
 */
export const migrateV2ToV3: Migration = (save) => {
  const state = save['state'] as Record<string, unknown>;
  const zones = Array.isArray(state['zones']) ? (state['zones'] as Record<string, unknown>[]) : [];
  return {
    ...save,
    state: {
      ...state,
      zones: zones.map(({ x, z, width, depth, builtTick, paidCents, ...rest }) => ({
        ...rest,
        parts: [{ x, z, width, depth, builtTick, paidCents }],
      })),
    },
  };
};
