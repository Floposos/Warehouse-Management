import { describe, expect, it } from 'vitest';
import { testWorld, zoneOf } from '../sim/goods/testWorld';
import { pickEntity } from './pickEntity';

describe('Objekt unter dem Mauszeiger', () => {
  it('findet Zone, Gebäude, Fahrzeug und nichts', () => {
    const s = testWorld();
    const a = zoneOf(s, 'A');
    expect(pickEntity(s.state, (a.parts[0]?.x ?? 0) + 0.5, (a.parts[0]?.z ?? 0) + 0.5)).toEqual({
      kind: 'zone',
      id: a.id,
    });
    const exit = s.state.buildings.find((b) => b.type === 'exportExit');
    expect(pickEntity(s.state, 40.5, 125.5)).toEqual({ kind: 'building', id: exit?.id });
    expect(pickEntity(s.state, 70.5, 20.5)).toBeNull();
    s.execute({ type: 'vehicle/buyTruck' });
    const truck = s.state.vehicles[0];
    expect(pickEntity(s.state, -0.5, 61.5)).toEqual({ kind: 'vehicle', id: truck?.id });
  });
});
