import { Simulation } from './core/simulation';
import { createInitialState } from './state/gameState';

/**
 * Großer Testaufbau für Lasttests (nur für Tests, T2.9): Straßenraster mit Lieferorten A, B, C,
 * Werkstätten und zwei Export-Ausfahrten, dazu `vehicles` eigene Fahrzeuge (gemischt).
 */
export function loadWorld(vehicles: number): Simulation {
  const s = new Simulation(createInitialState(7));
  s.state.finance.balanceCents = 10_000_000_000;
  s.execute({ type: 'build/demolish', buildingId: 1 });
  const cmd = (c: Parameters<Simulation['execute']>[0]): void => {
    const r = s.execute(c);
    if (!r.ok) throw new Error(`Lastaufbau: ${JSON.stringify(c)} → ${JSON.stringify(r)}`);
  };
  // Hauptachse von der Einfahrt, dazu Querstraßen alle 16 Felder.
  cmd({ type: 'road/build', fromX: 0, fromZ: 61, toX: 120, toZ: 61, xFirst: true });
  for (let x = 16; x <= 112; x += 16) {
    cmd({ type: 'road/build', fromX: x, fromZ: 10, toX: x, toZ: 120, xFirst: false });
  }
  for (const z of [20, 40, 82, 102]) {
    cmd({ type: 'road/build', fromX: 16, fromZ: z, toX: 112, toZ: z, xFirst: true });
  }
  const kinds = ['A', 'A', 'B', 'C', 'A', 'B', 'C'] as const;
  let k = 0;
  for (let x = 17; x <= 97; x += 16) {
    for (const z of [21, 41, 62, 83, 103]) {
      const kind = kinds[k++ % kinds.length] ?? 'A';
      cmd({ type: 'zone/place', kind, fromX: x, fromZ: z, toX: x + 5, toZ: z + 4 });
    }
  }
  cmd({ type: 'zone/place', kind: 'W', fromX: 114, fromZ: 62, toX: 119, toZ: 65 });
  cmd({ type: 'zone/place', kind: 'W', fromX: 2, fromZ: 62, toX: 7, toZ: 65 });
  cmd({ type: 'road/build', fromX: 112, fromZ: 120, toX: 112, toZ: 123, xFirst: false });
  cmd({ type: 'build/place', buildingType: 'exportExit', x: 111, z: 124 });
  cmd({ type: 'road/build', fromX: 120, fromZ: 61, toX: 123, toZ: 61, xFirst: true });
  cmd({ type: 'build/place', buildingType: 'exportExit', x: 124, z: 60 });
  for (const zone of s.state.zones) {
    if (zone.kind === 'A') zone.stock['rawA'] = 100;
    if (zone.kind === 'B') zone.stock['rawB'] = 100;
  }
  for (let i = 0; i < vehicles; i++) {
    const model = i % 3 === 0 ? 'van' : 'truck';
    cmd({ type: 'vehicle/buy', model, drive: i % 2 ? 'electric' : 'diesel', lease: i % 5 === 0 });
  }
  // Dauerbetrieb: Touren pendeln Rohware A zwischen weit auseinanderliegenden A-Zonen.
  const aZones = s.state.zones.filter((z) => z.kind === 'A');
  const tours: number[] = [];
  for (let i = 0; i < aZones.length; i++) {
    const from = aZones[i];
    const to = aZones[(i + Math.ceil(aZones.length / 2)) % aZones.length];
    if (!from || !to || from === to) continue;
    const r = s.execute({
      type: 'tour/create',
      name: `Last ${i + 1}`,
      stops: [
        { siteId: from.id, action: 'load', product: 'rawA' },
        { siteId: to.id, action: 'unload', product: 'rawA' },
        { siteId: to.id, action: 'load', product: 'rawA' },
        { siteId: from.id, action: 'unload', product: 'rawA' },
      ],
    });
    if (r.ok && r.id !== undefined) tours.push(r.id);
  }
  s.state.vehicles.forEach((v, i) => {
    if (i % 4 === 0) return; // jedes vierte Fahrzeug bleibt in der Automatik
    s.execute({
      type: 'vehicle/assignTour',
      truckId: v.id,
      tourId: tours[i % tours.length] ?? null,
    });
  });
  cmd({ type: 'order/create', product: 'rawA', quantity: 40, interval: 'daily' });
  cmd({ type: 'order/create', product: 'rawB', quantity: 40, interval: 'daily' });
  return s;
}
