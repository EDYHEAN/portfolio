import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Multi-pages : la home + une page par projet (générées par scripts/, voir `npm run pages`).
const projets = fs.existsSync('projets') ? fs.readdirSync('projets').map((id) => path.resolve('projets', id, 'index.html')) : [];

export default defineConfig({
  base: './',
  // Les assets de la V1 (../assets) sont servis tels quels à la racine : assets/vinyl-run/x.webp -> ./vinyl-run/x.webp
  publicDir: '../assets',
  build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: [path.resolve('index.html'), ...projets] } },
});
