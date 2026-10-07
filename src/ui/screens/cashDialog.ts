import { formatEuro, formatSignedEuro } from '../../shared/format';
import { calendarAt } from '../../sim/core/gameTime';
import {
  BOOKING_CATEGORIES,
  currentTotals,
  type BookingCategory,
  type PeriodTotals,
} from '../../sim/finance/ledger';
import type { GameState } from '../../sim/state/gameState';
import { Dialog } from '../components/dialog';
import { el } from '../components/dom';
import { formatClock } from '../hud/clockLabel';
import { de } from '../texts/de';

/** So viele Buchungen zeigt die Liste (neueste zuerst). */
const LIST_LENGTH = 12;
/** Aktualisierung, solange die Kasse offen ist (Echtzeit-Millisekunden). */
const REFRESH_MS = 500;

/**
 * Kasse: Kontostand, Einnahmen und Ausgaben je Bereich für heute und diesen Monat,
 * letzte Buchungen. Liest nur den Zustand und aktualisiert sich, solange sie offen ist.
 */
export function openCashDialog(root: HTMLElement, state: () => GameState | null): Dialog {
  let timer = 0;
  const dialog = new Dialog(root, de.cash.title, () => window.clearInterval(timer));
  dialog.setButtons([{ label: de.common.close, onClick: () => dialog.close() }]);
  const render = (): void => {
    const s = state();
    if (s) dialog.body.replaceChildren(...cashContent(s));
  };
  render();
  timer = window.setInterval(render, REFRESH_MS);
  return dialog;
}

function cashContent(state: GameState): HTMLElement[] {
  const balance = el('p', 'cash-balance');
  balance.append(
    el('span', '', de.cash.balance),
    el('strong', '', formatEuro(state.finance.balanceCents)),
  );
  const today = currentTotals(state.finance, state.tick, 'today');
  const month = currentTotals(state.finance, state.tick, 'month');
  return [balance, totalsTable(today, month), ...recentList(state)];
}

function totalsTable(today: PeriodTotals, month: PeriodTotals): HTMLElement {
  const table = el('table', 'cash-table');
  table.dataset['testid'] = 'cash-table';
  const head = el('tr');
  head.append(el('th', '', ''), th(de.cash.today, 2), th(de.cash.month, 2));
  const sub = el('tr');
  sub.append(el('th', '', de.cash.category));
  for (let i = 0; i < 2; i++) sub.append(th(de.cash.income), th(de.cash.expense));
  const rows = BOOKING_CATEGORIES.map((c) => row(de.cash.categories[c], [today, month], c));
  const total = row(de.cash.total, [today, month], null);
  total.className = 'cash-total';
  table.append(head, sub, ...rows, total);
  return table;
}

function th(text: string, span = 1): HTMLElement {
  const cell = el('th', '', text);
  if (span > 1) cell.colSpan = span;
  return cell;
}

function row(
  label: string,
  periods: PeriodTotals[],
  category: BookingCategory | null,
): HTMLElement {
  const tr = el('tr');
  tr.append(el('th', '', label));
  for (const p of periods) {
    const income = category ? p.incomeCents[category] : sum(p.incomeCents);
    const expense = category ? p.expenseCents[category] : sum(p.expenseCents);
    tr.append(amountCell(income), amountCell(-expense));
  }
  return tr;
}

function sum(values: Record<BookingCategory, number>): number {
  return BOOKING_CATEGORIES.reduce((total, c) => total + values[c], 0);
}

function amountCell(cents: number, tag: 'td' | 'span' = 'td'): HTMLElement {
  const td = el(tag, cents > 0 ? 'is-income' : cents < 0 ? 'is-expense' : 'is-zero');
  td.textContent = cents === 0 ? '–' : formatSignedEuro(cents);
  return td;
}

function recentList(state: GameState): HTMLElement[] {
  const title = el('h3', 'cash-subtitle', de.cash.recent);
  const bookings = state.finance.recent.slice(-LIST_LENGTH).reverse();
  if (bookings.length === 0) return [title, el('p', 'cash-empty', de.cash.noBookings)];
  const list = el('ul', 'cash-recent');
  for (const b of bookings) {
    const item = el('li');
    item.append(
      el('span', 'cash-when', formatClock(calendarAt(b.tick))),
      el('span', 'cash-category', de.cash.categories[b.category]),
      amountCell(b.amountCents, 'span'),
    );
    list.append(item);
  }
  return [title, list];
}
