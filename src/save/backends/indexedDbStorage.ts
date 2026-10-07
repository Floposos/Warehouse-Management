import type { SaveEntry, SaveKind, SaveStorage } from './saveStorage';

const DB_NAME = 'logistikum';
const DB_VERSION = 1;
const META = 'saveMeta';
const DATA = 'saveData';
/** Allgemeiner Speicher, z. B. für den Zugriff auf die Sicherungsdatei. */
export const KV = 'keyValue';

/** Öffnet (und legt bei Bedarf an) die Datenbank des Spiels. */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(DATA)) db.createObjectStore(DATA);
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB nicht verfügbar'));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Transaktion abgebrochen'));
    tx.onerror = () => reject(tx.error ?? new Error('Transaktion fehlgeschlagen'));
  });
}

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Lesen fehlgeschlagen'));
  });
}

/** Spielstände in IndexedDB; Eintrag und Inhalt in getrennten Tabellen, eine Transaktion. */
export class IndexedDbSaveStorage implements SaveStorage {
  constructor(private readonly db: IDBDatabase) {}

  async list(kind: SaveKind): Promise<SaveEntry[]> {
    const all = await result(this.db.transaction(META).objectStore(META).getAll());
    return (all as SaveEntry[]).filter((e) => e.kind === kind);
  }

  async read(id: string): Promise<string | undefined> {
    const value: unknown = await result(this.db.transaction(DATA).objectStore(DATA).get(id));
    return typeof value === 'string' ? value : undefined;
  }

  put(entry: SaveEntry, data: string): Promise<void> {
    const tx = this.db.transaction([META, DATA], 'readwrite');
    tx.objectStore(DATA).put(data, entry.id);
    tx.objectStore(META).put(entry);
    return done(tx);
  }

  remove(id: string): Promise<void> {
    const tx = this.db.transaction([META, DATA], 'readwrite');
    tx.objectStore(META).delete(id);
    tx.objectStore(DATA).delete(id);
    return done(tx);
  }

  async getValue(key: string): Promise<unknown> {
    return result(this.db.transaction(KV).objectStore(KV).get(key));
  }

  setValue(key: string, value: unknown): Promise<void> {
    const tx = this.db.transaction(KV, 'readwrite');
    tx.objectStore(KV).put(value, key);
    return done(tx);
  }
}
