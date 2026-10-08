import type { Migration } from './index';

type Obj = Record<string, unknown>;

/**
 * Version 3 → 4 (M2, 0.3.0). Bewusst mit festen Werten, damit spätere Codeänderungen diese
 * Migration nicht verändern.
 * - Touren werden eigene Einträge (T2.1): Jede bisherige Tour eines LKW (Betrieb „Tour“ oder
 *   mit Halten) wird zur Tour „Tour n“ mit Farbe n − 1; der LKW verweist per `tourId` darauf
 *   (nur im Betrieb „Tour“, sonst Automatik).
 * - Verkehr (T2.2–T2.4): Fahrzeuge bekommen Fahrtrichtung (aus dem Weg, sonst Ost), stehen
 *   abseits der Fahrbahn, wenn sie warten oder laden, belegen noch keinen Stellplatz und
 *   haben keine Wartezeit. Straßen sind keine Vorfahrtsstraßen.
 * - Meldungen (T2.4): leere Liste.
 */
export const migrateV3ToV4: Migration = (save) => {
  const state = save['state'] as Obj;
  let nextId = state['nextId'] as number;
  const tours: Obj[] = [];
  const vehicles = (Array.isArray(state['vehicles']) ? (state['vehicles'] as Obj[]) : []).map(
    (old) => {
      const v = { ...old, ...trafficFields(old) };
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
  const roads = (Array.isArray(state['roads']) ? (state['roads'] as Obj[]) : []).map((r) => ({
    ...r,
    priority: false,
  }));
  return { ...save, state: { ...state, nextId, vehicles, tours, roads, notices: [] } };
};

const PARKED = ['idle', 'loading', 'unloading', 'handling', 'noRoute'];
const DIRS: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

function trafficFields(v: Obj): Obj {
  const route = Array.isArray(v['route']) ? (v['route'] as { x: number; z: number }[]) : [];
  const [a, b] = route;
  const i = a && b ? DIRS.findIndex(([dx, dz]) => dx === b.x - a.x && dz === b.z - a.z) : -1;
  return {
    heading: i < 0 ? 1 : i,
    offRoad: PARKED.includes(v['phase'] as string),
    bayAt: null,
    waitTicks: 0,
  };
}
