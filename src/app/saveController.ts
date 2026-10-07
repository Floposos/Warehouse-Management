import { saveConfig } from '../config/save';
import { BackupFile } from '../save/backends/backupFile';
import { downloadText, exportFileName, pickTextFile } from '../save/backends/fileTransfer';
import { IndexedDbSaveStorage, openDatabase } from '../save/backends/indexedDbStorage';
import { MemorySaveStorage, type SaveEntry } from '../save/backends/saveStorage';
import { parseSave, type ParseResult } from '../save/format';
import { SaveRepository } from '../save/saveRepository';
import { BUILD_INFO } from '../shared/buildInfo';
import { pad2 } from '../shared/format';
import { calendarAt } from '../sim/core/gameTime';
import type { GameState } from '../sim/state/gameState';
import { confirmDialog, messageDialog } from '../ui/components/confirm';
import type { SaveListItem } from '../ui/components/saveList';
import type { Toasts } from '../ui/components/toast';
import { openLoadDialog } from '../ui/screens/loadDialog';
import { openSaveDialog, type BackupFileView } from '../ui/screens/saveDialog';
import { de } from '../ui/texts/de';
import { AutosaveTimer } from './autosaveTimer';

/** Was der Speicher-Teil vom Rest der App braucht. */
export interface SaveHost {
  ui: HTMLElement;
  toasts: Toasts;
  currentState(): GameState | null;
  startGame(state: GameState): void;
  autosaveMinutes(): number;
}

const toItem = (e: SaveEntry): SaveListItem => ({
  id: e.id,
  name: e.meta.name,
  savedAt: e.savedAt,
  tick: e.meta.tick,
  balanceCents: e.meta.balanceCents,
});

/** Speichern, Laden, Export/Import, Sicherungsdatei und Autosave im Spiel bedienbar. */
export class SaveController {
  private repo = new SaveRepository(new MemorySaveStorage(), { gameVersion: BUILD_INFO.version });
  private backupFile = new BackupFile(null);
  private currentName: string | null = null;
  readonly timer: AutosaveTimer;

  constructor(private readonly host: SaveHost) {
    this.timer = new AutosaveTimer({
      intervalMs: () => host.autosaveMinutes() * 60_000,
      reminderMs: saveConfig.exportReminderMinutes * 60_000,
      autosave: () => this.autosave(),
      remind: () => this.remindExport(),
      needsReminder: () => this.backupFile.status !== 'ready',
    });
  }

  /** Öffnet die Datenbank; ohne IndexedDB bleibt es beim Arbeitsspeicher (mit Hinweis). */
  async init(): Promise<void> {
    try {
      const storage = new IndexedDbSaveStorage(await openDatabase());
      this.repo = new SaveRepository(storage, { gameVersion: BUILD_INFO.version });
      this.backupFile = new BackupFile(storage);
      await this.backupFile.restore();
    } catch {
      this.host.toasts.show(de.save.storageMissing, { kind: 'warning', durationMs: 10_000 });
    }
  }

  /** Beim Spielstart: neuen Namen merken, Timer zurücksetzen, ggf. um Dateizugriff bitten. */
  onGameStarted(name: string | null): void {
    this.currentName = name;
    this.timer.reset(this.host.currentState()?.tick ?? 0);
    if (this.backupFile.status === 'needsPermission') {
      this.host.toasts.show(de.save.backupFile.reconnectToast, {
        kind: 'warning',
        durationMs: 15_000,
        action: { label: de.save.backupFile.reconnect, onClick: () => void this.reconnect() },
      });
    }
  }

  private defaultName(state: GameState): string {
    const c = calendarAt(state.tick);
    return this.currentName ?? de.save.defaultName(`${pad2(c.day)}.${pad2(c.month)}.${c.year}`);
  }

  private backupView(): BackupFileView {
    return { status: this.backupFile.status, fileName: this.backupFile.fileName };
  }

  async openSave(onClose: () => void): Promise<void> {
    const state = this.host.currentState();
    if (!state) return onClose();
    const slots = (await this.repo.listSlots()).map(toItem);
    openSaveDialog(this.host.ui, {
      defaultName: this.defaultName(state),
      slots,
      backupFile: this.backupView(),
      save: (name, overwrite) => void this.saveSlot(name, overwrite).finally(onClose),
      exportFile: () => this.exportFile(),
      chooseBackupFile: async () => {
        if (
          await this.backupFile.choose(
            'logistikum-sicherung.json',
            de.save.backupFile.fileDescription,
          )
        ) {
          await this.autosave(true);
        }
        return this.backupView();
      },
      reconnectBackupFile: async () => {
        await this.reconnect();
        return this.backupView();
      },
      onClose,
    });
  }

