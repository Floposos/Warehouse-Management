import { pad2 } from '../../shared/format';
import type { CalendarTime } from '../../sim/core/gameTime';
import { de } from '../texts/de';

/** z. B. „Sa, 01.01.2000 · 08:15“ */
export function formatClock(c: CalendarTime): string {
  const weekday = de.hud.weekdays[c.weekday] ?? '';
  return `${weekday}, ${pad2(c.day)}.${pad2(c.month)}.${c.year} · ${pad2(c.hour)}:${pad2(c.minute)}`;
}
