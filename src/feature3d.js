// Les illustrations 3D des « Features clés », en temps réel (Johan, 06/11 : vivantes, ludiques, « App Store »).
// Un seul canvas WebGL pour toute la page : chaque modèle est dessiné dans le cadre de sa tuile (scissor), plutôt
// qu'un contexte par tuile (lourd, et les navigateurs en limitent le nombre). Rien n'est dessiné hors de l'écran.
// Modèles : scripts/blender/make-features.py (GLB Draco) ; l'affiche (.webp transparent) reste tant qu'ils chargent.
//
// Au doigt (TOUCH) : le scroll est natif, il avance sans attendre le JS. Un canvas fixe verrait donc les modèles flotter à
// côté de leur tuile : il est posé dans la grille et défile avec elle. Pas de curseur : les modèles oscillent seuls et un tap
// les fait tourner. Moins de pixels (densité 1,5) et 30 images/s. Si l'appareil ne suit pas, ou s'il reprend le contexte
// WebGL (iOS sous pression mémoire), on rend tout et les affiches reviennent : la page vaut mieux que la 3D.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const TOUCH = matchMedia('(hover: none) and (pointer: coarse)').matches;
const SLOW_MS = 50; // au doigt : en dessous de 20 images/s en moyenne, on abandonne la 3D
const SLOW_SAMPLES = 45;

let renderer = null, canvas = null, loader = null, env = null, gaveUp = false, sizer = null;
const tiles = [];
const pointer = { x: -1, y: -1 };
if (!TOUCH) addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

function setup(root) {
  canvas = document.createElement('canvas');
  canvas.className = 'f3d-canvas';
  Object.assign(canvas.style, { position: TOUCH ? 'absolute' : 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '2' });
  if (!TOUCH) document.body.append(canvas);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.5 : 2));
  if (!TOUCH) renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 0);
  if (!TOUCH) addEventListener('resize', () => renderer?.setSize(innerWidth, innerHeight, false));
  canvas.addEventListener('webglcontextlost', giveUp);
  const pm = new THREE.PMREMGenerator(renderer);
  env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  const draco = new DRACOLoader().setDecoderPath(`${root}3d/draco/`);
  loader = new GLTFLoader().setDRACOLoader(draco);
  requestAnimationFrame(frame);
}

/** Au doigt : le canvas vit dans la grille des tuiles et prend sa taille (la barre d'adresse ne le redimensionne plus). */
function dock(grid) {
  if (grid.style.position !== 'relative') grid.style.position = 'relative';
  if (canvas.parentElement !== grid) grid.append(canvas);
  sizer?.disconnect();
  sizer = new ResizeObserver(() => renderer?.setSize(grid.clientWidth, grid.clientHeight, false));
  sizer.observe(grid);
  renderer.setSize(grid.clientWidth, grid.clientHeight, false);
}

/** Plus de 3D sur cette page : les affiches reviennent (CSS) et la mémoire est rendue. */
function giveUp() {
  gaveUp = true;
  sizer?.disconnect();
  tiles.splice(0).forEach(release);
  try { renderer?.forceContextLoss(); } catch {}
  renderer?.dispose();
  canvas?.remove();
  renderer = canvas = null;
}

