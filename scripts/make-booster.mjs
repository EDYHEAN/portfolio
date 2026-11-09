// La texture du booster 3D (assets/3d/pack-tex.jpg, 1600×1400 : le recto à gauche, le verso à droite, 800 px chacun)
// et son repli 2D (pack-front.webp, le recto), redessinées en SVG depuis les vrais fichiers de marque (hyena.svg,
// Bricolage Grotesque, JetBrains Mono), puis remises dans booster.glb (le modèle n'est pas touché, seule l'image change).
// Mise en page mesurée sur la texture d'origine (bandes, pointillés, étiquettes). `node scripts/make-booster.mjs`
// Dépendances de dev : playwright (un Chromium : PW_CHROMIUM, sinon celui de Playwright), @gltf-transform, draco3dgltf.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PROJECTS } from '../src/data/projects.js'; // le nombre de projets imprimé sur le paquet

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A3D = path.join(ROOT, 'assets/3d');
const HY = fs.readFileSync(path.join(ROOT, 'assets/brand/hyena.svg'), 'utf8').match(/ d="([^"]+)"/)[1];
const INK = '#0A0A0A', PAPER = '#EFE9DD';
// Encre de la hyène dans son repère 1200 (bornes du tracé) : pour la poser par son encre, pas par sa boîte.
const HB = { x: 64, y: 66.586, w: 1071.657, h: 1067.914 };

