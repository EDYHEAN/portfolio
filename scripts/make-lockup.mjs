// Le lockup de la marque : la hyène + « Johan / Trigeard » sur deux lignes (Bricolage Grotesque 800, opsz 96, approche
// -0,03 em, interligne 0,94 em), texte vectorisé. `node scripts/make-lockup.mjs` écrit :
// - assets/brand/lockups/logo-johan-trigeard.svg (+ -paper.svg, crème) et leurs aperçus PNG 1600×900 (papier / noir) ;
// - src/wordmark.js : le nom seul en tracés, pour le header (à côté de la hyène vivante).
// Calage : la capitale du J à hauteur des oreilles, la base de « Trigeard » au pied de l'encre (×0,95), gouttière 0,16.
// La police statique est téléchargée une fois dans .cache/ (Google Fonts). Dépendances de dev : opentype.js, playwright.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { launch } from './make-booster.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCKUPS = path.join(ROOT, 'assets/brand/lockups');
const HY = fs.readFileSync(path.join(ROOT, 'assets/brand/hyena.svg'), 'utf8').match(/ d="([^"]+)"/)[1];
const HB = { x: 64, y: 66.586, w: 1071.657, h: 1067.914 }; // encre de la hyène dans son repère 1200

async function font() {
  const file = path.join(ROOT, '.cache/bricolage-800-opsz96.ttf');
  if (!fs.existsSync(file)) {
    // Un vieux User-Agent : Google Fonts répond alors en TrueType, l'instance statique demandée.
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@96,800', { headers: { 'User-Agent': 'Mozilla/4.0' } })).text();
    const url = css.match(/https:\/\/[^)]+\.ttf/)[0];
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
  }
  return opentype.loadSync(file);
}

const f = await font();
const UPM = f.unitsPerEm, CAP = f.tables.os2.sCapHeight / UPM;
const LEAD = 0.94, TRACK = -0.03;
function line(str, size, x, y) {
  let cx = x; const parts = []; const g = f.stringToGlyphs(str);
  g.forEach((q, i) => {
    parts.push(q.getPath(cx, y, size).toPathData(2));
    cx += (q.advanceWidth / UPM) * size;
    if (i < g.length - 1) cx += (f.getKerningValue(q, g[i + 1]) / UPM + TRACK) * size;
  });
  return { d: parts.join(''), w: cx - x };
}

// Lockup : hyène haute de H, bloc texte = 0,95 H, base de « Trigeard » au pied de l'encre.
const H = 300, RATIO = 0.95, GAP = 0.16, PAD = 60;
const k = H / HB.h, size = (H * RATIO) / (CAP + LEAD), block = size * (CAP + LEAD), top = PAD + H - block, tx = PAD + HB.w * k + GAP * H;
const l1 = line('Johan', size, tx, top + CAP * size), l2 = line('Trigeard', size, tx, top + (CAP + LEAD) * size);
const W = Math.ceil(tx + Math.max(l1.w, l2.w) + PAD), HH = Math.ceil(PAD + H + 0.2 * size + PAD);
const svg = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HH}"><g fill="${c}"><path fill-rule="evenodd" transform="translate(${(PAD - HB.x * k).toFixed(2)} ${(PAD - HB.y * k).toFixed(2)}) scale(${k.toFixed(5)})" d="${HY}"/><path d="${l1.d}"/><path d="${l2.d}"/></g></svg>`;
fs.writeFileSync(path.join(LOCKUPS, 'logo-johan-trigeard.svg'), svg('#0B0B0B'));
fs.writeFileSync(path.join(LOCKUPS, 'logo-johan-trigeard-paper.svg'), svg('#EFE9DD'));

const b = await launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
for (const [name, bg, fg] of [['logo-johan-trigeard.png', '#EFE9DD', '#0B0B0B'], ['logo-johan-trigeard-noir.png', '#0B0B0B', '#EFE9DD']]) {
  await pg.setContent(`<body style="margin:0;height:900px;display:grid;place-items:center;background:${bg}"><div style="width:1060px">${svg(fg).replace('<svg ', '<svg style="width:100%;display:block" ')}</div></body>`);
  await pg.screenshot({ path: path.join(LOCKUPS, name) });
}
await b.close();

// Le nom seul (1 em = 100 unités), y = 0 au haut de la capitale de « Johan » : src/wordmark.js.
const S = 100;
const w1 = line('Johan', S, 0, CAP * S), w2 = line('Trigeard', S, 0, (CAP + LEAD) * S);
const gBox = f.getPath('g', 0, (CAP + LEAD) * S, S).getBoundingBox();
const WW = Math.ceil(Math.max(w1.w, w2.w) * 10) / 10, WH = Math.ceil(gBox.y2 * 10) / 10;
fs.writeFileSync(path.join(ROOT, 'src/wordmark.js'), `// Généré par scripts/make-lockup.mjs : « Johan / Trigeard » en Bricolage Grotesque 800, opsz 96, approche -0,03 em, interligne 0,94 em.
// 1 em = 100 unités ; y = 0 au haut de la capitale de « Johan », la ligne de base de « Trigeard » à y = ${((CAP + LEAD) * S).toFixed(1)}.
export const WORDMARK = { w: ${WW}, h: ${WH}, base: ${((CAP + LEAD) * S).toFixed(1)}, d: '${w1.d.replace(/\.00/g, '')}${w2.d.replace(/\.00/g, '')}' };
export const wordmarkSVG = (cls = '') => \`<svg class="\${cls}" viewBox="0 0 \${WORDMARK.w} \${WORDMARK.h}" aria-hidden="true" focusable="false"><path fill="currentColor" d="\${WORDMARK.d}"/></svg>\`;
`);
console.log(`lockup ${W}×${HH}, wordmark ${WW}×${WH}`);
