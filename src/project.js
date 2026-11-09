import './style.css';
import './project.css';
import {
  gsap, ScrollTrigger, $, $$, REDUCE, DESKTOP, MOBILE, t, tx, asset, pageUrl, onLang, ROOT,
  boot, renderOutro, outroMotion, curtainIn, runLoader, refreshOnImages,
} from './core.js';
import { projectById, nextProject } from './data/projects.js';
import { BLOCKS } from './blocks.js';
import { heroSnap } from './heroSnap.js';

const p = projectById(document.body.dataset.project);
const next = nextProject(p.id);
const c = p.colors;
const surface = { bg: c.surface || c.bg, fg: c.surfaceFg || c.fg, line: c.surfaceLine || c.line };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const surfaceTheme = lum(surface.bg) > 0.6 ? 'light' : 'dark';

// Couleurs du projet en variables CSS (intro = couleurs de marque, blocs = surface).
Object.entries({ '--p-bg': c.bg, '--p-fg': c.fg, '--p-accent': c.accent, '--p-line': c.line, '--p-tile': c.tile, '--s-bg': surface.bg, '--s-fg': surface.fg, '--s-line': surface.line })
  .forEach(([k, v]) => document.body.style.setProperty(k, v));
// Polices du projet (pour les spécimens typo).
if (p.fonts?.length) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?${p.fonts.map((f) => `family=${f}`).join('&')}&display=swap`;
  document.head.append(l);
}

function render() {
  document.title = `${p.name} · Johan Trigeard`;
  let n = 0;
  $('#app').innerHTML = `
    <section class="intro" data-theme="${p.theme}">
      <a class="intro-back mono" href="${ROOT}#work" data-page><span aria-hidden="true">←</span> ${t('p.back')}</a>
      <div class="intro-logo" style="--logo-k:${p.logo.introScale || 1}"><img src="${asset(p.logo.src)}" alt="${p.name}" class="${p.logo.invert ? 'inv' : ''}"></div>
      <h1 class="intro-name">${p.name}</h1>
      <p class="intro-tag">${tx(p.tagline)}</p>
      <dl class="intro-meta mono">
        <div><dt>${t('p.type')}</dt><dd>${tx(p.type)}</dd></div>
        <div><dt>${t('p.role')}</dt><dd>${tx(p.role)}</dd></div>
        <div><dt>${t('p.year')}</dt><dd>${p.year}</dd></div>
      </dl>
      <p class="intro-ctx">${tx(p.context)}</p>
      ${p.url ? `<a class="btn btn-accent" href="${p.url}" target="_blank" rel="noopener" data-magnetic data-cursor data-cursor-key="cursor.go"><span>${t('p.visit')}</span><span aria-hidden="true">↗</span></a>` : ''}
    </section>
    ${p.blocks.map((b) => `<section class="blk blk-${b.type}" data-theme="${surfaceTheme}">${BLOCKS[b.type].render(b, p, ++n)}</section>`).join('')}
    <section class="blk blk-next" data-theme="${surfaceTheme}">
      <a class="nxt" href="${pageUrl(next.id)}" data-page data-cursor data-cursor-key="cursor.view" style="--bg:${next.colors.bg};--fg:${next.colors.fg}">
        <span class="mono nxt-k">${t('p.next')}</span>
        <span class="nxt-logo"><img src="${asset(next.logo.src)}" alt="" class="${next.logo.invert ? 'inv' : ''}" loading="lazy"></span>
        <span class="nxt-name">${next.name}</span>
        <span class="nxt-shot"><img src="${asset(next.shot)}" alt="" loading="lazy"></span>
      </a>
    </section>`;
  renderOutro();
  // Les interactions d'un bloc (onglets…) : une fois par rendu, et même sans animation.
  $$('.blk').forEach((el, i) => { const b = p.blocks[i]; if (b) BLOCKS[b.type].bind?.(el, b, p); });
}

let mm = null;
function motion() {
  mm = gsap.matchMedia();
  mm.add({ desktop: DESKTOP, mobile: MOBILE, reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    if (ctx.conditions.reduce) return;
    // Blocs dans l'ordre de la page (les pins décalent les suivants).
    $$('.blk').forEach((el, i) => {
      const b = p.blocks[i];
      if (!b) return;
      gsap.from($('.blk-head', el), { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      BLOCKS[b.type].motion(el, b, p, ctx.conditions);
    });
    gsap.from('.nxt', { y: 80, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.blk-next', start: 'top 85%' } });
    outroMotion();
  });
}

function intro(delay) {
  if (REDUCE) return;
  gsap.timeline({ delay })
    .from('.intro-logo img', { scale: 0.82, y: 30, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0)
    .from(['.intro-name', '.intro-tag', '.intro-meta', '.intro-ctx', '.intro .btn', '.intro-back'], { y: 24, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.2);
}

boot();
render();
motion();
onLang(() => { mm.revert(); render(); motion(); });
heroSnap();
const came = curtainIn();
runLoader(came).then((played) => intro(came || played ? 0.35 : 0.05));
refreshOnImages();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
addEventListener('load', () => ScrollTrigger.refresh());
