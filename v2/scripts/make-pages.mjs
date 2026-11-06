// Génère une page HTML par projet : projets/{id}/index.html (gabarit commun, contenu rendu en JS).
// Lancé automatiquement avant `dev` et `build` (voir package.json).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS } from '../src/data/projects.js';
import { shell } from './shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const p of PROJECTS) {
  const dir = path.join(root, 'projets', p.id);
  fs.mkdirSync(dir, { recursive: true });
  const html = shell({
    title: `${p.name} · Johan Trigeard`,
    desc: `${p.name} : ${p.tagline.fr}`,
    root: '../../',
    attrs: `data-page="project" data-project="${p.id}"`,
    theme: p.colors.bg,
    script: '/src/project.js',
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('page', `projets/${p.id}/index.html`);
}
