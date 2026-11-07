// Les trois prototypes du projet « Maisons du Monde · Labo », copiés depuis les sources de Johan
// (sources/raw/vibecoded, ignoré par git) vers assets/mdm-labo/live/, allégés pour le site :
//   piece-rare/ : Booster « Pièce Rare » (cartes de meubles en boosters, pièces en 3D) ; meubles .glb en Draco,
//                 textures plafonnées à 1024 px, sonde des cadres Gemini (jamais générés) retirée.
//   visite/     : Catalogue Visite (la maison pièce par pièce) ; scènes et produits en WebP.
//   24h/        : « 24 h à la maison » (le scroll fait tourner l'heure) ; produits en WebP.
// `node scripts/make-mdm-labo.mjs` (ffmpeg dans le PATH ; dépendances de dev : @gltf-transform, draco3dgltf).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { patchHtml } from './patch-live.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'sources/raw/vibecoded');
const OUT = path.join(ROOT, 'assets/mdm-labo/live');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mdm-labo-'));

const ff = (...args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
const copy = (from, to) => fs.cpSync(from, to, { recursive: true });
const write = (f, s) => (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, s));
/** Une image en WebP (alpha gardé), largeur plafonnée. */
const webp = (from, to, { width, q = 82 } = {}) =>
  ff('-i', from, ...(width ? ['-vf', `scale='min(${width},iw)':-2`] : []), '-c:v', 'libwebp', '-quality', String(q), to);
/** Remplace un motif qui DOIT exister (sinon la copie ne correspond plus à la source : on s'arrête). */
const swap = (s, from, to, label) => {
  const n = s.split(from).length - 1;
  if (!n) throw new Error(`motif introuvable : ${label}`);
  return s.split(from).join(to);
};
const size = (d) => fs.readdirSync(d, { recursive: true }).reduce((t, f) => t + (fs.statSync(path.join(d, f)).isFile() ? fs.statSync(path.join(d, f)).size : 0), 0);

// Dans le cadre de la page projet (1440 × ~780 px), la photo carrée de la fiche produit poussait le reste hors du drawer :
// la photo devient élastique (elle prend la place laissée par le texte et la rangée de produits) et tout se resserre
// sur un cadre bas : le drawer se voit en entier à toutes les hauteurs (les deux catalogues ; Johan, 07/11).
const SHEET = '@media (min-width:700px){#fiche .scroll{display:flex;flex-direction:column}#fiche .visuel{aspect-ratio:auto;flex:1 1 0;min-height:110px;max-height:420px}#fiche .corps,#fiche .piece{flex:none}}@media (min-width:700px) and (max-height:760px){#fiche .corps{padding:16px 28px 18px}#fiche .nom{font-size:28px}#fiche .prix{margin-top:10px}#fiche .add{margin-top:14px}#fiche .piece{padding:14px 0 16px 28px}#fiche .piece h3{margin-bottom:8px}.rail button{flex-basis:68px}.rail img{width:68px;height:68px}}</style>';

fs.rmSync(OUT, { recursive: true, force: true });

// ---------- Pièce Rare ----------
{
  const from = path.join(SRC, 'Booster/_wasmer'), to = path.join(OUT, 'piece-rare');
  for (const d of ['brand', 'cut', 'items']) copy(path.join(from, d), path.join(to, d));
  copy(path.join(from, 'cartes.js'), path.join(to, 'cartes.js'));
  copy(path.join(from, 'piece3d.js'), path.join(to, 'piece3d.js'));
  let html = fs.readFileSync(path.join(from, 'index.html'), 'utf8');
  html = swap(html, "['commune', 'rare', 'epique', 'legendaire', 'bon', 'dos'].forEach(r => { const i = new Image(); i.onload = () => FRAMEPNG[r] = true; i.src = 'frames/' + r + '.png'; });", '', 'sonde des cadres');
  // Sur la page projet, le prototype tourne deux fois (cadre bureau 1440 px + mobile 390 px) avec le même localStorage :
  // chaque copie écrasait la partie de l'autre (boosters, collection, pièce). Une sauvegarde par largeur.
  html = swap(html, "const KEY = 'piece-rare-v2';", "const KEY = 'piece-rare-v2' + (innerWidth < 700 ? '-m' : '');", 'clé de sauvegarde');
  write(path.join(to, 'index.html'), patchHtml(html)); // pause + densité 1 dans le cadre (patch-live.mjs)

  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS, KHRDracoMeshCompression } = await import('@gltf-transform/extensions');
  const draco3d = (await import('draco3dgltf')).default;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });
  const models = path.join(from, 'models');
  const files = fs.readdirSync(models, { recursive: true }).filter((f) => f.endsWith('.glb'));
  copy(path.join(models, 'index.json'), path.join(to, 'models/index.json'));
  for (const f of files) {
    const doc = await io.read(path.join(models, f));
    for (const t of doc.getRoot().listTextures()) {
      const [w, h] = t.getSize() || [0, 0];
      if (Math.max(w, h) <= 1024) continue;
      const a = path.join(TMP, 'in'), b = path.join(TMP, 'out.jpg');
      fs.writeFileSync(a, t.getImage());
      // les textures sont des JPEG (couleur, normales, rugosité) : on les garde en JPEG, juste plus petites
      ff('-i', a, '-vf', 'scale=1024:1024:force_original_aspect_ratio=decrease', '-q:v', '3', b);
      t.setImage(fs.readFileSync(b)).setMimeType('image/jpeg');
    }
    doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 });
    write(path.join(to, 'models', f), await io.writeBinary(doc));
  }
}

