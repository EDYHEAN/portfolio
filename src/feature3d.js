// Les illustrations 3D des « Features clés », en temps réel (Johan, 06/11 : vivantes, ludiques, « App Store »).
// Un seul canvas WebGL fixe pour toute la page : chaque modèle est dessiné dans le cadre de sa tuile (scissor), plutôt
// qu'un contexte par tuile (lourd, et les navigateurs en limitent le nombre). Rien n'est dessiné hors de l'écran.
// Modèles : scripts/blender/make-features.py (GLB Draco) ; l'affiche (.webp transparent) reste tant qu'ils chargent.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

let renderer = null, loader = null, env = null;
const tiles = [];
const pointer = { x: -1, y: -1 };
addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

function setup(root) {
  const canvas = document.createElement('canvas');
  canvas.className = 'f3d-canvas';
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '2' });
  document.body.append(canvas);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 0);
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight, false));
  const pm = new THREE.PMREMGenerator(renderer);
  env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  const draco = new DRACOLoader().setDecoderPath(`${root}3d/draco/`);
  loader = new GLTFLoader().setDRACOLoader(draco);
  requestAnimationFrame(frame);
}

/** Ombre douce sous le modèle (dégradé radial). */
function blob() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.45)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

function addTile(el, src, i) {
  const scene = new THREE.Scene();
  scene.environment = env;
  // data-soft : sur tuile claire, moins de lumière et de reflets (les couleurs de marque délavaient, le noir virait au gris).
  const soft = 'soft' in el.dataset;
  if (soft) scene.environmentIntensity = 0.4;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3530, soft ? 0.6 : 1.1));
  const key = new THREE.DirectionalLight(0xfff4e6, soft ? 1.9 : 2.4); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, soft ? 0.3 : 0.8); rim.position.set(4, 2, -3); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const pivot = new THREE.Group(); scene.add(pivot);
  const t = { el, scene, camera, pivot, phase: i * 1.7, visible: false, ready: false, hover: 0, yaw: 0, pitch: 0 };
  tiles.push(t);
  new IntersectionObserver(([e]) => { t.visible = e.isIntersecting; }, { rootMargin: '10% 0px' }).observe(el);
  loader.load(src, (gltf) => {
    const model = gltf.scene;
    // Centré sur l'origine, sa plus grande dimension ramenée à 2.2 : chaque tuile se cadre pareil, quel que soit le modèle
    // (une sphère englobante laissait trop de vide autour des objets plats, comme l'île).
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const k = 2.2 / Math.max(size.x, size.y * 1.15, size.z);
    const holder = new THREE.Group(); holder.add(model); holder.scale.setScalar(k);
    model.traverse((o) => { if (o.isMesh && o.material) { o.material.envMapIntensity = 0.5; } });
    const shadow = blob();
    const minY = (box.min.y - center.y) * k;
    shadow.position.y = minY - 0.02; shadow.scale.set(size.x * k * 1.15, size.z * k * 1.15, 1);
    pivot.add(holder, shadow);
    t.shadow = shadow; t.ready = true;
    // Encombrement vu par la caméra (vue plongeante d'environ 30°) : largeur, hauteur apparente, profondeur.
    t.W = size.x * k; t.H = size.y * k * 0.88 + size.z * k * 0.48; t.D = size.z * k;
    el.classList.add('is-3d'); // l'affiche s'efface (CSS)
  }, undefined, () => {}); // échec : l'affiche reste
}

const lerp = (a, b, k) => a + (b - a) * k;
function frame(ms) {
  requestAnimationFrame(frame);
  const any = tiles.some((t) => t.visible && t.ready);
  if (!any) return;
  const time = ms / 1000;
  renderer.setScissor(0, 0, innerWidth, innerHeight); renderer.clear();
  for (const t of tiles) {
    if (!t.visible || !t.ready) continue;
    const r = t.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.width < 2) continue;
    // Survol : il se tourne vers le curseur et grossit un peu ; sinon il oscille tout seul.
    const inside = pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
    t.hover = lerp(t.hover, inside ? 1 : 0, 0.08);
    const px = inside ? (pointer.x - (r.left + r.width / 2)) / r.width : 0;
    const py = inside ? (pointer.y - (r.top + r.height / 2)) / r.height : 0;
    t.yaw = lerp(t.yaw, Math.sin(time * 0.45 + t.phase) * 0.35 * (1 - t.hover) + px * 0.9, 0.06);
    t.pitch = lerp(t.pitch, py * 0.35, 0.06);
    // Parallaxe au scroll : la tuile qui monte bascule légèrement le modèle.
    const scrollK = ((r.top + r.height / 2) - innerHeight / 2) / innerHeight;
    t.pivot.rotation.set(t.pitch + scrollK * 0.25, t.yaw, 0);
    t.pivot.position.y = Math.sin(time * 1.1 + t.phase) * 0.05 - scrollK * 0.12;
    t.pivot.scale.setScalar(1 + 0.08 * t.hover);
    if (t.shadow) t.shadow.material.opacity = 1 - (t.pivot.position.y + 0.1) * 2;
    // Caméra : vue de trois-quarts plongeante, reculée juste ce qu'il faut pour que l'objet tienne en largeur ET en
    // hauteur dans sa tuile, avec une marge pour le flottement et la rotation.
    const aspect = r.width / r.height;
    t.camera.aspect = aspect;
    const tanH = Math.tan(THREE.MathUtils.degToRad(t.camera.fov / 2));
    const d = Math.max(t.H / 2 / tanH, t.W / 2 / (tanH * aspect)) * 1.25 + t.D * 0.5;
    t.camera.position.set(0, d * 0.48, d * 0.88);
    t.camera.lookAt(0, -0.05, 0);
    t.camera.updateProjectionMatrix();
    const x = r.left, y = innerHeight - r.bottom;
    renderer.setViewport(x, y, r.width, r.height);
    renderer.setScissor(x, y, r.width, r.height);
    renderer.render(t.scene, t.camera);
  }
}

/** Monte les modèles 3D des tuiles `els` (chacune avec data-model) ; root = racine des assets. */
export function mountFeatures(els, { root = './' } = {}) {
  if (!renderer) setup(root);
  els.forEach((el, i) => addTile(el, el.dataset.model, tiles.length + i));
}
