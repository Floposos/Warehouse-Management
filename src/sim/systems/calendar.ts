import { calendarAt, isDayStart } from '../core/gameTime';
import type { SimSystem } from './types';

/** Meldet Tages-, Monats- und Jahreswechsel als Ereignisse. */
export const calendarSystem: SimSystem = {
  id: 'calendar',
  update(state, { bus }) {
    if (!isDayStart(state.tick)) return;
    const { year, month, day } = calendarAt(state.tick);
    if (month === 1 && day === 1) bus.emit({ type: 'time/yearStarted', year });
    if (day === 1) bus.emit({ type: 'time/monthStarted', year, month });
    bus.emit({ type: 'time/dayStarted', year, month, day });
  },
};