// ---------- Catalogue Visite ----------
{
  const from = path.join(SRC, 'Catalogue-Visite/site'), to = path.join(OUT, 'visite');
  fs.mkdirSync(path.join(to, 'scenes'), { recursive: true });
  fs.mkdirSync(path.join(to, 'produits'), { recursive: true });
  let html = fs.readFileSync(path.join(from, 'index.html'), 'utf8');
  for (const f of fs.readdirSync(path.join(from, 'scenes'))) {
    const src = path.join(from, 'scenes', f), ext = path.extname(f);
    if (ext === '.svg' || ext === '.webp') { copy(src, path.join(to, 'scenes', f)); continue; }
    const name = f.replace(ext, '.webp');
    webp(src, path.join(to, 'scenes', name));
    html = swap(html, `scenes/${f}`, `scenes/${name}`, f);
  }
  for (const f of fs.readdirSync(path.join(from, 'produits'))) webp(path.join(from, 'produits', f), path.join(to, 'produits', f.replace(/\.\w+$/, '.webp')), { q: 80 });
  html = swap(html, 'produits/${sku}.jpg', 'produits/${sku}.webp', 'image produit');
  html = swap(html, '</style>', SHEET, 'feuille de style');
  write(path.join(to, 'index.html'), patchHtml(html)); // pause + densité 1 dans le cadre (patch-live.mjs)
  copy(path.join(from, 'produits.js'), path.join(to, 'produits.js'));
  // Le diaporama de la page projet (« La maison, pièce par pièce ») : les scènes en 1600 px, pas celles du prototype.
  const rooms = path.join(OUT, '../rooms');
  fs.rmSync(rooms, { recursive: true, force: true });
  fs.mkdirSync(rooms, { recursive: true });
  for (const r of ['facade.webp', 'entree.jpg', 'sejour.jpg', 'cuisine.jpg', 'palier.jpg', 'chambre.jpg', 'enfant.jpg'])
    webp(path.join(from, 'scenes', r), path.join(rooms, r.replace(/\.\w+$/, '.webp')), { width: 1600, q: 80 });
}

// ---------- 24 h à la maison ----------
{
  const from = path.join(SRC, 'Catalogue-Temps-Qui-Passe/site'), to = path.join(OUT, '24h');
  copy(path.join(from, 'img'), path.join(to, 'img'));
  fs.mkdirSync(path.join(to, 'produits'), { recursive: true });
  for (const f of fs.readdirSync(path.join(from, 'produits'))) webp(path.join(from, 'produits', f), path.join(to, 'produits', f.replace(/\.\w+$/, '.webp')), { q: 80 });
  let html = fs.readFileSync(path.join(from, 'index.html'), 'utf8');
  html = swap(html, 'produits/${sku}.jpg', 'produits/${sku}.webp', 'image produit');
  html = swap(html, '</style>', SHEET, 'feuille de style');
  write(path.join(to, 'index.html'), patchHtml(html)); // pause + densité 1 dans le cadre (patch-live.mjs)
  copy(path.join(from, 'produits.js'), path.join(to, 'produits.js'));
}

fs.rmSync(TMP, { recursive: true, force: true });
for (const d of fs.readdirSync(OUT)) console.log(`${d.padEnd(12)} ${(size(path.join(OUT, d)) / 1e6).toFixed(1)} Mo`);
