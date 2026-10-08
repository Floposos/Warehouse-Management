import { calendarAt } from '../../../sim/core/gameTime';
import type { Command, CommandResult } from '../../../sim/commands/commands';
import type { GameState } from '../../../sim/state/gameState';
import {
  disposalCents,
  residualCents,
  returnPenaltyCents,
  valuesOf,
} from '../../../sim/vehicles/fleet';
import type { Truck } from '../../../sim/vehicles/types';
import { formatEuro, pad2 } from '../../../shared/format';
import { confirmDialog } from '../../components/confirm';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import { row } from './infoPanel';
import { truckLabel } from './names';

function dateText(tick: number): string {
  const c = calendarAt(tick);
  return `${pad2(c.day)}.${pad2(c.month)}.${c.year}`;
}

/** Typ, Antrieb, Kauf/Leasing und „Verkaufen“ bzw. „Leasing zurückgeben“ (T2.5). */
export function ownershipSection(
  truckId: number,
  submit: (c: Command) => CommandResult,
): { root: HTMLElement; update(state: GameState, t: Truck): void } {
  const root = el('div', 'info-ownership');
  const type = row(de.fleet.type);
  const ownership = row(de.fleet.ownership);
  let current: { state: GameState; truck: Truck } | null = null;
  const dispose = button('', () => void ask(), 'btn btn-danger info-demolish');
  dispose.dataset['testid'] = 'truck-dispose';
  root.append(type.root, ownership.root, dispose);

  async function ask(): Promise<void> {
    if (!current) return;
    const { state, truck } = current;
    const name = truckLabel(state, truckId);
    const message = truck.lease
      ? de.fleet.giveBackConfirm(name, formatEuro(returnPenaltyCents(truck)))
      : de.fleet.sellConfirm(name, formatEuro(disposalCents(state, truck)));
    const label = truck.lease ? de.fleet.giveBack : de.fleet.sell;
    const host = root.closest('.info-panel')?.parentElement ?? document.body;
    if (await confirmDialog(host, label, message, label)) {
      submit({ type: 'vehicle/dispose', truckId });
    }
  }

  return {
    root,
    update(state, t) {
      current = { state, truck: t };
      const v = valuesOf(t);
      type.value.textContent = de.fleet.typeLine(
        de.fleet.models[t.model],
        de.fleet.drives[t.drive],
        v.capacity,
      );
      ownership.value.textContent = t.lease
        ? de.fleet.leased(formatEuro(t.lease.monthlyCents), dateText(t.lease.endTick))
        : de.fleet.owned(formatEuro(residualCents(state, t)));
      dispose.textContent = t.lease ? de.fleet.giveBack : de.fleet.sell;
    },
  };
}
