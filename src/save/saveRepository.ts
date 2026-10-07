import { saveConfig } from '../config/save';
import type { GameState } from '../sim/state/gameState';
import type { SaveEntry, SaveStorage } from './backends/saveStorage';
import { createSave, parseSave, serializeSave, type ParseResult } from './format';

export interface RepositoryOptions {
  gameVersion: string;
  now?: () => Date;
  backupCount?: number;
}

const newestFirst = (a: SaveEntry, b: SaveEntry): number => b.savedAt.localeCompare(a.savedAt);

/**
 * Spielstände verwalten: benannte Slots (beliebig viele) und rotierende Autosave-Backups.
 * Der Spielstand wird immer erst vollständig erzeugt und geprüft, dann in einem Schritt
 * geschrieben. Schlägt etwas fehl, bleibt der vorherige Stand unverändert.
 */
export class SaveRepository {
  private readonly now: () => Date;
  private counter = 0;

  constructor(
    private readonly storage: SaveStorage,
    private readonly options: RepositoryOptions,
  ) {
    this.now = options.now ?? (() => new Date());
  }

  private newId(prefix: string, at: Date): string {
    this.counter += 1;
    return `${prefix}-${at.getTime().toString(36)}-${this.counter.toString(36)}`;
  }

  /** Speichert in einen Slot; mit `overwriteId` wird ein vorhandener Slot ersetzt. */
  async saveSlot(state: GameState, name: string, overwriteId?: string): Promise<SaveEntry> {
    const at = this.now();
    const save = createSave(state, name.trim(), this.options.gameVersion, at);
    const data = serializeSave(save);
    const entry: SaveEntry = {
      id: overwriteId ?? this.newId('slot', at),
      kind: 'slot',
      savedAt: save.createdAt,
      meta: save.meta,
    };
    await this.storage.put(entry, data);
    return entry;
  }

  /** Autosave-Backup: neues schreiben, danach die ältesten über der Höchstzahl löschen. */
  async writeBackup(state: GameState, name: string): Promise<SaveEntry> {
    const at = this.now();
    const save = createSave(state, name, this.options.gameVersion, at);
    const data = serializeSave(save);
    const entry: SaveEntry = {
      id: this.newId('backup', at),
      kind: 'backup',
      savedAt: save.createdAt,
      meta: save.meta,
    };
    await this.storage.put(entry, data);
    const keep = this.options.backupCount ?? saveConfig.backupCount;
    const all = (await this.storage.list('backup')).sort(newestFirst);
    for (const old of all.slice(keep)) await this.storage.remove(old.id);
    return entry;
  }

  async listSlots(): Promise<SaveEntry[]> {
    return (await this.storage.list('slot')).sort(newestFirst);
  }

  async listBackups(): Promise<SaveEntry[]> {
    return (await this.storage.list('backup')).sort(newestFirst);
  }

  async load(id: string): Promise<ParseResult> {
    const data = await this.storage.read(id);
    if (data === undefined) return { ok: false, error: 'notJson' };
    return parseSave(data);
  }

  async remove(id: string): Promise<void> {
    await this.storage.remove(id);
  }

  /** Text für den Datei-Export (gleiches Format wie die Slots). */
  exportText(state: GameState, name: string): string {
    return serializeSave(createSave(state, name, this.options.gameVersion, this.now()));
  }
}
