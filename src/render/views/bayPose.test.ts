import { describe, expect, it } from 'vitest';
import { bayPose } from './bayPose';

describe('Stellplatz-Lage', () => {
  it('steht hinter dem Tor in der Zone, mit der Front zur Straße', () => {
    // Tor im Norden: Zufahrt nördlich, Stellplatz weiter südlich, Front nach Norden.
    const pose = bayPose({ x: 4, z: 9 }, 'N', 0, 1);
    expect(pose.x).toBeCloseTo(4.5);
    expect(pose.z).toBeCloseTo(10.45);
    expect(pose.angle).toBeCloseTo(Math.PI / 2);
  });

  it('mehrere Stellplätze nebeneinander entlang der Torkante', () => {
    const a = bayPose({ x: 4, z: 9 }, 'N', 0, 2);
    const b = bayPose({ x: 4, z: 9 }, 'N', 1, 2);
    expect(a.z).toBeCloseTo(b.z);
    expect(b.x - a.x).toBeCloseTo(0.55);
  });
});
