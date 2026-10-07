import type { Settings } from '../../shared/settings';
import { settingsConfig } from '../../config/settings';
import { Dialog } from '../components/dialog';
import { el } from '../components/dom';
import { de } from '../texts/de';

/** Einstellungen; jede Änderung wird sofort übernommen und gespeichert. */
export function openSettingsDialog(
  root: HTMLElement,
  current: Readonly<Settings>,
  apply: (changes: Partial<Settings>) => void,
  onClose: () => void = () => undefined,
): Dialog {
  const dialog = new Dialog(root, de.settings.title, onClose);
  const form = el('div', 'settings-form');

  const autosave = el('select');
  autosave.id = 'setting-autosave';
  for (const minutes of settingsConfig.autosaveMinutesOptions) {
    const option = el('option', '', de.settings.autosaveOption(minutes));
    option.value = String(minutes);
    option.selected = minutes === current.autosaveMinutes;
    autosave.append(option);
  }
  autosave.addEventListener('change', () => apply({ autosaveMinutes: Number(autosave.value) }));

  const sensitivity = el('input');
  sensitivity.id = 'setting-sensitivity';
  sensitivity.type = 'range';
  sensitivity.min = String(settingsConfig.cameraSensitivityMin);
  sensitivity.max = String(settingsConfig.cameraSensitivityMax);
  sensitivity.step = '0.05';
  sensitivity.value = String(current.cameraSensitivity);
  sensitivity.addEventListener('input', () =>
    apply({ cameraSensitivity: Number(sensitivity.value) }),
  );

  const edge = el('input');
  edge.id = 'setting-edge';
  edge.type = 'checkbox';
  edge.checked = current.edgeScroll;
  edge.addEventListener('change', () => apply({ edgeScroll: edge.checked }));

  form.append(
    row(de.settings.autosave, autosave),
    row(de.settings.cameraSensitivity, sensitivity),
    row(de.settings.edgeScroll, edge),
  );
  dialog.body.append(form);
  dialog.setButtons([{ label: de.common.close, primary: true, onClick: () => dialog.close() }]);
  return dialog;
}

function row(label: string, control: HTMLElement): HTMLElement {
  const wrap = el('div', 'settings-row');
  const text = el('label', '', label);
  text.htmlFor = control.id;
  wrap.append(text, control);
  return wrap;
}
