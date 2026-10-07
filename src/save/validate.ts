import { buildingTypes } from '../content/buildings';
import { productIds, rawProducts } from '../content/products';
import { ORDER_INTERVALS, type OrderInterval } from '../sim/goods/orders';
import { zoneTypes } from '../content/zones';
import { SIDES, type Side } from '../sim/world/access';
import { BOOKING_CATEGORIES, type BookingCategory } from '../sim/finance/ledger';
import type { GameState } from '../sim/state/gameState';

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function isTotals(v: unknown): boolean {
  if (!isRecord(v) || !isInt(v['key'])) return false;
  const income = v['incomeCents'];
  const expense = v['expenseCents'];
  return (
    isRecord(income) &&
    isRecord(expense) &&
    BOOKING_CATEGORIES.every((c) => isInt(income[c]) && isInt(expense[c]))
  );
}

function isFinance(v: unknown): boolean {
  if (!isRecord(v) || !isInt(v['balanceCents']) || !Array.isArray(v['recent'])) return false;
  const bookingsOk = (v['recent'] as unknown[]).every(
    (b) =>
      isRecord(b) &&
      isInt(b['tick']) &&
      isInt(b['amountCents']) &&
      BOOKING_CATEGORIES.includes(b['category'] as BookingCategory),
  );
  return bookingsOk && isTotals(v['today']) && isTotals(v['month']);
}

function isZone(v: unknown): boolean {
  if (!isRecord(v)) return false;
  const ints = ['id', 'x', 'z', 'width', 'depth', 'builtTick', 'paidCents', 'work'];
  const stock = v['stock'];
  return (
    ints.every((k) => isInt(v[k])) &&
    typeof v['kind'] === 'string' &&
    v['kind'] in zoneTypes &&
    SIDES.includes(v['gate'] as Side) &&
    isRecord(stock) &&
    Object.entries(stock).every(
      ([p, n]) => (productIds as readonly string[]).includes(p) && isInt(n),
    )
  );
}

const isProduct = (v: unknown): boolean => (productIds as readonly unknown[]).includes(v);

function isOrder(v: unknown): boolean {
  return (
    isRecord(v) &&
    ['id', 'quantity', 'nextTick'].every((k) => isInt(v[k])) &&
    typeof v['product'] === 'string' &&
    v['product'] in rawProducts &&
    ORDER_INTERVALS.includes(v['interval'] as OrderInterval) &&
    (v['blocked'] === null || typeof v['blocked'] === 'string')
  );
}

const PHASES = ['toSite', 'handling', 'toExit', 'noRoute'];

function isVehicle(v: unknown): boolean {
  if (
    !isRecord(v) ||
    !['id', 'progress', 'targetId', 'timer', 'paidCents'].every((k) => isInt(v[k]))
  ) {
    return false;
  }
  const route = v['route'];
  const cargo = v['cargo'];
  return (
    v['kind'] === 'supplier' &&
    PHASES.includes(v['phase'] as string) &&
    Array.isArray(route) &&
    route.length > 0 &&
    route.every((c: unknown) => isRecord(c) && isInt(c['x']) && isInt(c['z'])) &&
    (cargo === null || (isRecord(cargo) && isProduct(cargo['product']) && isInt(cargo['quantity'])))
  );
}

/** Prüft die Form des Spielzustands, damit kaputte Dateien nicht ins Spiel gelangen. */
export function validateState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  const rng = s['rng'] as Record<string, unknown> | null | undefined;
  const finance = s['finance'] as Record<string, unknown> | null | undefined;
  if (!isInt(s['seed']) || !isInt(s['tick']) || (s['tick'] as number) < 0) return false;
  if (!isInt(s['nextId']) || typeof rng !== 'object' || rng === null || !isInt(rng['s'])) {
    return false;
  }
  if (!isFinance(finance)) return false;
  const buildings = s['buildings'];
  if (!Array.isArray(buildings) || !Array.isArray(s['roads'])) return false;
  const roadsOk = (s['roads'] as unknown[]).every((r: unknown) => {
    if (typeof r !== 'object' || r === null) return false;
    const t = r as Record<string, unknown>;
    return isInt(t['x']) && isInt(t['z']) && isInt(t['builtTick']) && isInt(t['paidCents']);
  });
  if (!Array.isArray(s['zones']) || !(s['zones'] as unknown[]).every(isZone)) return false;
  if (!Array.isArray(s['orders']) || !(s['orders'] as unknown[]).every(isOrder)) return false;
  if (!Array.isArray(s['vehicles']) || !(s['vehicles'] as unknown[]).every(isVehicle)) return false;
  return (
    roadsOk &&
    buildings.every((b: unknown) => {
      if (typeof b !== 'object' || b === null) return false;
      const r = b as Record<string, unknown>;
      return (
        isInt(r['id']) &&
        isInt(r['x']) &&
        isInt(r['z']) &&
        isInt(r['builtTick']) &&
        isInt(r['paidCents']) &&
        typeof r['type'] === 'string' &&
        r['type'] in buildingTypes
      );
    })
  );
}
