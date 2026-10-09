import { describe, expect, it } from 'vitest';
import { eventsConfig } from '../../config/events';
import { EventBus } from '../core/eventBus';
import { createInitialState } from '../state/gameState';
import { addNotice } from './notices';

describe('Meldungen', () => {
  it('fasst gleiche Meldungen in der Nähe zusammen, andere nicht', () => {
    const state = createInitialState(1);
    const bus = new EventBus();
    expect(addNotice(state, bus, { kind: 'jam', x: 10, z: 10, vehicleId: 1 })).not.toBeNull();
    expect(addNotice(state, bus, { kind: 'jam', x: 12, z: 11, vehicleId: 2 })).toBeNull();
    expect(addNotice(state, bus, { kind: 'jam', x: 40, z: 10, vehicleId: 3 })).not.toBeNull();
    expect(addNotice(state, bus, { kind: 'breakdown', x: 10, z: 10, vehicleId: 1 })).not.toBeNull();
    state.tick += eventsConfig.noticeMergeTicks;
    expect(addNotice(state, bus, { kind: 'jam', x: 10, z: 10, vehicleId: 1 })).not.toBeNull();
    expect(state.notices).toHaveLength(4);
  });

  it('behält nur die neuesten Meldungen', () => {
    const state = createInitialState(1);
    const bus = new EventBus();
    for (let i = 0; i < eventsConfig.maxNotices + 5; i++) {
      addNotice(state, bus, { kind: 'jam', x: i * 10, z: 0, vehicleId: null });
    }
    expect(state.notices).toHaveLength(eventsConfig.maxNotices);
    expect(state.notices[0]?.x).toBe(50);
  });
});
