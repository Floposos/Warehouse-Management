import type { Side } from '../../sim/world/access';
import type { Pose } from './vehiclePose';

/** Richtung vom Zufahrtsfeld in die Zone hinein, je Tor-Seite. */
const INWARD: Record<Side, { dx: number; dz: number }> = {
  N: { dx: 0, dz: 1 },
  S: { dx: 0, dz: -1 },
  E: { dx: -1, dz: 0 },
  W: { dx: 1, dz: 0 },
};

/**
 * Lage auf einem Stellplatz (T2.3): hinter dem Tor in der Zone, nebeneinander entlang der
 * Torkante (`slot` von `count`), mit der Front zum Tor (rückwärts eingeparkt).
 */
export function bayPose(
  access: { x: number; z: number },
  gate: Side,
  slot: number,
  count: number,
): Pose {
  const n = INWARD[gate];
  const along = (slot - (count - 1) / 2) * 0.55;
  return {
    x: access.x + 0.5 + n.dx * 0.95 + n.dz * along,
    z: access.z + 0.5 + n.dz * 0.95 + n.dx * along,
    angle: Math.atan2(n.dz, -n.dx),
  };
}
