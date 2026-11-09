// Génère les pages de candidature : {slug}/index.html (la home, les projets imaginés n'ont pas de page),
// une config par entreprise dans src/data/applications/. Toujours en noindex. Lancé par `npm run pages`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { shell } from './shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'src/data/applications');
const RESERVED = new Set(['assets', 'projets', 'src', 'scripts', 'sources', 'node_modules', 'dist', 'brand', 'apply', '3d']);

export async function loadApplications() {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  return Promise.all(files.map(async (f) => (await import(pathToFileURL(path.join(dir, f)).href)).default));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const app of await loadApplications()) {
    if (RESERVED.has(app.slug)) throw new Error(`slug réservé : ${app.slug}`);
    fs.mkdirSync(path.join(root, app.slug), { recursive: true });
    fs.writeFileSync(path.join(root, app.slug, 'index.html'), shell({
      title: app.title, desc: app.desc, root: '../', noindex: true,
      attrs: `data-page="home" data-application="${app.slug}"`,
      script: '/src/home.js', loader: false, theme: app.theme.paper,
    }));
    console.log('page', `${app.slug}/index.html`);
  }
}
