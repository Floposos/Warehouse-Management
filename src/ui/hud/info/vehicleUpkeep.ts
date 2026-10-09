import { maintenanceConfig as mc } from '../../../config/maintenance';
import type { Command, CommandResult } from '../../../sim/commands/commands';
import { calendarAt, TICKS_PER_DAY } from '../../../sim/core/gameTime';
import type { Truck } from '../../../sim/vehicles/types';
import { kmUntilService } from '../../../sim/vehicles/upkeep';
import { pad2 } from '../../../shared/format';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import { row } from './infoPanel';

export function dateText(tick: number): string {
  const c = calendarAt(tick);
  return `${pad2(c.day)}.${pad2(c.month)}.${c.year}`;
}

/** Status-Text bei einer Panne (null = keine Panne). */
export function brokenText(t: Truck): string | null {
  const ticks = t.upkeep.brokenTicks;
  return ticks > 0 ? de.upkeep.broken(Math.ceil((ticks * 24) / TICKS_PER_DAY)) : null;
}

/** Zustand, Pannen, letzte Wartung und „Zur Werkstatt“ (T2.6). */
export function upkeepSection(
  truckId: number,
  submit: (c: Command) => CommandResult,
): { root: HTMLElement; update(t: Truck): void } {
  const root = el('div', 'info-upkeep');
  const condition = row(de.upkeep.condition);
  const breakdowns = row(de.upkeep.breakdowns);
  const service = row(de.upkeep.lastService);
  const note = el('p', 'info-note');
  note.hidden = true;
  const send = button(
    de.upkeep.toWorkshop,
    () => {
      const result = submit({ type: 'vehicle/service', truckId });
      note.hidden = false;
      note.classList.toggle('is-warning', !result.ok);
      note.textContent = result.ok ? de.upkeep.requested : de.upkeep.noWorkshop;
    },
    'btn',
  );
  send.title = de.upkeep.toWorkshopTitle;
  send.dataset['testid'] = 'truck-service';
  root.append(condition.root, breakdowns.root, service.root, send, note);
  return {
    root,
    update(t) {
      const u = t.upkeep;
      const percent = Math.floor((u.condition * 100) / mc.fullCondition);
      condition.value.textContent = de.upkeep.conditionLine(percent, kmUntilService(t));
      condition.value.classList.toggle('is-warning', u.condition < mc.serviceBelow);
      breakdowns.value.textContent =
        u.lastBreakdownTick === null
          ? de.upkeep.noBreakdowns
          : de.upkeep.breakdownLine(u.breakdowns, dateText(u.lastBreakdownTick));
      service.value.textContent =
        u.lastServiceTick === null ? de.upkeep.never : dateText(u.lastServiceTick);
      const inWorkshop = t.phase === 'toWorkshop' || t.phase === 'servicing';
      send.disabled = inWorkshop || u.serviceRequested;
      if (inWorkshop || !u.serviceRequested) {
        if (note.textContent === de.upkeep.requested) note.hidden = true;
      }
    },
  };
}
