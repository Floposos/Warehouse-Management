/** Datei-Export (Download) und -Import (Dateiauswahl) für Spielstände. */

/** Sichere Dateinamen, z. B. „logistikum-Mein-Campus-2000-01-03.json“. */
export function exportFileName(name: string, gameDate: string): string {
  const clean = name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  return `logistikum-${clean || 'spielstand'}-${gameDate}.json`;
}

export function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Öffnet die Dateiauswahl und liefert den Text der gewählten Datei (null bei Abbruch). */
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}
