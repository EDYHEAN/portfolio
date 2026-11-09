// Socle commun à toutes les pages : langue, header, scroll fluide, curseur, regard de la hyène,
// rideau de transition entre pages, outro (morsure + contact).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { HYENA_BODY, HYENA_PUPILS } from './hyena.js';
import { wordmarkSVG } from './wordmark.js';
import { UI } from './i18n.js';
import { bindSounds, isSoundOn, setSound } from './sound.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger, SplitText };

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE = matchMedia('(pointer: fine)').matches;
export const DESKTOP = '(min-width: 861px)';
export const MOBILE = '(max-width: 860px)';
export const PLAIN = matchMedia('(hover: none), (max-width: 860px)').matches; // au doigt : la hyène sans son contour animé ni ses rendus

/* Chemins : les pages projet vivent dans /projets/{id}/, d'où une racine relative. */
export const ROOT = document.body.dataset.root || './';
export const asset = (p) => ROOT + p;
export const pageUrl = (id) => `${ROOT}projets/${id}/`;

/* ------------------------------------------------------------------ */
/* Langue                                                              */
/* ------------------------------------------------------------------ */
const LANGS = ['fr', 'en'];
function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try { const s = localStorage.getItem('edy-lang'); if (LANGS.includes(s)) return s; } catch { /* stockage indispo */ }
  return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
export let lang = initialLang();
export const t = (k) => UI[lang][k] ?? k;
export const tx = (v) => (v && typeof v === 'object' && 'fr' in v ? v[lang] : v);
/** [mot] -> surlignage encre. */
export const hl = (s) => s.replace(/\|/g, '<span class="br"></span>').replace(/\[([^\]]+)\]/g, '<mark class="hl"><span class="hl-bg"></span><span class="hl-tx">$1</span></mark>');

const langListeners = [];
export const onLang = (fn) => langListeners.push(fn);
export function setLang(next) {
  if (next === lang || !LANGS.includes(next)) return;
  lang = next;
  try { localStorage.setItem('edy-lang', lang); } catch { /* rien */ }
  const y = scrollY;
  langListeners.forEach((fn) => fn());
  applyStatic();
  ScrollTrigger.refresh();
  lenis?.resize();
  scrollTo(0, y);
  lenis?.scrollTo(y, { immediate: true, force: true });
}
export function applyStatic() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

/* ------------------------------------------------------------------ */
/* Hyène                                                               */
/* ------------------------------------------------------------------ */
/**
 * La hyène en SVG. boil = contour qui frémit ; options : fill (couleur ou url(#motif) du corps),
 * pupil (couleur des pupilles), filter (id d'un filtre SVG à la place du boil).
 */
export const hyenaSVG = (boil, { fill = 'currentColor', pupil = 'currentColor', filter } = {}) => {
  const f = filter || (boil ? 'boil' : null);
  return `
  <svg class="hy" viewBox="0 0 1200 1200" aria-hidden="true" focusable="false">
    <g${f && !REDUCE && !(PLAIN && f === 'boil') ? ` filter="url(#${f})"` : ''}>
      <use href="#hy-body" fill="${fill}"/>
      ${HYENA_PUPILS.map((p) => `<path class="hy-pupil" fill="${pupil}" d="${p.d}"/>`).join('')}
    </g>
  </svg>`;
};
export function fillHyenas(root = document) {
  $$('[data-hyena]', root).forEach((el) => { if (!el.firstElementChild) el.innerHTML = hyenaSVG(el.dataset.hyena === 'boil'); });
}

