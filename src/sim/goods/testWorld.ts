import { Simulation } from '../core/simulation';
import { createInitialState } from '../state/gameState';

/**
 * Testaufbau (nur für Tests): Straße von der Einfahrt nach Osten (z = 61, x 0–40),
 * A nördlich, B südlich, C weiter östlich, Export-Ausfahrt am Südrand über eine Stichstraße.
 */
export function testWorld(): Simulation {
  const s = new Simulation(createInitialState(42));
  // Test-Halle aus dem Weg räumen, damit die Straße gerade durchgeht.
  s.execute({ type: 'build/demolish', buildingId: 1 });
  const ok = [
    s.execute({ type: 'road/build', fromX: 0, fromZ: 61, toX: 40, toZ: 61, xFirst: true }),
    s.execute({ type: 'zone/place', kind: 'A', fromX: 10, fromZ: 58, toX: 12, toZ: 60 }),
    s.execute({ type: 'zone/place', kind: 'B', fromX: 20, fromZ: 62, toX: 22, toZ: 64 }),
    s.execute({ type: 'zone/place', kind: 'C', fromX: 30, fromZ: 58, toX: 32, toZ: 60 }),
    s.execute({ type: 'road/build', fromX: 40, fromZ: 61, toX: 40, toZ: 123, xFirst: false }),
    s.execute({ type: 'build/place', buildingType: 'exportExit', x: 39, z: 124 }),
  ];
  if (ok.some((r) => !r.ok)) throw new Error(`Testaufbau fehlgeschlagen: ${JSON.stringify(ok)}`);
  return s;
}

export function zoneOf(s: Simulation, kind: 'A' | 'B' | 'C') {
  const zone = s.state.zones.find((z) => z.kind === kind);
  if (!zone) throw new Error(`Zone ${kind} fehlt`);
  return zone;
}
