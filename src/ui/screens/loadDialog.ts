import { Dialog } from '../components/dialog';
import { el } from '../components/dom';
import { saveList, type SaveListItem } from '../components/saveList';
import { de } from '../texts/de';

export interface LoadDialogOptions {
  slots: readonly SaveListItem[];
  backups: readonly SaveListItem[];
  /** Lädt; liefert true, wenn geladen wurde (dann schließt der Dialog ohne onClose). */
  load(item: SaveListItem): Promise<boolean>;
  /** Löscht nach Rückfrage; liefert die neue Slot-Liste. */
  remove(item: SaveListItem): Promise<readonly SaveListItem[] | null>;
  importFile(): Promise<boolean>;
  onClose(): void;
}

/** Dialog „Spielstand laden“: Speicherplätze, automatische Sicherungen, Datei-Import. */
export function openLoadDialog(root: HTMLElement, options: LoadDialogOptions): Dialog {
  let loaded = false;
  const dialog = new Dialog(root, de.save.loadTitle, () => {
    if (!loaded) options.onClose();
  });
  const finish = (ok: boolean): void => {
    if (!ok) return;
    loaded = true;
    dialog.close();
  };
  const slotsBox = el('div');
  const renderSlots = (slots: readonly SaveListItem[]): void => {
    slotsBox.replaceChildren(
      saveList(slots, de.save.empty, [
        {
          label: de.save.load,
          primary: true,
          onClick: (item) => void options.load(item).then(finish),
        },
        {
          label: de.save.delete,
          danger: true,
          onClick: (item) =>
            void options.remove(item).then((next) => {
              if (next) renderSlots(next);
            }),
        },
      ]),
    );
  };
  renderSlots(options.slots);
  dialog.body.append(
    el('h3', '', de.save.slots),
    slotsBox,
    el('h3', '', de.save.backups),
    saveList(options.backups, de.save.emptyBackups, [
      { label: de.save.load, onClick: (item) => void options.load(item).then(finish) },
    ]),
  );
  dialog.setButtons([
    { label: de.save.import, onClick: () => void options.importFile().then(finish) },
    { label: de.common.close, onClick: () => dialog.close() },
  ]);
  return dialog;
}
