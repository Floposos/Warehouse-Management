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
 * - Fahrzeugtypen (T2.5): bisherige LKW sind gekaufte Diesel-LKW (Kaufzeitpunkt = jetzt).
 * - Wartung (T2.6): LKW sind in neuem Zustand, ohne Pannen; eigener Zufallsstrom für
 *   Ereignisse aus dem Seed.
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
      return {
        ...rest,
        tourId,
        ...FLEET_DEFAULTS,
        boughtTick: state['tick'] ?? 0,
        upkeep: { ...UPKEEP_DEFAULTS },
      };
    },
  );
  const roads = (Array.isArray(state['roads']) ? (state['roads'] as Obj[]) : []).map((r) => ({
    ...r,
    priority: false,
  }));
  const seed = typeof state['seed'] === 'number' ? state['seed'] : 0;
  const eventRng = { s: (seed ^ 0x5bd1e995) >>> 0 };
  return {
    ...save,
    state: { ...state, nextId, vehicles, tours, roads, notices: [], eventRng },
  };
};

const UPKEEP_DEFAULTS = {
  condition: 100_000,
  wearRest: 0,
  brokenTicks: 0,
  breakdowns: 0,
  lastBreakdownTick: null,
  lastServiceTick: null,
  serviceRequested: false,
  warnedNoWorkshop: false,
  workshopId: null,
};

/** Bisherige LKW: LKW mit Diesel, gekauft zum damaligen Preis (90.000 €). */
const FLEET_DEFAULTS = { model: 'truck', drive: 'diesel', priceCents: 9_000_000, lease: null };

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
