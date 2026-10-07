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
