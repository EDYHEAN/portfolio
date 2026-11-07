// Prépare un prototype pour le bloc « live » des pages projet : un petit script en tête de <head>, qui n'agit que dans
// une iframe (ouvert dans un onglet, le prototype reste intact) :
// - densité juste nécessaire : le cadre est affiché réduit (~0,6), la 3D et les canvas sont calculés à la taille vraiment
//   affichée (densité de l'écran × réduction, au moins 1) au lieu du plein Retina : ~2,5x moins de pixels, aussi net ;
// - window.__pause(true/false) : met en attente les requestAnimationFrame (three.js, GSAP, Lenis, particules) et les vidéos.
//   La page projet s'en sert au lieu de décharger le cadre : il reprend où il en était, sans rechargement.
// Idempotent (marqueur). `node scripts/patch-live.mjs chemin/index.html…` ; appelé par make-mdm-labo.mjs.
import fs from 'node:fs';

const MARK = '<!-- live:pause -->';
export const SNIPPET = `${MARK}<script>(()=>{if(window===top)return;
try{const d=devicePixelRatio;Object.defineProperty(window,'devicePixelRatio',{get:()=>{try{const k=frameElement.getBoundingClientRect().width/innerWidth;return Math.max(1,Math.min(d,k*d))}catch(e){return 1}}})}catch(e){}
const r=requestAnimationFrame.bind(window),c=cancelAnimationFrame.bind(window),q=new Map();let p=false,n=0;
window.requestAnimationFrame=f=>{if(!p)return r(f);const id=-(++n);q.set(id,f);return id};
window.cancelAnimationFrame=id=>id<0?q.delete(id):c(id);
window.__pause=v=>{if(p===v)return;p=v;if(!v){const fs=[...q.values()];q.clear();fs.forEach(f=>r(f))}
document.querySelectorAll('video').forEach(m=>{if(v){m.__was=!m.paused;m.pause()}else if(m.__was)m.play().catch(()=>{})})};})();</script>`;

export function patchHtml(html) {
  const at = html.indexOf(MARK);
  if (at >= 0) { const end = html.indexOf('</script>', at) + '</script>'.length; return html.slice(0, at) + SNIPPET + html.slice(end); } // remplacé
  const m = html.match(/<head[^>]*>/i);
  if (!m) throw new Error('pas de <head>');
  return html.replace(m[0], m[0] + SNIPPET);
}

if (process.argv[1] && process.argv[1].endsWith('patch-live.mjs')) {
  for (const f of process.argv.slice(2)) {
    fs.writeFileSync(f, patchHtml(fs.readFileSync(f, 'utf8')));
    console.log('live :', f);
  }
}
