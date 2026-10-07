import { buildingTypes } from '../content/buildings';
import type { GameState } from '../sim/state/gameState';

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

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
  if (typeof finance !== 'object' || finance === null || !isInt(finance['balanceCents'])) {
    return false;
  }
  const buildings = s['buildings'];
  if (!Array.isArray(buildings) || !Array.isArray(s['roads'])) return false;
  const roadsOk = (s['roads'] as unknown[]).every((r: unknown) => {
    if (typeof r !== 'object' || r === null) return false;
    const t = r as Record<string, unknown>;
    return isInt(t['x']) && isInt(t['z']) && isInt(t['builtTick']) && isInt(t['paidCents']);
  });
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
