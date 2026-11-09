// Génère index.html (home) depuis le squelette commun.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shell } from './shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.writeFileSync(path.join(root, 'index.html'), shell({
  title: 'Johan Trigeard · Lead UI/UX & Product Designer',
  desc: 'Portfolio de Johan Trigeard, Lead UI/UX et Product Designer à Bordeaux.',
  root: './',
  attrs: 'data-page="home"',
  script: '/src/home.js',
  loader: false, // le booster fait office de loader

}));
console.log('page index.html');

fs.mkdirSync(path.join(root, 'a-propos'), { recursive: true });
fs.writeFileSync(path.join(root, 'a-propos', 'index.html'), shell({
  title: "C'est qui celui-là ? · Johan Trigeard",
  desc: 'Johan Trigeard, Lead UI/UX et Product Designer à Bordeaux : parcours, outils, marques.',
  root: '../',
  attrs: 'data-page="about"',
  script: '/src/about.js',
  loader: false,
}));
console.log('page a-propos/index.html');
