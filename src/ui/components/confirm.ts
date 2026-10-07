import { de } from '../texts/de';
import { Dialog } from './dialog';
import { el } from './dom';

/** Rückfrage mit Ja/Abbrechen. Liefert true bei Bestätigung. */
export function confirmDialog(
  root: HTMLElement,
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    let result = false;
    const dialog = new Dialog(root, title, () => resolve(result));
    dialog.body.append(el('p', '', message));
    dialog.setButtons([
      { label: de.common.cancel, onClick: () => dialog.close() },
      {
        label: confirmLabel,
        danger: true,
        onClick: () => {
          result = true;
          dialog.close();
        },
      },
    ]);
  });
}

/** Einfache Meldung mit OK-Knopf. */
export function messageDialog(root: HTMLElement, title: string, message: string): void {
  const dialog = new Dialog(root, title);
  dialog.body.append(el('p', '', message));
  dialog.setButtons([{ label: de.common.ok, primary: true, onClick: () => dialog.close() }]);
}
