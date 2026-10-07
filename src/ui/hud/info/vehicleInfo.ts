import type { Command, CommandResult } from '../../../sim/commands/commands';
import type { GameState } from '../../../sim/state/gameState';
import { currentStop } from '../../../sim/vehicles/truckTour';
import type { Supplier, Truck } from '../../../sim/vehicles/types';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import type { InfoContent } from './infoPanel';
import { row } from './infoPanel';
import { siteLabel, truckLabel } from './names';
import { TourEditor } from './tourEditor';

function cargoText(v: Truck | Supplier): string {
  return v.cargo
    ? de.info.cargoLine(v.cargo.quantity, de.products[v.cargo.product])
    : de.info.empty;
}

function truckStatus(t: Truck): string {
  if (t.phase === 'idle' && t.idleReason) return de.info.idleReasons[t.idleReason];
  return de.info.truckPhase[t.phase];
}

function truckTarget(state: GameState, t: Truck): string {
  if (t.phase === 'idle') return de.info.none;
  const id =
    t.mode === 'tour'
      ? currentStop(t)?.siteId
      : t.phase === 'toPickup' || t.phase === 'loading'
        ? t.job?.fromId
        : t.job?.toId;
  return id === undefined ? de.info.none : siteLabel(state, id);
}

/** Eigener LKW: Status, Ladung, Ziel, Betriebsart und Tour. */
export function truckInfo(
  truckId: number,
  submit: (c: Command) => CommandResult,
  picking: { active(): boolean; toggle(): void },
): InfoContent & { editor: TourEditor } {
  const root = el('div', 'info-content');
  const status = row(de.info.status);
  const cargo = row(de.info.cargo);
  const target = row(de.info.target);
  const modes = el('div', 'info-gates');
  const modeButtons = (['auto', 'tour'] as const).map((mode) => {
    const b = button(
      de.info.modes[mode],
      () => submit({ type: 'vehicle/setMode', truckId, mode }),
      'btn info-gate',
    );
    modes.append(b);
    return { mode, b };
  });
  const editor = new TourEditor(truckId, submit, picking);
  root.append(
    status.root,
    cargo.root,
    target.root,
    el('h3', 'info-subtitle', de.info.mode),
    modes,
    el('h3', 'info-subtitle', de.info.tour),
    editor.root,
  );
  return {
    root,
    editor,
    update(state: GameState) {
      const t = state.vehicles.find((v) => v.id === truckId);
      if (t?.kind !== 'truck') return null;
      status.value.textContent = truckStatus(t);
      cargo.value.textContent = cargoText(t);
      target.value.textContent = truckTarget(state, t);
      for (const { mode, b } of modeButtons) {
        b.classList.toggle('is-active', t.mode === mode);
        b.setAttribute('aria-pressed', String(t.mode === mode));
      }
      editor.update(state, t);
      return { title: truckLabel(state, truckId) };
    },
  };
}

/** Zulieferer: nur ansehen. */
export function supplierInfo(vehicleId: number): InfoContent {
  const root = el('div', 'info-content');
  const status = row(de.info.status);
  const cargo = row(de.info.cargo);
  const target = row(de.info.target);
  root.append(status.root, cargo.root, target.root);
  return {
    root,
    update(state: GameState) {
      const v = state.vehicles.find((x) => x.id === vehicleId);
      if (v?.kind !== 'supplier') return null;
      status.value.textContent = de.info.supplierPhase[v.phase];
      cargo.value.textContent = cargoText(v);
      target.value.textContent = v.phase === 'toExit' ? de.info.none : siteLabel(state, v.targetId);
      return { title: de.info.supplier };
    },
  };
}
