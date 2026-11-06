// Les visuels de carte du tirage (assets/{id}/card.webp, 900×1500, 3:5) composés en HTML puis rendus en WebP.
// Règle (CLAUDE.md) : une image qui illustre le projet avec élégance, pas une capture de page.
// `node scripts/make-cards.mjs [id…]` (sans argument : toutes). Les logos d'outils de MFT sont dans sources/cards/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './make-booster.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 900, H = 1500;
const dataUri = (file) => {
  const ext = path.extname(file).slice(1).replace('svg', 'svg+xml').replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
};
const svgInline = (file) => fs.readFileSync(file, 'utf8').replace(/<\?xml[^>]*>/, '');
// Grain papier commun (le même bruit que le site), en surimpression douce.
const GRAIN = `<svg class="grain" viewBox="0 0 ${W} ${H}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
const BASE = `*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;position:relative}
.grain{position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:overlay;opacity:.5;pointer-events:none}`;

const CARDS = {
  // MyFrenchTool : le coq en grand sur le bleu, et des outils français posés autour comme des icônes d'app.
  myfrenchtool() {
    const dir = path.join(ROOT, 'sources/cards/mft-tools');
    // Tout tient dans la bande centrale (y 300 à 1150) : dans les petites cases du tirage, la carte est recadrée.
    const tools = [
      ['mistral-icon.png', 95, 330, -9, 122], ['qonto.png', 680, 300, 7, 118], ['alan.svg', 60, 690, 5, 112],
      ['pennylane.png', 725, 740, -6, 110], ['lucca-icon.svg', 165, 1000, 8, 104], ['brevo.svg', 398, 1060, -4, 100],
      ['payfit.png', 620, 990, 4, 108],
    ];
    const rooster = svgInline(path.join(ROOT, 'assets/myfrenchtool/logo-mark.svg')).replace('<svg ', '<svg class="coq" ');
    return `<style>${BASE}
      body{background:radial-gradient(120% 80% at 50% 28%, #2f7dff 0%, #0052CC 48%, #003a94 100%)}
      .coq{position:absolute;left:50%;top:370px;width:380px;height:auto;transform:translateX(-50%);filter:drop-shadow(0 30px 60px rgba(0,20,70,.45))}
      .tool{position:absolute;display:grid;place-items:center;border-radius:28%;background:#fff;
        box-shadow:0 22px 40px -14px rgba(0,25,80,.55), inset 0 -3px 0 rgba(0,0,0,.06)}
      .tool img{width:62%;height:62%;object-fit:contain}
      .flag{position:absolute;left:50%;top:935px;transform:translateX(-50%);display:flex;gap:0;width:120px;height:6px;border-radius:3px;overflow:hidden;opacity:.9}
      .flag i{flex:1}</style>
      ${rooster}
      <div class="flag"><i style="background:#fff"></i><i style="background:#fff;opacity:.55"></i><i style="background:#ff5a5f"></i></div>
      ${tools.map(([f, x, y, r, s]) => `<div class="tool" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;transform:rotate(${r}deg)"><img src="${dataUri(path.join(dir, f))}"></div>`).join('')}
      ${GRAIN}`;
  },
  // Rhinov Studio : le fauteuil en rotin du hero actuel (un rendu Studio, sans shooting), assombri, le logo blanc au centre.
  'rhinov-studio'() {
    const photo = dataUri(path.join(ROOT, 'sources/cards/rhinov-studio/hero.webp'));
    const logo = svgInline(path.join(ROOT, 'assets/rhinov-studio/logo.svg')).replace('<svg ', '<svg class="logo" ');
    return `<style>${BASE}
      body{background:#3B2A20}
      .photo{position:absolute;inset:0;background:url(${photo}) 72% 55% / auto 118%}
      .shade{position:absolute;inset:0;background:rgba(30,20,14,.5)}
      .logo{position:absolute;left:50%;top:50%;width:400px;height:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 8px 24px rgba(0,0,0,.4))}
      .logo path{fill:#fff}
      </style>
      <div class="photo"></div><div class="shade"></div>${logo}
      ${GRAIN}`;
  },
  // Vinyl Run : une vraie photo de la boutique (la fresque des platines Technics, sources/cards/vinyl-run), assombrie,
  // le logo du disquaire en blanc par-dessus (Johan, 06/11).
  'vinyl-run'() {
    const photo = dataUri(path.join(ROOT, 'sources/cards/vinyl-run/boutique-technics.jpg'));
    const logo = svgInline(path.join(ROOT, 'assets/vinyl-run/logo.svg')).replace('<svg ', '<svg class="logo" ');
    return `<style>${BASE}
      body{background:#111110}
      .photo{position:absolute;inset:0;background:url(${photo}) 50% 40% / cover;filter:grayscale(1) contrast(1.1) brightness(.75)}
      .shade{position:absolute;inset:0;background:radial-gradient(70% 45% at 50% 50%, rgba(17,17,16,.55), rgba(17,17,16,.2) 70%),
        linear-gradient(rgba(17,17,16,.35), transparent 30% 65%, rgba(17,17,16,.7))}
      .logo{position:absolute;left:50%;top:50%;width:470px;height:auto;transform:translate(-50%,-50%);fill:#f0ede6;
        filter:drop-shadow(0 10px 30px rgba(0,0,0,.55))}
      .logo *{fill:#f0ede6}
      </style>
      <div class="photo"></div><div class="shade"></div>${logo}
      ${GRAIN}`;
  },
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CARDS);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const id of ids) {
  await page.setContent(`<!doctype html><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600&display=block" rel="stylesheet">${CARDS[id]()}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const png = await page.screenshot({ type: 'png' });
  const webp = Buffer.from(await page.evaluate(async (b64) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0);
    return c.toDataURL('image/webp', 0.86).split(',')[1];
  }, png.toString('base64')), 'base64');
  fs.writeFileSync(path.join(ROOT, `assets/${id}/card.webp`), webp);
  console.log(id, `${(webp.length / 1024).toFixed(0)} Ko`);
}
await browser.close();