/** Une tuile qui disparaît (changement de langue : la page est redessinée) ou que l'on abandonne. */
function release(t) {
  t.io.disconnect();
  t.el.classList.remove('is-3d');
  t.scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.map?.dispose(); o.material.dispose(); } });
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
  const t = { el, scene, camera, pivot, phase: i * 1.7, visible: false, ready: false, hover: 0, yaw: 0, pitch: 0, spin: 0, spun: 0 };
  tiles.push(t);
  t.io = new IntersectionObserver(([e]) => { t.visible = e.isIntersecting; }, { rootMargin: '10% 0px' });
  t.io.observe(el);
  // Au doigt : un tap fait faire un tour au modèle, avec un petit rebond.
  if (TOUCH) el.closest('.ft').addEventListener('click', () => { t.spin += Math.PI * 2; t.hover = 1; });
  loader.load(src, (gltf) => {
    if (!tiles.includes(t)) return; // la page a été redessinée, ou la 3D abandonnée, pendant le chargement
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
let lastDraw = 0, slow = 0, slowN = 0, strikes = 0;

/** Au doigt : l'appareil suit-il ? (moyenne sur les images dessinées ; un trou de plus d'une seconde, c'est l'onglet qui revient.) */
function watch(dt) {
  if (dt > 1000) return;
  slow += dt; slowN++;
  if (slowN < SLOW_SAMPLES) return;
  strikes = slow / slowN > SLOW_MS ? strikes + 1 : 0; // deux fenêtres lentes de suite : ce n'est pas un simple à-coup au chargement
  slow = slowN = 0;
  if (strikes >= 2) giveUp();
}

function frame(ms) {
  if (!renderer) return;
  requestAnimationFrame(frame);
  if (document.body.classList.contains('live-open')) return; // un prototype est ouvert en plein écran par-dessus
  const any = tiles.some((t) => t.visible && t.ready);
  if (!any) { lastDraw = 0; return; }
  if (TOUCH) {
    if (lastDraw && ms - lastDraw < 28) return; // 30 images/s suffisent à un objet qui flotte
    if (lastDraw) watch(ms - lastDraw);
    lastDraw = ms;
    if (!renderer) return;
  }
  const time = ms / 1000;
  const size = TOUCH ? renderer.getSize(new THREE.Vector2()) : { x: innerWidth, y: innerHeight };
  const box = TOUCH ? canvas.getBoundingClientRect() : { left: 0, bottom: innerHeight };
  renderer.setScissor(0, 0, size.x, size.y); renderer.clear();
  for (const t of tiles) {
    if (!t.visible || !t.ready) continue;
    const r = t.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.width < 2) continue;
    // Survol : il se tourne vers le curseur et grossit un peu ; sinon il oscille tout seul.
    const inside = !TOUCH && pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
    t.hover = lerp(t.hover, inside ? 1 : 0, 0.08);
    const px = inside ? (pointer.x - (r.left + r.width / 2)) / r.width : 0;
    const py = inside ? (pointer.y - (r.top + r.height / 2)) / r.height : 0;
    t.yaw = lerp(t.yaw, Math.sin(time * 0.45 + t.phase) * 0.35 * (1 - t.hover) + px * 0.9, 0.06);
    t.pitch = lerp(t.pitch, py * 0.35, 0.06);
    t.spun = lerp(t.spun, t.spin, 0.09);
    // Parallaxe au scroll : la tuile qui monte bascule légèrement le modèle.
    const scrollK = ((r.top + r.height / 2) - innerHeight / 2) / innerHeight;
    t.pivot.rotation.set(t.pitch + scrollK * 0.25, t.yaw + t.spun, 0);
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
    const x = r.left - box.left, y = box.bottom - r.bottom;
    renderer.setViewport(x, y, r.width, r.height);
    renderer.setScissor(x, y, r.width, r.height);
    renderer.render(t.scene, t.camera);
  }
}

/** Avant toute chose, au doigt : l'appareil a-t-il de quoi faire tourner la 3D ? Sinon, les affiches suffisent. */
function canRun() {
  if (!TOUCH) return true;
  if (navigator.connection?.saveData) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 3) return false;
  return true;
}

/** Monte les modèles 3D des tuiles `els` (chacune avec data-model) ; root = racine des assets. */
export function mountFeatures(els, { root = './' } = {}) {
  if (gaveUp || !canRun()) return;
  // Changement de langue : les tuiles ont été redessinées, on oublie les anciennes.
  for (let i = tiles.length - 1; i >= 0; i--) if (!tiles[i].el.isConnected) release(tiles.splice(i, 1)[0]);
  try { if (!renderer) setup(root); } catch { gaveUp = true; return; } // pas de WebGL : les affiches restent
  if (TOUCH) dock(els[0].closest('.ft-bento'));
  els.forEach((el, i) => addTile(el, el.dataset.model, tiles.length + i));
}
