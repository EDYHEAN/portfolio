// Les visuels de carte du tirage (assets/{id}/card.webp, 900×1500, 3:5) composés en HTML puis rendus en WebP.
// Règle (CLAUDE.md) : une image qui illustre le projet avec élégance, pas une capture de page.
// `node scripts/make-cards.mjs [id…]` (sans argument : toutes). Les logos d'outils de MFT sont dans sources/cards/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
  // Système Rhinov : une pièce du design system (la carte « Pièce de vie »), sous un voile léger, le R. en grand (Johan, 09/11).
  'systeme-rhinov'() {
    const photo = dataUri(path.join(ROOT, 'sources/cards/systeme-rhinov/interieur.webp'));
    const mark = svgInline(path.join(ROOT, 'assets/systeme-rhinov/logo-mark.svg')).replace('<svg ', '<svg class="mark" ');
    return `<style>${BASE}
      body{background:#3B2B1F}
      .photo{position:absolute;inset:0;background:url(${photo}) 50% 50% / cover}
      .shade{position:absolute;inset:0;background:rgba(40,28,20,.34)}
      .mark{position:absolute;left:50%;top:50%;width:300px;height:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 10px 28px rgba(0,0,0,.4))}
      </style>
      <div class="photo"></div><div class="shade"></div>${mark}
      ${GRAIN}`;
  },
  // rhinov.fr : les décoratrices du deck (la vraie page qu'elles présentent), sous un voile cacao, le logo blanc au centre.
  'rhinov-site'() {
    const photo = dataUri(path.join(ROOT, 'sources/cards/rhinov-site/decoratrices.webp'));
    const logo = svgInline(path.join(ROOT, 'assets/rhinov-site/logo.svg')).replace('<svg ', '<svg class="logo" ');
    return `<style>${BASE}
      body{background:#3B2B1F}
      .photo{position:absolute;inset:0;background:url(${photo}) 30% 42% / auto 104%}
      .shade{position:absolute;inset:0;background:rgba(59,43,31,.64)}
      .logo{position:absolute;left:50%;top:50%;width:440px;height:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 8px 24px rgba(0,0,0,.35))}
      .logo *{fill:#fff}
      </style>
      <div class="photo"></div><div class="shade"></div>${logo}
      ${GRAIN}`;
  },
  // iA Déco : le couloir bleu des tests de marque (image sans logo tirée du Figma), le logo du produit en blanc au centre.
  'ia-deco'() {
    const photo = dataUri(path.join(ROOT, 'sources/cards/ia-deco/couloir.webp'));
    const logo = svgInline(path.join(ROOT, 'assets/ia-deco/logo.svg')).replace('<svg ', '<svg class="logo" ');
    return `<style>${BASE}
      body{background:#1C2553}
      .photo{position:absolute;inset:0;background:url(${photo}) 50% 50% / cover}
      .shade{position:absolute;inset:0;background:radial-gradient(62% 17% at 50% 50%, rgba(18,24,60,.78), rgba(18,24,60,0) 100%)}
      .logo{position:absolute;left:50%;top:50%;width:560px;height:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 8px 24px rgba(0,0,0,.4))}
      .logo *{fill:#fff}
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
  // Maisons du Monde · Labo : la pièce de nuit de « 24 h à la maison », assombrie, et une vraie carte de Pièce Rare
  // (rendue par le code du prototype, sources/cards/mdm-labo) posée de biais au centre : deux des trois expériences.
  'mdm-labo'() {
    const dir = path.join(ROOT, 'sources/cards/mdm-labo');
    const photo = dataUri(path.join(dir, 'nuit.webp'));
    const card = dataUri(path.join(dir, 'mdm-254422.webp'));
    return `<style>${BASE}
      body{background:#14100c}
      .photo{position:absolute;inset:0;background:url(${photo}) 43% 50% / auto 100%}
      .shade{position:absolute;inset:0;background:radial-gradient(55% 38% at 50% 48%, rgba(20,16,12,.15), rgba(20,16,12,.62) 80%),
        linear-gradient(rgba(20,16,12,.4), transparent 25% 70%, rgba(20,16,12,.75))}
      .glow{position:absolute;left:50%;top:48%;width:760px;height:760px;transform:translate(-50%,-50%);
        background:radial-gradient(closest-side, rgba(255,196,120,.32), transparent)}
      .card{position:absolute;left:50%;top:48%;width:470px;height:auto;transform:translate(-50%,-50%) rotate(-6deg);
        filter:drop-shadow(0 40px 50px rgba(0,0,0,.6)) drop-shadow(0 6px 12px rgba(0,0,0,.35))}
      </style>
      <div class="photo"></div><div class="shade"></div><div class="glow"></div><img class="card" src="${card}">
      ${GRAIN}`;
  },
};

// node scripts/make-cards.mjs apply:{slug} : les cartes d'une candidature (config src/data/applications/{slug}.js).
const appCard = (a) => `<style>${BASE}
  body{background:${a.bg}}
  .art{position:absolute;left:50%;top:50%;height:1270px;width:auto;transform:translate(-50%,-50%);
    -webkit-mask-image:linear-gradient(90deg,transparent,#000 9% 91%,transparent),linear-gradient(transparent,#000 7% 90%,transparent);-webkit-mask-composite:source-in;
    mask-image:linear-gradient(90deg,transparent,#000 9% 91%,transparent),linear-gradient(transparent,#000 7% 90%,transparent);mask-composite:intersect}
  svg.court{position:absolute;inset:0;width:100%;height:100%}
  </style>
  <svg class="court" viewBox="0 0 ${W} ${H}" fill="none" stroke="${a.lines}" stroke-width="5"><path d="M90 -20V1520M810 -20V1520M90 330H810M90 1170H810M450 330V1170"/></svg>
  <img class="art" src="${dataUri(path.join(ROOT, 'assets', a.poster))}">
  ${GRAIN}`;
const jobs = [];
for (const arg of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CARDS)) {
  if (arg.startsWith('apply:')) {
    const slug = arg.slice(6);
    const app = (await import(pathToFileURL(path.join(ROOT, 'src/data/applications', `${slug}.js`)).href)).default;
    fs.mkdirSync(path.join(ROOT, 'assets/apply', slug, 'cards'), { recursive: true });
    for (const p of app.projects) jobs.push({ id: `${slug}/${p.id}`, html: () => appCard(p.cardArt), out: path.join(ROOT, 'assets', p.card) });
  } else jobs.push({ id: arg, html: () => CARDS[arg](), out: path.join(ROOT, `assets/${arg}/card.webp`) });
}
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const { id, html, out } of jobs) {
  await page.setContent(`<!doctype html><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600&display=block" rel="stylesheet">${html()}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const png = await page.screenshot({ type: 'png' });
  const webp = Buffer.from(await page.evaluate(async (b64) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0);
    return c.toDataURL('image/webp', 0.86).split(',')[1];
  }, png.toString('base64')), 'base64');
  fs.writeFileSync(out, webp);
  console.log(id, `${(webp.length / 1024).toFixed(0)} Ko`);
}
await browser.close();