/** Le contenu du paquet : ce qui change d'une édition à l'autre. */
export const PACK = {
  name: 'Johan Trigeard',
  strip: 'JOHAN TRIGEARD',
  front: { tl: 'BOOSTER', tr: 'N°01', sub: 'PORTFOLIO · ÉDITION 2026', bl: `${String(PROJECTS.length).padStart(2, '0')} PROJETS`, br: 'UI · UX · PRODUIT' },
  back: ['Lead UI/UX & Product Designer', 'Bordeaux, France', 'Contenu : projets choisis, sans doublon garanti.'],
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// La hyène posée par son encre : largeur d'encre w, centrée en cx, haut de l'encre en top.
const hyena = (cx, top, w, fill = INK) => {
  const k = w / HB.w;
  return `<path fill="${fill}" fill-rule="evenodd" transform="translate(${(cx - w / 2 - HB.x * k).toFixed(2)} ${(top - HB.y * k).toFixed(2)}) scale(${k.toFixed(5)})" d="${HY}"/>`;
};
// Texte mono : la graisse 500 de JetBrains Mono, l'approche en em ; `end` et `middle` compensent l'approche finale.
const mono = (s, x, y, { size = 18, ls = 0.16, anchor = 'start', fill = INK, opacity = 1 } = {}) => {
  const dx = anchor === 'end' ? size * ls : anchor === 'middle' ? (size * ls) / 2 : 0;
  return `<text x="${x + dx}" y="${y}" font-family="JetBrains Mono" font-weight="500" font-size="${size}" letter-spacing="${ls}em" text-anchor="${anchor}" fill="${fill}" fill-opacity="${opacity}">${esc(s)}</text>`;
};
const name = (s, x, y, size, fill = INK) =>
  `<text x="${x}" y="${y}" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" letter-spacing="-0.03em" text-anchor="middle" style="font-variation-settings:'opsz' 96" fill="${fill}">${esc(s)}</text>`;

// Une bande noire (haut ou bas) : un pointillé 8/6 sur toute la face, masqué derrière le texte par une pastille noire.
function strip(x0, y0, label, s = {}) {
  const bg = s.stripBg || INK, txt = s.stripText || PAPER, dash = s.stripDash || '#858585';
  const mid = y0 + 54, size = 16.5, ls = 0.34;
  const tw = label.length * size * 0.6 + (label.length - 1) * size * ls; // chasse fixe : largeur exacte
  return `<rect x="${x0}" y="${y0}" width="800" height="110" fill="${bg}"/>`
    + `<line x1="${x0}" x2="${x0 + 800}" y1="${mid + 0.6}" y2="${mid + 0.6}" stroke="${dash}" stroke-width="1.25" stroke-dasharray="8 6"/>`
    + `<rect x="${x0 + 400 - tw / 2 - 18}" y="${mid - 12}" width="${tw + 36}" height="24" fill="${bg}"/>`
    + mono(label, x0 + 400, mid + 6, { size, ls, anchor: 'middle', fill: txt });
}

/** Les deux faces en un SVG 1600×1400. */
export function packSVG(p = PACK) {
  const f = p.front, s = p.skin || {}, ink = s.ink || INK;
  const face = (x0) => `<rect x="${x0}" y="110" width="800" height="1180" fill="url(#paper)"/>${strip(x0, 0, p.strip, s)}${strip(x0, 1290, p.strip, s)}`;
  // Recto : la hyène, le nom, l'édition, en un bloc centré dans le papier (plus petit que la 1re édition « edyhean »).
  const front = face(0)
    + mono(f.tl, 55, 175, { fill: ink }) + mono(f.tr, 743, 175, { anchor: 'end', fill: ink })
    + hyena(400, p.logoSvg ? 300 : 372, 440, ink)
    + name(p.name, 400, p.logoSvg ? 876 : 948, 76, ink)
    + (p.logoSvg || '')
    + mono(f.sub, 400, p.logoSvg ? 1098 : 1022, { ls: 0.3, anchor: 'middle', fill: ink })
    + mono(f.bl, 55, 1238, { fill: ink }) + mono(f.br, 742.5, 1238, { anchor: 'end', fill: ink });
  // Verso : petite hyène, le nom, puis la notice, en un bloc centré dans le papier.
  const back = face(800)
    + hyena(1200, 494, 220, ink)
    + name(p.name, 1200, 774, 44, ink)
    + p.back.map((s, i) => mono(s, 1200, 854 + i * 26.5, { size: 17, ls: 0, anchor: 'middle', opacity: 0.68, fill: ink })).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1400" width="1600" height="1400">
<defs><linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.paperTop || '#E5E0D8'}"/><stop offset="1" stop-color="${s.paperBottom || '#D7CFC0'}"/></linearGradient></defs>
${front}${back}</svg>`;
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=JetBrains+Mono:wght@500&display=block';
/** Rend un SVG de packSVG en PNG (Buffer), polices chargées. */
export async function render(svg, browser) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
  await page.setContent(`<!doctype html><link rel="stylesheet" href="${FONTS}"><style>html,body{margin:0}svg{display:block}</style>${svg}`);
  await page.evaluate(async () => { await document.fonts.load("800 76px 'Bricolage Grotesque'"); await document.fonts.load("500 18px 'JetBrains Mono'"); await document.fonts.ready; });
  const png = await page.screenshot({ type: 'png' });
  await page.close();
  return png;
}

export async function launch() {
  const { chromium } = await import('playwright');
  const def = path.join(process.env.USERPROFILE || process.env.HOME || '', 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe');
  const executablePath = process.env.PW_CHROMIUM || (fs.existsSync(def) ? def : undefined);
  // Lissage en niveaux de gris : pas de franges colorées (ClearType) dans la texture.
  return chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--disable-lcd-text', '--font-render-hinting=none'] });
}

/** Le paquet d'une candidature (src/data/applications/{slug}.js) : le logo est posé en blanc, sous le nom. */
async function applicationPack(slug) {
  const app = (await import(pathToFileURL(path.join(ROOT, 'src/data/applications', `${slug}.js`)).href)).default;
  const p = { ...app.booster.pack };
  if (p.logo) {
    const svg = fs.readFileSync(path.join(ROOT, 'assets', p.logo), 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    const w = 330, h = (w * vb[3]) / vb[2];
    p.logoSvg = `<svg x="${400 - w / 2}" y="940" width="${w}" height="${h}" viewBox="${vb.join(' ')}">${svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</svg>`;
  }
  return { pack: p, dir: path.join(ROOT, 'assets', 'apply', slug), glb: path.join(ROOT, 'assets', app.booster.glb) };
}

async function main() {
  const slug = process.argv[2];
  const target = slug ? await applicationPack(slug) : { pack: PACK, dir: A3D, glb: path.join(A3D, 'booster.glb') };
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
  const png = await render(packSVG(target.pack), browser);
  // JPEG pour le .glb (comme l'original), WebP du recto pour le repli 2D : encodés par le navigateur (pas de sharp ici).
  const enc = async (type, quality, crop, w, h) => page.evaluate(async ({ b64, type, quality, crop, w, h }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, crop[0], crop[1], crop[2], crop[3], 0, 0, w, h);
    return c.toDataURL(type, quality).split(',')[1];
  }, { b64: png.toString('base64'), type, quality, crop, w, h });
  const jpg = Buffer.from(await enc('image/jpeg', 0.84, [0, 0, 1600, 1400], 1600, 1400), 'base64');
  const webp = Buffer.from(await enc('image/webp', 0.86, [0, 0, 800, 1400], 560, 980), 'base64');
  await browser.close();
  if (!slug) fs.writeFileSync(path.join(A3D, 'pack-tex.jpg'), jpg);
  fs.writeFileSync(path.join(target.dir, 'pack-front.webp'), webp);

  // La nouvelle image dans booster.glb, à la place de l'ancienne (même texture, mêmes UV, même compression Draco).
  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const draco3d = (await import('draco3dgltf')).default;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule(),
  });
  const glbPath = target.glb;
  const doc = await io.read(path.join(A3D, 'booster.glb')); // le modèle de base : seule l'image change
  const tex = doc.getRoot().listTextures();
  if (tex.length !== 1) throw new Error(`booster.glb : ${tex.length} textures, 1 attendue`);
  tex[0].setImage(new Uint8Array(jpg)).setMimeType('image/jpeg');
  await io.write(glbPath, doc);
  console.log(`pack-tex.jpg ${(jpg.length / 1024).toFixed(0)} Ko, pack-front.webp ${(webp.length / 1024).toFixed(0)} Ko, booster.glb ${(fs.statSync(glbPath).size / 1024).toFixed(0)} Ko`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
