// « C'est qui celui-là ? » (/a-propos/) : tout sur un écran. Ma carte, hors tirage, à gauche ; le texte et le parcours à droite.
import './style.css';
import './home.css';
import './about.css';
import { gsap, ScrollTrigger, $, $$, REDUCE, MOBILE, t, tx, asset, onLang, ROOT, boot, fillHyenas, curtainIn, revealTitle } from './core.js';
import { PATH, BRANDS, CONTACT, mailAddress } from './data/home.js';
import { play } from './sound.js';

const TOOLS = ['Figma', 'Photoshop', 'Illustrator', 'After Effects', 'Claude Code'];
const label = (v) => (typeof v === 'string' ? v : tx(v));

// La carte : chaque clic la fait tourner et passe à la suivante, puis revient à moi.
const SLIDES = [
  { img: 'about/johan.webp', name: 'Johan Trigeard', key: 'hero.role', alt: 'about.photo', pos: '50% 32%' },
  { img: 'about/warwick.webp', name: 'Warwick', role: { fr: 'Stagiaire Graphiste', en: 'Graphic Design Intern' }, pos: '50% 62%' },
];
const roleOf = (s) => (s.key ? t(s.key) : label(s.role));
let shown = 0, asked = 0, turn = 0;

const media = (s, i) => `<img class="ab-media${i === shown ? ' is-on' : ''}" style="--pos:${s.pos}" src="${asset(s.img)}" alt="${s.alt ? t(s.alt) : s.name}">`;

function show(i) {
  shown = i;
  $$('.ab-media').forEach((m, j) => m.classList.toggle('is-on', j === i));
  $('.ab-card .card-txt b').textContent = SLIDES[i].name;
  $('.ab-card .card-txt span').textContent = roleOf(SLIDES[i]);
}

// Le contenu change côté dos, quand la carte est retournée ; chaque tour demandé passe une image, même en cliquant vite.
function spin(dir = 1) {
  const n = SLIDES.length;
  asked = (asked + 1) % n;
  if (REDUCE) { show(asked); return; }
  play('deal');
  const left = $('.ab-left'), card = $('.ab-card');
  turn += 360 * dir;
  // Départ vif, arrivée lente : le tour file pendant le dos, la nouvelle image se pose doucement. La carte se soulève pendant ce temps.
  gsap.to(left, {
    rotationY: turn, transformPerspective: 2200, duration: 1.15, ease: 'power3.out', overwrite: 'auto',
    onUpdate() {
      const a = ((gsap.getProperty(left, 'rotationY') % 360) + 360) % 360, back = a > 90 && a < 270;
      if (back && !card.classList.contains('is-back')) {
        if (shown !== asked) show((shown + 1) % n);
        burst(left);
      }
      card.classList.toggle('is-back', back);
    },
    onComplete() { card.classList.remove('is-back'); },
  });
  gsap.to(left, { keyframes: [{ scale: 1.045, duration: 0.3, ease: 'sine.out' }, { scale: 1, duration: 0.85, ease: 'sine.inOut' }], overwrite: 'auto' });
}

// Des éclats d'encre partent du tour de la carte (position: fixed, ils ne peuvent pas faire déborder la page).
const rand = (a, b) => a + Math.random() * (b - a);
function burst(left) {
  if ($$('.ab-fleck').length > 70) return; // clics en rafale
  const box = left.getBoundingClientRect(), w = left.offsetWidth, h = left.offsetHeight;
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  const count = innerWidth < 640 ? 14 : 28; // au téléphone, moitié moins d'éclats
  for (let i = 0; i < count; i++) {
    // Un point sur le pourtour de la carte, et sa direction depuis le centre.
    const t = Math.random(), side = i % 4;
    const px = side < 2 ? (t - 0.5) * w : (side === 2 ? -w / 2 : w / 2);
    const py = side < 2 ? (side === 0 ? -h / 2 : h / 2) : (t - 0.5) * h;
    const len = Math.hypot(px, py), dist = rand(50, 200), star = i % 5 === 0;
    const el = document.createElement('i');
    el.className = `ab-fleck${star ? ' is-star' : ''}`;
    const size = star ? rand(12, 22) : rand(3, 9);
    el.style.cssText = `width:${size}px;height:${star ? size : size * rand(0.35, 1)}px`;
    document.body.append(el);
    const life = rand(0.7, 1.25);
    gsap.fromTo(el, { x: cx + px, y: cy + py, rotation: rand(0, 180) }, { x: cx + px + (px / len) * dist, y: cy + py + (py / len) * dist + rand(10, 60), rotation: `+=${rand(-160, 160)}`, duration: life, ease: 'power3.out' });
    gsap.fromTo(el, { scale: 0 }, { scale: 1, duration: 0.16, ease: 'back.out(3)' });
    gsap.to(el, { scale: 0.2, opacity: 0, duration: life * 0.5, delay: life * 0.5, ease: 'power1.in', onComplete: () => el.remove() });
  }
}

