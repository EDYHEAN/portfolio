// Variante du CV, gardée en option (sources/cv-aere/cv-aere.pdf) : node scripts/make-cv-aere.mjs.
// Peu de tuiles, beaucoup d'air : à gauche la carte photo et la tuile encre (QR), le reste posé sur le papier. Le nom domine.
// En vrai texte : le HTML suit l'ordre de lecture (nom, contact, accroche, expérience...), la grille place les deux colonnes.
// Les deux colonnes sont positionnées : Chromium écrit alors le PDF dans l'ordre du HTML.
// Les textes viennent des faits du site (src/data/projects.js, PATH) et de l'ancien CV : pas de chiffre sans source.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import QRCode from 'qrcode';
import { launch } from './make-booster.mjs';
import { CONTACT, BRANDS, mailAddress } from '../src/data/home.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://johantrigeard.com/';
const OUT = path.join(ROOT, 'sources/cv-aere/cv-aere.pdf');
const DIR = path.join(ROOT, 'sources/cv-aere');
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(ROOT, 'assets/about/johan.webp'), '-vf', 'scale=760:-2', '-q:v', '4', path.join(DIR, 'johan.jpg')]);

const hyena = fs.readFileSync(path.join(ROOT, 'assets/brand/hyena.svg'), 'utf8').replace('<svg ', '<svg aria-hidden="true" ');
const logo = (b) => fs.readFileSync(path.join(ROOT, 'assets', b.src), 'utf8').replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<svg\b/, `<svg role="img" aria-label="${b.name}" style="--s:${b.scale}"`);
const qr = await QRCode.toString(SITE, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0B0B0BFF', light: '#EFE9DDFF' } });
const bare = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const mail = mailAddress();

const job = (title, org, when, sub, bullets = []) => `
  <article class="job">
    <header><h3>${title}<span class="org"> · ${org}</span></h3><time>${when}</time></header>
    ${sub ? `<p class="sub">${sub}</p>` : ''}
    ${bullets.length ? `<ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : ''}
  </article>`;
const project = (name, text) => `<li><b>${name}</b>&nbsp;: ${text}</li>`;

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
  :root { --ink: #0B0B0B; --paper: #EFE9DD; --soft: #4A4842; --mark: #D0CBC0; --top: 86mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { background: var(--paper); color: var(--ink); font: 400 10pt/1.4 'Bricolage Grotesque', sans-serif; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3, p, ul { margin: 0; padding: 0; }
  ul { list-style: none; }
  p, li { text-wrap: pretty; }
  em { font-style: normal; font-weight: 700; background: linear-gradient(var(--mark), var(--mark)) no-repeat 0 90% / 100% .42em; }

  .cv { width: 210mm; height: 297mm; padding: 14mm 14mm 13mm; display: grid; grid-template-columns: 56mm minmax(0, 1fr); column-gap: 11mm; overflow: hidden; }
  .main, .side { position: relative; grid-row: 1; min-width: 0; display: flex; flex-direction: column; }
  .main { grid-column: 2; }
  .side { grid-column: 1; }
  /* Le haut des deux colonnes a la même hauteur : la tuile encre s'aligne sur « Expérience ». */
  .top { height: var(--top); flex: none; }

  h2 { display: flex; align-items: center; gap: 1.8mm; font: 500 9pt/1 'JetBrains Mono', monospace; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 3.4mm; }
  h2::before { content: ''; width: 2.2mm; height: 2.2mm; background: currentColor; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); }
  section + section { margin-top: 8mm; }

  /* Le nom, très au-dessus du reste. */
  .lock { display: flex; align-items: center; gap: 2.4mm; margin-left: -1.6mm; }
  .lock svg { width: 33mm; height: 33mm; flex: none; }
  h1 { font-weight: 800; font-size: 45pt; line-height: .93; letter-spacing: -.033em; font-variation-settings: 'opsz' 96; }
  h1 span { display: block; }
  .role { margin-top: 3.6mm; font-weight: 700; font-size: 13pt; letter-spacing: -.01em; line-height: 1.2; }
  .contact { margin-top: 1.6mm; font: 400 9pt/1.6 'JetBrains Mono', monospace; }
  .hook { margin-top: 6.5mm; font-size: 12pt; line-height: 1.36; letter-spacing: -.005em; }

  .job + .job { margin-top: 4.2mm; }
  .job header { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
  h3 { font-size: 11pt; font-weight: 750; letter-spacing: -.012em; line-height: 1.25; }
  .org { font-weight: 500; }
  time { flex: none; font: 400 9pt/1 'JetBrains Mono', monospace; }
  .sub { color: var(--soft); }
  .job ul { margin-top: 1.4mm; }
  li { padding-left: 3.2mm; text-indent: -3.2mm; }
  li + li { margin-top: 1mm; }
  li::before { content: ''; display: inline-block; width: 1.4mm; height: 1.4mm; margin-right: 1.8mm; vertical-align: .08em; background: var(--ink); clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); }
  li b { font-weight: 750; }

  .brands { margin-top: auto; }
  .brands ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2mm 5mm; align-items: center; }
  .brands li { padding: 0; text-indent: 0; margin: 0; height: 7mm; display: flex; align-items: center; }
  .brands li::before { display: none; }
  .brands svg { display: block; height: calc(4mm * var(--s, 1)); width: auto; max-width: 100%; }
  .brands svg, .brands svg * { fill: var(--ink) !important; stroke: none !important; }

  /* La colonne de gauche : ma carte, la tuile encre, le reste sur le papier. */
  .card { background: var(--ink); border-radius: 4mm; padding: 1.8mm 1.8mm 0; transform: rotate(-1.6deg); margin: 0; }
  .card img { display: block; width: 100%; height: 66mm; object-fit: cover; object-position: 50% 28%; border-radius: 2.8mm; }
  .card p { color: var(--paper); font: 500 8.5pt/1 'JetBrains Mono', monospace; letter-spacing: .05em; text-transform: uppercase; padding: 2.4mm 1mm; display: flex; justify-content: space-between; }
  .hi { background: var(--ink); color: var(--paper); border-radius: 4mm; padding: 5.4mm 5mm 5mm; }
  .hi h2 { font: 800 16pt/1 'Bricolage Grotesque', sans-serif; letter-spacing: -.02em; text-transform: none; margin: 0 0 2mm; display: block; }
  .hi h2::before { display: none; }
  .hi p { font-size: 9.5pt; line-height: 1.32; }
  .qr { display: block; width: 33.6mm; margin: 5mm auto 0; background: var(--paper); color: var(--ink); border-radius: 3mm; padding: 4mm 4mm 2mm; text-align: center; }
  .qr svg { display: block; width: 25.6mm; height: 25.6mm; }
  .qr span { display: block; margin-top: 1.6mm; font: 500 8.5pt/1 'JetBrains Mono', monospace; }
  .keys { display: flex; gap: 1.4mm; margin-bottom: 2.6mm; }
  .keys i { flex: 1; aspect-ratio: 1; display: grid; place-items: center; border-radius: 1.8mm; background: var(--ink); color: var(--paper); font: 800 9pt/1 'Bricolage Grotesque', sans-serif; font-style: normal; box-shadow: 0 .6mm 0 #4A4842; }
  .side .hi + section { margin-top: 8mm; }
  .side .last { margin-top: auto; }
</style>
</head>
<body>
<main class="cv">
  <div class="main">
    <div class="top">
      <header>
        <div class="lock">${hyena}<h1><span>Johan</span><span>Trigeard</span></h1></div>
        <p class="role">Lead UI/UX &amp; Product Designer</p>
        <p class="contact">Bordeaux · <a href="mailto:${mail}">${mail}</a><br><a href="${CONTACT.linkedin}">${bare(CONTACT.linkedin)}</a> · <a href="${SITE}">${bare(SITE)}</a></p>
      </header>
      <p class="hook">Je conçois des produits web et mobile, du parcours au <em>prototype codé</em>. Chez Rhinov (Maisons du Monde), je pilote l'UX <em>entre produit et tech</em>.</p>
    </div>

    <section>
      <h2>Expérience</h2>
      ${job('Lead UI/UX', 'Rhinov (Maisons du Monde)', 'Depuis 2023', 'Graphic Designer (2023), Lead UI Designer (2024), Lead UI/UX (2026).', [
        "<b>rhinov.fr</b>&nbsp;: repensé de l'accueil au panier, en binôme avec le PO/PM.",
        "<b>iA Déco</b>&nbsp;: assistant déco par IA, de la landing au chat.",
        "<b>Système Rhinov</b>&nbsp;: logo et <em>design system Figma</em> multimarque.",
        "<b>Rhinov Studio</b>&nbsp;: landings et app agents, <em>prototypées en code</em>.",
        "Management d'une petite équipe.",
      ])}
      ${job('Designer indépendant', 'Auto-entreprise', 'Depuis 2019', 'Design UI et UX à mon compte.')}
      ${job('Motion Designer', 'Infograpik', '2020 – 2022', 'Animation 2D et chartes pour Twitch, Activision et Microsoft.')}
      ${job('Web Designer', 'Intento &amp; Fière Allure', '2018 – 2020', 'Wireframes, sites WordPress, chartes graphiques et print.')}
    </section>

    <section>
      <h2>Projets</h2>
      <ul>
        ${project('Maisons du Monde · Labo', 'trois parcours maquettés puis codés.')}
        ${project('Vinyl Run', "site d'un disquaire, conçu et développé.")}
        ${project('NookDex', 'collection Pokémon illustrée et codée.')}
        ${project('MyFrenchTool', "l'annuaire des SaaS français, créé de A à Z.")}
      </ul>
    </section>

    <section class="brands">
      <h2>Marques</h2>
      <ul>${BRANDS.map((b) => `<li>${logo(b)}</li>`).join('')}</ul>
    </section>
  </div>

  <aside class="side">
    <div class="top">
      <figure class="card">
        <img src="johan.jpg" alt="Johan Trigeard, souriant, sous un arbre">
        <p aria-hidden="true"><span>Hors tirage</span><span>★</span></p>
      </figure>
    </div>

    <div class="hi">
      <h2>On chasse ensemble&nbsp;?</h2>
      <p>Ouvert à mon prochain poste de Lead UI/UX ou de Product Designer.</p>
      <a class="qr" href="${SITE}" aria-label="Portfolio de Johan Trigeard : ${bare(SITE)}">${qr}<span>Le portfolio</span></a>
    </div>

    <section>
      <h2>Outils</h2>
      <div class="keys" aria-hidden="true"><i>Fi</i><i>CC</i><i>Ps</i><i>Ai</i><i>Ae</i></div>
      <p>Figma, Claude Code, Photoshop, Illustrator, After Effects, HTML/CSS.</p>
    </section>

    <section>
      <h2>Formation</h2>
      <p><b>Master Web Design</b><br>Bac+5, ECV Bordeaux<br>2013 – 2018</p>
    </section>

    <section class="last">
      <h2>Hors écran</h2>
      <p>Échecs, moto, Final Fantasy et un ptit café.</p>
    </section>
  </aside>
</main>
</body>
</html>
`;

