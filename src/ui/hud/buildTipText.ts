import type { BuildPreview } from '../../input/buildTool';
import { formatEuro } from '../../shared/format';
import { de } from '../texts/de';

/** Text am Mauszeiger zur Bau-Vorschau. */
export function buildTipText(preview: BuildPreview): { text: string; kind: 'ok' | 'error' } {
  switch (preview.kind) {
    case 'place':
      return preview.reason
        ? {
            text: `${de.build.reasons[preview.reason]} · ${de.build.cost(formatEuro(preview.costCents))}`,
            kind: 'error',
          }
        : { text: de.build.cost(formatEuro(preview.costCents)), kind: 'ok' };
    case 'demolish':
      return { text: de.build.refund(formatEuro(preview.refundCents)), kind: 'ok' };
    case 'nothingToDemolish':
      return { text: de.build.nothingToDemolish, kind: 'error' };
  }
}
