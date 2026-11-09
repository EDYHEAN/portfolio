// Le logo du hero : la hyène SVG (regard qui suit la souris), légère inclinaison 3D vers le curseur,
// et au clic elle se retourne comme une carte et change de rendu.
import { gsap, REDUCE, FINE, PLAIN, hyenaSVG, lang } from './core.js';
import { play } from './sound.js';
import { HYENA_PUPILS } from './hyena.js';

const INK = '#0B0B0B';
export const STYLES = [
  { id: 'gravure', fr: 'Gravure', en: 'Engraving' },
  { id: 'relief', fr: 'Relief', en: 'Relief' },
  { id: 'riso', fr: 'Riso', en: 'Riso' },
  { id: 'trame', fr: 'Trame', en: 'Halftone' },
  { id: 'holo', fr: 'Holo', en: 'Holo' },
  { id: 'glitch', fr: 'Glitch', en: 'Glitch' },
];
let index = 0;
let tiltTo = null, listening = false, sway = null;

// Motifs SVG partagés (trame de points, dégradé holographique qui tourne).
function ensureDefs() {
  const defs = document.querySelector('.sprite defs');
  if (!defs || defs.querySelector('#lg-dots')) return;
  defs.insertAdjacentHTML('beforeend', `
    <pattern id="lg-dots" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx="9" cy="9" r="6.2" fill="${INK}"/>
    </pattern>
    <linearGradient id="lg-holo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="1200">
      <stop offset="0" stop-color="#ff6ec4"/><stop offset=".25" stop-color="#ffd36e"/>
      <stop offset=".5" stop-color="#7afcff"/><stop offset=".75" stop-color="#b18cff"/><stop offset="1" stop-color="#ff6ec4"/>
      ${REDUCE ? '' : '<animateTransform attributeName="gradientTransform" type="rotate" from="0 600 600" to="360 600 600" dur="7s" repeatCount="indefinite"/>'}
    </linearGradient>`);
}

// Teinte des couches du relief : de l'encre vers un gris chaud (calculée : fill SVG n'accepte pas color-mix partout).
const mix = (t) => '#' + [[11, 138], [11, 127], [11, 110]].map(([a, b]) => Math.round(a + (b - a) * (0.25 + t * 0.6)).toString(16).padStart(2, '0')).join('');

const layer = (cls, svg, style = '') => `<div class="lg-layer ${cls}"${style ? ` style="${style}"` : ''}>${svg}</div>`;

function markup(id) {
  switch (id) {
    case 'relief': {
      // 12 couches empilées en profondeur : de face c'est le logo, incliné on voit l'épaisseur.
      const n = 12;
      return Array.from({ length: n }, (_, k) => {
        const d = n - 1 - k; // la dernière écrite = devant
        const shade = d === 0 ? INK : mix(d / (n - 1));
        return layer('lg-depth', hyenaSVG(false, { fill: shade, pupil: d === 0 ? INK : shade }), `--d:${d}`);
      }).join('');
    }
    case 'riso':
      return layer('lg-riso lg-riso-a', hyenaSVG(false, { fill: '#FF48B0', pupil: '#FF48B0', filter: 'grit' }))
        + layer('lg-riso lg-riso-b', hyenaSVG(false, { fill: '#0078BF', pupil: '#0078BF', filter: 'grit' }));
    case 'trame':
      return layer('', hyenaSVG(false, { fill: 'url(#lg-dots)', pupil: INK }));
    case 'holo':
      return layer('lg-holo', hyenaSVG(false, { fill: 'url(#lg-holo)', pupil: INK }));
    case 'glitch':
      return layer('lg-gl lg-gl-r', hyenaSVG(false, { fill: '#ff2a4f', pupil: '#ff2a4f' }))
        + layer('lg-gl lg-gl-c', hyenaSVG(false, { fill: '#00d9ff', pupil: '#00d9ff' }))
        + layer('lg-gl lg-gl-k', hyenaSVG(false, { fill: INK, pupil: INK }));
    default:
      return layer('', hyenaSVG(true));
  }
}

const label = () => {
  const s = STYLES[index];
  return `${lang === 'fr' ? 'Rendu' : 'Render'} · ${s[lang]} <span>${index + 1}/${STYLES.length}</span>`;
};

