import type { SaveMeta } from '../format';

export type SaveKind = 'slot' | 'backup';

/** Listeneintrag eines Spielstands (ohne den eigentlichen Inhalt). */
export interface SaveEntry {
  id: string;
  kind: SaveKind;
  /** ISO-Zeitstempel des Speicherns (Echtzeit). */
  savedAt: string;
  meta: SaveMeta;
}

/**
 * Ablage für Spielstände. `put` muss atomar sein: Eintrag und Inhalt werden
 * ganz oder gar nicht geschrieben (IndexedDB: eine Transaktion).
 */
export interface SaveStorage {
  list(kind: SaveKind): Promise<SaveEntry[]>;
  read(id: string): Promise<string | undefined>;
  put(entry: SaveEntry, data: string): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Ablage im Arbeitsspeicher (Tests; Rückfall, falls IndexedDB fehlt). */
export class MemorySaveStorage implements SaveStorage {
  readonly entries = new Map<string, { entry: SaveEntry; data: string }>();

  list(kind: SaveKind): Promise<SaveEntry[]> {
    const result = [...this.entries.values()].map((e) => e.entry).filter((e) => e.kind === kind);
    return Promise.resolve(structuredClone(result));
  }

  read(id: string): Promise<string | undefined> {
    return Promise.resolve(this.entries.get(id)?.data);
  }

  put(entry: SaveEntry, data: string): Promise<void> {
    this.entries.set(entry.id, { entry: structuredClone(entry), data });
    return Promise.resolve();
  }

  remove(id: string): Promise<void> {
    this.entries.delete(id);
    return Promise.resolve();
  }
}
