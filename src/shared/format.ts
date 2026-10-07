/** Formatiert einen ISO-Zeitstempel als deutsches Datum, z. B. „07.10.2026“ (Zeitzone Berlin). */
export function formatDateDe(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '–';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(date);
}

const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/** Formatiert einen Betrag in Cent als ganze Euro, z. B. „1.000.000 €“. */
export function formatEuro(cents: number): string {
  return euro.format(Math.round(cents / 100)).replace(/\s/gu, ' ');
}

/** Zweistellig mit führender Null. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
