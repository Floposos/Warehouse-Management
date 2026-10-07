import { Dialog } from '../components/dialog';
import { button, el } from '../components/dom';
import { saveList, type SaveListItem } from '../components/saveList';
import { de } from '../texts/de';

export interface BackupFileView {
  status: 'unsupported' | 'none' | 'ready' | 'needsPermission';
  fileName: string | null;
}

export interface SaveDialogOptions {
  defaultName: string;
  slots: readonly SaveListItem[];
  backupFile: BackupFileView;
  /** Speichert; mit `overwrite` wird der genannte Slot ersetzt. */
  save(name: string, overwrite?: SaveListItem): void;
  exportFile(): void;
  chooseBackupFile(): Promise<BackupFileView>;
  reconnectBackupFile(): Promise<BackupFileView>;
  onClose(): void;
}

/** Dialog „Spielstand speichern“: Name vergeben, überschreiben, exportieren, Sicherungsdatei. */
export function openSaveDialog(root: HTMLElement, options: SaveDialogOptions): Dialog {
  let saved = false;
  const dialog = new Dialog(root, de.save.saveTitle, options.onClose);
  const finish = (name: string, overwrite?: SaveListItem): void => {
    if (saved) return;
    saved = true;
    dialog.close();
    options.save(name, overwrite);
  };

  const form = el('form', 'save-form');
  const label = el('label', '', de.save.nameLabel);
  const input = el('input');
  input.id = 'save-name';
  input.maxLength = 60;
  input.value = options.defaultName;
  label.htmlFor = input.id;
  const submit = el('button', 'btn btn-primary', de.save.saveButton);
  submit.type = 'submit';
  form.append(label, el('div', 'save-form-row'));
  form.lastElementChild?.append(input, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (name) finish(name);
  });

  dialog.body.append(form);
  if (options.slots.length > 0) {
    dialog.body.append(
      el('p', 'save-hint', de.save.overwriteHint),
      saveList(options.slots, '', [
        { label: de.save.overwriteConfirm, onClick: (item) => finish(item.name, item) },
      ]),
    );
  }
  const backup = el('section', 'backup-file');
  renderBackupFile(backup, options.backupFile, options);
  dialog.body.append(backup);
  dialog.setButtons([
    { label: de.save.export, onClick: () => options.exportFile() },
    { label: de.common.close, onClick: () => dialog.close() },
  ]);
  setTimeout(() => input.select(), 0);
  return dialog;
}

function renderBackupFile(
  section: HTMLElement,
  view: BackupFileView,
  options: SaveDialogOptions,
): void {
  const t = de.save.backupFile;
  const name = view.fileName ?? '';
  const status: Record<BackupFileView['status'], string> = {
    unsupported: t.unsupported,
    none: t.none,
    ready: t.ready(name),
    needsPermission: t.needsPermission(name),
  };
  const statusLine = el('p', 'backup-file-status', status[view.status]);
  statusLine.dataset['testid'] = 'backup-file-status';
  section.replaceChildren(el('h3', '', t.title));
  if (view.status !== 'unsupported') section.append(el('p', 'save-hint', t.explain));
  section.append(statusLine);
  if (view.status === 'unsupported') return;
  const rerender = (next: Promise<BackupFileView>) => () =>
    void next.then((v) => renderBackupFile(section, v, options));
  const actions = el('div', 'backup-file-actions');
  if (view.status === 'needsPermission') {
    actions.append(
      button(t.reconnect, () => rerender(options.reconnectBackupFile())(), 'btn btn-primary'),
    );
  }
  actions.append(
    button(view.status === 'none' ? t.choose : t.change, () =>
      rerender(options.chooseBackupFile())(),
    ),
  );
  section.append(actions);
}
