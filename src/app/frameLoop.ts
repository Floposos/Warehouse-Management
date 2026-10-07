/**
 * Bildschleife über requestAnimationFrame. Übergibt die vergangene Echtzeit in ms,
 * begrenzt auf 250 ms (z. B. nach einem Tab-Wechsel).
 */
export function startFrameLoop(onFrame: (dtMs: number) => void): () => void {
  let last = performance.now();
  let handle = 0;
  let running = true;
  const tick = (now: number): void => {
    if (!running) return;
    const dt = Math.min(Math.max(now - last, 0), 250);
    last = now;
    onFrame(dt);
    handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);
  return () => {
    running = false;
    cancelAnimationFrame(handle);
  };
}
