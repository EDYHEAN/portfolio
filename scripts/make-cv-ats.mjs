// Le CV « ATS » : la version à faire lire aux logiciels de tri et aux IA de recrutement, en français
// (assets/cv-johan-trigeard-ats.pdf) et en anglais (-en.pdf). `npm run cv:ats`.
// Le pendant sobre du CV « carte tirée » (make-cv.mjs) : mêmes faits, rien d'inventé.
// Ce qui le rend lisible par une machine : une seule colonne dans l'ordre de lecture, titres de section standard
// (Profil, Compétences, Expérience professionnelle…), une ligne par poste (intitulé, entreprise, dates), le contact dans
// le corps (pas d'en-tête ni de pied de page), aucune image, aucun tableau, police système (Arial), pas de ligatures,
// liens écrits en clair, PDF balisé. Les mots-clés du métier sont écrits tels qu'une offre les écrit. Une page A4.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './make-booster.mjs';
import { CONTACT, mailAddress } from '../src/data/home.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://johantrigeard.com/';
const OUT = path.join(ROOT, 'assets/cv-johan-trigeard-ats.pdf'); // et -en.pdf pour l'anglais
const DIR = path.join(ROOT, 'sources/cv-ats');
fs.mkdirSync(DIR, { recursive: true });

const bare = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const mail = mailAddress();
// Le téléphone, jamais en clair dans le code (morceaux inversés, comme sur la page de la signature).
const P = ['60', '23', '79', '23', '22'].map((s) => [...s].reverse().join(''));
const PHONE = { fr: P.join(' '), en: `+33 ${P.join(' ').slice(1)}`, tel: `+33${P.join('').slice(1)}` };

