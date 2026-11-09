// Le showreel : une carte tirée au hasard comme les autres (home.js), toujours à la dernière place, avec un aperçu vidéo muet. Au clic, elle passe en 16:9 dans la zone du tirage et les autres
// cartes dégagent (la colonne de gauche ne bouge pas) ; le vrai film se charge depuis Vimeo. À la fermeture, tout revient en place.
import { gsap, $, $$, REDUCE, MOBILE, t, asset } from './core.js';
import { play } from './sound.js';

const ID = '591673847';
const PAGE = `https://vimeo.com/${ID}`;
const PLAYER = `https://player.vimeo.com/video/${ID}?autoplay=1&autopause=0&title=0&byline=0&portrait=0&badge=0&dnt=1`;
const D = REDUCE ? 0 : 0.8;
const GAP = 48; // la place du bouton Fermer, au-dessus de la vidéo

let open = false, busy = false, rest = null, width = 0;

export const isReelOpen = () => open;
export const isReelBusy = () => busy;
export const reelCard = () => {
  open = busy = false; // la home est re-rendue (changement de langue) : état neutre
  return `
  <a class="card reel-card" href="${PAGE}" target="_blank" rel="noopener" data-sound data-cursor data-cursor-key="reel.cursor" style="--bg:#0B0B0B;--fg:#EFE9DD">
    <span class="card-art reel-art"><video src="${asset('reel/preview.mp4')}" poster="${asset('reel/preview.webp')}" muted loop playsinline ${REDUCE ? 'preload="none"' : 'autoplay preload="auto"'} aria-hidden="true"></video></span>
    <span class="card-info">
      <span class="card-logo" data-hyena></span>
      <span class="card-txt"><b>Showreel</b><span>${t('reel.type')}</span></span>
      <span class="card-n mono" aria-hidden="true">▶</span>
    </span>
    <span class="card-shine" aria-hidden="true"></span>
  </a>`;
};

const others = () => $$('.slot').filter((s) => !s.querySelector('.reel-card'));

// Bureau : centré dans la zone du tirage. Téléphone : pleine largeur, au milieu de l'écran.
function target(grid) {
  if (matchMedia(MOBILE).matches) {
    const h = grid.width * 9 / 16;
    return { left: grid.left, top: Math.max(96, (innerHeight - h) / 2), width: grid.width, height: h };
  }
  const width = Math.min(grid.width, (grid.height - GAP) * 16 / 9), height = width * 9 / 16;
  return { left: grid.left + (grid.width - width) / 2, top: grid.top + GAP + (grid.height - GAP - height) / 2, width, height };
}

export function openReel(card) {
  if (open || busy) return;
  open = busy = true;
  width = innerWidth;
  play('deal');
  const slot = card.parentElement, info = $('.card-info', card), art = $('.card-art', card);
  const box = $('.pull-grid').getBoundingClientRect(), s = slot.getBoundingClientRect(), to = target(box);
  const cs = getComputedStyle(info);
  rest = { h: info.offsetHeight, pt: cs.paddingTop, pb: cs.paddingBottom, m: getComputedStyle(art).marginLeft, r: getComputedStyle(art).borderRadius };
  card.removeAttribute('href'); // plus d'inclinaison ni de reflet
  ['--rx', '--ry'].forEach((p) => card.style.setProperty(p, '0deg'));
  card.classList.add('is-open');
  $('.home').classList.add('is-reel');
  gsap.set(slot, { zIndex: 20 });
  gsap.set(card, { left: 0, top: 0, right: 'auto', bottom: 'auto', width: s.width, height: s.height });

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'chip reel-close';
  close.innerHTML = `${t('reel.close')} <i aria-hidden="true">×</i>`;
  close.style.cssText = `left:${to.left - s.left + to.width}px;top:${to.top - s.top - 44}px`;
  slot.append(close);

  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  gsap.timeline({
    defaults: { duration: D, ease: 'power3.inOut' },
    onComplete: () => {
      busy = false;
      const frame = document.createElement('iframe');
      frame.className = 'reel-frame';
      frame.src = PLAYER;
      frame.title = 'Showreel';
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.addEventListener('load', () => { gsap.to(frame, { opacity: 1, duration: REDUCE ? 0 : 0.4 }); $('video', art).pause(); });
      art.append(frame);
    },
  })
    // Les autres cartes s'écartent vers l'extérieur du tirage, jamais vers la colonne de gauche.
    .to(others(), {
      x: (i, el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2 > cx ? 110 : 40; },
      y: (i, el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 > cy ? 70 : -70; },
      rotation: (i) => (i % 2 ? 7 : -7), scale: 0.8, opacity: 0, duration: REDUCE ? 0 : 0.5, ease: 'power2.in', stagger: REDUCE ? 0 : 0.03,
    }, 0)
    .to(card, { left: to.left - s.left, top: to.top - s.top, width: to.width, height: to.height }, 0)
    .to(info, { height: 0, paddingTop: 0, paddingBottom: 0, opacity: 0 }, 0)
    .to(art, { margin: 0, borderRadius: 0 }, 0)
    .fromTo(close, { opacity: 0 }, { opacity: 1, duration: REDUCE ? 0 : 0.3, ease: 'none' }, D * 0.7);
}

export function closeReel() {
  if (!open || busy) return;
  open = false; busy = true;
  play('deal');
  const card = $('.reel-card'), slot = card.parentElement, info = $('.card-info', card), art = $('.card-art', card);
  const s = slot.getBoundingClientRect();
  $('.reel-frame')?.remove();
  $('.reel-close')?.remove();
  if (!REDUCE) $('video', art).play().catch(() => {});
  gsap.timeline({
    defaults: { duration: D, ease: 'power3.inOut' },
    onComplete: () => {
      gsap.set(card, { clearProps: 'left,top,right,bottom,width,height' });
      gsap.set([info, art], { clearProps: 'all' });
      gsap.set(slot, { clearProps: 'zIndex' });
      gsap.set(others(), { clearProps: 'transform,opacity' });
      card.classList.remove('is-open');
      card.setAttribute('href', PAGE);
      $('.home').classList.remove('is-reel');
      busy = false;
    },
  })
    .to(card, { left: 0, top: 0, width: s.width, height: s.height }, 0)
    .to(info, { height: rest.h, paddingTop: rest.pt, paddingBottom: rest.pb, opacity: 1 }, 0)
    .to(art, { margin: rest.m, marginBottom: 0, borderRadius: rest.r }, 0)
    .to(others(), { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: REDUCE ? 0 : 0.6, ease: 'power3.out', stagger: REDUCE ? 0 : 0.04 }, D * 0.35);
}

export function bindReel() {
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeReel(); });
  addEventListener('resize', () => { if (innerWidth !== width) closeReel(); }); // la barre d'adresse du téléphone ne ferme rien
}
