// Le CV : une page web (sources/cv/index.html) exportée en PDF A4 (assets/cv-johan-trigeard.pdf). `npm run cv`.
// Parti pris « carte tirée » : ma carte du booster en grand (photo traitée en gravure), le nom énorme, du vide, l'expérience sur
// trois colonnes, le contact et le QR dans un talon à découper.
// En vrai texte : le HTML suit l'ordre de lecture. Tous les blocs sont positionnés : Chromium écrit le PDF dans l'ordre du HTML.
// Les textes viennent des faits du site (src/data/projects.js, PATH) et de l'ancien CV : pas de chiffre sans source.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import QRCode from 'qrcode';
import { launch } from './make-booster.mjs';
import { CONTACT, BRANDS, mailAddress } from '../src/data/home.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://johantrigeard.com/';
const OUT = path.join(ROOT, 'assets/cv-johan-trigeard.pdf');
const DIR = path.join(ROOT, 'sources/cv');
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

const browser = await launch();

// La photo en gravure : niveaux de gris, puis des tailles d'encre dont l'épaisseur suit l'ombre, croisées dans les noirs.
const src = `data:image/webp;base64,${fs.readFileSync(path.join(ROOT, 'assets/about/johan.webp')).toString('base64')}`;
const tmp = await browser.newPage();
const png = await tmp.evaluate(async (data) => {
  const im = new Image(); im.src = data; await im.decode();
  const W = 1240, H = 1720;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  const sw = im.naturalWidth * 0.8, sh = sw * H / W, sx = im.naturalWidth * 0.1, sy = im.naturalHeight * 0.09;
  x.drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H), p = d.data;
  const rad = (a) => a * Math.PI / 180, A = rad(-38), B = rad(52), P1 = 9.5, P2 = 7;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 4;
    let g = (0.3 * p[k] + 0.59 * p[k + 1] + 0.11 * p[k + 2]) / 255;
    g = Math.min(1, Math.max(0, (g - 0.1) / 0.72)) ** 0.85;
    const wob = Math.sin(i * 0.013 + j * 0.007) * 1.5 + Math.sin(i * 0.004 - j * 0.019) * 2;
    const w1 = 0.5 + 0.5 * Math.cos(2 * Math.PI * ((i * Math.cos(A) + j * Math.sin(A) + wob) / P1));
    const w2 = 0.5 + 0.5 * Math.cos(2 * Math.PI * ((i * Math.cos(B) + j * Math.sin(B) - wob) / P2));
    const ink = g < 0.96 && (w1 > g * 1.02 + 0.02 || (g < 0.34 && w2 > g + 0.45));
    p[k] = ink ? 11 : 239; p[k + 1] = ink ? 11 : 233; p[k + 2] = ink ? 11 : 221; p[k + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c.toDataURL('image/png').split(',')[1];
}, src);
await tmp.close();
fs.writeFileSync(path.join(DIR, 'johan-gravure.png'), Buffer.from(png, 'base64'));

