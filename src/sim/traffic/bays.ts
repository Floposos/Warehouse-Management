import { trafficConfig } from '../../config/traffic';
import { destinationOf } from '../vehicles/destination';
import type { GameState } from '../state/gameState';
import { shapeArea } from '../world/zoneShape';

/**
 * Stellplätze am Tor eines Orts (T2.3, Entscheidung 08.10.2026: wächst mit der Zonengröße).
 * ANNAHME: je angefangene `fieldsPerBay` Felder einer, höchstens `maxBays`; Export-Ausfahrt
 * fest. Unbekannte Orte zählen mit einem, damit niemand ewig wartet.
 */
export function bayCapacity(state: GameState, siteId: number): number {
  const zone = state.zones.find((z) => z.id === siteId);
  if (zone) {
    const bays = Math.ceil(shapeArea(zone.parts) / trafficConfig.fieldsPerBay);
    return Math.min(trafficConfig.maxBays, Math.max(1, bays));
  }
  return state.buildings.some((b) => b.id === siteId) ? trafficConfig.exportBays : 1;
}

/** Belegte Stellplätze und Warteschlange (Fahrzeuge, die zum Ort wollen und stehen). */
export function bayStatus(state: GameState, siteId: number): { used: number; queue: number } {
  let used = 0;
  let queue = 0;
  for (const v of state.vehicles) {
    if (v.bayAt === siteId) used += 1;
    else if (v.waitTicks > 0 && destinationOf(state, v) === siteId) queue += 1;
  }
  return { used, queue };
}
