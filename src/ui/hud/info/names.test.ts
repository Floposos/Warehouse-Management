import { describe, expect, it } from 'vitest';
import { testWorld } from '../../../sim/goods/testWorld';
import { siteLabel, siteOptions, truckLabel } from './names';

describe('Anzeigenamen', () => {
  it('nummeriert Orte je Art und LKW in Bau-Reihenfolge', () => {
    const s = testWorld();
    s.execute({ type: 'zone/place', kind: 'A', fromX: 14, fromZ: 58, toX: 15, toZ: 60 });
    const [a1, , , a2] = s.state.zones;
    expect(siteLabel(s.state, a1?.id ?? -1)).toBe('Lieferort A 1');
    expect(siteLabel(s.state, a2?.id ?? -1)).toBe('Lieferort A 2');
    expect(siteOptions(s.state).map((o) => o.label)).toContain('Export-Ausfahrt 1');
    s.execute({ type: 'vehicle/buyTruck' });
    s.execute({ type: 'vehicle/buyTruck' });
    expect(truckLabel(s.state, s.state.vehicles[1]?.id ?? -1)).toBe('LKW 2');
    expect(siteLabel(s.state, 9999)).toBe('–');
  });
});