function render() {
  turn = 0; asked = shown;
  document.title = `${t('about.title')} · Johan Trigeard`;
  $('#app').innerHTML = `
    <section class="ab" data-theme="light">
      <div class="ab-left">
        <div class="card ab-card" role="button" tabindex="0" aria-label="${t('about.next')}" data-cursor data-cursor-key="about.next" style="--bg:#0B0B0B;--fg:#EFE9DD">
          <span class="card-art">${SLIDES.map(media).join('')}</span>
          <span class="card-info">
            <span class="card-logo" data-hyena></span>
            <span class="card-txt"><b>${SLIDES[shown].name}</b><span>${roleOf(SLIDES[shown])}</span></span>
            <span class="card-n mono" aria-hidden="true">★</span>
          </span>
          <span class="card-shine" aria-hidden="true"></span>
          <span class="ab-tag mono">${t('about.tag')}</span>
          <span class="ab-hint mono" aria-hidden="true"><i>↻</i>${t('about.next')}</span>
          <span class="ab-back" aria-hidden="true"><span class="ab-back-hy" data-hyena></span></span>
        </div>
      </div>
      <div class="ab-right">
        <p class="ab-kicker mono">${t('hero.role')} · Bordeaux</p>
        <h1 class="ab-title">${t('about.title')}</h1>
        <p class="ab-bio">${t('about.bio')}</p>
        <p class="ab-bio ab-bio2">${t('about.bio2')}</p>
        <div class="ab-cta">
          <a class="key key-ink" href="${CONTACT.linkedin}" target="_blank" rel="noopener" data-sound>${t('contact.li')}<span aria-hidden="true">↗</span></a>
          <a class="chip" href="${ROOT}#work" data-page data-sound>${t('about.work')}</a>
        </div>
        <div class="ab-grid">
          <section class="ab-path">
            <h2 class="mono">${t('nav.path')}</h2>
            <ol>${[...PATH].reverse().map((r, i, all) => `<li${r.next ? ' class="is-next"' : ''}><span class="mono">${label(r.years)}</span><b>${tx(r.role)}</b><span class="ab-org">${i && all[i - 1].org === r.org ? r.org.split(' · ')[0] : r.org}</span></li>`).join('')}</ol>
          </section>
          <div class="ab-side">
            <section>
              <h2 class="mono">${t('about.tools')}</h2>
              <ul class="ab-tools">${TOOLS.map((x) => `<li class="mono">${x}</li>`).join('')}</ul>
            </section>
            <section class="ab-brands">
              <h2 class="mono">${t('brands.toggle')}</h2>
              <ul>${BRANDS.map((b) => `<li><img src="${asset(b.src)}" alt="${b.name}" title="${b.name}" style="--s:${b.scale}"></li>`).join('')}</ul>
            </section>
          </div>
        </div>
      </div>
    </section>`;
  $('#outro').innerHTML = `
    <footer class="bar mono" id="contact" data-theme="light">
      <span>Johan Trigeard © 1993 – 202+</span>
      <span class="bar-links">
        <a href="${CONTACT.linkedin}" target="_blank" rel="noopener" data-sound>LinkedIn ↗</a>
        <button type="button" data-mail data-sound>${t('bar.mail')}</button>
      </span>
    </footer>`;
  fillHyenas($('.ab'));
  $$('img.ab-media').forEach((i) => i.decode?.().catch(() => {})); // prêtes avant le premier tour
}

function bind() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-mail]')) location.href = `mailto:${mailAddress()}`;
    else if (e.target.closest('.ab-card') && e.timeStamp - swiped > 400) spin();
  });
  // Au doigt : glisser la carte de côté la fait tourner dans le sens du geste (le tap marche aussi ; le scroll vertical passe).
  let start = null, swiped = -1000;
  document.addEventListener('pointerdown', (e) => { start = e.pointerType !== 'mouse' && e.target.closest?.('.ab-card') ? { x: e.clientX, y: e.clientY } : null; }, { passive: true });
  document.addEventListener('pointercancel', () => { start = null; }, { passive: true });
  document.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = e.timeStamp; spin(dx < 0 ? 1 : -1); }
  }, { passive: true });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.ab-card')) { e.preventDefault(); spin(); }
  });
  // Comme les cartes du tirage : légère inclinaison et reflet qui suit la souris.
  document.addEventListener('pointermove', (e) => {
    const c = e.pointerType === 'mouse' && e.target.closest?.('.ab-card');
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);
    c.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
    c.style.setProperty('--mx', `${px * 100}%`);
    c.style.setProperty('--my', `${py * 100}%`);
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const c = e.target.closest?.('.ab-card');
    if (c && !c.contains(e.relatedTarget)) ['--rx', '--ry'].forEach((p) => c.style.setProperty(p, '0deg'));
  });
}

function intro(delay) {
  if (REDUCE) return;
  const phone = matchMedia(MOBILE).matches; // au téléphone, le bas de la page n'est pas à l'écran : le parcours et les outils arrivent au scroll
  gsap.from('.ab-left', { x: phone ? 60 : 140, y: 70, rotation: 12, scale: 0.84, opacity: 0, duration: 1.1, delay, ease: 'back.out(1.25)' });
  revealTitle($('.ab-title'));
  const tl = gsap.timeline({ delay: delay + 0.15 })
    .from(['.ab-kicker', '.ab-bio', '.ab-cta'], { y: 16, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 0);
  if (!phone) tl.from('.ab-path li', { x: -14, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out' }, 0.2);
  tl.from(phone ? '#hdr > *' : ['.ab-path h2', '.ab-side section', '.bar', '#hdr > *'], { y: 12, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 0.3)
    .fromTo('.ab-bio em', { '--hl': '0%' }, { '--hl': '100%', duration: 0.6, stagger: 0.25, ease: 'power2.inOut' }, 0.7);
  if (phone) {
    ScrollTrigger.batch(['.ab-path h2', '.ab-path li', '.ab-side section'], {
      start: 'top 92%', once: true,
      onEnter: (els) => gsap.from(els, { x: -14, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out', overwrite: true }),
    });
  }
}

boot();
render();
bind();
onLang(render);
const came = curtainIn();
intro(came ? 0.35 : 0.05);
