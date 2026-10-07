import type { Command, CommandResult } from '../../../sim/commands/commands';
import type { GameState } from '../../../sim/state/gameState';
import type { TourStop, Truck } from '../../../sim/vehicles/types';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import { siteLabel, siteOptions } from './names';
import { defaultStop, productsFor } from './tourDefaults';

const ACTIONS: readonly TourStop['action'][] = ['load', 'unload'];

function select(
  label: string,
  options: readonly { value: string; text: string }[],
  value: string,
  onChange: (value: string) => void,
): HTMLSelectElement {
  const node = el('select', 'info-select');
  node.setAttribute('aria-label', label);
  for (const o of options) {
    const option = el('option', undefined, o.text);
    option.value = o.value;
    node.append(option);
  }
  node.value = value;
  node.addEventListener('change', () => onChange(node.value));
  return node;
}

/**
 * Tour bearbeiten (T1.5b): Halte mit Ort, Aktion und Ware; hinzufügen per Liste oder per
 * Klick ins Gelände, verschieben, entfernen. Jede Änderung schickt die ganze Tour als Befehl.
 */
export class TourEditor {
  readonly root = el('div', 'tour-editor');
  private readonly list = el('ol', 'tour-list');
  private readonly message = el('p', 'info-note is-warning');
  private readonly addSite = el('select', 'info-select');
  private readonly pickButton: HTMLButtonElement;
  private key = '';
  private stops: TourStop[] = [];
  private state: GameState | null = null;

  constructor(
    private readonly truckId: number,
    private readonly submit: (c: Command) => CommandResult,
    private readonly picking: { active(): boolean; toggle(): void },
  ) {
    this.list.dataset['testid'] = 'tour-list';
    this.addSite.setAttribute('aria-label', de.info.addStop);
    const add = button(de.info.addStop, () => this.add(Number(this.addSite.value)), 'btn');
    this.pickButton = button(de.info.pickStops, () => this.picking.toggle(), 'btn');
    const controls = el('div', 'tour-controls');
    controls.append(this.addSite, add, this.pickButton);
    this.message.hidden = true;
    this.root.append(this.list, controls, this.message);
  }

  update(state: GameState, truck: Truck): void {
    this.state = state;
    const options = siteOptions(state);
    const key = JSON.stringify([truck.tour, options]);
    if (key !== this.key) {
      this.key = key;
      this.stops = truck.tour.map((s) => ({ ...s }));
      this.render(state, options);
    }
    const current = truck.mode === 'tour' ? truck.tourIndex : -1;
    [...this.list.children].forEach((li, i) => li.classList.toggle('is-current', i === current));
    const active = this.picking.active();
    this.pickButton.textContent = active ? de.info.pickStopsActive : de.info.pickStops;
    this.pickButton.classList.toggle('is-active', active);
  }

  /** Halt am Ende anhängen (Vorschlag für Aktion und Ware). */
  add(siteId: number): void {
    if (!this.state) return;
    const stop = defaultStop(this.state, siteId, this.stops.at(-1));
    if (stop) this.send([...this.stops, stop]);
  }

  private send(stops: TourStop[]): void {
    const result = this.submit({ type: 'vehicle/setTour', truckId: this.truckId, stops });
    const reasons: Record<string, string> = de.info.stopRejected;
    this.message.hidden = result.ok;
    if (!result.ok) this.message.textContent = reasons[result.reason] ?? result.reason;
  }

  private render(state: GameState, options: { id: number; label: string }[]): void {
    this.addSite.replaceChildren(
      ...options.map((o) => {
        const option = el('option', undefined, o.label);
        option.value = String(o.id);
        return option;
      }),
    );
    if (this.stops.length === 0) {
      this.list.replaceChildren(el('li', 'info-note tour-empty', de.info.noStops));
      return;
    }
    this.list.replaceChildren(...this.stops.map((stop, i) => this.stopRow(state, stop, i)));
  }

  private stopRow(state: GameState, stop: TourStop, i: number): HTMLElement {
    const change = (patch: Partial<TourStop>): void => {
      const next = { ...stop, ...patch };
      const valid = productsFor(state, next.siteId, next.action);
      if (!valid.includes(next.product) && valid[0]) next.product = valid[0];
      this.send(this.stops.map((s, j) => (j === i ? next : s)));
    };
    const action = select(
      de.info.actions.load,
      ACTIONS.map((a) => ({ value: a, text: de.info.actions[a] })),
      stop.action,
      (v) => change({ action: v as TourStop['action'] }),
    );
    const product = select(
      de.purchase.product,
      productsFor(state, stop.siteId, stop.action).map((p) => ({ value: p, text: de.products[p] })),
      stop.product,
      (v) => change({ product: v as TourStop['product'] }),
    );
    const up = button('↑', () => this.send(swap(this.stops, i)), 'btn btn-icon');
    up.title = de.info.moveUp;
    up.disabled = i === 0;
    const remove = button(
      '×',
      () => this.send(this.stops.filter((_, j) => j !== i)),
      'btn btn-icon',
    );
    remove.title = de.info.removeStop;
    remove.setAttribute('aria-label', de.info.removeStop);
    const li = el('li', 'tour-stop');
    li.append(el('span', 'tour-site', siteLabel(state, stop.siteId)), action, product, up, remove);
    return li;
  }
}

function swap(stops: readonly TourStop[], i: number): TourStop[] {
  const next = [...stops];
  const [a, b] = [next[i - 1], next[i]];
  if (a && b) [next[i - 1], next[i]] = [b, a];
  return next;
}