function initEyes() {
  const EYE = { x: 797 / 1200, y: 541 / 1200 };
  const cache = new WeakMap();
  const pupils = (svg) => {
    if (!cache.has(svg)) {
      cache.set(svg, $$('.hy-pupil', svg).map((el, i) => ({
        x: gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' }),
        range: HYENA_PUPILS[i].range,
      })));
    }
    return cache.get(svg);
  };
  const look = (px, py) => $$('.hy').forEach((svg) => {
    const r = svg.getBoundingClientRect();
    if (r.width < 60 || r.bottom < 0 || r.top > innerHeight || svg.closest('.is-dizzy')) return; // tournis : logo.js tient les yeux
    const dx = px - (r.left + r.width * EYE.x);
    const dy = py - (r.top + r.height * EYE.y);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 260);
    pupils(svg).forEach((p) => { p.x((dx / d) * k * p.range[0]); p.y((dy / d) * k * p.range[1]); });
  });
  // Au repos, elle jette des coups d'œil curieux un peu partout.
  let idle;
  const wander = () => { look(innerWidth * Math.random(), innerHeight * Math.random()); idle = setTimeout(wander, 1300 + Math.random() * 2400); };
  if (FINE) {
    addEventListener('pointermove', (e) => { look(e.clientX, e.clientY); clearTimeout(idle); idle = setTimeout(wander, 3500); }, { passive: true });
    idle = setTimeout(wander, 3500);
    return;
  }
  // Au doigt : elle regarde l'endroit touché, et suit le sens du scroll (vers le bas quand la page descend).
  const rest = (ms = 1800) => { clearTimeout(idle); idle = setTimeout(wander, ms); };
  addEventListener('pointerdown', (e) => { look(e.clientX, e.clientY); rest(); }, { passive: true });
  let lastY = scrollY, lastLook = 0;
  addEventListener('scroll', () => {
    const now = performance.now(), dy = scrollY - lastY;
    lastY = scrollY;
    if (!dy || now - lastLook < 120) return;
    lastLook = now;
    look(innerWidth / 2, dy > 0 ? innerHeight * 2 : -innerHeight);
    rest();
  }, { passive: true });
  wander();
}

