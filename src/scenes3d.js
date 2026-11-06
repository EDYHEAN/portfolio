// Scènes 3D (three.js, chargé en différé) : le booster d'ouverture et la hyène du hero.
// Modèles faits dans Blender (assets/3d/*.glb, Draco). Lumière claire de studio (RoomEnvironment).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

let draco = null;
const gltfLoader = (root) => {
  draco ??= new DRACOLoader().setDecoderPath(`${root}3d/draco/`);
  return new GLTFLoader().setDRACOLoader(draco);
};

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 860 ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping; // garde les noirs noirs (ACES les grise)
  r.toneMappingExposure = 1.0;
  return r;
}
function studio(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return tex;
}
/** Ombre douce posée sous l'objet (dégradé radial). */
function blobShadow() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(40,30,15,0.38)'); grd.addColorStop(1, 'rgba(40,30,15,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  return m;
}
const pointer = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; }, { passive: true });

/** Boucle de rendu qui se met en pause hors écran / onglet caché. */
function loop(host, fn) {
  let visible = true, alive = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(host);
  const t0 = performance.now();
  const tick = () => {
    if (!alive) return;
    if (visible && !document.hidden) fn((performance.now() - t0) / 1000);
    requestAnimationFrame(tick);
  };
  tick();
  return () => { alive = false; io.disconnect(); };
}
function fit(host, renderer, camera) {
  const resize = () => {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(host);
  return () => ro.disconnect();
}

/* ------------------------------------------------------------------ */
/* Le booster                                                           */
/* ------------------------------------------------------------------ */
export async function mountBooster(host, { root = './', onTear } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = studio(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5.3);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-2, 3, 4); scene.add(key);

  const gltf = await gltfLoader(root).loadAsync(`${root}3d/booster.glb`);
  const pack = new THREE.Group();
  gltf.scene.rotation.x = Math.PI / 2; // le paquet est modélisé à plat : on le met debout, face caméra
  pack.add(gltf.scene);
  scene.add(pack);
  const body = gltf.scene.getObjectByName('Pack'), strip = gltf.scene.getObjectByName('Strip');
  // Plastique brillant : la texture imprimée + un vernis (clearcoat) qui accroche le studio.
  [body, strip].forEach((o) => {
    const map = o.material.map;
    o.material = new THREE.MeshPhysicalMaterial({ map, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.22, envMapIntensity: 0.42, side: THREE.DoubleSide, transparent: o === strip });
  });
  const shadow = blobShadow();
  shadow.scale.set(1.5, 0.32, 1); shadow.position.set(0, -1.18, -0.3);
  scene.add(shadow);

  const unfit = fit(host, renderer, camera);
  host.append(canvas);
  const cur = { rx: 0, ry: 0 };
  let opening = false;
  const stop = loop(host, (t) => {
    if (!opening) {
      cur.ry += ((pointer.x * 0.7) - cur.ry) * 0.06;
      cur.rx += ((pointer.y * 0.35) - cur.rx) * 0.06;
      pack.rotation.y = cur.ry + Math.sin(t * 0.6) * 0.18;
      pack.rotation.x = cur.rx;
      pack.rotation.z = Math.sin(t * 0.4) * 0.035;
      pack.position.y = Math.sin(t * 1.1) * 0.06;
      shadow.scale.x = 1.5 - Math.sin(t * 1.1) * 0.08;
    }
    renderer.render(scene, camera);
  });

  /** Position écran (px) du haut du paquet : là d'où sortent les cartes. */
  const mouth = () => {
    const v = new THREE.Vector3(0, 0.62, 0).applyMatrix4(pack.matrixWorld).project(camera);
    const r = host.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  };

  function open() {
    if (opening) return Promise.resolve();
    opening = true;
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { stop(); unfit(); renderer.dispose(); resolve(); } })
        // le paquet se remet face caméra, petit tremblement
        .to(pack.rotation, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power3.out' })
        .to(pack.position, { y: 0, duration: 0.35, ease: 'power3.out' }, '<')
        .to(pack.rotation, { z: 0.05, duration: 0.05, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        // la languette s'arrache
        .add(() => onTear?.('tear'))
        .to(strip.position, { y: 0.55, z: -0.25, x: 0.35, duration: 0.55, ease: 'power3.out' })
        .to(strip.rotation, { y: -0.7, z: 0.5, duration: 0.55, ease: 'power3.out' }, '<')
        .to(strip.material, { opacity: 0, duration: 0.4, delay: 0.15 }, '<')
        // les cartes sortent (gérées côté DOM), le paquet glisse vers le bas
        .add(() => onTear?.('cards', mouth()), '-=0.25')
        .to(pack.position, { y: -3.2, duration: 0.9, ease: 'power3.in' }, '+=0.15')
        .to(shadow.material, { opacity: 0, duration: 0.4 }, '<');
    });
  }
  return { open, mouth };
}

