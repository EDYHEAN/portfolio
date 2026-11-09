// Blocs des pages projet. Chaque bloc = render (HTML) + motion (dans un gsap.matchMedia).
// Motion minimaliste : les visuels parlent, le mouvement guide la lecture.
import { gsap, ScrollTrigger, $, $$, t, tx, asset, spawn, revealTitle, countUp, formatCount, REDUCE, ROOT, lenis, MOBILE } from './core.js';
import { heroStep } from './heroSnap.js';
import './viewer.js';

const img = (src, { cls = '', alt = '', eager = false, style = '' } = {}) =>
  `<img src="${asset(src)}" alt="${alt}" class="${cls}" ${eager ? '' : 'loading="lazy"'} decoding="async" ${style ? `style="${style}"` : ''}>`;

// key : la clé i18n du titre générique, ou un texte {fr, en} propre au bloc (b.title).
const head = (key, n, note) => `
  <header class="blk-head">
    <span class="mono blk-n">${String(n).padStart(2, '0')}</span>
    <h2 class="blk-title">${typeof key === 'string' ? t(key) : tx(key)}</h2>
    ${note ? `<p class="blk-note">${tx(note)}</p>` : ''}
  </header>`;

// Le petit bouton « agrandir » d'un cadre (visible au tactile seulement, voir viewer.js).
const zoomBtn = () => `<button type="button" class="zm-btn" data-sound aria-label="${tx({ fr: 'Agrandir', en: 'Enlarge' })}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;

// zoom : 'wide' ou 'phone', le cadre s'ouvre en grand au doigt (viewer.js).
const browser = (inner, url, zoom) => `
  <div class="browser">
    <div class="browser-bar"><i></i><i></i><i></i><span class="browser-url mono">${url || ''}</span></div>
    <div class="browser-view"${zoom ? ` data-zoom="${zoom}"` : ''}>${inner}${zoom ? zoomBtn() : ''}</div>
  </div>`;

// Une rangée de puces qui défile au doigt : la puce choisie revient au milieu. Sans effet quand tout tient (bureau).
const centerChip = (btn) => {
  const rail = btn.closest('.pg-list, .var-tabs'), r = rail.getBoundingClientRect(), b = btn.getBoundingClientRect();
  rail.scrollBy({ left: b.left + b.width / 2 - (r.left + r.width / 2), behavior: REDUCE ? 'auto' : 'smooth' });
};

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
      if (heroStep(dy)) return;
      if (lenis) lenis.scrollTo(lenis.targetScroll + dy); else scrollBy(0, dy);
    }, { passive: true });
  });
}

// L'indice sous un prototype live : celui de l'onglet (on ne scrolle pas un jeu, on le clique), sinon celui du bloc.
const liveHint = (it, b) => tx(it.hint || b.hint || { fr: 'Scrolle dans le cadre : c’est le vrai prototype.', en: 'Scroll inside the frame: it’s the real prototype.' });

// Au téléphone et à la tablette : rien d'interactif dans les cadres. Pas de prototype (ils font planter l'onglet, Johan 09/11),
// et aucune capture qui bouge avec le scroll de la page : les visuels sont fixes, un tap les ouvre en grand (viewer.js).
const STILL = '(max-width: 860px), (pointer: coarse)';
// Le téléphone (debout ou couché) : on y retire les maquettes de bureau, sauf s'il n'y a rien d'autre à montrer.
const PHONE = '(max-width: 599px), (max-height: 500px)';
// b.titleStill : le titre quand le bloc est montré en images (« Trois prototypes, en vrai » n'y serait plus vrai).
const blockTitle = (b) => (matchMedia(STILL).matches && b.titleStill) || b.title;

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
     ailleurs elle fait défiler la page. On change de page au clic dans la liste.
     Au doigt : un cadre qui défile piégerait le pouce. Le cadre reste fixe, sur le haut de la capture, et un toucher l'ouvre en
     grand (viewer.js). Au téléphone, il ne reste que la maquette mobile : c'est elle qui se lit à cette taille. */
  pages: {
    render(b, p, n) {
      const phoneFirst = matchMedia(MOBILE).matches; // au téléphone, la longue capture de bureau n'est plus la première image à charger
      const shots = b.pages.map((pg, i) => img(pg.src, { cls: `pg-shot${i ? '' : ' is-on'}`, eager: i === 0 && !phoneFirst, alt: tx(pg.label) })).join('');
      return `
        ${head(b.title || 'b.pages', n)}
        <div class="pg">
          <div class="pg-sticky">
            <div class="pg-main">${browser(shots, b.pages[0].url, 'wide')}</div>
            <aside class="pg-side">
              <ol class="pg-list">${b.pages.map((pg, i) => `<li><button type="button" class="${i ? '' : 'is-on'}" data-pg="${i}" data-sound><span class="mono">${String(i + 1).padStart(2, '0')}</span>${tx(pg.label)}</button></li>`).join('')}</ol>
              ${b.mobile ? `<div class="phone"><div class="phone-view" data-lenis-prevent data-zoom="phone">${img(b.mobile, { cls: 'pg-phone-shot', alt: `${p.name} · mobile` })}${zoomBtn()}</div></div>` : ''}
              <p class="mono pg-hint"><span class="pg-h-desk">${tx({ fr: 'Scrolle dans le cadre pour parcourir la page.', en: 'Scroll inside the frame to browse the page.' })}</span><span class="pg-h-touch">${tx({ fr: 'Touche la capture pour l’agrandir.', en: 'Tap the capture to enlarge it.' })}</span></p>
            </aside>
          </div>
        </div>`;
    },
    // Les interactions, posées une seule fois et même sans animation (prefers-reduced-motion).
    bind(el, b) {
      const view = $('.browser-view', el), shots = $$('.pg-shot', el), url = $('.browser-url', el);
      $$('[data-pg]', el).forEach((btn) => btn.addEventListener('click', () => {
        const i = +btn.dataset.pg;
        $$('[data-pg]', el).forEach((x) => x.classList.toggle('is-on', x === btn));
        shots.forEach((s, j) => s.classList.toggle('is-on', j === i));
        url.textContent = b.pages[i].url;
        view.scrollTop = 0;
        centerChip(btn);
        if (!REDUCE) gsap.fromTo(shots[i], { opacity: 0 }, { opacity: 1, duration: 0.4 });
      }));
    },
    motion(el) {
      const still = matchMedia(STILL).matches;
      $('.pg', el).classList.toggle('is-still', still);
      // À la souris, le cadre défile en natif (data-lenis-prevent : Lenis laisse la molette au cadre) ; arrivé au bout, la page reprend.
      [$('.browser-view', el), $('.phone-view', el)].forEach((f) => f?.toggleAttribute('data-lenis-prevent', !still));
      spawn([$('.pg-sticky', el)], el, { y: 60 });
    },
  },

  /* Écrans d'app fixes (pas de longue page) : trois navigateurs côte à côte. */
  screens: {
    render(b, p, n) {
      return `${head('b.screens', n)}
        <div class="screens">${b.items.map((s) => `<figure class="screen">${browser(img(s.src, { alt: tx(s.label) }), s.url, 'wide')}<figcaption class="mono">${tx(s.label)}</figcaption></figure>`).join('')}</div>`;
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
      return `${head(blockTitle(b) || 'b.pages', n)}
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
          <div class="live-reel">${b.items.map((it, i) => `
            <figure class="live-card">
              <span class="live-card-ph">${it.poster ? img(it.poster, { alt: tx(it.label) }) : ''}</span>
              <span class="live-card-t"><b>${tx(it.label)}</b>${it.sum ? `<span>${tx(it.sum)}</span>` : ''}</span>
            </figure>`).join('')}
          </div>
        </div>`;
    },
    motion(el, b) {
      if (matchMedia(STILL).matches) { spawn($$('.live-card', el), $('.live-reel', el), { y: 50, stagger: 0.1 }); return; } // des images : aucune iframe ne se charge
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
          const done = () => { if (id === run && !cover.classList.contains('is-ready')) { cover.classList.add('is-ready'); sync(); } };
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
      // Chargés à l'approche, puis jamais déchargés en scrollant : hors écran, ils sont mis en pause (window.__pause, posé
      // dans chaque prototype par scripts/patch-live.mjs) et reprennent où ils en étaient, sans rechargement (Johan, 07/11).
      // Un seul cadre tourne à la fois : celui qu'on survole (au départ, le navigateur) ; l'autre reste figé sur sa dernière
      // image. Un cadre masqué (le mobile d'un onglet `mobile: false`, le navigateur au téléphone) est déchargé.
      const shown = (f) => f.offsetParent !== null;
      const blank = (f) => { if (f.getAttribute('src') && f.getAttribute('src') !== 'about:blank') f.src = 'about:blank'; };
      const pause = (f, v) => { try { f.contentWindow?.__pause?.(v); } catch {} };
      let near = false, inView = false, focus = desk;
      const sync = () => [desk, mob].forEach((f) => {
        if (!shown(f)) return blank(f);
        if (near && f.getAttribute('src') !== f.dataset.src) { f._wait(); f.src = f.dataset.src; return; }
        const ready = f.parentElement.querySelector('.live-wait').classList.contains('is-ready');
        const lead = shown(focus) ? focus : f; // au téléphone, le mobile est seul : c'est lui qui tourne
        if (ready) pause(f, !(inView && f === lead));
      });
      new IntersectionObserver(([e]) => { near = e.isIntersecting; sync(); }, { rootMargin: '100% 0px' }).observe(el);
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe($('.live-stage', el));
      [[desk, '.live-desk'], [mob, '.live-phone']].forEach(([f, s]) => $(s, el).addEventListener('pointerenter', () => { focus = f; sync(); }));
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
     size : full (toute la largeur) ou half (deux par ligne). Pour un outil dont l'image fait tout (NookDex).
     Les écrans mobiles qui se suivent sont regroupés dans .shw-rail : sans effet au bureau (display: contents), une rangée
     à balayer au téléphone (neuf téléphones empilés faisaient six mille pixels de scroll). */
  showcase: {
    render(b, p, n) {
      const item = (f, i) => `
          <figure class="shw-item shw-${f.size || 'full'}">
            ${f.size === 'phone' ? `<div class="phone shw-ph"><div class="phone-view">${img(f.img, { alt: tx(f.t) })}</div></div>` : browser(f.video
              ? `<video class="shw-video${f.pixel ? ' pix' : ''}" src="${asset(f.video)}" poster="${asset(f.img)}" muted loop playsinline autoplay preload="metadata" aria-label="${tx(f.t)}"></video>`
              : img(f.img, { alt: tx(f.t), cls: f.pixel ? 'pix' : '' }), f.url || '', f.video ? '' : 'wide')}
            <figcaption class="shw-cap">
              <span class="mono shw-n">${String(i + 1).padStart(2, '0')}</span>
              <h3>${tx(f.t)}</h3>
              <p>${tx(f.d)}</p>
            </figcaption>
          </figure>`;
      const isPhone = (f) => f?.size === 'phone';
      const html = b.items.map((f, i) => `${isPhone(f) && !isPhone(b.items[i - 1]) ? '<div class="shw-rail">' : ''}${item(f, i)}${isPhone(f) && !isPhone(b.items[i + 1]) ? '</div>' : ''}`).join('');
      return `${head(b.title || 'b.features', n)}
        <div class="shw">${html}
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

  /* Conversation jouée en vrai HTML (iA Déco) : on écrit, l'assistant réfléchit, répond mot à mot, propose. Le visiteur peut
     cliquer les choix, sinon ils se font seuls. Tourne seulement à l'écran, reboucle. Le CSS décrit l'état final : sans
     animation (prefers-reduced-motion), toute la conversation est là et se lit en scrollant dans le cadre.
     Pas de scroll capturé pendant la lecture : la molette reste à la page. */
  chat: {
    render(b, p, n) {
      const picto = img(b.picto, { cls: 'cs-ic', alt: '' });
      const bot = (s, i, body) => `<div class="cs-m cs-bot" data-m="${i}">${picto}<div class="cs-b"><p class="cs-t">${tx(s.text)}</p>${body}</div></div>`;
      const user = (i, html, echo = false) => `<div class="cs-m cs-user"${echo ? ` data-echo="${i}"` : ` data-m="${i}"`}>${html}</div>`;
      const msg = (s, i) => {
        if (s.from === 'user') return user(i, `${s.photo ? img(s.photo, { cls: 'cs-photo', alt: '', eager: true }) : ''}<span class="cs-bubble">${tx(s.text)}</span>`);
        if (s.choices) return bot(s, i, `<div class="cs-chips">${s.choices.map((c) => `<button type="button" class="cs-chip" data-pick data-sound>${tx(c)}</button>`).join('')}</div>`) + user(i, `<span class="cs-bubble">${tx(s.choices[s.pick])}</span>`, true);
        if (s.rooms) return bot(s, i, `<div class="cs-rooms">${s.rooms.map((r) => `<button type="button" class="cs-room cs-in" data-pick data-sound>${img(r.img, { alt: '', eager: true })}</button>`).join('')}</div>`) + user(i, `${img(s.rooms[s.pick].img, { cls: 'cs-photo is-s', alt: '', eager: true })}<span class="cs-bubble">${tx(s.rooms[s.pick].echo)}</span>`, true);
        if (s.palette) return bot(s, i, `${img(s.salon, { cls: 'cs-salon cs-in', alt: '', eager: true })}<div class="cs-pal">${s.palette.map((c) => `<span class="cs-sw${c.dark ? ' is-dark' : ''}" style="background:${c.c}"><b>${tx(c.n)}</b><code>${c.c}</code></span>`).join('')}</div>`);
        return bot(s, i, `<div class="cs-prods">${s.products.map((x) => `<article class="cs-prod cs-in">${img(x.img, { alt: '', eager: true })}<small>${s.brand}</small><p>${x.name}</p><strong>${x.price}</strong><u>${tx(s.more)}</u></article>`).join('')}</div><div class="cs-rebounds cs-in">${s.rebounds.map((r) => `<span>${tx(r)}</span>`).join('')}</div>`);
      };
      const labelled = b.steps.filter((s) => s.label);
      const app = `<div class="cs-app">
        <aside class="cs-side" aria-hidden="true">${b.side.actions.map((a, i) => `<span class="cs-act${i ? '' : ' is-on'}">${tx(a)}</span>`).join('')}<small>${tx(b.side.day)}</small>${b.side.history.map((h) => `<p>${tx(h)}</p>`).join('')}</aside>
        <div class="cs-main">
          <div class="cs-top">${img(b.logo, { alt: 'iA Rhinov', eager: true })}</div>
          <div class="cs-feed"><div class="cs-list">${b.steps.map(msg).join('')}</div></div>
          <div class="cs-bar"><span class="cs-thumb" hidden></span><span class="cs-field"><span class="cs-ph">${tx(b.placeholder)}</span><span class="cs-typed"></span></span><i class="cs-send" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3 11.5 21 3l-8.5 18-2-7.5z"/></svg></i></div>
          <button type="button" class="cs-again mono" hidden data-sound>${tx(b.again)} ↻</button>
        </div>
      </div>`;
      return `${head(b.title, n, b.note)}
        <div class="cs">
          <ol class="cs-rail">${labelled.map((s, i) => `<li><span class="mono">${String(i + 1).padStart(2, '0')}</span>${tx(s.label)}</li>`).join('')}</ol>
          ${browser(app, b.url)}
        </div>`;
    },
    motion(el, b) {
      const root = $('.cs', el);
      spawn([root], el, { y: 60 });
      const feed = $('.cs-feed', el);
      if (REDUCE) return;

      const STOP = Symbol('stop');
      const list = $('.cs-list', el), typed = $('.cs-typed', el), ph = $('.cs-ph', el), thumb = $('.cs-thumb', el), send = $('.cs-send', el), again = $('.cs-again', el);
      const rail = $$('.cs-rail li', el);
      const dots = document.createElement('div');
      dots.className = 'cs-m cs-bot cs-dots';
      dots.innerHTML = `${img(b.picto, { cls: 'cs-ic', alt: '' })}<span class="cs-think"><i></i><i></i><i></i></span>`;
      let run = 0, visible = false;
      const sleep = async (ms, id) => {
        for (let left = ms; left > 0;) {
          if (id !== run || !el.isConnected) throw STOP;
          await new Promise((r) => setTimeout(r, 40));
          if (visible) left -= 40;
        }
        if (id !== run || !el.isConnected) throw STOP;
      };
      const follow = () => gsap.to(feed, { scrollTop: feed.scrollHeight - feed.clientHeight, duration: 0.55, ease: 'power2.out', overwrite: true });
      const setRail = (i) => rail.forEach((li, k) => { li.classList.toggle('is-on', k === i); li.classList.toggle('is-done', k < i); });

      // Le texte d'un message, mot à mot (les balises <b> restent en place).
      const wordsOf = (p) => {
        if (!p.dataset.split) {
          const walk = (n) => [...n.childNodes].forEach((c) => {
            if (c.nodeType === 3) {
              const f = document.createDocumentFragment();
              c.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.append(w); else { const s = document.createElement('span'); s.className = 'cs-w'; s.textContent = w; f.append(s); } });
              c.replaceWith(f);
            } else walk(c);
          });
          walk(p); p.dataset.split = '1';
        }
        return $$('.cs-w', p);
      };
      const reset = () => {
        gsap.killTweensOf(feed);
        feed.scrollTop = 0;
        dots.remove();
        $$('.cs-m', list).forEach((m) => { m.hidden = true; });
        $$('[data-pick]', el).forEach((x) => { x.disabled = false; x.classList.remove('is-on', 'is-off'); });
        typed.textContent = ''; ph.hidden = false; thumb.hidden = true; thumb.innerHTML = ''; again.hidden = true;
        setRail(-1);
      };
      const reveal = (m) => { m.hidden = false; follow(); };
      const pop = (t) => gsap.fromTo(t, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'transform' });

      const typeIn = async (text, id) => {
        ph.hidden = true;
        for (let k = 1; k <= text.length; k++) { typed.textContent = text.slice(0, k); await sleep(30, id); }
        await sleep(280, id);
        gsap.fromTo(send, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
        typed.textContent = ''; ph.hidden = false; thumb.hidden = true;
      };
      const choose = async (btns, auto, id) => {
        let picked = -1;
        const on = btns.map((x, i) => { const f = () => { if (picked < 0) picked = i; }; x.addEventListener('click', f); return f; });
        try {
          // Au doigt, le temps de lire et d'atteindre le choix : plus long qu'à la souris.
          for (let left = matchMedia('(hover: none)').matches ? 4200 : 2300; picked < 0 && left > 0; left -= 40) await sleep(40, id);
        } finally { btns.forEach((x, i) => x.removeEventListener('click', on[i])); }
        const i = picked < 0 ? auto : picked;
        btns.forEach((x, k) => { x.classList.toggle('is-on', k === i); x.classList.toggle('is-off', k !== i); x.disabled = true; });
        await sleep(420, id);
        return i;
      };

      const answer = async (s, i, id) => {
        list.insertBefore(dots, $(`[data-m="${i}"]`, list));
        follow(); pop(dots);
        await sleep(950, id);
        dots.remove();
        const m = $(`[data-m="${i}"]`, list);
        const ins = $$('.cs-in', m), sw = $$('.cs-sw', m), picks = $$('[data-pick]', m), chips = $('.cs-chips', m);
        gsap.set([...ins, ...sw, ...(chips ? [chips] : [])], { opacity: 0 });
        const words = wordsOf($('.cs-t', m));
        gsap.set(words, { opacity: 0 });
        reveal(m);
        await gsap.to(words, { opacity: 1, duration: 0.2, stagger: 0.028, ease: 'none' });
        await sleep(180, id);
        if (ins.length) { gsap.fromTo(ins, { y: 22, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, stagger: 0.11, ease: 'power3.out', clearProps: 'transform' }); await sleep(450 + ins.length * 110, id); }
        if (sw.length) { gsap.fromTo(sw, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, transformOrigin: 'left center', duration: 0.5, stagger: 0.12, ease: 'power3.inOut', clearProps: 'transform' }); await sleep(900, id); }
        if (chips) { pop(chips); await sleep(200, id); }
        follow();
        if (!picks.length) return;
        const got = await choose(picks, s.pick, id);
        const echo = $(`[data-echo="${i}"]`, list);
        if (s.rooms) { $('img', echo).src = asset(s.rooms[got].img); $('.cs-bubble', echo).textContent = tx(s.rooms[got].echo); }
        else $('.cs-bubble', echo).textContent = tx(s.choices[got]);
        reveal(echo); pop(echo);
        await sleep(520, id);
      };

      const play = async (id) => {
        reset();
        await sleep(600, id);
        let label = -1;
        for (const [i, s] of b.steps.entries()) {
          if (s.label) setRail(++label);
          if (s.from === 'user') {
            if (s.photo) { thumb.innerHTML = img(s.photo, { alt: '', eager: true }); thumb.hidden = false; pop(thumb); await sleep(650, id); }
            await typeIn(tx(s.text), id);
            const m = $(`[data-m="${i}"]`, list);
            reveal(m); pop(m);
            await sleep(450, id);
          } else await answer(s, i, id);
          await sleep(320, id);
        }
        setRail(rail.length);
        again.hidden = false; pop(again);
        await sleep(9000, id);
      };
      const loop = async () => {
        const id = ++run;
        try { for (;;) await play(id); } catch (e) { if (e !== STOP) throw e; }
      };
      again.addEventListener('click', loop);
      reset();
      let started = false;
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !started) { started = true; loop(); }
      }, { threshold: 0.3 }).observe($('.browser', root));
    },
  },

  /* Variantes : plusieurs pistes d'un même écran, bureau et mobile, à comparer au clic (les tests de rhinov.fr).
     Un item sans `mobile` garde la place du téléphone, pour que le cadre ne saute pas. `photos` : une grille d'essais en plus. */
  variants: {
    render(b, p, n) {
      const f = b.items[0], num = (i) => String(i + 1).padStart(2, '0');
      return `${head(b.title, n, b.note)}
        <div class="var">
          <div class="var-tabs" role="tablist">${b.items.map((it, i) => `<button type="button" role="tab" class="var-tab" aria-selected="${!i}" data-var="${i}" data-sound><span class="mono">${num(i)}</span>${tx(it.label)}</button>`).join('')}</div>
          <div class="var-stage${f.mobile ? '' : ' is-solo'}">
            ${browser(img(f.desk, { cls: 'var-desk', eager: !matchMedia(PHONE).matches, alt: tx(f.t) }), tx(f.url), 'wide')}
            <div class="phone var-phone"><div class="phone-view" data-zoom="phone">${img(f.mobile || f.desk, { cls: 'var-mob', alt: '' })}${zoomBtn()}</div></div>
          </div>
          <div class="var-cap"><h3>${tx(f.t)}</h3><p>${tx(f.d)}</p></div>
          ${b.photos ? `<p class="mono fd-label">${tx(b.photos.title)}</p><div class="var-photos">${b.photos.items.map((src) => `<img src="${asset(src)}" alt="" loading="lazy" decoding="async" data-zoom="wide">`).join('')}</div>` : ''}
        </div>`;
    },
    // Les interactions, posées une seule fois et même sans animation (prefers-reduced-motion).
    bind(el, b) {
      const desk = $('.var-desk', el), mob = $('.var-mob', el), stage = $('.var-stage', el);
      $$('[data-var]', el).forEach((btn) => btn.addEventListener('click', () => {
        const it = b.items[+btn.dataset.var];
        $$('[data-var]', el).forEach((x) => x.setAttribute('aria-selected', String(x === btn)));
        desk.src = asset(it.desk); desk.alt = tx(it.t);
        if (it.mobile) mob.src = asset(it.mobile);
        const h = stage.offsetHeight;
        stage.classList.toggle('is-solo', !it.mobile);
        if (stage.offsetHeight !== h) ScrollTrigger.refresh(); // au téléphone, une piste sans mobile raccourcit le bloc : la suite remonte
        $('.browser-url', el).textContent = tx(it.url);
        $('.var-cap h3', el).textContent = tx(it.t);
        $('.var-cap p', el).textContent = tx(it.d);
        centerChip(btn);
        if (!REDUCE) gsap.fromTo([desk, mob, $('.var-cap', el)], { opacity: 0 }, { opacity: 1, duration: 0.35 });
      }));
    },
    motion(el, b) {
      const preload = () => b.items.forEach((it) => (matchMedia(PHONE).matches ? [it.mobile || it.desk] : [it.desk, it.mobile].filter(Boolean)).forEach((s) => { new Image().src = asset(s); }));
      new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); preload(); } }, { rootMargin: '60% 0px' }).observe(el);
      spawn([$('.var-stage', el)], el, { y: 60 });
      const grid = $('.var-photos', el);
      if (grid) spawn($$('img', grid), grid, { stagger: 0.04, y: 40 });
    },
  },

  /* Éventail : toutes les déclinaisons d'un coup, tenues comme une main de cartes et distribuées depuis le centre comme le
     tirage de la home (Mon Salon de Noël). --k = la place par rapport au centre, --a = sa valeur absolue. */
  fan: {
    render(b, p, n) {
      const mid = (b.items.length - 1) / 2;
      return `${head(b.title, n, b.note)}
        <div class="fan" style="--n:${b.items.length}">${b.items.map((it, i) => `
          <figure class="fan-item" style="--k:${i - mid};--a:${Math.abs(i - mid)}">
            <div class="fan-deal"><div class="fan-card">${img(it.img, { alt: tx(it.t) })}</div></div>
            <figcaption><b>${tx(it.t)}</b><span>${tx(it.d)}</span></figcaption>
          </figure>`).join('')}</div>`;
    },
    motion(el) {
      const fan = $('.fan', el), deals = $$('.fan-deal', el), mid = (deals.length - 1) / 2;
      // Vers le centre réel de l'éventail (toujours dans la largeur de la page, même sur deux colonnes au téléphone).
      const toCenter = (i, d) => { const f = fan.getBoundingClientRect(), r = d.getBoundingClientRect(); return f.left + f.width / 2 - (r.left + r.width / 2); };
      gsap.from(deals, {
        x: toCenter, y: 70, rotation: (i) => (i - mid) * -7, scale: 0.86, opacity: 0,
        duration: 1, ease: 'back.out(1.25)', stagger: { each: 0.06, from: 'center' },
        scrollTrigger: { trigger: fan, start: 'top 78%' },
      });
      gsap.from($$('figcaption', el), { y: 14, opacity: 0, duration: 0.7, delay: 0.45, stagger: { each: 0.05, from: 'center' }, ease: 'power3.out', scrollTrigger: { trigger: fan, start: 'top 78%' } });
    },
  },

  /* Fondations d'une marque : logos et leurs déclinaisons, couleurs et typographie en vrai HTML (Système Rhinov). */
  foundations: {
    render(b, p, n) {
      const label = (s) => `<p class="mono fd-label">${tx(s)}</p>`;
      const logo = (l) => `<div class="fd-logo${l.span ? ` fd-${l.span}` : ''}" style="background-color:${l.bg}${l.photo ? `;background-image:linear-gradient(rgba(20,14,10,.42),rgba(20,14,10,.42)),url(${asset(l.photo)})` : ''};color:${l.fg}">${img(l.src, { alt: '', cls: 'fd-mark', style: `--w:${l.w || '62%'}` })}<span class="mono fd-cap">${tx(l.t)}</span></div>`;
      const chip = (s) => `<div class="fd-chip"><i style="background:${s.c}"></i><b>${tx(s.n)}</b><code>${s.c}</code></div>`;
      const ty = b.typo;
      return `${head(b.title, n, b.note)}
        <div class="fd-logos">${b.logos.map(logo).join('')}</div>
        ${label(b.cobrandTitle)}
        <div class="fd-co">${b.cobrands.map(logo).join('')}</div>
        ${label(b.colorsNote)}
        <div class="fd-main">${b.colors.map((c) => `<div class="fd-col" style="--g:${c.g};background:${c.c}"><b>${tx(c.n)}</b><code>${c.c}</code><span>${tx(c.r)}</span></div>`).join('')}</div>
        <div class="fd-chips">${b.swatches.map(chip).join('')}</div>
        <div class="fd-type">
          <div class="fd-spec">
            <p class="fd-big">${tx(ty.lead)} <em>${tx(ty.accent)}</em></p>
            <div class="fd-pair"><p><b class="fd-p">Poppins</b>${tx(ty.poppins)}</p><p><b class="fd-b">Bodoni Moda</b>${tx(ty.bodoni)}</p></div>
          </div>
          <div class="fd-scale">${ty.scale.map((r) => `<div class="fd-row"><span class="fd-s" style="--s:${r.s};font-weight:${r.w};line-height:${r.l}px">${tx(ty.sample)}</span><code>${tx(r.n)} · ${r.s} / ${r.l}</code></div>`).join('')}</div>
          <div class="fd-fig"><span>${ty.figure}</span><code>${tx(ty.figureLabel)}</code></div>
        </div>`;
    },
    motion(el) {
      spawn($$('.fd-logo', $('.fd-logos', el)), $('.fd-logos', el));
      spawn($$('.fd-logo', $('.fd-co', el)), $('.fd-co', el));
      spawn($$('.fd-col', el), $('.fd-main', el));
      spawn($$('.fd-chip', el), $('.fd-chips', el), { stagger: 0.02, y: 24 });
      spawn($$('.fd-type > *', el), $('.fd-type', el));
    },
  },

  features: {
    render(b, p, n) {
      return `${head(blockTitle(b) || 'b.features', n)}
        <div class="bento ft-bento${b.tall ? ' is-tall' : ''}">${b.items.map((f) => `
          <article class="b-tile ft ft-${f.size || 's'}">
            <div class="ft-img"${f.model && !(b.flatOnTouch && matchMedia(STILL).matches) ? ` data-model="${asset(f.model)}"${b.soft ? ' data-soft' : ''}` : ''}>${img(f.img, { alt: '', style: `object-fit:${f.fit || 'cover'};object-position:${f.pos || 'top'}${f.pad ? `;padding:${f.pad};box-sizing:border-box` : ''}` })}</div>
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
      // Au bureau, tout est chargé d'avance (la piste épinglée se calcule dessus) ; au téléphone, chaque image attend son tour.
      const eager = !matchMedia('(max-width: 860px)').matches, k = String(b.items.length).padStart(2, '0');
      return `
        <div class="sl-pin">
          ${head(b.title || 'b.slides', n)}
          <div class="sl-track">${b.items.map((s) => `<figure class="slide">${img(s.src, { alt: tx(s.t), eager, style: s.pos ? `object-position:${s.pos}` : '' })}<figcaption class="mono">${tx(s.t)}</figcaption></figure>`).join('')}</div>
          <div class="sl-count mono" aria-hidden="true"><span class="sl-at">01</span> / ${k}<i class="sl-bar"><i></i></i></div>
        </div>`;
    },
    motion(el, b, p, { desktop }) {
      const track = $('.sl-track', el);
      if (!desktop) {
        // Au doigt : une piste horizontale native, aimantée à chaque slide. Le navigateur tranche seul entre balayage et scroll
        // vertical. Le compteur et la barre suivent la piste.
        spawn($$('.slide', el).slice(0, 2), track, { stagger: 0.08, y: 40 });
        const at = $('.sl-at', el), bar = $('.sl-bar i', el), n = b.items.length;
        let queued = false;
        const update = () => {
          queued = false;
          const max = track.scrollWidth - track.clientWidth, x = max > 0 ? track.scrollLeft / max : 0;
          at.textContent = String(Math.round(x * (n - 1)) + 1).padStart(2, '0');
          bar.style.transform = `scaleX(${(1 + x * (n - 1)) / n})`;
        };
        track.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
        update();
        return;
      }
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
            <span class="out-num" data-count="${s.v}" data-suffix="${s.suffix || ''}" ${s.sep ? 'data-sep="1"' : ''}>${formatCount(s.v, s.sep, s.suffix || '')}</span>
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
