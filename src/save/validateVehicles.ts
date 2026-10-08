import { isInt, isProduct, isRecord } from './validateShapes';

const SUPPLIER_PHASES = ['toSite', 'handling', 'toExit', 'noRoute'];
const TRUCK_PHASES = ['idle', 'toPickup', 'loading', 'toDropoff', 'unloading'];
const IDLE_REASONS = [null, 'noJob', 'noRoute', 'noDestination', 'noTour'];

const isCargo = (c: unknown): boolean =>
  c === null || (isRecord(c) && isProduct(c['product']) && isInt(c['quantity']));

const isJob = (j: unknown): boolean =>
  j === null ||
  (isRecord(j) &&
    isProduct(j['product']) &&
    ['fromId', 'toId', 'quantity'].every((k) => isInt(j[k])));

const isStop = (s: unknown): boolean =>
  isRecord(s) &&
  isInt(s['siteId']) &&
  (s['action'] === 'load' || s['action'] === 'unload') &&
  isProduct(s['product']);

function isTruck(v: Record<string, unknown>): boolean {
  return (
    TRUCK_PHASES.includes(v['phase'] as string) &&
    ['odometer', 'tourIndex'].every((k) => isInt(v[k])) &&
    isJob(v['job']) &&
    IDLE_REASONS.includes(v['idleReason'] as string | null) &&
    (v['tourId'] === null || isInt(v['tourId']))
  );
}

function isSupplier(v: Record<string, unknown>): boolean {
  return (
    SUPPLIER_PHASES.includes(v['phase'] as string) &&
    ['targetId', 'paidCents'].every((k) => isInt(v[k]))
  );
}

/** Feste Tour (T2.1). */
export function isTour(t: unknown): boolean {
  return (
    isRecord(t) &&
    isInt(t['id']) &&
    typeof t['name'] === 'string' &&
    isInt(t['color']) &&
    Array.isArray(t['stops']) &&
    (t['stops'] as unknown[]).every(isStop)
  );
}

/** Zulieferer und eigene LKW. */
export function isVehicle(v: unknown): boolean {
  if (!isRecord(v) || !['id', 'progress', 'timer'].every((k) => isInt(v[k]))) return false;
  const route = v['route'];
  const shared =
    Array.isArray(route) &&
    route.length > 0 &&
    route.every((c: unknown) => isRecord(c) && isInt(c['x']) && isInt(c['z'])) &&
    isCargo(v['cargo']);
  if (!shared) return false;
  if (v['kind'] === 'supplier') return isSupplier(v);
  return v['kind'] === 'truck' && isTruck(v);
}
