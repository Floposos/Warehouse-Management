export interface BuildPointerActions {
  /** Mauszeiger bewegt sich über dem Spielfeld (Bildschirmkoordinaten). */
  move(clientX: number, clientY: number): void;
  /** Linke Taste gedrückt (Klick oder Beginn des Ziehens). */
  down(clientX: number, clientY: number): void;
  /** Linke Taste losgelassen (Ende des Ziehens). */
  up(clientX: number, clientY: number): void;
  /** Mauszeiger hat das Spielfeld verlassen. */
  leave(): void;
}

/**
 * Maus-Eingabe für die Bauwerkzeuge: nur die linke Taste (rechte und mittlere
 * gehören der Kamera). Liegt ein Bedienelement über dem Spielfeld, kommt nichts an.
 * Beim Ziehen bleibt die Maus am Spielfeld „gefangen“, auch über Bedienelementen.
 */
export function installBuildPointer(
  canvas: HTMLCanvasElement,
  actions: BuildPointerActions,
): () => void {
  let dragging = false;
  const onMove = (e: PointerEvent): void => actions.move(e.clientX, e.clientY);
  const onDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    actions.down(e.clientX, e.clientY);
  };
  const onUp = (e: PointerEvent): void => {
    if (e.button !== 0 || !dragging) return;
    dragging = false;
    actions.up(e.clientX, e.clientY);
  };
  const onLeave = (): void => {
    if (!dragging) actions.leave();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  return () => {
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointerleave', onLeave);
  };
}
