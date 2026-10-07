import { goodsConfig } from '../../config/goods';
import { rawProducts, type RawProductId } from '../../content/products';
import { formatEuro } from '../../shared/format';
import type { Command } from '../../sim/commands/commands';
import { calendarAt } from '../../sim/core/gameTime';
import { ORDER_INTERVALS, type OrderInterval } from '../../sim/goods/orders';
import type { GameState, Order } from '../../sim/state/gameState';
import { Dialog } from '../components/dialog';
import { button, el } from '../components/dom';
import { formatClock } from '../hud/clockLabel';
import { de } from '../texts/de';

const REFRESH_MS = 500;
const RAW = Object.keys(rawProducts) as RawProductId[];

/**
 * Einkauf: neue Bestellung (einmalig oder Dauerauftrag) und Liste der offenen Bestellungen
 * mit Status. Schickt nur Befehle; die Liste aktualisiert sich, solange das Fenster offen ist.
 */
export function openPurchaseDialog(
  root: HTMLElement,
  state: () => GameState | null,
  submit: (command: Command) => void,
): Dialog {
  let timer = 0;
  const dialog = new Dialog(root, de.purchase.title, () => window.clearInterval(timer));
  dialog.setButtons([{ label: de.common.close, onClick: () => dialog.close() }]);
  const list = el('div', 'purchase-list');
  list.dataset['testid'] = 'order-list';
  const renderList = (): void => {
    const s = state();
    if (s) list.replaceChildren(...orderList(s, submit, renderList));
  };
  const form = orderForm((command) => {
    submit(command);
    renderList();
  });
  dialog.body.append(
    el('p', 'purchase-hint', de.purchase.hint),
    form,
    el('h3', 'cash-subtitle', de.purchase.orders),
    list,
  );
  renderList();
  timer = window.setInterval(renderList, REFRESH_MS);
  return dialog;
}

function select<T extends string | number>(
  id: string,
  options: readonly T[],
  label: (v: T) => string,
  selected: T,
): HTMLSelectElement {
  const node = el('select');
  node.id = id;
  for (const v of options) {
    const option = el('option', '', label(v));
    option.value = String(v);
    option.selected = v === selected;
    node.append(option);
  }
  return node;
}

function row(label: string, control: HTMLElement): HTMLElement {
  const wrap = el('div', 'settings-row');
  const text = el('label', '', label);
  text.htmlFor = control.id;
  wrap.append(text, control);
  return wrap;
}

function orderForm(onOrder: (command: Command) => void): HTMLElement {
  const price = (p: RawProductId): string => formatEuro(goodsConfig.purchasePriceCents[p]);
  const product = select(
    'order-product',
    RAW,
    (p) => de.purchase.productOption(de.products[p], price(p)),
    'rawA',
  );
  const quantity = select(
    'order-quantity',
    goodsConfig.orderQuantities,
    (n) => de.purchase.quantityOption(n),
    goodsConfig.defaultOrderQuantity,
  );
  const interval = select(
    'order-interval',
    ORDER_INTERVALS,
    (i) => de.purchase.intervals[i],
    'once',
  );
  const total = el('p', 'purchase-total');
  const update = (): void => {
    const cost =
      Number(quantity.value) * goodsConfig.purchasePriceCents[product.value as RawProductId];
    total.textContent = de.purchase.total(formatEuro(cost));
  };
  product.addEventListener('change', update);
  quantity.addEventListener('change', update);
  update();
  const submit = button(
    de.purchase.order,
    () =>
      onOrder({
        type: 'order/create',
        product: product.value as RawProductId,
        quantity: Number(quantity.value),
        interval: interval.value as OrderInterval,
      }),
    'btn btn-primary',
  );
  const form = el('div', 'settings-form');
  form.append(
    el('h3', 'cash-subtitle', de.purchase.newOrder),
    row(de.purchase.product, product),
    row(de.purchase.quantity, quantity),
    row(de.purchase.interval, interval),
    total,
    submit,
  );
  return form;
}

function orderList(
  state: GameState,
  submit: (c: Command) => void,
  refresh: () => void,
): HTMLElement[] {
  if (state.orders.length === 0) return [el('p', 'cash-empty', de.purchase.noOrders)];
  return state.orders.map((order) => orderItem(order, submit, refresh));
}

function orderItem(order: Order, submit: (c: Command) => void, refresh: () => void): HTMLElement {
  const item = el('div', 'purchase-order');
  const text = el('div', 'purchase-order-text');
  text.append(
    el(
      'strong',
      '',
      de.purchase.line(
        de.products[order.product],
        order.quantity,
        de.purchase.intervals[order.interval],
      ),
    ),
    el(
      'span',
      order.blocked ? 'purchase-blocked' : 'cash-when',
      order.blocked
        ? de.purchase.blocked[order.blocked]
        : de.purchase.next(formatClock(calendarAt(order.nextTick))),
    ),
  );
  const cancel = button(de.purchase.cancel, () => {
    submit({ type: 'order/cancel', orderId: order.id });
    refresh();
  });
  item.append(text, cancel);
  return item;
}
