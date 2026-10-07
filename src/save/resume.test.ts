import { describe, expect, it } from 'vitest';
import { TICKS_PER_DAY } from '../sim/core/gameTime';
import { Simulation } from '../sim/core/simulation';
import { testWorld, zoneOf } from '../sim/goods/testWorld';
import { createSave, parseSave, serializeSave } from './format';

describe('Speichern mitten im Warenfluss', () => {
  it('geladener Stand läuft exakt wie der ununterbrochene weiter', () => {
    const s = testWorld();
    s.execute({ type: 'order/create', product: 'rawA', quantity: 50, interval: 'daily' });
    s.execute({ type: 'order/create', product: 'rawB', quantity: 20, interval: 'daily' });
    s.execute({ type: 'vehicle/buyTruck' });
    s.execute({ type: 'vehicle/buyTruck' });
    const tour = s.state.vehicles.at(-1);
    if (!tour) throw new Error('LKW fehlt');
    s.execute({
      type: 'vehicle/setTour',
      truckId: tour.id,
      stops: [
        { siteId: zoneOf(s, 'A').id, action: 'load', product: 'rawA' },
        { siteId: zoneOf(s, 'B').id, action: 'unload', product: 'rawA' },
      ],
    });
    s.execute({ type: 'vehicle/setMode', truckId: tour.id, mode: 'tour' });
    s.run(TICKS_PER_DAY / 2 + 37);
    expect(s.state.vehicles.some((v) => v.kind === 'truck' && v.phase !== 'idle')).toBe(true);

    const parsed = parseSave(serializeSave(createSave(s.state, 'Test', '0.2.0', new Date(0))));
    if (!parsed.ok) throw new Error(parsed.error);
    const loaded = new Simulation(parsed.save.state);
    s.run(TICKS_PER_DAY);
    loaded.run(TICKS_PER_DAY);
    expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(s.state));
  });
});