/** Monte le logo dans `host` (le conteneur .who-hy). */
export function mountLogo(host) {
  ensureDefs();
  host.innerHTML = `
    <div class="lg-float"><div class="lg-tilt"><div class="lg-flip" data-style="${STYLES[index].id}">${markup(STYLES[index].id)}</div></div></div>
    ${PLAIN ? '' : `<span class="lg-label mono" aria-live="polite">${label()}</span>`}`;
  const tilt = host.querySelector('.lg-tilt');
  const flip = host.querySelector('.lg-flip');
  const lab = host.querySelector('.lg-label');

  if (!REDUCE) {
    gsap.set(tilt, { transformPerspective: 900 });
    tiltTo = { host, rx: gsap.quickTo(tilt, 'rotationX', { duration: 0.6, ease: 'power3' }), ry: gsap.quickTo(tilt, 'rotationY', { duration: 0.6, ease: 'power3' }) };
    // Sans souris : elle se balance doucement toute seule, sinon le rendu Relief n'aurait jamais d'épaisseur.
    sway?.kill();
    if (!FINE && !PLAIN) sway = gsap.fromTo(tilt, { rotationY: -14, rotationX: 5 }, { rotationY: 14, rotationX: -5, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    else if (!listening) {
      listening = true;
      addEventListener('pointermove', (e) => {
        if (!tiltTo?.host.isConnected) return;
        const r = tiltTo.host.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
        const ny = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        tiltTo.ry(Math.max(-1, Math.min(1, nx * 2)) * 18);
        tiltTo.rx(Math.max(-1, Math.min(1, ny * 2)) * -12);
      }, { passive: true });
    }
  }

  host.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); host.click(); } });
  const swap = () => {
    if (PLAIN) return; // au doigt, elle tourne sans changer de rendu
    index = (index + 1) % STYLES.length;
    const s = STYLES[index];
    flip.dataset.style = s.id; flip.innerHTML = markup(s.id); lab.innerHTML = label();
    gsap.fromTo(lab, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, overwrite: true });
  };
  // Chaque clic ajoute un tour complet, sans attendre la fin du précédent : on peut la faire vriller.
  // Le rendu change à chaque passage de profil (90° + k tours), là où le changement ne se voit pas.
  const spin = { r: 0 };
  let target = 0, turns = 0;
  const clicks = [];
  host.addEventListener('click', () => {
    play('deal');
    if (REDUCE) { swap(); return; }
    target += 360;
    gsap.to(spin, {
      r: target, duration: 0.75, ease: 'power2.out', overwrite: true,
      onUpdate: () => {
        gsap.set(flip, { rotationY: spin.r });
        const passed = spin.r >= 90 ? Math.floor((spin.r - 90) / 360) + 1 : 0;
        if (passed > turns) { turns = passed; swap(); }
      },
    });
    // 4 tours en 1,6 s : elle a trop tourné.
    const now = performance.now();
    clicks.push(now);
    while (clicks.length && now - clicks[0] > 1600) clicks.shift();
    if (clicks.length >= 4) dizzy(host);
  });
}

/* ------------------------------------------------------------------ */
/* Le tournis : des étoiles en orbite, les yeux qui tournent, la tête  */
/* qui tangue et un petit bruit de vrille. Passe tout seul après 3,5 s. */
/* ------------------------------------------------------------------ */
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z"/></svg>';
const DIZZY_MS = 3500;
let dizzyEnd = 0, dizzyOff = null, eyesTick = null, lastWhoop = 0;

function dizzy(host) {
  const now = performance.now();
  dizzyEnd = now + DIZZY_MS;
  if (now - lastWhoop > 1500) { lastWhoop = now; play('dizzy'); }
  if (!host.querySelector('.lg-stars')) {
    host.insertAdjacentHTML('beforeend', `<div class="lg-stars" aria-hidden="true">${[0, 1, 2, 3].map((k) => `<i style="--k:${k}"><b>${STAR}</b></i>`).join('')}</div>`);
  }
  host.classList.add('is-dizzy');
  // Les pupilles tournent en rond, chacune dans son sens (core.js arrête de les faire suivre la souris pendant ce temps).
  if (!eyesTick) {
    let a = 0;
    eyesTick = () => {
      a += 0.22;
      host.querySelectorAll('.hy').forEach((svg) => svg.querySelectorAll('.hy-pupil').forEach((el, i) => {
        const [rx, ry] = HYENA_PUPILS[i].range, dir = i ? -1 : 1;
        gsap.set(el, { x: Math.cos(a * dir) * rx, y: Math.sin(a * dir) * ry });
      }));
    };
    gsap.ticker.add(eyesTick);
  }
  clearTimeout(dizzyOff);
  dizzyOff = setTimeout(function calm() {
    if (performance.now() < dizzyEnd) { dizzyOff = setTimeout(calm, dizzyEnd - performance.now()); return; }
    host.classList.remove('is-dizzy');
    gsap.ticker.remove(eyesTick); eyesTick = null;
    host.querySelectorAll('.hy-pupil').forEach((el) => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'power3' }));
    const stars = host.querySelector('.lg-stars');
    if (stars) gsap.to(stars, { opacity: 0, duration: 0.4, onComplete: () => stars.remove() });
  }, DIZZY_MS);
}

/** Met à jour le libellé (changement de langue). */
export function relabel(host) {
  const lab = host.querySelector('.lg-label');
  if (lab) lab.innerHTML = label();
}
