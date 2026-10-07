import type { SimEvent, SimEventOf, SimEventType } from './events';

type Listener<T extends SimEventType> = (event: SimEventOf<T>) => void;
type AnyListener = (event: SimEvent) => void;

/**
 * Ereignis-Bus: Systeme melden Ereignisse während eines Schritts mit `emit`.
 * Erst `flush` am Schrittende verteilt sie in Meldereihenfolge an die Zuhörer.
 * So sieht kein Zuhörer einen halb fertig gerechneten Schritt.
 */
export class EventBus {
  private pending: SimEvent[] = [];
  private readonly listeners = new Map<SimEventType, AnyListener[]>();
  private readonly allListeners: AnyListener[] = [];

  emit(event: SimEvent): void {
    this.pending.push(event);
  }

  /** Meldet einen Zuhörer für einen Ereignistyp an; Rückgabe meldet ihn wieder ab. */
  on<T extends SimEventType>(type: T, listener: Listener<T>): () => void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener as AnyListener);
    this.listeners.set(type, list);
    return () => remove(list, listener as AnyListener);
  }

  /** Zuhörer für alle Ereignisse (z. B. Protokoll, Tests). */
  onAny(listener: AnyListener): () => void {
    this.allListeners.push(listener);
    return () => remove(this.allListeners, listener);
  }

  /** Verteilt alle gesammelten Ereignisse; während der Verteilung gemeldete kommen danach dran. */
  flush(): void {
    while (this.pending.length > 0) {
      const batch = this.pending;
      this.pending = [];
      for (const event of batch) {
        for (const listener of [...(this.listeners.get(event.type) ?? [])]) listener(event);
        for (const listener of [...this.allListeners]) listener(event);
      }
    }
  }

  get pendingCount(): number {
    return this.pending.length;
  }
}

function remove<T>(list: T[], item: T): void {
  const index = list.indexOf(item);
  if (index >= 0) list.splice(index, 1);
}
