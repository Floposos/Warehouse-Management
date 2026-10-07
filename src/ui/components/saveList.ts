import { formatDateTimeDe, formatEuro } from '../../shared/format';
import { calendarAt } from '../../sim/core/gameTime';
import { formatClock } from '../hud/clockLabel';
import { de } from '../texts/de';
import { button, el } from './dom';

/** Anzeige-Daten eines Spielstands (vom App-Teil aus den Speicher-Einträgen erzeugt). */
export interface SaveListItem {
  id: string;
  name: string;
  savedAt: string;
  tick: number;
  balanceCents: number;
}

export interface SaveListAction {
  label: string;
  onClick: (item: SaveListItem) => void;
  danger?: boolean;
  primary?: boolean;
}

/** Liste mit Name, Speicherdatum, Spielzeit und Kontostand, je Zeile Knöpfe. */
export function saveList(
  items: readonly SaveListItem[],
  emptyText: string,
  actions: readonly SaveListAction[],
): HTMLElement {
  const list = el('ul', 'save-list');
  if (items.length === 0) list.append(el('li', 'save-list-empty', emptyText));
  for (const item of items) {
    const row = el('li', 'save-item');
    row.dataset['testid'] = 'save-item';
    const info = el('div', 'save-item-info');
    info.append(
      el('strong', 'save-item-name', item.name),
      el(
        'span',
        'save-item-details',
        `${formatClock(calendarAt(item.tick))} · ${formatEuro(item.balanceCents)}`,
      ),
      el('span', 'save-item-date', de.save.savedAt(formatDateTimeDe(item.savedAt))),
    );
    const buttons = el('div', 'save-item-actions');
    for (const action of actions) {
      const cls = `btn${action.primary ? ' btn-primary' : ''}${action.danger ? ' btn-danger' : ''}`;
      const b = button(action.label, () => action.onClick(item), cls);
      b.setAttribute('aria-label', `${action.label}: ${item.name}`);
      buttons.append(b);
    }
    row.append(info, buttons);
    list.append(row);
  }
  return list;
}
