// Ma pièce : une pièce en coin en 3D (three.js) où l'on pose les objets de sa collection.
// - modèles 3D (models/<id>.glb, listés dans models/index.json) quand ils existent,
// - sinon une silhouette détourée debout qui fait toujours face à la caméra.
// Les objets au sol se glissent ; près d'un mur, ils se tournent tout seuls dos au mur.
// Les objets muraux (miroirs, horloges) glissent sur les deux murs.
// Les petits objets (lampes à poser, vases, bougeoirs) se posent sur la surface visée : table, buffet ou sol.
// Décors : models/decors/<nom>.glb, éclairage cuit dans Blender (meshes « cuit_* » affichés sans lumière).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 4.4, D = 4.0, H = 2.6;          // largeur (x), profondeur (z), hauteur, en mètres
const X0 = -W / 2, Z0 = -D / 2;           // mur de gauche en x = X0, mur du fond en z = Z0
const SNAP = .45;                         // distance au mur sous laquelle l'objet s'y adosse
const PAS = Math.PI / 8;                  // rotation manuelle par cran (22,5°)

// taille réelle approximative de chaque objet, devinée depuis le texte de la carte
function profil(c) {
  const t = (c.nom + ' ' + c.desc).toLowerCase();
  if (c.cat === 'sol') return { mode: 'tapis', w: /ø|rond/.test(t) ? 1.5 : 2.1 };
  if (c.cat === 'mur') return { mode: 'mur', w: /ø120/.test(t) ? .95 : .75 };
  if (/horloge/.test(t)) return { mode: 'mur', w: .6 };
  if (/suspension/.test(t)) return { mode: 'plafond', w: .42 };
  if (/canapé/.test(t)) return { mode: 'sol', w: 2.1 };
  if (/table à manger/.test(t)) return { mode: 'sol', w: 1.8 };
  if (/pied tulipe/.test(t)) return { mode: 'sol', w: 1.1 };
  if (/table basse|coffee/.test(t)) return { mode: 'sol', w: .85 };
  if (/buffet/.test(t)) return { mode: 'sol', w: 1.7 };
  if (/bibliothèque/.test(t)) return { mode: 'sol', h: 1.9 };
  if (/modulaire/.test(t)) return { mode: 'sol', w: 1.5 };
  if (/rangement rond/.test(t)) return { mode: 'sol', h: .6 };
  if (/lampadaire/.test(t)) return { mode: 'sol', h: 1.85 };
  if (/lampe/.test(t)) return { mode: 'pose', h: .45 };
  if (/olivier/.test(t)) return { mode: 'sol', h: 1.5 };
  if (/pouf/.test(t)) return { mode: 'sol', w: .5 };
  if (/ottoman/.test(t)) return { mode: 'sol', w: 1.45 };
  if (/chaise/.test(t)) return { mode: 'sol', h: .82 };
  if (/fauteuil|chauffeuse/.test(t)) return { mode: 'sol', w: .82 };
  if (/plaid/.test(t)) return { mode: 'sol', h: .6 };
  if (/coussin/.test(t)) return { mode: 'pose', h: .45 };
  if (c.cat === 'deco' && !/tabouret|service/.test(t)) return { mode: 'pose', h: .3 };
  if (c.cat === 'deco') return { mode: 'sol', h: .35 };
  return { mode: 'sol', w: .8 };
}

