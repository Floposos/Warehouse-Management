import type { GameState } from '../sim/state/gameState';
import { migrateSave } from './migrations';
import { validateState } from './validate';

export const SAVE_FORMAT = 'logistikum-save';
/** Steigt bei jeder Änderung am Zustandsmodell; dazu Migration + Beispiel-Spielstand. */
export const CURRENT_SAVE_VERSION = 2;

/** Kurzinfos für Listen, ohne den ganzen Zustand lesen zu müssen. */
export interface SaveMeta {
  name: string;
  tick: number;
  balanceCents: number;
}

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  saveVersion: number;
  gameVersion: string;
  /** ISO-Zeitstempel (Echtzeit) des Speicherns. */
  createdAt: string;
  meta: SaveMeta;
  state: GameState;
}

export type SaveErrorCode =
  'notJson' | 'wrongFormat' | 'tooNew' | 'invalidVersion' | 'migrationFailed' | 'invalidState';

export type ParseResult = { ok: true; save: SaveFile } | { ok: false; error: SaveErrorCode };

/** Erzeugt einen Spielstand als tiefe Kopie (spätere Änderungen am Spiel wirken nicht hinein). */
export function createSave(
  state: GameState,
  name: string,
  gameVersion: string,
  now: Date,
): SaveFile {
  const copy = JSON.parse(JSON.stringify(state)) as GameState;
  return {
    format: SAVE_FORMAT,
    saveVersion: CURRENT_SAVE_VERSION,
    gameVersion,
    createdAt: now.toISOString(),
    meta: { name, tick: copy.tick, balanceCents: copy.finance.balanceCents },
    state: copy,
  };
}

/**
 * Wandelt einen Spielstand in Text und prüft ihn sofort durch Zurücklesen.
 * So wird nie ein Stand geschrieben, der sich nicht wieder laden ließe.
 */
export function serializeSave(save: SaveFile): string {
  const text = JSON.stringify(save);
  const check = parseSave(text);
  if (!check.ok) throw new Error(`Spielstand ungültig: ${check.error}`);
  return text;
}

/** Liest einen Spielstand, führt nötige Migrationen aus und prüft das Ergebnis. */
export function parseSave(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'wrongFormat' };
  const obj = raw as Record<string, unknown>;
  if (obj['format'] !== SAVE_FORMAT) return { ok: false, error: 'wrongFormat' };
  const version = obj['saveVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: 'invalidVersion' };
  }
  if (version > CURRENT_SAVE_VERSION) return { ok: false, error: 'tooNew' };
  let migrated: Record<string, unknown>;
  try {
    migrated = migrateSave(obj, CURRENT_SAVE_VERSION);
  } catch {
    return { ok: false, error: 'migrationFailed' };
  }
  if (!validateState(migrated['state']) || !isMeta(migrated['meta'])) {
    return { ok: false, error: 'invalidState' };
  }
  return { ok: true, save: migrated as unknown as SaveFile };
}

function isMeta(meta: unknown): meta is SaveMeta {
  if (typeof meta !== 'object' || meta === null) return false;
  const m = meta as Record<string, unknown>;
  return (
    typeof m['name'] === 'string' &&
    typeof m['tick'] === 'number' &&
    typeof m['balanceCents'] === 'number'
  );
}
