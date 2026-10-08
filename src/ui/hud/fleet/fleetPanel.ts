import type { Command, CommandResult } from '../../../sim/commands/commands';
import type { GameState } from '../../../sim/state/gameState';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import {
  FLEET_FILTERS,
  FLEET_SORTS,
  fleetRows,
  type FleetFilter,
  type FleetRow,
  type FleetSort,
} from './fleetRows';

function select<T extends string>(
  label: string,
  values: readonly T[],
  names: Record<T, string>,
  onChange: (v: T) => void,
): HTMLSelectElement {
  const s = el('select', 'info-select');
  s.setAttribute('aria-label', label);
  for (const v of values) {
    const o = el('option', undefined, names[v]);
    o.value = v;
    s.append(o);
  }
  s.addEventListener('change', () => onChange(s.value as T));
  return s;
}

/**
 * Flottenfenster (T2.8) links: alle eigenen Fahrzeuge mit Typ, Status, Tour und Zustand,
 * filtern, sortieren, Klick zeigt das Fahrzeug; Sammelaktionen für die ausgewählten:
 * Tour zuweisen (auch Automatik) und zur Werkstatt. Liest nur den Zustand, schickt Befehle.
 */
export class FleetPanel {
  readonly root = el('aside', 'tours-panel fleet-panel');
  private readonly title = el('h2', 'info-title');
  private readonly list = el('ul', 'fleet-list');
  private readonly count = el('span', 'fleet-count');
  private readonly note = el('p', 'info-note');
  private readonly all: HTMLInputElement;
  private readonly tourSelect = el('select', 'info-select');
  private readonly chosen = new Set<number>();
  private filter: FleetFilter = 'all';
  private sort: FleetSort = 'name';
  private rows: FleetRow[] = [];
  private key = '';
  private toursKey = '';

