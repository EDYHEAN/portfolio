// Blocs des pages projet. Chaque bloc = render (HTML) + motion (dans un gsap.matchMedia).
// Motion minimaliste : les visuels parlent, le mouvement guide la lecture.
import { gsap, ScrollTrigger, $, $$, t, tx, asset, spawn, revealTitle, countUp, REDUCE, ROOT, lenis } from './core.js';

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

// Un prototype live, une fois chargé (même origine seulement : sinon on n'y touche pas) :
// - sans barre de défilement : dans un cadre réduit, elle mangeait la largeur et faisait « fenêtre Windows » ;
// - la molette : la page ne l'entend pas (Lenis écoute sa fenêtre, pas celle de l'iframe). Quand le prototype ne peut plus
//   défiler dans ce sens (un jeu plein écran, ou le bas de sa page), on la passe à la page, comme le ferait un navigateur.
//   Seulement si le prototype ne l'a pas prise pour lui (zoom 3D, défilement maison : preventDefault).
function tameFrame(frame) {
  frame.addEventListener('load', () => {
    let w;
    try { w = frame.contentWindow; if (!w.document.body) return; } catch { return; }
    const st = w.document.createElement('style');
    st.textContent = 'html,body{scrollbar-width:none}::-webkit-scrollbar{display:none}';
    w.document.head.append(st);
    const canScroll = (n, dy) => (dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0);
    w.addEventListener('wheel', (e) => {
      if (e.defaultPrevented || e.ctrlKey || !e.deltaY) return;
      for (let n = e.target; n && n.nodeType === 1 && n !== w.document.documentElement; n = n.parentElement) {
        if (/(auto|scroll)/.test(w.getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 1 && canScroll(n, e.deltaY)) return;
      }
      if (canScroll(w.document.scrollingElement, e.deltaY)) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (lenis) lenis.scrollTo(lenis.targetScroll + dy); else scrollBy(0, dy);
    }, { passive: true });
  });
}

// L'indice sous un prototype live : celui de l'onglet (on ne scrolle pas un jeu, on le clique), sinon celui du bloc.
const liveHint = (it, b) => tx(it.hint || b.hint || { fr: 'Scrolle dans le cadre : c’est le vrai prototype.', en: 'Scroll inside the frame: it’s the real prototype.' });

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

  /* Pages : les captures pleine page dans un navigateur (+ le mobile). Plus d'épinglage (Johan, 07/11 : devoir dérouler
     toute la capture pour voir la suite était frustrant) : la molette sur un cadre fait défiler la capture dedans, partout
     ailleurs elle fait défiler la page. On change de page au clic dans la liste. */
  pages: {
    render(b, p, n) {
      const shots = b.pages.map((pg, i) => img(pg.src, { cls: `pg-shot${i ? '' : ' is-on'}`, eager: i === 0, alt: tx(pg.label) })).join('');
      return `
        ${head('b.pages', n)}
        <div class="pg">
          <div class="pg-sticky">
            <div class="pg-main">${browser(shots, b.pages[0].url)}</div>
            <aside class="pg-side">
              <ol class="pg-list">${b.pages.map((pg, i) => `<li><button type="button" class="${i ? '' : 'is-on'}" data-pg="${i}" data-sound><span class="mono">${String(i + 1).padStart(2, '0')}</span>${tx(pg.label)}</button></li>`).join('')}</ol>
              ${b.mobile ? `<div class="phone"><div class="phone-view" data-lenis-prevent>${img(b.mobile, { cls: 'pg-phone-shot' })}</div></div>` : ''}
              <p class="mono pg-hint">${tx({ fr: 'Scrolle dans le cadre pour parcourir la page.', en: 'Scroll inside the frame to browse the page.' })}</p>
            </aside>
          </div>
        </div>`;
    },
    motion(el, b) {
      // Le cadre défile en natif (data-lenis-prevent : Lenis laisse la molette au cadre) ; arrivé au bout, la page reprend.
      const view = $('.browser-view', el);
      view.setAttribute('data-lenis-prevent', '');
      const shots = $$('.pg-shot', el);
      const url = $('.browser-url', el);
      $$('[data-pg]', el).forEach((btn) => btn.addEventListener('click', () => {
        const i = +btn.dataset.pg;
        $$('[data-pg]', el).forEach((x) => x.classList.toggle('is-on', x === btn));
        shots.forEach((s, j) => s.classList.toggle('is-on', j === i));
        url.textContent = b.pages[i].url;
        view.scrollTop = 0;
        gsap.fromTo(shots[i], { opacity: 0 }, { opacity: 1, duration: 0.4 });
      }));
      spawn([$('.pg-sticky', el)], el, { y: 60 });
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

  /* Live : les vrais prototypes, dans un cadre navigateur (rendus en 1440 px puis réduits) et un mobile à côté.
     Plusieurs prototypes : des onglets en cartes (numéro, nom, une ligne `sum`). Les iframes ne se chargent qu'en approchant
     du bloc, derrière un voile « chargement » qui ne se lève que quand le prototype tourne fluide (pas de lag visible).
     Lien « ouvrir dans un onglet ». Au téléphone : le mobile seul.
     item.mobile = false : pas de mobile au bureau, le navigateur prend toute la largeur (la Visite). */
  live: {
    render(b, p, n) {
      const k = b.items.length;
      const tabs = k > 1 ? `<div class="live-tabs" role="tablist" style="--k:${k}">${b.items.map((it, i) => `
        <button type="button" role="tab" class="live-tab" aria-selected="${!i}" data-live="${i}" data-sound>
          <span class="mono live-tab-n">${String(i + 1).padStart(2, '0')} / ${String(k).padStart(2, '0')}</span>
          <b>${tx(it.label)}</b>${it.sum ? `<span class="live-tab-s">${tx(it.sum)}</span>` : ''}
        </button>`).join('')}</div>` : '';
      const first = b.items[0];
      const wait = `<div class="live-wait" aria-hidden="true"><span class="live-spin"></span><span class="mono">${tx({ fr: 'Chargement du prototype', en: 'Loading the prototype' })}</span></div>`;
      return `${head(b.title || 'b.pages', n)}
        <div class="live">
          ${tabs}
          <div class="live-stage${first.mobile === false ? ' is-solo' : ''}">
            <div class="browser live-desk">
              <div class="browser-bar"><i></i><i></i><i></i><span class="browser-url mono">${tx(first.url)}</span>
                <a class="live-open mono" href="${asset(first.src)}" target="_blank" rel="noopener" data-sound>${tx({ fr: 'Ouvrir dans un onglet', en: 'Open in a new tab' })} <span aria-hidden="true">↗</span></a></div>
              <div class="browser-view"><iframe class="live-frame" data-src="${asset(first.src)}" title="${tx(first.label)}" loading="lazy"></iframe>${wait}</div>
            </div>
            <div class="phone live-phone"><div class="phone-view"><iframe class="live-frame-m" data-src="${asset(first.src)}" title="${tx(first.label)} (mobile)" loading="lazy"></iframe>${wait}</div></div>
          </div>
          <p class="mono live-hint">${liveHint(first, b)}</p>
        </div>`;
    },
    motion(el, b) {
      const desk = $('.live-frame', el), mob = $('.live-frame-m', el), view = $('.live-desk .browser-view', el), pview = $('.live-phone .phone-view', el);
      // Le site est rendu à sa vraie largeur (1440 / 390 px), puis réduit au cadre : il se comporte comme sur un vrai écran.
      const fit = () => { // un cadre masqué (largeur 0) garde sa dernière échelle
        const k = view.clientWidth / 1440;
        if (k) Object.assign(desk.style, { width: '1440px', height: `${view.clientHeight / k}px`, transform: `scale(${k})` });
        const km = pview.clientWidth / 390;
        if (km) Object.assign(mob.style, { width: '390px', height: `${pview.clientHeight / km}px`, transform: `scale(${km})` });
      };
      [desk, mob].forEach(tameFrame);
      // Le voile : posé à chaque nouveau chargement, levé quand le prototype enchaîne ~0,4 s d'images fluides (< 34 ms),
      // ou au bout de 6 s quoi qu'il arrive.
      [desk, mob].forEach((f) => {
        const cover = f.parentElement.querySelector('.live-wait');
        let run = 0;
        f.addEventListener('load', () => {
          const id = run;
          if (!f.getAttribute('src') || f.getAttribute('src') === 'about:blank') return;
          let w; try { w = f.contentWindow; w.document; } catch { cover.classList.add('is-ready'); return; }
          let last = 0, good = 0;
          const done = () => { if (id === run) cover.classList.add('is-ready'); };
          setTimeout(done, 6000);
          const tick = (t) => {
            if (id !== run) return;
            if (last) good = t - last < 34 ? good + 1 : 0;
            last = t;
            if (good >= 24) done(); else w.requestAnimationFrame(tick);
          };
          w.requestAnimationFrame(tick);
        });
        f._wait = () => { run++; cover.classList.remove('is-ready'); };
      });
      // Chargées à l'approche, déchargées (about:blank) quand on s'éloigne : deux sites complets (Lenis, GSAP, vidéos) ne
      // tournent pas en fond pendant qu'on lit le reste de la page. Seuls les cadres affichés se chargent (au téléphone :
      // le mobile ; au bureau, sans le mobile pour un onglet `mobile: false`).
      const shown = (f) => f.offsetParent !== null;
      const blank = (f) => { if (f.getAttribute('src') && f.getAttribute('src') !== 'about:blank') f.src = 'about:blank'; };
      let near = false;
      const sync = () => [desk, mob].forEach((f) => {
        if (near && shown(f)) { if (f.getAttribute('src') !== f.dataset.src) { f._wait(); f.src = f.dataset.src; } } else blank(f);
      });
      new IntersectionObserver(([e]) => { near = e.isIntersecting; sync(); }, { rootMargin: '100% 0px' }).observe(el);
      fit();
      const ro = new ResizeObserver(() => { fit(); sync(); }); ro.observe(view); ro.observe(pview);
      $$('[data-live]', el).forEach((t) => t.addEventListener('click', () => {
        const it = b.items[+t.dataset.live];
        $$('[data-live]', el).forEach((x) => x.setAttribute('aria-selected', String(x === t)));
        $('.browser-url', el).textContent = tx(it.url);
        $('.live-open', el).href = asset(it.src);
        $('.live-hint', el).textContent = liveHint(it, b);
        $('.live-stage', el).classList.toggle('is-solo', it.mobile === false);
        [desk, mob].forEach((f) => { f.dataset.src = asset(it.src); });
        sync();
      }));
      spawn([$('.live-stage', el)], el, { y: 60 });
    },
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
      return `${head(b.title || 'b.features', n)}
        <div class="bento ft-bento">${b.items.map((f) => `
          <article class="b-tile ft ft-${f.size || 's'}">
            <div class="ft-img"${f.model ? ` data-model="${asset(f.model)}"` : ''}>${img(f.img, { alt: '', style: `object-fit:${f.fit || 'cover'};object-position:${f.pos || 'top'}` })}</div>
            <div class="ft-txt"><h3>${tx(f.t)}</h3><p>${tx(f.d)}</p></div>
          </article>`).join('')}
        </div>`;
    },
    motion(el) {
      spawn($$('.ft', el), $('.bento', el));
      // Les tuiles à modèle 3D (item.model) : three.js n'est chargé qu'à l'approche du bloc ; l'affiche reste sinon.
      const models = $$('.ft-img[data-model]', el);
      if (!models.length || REDUCE) return;
      new IntersectionObserver(([e], o) => {
        if (!e.isIntersecting) return;
        o.disconnect();
        import('./feature3d.js').then(({ mountFeatures }) => mountFeatures(models, { root: ROOT })).catch(() => {});
      }, { rootMargin: '100% 0px' }).observe(el);
    },
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
