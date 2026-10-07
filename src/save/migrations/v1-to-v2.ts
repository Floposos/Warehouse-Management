import type { Migration } from './index';

/**
 * Version 1 → 2 (M1): Gebäude merken sich Bauzeitpunkt und bezahlten Preis
 * für die Abriss-Erstattung. Bestehende Gebäude gelten als zu Spielbeginn
 * kostenlos gebaut (keine Erstattung beim Abriss). Neu: Straßennetz, Zonen, Bestellungen und Fahrzeuge (leer) und Kasse
 * mit Buchungen und Summen (leer; Zeitraum −1 gilt als abgelaufen und beginnt neu).
 * Bewusst als feste Werte, damit spätere Codeänderungen diese Migration nicht verändern.
 */
const CATEGORIES = ['build', 'vehicles', 'operations', 'rawGoods', 'exportRevenue'];
const emptyTotals = (): Record<string, unknown> => ({
  key: -1,
  incomeCents: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
  expenseCents: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
});

export const migrateV1ToV2: Migration = (save) => {
  const state = save['state'] as Record<string, unknown>;
  const buildings = Array.isArray(state['buildings']) ? state['buildings'] : [];
  const finance = state['finance'] as Record<string, unknown>;
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
      zones: [],
      orders: [],
      vehicles: [],
      finance: { ...finance, recent: [], today: emptyTotals(), month: emptyTotals() },
    },
  };
};
