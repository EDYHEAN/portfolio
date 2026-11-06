// Blocs des pages projet. Chaque bloc = render (HTML) + motion (dans un gsap.matchMedia).
// Motion minimaliste : les visuels parlent, le mouvement guide la lecture.
import { gsap, $, $$, t, tx, asset, spawn, revealTitle, countUp } from './core.js';

const img = (src, { cls = '', alt = '', eager = false, style = '' } = {}) =>
  `<img src="${asset(src)}" alt="${alt}" class="${cls}" ${eager ? '' : 'loading="lazy"'} decoding="async" ${style ? `style="${style}"` : ''}>`;

// key : la clé i18n du titre générique, ou un texte {fr, en} propre au bloc (b.title).
const head = (key, n, note) => `
  <header class="blk-head">
    <span class="mono blk-n">${String(n).padStart(2, '0')}</span>
    <h2 class="blk-title">${typeof key === 'string' ? t(key) : tx(key)}</h2>
    ${note ? `<p class="blk-note">${tx(note)}</p>` : ''}
  </header>`;

const browser = (inner, url) => `
  <div class="browser">
    <div class="browser-bar"><i></i><i></i><i></i><span class="browser-url mono">${url || ''}</span></div>
    <div class="browser-view">${inner}</div>
  </div>`;

