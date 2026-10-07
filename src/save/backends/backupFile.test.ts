import { describe, expect, it } from 'vitest';
import { BackupFile, type FileHandleLike } from './backupFile';

/** Nachbildung einer Datei mit Temporärdatei-Verhalten wie im Browser. */
function fakeHandle(failOnWrite = false): FileHandleLike & { content: string } {
  const handle = {
    name: 'logistikum.json',
    content: 'alt',
    createWritable: () => {
      let pending = '';
      return Promise.resolve({
        write: (data: string) => {
          if (failOnWrite) return Promise.reject(new Error('Abbruch'));
          pending = data;
          return Promise.resolve();
        },
        close: () => {
          handle.content = pending;
          return Promise.resolve();
        },
        abort: () => Promise.resolve(),
      });
    },
    queryPermission: () => Promise.resolve('prompt' as PermissionState),
    requestPermission: () => Promise.resolve('granted' as PermissionState),
  };
  return handle;
}

function storeWith(handle: FileHandleLike) {
  const values = new Map<string, unknown>([['backupFileHandle', handle]]);
  return {
    getValue: (k: string) => Promise.resolve(values.get(k)),
    setValue: (k: string, v: unknown) => Promise.resolve(void values.set(k, v)),
  };
}

describe('BackupFile', () => {
  it('ist ohne File System Access (z. B. Firefox, Tests) nicht verfügbar', async () => {
    const file = new BackupFile(null);
    expect(file.status).toBe('unsupported');
    expect(await file.choose('x.json', 'x')).toBe(false);
  });

  it('braucht nach Neustart eine Bestätigung und schreibt dann', async () => {
    const handle = fakeHandle();
    const file = new BackupFile(storeWith(handle));
    file.status = 'none'; // so tun, als könne der Browser es
    expect(await file.restore()).toBe('needsPermission');
    await expect(file.write('neu')).rejects.toThrow();
    expect(await file.reconnect()).toBe(true);
    await file.write('neu');
    expect(handle.content).toBe('neu');
  });

  it('abgebrochenes Schreiben lässt die alte Datei unversehrt', async () => {
    const handle = fakeHandle(true);
    const file = new BackupFile(storeWith(handle));
    file.status = 'none';
    await file.restore();
    await file.reconnect();
    await expect(file.write('neu')).rejects.toThrow('Abbruch');
    expect(handle.content).toBe('alt');
  });
});