/* ------------------------------------------------------------------ */
/* La mâchoire du footer                                                */
/* ------------------------------------------------------------------ */
/**
 * Deux rangées de crocs (assets/3d/jaws.glb, scripts/blender/make-jaws.py) rendues dans `host` (la scène collante de
 * la morsure). Le scroll pilote `state` (core.js, outroMotion) : a = elles arrivent (de hors champ à entrouvertes),
 * b = elles claquent, c = la gueule s'ouvre (le haut s'en va, le bas se pose au pied de l'écran, sa gencive se fond
 * dans le contact). shake = secousse du claquement.
 */
export async function mountJaws(host, { root = './', state }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'jaws-canvas';
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = studio(renderer);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  // Lumière rasante d'en haut à gauche : elle sculpte les crocs (de face, l'éclairage studio seul les aplatit).
  const key = new THREE.DirectionalLight(0xfff1dc, 2.8); key.position.set(-4, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.35); fill.position.set(5, -3, 3); scene.add(fill);

  const gltf = await gltfLoader(root).loadAsync(`${root}3d/jaws.glb`);
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0xe9dfca, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.45 });
  // Gencive : le noir du contact, mate (sinon le mur reflète le studio et vire au gris).
  const gum = new THREE.MeshBasicMaterial({ color: 0x0b0b0b, toneMapped: false }); // le noir exact du contact : pas de raccord visible
  gltf.scene.traverse((o) => { if (o.isMesh) o.material = /ivory/i.test(o.material.name) ? enamel : gum; });
  const up = gltf.scene.getObjectByName('JawUp'), down = gltf.scene.getObjectByName('JawDown');
  scene.add(up, down);

  // Cadrage : la largeur visible suit l'écran (un téléphone ne montre que le devant de la gueule : incisives, canines).
  let H = 10;
  const resize = () => {
    const r = host.getBoundingClientRect();
    const aspect = r.width / Math.max(1, r.height);
    renderer.setSize(r.width, r.height, false);
    camera.aspect = aspect;
    const W = Math.min(11, Math.max(6, 6.6 * aspect));
    H = W / aspect;
    camera.position.z = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  const attach = (el) => { host = el; el.append(canvas); ro.disconnect(); ro.observe(el); resize(); };
  attach(host);

  const lerp = (a, b, t) => a + (b - a) * t;
  let yaw = 0, idle = false;
  loop(canvas, (t) => {
    const { a = 0, b = 0, c = 0, shake = 0 } = state;
    // Hors champ (pas encore arrivée, ou repartie) : un écran vide une fois, puis plus aucun rendu.
    if ((a <= 0.0001 || c >= 0.9999) && shake < 0.001) {
      if (!idle) { renderer.clear(); host.style.backgroundColor = ''; idle = true; }
      return;
    }
    idle = false;
    const far = H / 2 + 2.8; // les canines (2,45) restent hors champ au départ
    // hors champ -> entrouvertes (±2,9) -> fermées (±0,85, les crocs se croisent) -> rouvertes, reparties chacune de son côté.
    up.position.y = lerp(lerp(lerp(far, 2.9, a), 0.85, b), far + 1, c);
    down.position.y = lerp(lerp(lerp(-far, -2.9, a), -0.85, b), -far - 1, c);
    const ajar = 0.22 * a * (1 - b); // entrouvertes, les mâchoires basculent : on voit les crocs par en dessous / dessus
    up.rotation.x = -ajar - 0.3 * c;
    down.rotation.x = ajar + 0.3 * c;
    // La bouche s'assombrit en se refermant (l'ivoire ressort sur toutes les pages), puis s'éclaircit d'un coup à
    // l'ouverture : le contact, épinglé derrière, apparaît entre les crocs.
    const dark = Math.min(1, Math.max(0, (a - 0.15) / 0.55)) * (1 - Math.min(1, c * 3)); // suit l'arrivée des crocs
    host.style.backgroundColor = dark > 0.001 ? `rgba(11, 11, 11, ${dark.toFixed(3)})` : '';
    yaw += (pointer.x * 0.12 - yaw) * 0.05;
    up.rotation.y = down.rotation.y = yaw * (1 - c);
    camera.position.x = Math.sin(t * 70) * 0.09 * shake;
    camera.position.y = Math.cos(t * 55) * 0.07 * shake;
    renderer.render(scene, camera);
  });
  return { attach };
}
