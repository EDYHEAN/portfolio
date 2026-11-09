import './style.css';
import './home.css';
import {
  gsap, ScrollTrigger, $, $$, REDUCE, t, tx, asset, pageUrl, onLang, ROOT,
  boot, fillHyenas, curtainIn, navigate,
} from './core.js';
import { play } from './sound.js';
import { mountLogo } from './logo.js';
import { PROJECTS } from './data/projects.js';
import { BRANDS, CONTACT } from './data/home.js';
import { APP, mountReality, glitchCard } from './application.js';

// Le tirage : les vrais projets, ou ceux imaginés pour une candidature (/{slug}/).
const LIST = APP ? APP.projects : PROJECTS;

/* ------------------------------------------------------------------ */
/* Le tirage : uniquement des projets. Des cartes « à venir » comblent  */
/* les places tant qu'il n'y a pas assez de projets (MDM, Rhinov…).     */
/* ------------------------------------------------------------------ */
const SLOTS = 5;
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function draw(prev) {
  let pull;
  do { pull = shuffle(LIST).slice(0, SLOTS); } while (prev && pull.length > 1 && pull[0] === prev[0]);
  while (pull.length < SLOTS) pull.push(null); // emplacement « à venir »
  return pull;
}
let pull = draw();

const card = (p, i) => p ? `
  <a class="card" href="${p.fiction ? '#work' : pageUrl(p.id)}"${p.fiction ? ' role="button"' : ''} data-sound data-cursor data-cursor-key="cursor.view" style="--bg:${p.colors.bg};--fg:${p.colors.fg}">
    <span class="card-art"><img src="${asset(p.card || p.shot)}" alt="" decoding="async"></span>
    <span class="card-info">
      <span class="card-logo" style="--ls:${p.logo.markScale || 1}"><img src="${asset(p.logo.mark || p.logo.src)}" alt="" class="${p.logo.invert ? 'inv' : ''}"></span>
      <span class="card-txt"><b>${p.name}</b><span>${tx(p.type)}</span></span>
      <span class="card-n mono">${String(LIST.indexOf(p) + 1).padStart(2, '0')}</span>
    </span>
    <span class="card-shine" aria-hidden="true"></span>${p.fiction ? `<span class="card-fiction mono">${t('app.fiction')}</span>` : ''}
  </a>` : `
  <div class="card is-soon">
    <span class="soon-hy" data-hyena></span>
    <b>${t('soon.title')}</b><span>${t('soon.d')}</span>
  </div>`;

function renderPull() {
  $$('.slot').forEach((s, i) => { s.innerHTML = card(pull[i], i); });
  fillHyenas($('.pull-grid'));
}

