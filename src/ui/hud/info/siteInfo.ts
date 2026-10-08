import { shapeArea } from '../../../sim/world/zoneShape';
import { goodsConfig } from '../../../config/goods';
import { productIds } from '../../../content/products';
import { formatEuro } from '../../../shared/format';
import type { Command } from '../../../sim/commands/commands';
import { zoneCapacity, zoneRefund } from '../../../sim/commands/zones';
import { confirmDialog } from '../../components/confirm';
import { stockOf, stores } from '../../../sim/goods/stock';
import { zoneStatus } from '../../../sim/production/production';
import type { GameState } from '../../../sim/state/gameState';
import { accessCell, SIDES } from '../../../sim/world/access';
import { RoadNetwork } from '../../../sim/world/roadNetwork';
import { button, el } from '../../components/dom';
import { de } from '../../texts/de';
import type { InfoContent } from './infoPanel';
import { row } from './infoPanel';
import { siteLabel } from './names';

/** Zone: Größe, Status, Anschluss, Lager je Ware, Tor-Seite umschalten. */
export function zoneInfo(zoneId: number, submit: (c: Command) => void): InfoContent {
  const root = el('div', 'info-content');
  let refund = 0;
  const askDemolish = async (): Promise<void> => {
    const host = root.ownerDocument.getElementById('ui') ?? root.ownerDocument.body;
    const text = de.info.demolishZoneConfirm(formatEuro(refund));
    if (await confirmDialog(host, de.info.demolishZone, text, de.info.demolishZoneOk)) {
      submit({ type: 'zone/demolish', zoneId });
    }
  };
  const size = el('p', 'info-note');
  const status = row(de.info.status);
  const connection = el('p', 'info-note');
  const stock = el('div', 'info-stock');
  const gates = el('div', 'info-gates');
  const gateButtons = SIDES.map((side) => {
    const b = button(
      de.build.gate[side],
      () => submit({ type: 'zone/setGate', zoneId, gate: side }),
      'btn info-gate',
    );
    b.title = de.info.gateTitle(de.build.gate[side]);
    gates.append(b);
    return { side, b };
  });
  root.append(
    size,
    status.root,
    connection,
    el('h3', 'info-subtitle', de.info.stock),
    stock,
    el('h3', 'info-subtitle', de.info.gate),
    gates,
    button(de.info.demolishZone, () => void askDemolish(), 'btn btn-danger info-demolish'),
  );
  return {
    root,
    update(state: GameState) {
      const zone = state.zones.find((z) => z.id === zoneId);
      if (!zone) return null;
      refund = zoneRefund(state, zone);
      size.textContent = de.info.fields(shapeArea(zone.parts));
      status.value.textContent = de.info.zoneStatus[zoneStatus(zone)];
      const connected = accessCell(new RoadNetwork(state), zone.parts, zone.gate) !== null;
      connection.textContent = connected ? de.info.connected : de.build.notConnected;
      connection.classList.toggle('is-warning', !connected);
      const cap = zoneCapacity(zone);
      stock.replaceChildren(
        ...productIds
          .filter((p) => stores(zone, p))
          .map((p) =>
            el('div', 'info-row', de.info.stockLine(de.products[p], stockOf(zone, p), cap)),
          ),
      );
      for (const { side, b } of gateButtons) {
        b.classList.toggle('is-active', zone.gate === side);
        b.setAttribute('aria-pressed', String(zone.gate === side));
      }
      return { title: siteLabel(state, zoneId) };
    },
  };
}

/** Gebäude: Export-Ausfahrt mit Preisen, sonst nur der Name. */
export function buildingInfo(buildingId: number): InfoContent {
  const root = el('div', 'info-content');
  const prices = Object.entries(goodsConfig.exportPriceCents) as [
    keyof typeof de.products,
    number,
  ][];
  return {
    root,
    update(state: GameState) {
      const building = state.buildings.find((b) => b.id === buildingId);
      if (!building) return null;
      if (building.type === 'exportExit' && root.childElementCount === 0) {
        const list = prices.map(([p, cents]) =>
          de.info.exitPrice(de.products[p], formatEuro(cents)),
        );
        root.append(el('p', 'info-note', de.info.exitAccepts(list.join(', '))));
      }
      return { title: siteLabel(state, buildingId) };
    },
  };
}
