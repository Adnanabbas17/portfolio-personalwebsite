// Hero 3D object: one polished black satin pebble.
// Loaded lazily by main.js on desktop fine-pointer devices only.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, SphereGeometry,
  MeshPhysicalMaterial, PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace, MathUtils,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DPR_MAX = 1.5;
const FRAME_BUDGET_MS = 45;   // average frame time above this means the device is struggling
const FLOAT_AMPLITUDE = 0.06;
const FLOAT_SPEED = 0.55;     // rad per second
const SPIN_SPEED = 0.12;      // rad per second
const POINTER_TILT = 0.22;    // max extra rotation from the cursor, rad
const POINTER_EASE = 0.045;

// Sculpt a unit sphere into a soft, slightly asymmetric pebble.
// Every term is smooth so reflections stay clean (no kinks).
function pebbleGeometry() {
  const geo = new SphereGeometry(1, 192, 144);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const swell = 1 + 0.07 * x;                  // one end fuller than the other
    const nx = 1.14 * x;
    const ny = (0.58 * y + 0.06 * y * y) * swell; // flatter underside, fuller top
    const nz = 1.0 * z * swell;
    pos.setXYZ(i, nx, ny, nz);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createHeroScene({ container, shadow, onReady, onFail }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    onFail?.(err);
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_MAX));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTexture = pmrem.fromScene(room, 0.07).texture;
  room.dispose?.();
  scene.environment = envTexture;
  scene.environmentRotation.set(-0.7, 0.9, 0);

  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.9, 5.7);
  camera.lookAt(0, 0, 0);

  const geometry = pebbleGeometry();
  const material = new MeshPhysicalMaterial({
    color: 0x0b0b0c,
    roughness: 0.55,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.18,
    ior: 1.5,
    specularIntensity: 0.25,
    envMapIntensity: 0.9,
  });
  const pebble = new Mesh(geometry, material);
  pebble.rotation.set(0.42, -0.55, -0.08);
  scene.add(pebble);

  container.appendChild(renderer.domElement);

  // State
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  let scrollProgress = 0;
  let running = false;
  let visible = true;
  let rafId = 0;
  let last = performance.now();
  let elapsed = 0;
  let frames = 0;
  let frameTimeSum = 0;
  let ready = false;
  let disposed = false;

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function renderFrame(dt) {
    elapsed += dt;
    eased.x += (pointer.x - eased.x) * POINTER_EASE;
    eased.y += (pointer.y - eased.y) * POINTER_EASE;

    const float = Math.sin(elapsed * FLOAT_SPEED) * FLOAT_AMPLITUDE;
    const s = 1 - scrollProgress * 0.14;
    pebble.position.y = float + scrollProgress * 0.25;
    pebble.rotation.x = 0.42 + eased.y * POINTER_TILT + scrollProgress * 0.5;
    pebble.rotation.y = -0.55 + elapsed * SPIN_SPEED + eased.x * POINTER_TILT;
    pebble.rotation.z = -0.08 + Math.sin(elapsed * 0.3) * 0.04;
    pebble.scale.setScalar(s);

    if (shadow) {
      // Higher object = smaller, lighter shadow.
      const lift = (float + FLOAT_AMPLITUDE) / (FLOAT_AMPLITUDE * 2); // 0..1
      const k = (1 - lift * 0.12) * s;
      shadow.style.transform = `scale(${k.toFixed(4)}, ${k.toFixed(4)})`;
      shadow.style.opacity = (1 - lift * 0.3 - scrollProgress * 0.6).toFixed(3);
    }

    renderer.render(scene, camera);
  }

  function loop(now) {
    if (!running) return;
    const dtMs = Math.min(now - last, 100);
    last = now;
    renderFrame(dtMs / 1000);

    if (!ready) {
      ready = true;
      onReady?.();
    } else if (frames < 90) {
      frames++;
      frameTimeSum += dtMs;
      if (frames === 90 && frameTimeSum / frames > FRAME_BUDGET_MS) {
        // Device cannot keep up: fall back to the static render.
        dispose();
        onFail?.(new Error('low frame rate'));
        return;
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running || disposed || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  const onPointer = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  const ro = new ResizeObserver(resize);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  });

  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  ro.observe(container);
  io.observe(container);
  resize();
  start();

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    ro.disconnect();
    io.disconnect();
    geometry.dispose();
    material.dispose();
    envTexture.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement.remove();
  }

  window.addEventListener('pagehide', dispose, { once: true });

  return {
    setScrollProgress(p) { scrollProgress = MathUtils.clamp(p, 0, 1); },
    // Used once to export the static fallback frame.
    snapshot() { renderFrame(0); return renderer.domElement.toDataURL('image/png'); },
    dispose,
  };
}
