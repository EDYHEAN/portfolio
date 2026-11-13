// La signature mail : la hyène en GIF animé (assets/signature/hyena.gif, servi sur johantrigeard.com/signature/hyena.gif)
// La signature elle-même et la page pour la copier dans Gmail / Outlook : assets/signature/index.html (écrite à la main, johantrigeard.com/signature/).
// La hyène fait son tour de carte comme sur la home, et change de rendu au passage de profil :
// gravure → riso → trame → holo → gravure. La 1re image = la gravure de face (Outlook classique n'affiche qu'elle).
// `node scripts/make-signature.mjs` (ffmpeg dans le PATH).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launch } from './make-booster.mjs';
import { HYENA_BODY, HYENA_PUPILS } from '../src/hyena.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = 168; // côté du GIF (affiché en 84 px : net sur écran Retina)
const INK = '#0B0B0B', PAPER = '#EFE9DD';
const FPS = 15, SPIN = 0.8; // un tour en 0,8 s à 15 i/s, ralenti en fin de course (power2.out, comme logo.js)

// Rendu = calques de hyène (mêmes couleurs que src/logo.js, trame grossie pour la petite taille).
const RENDERS = {
  gravure: [{ fill: INK }],
  riso: [{ fill: '#FF48B0', blend: 1, dx: -1.6, dy: 1.1 }, { fill: '#0078BF', blend: 1, dx: 1.4, dy: -0.9 }],
  trame: [{ fill: 'url(#dots)', pupil: INK }],
  holo: [{ fill: 'url(#holo)', pupil: INK }],
};
// [rendu, durée à l'arrêt en s]
const SEQ = [['gravure', 3.2], ['riso', 1.6], ['trame', 1.6], ['holo', 1.6]];

const svg = (l) => `<svg viewBox="0 0 1200 1200"><path fill="${l.fill}" fill-rule="evenodd" d="${HYENA_BODY}"/>${HYENA_PUPILS.map((p) => `<path fill="${l.pupil || l.fill}" d="${p.d}"/>`).join('')}</svg>`;
const html = `<!doctype html><meta charset="utf-8"><style>
  html, body { margin: 0; background: ${PAPER}; }
  #tile { position: relative; width: ${S}px; height: ${S}px; overflow: hidden; background: ${PAPER}; perspective: ${S * 4}px; }
  #flip { position: absolute; inset: 7%; transform-style: preserve-3d; }
  .l { position: absolute; inset: 0; }
  .l.m { mix-blend-mode: multiply; }
  svg { display: block; width: 100%; height: 100%; }
</style>
<svg width="0" height="0" style="position:absolute"><defs>
  <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="20" cy="20" r="14" fill="${INK}"/></pattern>
  <linearGradient id="holo" gradientUnits="userSpaceOnUse" x1="150" y1="100" x2="1050" y2="1100">
    <stop offset="0" stop-color="#ff6ec4"/><stop offset=".25" stop-color="#ffd36e"/><stop offset=".5" stop-color="#7afcff"/><stop offset=".75" stop-color="#b18cff"/><stop offset="1" stop-color="#ff6ec4"/>
  </linearGradient>
</defs></svg>
<div id="tile"><div id="flip"></div></div>
<script>
  const R = ${JSON.stringify(Object.fromEntries(Object.entries(RENDERS).map(([k, ls]) => [k, ls.map((l) => ({ ...l, svg: svg(l) }))])))};
  const flip = document.getElementById('flip');
  window.frame = (render, deg) => {
    flip.innerHTML = R[render].map((l) => '<div class="l' + (l.blend ? ' m' : '') + '" style="transform:translate(' + (l.dx || 0) + '%,' + (l.dy || 0) + '%)">' + l.svg + '</div>').join('');
    flip.style.transform = 'rotateY(' + deg + 'deg)';
  };
</script>`;

// Les images : chaque arrêt = 1 image longue, chaque tour = des images à 25 i/s.
const frames = []; // { render, deg, dur }
const ease = (t) => 1 - (1 - t) ** 2;
SEQ.forEach(([render, hold], i) => {
  frames.push({ render, deg: 0, dur: hold });
  const next = SEQ[(i + 1) % SEQ.length][0];
  const n = Math.round(SPIN * FPS);
  for (let k = 1; k < n; k++) {
    const deg = 360 * ease(k / n);
    frames.push({ render: deg < 90 ? render : next, deg, dur: 1 / FPS }); // le rendu change au passage de profil
  }
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'signature-'));
const browser = await launch();
const page = await browser.newPage({ viewport: { width: S, height: S }, deviceScaleFactor: 1 });
await page.setContent(html);
const tile = page.locator('#tile');
for (const [i, f] of frames.entries()) {
  await page.evaluate(([r, d]) => window.frame(r, d), [f.render, f.deg]);
  f.file = path.join(tmp, `f${String(i).padStart(3, '0')}.png`);
  await tile.screenshot({ path: f.file });
}
await browser.close();

// Liste ffmpeg (durée de chaque image), puis palette commune et GIF qui boucle.
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, frames.map((f) => `file '${f.file.replace(/\\/g, '/')}'\nduration ${f.dur.toFixed(3)}`).join('\n') + `\nfile '${frames[0].file.replace(/\\/g, '/')}'\n`);
const outDir = path.join(ROOT, 'assets/signature');
fs.mkdirSync(outDir, { recursive: true });
const gif = path.join(outDir, 'hyena.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
  '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=48:stats_mode=full:reserve_transparent=0[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
  '-fps_mode', 'vfr', '-loop', '0', gif]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('signature/hyena.gif', `${frames.length} images`, `${(fs.statSync(gif).size / 1024).toFixed(0)} Ko`);