/* ------------------------------------------------------------------ */
export const BLOCKS = {
  identity: {
    render(b, p, n) {
      const logoBg = b.logoSurface || p.colors.bg;
      const signs = b.signs ? b.signs.map((s) => `
        <div class="b-tile b-sign">
          <div class="b-sign-img">${img(s.src, { alt: s.name })}</div>
          <b>${s.name}</b><span class="b-sign-role">${tx(s.role)}</span><p>${tx(s.d)}</p>
        </div>`).join('') : `
        <div class="b-tile b-logo" style="background:${logoBg}">${img(p.logo.src, { alt: p.name, cls: p.logo.invert ? 'inv' : '' })}</div>
        ${b.alt ? `<div class="b-tile b-logo-alt" style="background:${b.alt.bg}">${img(b.alt.src || p.logo.src, { alt: '', cls: (b.alt.invert ?? (b.alt.src ? false : p.logo.invert)) ? 'inv' : '' })}</div>` : ''}`;
      const palette = `
        <div class="b-tile b-palette">
          <span class="mono b-label">${t('b.palette')}</span>
          <div class="sw-row">${b.palette.map((s) => `<div class="sw" style="--c:${s.c}"><span class="sw-chip"></span><b>${tx(s.n)}</b><code>${s.c}</code></div>`).join('')}</div>
        </div>`;
      const fonts = b.fonts.map((f) => `
        <div class="b-tile b-font">
          <span class="mono b-label">${t('b.type')}</span>
          <span class="font-aa" style="font-family:'${f.family}';font-weight:${f.weight || 400};font-style:${f.italic ? 'italic' : 'normal'};--fs:${f.size || 1}">${f.upper ? 'AA' : 'Aa'}</span>
          <b style="font-family:'${f.family}';font-weight:${f.weight || 400};font-style:${f.italic ? 'italic' : 'normal'}">${f.family}</b>
          <span>${tx(f.role)}</span>
        </div>`).join('');
      return `${head('b.identity', n, b.note)}<div class="bento id-bento${b.signs ? ' has-signs' : ''}">${signs}${palette}${fonts}</div>`;
    },
    motion(el) { spawn($$('.b-tile', el), $('.bento', el)); },
  },

  /* Captures pleine page qui défilent dans un navigateur, la page reste à l'écran (sticky). */
  pages: {
    render(b, p, n) {
      const shots = b.pages.map((pg, i) => img(pg.src, { cls: 'pg-shot', eager: i === 0, alt: tx(pg.label) })).join('');
      return `
        ${head('b.pages', n)}
        <div class="pg" style="--n:${b.pages.length}">
          <div class="pg-sticky">
            <div class="pg-main">${browser(shots, b.pages[0].url)}</div>
            <aside class="pg-side">
              <ol class="pg-list">${b.pages.map((pg, i) => `<li class="${i ? '' : 'is-on'}"><span class="mono">${String(i + 1).padStart(2, '0')}</span>${tx(pg.label)}</li>`).join('')}</ol>
              ${b.mobile ? `<div class="phone"><div class="phone-view">${img(b.mobile, { cls: 'pg-phone-shot' })}</div></div>` : ''}
            </aside>
          </div>
        </div>`;
    },
    motion(el, b) {
      const view = $('.browser-view', el);
      const shots = $$('.pg-shot', el);
      const items = $$('.pg-list li', el);
      const url = $('.browser-url', el);
      const phone = $('.pg-phone-shot', el);
      const phoneView = $('.phone-view', el);
      const n = shots.length;
      gsap.set(shots, { opacity: (i) => (i ? 0 : 1) });
      let current = 0;
      const setActive = (i) => {
        if (i === current) return;
        current = i;
        items.forEach((li, j) => li.classList.toggle('is-on', j === i));
        url.textContent = b.pages[i].url;
      };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: $('.pg', el), start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (s) => setActive(Math.min(n - 1, Math.floor(s.progress * n))),
        },
      });
      shots.forEach((s, i) => {
        if (i) tl.to(shots[i - 1], { opacity: 0, duration: 0.06 }, i).to(s, { opacity: 1, duration: 0.06 }, i);
        tl.fromTo(s, { y: 0 }, { y: () => -Math.max(0, s.offsetHeight - view.clientHeight), duration: 0.94 }, i + 0.03);
      });
      if (phone) tl.fromTo(phone, { y: 0 }, { y: () => -Math.max(0, phone.offsetHeight - phoneView.clientHeight), duration: n }, 0);
    },
  },

  /* Écrans d'app fixes (pas de longue page) : trois navigateurs côte à côte. */
  screens: {
    render(b, p, n) {
      return `${head('b.screens', n)}
        <div class="screens">${b.items.map((s) => `<figure class="screen">${browser(img(s.src, { alt: tx(s.label) }), s.url)}<figcaption class="mono">${tx(s.label)}</figcaption></figure>`).join('')}</div>`;
    },
    motion(el) { spawn($$('.screen', el), $('.screens', el), { stagger: 0.12 }); },
  },

  /* Vitrine : les écrans en grand, entiers (pas de recadrage), dans un navigateur, une légende chacun.
     size : full (toute la largeur) ou half (deux par ligne). Pour un outil dont l'image fait tout (NookDex). */
  showcase: {
    render(b, p, n) {
      return `${head(b.title || 'b.features', n)}
        <div class="shw">${b.items.map((f, i) => `
          <figure class="shw-item shw-${f.size || 'full'}">
            ${browser(f.video
              ? `<video class="shw-video${f.pixel ? ' pix' : ''}" src="${asset(f.video)}" poster="${asset(f.img)}" muted loop playsinline autoplay preload="metadata" aria-label="${tx(f.t)}"></video>`
              : img(f.img, { alt: tx(f.t), cls: f.pixel ? 'pix' : '' }), f.url || '')}
            <figcaption class="shw-cap">
              <span class="mono shw-n">${String(i + 1).padStart(2, '0')}</span>
              <h3>${tx(f.t)}</h3>
              <p>${tx(f.d)}</p>
            </figcaption>
          </figure>`).join('')}
        </div>`;
    },
    motion(el) {
      spawn($$('.shw-item', el), $('.shw', el), { stagger: 0.12 });
      // Les vidéos (autoplay, muettes) se mettent en pause hors écran.
      $$('.shw-video', el).forEach((v) => {
        new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.1 }).observe(v);
      });
    },
  },

  features: {
    render(b, p, n) {
      return `${head('b.features', n)}
        <div class="bento ft-bento">${b.items.map((f) => `
          <article class="b-tile ft ft-${f.size || 's'}">
            <div class="ft-img">${img(f.img, { alt: '', style: `object-fit:${f.fit || 'cover'};object-position:${f.pos || 'top'}` })}</div>
            <div class="ft-txt"><h3>${tx(f.t)}</h3><p>${tx(f.d)}</p></div>
          </article>`).join('')}
        </div>`;
    },
    motion(el) { spawn($$('.ft', el), $('.bento', el)); },
  },

  /* Écosystème : le projet au centre, ses services autour, puis ce qui tourne tout seul. */
  stack: {
    render(b, p, n) {
      const k = b.nodes.length;
      const pos = b.nodes.map((_, i) => {
        const a = (-90 + (i * 360) / k) * (Math.PI / 180);
        return { x: 50 + Math.cos(a) * 38, y: 50 + Math.sin(a) * 38 };
      });
      return `${head('b.stack', n)}
        <div class="stk">
          <div class="stk-map">
            <svg class="stk-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              ${pos.map((q) => `<line x1="50" y1="50" x2="${q.x.toFixed(2)}" y2="${q.y.toFixed(2)}" pathLength="1" vector-effect="non-scaling-stroke"/>`).join('')}
            </svg>
            <div class="stk-core" style="background:${p.colors.bg}">${img(p.logo.src, { alt: p.name, cls: p.logo.invert ? 'inv' : '' })}</div>
            ${b.nodes.map((nd, i) => `<div class="stk-node" style="left:${pos[i].x.toFixed(2)}%;top:${pos[i].y.toFixed(2)}%"><b>${nd.name}</b><span>${tx(nd.d)}</span></div>`).join('')}
          </div>
          <div class="stk-autos">
            <p class="mono b-label">${t('b.autos')}</p>
            <ul>${b.autos.map((a) => `<li><span class="mono">${tx(a.when)}</span><p>${tx(a.d)}</p></li>`).join('')}</ul>
          </div>
        </div>`;
    },
    motion(el) {
      const st = { trigger: $('.stk', el), start: 'top 75%' };
      gsap.timeline({ scrollTrigger: st })
        .from($('.stk-core', el), { scale: 0.4, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' })
        .fromTo($$('.stk-lines line', el), { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.06, ease: 'power2.out' }, 0.25)
        .from($$('.stk-node', el), { scale: 0.6, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'back.out(1.8)' }, 0.5)
        .from($$('.stk-autos li', el), { x: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, 0.7);
    },
  },

  /* Déclinaisons en défilement horizontal (desktop), en pile (mobile). */
  slides: {
    render(b, p, n) {
      return `
        <div class="sl-pin">
          ${head(b.title || 'b.slides', n)}
          <div class="sl-track">${b.items.map((s) => `<figure class="slide">${img(s.src, { alt: tx(s.t), eager: true })}<figcaption class="mono">${tx(s.t)}</figcaption></figure>`).join('')}</div>
        </div>`;
    },
    motion(el, b, p, { desktop }) {
      const track = $('.sl-track', el);
      if (!desktop) { spawn($$('.slide', el), track, { stagger: 0.06, y: 50 }); return; }
      // La piste arrive au bout à 85 % de la course : la dernière slide reste un temps entière à l'écran avant que la
      // section se libère (sans cette marge, le lissage la laissait coupée à droite au moment de la sortie).
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.timeline({ scrollTrigger: { trigger: $('.sl-pin', el), start: 'top top', end: () => `+=${dist() / 0.85}`, pin: true, scrub: 0.4, invalidateOnRefresh: true } })
        .to(track, { x: () => -dist(), ease: 'none', duration: 0.85 })
        .to({}, { duration: 0.15 });
    },
  },

  outcome: {
    render(b, p, n) {
      return `${head('b.outcome', n)}
        <div class="out-row">${b.stats.map((s) => `
          <div class="out-stat">
            <span class="out-num" data-count="${s.v}" data-suffix="${s.suffix || ''}" ${s.sep ? 'data-sep="1"' : ''}>0</span>
            <span class="out-lbl">${tx(s.l)}</span>
          </div>`).join('')}
        </div>
        ${p.url ? `<a class="btn btn-accent" href="${p.url}" target="_blank" rel="noopener" data-magnetic data-cursor data-cursor-key="cursor.go"><span>${t('p.visit')}</span><span aria-hidden="true">↗</span></a>` : ''}`;
    },
    motion(el) {
      spawn($$('.out-stat', el), $('.out-row', el), { stagger: 0.1, y: 40 });
      countUp(el);
    },
  },
};

export { revealTitle };