const job = (title, org, when, bullets = []) => `
  <article>
    <h3>${title} | ${org} | ${when}</h3>
    ${bullets.length ? `<ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : ''}
  </article>`;

const build = (lang) => {
  const L = (fr, en) => (lang === 'en' ? en : fr);
  const NOW = L("aujourd'hui", 'present');
  const RH = L('Rhinov (groupe Maisons du Monde)', 'Rhinov (Maisons du Monde group)');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>Johan Trigeard - ${L('CV', 'Resume')} - Lead UI/UX Designer, Product Designer</title>
<meta name="author" content="Johan Trigeard">
<meta name="description" content="${L('CV de Johan Trigeard, Lead UI/UX Designer et Product Designer à Bordeaux.', 'Resume of Johan Trigeard, Lead UI/UX Designer and Product Designer in Bordeaux, France.')}">
<meta name="keywords" content="Lead UI/UX, UI Designer, UX Designer, Product Designer, Design System, Figma, ${L('Prototypage', 'Prototyping')}, Bordeaux">
<style>
  @page { size: A4; margin: 10mm 15mm 8mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { color: #000; font: 9.2pt/1.27 Arial, Helvetica, sans-serif; font-variant-ligatures: none; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3, p, ul { margin: 0; padding: 0; }
  h1 { font-size: 19pt; line-height: 1.15; }
  .role { font-size: 12pt; font-weight: 700; margin-top: 1mm; }
  .contact { margin-top: 1.5mm; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: .04em; border-bottom: .3mm solid #000; padding-bottom: 1mm; margin: 3.4mm 0 1.5mm; }
  h3 { font-size: 9.4pt; margin-top: 1.7mm; }
  h2 + article h3 { margin-top: 0; }
  ul { padding-left: 5mm; margin-top: .6mm; }
  li + li { margin-top: .3mm; }
  article, li { break-inside: avoid; }
</style>
</head>
<body>
  <h1>Johan Trigeard</h1>
  <p class="role">Lead UI/UX Designer - Product Designer</p>
  <p class="contact">Bordeaux, France | <a href="tel:${PHONE.tel}">${PHONE[lang]}</a> | <a href="mailto:${mail}">${mail}</a><br>
    LinkedIn : <a href="${CONTACT.linkedin}">${bare(CONTACT.linkedin)}</a> | Portfolio : <a href="${SITE}">${bare(SITE)}</a></p>

  <h2>${L('Profil', 'Summary')}</h2>
  <p>${L(
    "Lead UI/UX Designer chez Rhinov (groupe Maisons du Monde). Je conçois des produits web et mobile, du parcours utilisateur au prototype codé, et je pilote l'UX entre les équipes produit et tech. Parcours : web design, motion design, design graphique puis UI/UX. Je recherche un poste de Lead UI/UX ou de Product Designer.",
    'Lead UI/UX Designer at Rhinov (Maisons du Monde group). I design web and mobile products, from user flow to coded prototype, and lead UX between the product and tech teams. Background: web design, motion design, graphic design, then UI/UX. Looking for a Lead UI/UX or Product Designer role.')}</p>

  <h2>${L('Compétences et outils', 'Skills and tools')}</h2>
  <ul>
    <li>${L(
      "Design : UI design, UX design, product design, design d'interface web et mobile, responsive design, design system, bibliothèque de composants.",
      'Design: UI design, UX design, product design, web and mobile interface design, responsive design, design system, component library.')}</li>
    <li>${L(
      "Conception : parcours utilisateur, wireframes, maquettes, prototypage (Figma et prototypes codés), handoff aux développeurs (maquettes Dev Ready), optimisation de la conversion, landing pages, e-commerce, produits d'IA conversationnelle.",
      'Process: user flows, wireframes, mockups, prototyping (Figma and coded prototypes), developer handoff (Dev Ready designs), conversion rate optimization, landing pages, e-commerce, conversational AI products.')}</li>
    <li>${L(
      'Marque : identité visuelle, logo, charte graphique, co-branding, motion design, animation 2D.',
      'Brand: visual identity, logo design, brand guidelines, co-branding, motion design, 2D animation.')}</li>
    <li>${L(
      "Collaboration : management d'une petite équipe de design, binôme avec le PO / PM, travail avec les équipes produit et tech.",
      'Collaboration: managing a small design team, working in pair with the PO / PM, with the product and tech teams.')}</li>
    <li>${L('Outils :', 'Tools:')} Figma, Claude Code, Adobe Photoshop, Adobe Illustrator, Adobe After Effects, Adobe XD, HTML, CSS.</li>
    <li>${L(
      "Qualités : créativité, prise d'initiative, adaptation, gestion des délais et du stress.",
      'Soft skills: creativity, initiative, adaptability, handling deadlines and pressure.')}</li>
  </ul>

  <h2>${L('Expérience professionnelle', 'Professional experience')}</h2>
  ${job('Lead UI/UX Designer', RH, `2026 - ${NOW}`, [
    L("Pilotage de l'UX des produits Rhinov, entre produit et tech.", "Leading the UX of Rhinov's products, between product and tech."),
    L("rhinov.fr : refonte du site de l'accueil au panier, en binôme avec le PO / PM ; maquettes Dev Ready et tests de pistes pour l'optimisation de la conversion (bureau et mobile).",
      'rhinov.fr: website redesign from home page to cart, in pair with the PO / PM; Dev Ready designs and design variants explored for conversion rate optimization (desktop and mobile).'),
    L('iA Déco : assistant de décoration par IA, de la landing page au parcours de chat web et mobile.',
      'iA Déco: AI interior design assistant, from the landing page to the web and mobile chat flow.'),
    L('Rhinov Studio : landing pages retail et immobilier et application pour les agents, prototypées en code.',
      'Rhinov Studio: retail and real estate landing pages and an app for agents, prototyped in code.'),
    L('Système Rhinov : logo et design system pour trois marques (logos, co-branding, couleurs, typographie, composants).',
      'Système Rhinov: logo and design system for three brands (logos, co-branding, colors, typography, components).'),
    L("Management d'une petite équipe de design.", 'Managing a small design team.'),
  ])}
  ${job('Lead UI Designer', RH, '2024 - 2026', [
    L('Interfaces web et mobile, design system.', 'Web and mobile interfaces, design system.'),
  ])}
  ${job('Graphic Designer', RH, '2023 - 2024', [
    L('Assets marketing et interfaces produit.', 'Marketing assets and product interfaces.'),
  ])}
  ${job('Motion Designer', 'Infograpik', '2020 - 2022', [
    L('Animation 2D, logotypes et chartes graphiques pour Twitch, Activision et Microsoft.',
      '2D animation, logos and brand guidelines for Twitch, Activision and Microsoft.'),
  ])}
  ${job(L('Designer UI/UX indépendant', 'Freelance UI/UX Designer'), L('Auto-entreprise', 'Self-employed'), `2019 - ${NOW}`, [
    L('Design UI et UX à mon compte.', 'UI and UX design for my own clients.'),
  ])}
  ${job('Web Designer', L('Intento et Fière Allure', 'Intento and Fière Allure'), '2018 - 2020', [
    L('Wireframes, sites WordPress, branding, chartes graphiques et print pour deux start-ups bordelaises.',
      'Wireframes, WordPress websites, branding, brand guidelines and print for two Bordeaux start-ups.'),
  ])}

  <h2>${L('Projets', 'Projects')}</h2>
  <ul>
    <li>${L(
      'Maisons du Monde Labo : trois parcours e-commerce (collection de meubles en 3D, visite de la maison pièce par pièce, catalogue jour / nuit), conçus puis prototypés en code.',
      'Maisons du Monde Labo: three e-commerce journeys (3D furniture collection, room-by-room house tour, day / night catalog), designed then prototyped in code.')}</li>
    <li>${L("Vinyl Run : site d'un disquaire, design et développement.", "Vinyl Run: a record shop's website, design and development.")}</li>
    <li>${L('MyFrenchTool : annuaire des SaaS français, design produit et marque.', 'MyFrenchTool: directory of French SaaS, product and brand design.')}</li>
    <li>${L('NookDex : application de collection Pokémon, design produit et illustration.', 'NookDex: Pokémon collection app, product design and illustration.')}</li>
  </ul>

  <h2>${L('Formation', 'Education')}</h2>
  ${job(L('Master Web Design (Bac+5)', "Master's degree in Web Design"), 'ECV Bordeaux', '2013 - 2018')}

  <h2>${L('Références clients et marques', 'Clients and brands')}</h2>
  <p>Maisons du Monde, Rhinov, Activision, Microsoft, Twitch, Samsung, Webedia, Lapeyre, Ledvance, ixina.</p>

  <h2>${L("Centres d'intérêt", 'Interests')}</h2>
  <p>${L('Échecs, moto, jeux vidéo, animation 2D.', 'Chess, motorbikes, video games, 2D animation.')}</p>
</body>
</html>
`;
};

const browser = await launch();
const pg = await browser.newPage();
for (const lang of ['fr', 'en']) {
  const page = path.join(DIR, lang === 'en' ? 'index-en.html' : 'index.html');
  const out = lang === 'en' ? OUT.replace(/\.pdf$/, '-en.pdf') : OUT;
  fs.writeFileSync(page, build(lang));
  await pg.goto(pathToFileURL(page).href, { waitUntil: 'load' });
  await pg.pdf({ path: out, format: 'A4', preferCSSPageSize: true, printBackground: false, tagged: true });
  console.log('cv ats', path.relative(ROOT, out), `${(fs.statSync(out).size / 1024).toFixed(0)} Ko`);
}
await browser.close();
