import { describe, expect, it } from 'vitest';
import { LANE_OFFSET, PARKED_OFFSET, vehiclePose } from './vehiclePose';

const route = [
  { x: 0, z: 0 },
  { x: 1, z: 0 },
  { x: 1, z: 1 },
];

describe('Fahrzeuglage', () => {
  it('fährt rechts: nach Osten auf der Südseite der Straße', () => {
    expect(vehiclePose(route, 500)).toEqual({ x: 1, z: 0.5 + LANE_OFFSET, angle: -0 });
  });

  it('geht mit der Vorausschau über die Feldgrenze und biegt ab', () => {
    const pose = vehiclePose(route, 800, 400);
    expect(pose?.x).toBeCloseTo(1.5 - LANE_OFFSET);
    expect(pose?.z).toBeCloseTo(0.7);
    expect(pose?.angle).toBeCloseTo(-Math.PI / 2);
  });

  it('am Ziel bleibt es auf dem letzten Feld stehen', () => {
    expect(vehiclePose([{ x: 3, z: 4 }], 0)).toMatchObject({ x: 3.5, z: 4.5 + LANE_OFFSET });
    expect(vehiclePose([], 0)).toBeNull();
  });
});

describe('Stehende Fahrzeuge (T2.2)', () => {
  it('am Wegende zeigt das Fahrzeug in seine Fahrtrichtung', () => {
    const north = vehiclePose([{ x: 3, z: 4 }], 0, 0, 0);
    expect(north).toMatchObject({ x: 3.5 + LANE_OFFSET, z: 4.5 });
    expect(north?.angle).toBeCloseTo(Math.PI / 2);
  });

  it('geparkt steht es weiter am Rand', () => {
    const parked = vehiclePose([{ x: 3, z: 4 }], 0, 0, 1, PARKED_OFFSET);
    expect(parked).toMatchObject({ x: 3.5, z: 4.5 + PARKED_OFFSET });
  });
});
