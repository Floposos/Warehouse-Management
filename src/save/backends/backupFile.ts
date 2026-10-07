/**
 * Sicherungsdatei über die File System Access API (Chrome/Edge).
 * Der Browser schreibt in eine Temporärdatei und ersetzt das Original erst beim
 * Abschluss (`close`); bricht etwas ab, bleibt die alte Datei unversehrt.
 * Nach einem Browser-Neustart muss der Zugriff einmal per Klick bestätigt werden.
 */

interface WritableLike {
  write(data: string): Promise<void>;
  close(): Promise<void>;
  abort?(): Promise<void>;
}

export interface FileHandleLike {
  name: string;
  createWritable(): Promise<WritableLike>;
  queryPermission?(options: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission?(options: { mode: 'readwrite' }): Promise<PermissionState>;
}

interface PickerWindow {
  showSaveFilePicker(options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }): Promise<FileHandleLike>;
}

export interface ValueStore {
  getValue(key: string): Promise<unknown>;
  setValue(key: string, value: unknown): Promise<void>;
}

export type BackupFileStatus = 'unsupported' | 'none' | 'ready' | 'needsPermission';

const HANDLE_KEY = 'backupFileHandle';

export function isBackupFileSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window && window.isSecureContext;
}

export class BackupFile {
  private handle: FileHandleLike | null = null;
  status: BackupFileStatus = isBackupFileSupported() ? 'none' : 'unsupported';

  constructor(private readonly store: ValueStore | null) {}

  get fileName(): string | null {
    return this.handle?.name ?? null;
  }

  /** Beim Start: früher gewählte Datei wiederfinden und Zugriff prüfen (ohne Nachfrage). */
  async restore(): Promise<BackupFileStatus> {
    if (this.status === 'unsupported' || !this.store) return this.status;
    const stored = (await this.store.getValue(HANDLE_KEY)) as FileHandleLike | undefined;
    if (!stored) return (this.status = 'none');
    this.handle = stored;
    const permission = (await stored.queryPermission?.({ mode: 'readwrite' })) ?? 'granted';
    this.status = permission === 'granted' ? 'ready' : 'needsPermission';
    return this.status;
  }

  /** Datei wählen lassen (nur nach einem Klick möglich). False bei Abbruch. */
  async choose(suggestedName: string, description: string): Promise<boolean> {
    if (this.status === 'unsupported') return false;
    try {
      const picker = window as unknown as PickerWindow;
      this.handle = await picker.showSaveFilePicker({
        suggestedName,
        types: [{ description, accept: { 'application/json': ['.json'] } }],
      });
    } catch {
      return false;
    }
    await this.store?.setValue(HANDLE_KEY, this.handle);
    this.status = 'ready';
    return true;
  }

  /** Zugriff nach Browser-Neustart erneut erlauben (nur nach einem Klick möglich). */
  async reconnect(): Promise<boolean> {
    if (!this.handle) return false;
    const permission = (await this.handle.requestPermission?.({ mode: 'readwrite' })) ?? 'granted';
    this.status = permission === 'granted' ? 'ready' : 'needsPermission';
    return this.status === 'ready';
  }

  async write(text: string): Promise<void> {
    if (!this.handle || this.status !== 'ready') throw new Error('Keine Sicherungsdatei bereit');
    const writable = await this.handle.createWritable();
    try {
      await writable.write(text);
      await writable.close();
    } catch (error) {
      await writable.abort?.().catch(() => undefined);
      throw error;
    }
  }

  async forget(): Promise<void> {
    this.handle = null;
    this.status = isBackupFileSupported() ? 'none' : 'unsupported';
    await this.store?.setValue(HANDLE_KEY, undefined);
  }
}