const hyena = (fill) => fs.readFileSync(path.join(ROOT, 'assets/brand/hyena.svg'), 'utf8').replace('fill="#0B0B0B"', `fill="${fill}"`).replace('<svg ', '<svg aria-hidden="true" ');
const logo = (b) => fs.readFileSync(path.join(ROOT, 'assets', b.src), 'utf8').replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<svg\b/, `<svg role="img" aria-label="${b.name}" style="--s:${b.scale}"`);
const qr = await QRCode.toString(SITE, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0B0B0BFF', light: '#EFE9DDFF' } });
const bare = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const mail = mailAddress();

const job = (title, org, when, text, bullets = []) => `
  <article class="job">
    <time>${when}</time>
    <h3>${title}</h3>
    <p class="org">${org}</p>
    ${text ? `<p class="sub">${text}</p>` : ''}
    ${bullets.length ? `<ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : ''}
  </article>`;
const project = (name, text) => `<li><b>${name}</b><br>${text}</li>`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Johan Trigeard · CV · Lead UI/UX &amp; Product Designer</title>
<meta name="description" content="CV de Johan Trigeard, Lead UI/UX et Product Designer à Bordeaux.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  :root { --ink: #0B0B0B; --paper: #EFE9DD; --line: #C9C3B6; --soft: #45433D; --mark: #D0CBC0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { background: var(--paper); color: var(--ink); font: 400 9.5pt/1.38 'Bricolage Grotesque', sans-serif; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3, p, ul, figure { margin: 0; padding: 0; }
  ul { list-style: none; }
  em { font-style: normal; font-weight: 700; background: linear-gradient(var(--mark), var(--mark)) no-repeat 0 90% / 100% .42em; }
  .cv { position: relative; width: 210mm; height: 297mm; overflow: hidden; }
  .head, .talon, .body, .card { position: absolute; }

  /* En haut à droite : le nom, très au-dessus du reste, une phrase, du vide, les marques au pied. */
  .head { left: 93mm; right: 15mm; top: 15mm; height: 110mm; display: flex; flex-direction: column; }
  h1 { font-weight: 800; font-size: 58pt; line-height: .92; letter-spacing: -.035em; font-variation-settings: 'opsz' 96; margin-left: -.6mm; }
  h1 span { display: block; }
  .role { margin-top: 4.5mm; font-weight: 750; font-size: 16pt; line-height: 1.15; letter-spacing: -.015em; }
  .city { margin-top: 1.2mm; font: 500 9pt/1.3 'JetBrains Mono', monospace; letter-spacing: .03em; }
  .hook { margin-top: 6mm; font-size: 13pt; line-height: 1.34; letter-spacing: -.008em; }
  .brands { margin-top: auto; }
  h2 { font: 500 9pt/1 'JetBrains Mono', monospace; letter-spacing: .08em; text-transform: uppercase; padding-bottom: 2.2mm; border-bottom: .25mm solid var(--ink); margin-bottom: 3.4mm; }
  .brands ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.8mm 4mm; align-items: center; }
  .brands li { height: 6.5mm; display: flex; align-items: center; }
  .brands svg { display: block; height: calc(3.5mm * var(--s, 1)); width: auto; max-width: 100%; }
  .brands svg, .brands svg * { fill: var(--ink) !important; stroke: none !important; }

  /* La carte tirée : seule chose qui penche. */
  .card { left: 15mm; top: 15mm; width: 66mm; height: 110mm; transform: rotate(-3deg); background: var(--ink); border-radius: 4.5mm; padding: 2mm 2mm 0; display: flex; flex-direction: column; }
  .card img { display: block; width: 100%; flex: 1; min-height: 0; object-fit: cover; border-radius: 3mm; }
  .card p { color: var(--paper); display: flex; align-items: center; justify-content: space-between; padding: 2.2mm 1.4mm; font: 500 9pt/1 'JetBrains Mono', monospace; letter-spacing: .06em; text-transform: uppercase; }
  .card p span:first-child { display: flex; align-items: center; gap: 1.8mm; }
  .card svg { display: block; width: 7mm; height: 7mm; }

  /* Trois colonnes, posées sur le papier. */
  .body { left: 15mm; right: 15mm; top: 133mm; bottom: 50mm; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 9mm; }
  .col { min-width: 0; display: flex; flex-direction: column; gap: 5mm; }
  .job + .job { margin-top: 4.2mm; }
  time { display: block; font: 400 9pt/1 'JetBrains Mono', monospace; margin-bottom: 1.2mm; }
  h3 { font-size: 11pt; font-weight: 750; letter-spacing: -.012em; line-height: 1.2; }
  .org { font-weight: 500; }
  .sub { color: var(--soft); margin-top: .8mm; }
  .job ul { margin-top: 1.6mm; }
  .job li + li, .list li + li { margin-top: 1.5mm; }
  li b { font-weight: 750; }

  /* Le talon, à découper. */
  .talon { left: 0; right: 0; bottom: 0; height: 43mm; padding: 7.5mm 15mm 0; border-top: .4mm dashed var(--ink); display: flex; justify-content: space-between; }
  .talon h2 { font: 800 22pt/.98 'Bricolage Grotesque', sans-serif; letter-spacing: -.025em; text-transform: none; border: 0; padding: 0; margin: 0 0 3mm; }
  .links { font: 400 9pt/1.6 'JetBrains Mono', monospace; }
  .links a { display: block; }
  .cut { position: absolute; left: 15mm; top: -1.9mm; background: var(--paper); padding: 0 2mm; margin-left: -2mm; font: 500 8.5pt/1.4 'JetBrains Mono', monospace; letter-spacing: .06em; text-transform: uppercase; }
  .qr { display: flex; align-items: flex-start; gap: 5mm; }
  .qr span { text-align: right; font: 500 9pt/1.35 'JetBrains Mono', monospace; padding-top: .4mm; }
  .qr svg { display: block; width: 25.6mm; height: 25.6mm; flex: none; }
</style>
</head>
<body>
<main class="cv">
  <header class="head">
    <h1><span>Johan</span><span>Trigeard</span></h1>
    <p class="role">Lead UI/UX &amp; Product Designer</p>
    <p class="city">Bordeaux</p>
    <p class="hook">Je conçois des produits web et mobile, du parcours au <em>prototype codé</em>. Chez Rhinov, je pilote l'UX <em>entre produit et tech</em>.</p>
    <section class="brands">
      <h2>Marques</h2>
      <ul>${BRANDS.map((b) => `<li>${logo(b)}</li>`).join('')}</ul>
    </section>
  </header>

  <footer class="talon">
    <span class="cut" aria-hidden="true">Bon pour un entretien</span>
    <div>
      <h2>On prend<br>un café&nbsp;?</h2>
    </div>
    <p class="links"><a href="mailto:${mail}">${mail}</a><a href="${CONTACT.linkedin}">${bare(CONTACT.linkedin)}</a><a href="${SITE}">${bare(SITE)}</a></p>
    <a class="qr" href="${SITE}" aria-label="Portfolio de Johan Trigeard : ${bare(SITE)}"><span>Le<br>portfolio</span>${qr}</a>
  </footer>

  <div class="body">
    <section class="col">
      <div>
        <h2>Expérience</h2>
        ${job('Lead UI/UX', 'Rhinov · Maisons du Monde', 'Depuis 2023', 'Graphic Designer en 2023, Lead UI Designer en 2024.', [
          "<b>rhinov.fr</b>, repensé de l'accueil au panier, en binôme avec le PO/PM.",
          "<b>iA Déco</b>, assistant déco par IA, de la landing au chat.",
          "<b>Système Rhinov</b>, logo et design system pour trois marques.",
          "<b>Rhinov Studio</b>, landings et app <em>prototypées en code</em>.",
          "Management d'une petite équipe.",
        ])}
      </div>
      <div>
        <h2>Formation</h2>
        ${job('Master Web Design', 'ECV Bordeaux, Bac+5', '2013 – 2018', '')}
      </div>
    </section>
    <section class="col">
      <div>
        <h2>Avant ça</h2>
        ${job('Designer indépendant', 'Auto-entreprise', 'Depuis 2019', 'Design UI et UX à mon compte.')}
        ${job('Motion Designer', 'Infograpik', '2020 – 2022', 'Animation 2D, logotypes et chartes pour Twitch, Activision, Microsoft.')}
        ${job('Web Designer', 'Intento &amp; Fière Allure', '2018 – 2020', 'Wireframes, sites WordPress, chartes et print.')}
      </div>
      <div>
        <h2>Hors écran</h2>
        <p>Échecs, moto, Final Fantasy et un ptit café.</p>
      </div>
    </section>
    <section class="col">
      <div>
        <h2>Projets</h2>
        <ul class="list">
          ${project('Maisons du Monde · Labo', 'Trois parcours e-commerce, maquettés puis codés.')}
          ${project('Vinyl Run', "Site d'un disquaire, conçu et développé.")}
          ${project('NookDex', 'Collection Pokémon illustrée et codée.')}
          ${project('MyFrenchTool', "L'annuaire des SaaS français, de A à Z.")}
        </ul>
      </div>
      <div>
        <h2>Outils</h2>
        <p>Figma, Claude Code, Photoshop, Illustrator, After Effects, HTML/CSS.</p>
      </div>
    </section>
  </div>

  <figure class="card">
    <img src="johan-gravure.png" alt="Portrait de Johan Trigeard en gravure">
    <p aria-hidden="true"><span>${hyena('#EFE9DD')}</span><span>★</span></p>
  </figure>
</main>
</body>
</html>
`;

const page = path.join(DIR, 'index.html');
fs.writeFileSync(page, html);

const pg = await browser.newPage({ viewport: { width: 794, height: 1123 } });
await pg.goto(pathToFileURL(page).href, { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
const over = await pg.evaluate(() => [...document.querySelectorAll('.col, .head')].map((e) => {
  const box = e.closest('.body, .head').getBoundingClientRect(), end = Math.max(...[...e.children].map((c) => c.getBoundingClientRect().bottom));
  return Math.round(box.bottom - end);
}));
console.log('marge restante en px (head, colonnes) :', over.join(' / '));
await pg.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true, tagged: true });
await browser.close();
console.log('cv', path.relative(ROOT, OUT), `${(fs.statSync(OUT).size / 1024).toFixed(0)} Ko`);
