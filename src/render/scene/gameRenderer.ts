import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { worldConfig } from '../../config/world';
import type { Building } from '../../sim/state/gameState';
import { cameraPosition, type CameraRig } from '../camera/cameraRig';
import { GroundPicker } from '../camera/groundPicker';
import { BuildingsView } from '../views/buildingsView';
import { GhostView, type Ghost } from '../views/ghostView';
import { palette } from './palette';
import { createTerrain } from './terrain';

/** Besitzt Three.js-Renderer, Szene und Kamera. Liest nur, ändert nie den Spielzustand. */
export class GameRenderer {
  readonly camera = new PerspectiveCamera(45, 1, 0.5, 1200);
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly buildings = new BuildingsView();
  private readonly ghost = new GhostView();
  private readonly picker: GroundPicker;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.scene.background = new Color(palette.sky);
    // Dunst am Horizont: das Umland läuft weich aus.
    this.scene.fog = new Fog(palette.sky, 260, 900);
    this.addLights();
    this.scene.add(createTerrain(), this.buildings.root, this.ghost.root);
    this.picker = new GroundPicker(this.camera, canvas);
    this.resize();
  }

  private addLights(): void {
    const { campusWidth: w, campusDepth: d } = worldConfig;
    this.scene.add(new HemisphereLight(0xffffff, 0xcfe3c0, 1.9));
    const sun = new DirectionalLight(0xfff6e8, 1.6);
    sun.position.set(w / 2 + 60, 120, d / 2 + 40);
    sun.target.position.set(w / 2, 0, d / 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const half = Math.max(w, d) * 0.75;
    Object.assign(sun.shadow.camera, {
      left: -half,
      right: half,
      top: half,
      bottom: -half,
      far: 400,
    });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun, sun.target);
  }

  syncBuildings(buildings: readonly Building[]): void {
    this.buildings.sync(buildings);
  }

  /** Vorschau des Bauwerkzeugs; null blendet sie aus. */
  setGhost(ghost: Ghost | null): void {
    this.ghost.show(ghost);
  }

  /** Bodenpunkt unter einer Bildschirmposition (Kamera vom letzten Bild). */
  pickGround(clientX: number, clientY: number): { x: number; z: number } | null {
    return this.picker.pick(clientX, clientY);
  }

  render(rig: CameraRig): void {
    const p = cameraPosition(rig);
    this.camera.position.set(p.x, p.y, p.z);
    this.camera.lookAt(rig.targetX, 0, rig.targetZ);
    this.renderer.render(this.scene, this.camera);
  }

  /** Passt die Auflösung an die Fenstergröße an. */
  resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
  }

  /** Zeichenaufrufe des letzten Bilds (für die Leistungsanzeige). */
  get drawCalls(): number {
    return this.renderer.info.render.calls;
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
