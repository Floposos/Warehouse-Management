import { vehicleConfig } from '../../config/vehicles';
import { book } from '../finance/ledger';
import { addStock } from '../goods/stock';
import { zoneCapacity } from '../commands/zones';
import { driveVehicle, enterBay } from '../traffic/driving';
import type { Supplier } from './types';
import { accessCell } from '../world/access';
import { ENTRANCE } from '../world/roadNetwork';
import { outsideLane, planRoute } from './movement';
import type { VehicleCtx } from './vehicleCtx';

/**
 * Zulieferer-LKW: fahren von der Einfahrt zum Lieferort, warten auf einen Stellplatz, laden
 * ab und fahren wieder hinaus. Fällt der Lieferort weg, kehren sie um und die Ware wird
 * erstattet. Ist der Weg unterbrochen, warten sie und versuchen es regelmäßig erneut.
 * Liefert false, wenn der Zulieferer das Gelände verlassen hat.
 */
export function stepSupplier(ctx: VehicleCtx, v: Supplier): boolean {
  const zone = ctx.state.zones.find((z) => z.id === v.targetId);
  if (v.cargo && !zone) turnBack(ctx, v);
  switch (v.phase) {
    case 'toSite':
    case 'toExit': {
      const { result } = driveVehicle(ctx, v, vehicleConfig.supplierSpeed);
      if (result === 'blocked') replan(ctx, v);
      else if (result === 'arrived' && v.phase === 'toExit') {
        ctx.traffic.vacate(v);
        return false;
      } else if (result === 'arrived' && enterBay(ctx, v, v.targetId)) {
        v.phase = 'handling';
        v.timer = vehicleConfig.handlingTicks;
      }
      return true;
    }
    case 'handling':
      if (--v.timer > 0) return true;
      ctx.traffic.leaveBay(v);
      if (zone && v.cargo) {
        const quantity = Math.min(
          v.cargo.quantity,
          zoneCapacity(zone) - (zone.stock[v.cargo.product] ?? 0),
        );
        addStock(zone, v.cargo.product, quantity);
        ctx.bus.emit({
          type: 'goods/delivered',
          zoneId: zone.id,
          product: v.cargo.product,
          quantity,
        });
      }
      v.cargo = null;
      leave(ctx, v);
      return true;
    case 'noRoute':
      if (--v.timer <= 0) replan(ctx, v);
      return true;
  }
}

/** Ziel weg: bezahlte Ware erstatten und hinausfahren. */
function turnBack(ctx: VehicleCtx, v: Supplier): void {
  book(ctx.state.finance, ctx.state.tick, ctx.bus, 'rawGoods', v.paidCents, null);
  v.paidCents = 0;
  v.cargo = null;
  ctx.traffic.leaveBay(v);
  leave(ctx, v);
}

function waitNoRoute(ctx: VehicleCtx, v: Supplier): void {
  ctx.traffic.park(v);
  v.phase = 'noRoute';
  v.timer = vehicleConfig.retryTicks;
}

function leave(ctx: VehicleCtx, v: Supplier): void {
  const from = v.route[0] ?? ENTRANCE;
  const route = planRoute(ctx.traffic.network, from, ENTRANCE);
  if (!route) {
    waitNoRoute(ctx, v);
    return;
  }
  v.route = [...route, ...outsideLane().reverse()];
  v.progress = 0;
  v.phase = 'toExit';
}

function replan(ctx: VehicleCtx, v: Supplier): void {
  if (!v.cargo) {
    leave(ctx, v);
    return;
  }
  const network = ctx.traffic.network;
  const zone = ctx.state.zones.find((z) => z.id === v.targetId);
  const access = zone ? accessCell(network, zone.parts, zone.gate) : null;
  const route = access ? planRoute(network, v.route[0] ?? ENTRANCE, access) : null;
  if (!route) {
    waitNoRoute(ctx, v);
    return;
  }
  v.route = route;
  v.progress = 0;
  v.phase = 'toSite';
}
