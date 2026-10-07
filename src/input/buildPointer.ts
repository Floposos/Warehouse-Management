export interface BuildPointerActions {
  /** Mauszeiger bewegt sich über dem Spielfeld (Bildschirmkoordinaten). */
  move(clientX: number, clientY: number): void;
  /** Linksklick auf das Spielfeld. */
  click(clientX: number, clientY: number): void;
  /** Mauszeiger hat das Spielfeld verlassen. */
  leave(): void;
}

/**
 * Maus-Eingabe für die Bauwerkzeuge: nur die linke Taste (rechte und mittlere
 * gehören der Kamera). Liegt ein Bedienelement über dem Spielfeld, kommt nichts an.
 */
export function installBuildPointer(
  canvas: HTMLCanvasElement,
  actions: BuildPointerActions,
): () => void {
  const onMove = (e: PointerEvent): void => actions.move(e.clientX, e.clientY);
  const onDown = (e: PointerEvent): void => {
    if (e.button === 0) actions.click(e.clientX, e.clientY);
  };
  const onLeave = (): void => actions.leave();
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerleave', onLeave);
  return () => {
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerleave', onLeave);
  };
}
