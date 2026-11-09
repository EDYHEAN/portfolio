// Scènes 3D (three.js, chargé en différé) : le booster d'ouverture et le crâne de hyène du footer.
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
// Au doigt, l'objet suit le glissé puis revient de face : le pointeur n'a pas de position une fois le doigt levé.
['pointerup', 'pointercancel'].forEach((ev) => addEventListener(ev, (e) => { if (e.pointerType === 'touch') pointer.x = pointer.y = 0; }, { passive: true }));

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
export async function mountBooster(host, { root = './', onTear, glb = '3d/booster.glb' } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = studio(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5.3);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-2, 3, 4); scene.add(key);

  const gltf = await gltfLoader(root).loadAsync(`${root}${glb}`);
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
  /** Libère le contexte WebGL (paquet passé sans l'ouvrir) : sur téléphone, la mémoire compte. */
  function dispose() { stop(); unfit(); renderer.dispose(); renderer.forceContextLoss(); }
  return { open, mouth, dispose };
}

/* ------------------------------------------------------------------ */
/* Le crâne du footer                                                   */
/* ------------------------------------------------------------------ */
// Rendu gravure : l'os couleur papier, ombré en hachures d'encre calées sur la lumière et l'occlusion cuite dans Blender
// (couleur de sommets), un grain qui frémit comme la hyène du logo, un contour encre (coque retournée, gonflée).
const ENGRAVE_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying float vAO;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  #if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)
    vAO = color.r;
  #else
    vAO = 1.0;
  #endif
  gl_Position = projectionMatrix * mv;
}`;
const ENGRAVE_FRAG = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec3 uLight;
uniform float uTime;
uniform float uSpacing;
uniform float uDpr;
varying vec3 vN;
varying vec3 vV;
varying float vAO;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Un réseau de traits d'angle a, d'écartement s (px), d'épaisseur w (0..1 de l'interligne), antialiasé.
float hatch(vec2 p, float a, float s, float w) {
  float d = (p.x * cos(a) + p.y * sin(a)) / s;
  float f = abs(fract(d) - 0.5) * 2.0;
  float aa = fwidth(d) * 1.5;
  return w <= 0.001 ? 0.0 : smoothstep(1.0 - w - aa, 1.0 - w + aa, f);
}
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float lam = max(dot(n, normalize(uLight)), 0.0);
  float rim = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 3.0);
  float ao = smoothstep(0.1, 0.95, vAO);
  float tone = clamp((0.16 + 0.84 * lam) * mix(0.3, 1.0, ao) + rim * 0.12, 0.0, 1.0);
  float dark = 1.0 - tone;
  vec2 p = gl_FragCoord.xy / uDpr;
  float ink = 0.0;
  ink = max(ink, hatch(p, 0.785, uSpacing, smoothstep(0.2, 0.8, dark) * 0.55));         // une passe
  ink = max(ink, hatch(p, -0.785, uSpacing, smoothstep(0.48, 0.92, dark) * 0.5));        // croisée
  ink = max(ink, hatch(p, 0.0, uSpacing * 0.85, smoothstep(0.72, 1.0, dark) * 0.62));    // serrée
  ink = max(ink, smoothstep(0.9, 0.98, dark));                                            // aplat dans les creux
  float g = hash(floor(p * 0.8) + floor(uTime * 8.0));
  ink = clamp(ink + (g - 0.5) * 0.22, 0.0, 1.0);
  gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
  #include <colorspace_fragment>
}`;
const OUTLINE_VERT = /* glsl */ `
uniform float uWidth;
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uWidth, 1.0); }`;
const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uInk;
void main() { gl_FragColor = vec4(uInk, 1.0);
  #include <colorspace_fragment>
}`;

/**
 * Le crâne de hyène (assets/3d/skull.glb : scan University of Dundee, CC BY 4.0, allégé dans sources/hyena-skull.blend ;
 * Skull + Jaw, origine = la charnière) rendu dans `host` (le calque fixe de l'outro). Le scroll pilote `state`
 * (core.js, outroMotion) : a = il naît sous le dernier bloc et fonce vers l'écran en ouvrant la gueule jusqu'à le
 * recouvrir, c = on plonge dans la gueule ouverte et le contact apparaît.
 */
export async function mountSkull(host, { root = './', state }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'jaws-canvas';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const dpr = Math.min(devicePixelRatio, innerWidth < 860 ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  const uniforms = {
    uInk: { value: new THREE.Color('#0B0B0B') },
    uPaper: { value: new THREE.Color('#EFE9DD') },
    uLight: { value: new THREE.Vector3(-0.55, 0.75, 0.6).normalize() },
    uTime: { value: 0 },
    uSpacing: { value: innerWidth < 860 ? 4.5 : 5.5 },
    uDpr: { value: dpr },
  };
  const engrave = new THREE.ShaderMaterial({ uniforms, vertexShader: ENGRAVE_VERT, fragmentShader: ENGRAVE_FRAG, vertexColors: true, side: THREE.DoubleSide });
  const outline = new THREE.ShaderMaterial({ uniforms: { uInk: uniforms.uInk, uWidth: { value: 0.022 } }, vertexShader: OUTLINE_VERT, fragmentShader: OUTLINE_FRAG, side: THREE.BackSide });

  const gltf = await gltfLoader(root).loadAsync(`${root}3d/skull.glb`);
  const skull = gltf.scene.getObjectByName('Skull'), jaw = gltf.scene.getObjectByName('Jaw');
  // Les maillages d'abord, les coques ensuite (ajoutées pendant le parcours, elles seraient parcourues à leur tour).
  const meshes = [];
  [skull, jaw].forEach((part) => part.traverse((o) => { if (o.isMesh) meshes.push(o); }));
  meshes.forEach((o) => { o.material = engrave; o.add(new THREE.Mesh(o.geometry, outline)); });
  const head = new THREE.Group();
  head.add(skull, jaw);
  // La charnière est à l'origine ; on recentre le crâne (son milieu est devant et au-dessus d'elle).
  const pivot = new THREE.Group();
  head.position.set(0.08, -0.35, -1.0);
  pivot.add(head);
  scene.add(pivot);

  const resize = () => {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  const attach = (el) => { host = el; el.append(canvas); ro.disconnect(); ro.observe(el); resize(); };
  attach(host);

  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  let yaw = 0, idle = false;
  // Le canvas reste caché tant qu'il n'y a rien à dessiner : un canvas WebGL encore vierge s'affiche en noir sur
  // certains rendus (c'était le flash noir avant l'arrivée du crâne).
  canvas.style.visibility = 'hidden';
  const outro = document.getElementById('outro');
  loop(canvas, (t) => {
    const { a = 0, c = 0 } = state;
    if (a <= 0.0001 || c >= 0.9999) {
      if (!idle) { canvas.style.visibility = 'hidden'; host.style.backgroundColor = ''; idle = true; }
      return;
    }
    idle = false;
    uniforms.uTime.value = t;
    // a : il naît juste sous le dernier bloc, accroché à lui, rejoint le centre en accélérant vers l'écran, de trois-quarts
    //     puis face à toi, la gueule s'ouvrant jusqu'à recouvrir tout l'écran. c : on plonge dans la gueule ouverte, il
    //     disparaît : derrière, le contact (épinglé) est là.
    const near = Math.pow(a, 1.6);
    const zFull = innerWidth < 860 ? -6.2 : -4.8; // plein écran (un téléphone est étroit : un peu plus loin)
    pivot.position.z = lerp(lerp(-70, zFull, near), 2.2, Math.pow(c, 1.3));
    // Cadrage : la ligne des crocs au centre ; en plongeant, le pivot monte d'autant que la mâchoire descend, pour que
    // la caméra file au milieu de l'ouverture (pas à travers l'os).
    pivot.position.y = lerp(0.5, 0.6, smooth(0, 1, a)) + 1.2 * smooth(0, 0.8, c);
    jaw.rotation.x = 0.75 * smooth(0.12, 0.8, a) + 0.35 * smooth(0, 0.6, c);
    yaw += ((pointer.x * 0.25) - yaw) * 0.05;
    pivot.rotation.y = lerp(0.6, 0, smooth(0, 0.8, a)) + yaw * (1 - c) + Math.sin(t * 0.9) * 0.06 * (1 - a);
    pivot.rotation.x = lerp(0.3, -0.1, smooth(0, 1, a)) - 0.2 * smooth(0, 1, c); // museau un peu relevé : on voit les crocs
    pivot.visible = c < 0.98;
    // Accroché au dernier bloc : tant que le haut de l'outro est sous le milieu de l'écran, l'image descend avec lui
    // (le crâne naît 10 px sous le bloc), puis il se pose au centre.
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const top = outro ? outro.getBoundingClientRect().top : 0;
    const shift = Math.max(0, top + 10 + h * 0.06 - h / 2);
    camera.setViewOffset(w, h, 0, -shift, w, h);
    // La page ne s'assombrit qu'en fin d'approche ; le noir s'efface pendant qu'on traverse la gueule.
    const dark = 0.9 * smooth(0.6, 1, a) * (1 - smooth(0.35, 0.75, c));
    host.style.backgroundColor = dark > 0.001 ? `rgba(11, 11, 11, ${dark.toFixed(3)})` : '';
    renderer.render(scene, camera);
    canvas.style.visibility = 'visible';
  });
  return { attach };
}