const page = path.join(DIR, 'index.html');
fs.writeFileSync(page, html);

const browser = await launch();
const pg = await browser.newPage({ viewport: { width: 794, height: 1123 } });
await pg.goto(pathToFileURL(page).href, { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
const over = await pg.evaluate(() => {
  const mm = 3.78, end = document.querySelector('.cv').getBoundingClientRect().bottom - 13 * mm;
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  const main = document.querySelector('.main'), side = document.querySelector('.side');
  const gaps = [...main.children].slice(0, -1).map((c, i) => Math.round(main.children[i + 1].getBoundingClientRect().top - c.getBoundingClientRect().bottom));
  const gapsS = [...side.children].slice(0, -1).map((c, i) => Math.round(side.children[i + 1].getBoundingClientRect().top - c.getBoundingClientRect().bottom));
  const hookEnd = Math.round(r('.main .top').bottom - r('.hook').bottom);
  return { droite: gaps, gauche: gapsS, sousAccroche: hookEnd, alignement: Math.round(r('.hi').top - r('.main section').top), bas: [Math.round(end - r('.brands').bottom), Math.round(end - r('.last').bottom)] };
});
console.log(JSON.stringify(over));
await pg.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true, tagged: true });
await browser.close();
console.log('cv', path.relative(ROOT, OUT), `${(fs.statSync(OUT).size / 1024).toFixed(0)} Ko`);