function initBoil() {
  if (REDUCE) return;
  const noise = $('#boilNoise');
  let seed = 1, last = 0;
  const every = FINE ? 0.11 : 0.2; // un filtre SVG à recalculer : moins souvent au téléphone
  gsap.ticker.add((time) => {
    if (time - last < every || document.hidden) return;
    last = time;
    seed = (seed % 6) + 1;
    noise.setAttribute('seed', String(seed));
  });
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */
export function renderHeader() {
  const home = document.body.dataset.page === 'home';
  const about = document.body.dataset.page === 'about'
    ? `<span class="hdr-about is-here" aria-current="page" data-i18n="nav.about">${t('nav.about')}</span>`
    : `<a class="hdr-about" href="${ROOT}a-propos/" data-page data-sound data-i18n="nav.about">${t('nav.about')}</a>`;
  const link = (hash, key) => `<a href="${home ? '' : ROOT}${hash}" ${home ? 'data-scroll' : 'data-page'} data-sound data-i18n="${key}">${t(key)}</a>`;
  $('#hdr').innerHTML = `
    <a href="${home ? '#top' : ROOT}" class="hdr-logo" ${home ? 'data-scroll' : 'data-page'} data-i18n-aria="a11y.home" aria-label="${t('a11y.home')}">
      <span class="hdr-mark" data-hyena></span>${wordmarkSVG('hdr-word')}
    </a>
    <nav class="hdr-nav">${link('#work', 'nav.work')}${home ? '' : about}<a href="#contact" data-scroll data-sound data-i18n="nav.contact">${t('nav.contact')}</a></nav>
    <div class="hdr-end">
      ${home && !document.body.dataset.application ? about : ''}
      <button type="button" class="hdr-sound mono" data-sound-toggle data-sound aria-pressed="${isSoundOn()}"><i aria-hidden="true"></i><span data-i18n="sound.label">${t('sound.label')}</span></button>
      <div class="hdr-lang" role="group" aria-label="Langue / Language">
        <button type="button" data-lang="fr" data-sound>FR</button><span aria-hidden="true">/</span><button type="button" data-lang="en" data-sound>EN</button>
      </div>
    </div>`;
  $('[data-sound-toggle]').addEventListener('click', (e) => { const on = !isSoundOn(); setSound(on); e.currentTarget.setAttribute('aria-pressed', String(on)); });
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
}

function initHeaderBehaviour() {
  const hdr = $('#hdr');
  const mobile = matchMedia(MOBILE);
  let ticking = false, lastY = scrollY;
  const update = () => {
    ticking = false;
    const sec = document.elementsFromPoint(innerWidth / 2, 36).find((el) => el.matches?.('[data-theme]:not(.hdr)'));
    if (sec && !hdr.dataset.lock && hdr.dataset.theme !== sec.dataset.theme) hdr.dataset.theme = sec.dataset.theme;
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 40);
    if (Math.abs(y - lastY) > 6) { hdr.classList.toggle('is-hidden', mobile.matches && y > 240 && y > lastY); lastY = y; }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  // Après le premier rendu de la page (le contenu est injecté juste après boot()).
  requestAnimationFrame(update);
  addEventListener('load', update);
}

/* ------------------------------------------------------------------ */
/* Scroll fluide + liens                                               */
/* ------------------------------------------------------------------ */
export let lenis = null;
// Une section épinglée ne se révèle qu'à la fin de son épinglage (le contact, derrière le crâne) : c'est là qu'on atterrit.
// Les images chargées pendant la descente allongent la page : à l'arrivée, on rattrape la nouvelle fin (sauf si on a scrollé entre-temps).
function landOnPinEnd(pin, tries = 4) {
  const y = pin.end;
  lenis.scrollTo(y, {
    duration: tries === 4 ? 1.5 : 0.7,
    onComplete: () => gsap.delayedCall(0.3, () => {
      if (tries && Math.abs(scrollY - y) < 3 && Math.abs(pin.end - y) > 2) landOnPinEnd(pin, tries - 1);
    }),
  });
}
function initScroll() {
  if (!REDUCE) {
    // Quand la page rame (3D, prototypes live), on ne voit rien bouger, on scrolle encore, et chaque coup de molette
    // s'ajoutait à la cible : au retour de la fluidité, l'inertie emportait jusqu'au footer (Johan, 07/11). La molette est
    // freinée dès que la cible a plus d'une demi-hauteur d'écran d'avance, et coupée à une hauteur d'écran.
    // Inertie un peu plus courte aussi (lerp 0.1 -> 0.13).
    lenis = new Lenis({
      lerp: 0.13,
      virtualScroll: (d) => {
        if (!lenis || !d.deltaY) return true;
        const ahead = (lenis.targetScroll - lenis.animatedScroll) * Math.sign(d.deltaY); // avance dans le sens du geste
        const half = innerHeight / 2;
        if (ahead > half) d.deltaY *= Math.max(0, 1 - (ahead - half) / half) || 1e-3; // jamais 0 : Lenis le prendrait pour un clic
        return true;
      },
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    if (a.hasAttribute('data-scroll')) {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const pin = ScrollTrigger.getAll().find((s) => s.pin === target);
      if (lenis && pin) landOnPinEnd(pin);
      else if (lenis) lenis.scrollTo(target, { duration: 1.5 });
      else target.scrollIntoView();
    } else if (a.hasAttribute('data-page')) {
      e.preventDefault();
      navigate(a.href);
    }
  });
}
/** Après chargement : se placer sur l'ancre demandée (#work…) sans animation. */
export function jumpToHash() {
  const target = location.hash && $(location.hash);
  if (!target) return;
  const y = target.getBoundingClientRect().top + scrollY;
  scrollTo(0, y);
  lenis?.scrollTo(y, { immediate: true, force: true });
}

/* ------------------------------------------------------------------ */
/* Rideau entre les pages                                              */
/* ------------------------------------------------------------------ */
export function navigate(href) {
  const c = $('.curtain');
  if (REDUCE || !c) { location.href = href; return; }
  try { sessionStorage.setItem('edy-curtain', '1'); } catch { /* rien */ }
  lenis?.stop();
  gsap.fromTo(c, { yPercent: 100, visibility: 'visible' }, { yPercent: 0, duration: 0.6, ease: 'power3.inOut', onComplete: () => { location.href = href; } });
}
/** true si on arrive par le rideau (il est alors levé). */
export function curtainIn() {
  const c = $('.curtain');
  let came = false;
  try { came = sessionStorage.getItem('edy-curtain') === '1'; sessionStorage.removeItem('edy-curtain'); } catch { /* rien */ }
  const done = () => { document.documentElement.classList.remove('came'); if (c) gsap.set(c, { visibility: 'hidden' }); };
  if (!came || !c || REDUCE) { done(); return false; }
  gsap.set(c, { yPercent: 0, visibility: 'visible' });
  gsap.to(c, { yPercent: -100, duration: 0.8, ease: 'power3.inOut', delay: 0.1, onComplete: done });
  return true;
}
/**
 * Loader (à chaque chargement complet d'une page, sauf arrivée par le rideau) :
 * la hyène tombe comme un coup de tampon, un compteur et un trait courent, puis l'encre se lève.
 * Résout true s'il a été joué.
 */
export async function runLoader(skip = false) {
  const el = $('.loader');
  if (!el) return false;
  if (REDUCE || skip) { el.remove(); return false; }
  lenis?.stop();
  const count = $('.loader-count', el);
  const o = { v: 0 };
  const tl = gsap.timeline();
  tl.from('.loader-mark .hy', { scale: 1.6, opacity: 0, rotation: -8, duration: 0.45, ease: 'expo.out' }, 0.05) // coup de tampon
    .to('.loader-mark .hy', { scale: 0.95, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.4)
    .fromTo('.loader-bar', { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, 0)
    .to(o, { v: 100, duration: 0.9, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0);
  await Promise.all([tl.then(), document.fonts?.ready]);
  gsap.timeline({ onComplete: () => { el.remove(); lenis?.start(); ScrollTrigger.refresh(); } })
    .to('.loader-inner', { yPercent: -40, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0)
    .to(el, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, 0.1);
  return true;
}

addEventListener('pageshow', (e) => { if (e.persisted) { document.documentElement.classList.remove('came'); gsap.set('.curtain', { visibility: 'hidden' }); lenis?.start(); } });

/* ------------------------------------------------------------------ */
/* Curseur + boutons magnétiques                                       */
/* ------------------------------------------------------------------ */
function initCursor() {
  if (!FINE || REDUCE) return;
  const c = $('.cursor');
  const label = $('.cursor-label');
  gsap.set(c, { xPercent: -50, yPercent: -50 });
  const xTo = gsap.quickTo(c, 'x', { duration: 0.3, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.3, ease: 'power3' });
  addEventListener('pointermove', (e) => { c.classList.add('is-on'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-cursor]');
    c.classList.toggle('is-big', !!el);
    label.textContent = el ? t(el.dataset.cursorKey || 'cursor.view') : '';
  });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  // Dans une iframe (prototype live), la page ne reçoit plus les mouvements : le point restait figé au bord du cadre.
  // Il s'efface, le prototype garde son propre curseur ; il revient au premier mouvement hors du cadre.
  document.addEventListener('pointerover', (e) => { if (e.target.tagName === 'IFRAME') c.classList.remove('is-on'); });
}

function initMagnetic() {
  if (!FINE || REDUCE) return;
  const tos = new WeakMap();
  const get = (el) => {
    if (!tos.has(el)) tos.set(el, { x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.5)' }), y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.5)' }) });
    return tos.get(el);
  };
  let current = null;
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('[data-magnetic]');
    if (current && current !== el) { const q = get(current); q.x(0); q.y(0); }
    current = el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const q = get(el);
    q.x((e.clientX - r.left - r.width / 2) * 0.3);
    q.y((e.clientY - r.top - r.height / 2) * 0.3);
  }, { passive: true });
}

/* ------------------------------------------------------------------ */
/* Motion partagé                                                      */
/* ------------------------------------------------------------------ */
/** Apparition "spawn" (façon bento MFT) : les tuiles tombent en place. */
export function spawn(targets, trigger, { stagger = 0.07, y = 90 } = {}) {
  return gsap.from(targets, {
    y, scale: 0.9, opacity: 0,
    rotation: (i) => (i % 2 ? 1 : -1) * (2 + (i % 3)),
    duration: 0.9, stagger, ease: 'back.out(1.3)',
    scrollTrigger: { trigger, start: 'top 82%' },
  });
}
/** Titre qui monte lettre à lettre (lettres groupées par mot). */
export function revealTitle(el, trigger = el) {
  if (!el) return;
  const split = SplitText.create(el, { type: 'words,chars', mask: 'chars' });
  gsap.from(split.chars, { yPercent: 110, duration: 0.9, stagger: 0.02, ease: 'expo.out', scrollTrigger: { trigger, start: 'top 85%' } });
}
/** Compteurs : 0 -> valeur à l'arrivée à l'écran. */
export const formatCount = (v, sep, suffix = '') => (sep ? Math.round(v).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US') : Math.round(v)) + suffix;
export function countUp(root) {
  $$('[data-count]', root).forEach((el) => {
    const end = +el.dataset.count;
    const fmt = (v) => formatCount(v, el.dataset.sep, el.dataset.suffix || '');
    const o = { v: 0 };
    el.textContent = fmt(0); // le HTML porte la vraie valeur : sans animation, c'est elle qu'on lit
    gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); }, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

/* ------------------------------------------------------------------ */
/* Outro : la morsure (crocs qui se referment) puis le contact         */
/* ------------------------------------------------------------------ */
// Le crâne 3D (scenes3d.js, chargé en différé) : un seul montage par page, réattaché si l'outro est redessinée
// (changement de langue). Le scroll écrit dans JAWS, la boucle 3D le lit.
const JAWS = { a: 0, c: 0 };
let jaws = null;
// Pas de crâne sans WebGL, ni sur un téléphone à bout de mémoire : pas d'approche ni d'épinglage, le contact arrive normalement.
const canJaws = (() => {
  let ok = null;
  return () => {
    if (ok === null) {
      try {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        ok = !!gl && !((navigator.deviceMemory || 8) <= 2);
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch { ok = false; }
    }
    return ok;
  };
})();
let jawMotion = [], jawsBroken = false;
/** Le crâne n'a pas pu se monter après coup (réseau, contexte perdu) : on retire la séquence, le contact s'affiche sans attendre. */
function dropJaws() {
  jawsBroken = true; // un changement de langue redessine l'outro : pas de séquence à nouveau
  jawMotion.forEach((m) => { m.scrollTrigger?.kill(true); m.kill(); });
  jawMotion = [];
  $$('.bite-stage, .bite-run').forEach((el) => el.remove());
  const shown = '.contact, .contact-title .line-in, .contact-hyena .hy, .contact-ctas .btn';
  gsap.killTweensOf(shown);
  gsap.set(shown, { clearProps: 'opacity,transform' });
  ScrollTrigger.refresh();
}
function loadJaws() {
  const stage = $('.bite-stage');
  if (!stage) return;
  if (jaws) { jaws.then((j) => j?.attach(stage)); return; }
  jaws = import('./scenes3d.js')
    .then(({ mountSkull }) => mountSkull(stage, { root: ROOT, state: JAWS }))
    .catch((e) => { console.warn('Crâne 3D indisponible :', e); dropJaws(); return null; }); // le contact s'affiche
}

export function renderOutro({ jaws = true } = {}) {
  const el = $('#outro');
  jaws = jaws && !jawsBroken && canJaws();
  el.innerHTML = `
    ${jaws ? '<div class="bite-stage" aria-hidden="true"></div><div class="bite-run" aria-hidden="true"></div>' : ''}
    <section class="contact" id="contact" data-theme="dark">
      <div class="contact-hyena" data-hyena="boil"></div>
      <h2 class="contact-title">
        <span class="line"><span class="line-in">${t('contact.l1')}</span></span>
        <span class="line"><span class="line-in">${t('contact.l2')}</span></span>
      </h2>
      <div class="contact-ctas">
        <!-- TODO Johan : ajouter un mailto si tu veux un email public -->
        <a class="btn btn-primary" href="https://www.linkedin.com/in/hyrule-hero/" target="_blank" rel="noopener" data-magnetic data-sound data-cursor data-cursor-key="cursor.go"><span>${t('contact.li')}</span><span aria-hidden="true">↗</span></a>
        <a class="btn" href="${asset('cv-johan-trigeard.pdf')}" download="Johan-Trigeard-CV.pdf" data-magnetic data-sound><span>${t('contact.cv')}</span><span aria-hidden="true">↓</span></a>
        <a class="btn" href="https://www.instagram.com/edyhean/" target="_blank" rel="noopener" data-magnetic data-sound><span>Instagram</span><span aria-hidden="true">↗</span></a>
      </div>
      <footer class="foot mono"><span>© 2026 Johan Trigeard</span>${jaws ? `<a class="foot-credit" href="https://sketchfab.com/3d-models/brown-hyena-skull-db5a9af4646344c3b69fb6cad5a7a2b2" target="_blank" rel="noopener">${t('foot.skull')}</a>` : ''}</footer>
    </section>`;
  fillHyenas(el);
}

/** À appeler dans un gsap.matchMedia (créé en dernier : il est en bas de page). */
export function outroMotion() {
  // Le crâne naît juste sous le dernier bloc, fonce vers l'écran en ouvrant la gueule jusqu'à le recouvrir, puis on
  // plonge dedans pendant que le contact reste épinglé : il apparaît derrière.
  const jawed = !!$('.bite-stage');
  if (jawed) {
    ScrollTrigger.create({ trigger: '#outro', start: 'top 300%', once: true, onEnter: loadJaws });
    if (jaws) loadJaws(); // outro redessinée : on y remet le canvas
    const approach = gsap.fromTo(JAWS, { a: 0 }, { a: 1, ease: 'none', scrollTrigger: { trigger: '#outro', start: 'top bottom-=10', endTrigger: '.contact', end: 'top top', scrub: 0.6 } });
    // Au doigt, le scroll natif file devant le JS : anticipatePin engage l'épinglage juste avant d'arriver, sans à-coup.
    const dive = gsap.timeline({ scrollTrigger: { trigger: '.contact', start: 'top top', end: '+=60%', pin: true, scrub: 0.6, anticipatePin: FINE ? 0 : 1 } })
      .fromTo(JAWS, { c: 0 }, { c: 1, duration: 1, ease: 'power1.in' }, 0)
      .fromTo('.contact', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0.25);
    jawMotion = [approach, dive];
  }

  // Le contenu du contact entre quand la gueule s'ouvre (ou en arrivant, sans mâchoire).
  const st = { trigger: '.contact', start: jawed ? 'top 1%' : 'top 70%', toggleActions: 'play none none reverse' };
  gsap.from('.contact-title .line-in', { yPercent: 115, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: st });
  gsap.from('.contact-hyena .hy', { yPercent: 30, rotation: 8, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: st });
  gsap.from('.contact-ctas .btn', { y: 30, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', scrollTrigger: jawed ? st : { ...st, trigger: '.contact-ctas', start: 'top 95%' } });
}

/* ------------------------------------------------------------------ */
/* Démarrage commun                                                    */
/* ------------------------------------------------------------------ */
export function boot() {
  $('#hy-body').setAttribute('d', HYENA_BODY);
  renderHeader();
  fillHyenas();
  applyStatic();
  initScroll();
  initHeaderBehaviour();
  initEyes();
  initBoil();
  initCursor();
  initMagnetic();
  bindSounds();
  if (import.meta.env.DEV) window.ST = ScrollTrigger; // debug : ST.getAll()
}

/** Rafraîchit les ScrollTriggers quand les images arrivent (hauteurs réelles). */
export function refreshOnImages(root = document) {
  let pending = 0, timer;
  // Au doigt, un refresh en plein geste casse l'inertie et fait sauter l'épinglage : on attend que le scroll se pose.
  const whenIdle = () => { if (!FINE && performance.now() - lastScroll < 220) { timer = setTimeout(whenIdle, 120); return; } ScrollTrigger.refresh(); };
  let lastScroll = 0;
  if (!FINE) addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  $$('img', root).forEach((img) => {
    if (img.complete) return;
    pending++;
    img.addEventListener('load', () => { clearTimeout(timer); timer = setTimeout(whenIdle, 120); }, { once: true });
  });
  return pending;
}
