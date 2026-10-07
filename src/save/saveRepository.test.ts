import { describe, expect, it } from 'vitest';
import { createInitialState } from '../sim/state/gameState';
import { MemorySaveStorage } from './backends/saveStorage';
import { SaveRepository } from './saveRepository';

function setup(backupCount = 3) {
  let t = Date.parse('2026-10-07T10:00:00Z');
  const storage = new MemorySaveStorage();
  const repo = new SaveRepository(storage, {
    gameVersion: '0.1.0',
    backupCount,
    now: () => new Date((t += 1000)),
  });
  return { storage, repo };
}

describe('SaveRepository', () => {
  it('speichert beliebig viele benannte Slots, neueste zuerst', async () => {
    const { repo } = setup();
    const state = createInitialState(1);
    await repo.saveSlot(state, 'Erster');
    state.tick = 500;
    await repo.saveSlot(state, '  Zweiter ');
    const slots = await repo.listSlots();
    expect(slots.map((s) => s.meta.name)).toEqual(['Zweiter', 'Erster']);
    const loaded = await repo.load(slots[0]?.id ?? '');
    expect(loaded.ok && loaded.save.state.tick).toBe(500);
  });

  it('überschreibt einen vorhandenen Slot', async () => {
    const { repo } = setup();
    const state = createInitialState(1);
    const first = await repo.saveSlot(state, 'A');
    state.tick = 9;
    await repo.saveSlot(state, 'A', first.id);
    const slots = await repo.listSlots();
    expect(slots).toHaveLength(1);
    expect(slots[0]?.meta.tick).toBe(9);
  });

  it('löscht Slots', async () => {
    const { repo } = setup();
    const entry = await repo.saveSlot(createInitialState(1), 'weg');
    await repo.remove(entry.id);
    expect(await repo.listSlots()).toEqual([]);
  });

  it('rotierende Backups behalten genau die gewählte Anzahl (die neuesten)', async () => {
    const { repo } = setup(3);
    const state = createInitialState(1);
    for (let i = 1; i <= 7; i++) {
      state.tick = i;
      await repo.writeBackup(state, 'Autosave');
    }
    const backups = await repo.listBackups();
    expect(backups.map((b) => b.meta.tick)).toEqual([7, 6, 5]);
    expect(await repo.listSlots()).toEqual([]);
  });

  it('abgebrochenes Speichern lässt den alten Stand unversehrt (Fehler beim Schreiben)', async () => {
    const { storage, repo } = setup();
    const state = createInitialState(1);
    const old = await repo.saveSlot(state, 'Alt');
    const before = await storage.read(old.id);
    storage.put = () => Promise.reject(new Error('Festplatte voll'));
    state.tick = 999;
    await expect(repo.saveSlot(state, 'Alt', old.id)).rejects.toThrow('Festplatte voll');
    expect(await storage.read(old.id)).toBe(before);
    expect((await repo.listSlots())[0]?.meta.tick).toBe(0);
  });

  it('abgebrochenes Speichern lässt den alten Stand unversehrt (Fehler beim Erzeugen)', async () => {
    const { storage, repo } = setup();
    const state = createInitialState(1);
    const old = await repo.saveSlot(state, 'Alt');
    const before = await storage.read(old.id);
    // Ungültiger Zustand: die Prüfung vor dem Schreiben schlägt fehl.
    (state as { tick: number }).tick = Number.NaN;
    await expect(repo.saveSlot(state, 'Alt', old.id)).rejects.toThrow();
    expect(await storage.read(old.id)).toBe(before);
  });

  it('Export-Text lässt sich wieder laden', async () => {
    const { storage, repo } = setup();
    const text = repo.exportText(createInitialState(3), 'Export');
    await storage.put(
      { id: 'x', kind: 'slot', savedAt: '', meta: { name: '', tick: 0, balanceCents: 0 } },
      text,
    );
    const loaded = await repo.load('x');
    expect(loaded.ok && loaded.save.meta.name).toBe('Export');
  });
});
