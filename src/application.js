// Candidatures : /{slug}/ = la home « Booster » habillée pour une entreprise, avec des projets imaginés.
// Sur le vrai portfolio (pas de data-application sur <body>), APP vaut null et rien de ce fichier ne s'applique :
// les configs et le CSS sont des morceaux à part, chargés seulement sur une page de candidature.
import { UI } from './i18n.js';
import { CONTACT, mailAddress } from './data/home.js';
import { gsap, REDUCE, lenis, $ } from './core.js';
import { play } from './sound.js';

const CONFIGS = import.meta.glob('./data/applications/*.js');
const slug = document.body.dataset.application;
export const APP = slug ? (await CONFIGS[`./data/applications/${slug}.js`]()).default : null;

if (APP) {
  await import('./application.css');
  const c = APP.company;
  // Les textes du moteur (valables pour toute entreprise), puis ceux de la config par-dessus.
  Object.assign(UI.fr, {
    'app.bar': `${c}, et si ces projets devenaient vrais ?`,
    'app.bar.short': 'Et si c’était vrai ?',
    'app.contact': 'Contactez-moi sur LinkedIn',
    'app.contact.short': 'LinkedIn',
    'app.mail': 'ou par mail',
    'app.mail.short': 'Mail',
    'app.us': 'This could be us…',
    'app.real': 'Voir mon vrai book',
    'app.legal': `Projets imaginés, non réalisés pour ${c}. Ce site n'est pas un site ${c}.`,
    'app.fiction': 'Projet imaginé',
  }, APP.ui?.fr);
  Object.assign(UI.en, {
    'app.bar': `${c}, what if these projects became real?`,
    'app.bar.short': 'What if it were real?',
    'app.contact': 'Contact me on LinkedIn',
    'app.contact.short': 'LinkedIn',
    'app.mail': 'or by email',
    'app.mail.short': 'Email',
    'app.us': 'This could be us…',
    'app.real': 'See my real portfolio',
    'app.legal': `Imagined projects, not made for ${c}. This is not a ${c} website.`,
    'app.fiction': 'Imagined project',
  }, APP.ui?.en);
  const root = document.documentElement.style, th = APP.theme;
  Object.entries({ '--ink': th.ink, '--paper': th.paper, '--paper-2': th.paper2, '--app-accent': th.accent, '--app-on-accent': th.onAccent })
    .forEach(([k, v]) => v && root.setProperty(k, v));
}

/** Le bandeau du haut : une accroche et le contact. À appeler une fois, après boot(). */
export function mountReality({ t }) {
  if (!APP) return;
  const both = (k) => `<span class="reality-long" data-i18n="${k}">${t(k)}</span><span class="reality-short" data-i18n="${k}.short">${t(`${k}.short`)}</span>`;
  const el = document.createElement('aside');
  el.className = 'reality';
  el.innerHTML = `
    <p class="reality-txt">${both('app.bar')}</p>
    <a class="reality-cta" href="${CONTACT.linkedin}" target="_blank" rel="noopener" data-sound>${both('app.contact')}<span aria-hidden="true">↗</span></a>
    <button type="button" class="reality-mail" data-sound>${both('app.mail')}</button>`;
  document.body.append(el);
  el.querySelector('.reality-mail').addEventListener('click', () => {
    location.href = `mailto:${mailAddress()}`;
  });
}

const rand = (a, b) => a + Math.random() * (b - a);
let glitching = false;

/** Clic sur une carte : le projet n'existe pas. Elle glitche, ses éclats filent vers « Voir mon vrai book », qui répond. */
export function glitchCard(card) {
  const box = $('.who-real'), link = $('a', box);
  link.focus({ preventScroll: true });
  const r = link.getBoundingClientRect();
  const hidden = r.bottom < 60 || r.top > innerHeight; // au téléphone, le bouton est au-dessus des cartes : on y remonte
  if (REDUCE) { if (hidden) box.scrollIntoView({ block: 'center' }); return; }
  if (glitching) return;
  glitching = true;
  play('glitch');

  card.classList.add('is-glitch');
  const art = $('.card-art', card);
  const slices = Array.from({ length: 5 }, () => {
    const s = document.createElement('i');
    const t = rand(4, 82);
    s.className = 'card-slice';
    s.style.cssText = `background-image:url("${$('img', art).src}");--t:${t}%;--b:${100 - t - rand(4, 14)}%;--x:${rand(-26, 26)}px`;
    art.append(s);
    return s;
  });
  gsap.delayedCall(0.54, () => { card.classList.remove('is-glitch'); slices.forEach((s) => s.remove()); });

  // Où sera le bouton une fois la page remontée (les éclats visent ce point).
  const y = hidden ? Math.max(0, scrollY + r.top - innerHeight * 0.4) : scrollY;
  if (hidden) lenis.scrollTo(y, { duration: 0.8, force: true });
  const to = { x: r.left + r.width / 2, y: r.top + scrollY - y + r.height / 2 };

  const c = card.getBoundingClientRect();
  const colors = ['#FF0046', '#00EBFF', getComputedStyle(document.documentElement).getPropertyValue('--app-accent'), getComputedStyle(document.documentElement).getPropertyValue('--ink')];
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('i');
    s.className = 'glitch-shard';
    s.style.cssText = `width:${rand(4, 16)}px;height:${rand(3, 8)}px;background:${colors[i % colors.length]}`;
    document.body.append(s);
    gsap.fromTo(s, { x: c.left + rand(0, c.width), y: c.top + rand(0, c.height), rotation: rand(-40, 40), scale: 1 }, {
      x: to.x, y: to.y, rotation: rand(-200, 200), scale: 0.35, duration: rand(0.45, 0.7), delay: 0.14 + i * 0.016, ease: 'power3.in', onComplete: () => s.remove(),
    });
  }

  // Les éclats arrivent : le bouton encaisse et appelle.
  gsap.delayedCall(0.68, () => {
    play('ding');
    box.classList.remove('is-called');
    void box.offsetWidth; // relance l'anneau
    box.classList.add('is-called');
    gsap.timeline({ onComplete: () => { gsap.set(box, { clearProps: 'transform' }); glitching = false; } })
      .to(box, { scale: 1.16, duration: 0.2, ease: 'back.out(4)' })
      .to(box, { x: -4, duration: 0.05 }).to(box, { x: 4, duration: 0.05 }).to(box, { x: -2, duration: 0.05 }).to(box, { x: 0, duration: 0.05 })
      .to(box, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    gsap.delayedCall(1.6, () => box.classList.remove('is-called'));
  });
}
