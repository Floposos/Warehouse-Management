import { tourColors } from '../../../content/tourColors';
import type { Command, CommandResult } from '../../../sim/commands/commands';
import type { GameState } from '../../../sim/state/gameState';
import { trucksOn } from '../../../sim/vehicles/tours';
import type { Tour } from '../../../sim/vehicles/types';
import { confirmDialog } from '../../components/confirm';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import { TourEditor } from './tourEditor';

export interface Toggle {
  active(): boolean;
  toggle(): void;
}

export function colorCss(index: number): string {
  return `#${(tourColors[index] ?? 0).toString(16).padStart(6, '0')}`;
}

/**
 * Fenster „Touren“ (T2.1) links: Liste aller Touren, Anlegen, Name, Farbe, Halte, Löschen,
 * Schalter „Alle Wege“. Liest nur den Zustand und schickt Befehle.
 */
export class ToursPanel {
  readonly root = el('aside', 'tours-panel');
  private readonly list = el('ul', 'tours-list');
  private readonly detail = el('div', 'tours-detail');
  private readonly allRoutesButton: HTMLButtonElement;
  private selectedId: number | null = null;
  private editor: TourEditor | null = null;
  private readonly trucksLine = el('p', 'info-note');
  private state: GameState | null = null;
  private listKey = '';
  private detailKey = '';

  constructor(
    parent: HTMLElement,
    private readonly submit: (c: Command) => CommandResult,
    private readonly picking: Toggle,
    private readonly allRoutes: Toggle,
  ) {
    this.root.dataset['testid'] = 'tours-panel';
    this.root.setAttribute('aria-label', de.tours.title);
    const close = button('×', () => this.close(), 'btn btn-icon info-close');
    close.title = de.tours.close;
    close.setAttribute('aria-label', de.tours.close);
    const head = el('div', 'info-head');
    head.append(el('h2', 'info-title', de.tours.title), close);
    const create = button(de.tours.newTour, () => this.create(), 'btn');
    this.allRoutesButton = button(de.tours.allRoutes, () => this.allRoutes.toggle(), 'btn');
    this.allRoutesButton.title = de.tours.allRoutesTitle;
    const bar = el('div', 'tour-controls');
    bar.append(create, this.allRoutesButton);
    this.root.append(head, bar, this.list, this.detail);
    this.root.hidden = true;
    parent.append(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /** Halte-Bearbeitung der gewählten Tour (für „Orte anklicken“). */
  get activeEditor(): TourEditor | null {
    return this.isOpen ? this.editor : null;
  }

  open(state: GameState, tourId: number | null = null): void {
    this.root.hidden = false;
    this.selectedId = tourId ?? this.selectedId ?? state.tours[0]?.id ?? null;
    this.listKey = this.detailKey = '';
    this.update(state);
  }

  close(): void {
    this.root.hidden = true;
    if (this.picking.active()) this.picking.toggle();
  }

  toggle(state: GameState): void {
    if (this.isOpen) this.close();
    else this.open(state);
  }

  update(state: GameState): void {
    this.state = state;
    const active = this.allRoutes.active();
    this.allRoutesButton.classList.toggle('is-active', active);
    this.allRoutesButton.setAttribute('aria-pressed', String(active));
    if (!this.isOpen) return;
    if (!state.tours.some((t) => t.id === this.selectedId)) {
      this.selectedId = state.tours[0]?.id ?? null;
    }
    const counts = state.tours.map((t) => trucksOn(state, t.id).length);
    const listKey = JSON.stringify([
      state.tours.map((t) => [t.id, t.name, t.color]),
      counts,
      this.selectedId,
    ]);
    if (listKey !== this.listKey) {
      this.listKey = listKey;
      this.renderList(state, counts);
    }
    const tour = state.tours.find((t) => t.id === this.selectedId) ?? null;
    const detailKey = JSON.stringify(tour && [tour.id, tour.name, tour.color]);
    if (detailKey !== this.detailKey) {
      this.detailKey = detailKey;
      this.renderDetail(tour);
    }
    if (tour && this.editor) this.editor.update(state, tour);
    if (tour) this.trucksLine.textContent = de.tours.trucks(trucksOn(state, tour.id).length);
  }

  private create(): void {
    const n = (this.state?.tours.length ?? 0) + 1;
    const result = this.submit({ type: 'tour/create', name: de.tours.defaultName(n) });
    if (result.ok && result.id !== undefined) this.selectedId = result.id;
  }

  private renderList(state: GameState, counts: number[]): void {
    if (state.tours.length === 0) {
      this.list.replaceChildren(el('li', 'info-note tour-empty', de.tours.none));
      return;
    }
    this.list.replaceChildren(
      ...state.tours.map((tour, i) => {
        const item = button(
          '',
          () => {
            this.selectedId = tour.id;
            this.listKey = '';
          },
          'btn tours-item',
        );
        item.classList.toggle('is-active', tour.id === this.selectedId);
        const dot = el('span', 'tour-dot');
        dot.style.background = colorCss(tour.color);
        item.append(
          dot,
          el('span', 'tours-name', tour.name),
          el('span', 'tours-count', String(counts[i] ?? 0)),
        );
        const li = el('li');
        li.append(item);
        return li;
      }),
    );
  }

  private renderDetail(tour: Tour | null): void {
    this.editor = null;
    if (!tour) {
      this.detail.replaceChildren();
      return;
    }
    const message = el('p', 'info-note is-warning');
    message.hidden = true;
    const send = (patch: Omit<Extract<Command, { type: 'tour/update' }>, 'type' | 'tourId'>) => {
      const result = this.submit({ type: 'tour/update', tourId: tour.id, ...patch });
      message.hidden = result.ok;
      if (!result.ok) message.textContent = de.tours.rejected[result.reason] ?? result.reason;
    };
    const name = el('input', 'info-select tours-name-input');
    name.value = tour.name;
    name.maxLength = 30;
    name.setAttribute('aria-label', de.tours.name);
    name.addEventListener('change', () => send({ name: name.value }));
    name.addEventListener('keydown', (e) => e.stopPropagation());
    const swatches = el('div', 'tour-swatches');
    tourColors.forEach((_, i) => {
      const b = button('', () => send({ color: i }), 'tour-swatch');
      b.style.background = colorCss(i);
      const label = de.tours.colorNames[i] ?? String(i + 1);
      b.title = label;
      b.setAttribute('aria-label', label);
      b.classList.toggle('is-active', i === tour.color);
      b.setAttribute('aria-pressed', String(i === tour.color));
      swatches.append(b);
    });
    this.editor = new TourEditor(tour.id, this.submit, this.picking);
    const remove = button(
      de.tours.delete,
      () => void this.askDelete(tour),
      'btn btn-danger info-demolish',
    );
    this.detail.replaceChildren(
      el('h3', 'info-subtitle', de.tours.name),
      name,
      el('h3', 'info-subtitle', de.tours.color),
      swatches,
      message,
      el('h3', 'info-subtitle', de.tours.stops),
      this.editor.root,
      this.trucksLine,
      remove,
    );
  }

  private async askDelete(tour: Tour): Promise<void> {
    const host = this.root.parentElement ?? this.root;
    if (
      await confirmDialog(
        host,
        de.tours.delete,
        de.tours.deleteConfirm(tour.name),
        de.tours.deleteOk,
      )
    ) {
      this.submit({ type: 'tour/delete', tourId: tour.id });
    }
  }
}
