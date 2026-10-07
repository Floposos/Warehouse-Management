import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import { palette } from './palette';

export interface PlaceholderScene {
  dispose(): void;
}

/** Kleiner Boden mit Raster und eine Low-Poly-Halle, die Kamera kreist langsam. */
export function createPlaceholderScene(canvas: HTMLCanvasElement): PlaceholderScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  scene.background = new Color(palette.sky);
  scene.add(new AmbientLight(0xffffff, 1.6));
  const sun = new DirectionalLight(0xffffff, 1.8);
  sun.position.set(20, 30, 10);
  scene.add(sun);

  const ground = new Mesh(
    new PlaneGeometry(32, 32),
    new MeshLambertMaterial({ color: palette.ground }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const grid = new GridHelper(32, 32, palette.gridMajor, palette.gridMinor);
  grid.position.y = 0.01;
  scene.add(grid);
  scene.add(createHall());

  const camera = new PerspectiveCamera(45, 1, 0.1, 500);
  let frame = 0;
  let running = true;

  const resize = (): void => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  };

  const tick = (time: number): void => {
    if (!running) return;
    const angle = time * 0.00008;
    camera.position.set(Math.cos(angle) * 26, 16, Math.sin(angle) * 26);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };

  window.addEventListener('resize', resize);
  resize();
  frame = requestAnimationFrame(tick);

  return {
    dispose(): void {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}

/** Test-Halle, genau auf 6 × 4 Felder ausgerichtet. */
function createHall(): Group {
  const hall = new Group();
  const body = new Mesh(
    new BoxGeometry(6, 2.5, 4),
    new MeshLambertMaterial({ color: palette.hall }),
  );
  body.position.y = 1.25;
  const roof = new Mesh(
    new BoxGeometry(6.2, 0.3, 4.2),
    new MeshLambertMaterial({ color: palette.roof }),
  );
  roof.position.y = 2.65;
  hall.add(body, roof);
  return hall;
}
