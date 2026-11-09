// La version 480 px de chaque visuel de carte (xxx.webp -> xxx-480.webp), servie aux petites cases du tirage.
// Lancé à la fin de make-cards.mjs ; à la main : node scripts/make-card-sizes.mjs. Demande ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();

const cards = fs.readdirSync(ASSETS)
  .map((d) => path.join(ASSETS, d, 'card.webp'))
  .filter((f) => fs.existsSync(f));

const apply = path.join(ASSETS, 'apply');
if (isDir(apply)) for (const slug of fs.readdirSync(apply)) {
  const dir = path.join(apply, slug, 'cards');
  if (isDir(dir)) cards.push(...fs.readdirSync(dir).filter((f) => f.endsWith('.webp') && !f.endsWith('-480.webp')).map((f) => path.join(dir, f)));
}

for (const src of cards) {
  const out = src.replace(/\.webp$/, '-480.webp');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', 'scale=480:-2', '-c:v', 'libwebp', '-quality', '78', out]);
  console.log(path.relative(ASSETS, out), `${(fs.statSync(src).size / 1024).toFixed(0)} -> ${(fs.statSync(out).size / 1024).toFixed(0)} Ko`);
}
