import type { Command, CommandResult } from '../../../sim/commands/commands';
import type { GameState } from '../../../sim/state/gameState';
import { currentStop } from '../../../sim/vehicles/truckTour';
import type { Supplier, Truck } from '../../../sim/vehicles/types';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import type { InfoContent } from './infoPanel';
import { row } from './infoPanel';
import { siteLabel, truckLabel } from './names';

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
    t.tourId !== null
      ? currentStop(state, t)?.siteId
      : t.phase === 'toPickup' || t.phase === 'loading'
        ? t.job?.fromId
        : t.job?.toId;
  return id === undefined ? de.info.none : siteLabel(state, id);
}

/** Eigener LKW: Status, Ladung, Ziel und welche Tour er fährt (T2.1). */
export function truckInfo(
  truckId: number,
  submit: (c: Command) => CommandResult,
  openTours: (tourId: number | null) => void,
): InfoContent {
  const root = el('div', 'info-content');
  const status = row(de.info.status);
  const cargo = row(de.info.cargo);
  const target = row(de.info.target);
  const tourSelect = el('select', 'info-select');
  tourSelect.setAttribute('aria-label', de.tours.drives);
  tourSelect.dataset['testid'] = 'truck-tour';
  tourSelect.addEventListener('change', () => {
    const tourId = tourSelect.value === '' ? null : Number(tourSelect.value);
    submit({ type: 'vehicle/assignTour', truckId, tourId });
  });
  let tourId: number | null = null;
  const edit = button(de.tours.editTour, () => openTours(tourId), 'btn');
  const controls = el('div', 'tour-controls');
  controls.append(tourSelect, edit);
  root.append(
    status.root,
    cargo.root,
    target.root,
    el('h3', 'info-subtitle', de.tours.drives),
    controls,
  );
  let optionsKey = '';
  return {
    root,
    update(state: GameState) {
      const t = state.vehicles.find((v) => v.id === truckId);
      if (t?.kind !== 'truck') return null;
      status.value.textContent = truckStatus(t);
      cargo.value.textContent = cargoText(t);
      target.value.textContent = truckTarget(state, t);
      const key = JSON.stringify(state.tours.map((x) => [x.id, x.name]));
      if (key !== optionsKey) {
        optionsKey = key;
        const auto = el('option', undefined, de.tours.auto);
        auto.value = '';
        tourSelect.replaceChildren(
          auto,
          ...state.tours.map((x) => {
            const option = el('option', undefined, x.name);
            option.value = String(x.id);
            return option;
          }),
        );
      }
      tourId = t.tourId;
      if (document.activeElement !== tourSelect)
        tourSelect.value = t.tourId === null ? '' : String(t.tourId);
      edit.textContent = t.tourId === null ? de.tours.manage : de.tours.editTour;
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
