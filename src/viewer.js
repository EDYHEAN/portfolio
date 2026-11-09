// Agrandir une capture au doigt : un écran de site réduit à 390 px ne se lit pas. Plein écran, défilement natif dans les
// deux sens, pincement possible. N'existe qu'au tactile ou en fenêtre étroite : au bureau, data-zoom ne fait rien.
// [data-zoom="wide"] : une capture de bureau, ouverte à 980 px de large (la largeur à laquelle un téléphone rend un site
// de bureau), centrée. [data-zoom="phone"] : un écran mobile, à la largeur de l'écran.
import { gsap, REDUCE, tx } from './core.js';

const ZOOMS = matchMedia('(max-width: 860px), (pointer: coarse)');
let root = null, back = null, closing = false;

const onKey = (e) => {
  if (e.key === 'Escape') close();
  if (e.key === 'Tab') { e.preventDefault(); root.querySelector('.zv-close').focus(); } // un seul bouton : le focus reste dedans
};
const onPop = () => close(true);

function close(fromHistory = false) {
  if (!root || closing) return;
  closing = true;
  removeEventListener('keydown', onKey);
  removeEventListener('popstate', onPop);
  if (!fromHistory) history.back(); // le bouton retour du téléphone ferme, il ne quitte pas la page : on retire l'entrée posée à l'ouverture
  const el = root;
  const done = () => { el.remove(); root = null; closing = false; back?.focus({ preventScroll: true }); };
  if (REDUCE) done(); else gsap.to(el, { opacity: 0, duration: 0.2, onComplete: done });
}

function open(src, mode, title, from) {
  if (root) return;
  back = from;
  root = document.createElement('div');
  root.className = 'zv';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', title || tx({ fr: 'Image agrandie', en: 'Enlarged image' }));
  root.innerHTML = `
    <div class="zv-bar"><span class="mono zv-title"></span>
      <button type="button" class="zv-close" data-sound aria-label="${tx({ fr: 'Fermer', en: 'Close' })}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
    <div class="zv-scroll" data-lenis-prevent><div class="zv-fit"><img class="zv-img is-${mode === 'phone' ? 'phone' : 'wide'}" alt=""></div></div>`;
  root.querySelector('.zv-title').textContent = title || '';
  const im = root.querySelector('.zv-img'), scroller = root.querySelector('.zv-scroll');
  im.alt = title || '';
  im.src = src;
  document.body.append(root);
  // La largeur vient du CSS, pas de l'image : on peut centrer sans attendre son chargement.
  scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  root.querySelector('.zv-close').addEventListener('click', () => close());
  root.querySelector('.zv-close').focus({ preventScroll: true });
  addEventListener('keydown', onKey);
  history.pushState({ zv: 1 }, '');
  addEventListener('popstate', onPop);
  if (!REDUCE) gsap.from(root, { opacity: 0, duration: 0.25 });
}

document.addEventListener('click', (e) => {
  if (!ZOOMS.matches) return;
  const box = e.target.closest?.('[data-zoom]');
  if (!box) return;
  const im = box.matches('img') ? box : box.querySelector('.pg-shot.is-on') || box.querySelector('img');
  if (im) open(im.currentSrc || im.src, box.dataset.zoom, im.alt, e.target.closest('button') || box);
});
