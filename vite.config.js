import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Multi-pages : la home + une page par projet (générées par scripts/, voir `npm run pages`).
const projets = fs.existsSync('projets') ? fs.readdirSync('projets').map((id) => path.resolve('projets', id, 'index.html')) : [];

// Candidatures : {slug}/index.html (voir scripts/make-applications.mjs).
const apps = fs.existsSync('src/data/applications') ? fs.readdirSync('src/data/applications').filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)) : [];
const candidatures = apps.filter((s) => fs.existsSync(path.join(s, 'index.html'))).map((s) => path.resolve(s, 'index.html'));

export default defineConfig({
  base: './',
  // assets/ est servi tel quel à la racine du site : assets/vinyl-run/x.webp -> ./vinyl-run/x.webp
  publicDir: 'assets',
  build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: [path.resolve('index.html'), path.resolve('a-propos/index.html'), ...projets, ...candidatures] } },
});
