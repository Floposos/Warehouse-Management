import type { Migration } from './index';

type Obj = Record<string, unknown>;

/**
 * Version 3 → 4 (M2, 0.3.0). Bewusst mit festen Werten, damit spätere Codeänderungen diese
 * Migration nicht verändern.
 * - Touren werden eigene Einträge (T2.1): Jede bisherige Tour eines LKW (Betrieb „Tour“ oder
 *   mit Halten) wird zur Tour „Tour n“ mit Farbe n − 1; der LKW verweist per `tourId` darauf
 *   (nur im Betrieb „Tour“, sonst Automatik).
 */
export const migrateV3ToV4: Migration = (save) => {
  const state = save['state'] as Obj;
  let nextId = state['nextId'] as number;
  const tours: Obj[] = [];
  const vehicles = (Array.isArray(state['vehicles']) ? (state['vehicles'] as Obj[]) : []).map(
    (v) => {
      if (v['kind'] !== 'truck') return v;
      const { mode, tour, ...rest } = v;
      const stops = Array.isArray(tour) ? tour : [];
      let tourId: number | null = null;
      if (mode === 'tour' || stops.length > 0) {
        const id = nextId++;
        tours.push({ id, name: `Tour ${tours.length + 1}`, color: tours.length % 10, stops });
        if (mode === 'tour') tourId = id;
      }
      return { ...rest, tourId };
    },
  );
  return { ...save, state: { ...state, nextId, vehicles, tours } };
};