function render() {
  const LOCK = `
        <div class="who-lock">
          <div class="who-hy" role="button" tabindex="0" aria-label="${t('logo.aria')}" data-sound data-cursor data-cursor-key="cursor.spin"></div>
          <h1 class="who-name"><span class="line"><span class="line-in">Johan</span></span><span class="line"><span class="line-in">Trigeard</span></span></h1>
        </div>`;
  $('#app').innerHTML = `
    <section class="home" id="top" data-theme="light">
      <div class="who">
        ${APP ? `
        <div class="who-co">
          ${LOCK}
          <span class="who-x" aria-hidden="true">×</span>
          <span class="who-co-logo"><img src="${asset(APP.logo)}" alt="${APP.company}"></span>
        </div>
        <p class="who-us">${t('app.us')}</p>
        <div class="who-real"><a class="key key-ink" href="${ROOT}" data-page data-sound>${t('app.real')}<span aria-hidden="true">→</span></a></div>
        <p class="who-legal mono">${t('app.legal')}</p>` : `
        ${LOCK}
        <p class="who-role mono">${t('hero.role')} · Bordeaux</p>
        <p class="who-line">${t('me.l1')}</p>
        <div class="who-actions">
          <button type="button" class="chip" data-brands aria-expanded="false" aria-controls="brandsPanel" data-sound>${t('brands.toggle')} <i aria-hidden="true">+</i></button>
          <button type="button" class="chip" data-booster-again data-sound>${t('booster.again')}</button>
          <div class="brands-panel" id="brandsPanel" hidden>
            <ul>${BRANDS.map((b) => `<li><img src="${asset(b.src)}" alt="${b.name}" title="${b.name}" style="--s:${b.scale}" loading="lazy"></li>`).join('')}</ul>
          </div>
        </div>`}
      </div>
      <div class="pull" id="work">
        <div class="pull-head">
          <span class="mono">${t('pull.title')} · <b>${String(LIST.length).padStart(2, '0')}</b> ${t('pull.count')}</span>
          <button type="button" class="key key-ink reroll" data-reroll data-sound><span class="reroll-ico" aria-hidden="true">↻</span>${t('pull.reroll')}</button>
        </div>
        <div class="pull-grid">${Array.from({ length: SLOTS }, (_, i) => `<div class="slot slot-${i}"></div>`).join('')}</div>
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
  renderPull();
  fillHyenas();
  mountLogo($('.who-hy'));
}

/* ------------------------------------------------------------------ */
/* Interactions                                                         */
/* ------------------------------------------------------------------ */
let toast;
function showToast(msg) {
  toast ??= Object.assign(document.body.appendChild(document.createElement('div')), { className: 'toast mono', role: 'status' });
  toast.textContent = msg;
  gsap.killTweensOf(toast);
  gsap.fromTo(toast, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)' });
  gsap.to(toast, { y: 10, opacity: 0, duration: 0.3, delay: 1.8 });
}

/** Distribue les cartes vers leur place, depuis un point (la bouche du booster ou le tas). */
function deal(from, { delay = 0 } = {}) {
  const slots = $$('.slot');
  slots.forEach((s, i) => {
    const r = s.getBoundingClientRect();
    gsap.fromTo(s, {
      x: from.x - (r.left + r.width / 2), y: from.y - (r.top + r.height / 2),
      scale: 0.28, rotation: (i % 2 ? 1 : -1) * (8 + i * 3), opacity: 0,
    }, {
      x: 0, y: 0, scale: 1, rotation: 0, opacity: 1,
      duration: 0.85, delay: delay + i * 0.09, ease: 'back.out(1.25)', overwrite: true,
      onStart: () => play('deal'),
    });
  });
}

let busy = false;
function reroll() {
  if (busy) return;
  busy = true;
  const grid = $('.pull-grid').getBoundingClientRect();
  const c = { x: grid.left + grid.width / 2, y: grid.top + grid.height / 2 };
  const slots = $$('.slot');
  gsap.to('.reroll-ico', { rotation: '+=360', duration: 0.7, ease: 'power3.inOut' });
  // les cartes se rassemblent en tas au centre…
  slots.forEach((s, i) => {
    const r = s.getBoundingClientRect();
    gsap.to(s, { x: c.x - (r.left + r.width / 2), y: c.y - (r.top + r.height / 2), scale: 0.4, rotation: (i - 2) * 6, opacity: 1, duration: 0.42, ease: 'power3.in', delay: i * 0.03, overwrite: true });
  });
  play('deal');
  // … on retire un nouveau tirage, et on redistribue.
  gsap.delayedCall(0.5, () => {
    pull = draw(pull);
    renderPull();
    gsap.set(slots, { clearProps: 'transform,opacity' });
    deal(c);
    gsap.delayedCall(0.9, () => { busy = false; });
  });
}

function mail() {
  const addr = CONTACT.mail.map((p) => [...p].reverse().join('')).join('@'); // assemblée au clic (anti robots)
  navigator.clipboard?.writeText(addr).then(() => { play('ding'); showToast(t('bar.copied')); }).catch(() => {});
  location.href = `mailto:${addr}`;
}

function bindInteractions() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-reroll]')) return reroll();
    if (e.target.closest('[data-mail]')) return mail();
    const tb = e.target.closest('[data-brands]');
    if (tb) {
      const open = tb.getAttribute('aria-expanded') !== 'true';
      tb.setAttribute('aria-expanded', String(open));
      const panel = $('#brandsPanel');
      if (open) {
        panel.hidden = false;
        if (!REDUCE) gsap.from($$('li', panel), { y: 14, opacity: 0, scale: 0.9, duration: 0.45, stagger: 0.04, ease: 'back.out(2)' });
      } else panel.hidden = true;
      return;
    }
    if (e.target.closest('[data-booster-again]')) return showBooster(true);
    const a = e.target.closest('.card[href]');
    if (a && APP) { e.preventDefault(); return glitchCard(a); }
    if (a && !e.metaKey && !e.ctrlKey) { e.preventDefault(); play('needle'); navigate(a.href); }
  });

  // Cartes : légère inclinaison + reflet qui suit la souris (lisible, jamais déformée).
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest?.('.card[href]');
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);
    c.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
    c.style.setProperty('--mx', `${px * 100}%`);
    c.style.setProperty('--my', `${py * 100}%`);
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const c = e.target.closest?.('.card[href]');
    if (c && !c.contains(e.relatedTarget)) ['--rx', '--ry'].forEach((p) => c.style.setProperty(p, '0deg'));
  });
}

/* ------------------------------------------------------------------ */
/* Hero : entrée + hyène 3D                                             */
/* ------------------------------------------------------------------ */
function introLeft(delay = 0) {
  if (REDUCE) return;
  const tl = gsap.timeline({ delay })
    .from('.who-hy', { scale: 0.7, opacity: 0, duration: 1, ease: 'expo.out' }, 0)
    .from('.who-name .line-in', { yPercent: 115, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, 0.1)
    .from(['.who-x', '.who-co-logo', '.who-us', '.who-real', '.who-legal', '.who-role', '.who-line', '.who-actions', '.pull-head', '.bar', '#hdr > *'], { y: 16, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out' }, 0.25);
  if ($('.who-line em')) tl.fromTo('.who-line em', { '--hl': '0%' }, { '--hl': '100%', duration: 0.6, stagger: 0.25, ease: 'power2.inOut' }, 0.8);
}
/* ------------------------------------------------------------------ */
/* Le booster (1re visite de la session, puis sur demande)             */
/* ------------------------------------------------------------------ */
const BOOSTER_KEY = APP ? `edy-booster-${APP.slug}` : 'edy-booster'; // chaque candidature ouvre son propre paquet
const seen = () => { try { return sessionStorage.getItem(BOOSTER_KEY) === '1'; } catch { return false; } };
const markSeen = () => { try { sessionStorage.setItem(BOOSTER_KEY, '1'); } catch { /* rien */ } };

async function showBooster(again = false) {
  const el = document.createElement('div');
  el.className = 'booster';
  el.innerHTML = `
    <div class="booster-stage" role="button" tabindex="0" aria-label="${t('booster.hint')}"><img class="booster-img" src="${asset(APP?.booster?.front || '3d/pack-front.webp')}" alt=""></div>
    <p class="booster-hint mono">${t('booster.hint')}</p>
    <button type="button" class="booster-skip mono" data-sound>${t('booster.skip')}</button>`;
  document.body.append(el);
  const stage = $('.booster-stage', el);
  let api = null;
  const close = (origin) => {
    markSeen();
    if (again) { pull = draw(pull); renderPull(); }
    gsap.set('.slot', { opacity: 0 });
    gsap.to(el, { opacity: 0, duration: 0.6, delay: 0.5, ease: 'power2.out', onComplete: () => el.remove() });
    deal(origin || { x: innerWidth / 2, y: innerHeight / 2 }, { delay: 0.15 });
    if (!again) introLeft(0.2);
  };
  const fallback = () => el.classList.add('is-ready'); // sans WebGL : le booster reste en image
  if (REDUCE) fallback();
  else {
    try {
      const { mountBooster } = await import('./scenes3d.js');
      api = await mountBooster(stage, {
        root: ROOT,
        ...(APP?.booster?.glb ? { glb: APP.booster.glb } : {}),
        onTear: (step, origin) => { if (step === 'tear') play('tear'); else close(origin); },
      });
      el.classList.add('is-ready', 'has-3d');
    } catch { fallback(); }
  }
  const openIt = () => {
    el.classList.add('is-opening');
    if (api) api.open();
    else { play('tear'); const r = stage.getBoundingClientRect(); close({ x: r.left + r.width / 2, y: r.top + r.height * 0.2 }); }
  };
  stage.addEventListener('click', openIt, { once: true });
  stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIt(); } });
  $('.booster-skip', el).addEventListener('click', () => { el.classList.add('is-opening'); close(); }, { once: true });
  stage.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ */
/* Le rire de la hyène : sélectionner du texte du bloc de gauche le      */
/* change en « hihihi », la sélection passe au rouge sang et le sang     */
/* coule sous les mots (Johan, 06/11). Tout revient à la désélection.    */
/* ------------------------------------------------------------------ */
const LAUGH_ZONES = '.who-name, .who-role, .who-line';
// Chaque lettre devient h ou i en alternance (majuscule gardée), espaces et ponctuation restent : la ligne ne saute pas.
const laughify = (s) => { let k = 0; return s.replace(/\p{L}/gu, (ch) => { const c = k++ % 2 ? 'i' : 'h'; return ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? c.toUpperCase() : c; }); };
function bindLaugh() {
  let spans = [], busy = false;
  const restore = () => {
    const parents = new Set();
    spans.forEach((s) => { if (!s.isConnected) return; parents.add(s.parentNode); s.replaceWith(document.createTextNode(s.dataset.orig)); });
    parents.forEach((p) => p.normalize());
    spans = [];
  };
  const drips = (span) => {
    const n = Math.max(1, Math.round(span.getBoundingClientRect().width / 46));
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.className = 'drip'; d.setAttribute('aria-hidden', 'true');
      d.style.cssText = `left:${(8 + Math.random() * 84).toFixed(1)}%;--h:${(10 + Math.random() * 34).toFixed(0)}px;--w:${(3 + Math.random() * 3).toFixed(1)}px;animation-delay:${(Math.random() * 0.35).toFixed(2)}s`;
      span.append(d);
    }
  };
  // On rit une fois la sélection finie (bouton relâché, ou une courte pause au clavier / au doigt) : pendant un glisser,
  // la sélection grandit lettre à lettre et le rire ne prenait que les premières.
  let down = false, timer;
  addEventListener('pointerdown', () => { down = true; }, true);
  addEventListener('pointerup', () => { down = false; clearTimeout(timer); timer = setTimeout(apply, 30); }, true);
  document.addEventListener('selectionchange', () => {
    if (busy) return;
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { if (spans.length) restore(); return; }
    if (spans.length) { restore(); } // la sélection a bougé : on rend le texte, on rira sur la nouvelle
    clearTimeout(timer);
    if (!down) timer = setTimeout(apply, 260);
  });
  function apply() {
    if (busy || spans.length) return;
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    const host = $('.who');
    if (!host || !host.contains(r.commonAncestorContainer)) return;
    const base = r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentNode : r.commonAncestorContainer;
    const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) { const t = walker.currentNode; if (r.intersectsNode(t) && t.parentElement.closest(LAUGH_ZONES) && t.data.trim()) nodes.push(t); }
    if (!nodes.length) return;
    busy = true;
    nodes.forEach((t) => {
      const start = t === r.startContainer ? r.startOffset : 0, end = t === r.endContainer ? r.endOffset : t.length;
      if (end <= start) return;
      const mid = start > 0 ? t.splitText(start) : t;
      if (end - start < mid.length) mid.splitText(end - start);
      if (!mid.data.trim()) return;
      const span = document.createElement('span');
      span.className = 'laugh'; span.dataset.orig = mid.data; span.textContent = laughify(mid.data);
      mid.replaceWith(span); spans.push(span); drips(span);
    });
    if (spans.length) {
      const nr = document.createRange(); nr.setStartBefore(spans[0]); nr.setEndAfter(spans[spans.length - 1]);
      sel.removeAllRanges(); sel.addRange(nr);
      play('laugh');
    }
    requestAnimationFrame(() => { busy = false; });
  }
}

/* ------------------------------------------------------------------ */
boot();
mountReality({ t });
render();
bindInteractions();
bindLaugh();
onLang(() => { render(); });

const fromCurtain = curtainIn();
if (!seen() && !fromCurtain && !location.hash) {
  gsap.set(['.slot', '.who > *', '.pull-head', '.bar'], { opacity: 0 });
  showBooster().then(() => gsap.set(['.who > *', '.pull-head', '.bar'], { clearProps: 'opacity' }));
} else {
  markSeen();
  introLeft(fromCurtain ? 0.3 : 0.05);
  if (!REDUCE) {
    const g = $('.pull-grid').getBoundingClientRect();
    deal({ x: g.left + g.width / 2, y: g.top - 40 }, { delay: fromCurtain ? 0.35 : 0.15 });
  }
}
document.fonts?.ready.then(() => ScrollTrigger.refresh());