  private async saveSlot(name: string, overwrite?: SaveListItem): Promise<void> {
    const state = this.host.currentState();
    if (!state) return;
    if (overwrite) {
      const ok = await confirmDialog(
        this.host.ui,
        de.save.overwriteTitle,
        de.save.overwriteMessage(overwrite.name),
        de.save.overwriteConfirm,
      );
      if (!ok) return;
    }
    try {
      await this.repo.saveSlot(state, name, overwrite?.id);
      this.currentName = name;
      this.host.toasts.show(de.save.saved, {
        kind: 'success',
        durationMs: saveConfig.savedToastMs,
      });
    } catch {
      messageDialog(this.host.ui, de.save.saveTitle, de.save.saveFailed);
    }
  }

  async openLoad(onClose: () => void): Promise<void> {
    const [slots, backups] = await Promise.all([this.repo.listSlots(), this.repo.listBackups()]);
    openLoadDialog(this.host.ui, {
      slots: slots.map(toItem),
      backups: backups.map(toItem),
      load: async (item) => this.applyLoaded(await this.repo.load(item.id), item.name),
      remove: async (item) => {
        const ok = await confirmDialog(
          this.host.ui,
          de.save.deleteTitle,
          de.save.deleteMessage(item.name),
          de.save.deleteConfirm,
        );
        if (!ok) return null;
        await this.repo.remove(item.id);
        return (await this.repo.listSlots()).map(toItem);
      },
      importFile: async () => {
        const text = await pickTextFile();
        if (text === null) return false;
        return this.applyLoaded(parseSave(text), null);
      },
      onClose,
    });
  }

  /** Startet den geladenen Stand (nach Rückfrage, falls gerade ein Spiel läuft). */
  private async applyLoaded(result: ParseResult, fallbackName: string | null): Promise<boolean> {
    if (!result.ok) {
      messageDialog(this.host.ui, de.save.errorTitle, de.save.errors[result.error]);
      return false;
    }
    if (this.host.currentState()) {
      const ok = await confirmDialog(
        this.host.ui,
        de.save.loadInGameTitle,
        de.save.loadInGameMessage,
        de.save.load,
      );
      if (!ok) return false;
    }
    this.host.startGame(result.save.state);
    const name = result.save.meta.name === de.save.autosaveName ? null : result.save.meta.name;
    this.onGameStarted(name ?? fallbackName);
    this.host.toasts.show(de.save.loaded, { kind: 'success', durationMs: saveConfig.savedToastMs });
    return true;
  }

  exportFile(): void {
    const state = this.host.currentState();
    if (!state) return;
    const name = this.defaultName(state);
    const c = calendarAt(state.tick);
    const date = `${c.year}-${pad2(c.month)}-${pad2(c.day)}`;
    downloadText(exportFileName(name, date), this.repo.exportText(state, name));
    this.timer.exported();
    this.host.toasts.show(de.save.exported, {
      kind: 'success',
      durationMs: saveConfig.savedToastMs,
    });
  }

  private async reconnect(): Promise<void> {
    if (await this.backupFile.reconnect()) await this.autosave(true);
  }

  /** Autosave: rotierende Backups im Browser, zusätzlich die Sicherungsdatei, falls aktiv. */
  async autosave(force = false): Promise<void> {
    const state = this.host.currentState();
    if (!state || (!force && !this.timer.hasProgress(state.tick))) return;
    try {
      await this.repo.writeBackup(state, de.save.autosaveName);
      if (this.backupFile.status === 'ready') {
        await this.backupFile.write(this.repo.exportText(state, this.defaultName(state)));
      }
      this.timer.saved(state.tick);
      this.host.toasts.show(de.save.autosaved, {
        kind: 'success',
        durationMs: saveConfig.savedToastMs,
      });
    } catch {
      this.host.toasts.show(de.save.autosaveFailed, { kind: 'warning', durationMs: 6000 });
    }
  }

  private remindExport(): void {
    this.host.toasts.show(de.save.exportReminder, {
      durationMs: saveConfig.exportReminderToastMs,
      action: { label: de.save.exportNow, onClick: () => this.exportFile() },
    });
  }
}
