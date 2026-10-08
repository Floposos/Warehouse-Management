import { eventsConfig } from '../../config/events';
import type { EventBus } from '../core/eventBus';
import type { GameState } from '../state/gameState';

/** Arten von Meldungen; Texte in ui/texts. */
export type NoticeKind = 'jam' | 'breakdown' | 'noWorkshop' | 'leaseRenewed';
export const NOTICE_KINDS: readonly NoticeKind[] = [
  'jam',
  'breakdown',
  'noWorkshop',
  'leaseRenewed',
];

/** Meldung mit Ort (Sprung dorthin) und optional dem betroffenen Fahrzeug. */
export interface Notice {
  id: number;
  tick: number;
  kind: NoticeKind;
  x: number;
  z: number;
  vehicleId: number | null;
}

/**
 * Meldung aufnehmen (Ereignis-Grundsystem, T2.4/T2.6). Dieselbe Art in der Nähe kurz
 * hintereinander wird zusammengefasst, damit ein großer Stau nicht die Liste füllt.
 * Liefert die Meldung oder null, wenn sie zusammengefasst wurde.
 */
export function addNotice(
  state: GameState,
  bus: EventBus,
  data: Omit<Notice, 'id' | 'tick'>,
): Notice | null {
  const { noticeMergeTicks, noticeMergeDistance, maxNotices } = eventsConfig;
  const similar = state.notices.some(
    (n) =>
      n.kind === data.kind &&
      state.tick - n.tick < noticeMergeTicks &&
      Math.abs(n.x - data.x) + Math.abs(n.z - data.z) <= noticeMergeDistance,
  );
  if (similar) return null;
  const notice: Notice = { id: state.nextId++, tick: state.tick, ...data };
  state.notices.push(notice);
  if (state.notices.length > maxNotices) state.notices.splice(0, state.notices.length - maxNotices);
  bus.emit({ type: 'notice/added', notice });
  return notice;
}
