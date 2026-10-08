import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { worldConfig } from '../../config/world';
import type { GameState } from '../../sim/state/gameState';
import { cameraPosition, type CameraRig } from '../camera/cameraRig';
import { GroundPicker } from '../camera/groundPicker';
import { BuildingsView } from '../views/buildingsView';
import { routeColorOf } from '../views/routeColors';
import { RouteLineView, type RouteLine } from '../views/routeLineView';
import { GhostView, type Ghost } from '../views/ghostView';
import { RoadsView } from '../views/roadsView';
import { SitesView } from '../views/sitesView';
import { StockView } from '../views/stockView';
import { ExternalTrafficView } from '../views/externalTrafficView';
import { VehiclesView } from '../views/vehiclesView';
import { palette } from './palette';
import { createTerrain } from './terrain';

/** Besitzt Three.js-Renderer, Szene und Kamera. Liest nur, ändert nie den Spielzustand. */
export class GameRenderer {
  readonly camera = new PerspectiveCamera(45, 1, 0.5, 1200);
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly buildings = new BuildingsView();
  private readonly roads = new RoadsView();
  private readonly sites = new SitesView();
  private readonly stock = new StockView();
  private readonly vehicles = new VehiclesView();
  private readonly external = new ExternalTrafficView();
  private readonly ghost = new GhostView();
  /** Weg des ausgewählten Fahrzeugs (jedes Bild) und Wege aller Fahrzeuge (gedrosselt). */
  private readonly routeLine = new RouteLineView(512, 0.2, 6);
  private readonly allRoutes = new RouteLineView(40_000, 0.12, 5);
  private allRoutesAt = -Infinity;
  private readonly picker: GroundPicker;
  private readonly projected = new Vector3();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.scene.background = new Color(palette.sky);
    // Dunst am Horizont: das Umland läuft weich aus.
    this.scene.fog = new Fog(palette.sky, 260, 900);
    this.addLights();
    this.scene.add(
      createTerrain(),
      this.roads.root,
      this.sites.root,
      this.stock.root,
      this.vehicles.root,
      this.external.root,
      this.buildings.root,
      this.ghost.root,
      this.routeLine.root,
      this.allRoutes.root,
    );
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

  /** Gleicht die Szene mit dem Zustand ab (baut nur bei Änderungen neu). */
  syncWorld(state: Readonly<GameState>, alpha = 0): void {
    this.buildings.sync(state.buildings);
    this.roads.sync(state.roads);
    this.sites.sync(state);
    this.stock.sync(state.zones);
    this.vehicles.sync(state, alpha);
    this.external.sync(state.tick, alpha);
  }

  /** Vorschau des Bauwerkzeugs; null blendet sie aus. */
  setGhost(ghost: readonly Ghost[]): void {
    this.ghost.show(ghost);
  }

  /**
   * Fahrwege (T2.1): der des ausgewählten Fahrzeugs immer, auf Wunsch die aller Fahrzeuge
   * (höchstens alle 250 ms neu berechnet). Farbe nach Tour, Automatik grau.
   */
  setRoutes(
    selectedId: number | null,
    all: boolean,
    state: Readonly<GameState>,
    now: number,
  ): void {
    const v = selectedId === null ? undefined : state.vehicles.find((x) => x.id === selectedId);
    const pose = v ? this.vehicles.positionOf(v.id) : null;
    this.routeLine.show(
      v && pose && v.route.length > 1
        ? [{ from: pose, cells: v.route.slice(1), color: routeColorOf(state, v) }]
        : [],
    );
    if (!all) {
      this.allRoutes.show([]);
      this.allRoutesAt = -Infinity;
      return;
    }
    if (now - this.allRoutesAt < 250) return;
    this.allRoutesAt = now;
    const lines: RouteLine[] = [];
    for (const x of state.vehicles) {
      const at = this.vehicles.positionOf(x.id);
      if (at && x.route.length > 1)
        lines.push({ from: at, cells: x.route.slice(1), color: routeColorOf(state, x) });
    }
    this.allRoutes.show(lines);
  }

  /** Bodenpunkt unter einer Bildschirmposition (Kamera vom letzten Bild). */
  pickGround(clientX: number, clientY: number): { x: number; z: number } | null {
    return this.picker.pick(clientX, clientY);
  }

  /** Bildschirmposition eines Weltpunkts oder null, wenn er hinter der Kamera liegt. */
  projectToScreen(x: number, y: number, z: number): { x: number; y: number } | null {
    const p = this.projected.set(x, y, z).project(this.camera);
    if (p.z > 1) return null;
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + ((p.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - p.y) / 2) * rect.height,
    };
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