// ---------- textures procédurales ----------
function texParquet() {
  const n = 1024, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
  const rows = 8, hh = n / rows;
  for (let r = 0; r < rows; r++) {
    let x = -Math.random() * 500;
    while (x < n) {
      const len = 300 + Math.random() * 420, l = 40 + Math.random() * 12, h = 30 + Math.random() * 6;
      g.fillStyle = `hsl(${h} ${18 + Math.random() * 9}% ${l}%)`; g.fillRect(x, r * hh, len, hh);
      // veinage
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = `rgba(60,35,15,${.05 + Math.random() * .08})`; g.lineWidth = .6 + Math.random() * 1.4;
        const y = r * hh + Math.random() * hh; g.beginPath(); g.moveTo(x, y);
        g.bezierCurveTo(x + len * .3, y + (Math.random() - .5) * 10, x + len * .7, y + (Math.random() - .5) * 10, x + len, y + (Math.random() - .5) * 6); g.stroke();
      }
      g.fillStyle = 'rgba(40,22,10,.55)'; g.fillRect(x, r * hh, 2, hh);
      x += len;
    }
    g.fillStyle = 'rgba(40,22,10,.5)'; g.fillRect(0, r * hh, n, 2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 8;
  return t;
}
function texPlatre(base) {
  const n = 512, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 9000; i++) { const v = Math.random() < .5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${Math.random() * .035})`; const s = 1 + Math.random() * 3; g.fillRect(Math.random() * n, Math.random() * n, s, s); }
  for (let i = 0; i < 40; i++) { const gr = g.createRadialGradient(Math.random() * n, Math.random() * n, 0, Math.random() * n, Math.random() * n, 80 + Math.random() * 120); gr.addColorStop(0, 'rgba(0,0,0,.025)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2);
  return t;
}
function texCiel() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#cfe3f5'); gr.addColorStop(.7, '#fff3e0'); gr.addColorStop(1, '#ffe2bf');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function texOmbre() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

export async function monter(stage, { cartes, items, decor, onChange, onSelect, onPose }) {
  const carte = id => cartes.find(c => c.id === id);
  let MODELES = {};
  try { MODELES = await (await fetch('models/index.json', { cache: 'no-store' })).json(); } catch (e) {}

  // ---------- rendu ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 80);

  // ---------- la pièce de base (remplacée par un décor quand il existe) ----------
  const base = new THREE.Group(); scene.add(base);
  const plancher = new THREE.Mesh(new THREE.BoxGeometry(W + .1, .12, D + .1), [
    new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: .9 }), new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: .9 }),
    new THREE.MeshStandardMaterial({ map: texParquet(), roughness: .72 }), new THREE.MeshStandardMaterial({ color: 0x3a281c }),
    new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: .9 }), new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: .9 })]);
  plancher.position.set(-.05, -.06, -.05); plancher.receiveShadow = true; base.add(plancher);
  const mPlatre = new THREE.MeshStandardMaterial({ map: texPlatre('#e9dfd0'), roughness: .95 });
  const mPlatre2 = new THREE.MeshStandardMaterial({ map: texPlatre('#e2d6c4'), roughness: .95 });
  const murFond = new THREE.Mesh(new THREE.BoxGeometry(W + .2, H, .1), mPlatre); murFond.position.set(-.1, H / 2, Z0 - .05); murFond.receiveShadow = true; base.add(murFond);
  const murG = new THREE.Mesh(new THREE.BoxGeometry(.1, H, D + .1), mPlatre2); murG.position.set(X0 - .05, H / 2, -.05); murG.receiveShadow = true; base.add(murG);
  const mPlinthe = new THREE.MeshStandardMaterial({ color: 0xf3ece2, roughness: .6 });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(W, .09, .02), mPlinthe); p1.position.set(0, .045, Z0 + .01); p1.castShadow = p1.receiveShadow = true; base.add(p1);
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(.02, .09, D), mPlinthe); p2.position.set(X0 + .01, .045, 0); p2.receiveShadow = true; base.add(p2);
  // fenêtre sur le mur de gauche
  const fen = new THREE.Group();
  const vitre = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.45), new THREE.MeshBasicMaterial({ map: texCiel() }));
  fen.add(vitre);
  const mCadre = new THREE.MeshStandardMaterial({ color: 0xf6f1ea, roughness: .5 });
  [[0, .74, 1.2, .06], [0, -.74, 1.2, .06], [.57, 0, .06, 1.54], [-.57, 0, .06, 1.54], [0, 0, .04, 1.45], [0, .1, 1.1, .035]].forEach(([x, y, w, h]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .05), mCadre); b.position.set(x, y, .02); b.castShadow = true; fen.add(b);
  });
  fen.position.set(X0 + .005, 1.45, .55); fen.rotation.y = Math.PI / 2; base.add(fen);

  // reflets : un environnement de pièce neutre pour les miroirs, métaux et vernis
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  // ---------- lumière ----------
  const hemi = new THREE.HemisphereLight(0xfff1df, 0x3b2a20, 1.15); scene.add(hemi);
  const soleil = new THREE.DirectionalLight(0xffdcb0, 2.6);
  soleil.position.set(-4.5, 4.6, 2.2); soleil.target.position.set(.2, 0, -.2); scene.add(soleil.target);
  soleil.castShadow = true; soleil.shadow.mapSize.set(2048, 2048);
  Object.assign(soleil.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .5, far: 16 });
  soleil.shadow.bias = -.0004; soleil.shadow.normalBias = .02; soleil.shadow.radius = 5;
  scene.add(soleil);
  const appoint = new THREE.DirectionalLight(0xc8d8ff, .35); appoint.position.set(5, 3, 6); scene.add(appoint);
  const feu = new THREE.PointLight(0xffb36b, 0, 7, 1.6); scene.add(feu);
  // capteurs d'ombre invisibles : les meubles projettent leur ombre sur le décor cuit
  const capteurs = new THREE.Group(); capteurs.visible = false; scene.add(capteurs);
  const mOmbre = new THREE.ShadowMaterial({ opacity: .32 });
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mOmbre); cs.rotation.x = -Math.PI / 2; cs.position.y = .002; cs.receiveShadow = true; capteurs.add(cs);
  const cf = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mOmbre); cf.position.set(0, H / 2, Z0 + .004); cf.receiveShadow = true; capteurs.add(cf);
  const cg = new THREE.Mesh(new THREE.PlaneGeometry(D, H), mOmbre); cg.rotation.y = Math.PI / 2; cg.position.set(X0 + .004, H / 2, 0); cg.receiveShadow = true; capteurs.add(cg);
  const AMBIANCES = {
    base: { hemi: 1.15, soleil: 2.6, appoint: .35, feu: 0, expo: 1.1, sol: 0xffdcb0 },
    jour: { hemi: .6, soleil: 1.9, appoint: .25, feu: 0, expo: 1.0, sol: 0xffe2c0, ombre: .26, solPos: [-1.2, 7, 1.2] },
    noel: { hemi: .28, soleil: .35, appoint: .08, feu: 3.5, expo: .95, sol: 0x9fb6ff, ombre: .2, solPos: [-1, 7, 1], feuPos: [-1.45, 1.25, -1.35] },
  };
  let decorGrp = null, decorNom = 'base', decorTour = 0;
  const decorsCharges = new Map();   // nom -> scène déjà préparée (changer de pièce sans recharger)
  async function setDecor(nom) {
    const tour = ++decorTour;
    if (decorGrp) { scene.remove(decorGrp); decorGrp = null; }
    if (nom !== 'base' && decorsCharges.has(nom)) decorGrp = decorsCharges.get(nom);
    else if (nom !== 'base') {
      try {
        const g = await loader.loadAsync(`models/decors/${nom}.glb`);
        g.scene.traverse(m => {
          if (!m.isMesh) return;
          if (/^cuit/i.test(m.name) || /^cuit/i.test(m.material?.name || '')) {
            const mp = m.material.map || m.material.emissiveMap;
            m.material = new THREE.MeshBasicMaterial({ map: mp, color: mp ? 0xffffff : m.material.color, toneMapped: false });
          } else { m.castShadow = true; m.receiveShadow = true; }
          m.userData.decor = true;
        });
        decorsCharges.set(nom, g.scene);
        if (tour !== decorTour) return decorNom;   // un autre décor a été demandé entre-temps
        decorGrp = g.scene;
      } catch (e) { console.warn('décor indisponible', nom, e); nom = 'base'; }
    }
    if (decorGrp) scene.add(decorGrp);
    decorNom = nom;
    const a = AMBIANCES[nom] || AMBIANCES.base;
    base.visible = !decorGrp; capteurs.visible = !!decorGrp; mOmbre.opacity = a.ombre || .3;
    hemi.intensity = a.hemi; soleil.intensity = a.soleil; soleil.color.set(a.sol); appoint.intensity = a.appoint;
    feu.intensity = a.feu; if (a.feuPos) feu.position.set(...a.feuPos);
    soleil.position.set(...(a.solPos || [-4.5, 4.6, 2.2]));
    // dans un décor cuit, seules les ombres au sol restent (les murs ont déjà leur lumière)
    cf.visible = cg.visible = false;
    renderer.toneMappingExposure = a.expo;
    return nom;
  }

  // ---------- caméra & contrôles ----------
  const cible = new THREE.Vector3(-.25, .75, -.25);
  const regler = () => {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1, a = w / h;
    renderer.setSize(w, h, false); camera.aspect = a; camera.updateProjectionMatrix();
    return a;
  };
  const a0 = regler();
  const dist = Math.min(14, 8.6 * Math.max(1, Math.pow(1.35 / a0, .85)));
  const az = .72, pol = 1.0;
  camera.position.set(cible.x + dist * Math.sin(pol) * Math.sin(az), cible.y + dist * Math.cos(pol), cible.z + dist * Math.sin(pol) * Math.cos(az));
  camera.lookAt(cible);

  // ---------- objets ----------
  const loader = new GLTFLoader(), texLoader = new THREE.TextureLoader();
  // décors compressés en Draco (géométrie ~5x plus légère)
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/'));
  const ombreTex = texOmbre();
  const objets = new Map();   // id -> { id, grp, inner, prof, standee, hx, hz, h, x, z, r, y, wall, tr, tx, tz, ty, born }
  let sel = null;

  const anneau = new THREE.Mesh(new THREE.RingGeometry(.92, 1, 64), new THREE.MeshBasicMaterial({ color: 0xe8c47a, transparent: true, opacity: .9, depthWrite: false }));
  anneau.rotation.x = -Math.PI / 2; anneau.position.y = .012; anneau.visible = false; scene.add(anneau);

  async function standee(c, prof) {
    const tex = await texLoader.loadAsync(c.cut || c.img);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const a = tex.image.height / tex.image.width;
    let w, h; if (prof.w) { w = prof.w; h = w * a; } else { h = prof.h; w = h / a; }
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide, roughness: .9 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5 });
    const g = new THREE.Group(); g.add(m);
    let hz = .12, billboard = null;
    if (prof.mode === 'tapis') { m.rotation.x = -Math.PI / 2; m.position.y = .004; mat.alphaTest = .3; m.receiveShadow = true; hz = h / 2; }
    else if (prof.mode === 'mur') { m.castShadow = true; }
    else if (prof.mode === 'plafond') {
      m.position.y = H - .45 - h / 2; m.castShadow = true; billboard = m;
      const fil = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .45), new THREE.MeshStandardMaterial({ color: 0x222222 })); fil.position.y = H - .225; g.add(fil);
    } else {
      m.position.y = h / 2; m.castShadow = true; billboard = m;
      const o = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.1, Math.min(w, .7) * .6), new THREE.MeshBasicMaterial({ map: ombreTex, transparent: true, depthWrite: false }));
      o.rotation.x = -Math.PI / 2; o.position.y = .008; g.add(o);
    }
    return { g, hx: w / 2, hz, h, billboard };
  }
  async function modele(id, prof) {
    const gltf = await loader.loadAsync(`models/${id}.glb`);
    const root = gltf.scene, wrap = new THREE.Group(), pivot = new THREE.Group();
    root.rotation.y = (MODELES[id].rot || 0) * Math.PI / 180;
    wrap.add(root); pivot.add(wrap); pivot.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(wrap), s = box.getSize(new THREE.Vector3());
    // modèle repris dans Blender à l'échelle réelle : on garde ses mesures
    const k = MODELES[id].reel ? 1 : prof.w ? prof.w / Math.max(s.x, s.z) : prof.h / s.y;
    wrap.scale.setScalar(k); pivot.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(wrap); s = box.getSize(new THREE.Vector3()); const c = box.getCenter(new THREE.Vector3());
    // mural : centré, dos contre le mur (z = 0) ; sinon posé au sol, centré
    // suspension : le haut du modèle (rosace) colle au plafond
    if (prof.mode === 'mur') wrap.position.set(-c.x, -c.y, -box.min.z);
    else if (prof.mode === 'plafond') wrap.position.set(-c.x, H - box.max.y, -c.z);
    else wrap.position.set(-c.x, -box.min.y, -c.z);
    root.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      // les anciens modèles générés étaient trop brillants ; les modèles faits dans Blender gardent leurs matières
      // verre : la transmission de three.js coûte cher et sort opaque ici, on passe en verre teinté transparent
      if (o.material && o.material.transmission > 0) Object.assign(o.material, { transmission: 0, transparent: true, opacity: .55, roughness: .04, metalness: 0, depthWrite: false, envMapIntensity: 1.6 });
      if (o.material && !MODELES[id].reel) { o.material.roughness = Math.max(o.material.roughness ?? .8, .75); o.material.side = THREE.DoubleSide; }
    });
    if (prof.mode === 'mur' || prof.mode === 'plafond' || prof.mode === 'tapis') return { g: pivot, hx: s.x / 2, hz: s.z / 2, h: s.y, billboard: null };
    const o = new THREE.Mesh(new THREE.PlaneGeometry(s.x * 1.25, s.z * 1.25), new THREE.MeshBasicMaterial({ map: ombreTex, transparent: true, depthWrite: false }));
    o.rotation.x = -Math.PI / 2; o.position.y = .007; pivot.add(o);
    return { g: pivot, hx: s.x / 2, hz: s.z / 2, h: s.y, billboard: null };
  }

  const ext = o => { const cs = Math.abs(Math.cos(o.tr)), sn = Math.abs(Math.sin(o.tr)); return [cs * o.hx + sn * o.hz, sn * o.hx + cs * o.hz]; };
  function borner(o) {
    if (o.prof.mode === 'mur') {
      const half = o.hx, hh = o.h / 2;
      o.ty = Math.max(.55 + hh, Math.min(H - .12 - hh, o.ty));
      if (o.wall === 'gauche') { o.tz = Math.max(Z0 + half + .02, Math.min(D / 2 - half, o.tz)); o.tx = X0 + .02; o.tr = Math.PI / 2; }
      else { o.tx = Math.max(X0 + half + .02, Math.min(W / 2 - half, o.tx)); o.tz = Z0 + .02; o.tr = 0; }
      return;
    }
    const [ex, ez] = o.standee && o.prof.mode !== 'tapis' ? [Math.min(o.hx, .35), .2] : ext(o);
    o.tx = Math.max(X0 + ex + .02, Math.min(W / 2 - ex - .02, o.tx));
    o.tz = Math.max(Z0 + ez + .02, Math.min(D / 2 - ez - .02, o.tz));
  }
  // près d'un mur, un meuble se met dos au mur (le dos du modèle = son côté -z)
  function adosser(o) {
    if (o.standee || o.prof.mode !== 'sol') return;
    const dFond = o.tz - Z0 - o.hz, dGauche = o.tx - X0 - o.hz;
    if (dFond < SNAP && dFond <= dGauche) { o.tr = 0; o.tz = Z0 + o.hz + .03; }
    else if (dGauche < SNAP) { o.tr = Math.PI / 2; o.tx = X0 + o.hz + .03; }
  }
  // hauteur de la surface la plus haute sous (x, z), sans compter l'objet lui-même
  const rayBas = new THREE.Raycaster(), vBas = new THREE.Vector3(0, -1, 0), nM = new THREE.Matrix3();
  const normaleY = h => { if (!h.face) return 1; nM.getNormalMatrix(h.object.matrixWorld); return h.face.normal.clone().applyMatrix3(nM).normalize().y; };
  const supports = o => [...objets.values()].filter(p => p !== o && p.prof.mode !== 'mur' && p.prof.mode !== 'plafond' && p.prof.mode !== 'tapis' && !p.standee).map(p => p.grp);
  function surfaceSous(o, x, z) {
    rayBas.set(new THREE.Vector3(x, H, z), vBas);
    const h = rayBas.intersectObjects(supports(o), true).find(h => normaleY(h) > .7);
    return h ? h.point.y : 0;
  }
  const rayon = o => o.prof.mode === 'mur' ? o.hx : Math.max(.25, Math.min(Math.max(o.hx, o.hz), 1.1));
  function libre(o, x, z) { for (const p of objets.values()) { if (p === o || p.prof.mode === 'mur' || p.prof.mode === 'tapis' || p.prof.mode === 'plafond' || p.prof.mode === 'pose') continue; if (Math.hypot(p.tx - x, p.tz - z) < (rayon(p) + rayon(o)) * .85) return false; } return true; }
  function placerAuto(o) {
    if (o.prof.mode === 'mur') {
      for (const [wall, v] of [['fond', 0], ['fond', -1.1], ['fond', 1.1], ['gauche', -.9], ['fond', -1.7], ['fond', 1.7]]) {
        const pris = [...objets.values()].some(p => p !== o && p.prof.mode === 'mur' && p.wall === wall && Math.abs((wall === 'fond' ? p.tx : p.tz) - v) < p.hx + o.hx);
        if (!pris) { o.wall = wall; if (wall === 'fond') o.tx = v; else o.tz = v; o.ty = 1.5; break; }
      }
      if (!o.wall) { o.wall = 'fond'; o.tx = 0; o.ty = 1.5; }
      borner(o);
      return;
    }
    if (o.prof.mode === 'tapis') { o.tx = .2; o.tz = .3; o.tr = 0; return; }
    if (o.prof.mode === 'pose') {
      // d'abord sur une table ou un rangement, sinon par terre
      // un coussin va sur un canapé ou un fauteuil, le reste sur une table ou un rangement
      const coussin = /coussin/i.test(carte(o.id)?.nom + ' ' + carte(o.id)?.desc);
      const meubles = [...objets.values()].filter(p => !p.standee && p.prof.mode === 'sol' && (coussin ? /canapé|fauteuil/i.test(carte(p.id)?.desc || '') : /table|rangement/.test(carte(p.id)?.cat || '')));
      const dejaPoses = [...objets.values()].filter(p => p !== o && p.prof.mode === 'pose').length;
      for (const m of meubles) {
        if (coussin) {
          // dans l'angle de l'assise, contre le dossier, tourné comme le canapé
          const lx = m.hx * .55, lz = -m.hz * .15, c = Math.cos(m.tr), sn = Math.sin(m.tr);
          o.tx = m.tx + lx * c + lz * sn; o.tz = m.tz - lx * sn + lz * c; o.tr = m.tr;
          const y = surfaceSous(o, o.tx, o.tz); if (y > .1) { o.ty = y; return; }
          continue;
        }
        const a = dejaPoses * 2.4, r = Math.min(m.hx, m.hz) * .35;
        o.tx = m.tx + Math.cos(a) * r; o.tz = m.tz + Math.sin(a) * r;
        const y = surfaceSous(o, o.tx, o.tz); if (y > .1) { o.ty = y; return; }
      }
      // sinon par terre, à un endroit où il n'y a pas déjà un autre petit objet
      const poses = [...objets.values()].filter(p => p !== o && p.prof.mode === 'pose');
      for (const [x, z] of [[.9, .9], [1.4, .3], [.2, 1.3], [1.6, 1.3], [-.4, 1.4], [1.7, -.6]]) {
        o.tx = x; o.tz = z; o.ty = 0; borner(o);
        if (!poses.some(p => Math.hypot(p.tx - o.tx, p.tz - o.tz) < .4)) return;
      }
      return;
    }
    const cands = !o.standee && o.hx >= .7 ? [[0, Z0], [.9, Z0], [-.9, Z0], [X0, 0]] : [[.3, .3], [-.6, .6], [1, -.2], [-1, -.6], [.9, .9], [-.2, -.8], [1.3, .7], [-1.3, 1], [0, 1.2], [1.5, -1]];
    for (const [x, z] of cands) {
      o.tx = x === X0 ? X0 + o.hz : x; o.tz = z === Z0 ? Z0 + o.hz : z; o.tr = 0; adosser(o); borner(o);
      if (libre(o, o.tx, o.tz)) return;
    }
  }
  function appliquer(o, instant) {
    if (instant) { o.x = o.tx; o.z = o.tz; o.r = o.tr; o.y = o.ty; }
    o.grp.position.set(o.x, o.prof.mode === 'mur' || o.prof.mode === 'pose' ? o.y : 0, o.z);
    o.grp.rotation.y = o.r;
  }
  const charges = new Map(); let gen = 0;
  async function ajouter(it) {
    if (objets.has(it.id) || charges.has(it.id)) return;
    const g0 = gen;
    const c = carte(it.id); if (!c) return;
    const prof = profil(c);
    const p = (async () => {
      let res = null, standeeF = false;
      if (MODELES[it.id]) { try { res = await modele(it.id, prof); } catch (e) { console.warn('modèle', it.id, e); } }
      if (!res) { res = await standee(c, prof); standeeF = true; }
      if (g0 !== gen) return;
      const grp = new THREE.Group(); grp.add(res.g);
      const o = { id: it.id, grp, prof, standee: standeeF, billboard: res.billboard, hx: res.hx, hz: res.hz, h: res.h,
        tx: it.x ?? 0, tz: it.z ?? 0, tr: it.r ?? 0, ty: it.y ?? (prof.mode === 'pose' ? 0 : 1.5), wall: it.wall || null, born: performance.now() };
      if (prof.mode === 'pose' && it.x != null && (it.y == null || it.y > 1.4)) o.ty = surfaceSous(o, o.tx, o.tz);
      grp.traverse(m => { m.userData.id = it.id; });
      if (it.x == null) placerAuto(o); else borner(o);
      appliquer(o, true);
      scene.add(grp); objets.set(it.id, o);
      if (it.x == null) changer();
    })();
    charges.set(it.id, p);
    try { await p; } finally { if (charges.get(it.id) === p) charges.delete(it.id); }
  }
  function retirer(id) {
    const o = objets.get(id); if (!o) return;
    scene.remove(o.grp); objets.delete(id);
    if (sel === id) choisir(null);
    changer();
  }
  const serialiser = () => [...objets.values()].map(o => ({ id: o.id, x: +o.tx.toFixed(3), z: +o.tz.toFixed(3), r: +o.tr.toFixed(3), y: +o.ty.toFixed(3), wall: o.wall }));
  const changer = () => onChange && onChange(serialiser());
  function choisir(id) {
    sel = id && objets.has(id) ? id : null;
    onSelect && onSelect(sel);
  }

  // ---------- interactions ----------
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const sol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const planFond = new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z0), planGauche = new THREE.Plane(new THREE.Vector3(1, 0, 0), -X0);
  const versRay = e => { const r = renderer.domElement.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); };
  const toucher = () => { const hit = ray.intersectObjects([...objets.values()].map(o => o.grp), true)[0]; return hit ? hit.object.userData.id : null; };
  const pointSol = () => ray.ray.intersectPlane(sol, new THREE.Vector3());
  function pointMur() {
    const a = ray.ray.intersectPlane(planFond, new THREE.Vector3()), b = ray.ray.intersectPlane(planGauche, new THREE.Vector3());
    const okA = a && a.x >= X0 && a.x <= W / 2 && a.y > 0 && a.y < H + .5, okB = b && b.z >= Z0 && b.z <= D / 2 && b.y > 0 && b.y < H + .5;
    if (okA && okB) return a.distanceTo(ray.ray.origin) < b.distanceTo(ray.ray.origin) ? ['fond', a] : ['gauche', b];
    return okA ? ['fond', a] : okB ? ['gauche', b] : null;
  }
  let drag = null;
  renderer.domElement.addEventListener('pointerdown', e => {
    versRay(e);
    const id = toucher();
    if (!id) { choisir(null); return; }
    controls.enabled = false;
    const o = objets.get(id); choisir(id);
    if (o.prof.mode === 'mur') { const m = pointMur(); drag = { o, off: m ? [o.tx - (m[0] === 'fond' ? m[1].x : m[1].z), o.ty - m[1].y] : [0, 0], moved: false }; }
    else { const p = pointSol(); drag = { o, off: p ? [o.tx - p.x, o.tz - p.z] : [0, 0], moved: false }; }
    renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.style.cursor = 'grabbing';
  });
  renderer.domElement.addEventListener('pointermove', e => {
    versRay(e);
    if (!drag) { renderer.domElement.style.cursor = toucher() ? 'grab' : ''; return; }
    const o = drag.o; drag.moved = true;
    if (o.prof.mode === 'mur') {
      const m = pointMur(); if (!m) return;
      const [wall, p] = m;
      if (wall !== o.wall) { o.wall = wall; drag.off[0] = 0; }
      if (wall === 'fond') o.tx = p.x + drag.off[0]; else o.tz = p.z + drag.off[0];
      o.ty = p.y + drag.off[1];
    } else if (o.prof.mode === 'pose') {
      const h = ray.intersectObjects(supports(o), true).find(h => normaleY(h) > .7);
      if (h) { o.tx = h.point.x; o.tz = h.point.z; o.ty = h.point.y; }
      else { const p = pointSol(); if (!p) return; o.tx = p.x; o.tz = p.z; o.ty = 0; }
    } else {
      const p = pointSol(); if (!p) return;
      o.tx = p.x + drag.off[0]; o.tz = p.z + drag.off[1];
      adosser(o);
    }
    borner(o);
  });
  const lacher = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null;
    controls.enabled = true; renderer.domElement.style.cursor = '';
    if (moved) { onPose && onPose(); changer(); }
  };
  renderer.domElement.addEventListener('pointerup', lacher);
  renderer.domElement.addEventListener('pointercancel', lacher);

  // créé après nos écouteurs : on coupe l'orbite avant qu'elle ne démarre quand on attrape un objet
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(cible); controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false;
  controls.minAzimuthAngle = .12; controls.maxAzimuthAngle = 1.45; controls.minPolarAngle = .45; controls.maxPolarAngle = 1.28;
  controls.minDistance = 4.5; controls.maxDistance = 15; controls.rotateSpeed = .6;
  controls.update();

  // ---------- boucle ----------
  const ang = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  function frame(t) {
    controls.update();
    for (const o of objets.values()) {
      const k = drag && drag.o === o ? .45 : .22;
      o.x += (o.tx - o.x) * k; o.z += (o.tz - o.z) * k; o.y += (o.ty - o.y) * k; o.r += ang(o.r, o.tr) * .2;
      appliquer(o, false);
      // apparition : petit rebond, et l'objet attrapé se soulève un peu
      const age = (t - o.born) / 450, pop = age < 1 ? 1 + Math.sin(age * Math.PI) * .12 * (1 - age) : 1;
      const s = (age < 1 ? .6 + .4 * Math.min(1, age * 1.6) : 1) * pop; o.grp.scale.setScalar(s);
      const leve = drag && drag.o === o ? .05 : 0;
      if (o.prof.mode === 'pose') o.grp.position.y = o.y + leve;
      else if (o.prof.mode !== 'mur') o.grp.position.y = leve;
      if (o.billboard) o.billboard.rotation.y = Math.atan2(camera.position.x - o.grp.position.x, camera.position.z - o.grp.position.z) - o.grp.rotation.y;
    }
    const s = sel && objets.get(sel);
    anneau.visible = !!s;
    if (s) {
      const rr = s.prof.mode === 'mur' ? s.hx : Math.max(.3, Math.max(s.hx, s.hz) * 1.05);
      anneau.scale.setScalar(rr);
      if (s.prof.mode === 'mur') anneau.position.set(s.wall === 'gauche' ? X0 + rr + .05 : s.x, .012, s.wall === 'gauche' ? s.z : Z0 + rr + .05);
      else anneau.position.set(s.x, (s.prof.mode === 'pose' ? s.y : 0) + .012, s.z);
      anneau.material.opacity = .6 + Math.sin(t / 220) * .3;
    }
    renderer.render(scene, camera);
  }
  let actif = true;
  renderer.setAnimationLoop(frame);
  new ResizeObserver(() => regler()).observe(stage);

  // les objets à poser arrivent après les meubles qui les portent
  async function peupler(items) {
    const parTerre = items.filter(it => profil(carte(it.id) || { nom: '', desc: '', cat: '' }).mode !== 'pose');
    await Promise.all(parTerre.map(ajouter));
    await Promise.all(items.filter(it => !parTerre.includes(it)).map(ajouter));
  }
  await setDecor(decor || 'base');
  await peupler(items);

  return {
    sync(list) {
      const ids = new Set(list.map(i => i.id));
      for (const id of [...objets.keys()]) if (!ids.has(id)) { scene.remove(objets.get(id).grp); objets.delete(id); if (sel === id) choisir(null); }
      list.forEach(it => ajouter(it));
    },
    select(id) { choisir(id); },
    decor: setDecor,
    // une autre pièce : on vide tout, puis décor et objets de la nouvelle
    async charger(list, nom) {
      gen++; charges.clear(); choisir(null); drag = null; controls.enabled = true;
      for (const o of objets.values()) scene.remove(o.grp);
      objets.clear();
      const g1 = gen;
      if (nom !== decorNom) await setDecor(nom || 'base');
      if (g1 === gen) await peupler(list);
    },
    rotate(id, sens) {
      const o = objets.get(id); if (!o || o.prof.mode === 'mur') return;
      o.tr += sens * PAS; borner(o); changer();
    },
    remove: retirer,
    // position à l'écran d'un objet ou d'un point (pour les tests automatiques)
    ecran(id, pt) {
      const o = id && objets.get(id), v = o ? new THREE.Vector3(o.x, o.prof.mode === 'mur' ? o.y : .3, o.z) : new THREE.Vector3(...pt);
      v.project(camera); const r = renderer.domElement.getBoundingClientRect();
      return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
    },
    pause() { if (actif) { actif = false; renderer.setAnimationLoop(null); } },
    resume() { if (!actif) { actif = true; regler(); renderer.setAnimationLoop(frame); } },
  };
}
