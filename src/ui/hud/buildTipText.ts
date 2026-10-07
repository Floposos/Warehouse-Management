import type { BuildPreview } from '../../input/buildTool';
import { formatEuro } from '../../shared/format';
import { de } from '../texts/de';

/** Text am Mauszeiger zur Bau-Vorschau. */
export function buildTipText(preview: BuildPreview): {
  text: string;
  kind: 'ok' | 'error';
  warning?: string;
} {
  switch (preview.kind) {
    case 'place':
      return preview.reason
        ? {
            text: `${de.build.reasons[preview.reason]} · ${de.build.cost(formatEuro(preview.costCents))}`,
            kind: 'error',
          }
        : { text: de.build.cost(formatEuro(preview.costCents)), kind: 'ok' };
    case 'road': {
      const cost = de.build.roadCost(preview.cells.length, formatEuro(preview.costCents));
      return preview.reason
        ? { text: `${de.build.reasons[preview.reason]} · ${cost}`, kind: 'error' }
        : { text: cost, kind: 'ok' };
    }
    case 'zone': {
      const f = preview.footprint;
      const cost = formatEuro(preview.costCents);
      const size = de.build.zoneSize(f.width, f.depth, preview.capacity, cost);
      if (preview.reason)
        return { text: `${de.build.reasons[preview.reason]} · ${size}`, kind: 'error' };
      const text = preview.merges ? `${size} · ${de.build.zoneMerges}` : size;
      return preview.notConnected
        ? { text, kind: 'ok', warning: de.build.notConnected }
        : { text, kind: 'ok' };
    }
    case 'demolish':
      return { text: de.build.refund(formatEuro(preview.refundCents)), kind: 'ok' };
    case 'nothingToDemolish':
      return { text: de.build.nothingToDemolish, kind: 'error' };
  }
}
