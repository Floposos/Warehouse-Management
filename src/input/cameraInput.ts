import { cameraConfig } from '../config/camera';
import { pan, rotate, tilt, zoom, type Bounds, type CameraRig } from '../render/camera/cameraRig';

export interface CameraInputOptions {
  canvas: HTMLCanvasElement;
  rig: CameraRig;
  bounds: Bounds;
  /** Kamera-Empfindlichkeit aus den Einstellungen (1 = normal). */
  sensitivity: () => number;
  /** Rand-Scrollen an/aus aus den Einstellungen. */
  edgeScroll: () => boolean;
}

/** Feld pro Pixel bei Abstand 1 und 45° Blickwinkel: 2 · tan(22,5°). */
const VIEW_FACTOR = 2 * Math.tan((22.5 * Math.PI) / 180);

const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  // Physische Tasten: KeyZ ist auf deutscher Tastatur das „Y“.
  rotateLeft: ['KeyZ'],
  rotateRight: ['KeyX'],
  tiltUp: ['KeyR'],
  tiltDown: ['KeyF'],
  zoomIn: ['KeyE', 'Equal', 'NumpadAdd', 'BracketRight'],
  zoomOut: ['KeyQ', 'Minus', 'NumpadSubtract', 'Slash'],
} as const;
const ALL_KEYS = new Set<string>(Object.values(KEYS).flat());

/**
 * Kamerasteuerung im Aufbauspiel-Stil (Entscheidung 07.10.2026):
 * rechte Taste ziehen = drehen/neigen, mittlere Taste ziehen = verschieben, Rad = zoomen,
 * WASD/Pfeile = verschieben, Rand-Scrollen. Florian 07.10.2026: Q/E zoomen (E hinein,
 * Q heraus), R/F neigen. ANNAHME: Y/X drehen (vorher Q/E), +/− zoomen zusätzlich.
 * Linke Taste bleibt frei für Bauen und Auswählen.
 */
export class CameraInput {
  enabled = false;
  private readonly held = new Set<string>();
  private drag: { button: number; x: number; y: number } | null = null;
  private pointer: { x: number; y: number; overCanvas: boolean } | null = null;
  private readonly cleanup: (() => void)[] = [];

  constructor(private readonly options: CameraInputOptions) {
    const { canvas } = options;
    this.listen(canvas, 'pointerdown', (e) => this.onPointerDown(e));
    this.listen(window, 'pointermove', (e) => this.onPointerMove(e));
    this.listen(window, 'pointerup', () => (this.drag = null));
    this.listen(canvas, 'wheel', (e) => this.onWheel(e), { passive: false });
    this.listen(canvas, 'contextmenu', (e) => e.preventDefault());
    this.listen(window, 'keydown', (e) => this.onKey(e, true));
    this.listen(window, 'keyup', (e) => this.onKey(e, false));
    this.listen(window, 'blur', () => this.releaseAll());
    this.listen(document.documentElement, 'pointerleave', () => (this.pointer = null));
  }

  private listen<K extends keyof WindowEventMap>(
    target: Window | HTMLElement,
    type: K,
    handler: (e: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    const fn = handler as EventListener;
    target.addEventListener(type, fn, options);
    this.cleanup.push(() => target.removeEventListener(type, fn));
  }

  private get speed(): number {
    return this.options.sensitivity();
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.enabled || (e.button !== 1 && e.button !== 2)) return;
    e.preventDefault();
    this.drag = { button: e.button, x: e.clientX, y: e.clientY };
  }

  private onPointerMove(e: PointerEvent): void {
    this.pointer = { x: e.clientX, y: e.clientY, overCanvas: e.target === this.options.canvas };
    if (!this.drag || !this.enabled) return;
    const dx = e.clientX - this.drag.x;
    const dy = e.clientY - this.drag.y;
    this.drag.x = e.clientX;
    this.drag.y = e.clientY;
    const { rig, bounds } = this.options;
    if (this.drag.button === 2) {
      rotate(rig, -dx * cameraConfig.rotateDegPerPixel * this.speed);
      tilt(rig, dy * cameraConfig.tiltDegPerPixel * this.speed);
    } else {
      const perPixel = this.fieldsPerPixel();
      pan(rig, -dx * perPixel, dy * perPixel, bounds);
    }
  }

  private onWheel(e: WheelEvent): void {
    if (!this.enabled) return;
    e.preventDefault();
    const steps = (e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY) / 100;
    zoom(this.options.rig, Math.pow(cameraConfig.zoomPerWheelStep, steps * this.speed));
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    if (!ALL_KEYS.has(e.code)) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (down) this.held.add(e.code);
    else this.held.delete(e.code);
  }

  private fieldsPerPixel(): number {
    return (
      (this.options.rig.distance * VIEW_FACTOR) / Math.max(this.options.canvas.clientHeight, 1)
    );
  }

  private axis(plus: readonly string[], minus: readonly string[]): number {
    const has = (codes: readonly string[]): boolean => codes.some((c) => this.held.has(c));
    return (has(plus) ? 1 : 0) - (has(minus) ? 1 : 0);
  }

  /** Pro Bild aufrufen: wendet gehaltene Tasten und Rand-Scrollen an. */
  update(dtSeconds: number): void {
    if (!this.enabled) return;
    const { rig, bounds, canvas } = this.options;
    const s = this.speed * dtSeconds;
    let right = this.axis(KEYS.right, KEYS.left);
    let forward = this.axis(KEYS.forward, KEYS.back);
    if (this.options.edgeScroll() && this.pointer?.overCanvas && !this.drag) {
      const m = cameraConfig.edgeScrollPixels;
      const { x, y } = this.pointer;
      if (x <= m) right -= 1;
      if (x >= canvas.clientWidth - m) right += 1;
      if (y <= m) forward += 1;
      if (y >= canvas.clientHeight - m) forward -= 1;
    }
    if (right !== 0 || forward !== 0) {
      const screens = cameraConfig.panScreensPerSecond * s;
      const fields = screens * rig.distance * VIEW_FACTOR;
      pan(rig, Math.sign(right) * fields, Math.sign(forward) * fields, bounds);
    }
    rotate(
      rig,
      this.axis(KEYS.rotateRight, KEYS.rotateLeft) * cameraConfig.keyRotateDegPerSecond * s,
    );
    tilt(rig, this.axis(KEYS.tiltUp, KEYS.tiltDown) * cameraConfig.keyTiltDegPerSecond * s);
    const z = this.axis(KEYS.zoomOut, KEYS.zoomIn);
    if (z !== 0) zoom(rig, Math.pow(cameraConfig.keyZoomPerSecond, z * s));
  }

  releaseAll(): void {
    this.held.clear();
    this.drag = null;
  }

  dispose(): void {
    for (const off of this.cleanup) off();
  }
}
