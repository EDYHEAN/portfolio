// L'image de partage (Open Graph, 1200×630) : le lockup, le poste, et trois vraies cartes du tirage en éventail.
// `npm run og` écrit assets/og.jpg, servi à la racine et déclaré dans scripts/shell.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './make-booster.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200, H = 630;
const asset = (p) => path.join(ROOT, 'assets', p);
const dataUri = (file) => `data:image/webp;base64,${fs.readFileSync(file).toString('base64')}`;
const lockup = fs.readFileSync(asset('brand/lockups/logo-johan-trigeard-paper.svg'), 'utf8').replace(/<\?xml[^>]*>/, '');

// [projet, décalage horizontal, décalage vertical, rotation]
const CARDS = [
  ['myfrenchtool', 672, 118, -13],
  ['nookdex', 942, 118, 13],
  ['mdm-labo', 806, 64, 0],
];

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: radial-gradient(90% 120% at 12% 20%, #1B1A18 0%, #0B0B0B 62%); color: #EFE9DD; }
  .lock { position: absolute; left: 72px; top: 150px; width: 510px; }
  .lock svg { display: block; width: 100%; height: auto; }
  .role { position: absolute; left: 102px; top: 376px; margin: 0; font: 500 23px/1.45 'JetBrains Mono', monospace; letter-spacing: 0.02em; }
  .card { position: absolute; width: 270px; height: 450px; padding: 8px; border-radius: 24px; background: #EFE9DD; box-shadow: 0 34px 70px rgba(0, 0, 0, 0.6); transform-origin: 50% 90%; }
  .card img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 17px; }
</style>
<div class="lock">${lockup}</div>
<p class="role">Lead UI/UX &amp; Product Designer<br>Bordeaux</p>
${CARDS.map(([id, x, y, r]) => `<div class="card" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><img src="${dataUri(asset(`${id}/card.webp`))}" alt=""></div>`).join('')}`;

const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });
await page.waitForTimeout(150);
const out = asset('og.jpg');
await page.screenshot({ path: out, type: 'jpeg', quality: 90 });
await browser.close();
console.log('og.jpg', `${(fs.statSync(out).size / 1024).toFixed(0)} Ko`);