  constructor(
    parent: HTMLElement,
    private readonly submit: (c: Command) => CommandResult,
    private readonly show: (vehicleId: number) => void,
  ) {
    this.root.dataset['testid'] = 'fleet-panel';
    this.root.setAttribute('aria-label', de.fleetPanel.open);
    const close = button('×', () => this.close(), 'btn btn-icon info-close');
    close.title = de.fleetPanel.close;
    close.setAttribute('aria-label', de.fleetPanel.close);
    const head = el('div', 'info-head');
    head.append(this.title, close);
    const filters = el('div', 'tour-controls');
    filters.append(
      select(de.fleetPanel.filter, FLEET_FILTERS, de.fleetPanel.filters, (v) => this.set(v, null)),
      select(de.fleetPanel.sort, FLEET_SORTS, de.fleetPanel.sorts, (v) => this.set(null, v)),
    );
    this.all = el('input');
    this.all.type = 'checkbox';
    this.all.setAttribute('aria-label', de.fleetPanel.selectAll);
    this.all.addEventListener('change', () => {
      for (const r of this.rows) {
        if (this.all.checked) this.chosen.add(r.id);
        else this.chosen.delete(r.id);
      }
      this.key = '';
    });
    const allLabel = el('label', 'fleet-all');
    allLabel.append(this.all, el('span', undefined, de.fleetPanel.selectAll));
    this.tourSelect.setAttribute('aria-label', de.fleetPanel.assignTour);
    this.tourSelect.dataset['testid'] = 'fleet-tour';
    this.tourSelect.addEventListener('change', () => this.assignTour());
    const workshop = button(de.fleetPanel.toWorkshop, () => this.toWorkshop(), 'btn');
    const bulk = el('div', 'tour-controls fleet-bulk');
    bulk.append(this.count, this.tourSelect, workshop);
    this.note.hidden = true;
    this.root.append(head, filters, allLabel, this.list, bulk, this.note);
    this.root.hidden = true;
    parent.append(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(state: GameState): void {
    this.root.hidden = false;
    this.key = this.toursKey = '';
    this.note.hidden = true;
    this.update(state);
  }

  close(): void {
    this.root.hidden = true;
  }

  update(state: GameState): void {
    if (!this.isOpen) return;
    this.rows = fleetRows(state, this.filter, this.sort);
    const ids = new Set(state.vehicles.map((v) => v.id));
    for (const id of this.chosen) if (!ids.has(id)) this.chosen.delete(id);
    const total = state.vehicles.filter((v) => v.kind === 'truck').length;
    const key = JSON.stringify([this.rows, [...this.chosen], total]);
    if (key !== this.key) {
      this.key = key;
      this.title.textContent = de.fleetPanel.title(total);
      this.render();
    }
    const toursKey = JSON.stringify(state.tours.map((t) => [t.id, t.name]));
    if (toursKey !== this.toursKey) {
      this.toursKey = toursKey;
      const placeholder = el('option', undefined, de.fleetPanel.assignTour);
      placeholder.value = '';
      const auto = el('option', undefined, de.tours.auto);
      auto.value = 'auto';
      const tours = state.tours.map((t) => {
        const o = el('option', undefined, t.name);
        o.value = String(t.id);
        return o;
      });
      this.tourSelect.replaceChildren(placeholder, auto, ...tours);
    }
  }

  private set(filter: FleetFilter | null, sort: FleetSort | null): void {
    if (filter) this.filter = filter;
    if (sort) this.sort = sort;
    this.key = '';
  }

  private render(): void {
    const n = this.rows.filter((r) => this.chosen.has(r.id)).length;
    this.count.textContent = de.fleetPanel.selected(n);
    this.all.checked = this.rows.length > 0 && n === this.rows.length;
    if (this.rows.length === 0) {
      this.list.replaceChildren(el('li', 'info-note', de.fleetPanel.empty));
      return;
    }
    this.list.replaceChildren(...this.rows.map((r) => this.row(r)));
  }

  private row(r: FleetRow): HTMLElement {
    const li = el('li', 'fleet-row');
    li.dataset['testid'] = 'fleet-row';
    const check = el('input');
    check.type = 'checkbox';
    check.checked = this.chosen.has(r.id);
    check.setAttribute('aria-label', de.fleetPanel.select(r.name));
    check.addEventListener('change', () => {
      if (check.checked) this.chosen.add(r.id);
      else this.chosen.delete(r.id);
      this.key = '';
    });
    const name = button(r.name, () => this.show(r.id), 'btn fleet-name');
    name.title = de.fleetPanel.show(r.name);
    const condition = el('span', 'fleet-condition', `${r.condition} %`);
    condition.classList.toggle('is-warning', r.warning);
    const info = el('span', 'fleet-info', `${r.type} · ${r.tour}`);
    li.append(check, name, condition, info, el('span', 'fleet-status', r.status));
    return li;
  }

  private selectedIds(): number[] {
    return this.rows.filter((r) => this.chosen.has(r.id)).map((r) => r.id);
  }

  private report(ok: number, warning: string | null): void {
    this.note.hidden = false;
    this.note.classList.toggle('is-warning', warning !== null);
    this.note.textContent = warning ?? de.fleetPanel.done(ok);
  }

  private assignTour(): void {
    const value = this.tourSelect.value;
    this.tourSelect.value = '';
    if (value === '') return;
    const tourId = value === 'auto' ? null : Number(value);
    const ids = this.selectedIds();
    for (const truckId of ids) this.submit({ type: 'vehicle/assignTour', truckId, tourId });
    this.report(ids.length, null);
  }

  private toWorkshop(): void {
    const ids = this.selectedIds();
    let ok = 0;
    for (const truckId of ids) {
      if (this.submit({ type: 'vehicle/service', truckId }).ok) ok += 1;
    }
    this.report(ok, ids.length > 0 && ok === 0 ? de.fleetPanel.noWorkshop : null);
  }
}
