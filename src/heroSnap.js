// Pages projet : le premier geste depuis l'intro ancre en douceur sur le premier bloc, le geste inverse y ramène.
// Plus jamais la moitié de l'intro en haut de l'écran avec un prototype sous le curseur qui prend la molette (Johan, 09/11).
// Passé le premier bloc, le scroll reste celui de Lenis. Sans animation (REDUCE, pas de Lenis), rien ne s'applique.
import { $, lenis, REDUCE } from './core.js';

const EDGE = 2; // px de tolérance autour des deux positions d'arrêt
const QUIET = 140; // ms sans molette : le geste est fini (l'inertie d'un trackpad continue après l'ancrage)
const MAX_QUIET = 900; // au-delà, on rend la main même si la molette n'a jamais cessé
const PULL = 40; // px : au doigt, en deçà la page revient d'où elle partait (un effleurement n'emmène pas ailleurs)
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const inOutSine = (x) => 0.5 - Math.cos(Math.PI * x) / 2;

let busy = false, calm = false, last = 0, doneAt = 0, run = 0;

// Une intro plus haute que l'écran (long texte au téléphone) se lit normalement : l'ancrage en sauterait une partie.
const ready = (h = innerHeight) => lenis && !lenis.isStopped && $('.blk') && $('.intro').offsetHeight <= h * 1.08;

const anchor = () => Math.round($('.blk').getBoundingClientRect().top + scrollY);

function go(y) {
  busy = calm = true;
  const id = ++run;
  const duration = Math.min(1.1, 0.55 + (Math.abs(y - scrollY) / innerHeight) * 0.55);
  const done = () => { if (id !== run || !busy) return; busy = false; doneAt = performance.now(); };
  lenis.scrollTo(y, { duration, easing: inOut, force: true, onComplete: done });
  setTimeout(done, duration * 1000 + 250); // si un autre scroll a interrompu celui-ci
}

// Un cadre à défilement propre (captures pleine page) garde le geste tant qu'il peut encore défiler.
function frameTakes(target, dy) {
  const f = target?.closest?.('[data-lenis-prevent]');
  return !!f && (dy > 0 ? f.scrollTop + f.clientHeight < f.scrollHeight - 1 : f.scrollTop > 0);
}

/** Un cran de molette (ou la molette relayée par un prototype en iframe). true : le geste est pris, la page ne bouge pas seule. */
export function heroStep(dy, target) {
  if (!ready()) return false;
  const now = performance.now(), gap = now - last;
  last = now;
  if (calm) {
    if (busy || (gap < QUIET && now - doneAt < MAX_QUIET)) return true;
    calm = false;
  }
  const y = scrollY, a = anchor(), down = dy > 0;
  if (y < a - EDGE) { // dans l'intro
    if (!down && y < EDGE) return false;
    go(down ? a : 0);
    return true;
  }
  if (frameTakes(target, dy)) return false;
  if (y > a + EDGE) { // plus bas : on s'arrête sur le premier bloc en remontant
    if (down || lenis.targetScroll + dy >= a) return false;
    go(a);
    return true;
  }
  if (down) return false; // sur le premier bloc, vers le bas : le scroll normal reprend
  go(0);
  return true;
}

const KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };

export function heroSnap() {
  if (REDUCE || !lenis) return;

  // En capture : avant Lenis et avant les cadres.
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || !e.deltaY) return;
    if (heroStep(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, e.target)) { e.preventDefault(); e.stopPropagation(); }
  }, { capture: true, passive: false });

  addEventListener('keydown', (e) => {
    const dir = e.key === ' ' && e.shiftKey ? -1 : KEYS[e.key];
    if (!dir || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.('input,textarea,select,[contenteditable]') || (e.key === ' ' && e.target.closest?.('a,button'))) return;
    if (heroStep(dir * 100, e.target)) e.preventDefault();
  });

  touchSnap();
}

/* Au doigt : le scroll reste entièrement natif. On ne touche jamais au geste (aucun preventDefault : pas de résistance, la
   barre d'adresse se replie normalement, l'inertie va où elle veut). C'est seulement une fois la page au repos, doigt levé
   et inertie finie, que l'on glisse sur la position d'arrêt voulue si elle s'est arrêtée entre l'intro et le premier bloc.
   Le moindre contact pendant ce glissement l'annule : la page est toujours au doigt. */
function touchSnap() {
  let from = null, touching = false, idle;
  // La hauteur de référence ne suit pas la barre d'adresse : elle ne change qu'avec la largeur (rotation).
  let vw = innerWidth, vh = innerHeight;
  addEventListener('resize', () => { if (innerWidth !== vw) { vw = innerWidth; vh = innerHeight; } }, { passive: true });

  const glide = (y) => {
    busy = true;
    const id = ++run, dist = Math.abs(y - scrollY) / vh;
    const duration = Math.min(0.75, 0.32 + dist * 0.5);
    const done = () => { if (id === run) busy = false; };
    lenis.scrollTo(y, { duration, easing: inOutSine, force: true, onComplete: done });
    setTimeout(done, duration * 1000 + 200);
  };
  const settle = () => {
    if (touching || busy || !ready(vh) || window.visualViewport?.scale > 1.01) return;
    const y = scrollY, a = anchor();
    if (y <= EDGE || y >= a - EDGE) return; // au repos sur une position d'arrêt (ou plus bas) : rien à faire
    const wasStopped = from !== null && (from <= EDGE || Math.abs(from - a) <= EDGE);
    let to = y > a / 2 ? a : 0; // repris en cours de route, ou revenu de plus bas : le plus proche
    if (wasStopped) { const moved = y - from; to = Math.abs(moved) < PULL ? from <= EDGE ? 0 : a : moved > 0 ? a : 0; }
    glide(to);
  };
  const wait = () => { clearTimeout(idle); idle = setTimeout(settle, QUIET); };

  addEventListener('touchstart', (e) => {
    touching = true;
    if (e.touches.length > 1) { from = null; return; }
    from = scrollY;
    if (busy) { run++; busy = false; lenis.scrollTo(scrollY, { immediate: true, force: true }); } // le doigt reprend la main
  }, { passive: true });
  const end = (e) => { if (e.touches.length) return; touching = false; wait(); };
  addEventListener('touchend', end, { passive: true });
  addEventListener('touchcancel', end, { passive: true });
  addEventListener('scroll', () => { if (from !== null) wait(); }, { passive: true });
}
