/* =========================================================
   Rhinov Studio · Prototype landing Retail
   Smooth scroll (Lenis) + GSAP ScrollTrigger, interactions.
   Tout l'état « masqué » des reveals est posé ici, en JS :
   si le script ne charge pas, la page reste lisible.
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqMob = window.matchMedia('(max-width: 899.98px)');
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;
  if (G && ST) G.registerPlugin(ST);

  /* ---------------------------------------------------------
     Smooth scroll
     --------------------------------------------------------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (G && ST) {
      lenis.on('scroll', ST.update);
      G.ticker.add((t) => lenis.raf(t * 1000));
      G.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollToEl = (el) => {
    const offset = el.id === 'top' ? 0 : (mqMob.matches ? -84 : -110);
    if (lenis) {
      lenis.scrollTo(el.id === 'top' ? 0 : el, { offset, duration: 1.4 });
    } else {
      const y = el.id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  /* ---------------------------------------------------------
     Nav : verre au scroll, se cache à la descente
     --------------------------------------------------------- */
  const nav = $('#nav');
  const drop = $('.nav__drop');
  const dropBtn = $('.nav__link--drop');
  const burger = $('.nav__burger');
  const menu = $('#menu-mobile');
  const voile = $('#menu-voile');
  const sticky = $('#sticky');

  const openDrop = (on) => {
    if (!drop) return;
    drop.classList.toggle('is-open', on);
    dropBtn.setAttribute('aria-expanded', String(on));
  };
  let dropTimer;
  if (drop) {
    drop.addEventListener('mouseenter', () => { clearTimeout(dropTimer); openDrop(true); });
    drop.addEventListener('mouseleave', () => { dropTimer = setTimeout(() => openDrop(false), 160); });
    dropBtn.addEventListener('click', () => openDrop(!drop.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { openDrop(false); setMenu(false); } });
    document.addEventListener('click', (e) => { if (!drop.contains(e.target)) openDrop(false); });
  }

  const setMenu = (on) => {
    if (!menu) return;
    nav.classList.toggle('is-menu', on);
    menu.hidden = !on;
    burger.setAttribute('aria-expanded', String(on));
    burger.setAttribute('aria-label', on ? 'Fermer le menu' : 'Ouvrir le menu');
    if (voile) voile.classList.toggle('is-on', on);
    document.documentElement.style.overflow = on ? 'hidden' : '';
    if (lenis) on ? lenis.stop() : lenis.start();
    if (on && motion) G.fromTo(menu.querySelectorAll('.menu-mobile__liens a, .menu-mobile__ctas > *'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out' });
  };
  burger && burger.addEventListener('click', () => setMenu(menu.hidden));
  voile && voile.addEventListener('click', () => setMenu(false));
  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches && !menu.hidden) setMenu(false); });

  // Ancres internes
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    let target = id.length > 1 ? document.getElementById(id.slice(1)) : null;
    if (!target) return;
    if (a.dataset.step !== undefined && !mqMob.matches) target = $('.cat');
    e.preventDefault();
    if (a.dataset.step !== undefined) catGoTo(+a.dataset.step, true);
    setMenu(false);
    openDrop(false);
    scrollToEl(target);
  });

  // Scroll : état du header + barre contact
  const hero = $('.hero');
  let lastY = window.scrollY;
  let hideZones = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 10);
    const busy = nav.classList.contains('is-menu') || (drop && drop.classList.contains('is-open'));
    if (!busy) {
      if (y > lastY + 3 && y > 240) nav.classList.add('is-hidden');
      else if (y < lastY - 3 || y < 240) nav.classList.remove('is-hidden');
    }
    lastY = y;
    const heroEnd = hero.offsetTop + hero.offsetHeight * 0.75;
    sticky.classList.toggle('is-visible', y > heroEnd - window.innerHeight * 0.5 && hideZones === 0);
    if (!sticky.classList.contains('is-visible')) sticky.classList.remove('is-tel');
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // La barre contact s'efface sur le formulaire et le footer
  if ('IntersectionObserver' in window) {
    const zones = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => zones.set(en.target, en.isIntersecting));
      hideZones = Array.from(zones.values()).filter(Boolean).length;
      onScroll();
    }, { rootMargin: '0px 0px -12% 0px' });
    [$('.demo__inner .form'), $('.footer')].forEach((el) => el && io.observe(el));
  }
  onScroll();

  // Mobile : bouton d'appel = bulle avec le numéro (affiché en texte)
  const appel = $('.sticky__appel');
  appel && appel.addEventListener('click', () => {
    const on = !sticky.classList.contains('is-tel');
    sticky.classList.toggle('is-tel', on);
    appel.setAttribute('aria-expanded', String(on));
  });

  // Lueur qui suit la souris sur les boutons principaux
  $$('.btn--primary').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${e.clientX - r.left}px`);
      b.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------------------------------------------------------
     Vidéos : lecture seulement quand c'est visible
     --------------------------------------------------------- */
  const heroVideo = $('.hero__video');
  if (reduce && heroVideo) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
  const playIfOk = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  if ('IntersectionObserver' in window && heroVideo && !reduce) {
    new IntersectionObserver(([en]) => { en.isIntersecting ? playIfOk(heroVideo) : heroVideo.pause(); }, { threshold: 0.05 }).observe(heroVideo);
  }

  /* ---------------------------------------------------------
     Catalogue : accordéon + visuel
     --------------------------------------------------------- */
  const cat = $('.cat');
  const lignes = $$('.cat__ligne');
  const catImgs = $$('.cat__images img');
  const visuel = $('.cat__visuel');
  const compteur = $('.cat__compteur-n');
  const AUTO = 6;           // secondes par prestation
  let cur = 0;
  let progressTween = null;
  let autoOn = false;
  let hoverPause = false;

  function setProgress(v) { lignes.forEach((l, i) => l.style.setProperty('--p', i === cur ? v : 1)); }

  function startAuto() {
    if (!motion || !autoOn || hoverPause) return;
    if (progressTween) progressTween.kill();
    const o = { p: 0 };
    setProgress(0);
    progressTween = G.to(o, {
      p: 1, duration: AUTO, ease: 'none',
      onUpdate: () => setProgress(o.p),
      onComplete: () => catGoTo(cur + 1, false),
    });
  }
  function stopAuto(full) {
    if (progressTween) { progressTween.kill(); progressTween = null; }
    if (full) setProgress(1);
  }

  function catGoTo(i, user) {
    if (!lignes.length) return;
    i = (i + lignes.length) % lignes.length;
    const prev = cur;
    lignes.forEach((l, k) => {
      const on = k === i;
      l.classList.toggle('is-open', on);
      l.setAttribute('aria-selected', String(on));
    });
    visuel.dataset.step = String(i);
    if (compteur) {
      const n = String(i + 1).padStart(2, '0');
      if (motion && prev !== i) {
        G.timeline()
          .to(compteur, { yPercent: -60, opacity: 0, duration: .18, ease: 'power2.in' })
          .add(() => { compteur.textContent = n; })
          .fromTo(compteur, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .3, ease: 'power3.out' });
      } else compteur.textContent = n;
    }
    if (prev !== i) {
      const a = catImgs[prev], b = catImgs[i];
      b.classList.add('is-active');
      if (motion) {
        G.killTweensOf([a, b]);
        G.set(b, { zIndex: 2 }); G.set(a, { zIndex: 1 });
        G.fromTo(b, { opacity: 0, scale: 1.06, clipPath: 'inset(0% 0% 0% 100%)' },
          { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'expo.out',
            onComplete: () => { if (a !== b) { a.classList.remove('is-active'); G.set(a, { clearProps: 'opacity,zIndex,scale,transform,clipPath' }); } } });
      } else if (a !== b) a.classList.remove('is-active');
    }
    cur = i;
    if (user) setProgress(1);
    stopAuto(false);
    if (autoOn) startAuto(); else setProgress(1);
  }

  lignes.forEach((l) => l.addEventListener('click', () => catGoTo(+l.dataset.i, true)));
  $$('.cat__fleche').forEach((b) => b.addEventListener('click', () => catGoTo(cur + +b.dataset.dir, true)));
  if (cat) {
    cat.addEventListener('mouseenter', () => { hoverPause = true; stopAuto(true); });
    cat.addEventListener('mouseleave', () => { hoverPause = false; startAuto(); });
  }
  // Étape 08 : on « fait tourner » l'image au glisser
  if (visuel) {
    let dragX = null;
    visuel.addEventListener('pointerdown', (e) => {
      if (visuel.dataset.step !== '7' || e.target.closest('button')) return;
      dragX = e.clientX; visuel.setPointerCapture(e.pointerId); visuel.style.cursor = 'grabbing';
    });
    visuel.addEventListener('pointermove', (e) => {
      if (dragX === null) return;
      const d = Math.max(-1, Math.min(1, (e.clientX - dragX) / 300));
      const img = catImgs[7];
      img.style.transform = `perspective(900px) rotateY(${d * 14}deg) translateX(${d * 18}px)`;
    });
    const end = () => {
      if (dragX === null) return;
      dragX = null; visuel.style.cursor = '';
      const img = catImgs[7];
      if (motion) G.to(img, { rotateY: 0, x: 0, duration: .9, ease: 'elastic.out(1, .6)', onComplete: () => { img.style.transform = ''; } });
      else img.style.transform = '';
    };
    visuel.addEventListener('pointerup', end);
    visuel.addEventListener('pointercancel', end);
  }

  // Mobile : pagination des cartes
  const rail = $('.catm__rail');
  const points = $$('.catm__points i');
  if (rail && points.length) {
    let raf = 0;
    rail.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = rail.scrollWidth - rail.clientWidth;
        let idx = Math.round(rail.scrollLeft / 312);
        if (rail.scrollLeft >= max - 4) idx = points.length - 1;
        points.forEach((p, k) => p.classList.toggle('is-on', k === idx));
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     Galerie : deux séries qui alternent
     --------------------------------------------------------- */
  const galerie = $('.galerie');
  const grilles = $$('.galerie__grille');
  const galCtrl = $('.galerie__ctrl');
  const galPoints = $$('.galerie__points i');
  const galVideos = $$('.galerie__grille video');
  let serie = 0;
  let galVisible = false;
  let galBusy = false;

  const syncVideos = () => {
    galVideos.forEach((v) => {
      const actif = v.closest('.galerie__grille').classList.contains('is-active');
      if (actif && galVisible && !reduce) playIfOk(v); else v.pause();
    });
  };
  if ('IntersectionObserver' in window && galerie) {
    new IntersectionObserver(([en]) => { galVisible = en.isIntersecting; syncVideos(); }, { threshold: 0.1 }).observe(galerie);
  }

  galCtrl && galCtrl.addEventListener('click', () => {
    if (galBusy) return;
    const from = grilles[serie];
    serie = 1 - serie;
    const to = grilles[serie];
    galPoints.forEach((p, k) => p.classList.toggle('is-on', k === serie));
    from.setAttribute('aria-hidden', 'true');
    to.removeAttribute('aria-hidden');
    if (!motion) {
      from.classList.remove('is-active'); to.classList.add('is-active'); syncVideos(); return;
    }
    galBusy = true;
    G.to('.galerie__rond', { rotation: '-=360', duration: .9, ease: 'power3.inOut' });
    to.classList.add('is-active');
    G.set(to, { zIndex: 2 }); G.set(from, { zIndex: 1 });
    const tilesIn = $$('.tuile', to);
    syncVideos();
    G.timeline({
      onComplete: () => {
        from.classList.remove('is-active');
        G.set($$('.tuile', from), { clearProps: 'opacity,scale,transform' });
        G.set([to, from], { clearProps: 'zIndex' });
        galBusy = false;
        syncVideos();
      },
    })
      .to($$('.tuile', from), { opacity: 0, scale: .97, duration: .45, stagger: .035, ease: 'power2.in' }, 0)
      .fromTo(tilesIn, { clipPath: 'inset(100% 0% 0% 0% round 16px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1, stagger: .07, ease: 'expo.out' }, .15)
      .fromTo(tilesIn.map((t) => t.firstElementChild), { scale: 1.32 }, { scale: 1.12, duration: 1.4, stagger: .07, ease: 'expo.out' }, .15)
      .set(tilesIn, { clearProps: 'clipPath' });
  });

  /* ---------------------------------------------------------
     Comparatif mobile : switch 3 modes
     --------------------------------------------------------- */
  const MODES = [
    { v: ['Vos équipes', '✓', '✓', '✓', '✓', 'En un clic, via nos équipes', '✓', '✓'],
      t: 'Autonome ne veut pas dire seul.', p: 'Chaque template a été composé par un décorateur, chaque produit modélisé conforme.' },
    { v: ['Nos décorateurs', '✓', '✓', '✓', '✓', '✓', '✓', '✓'],
      t: 'Aucune ressource à mobiliser.', p: 'Vos contenus arrivent finis, prêts à être diffusés.' },
    { v: ['Vous, seul', '✕', '✕', '✕', '✕', '✕', '✓', '✓'],
      t: 'Rapide et peu chère sur le papier.', p: 'Mais sans garantie de conformité : elle déforme le produit et invente des détails.' },
  ];
  const sw = $('.switch');
  if (sw) {
    const btns = $$('button', sw);
    const vals = $$('.comparem__tableau [data-v]');
    const citT = $('[data-cit-t]'), citP = $('[data-cit-p]');
    btns.forEach((b) => b.addEventListener('click', () => {
      const m = +b.dataset.mode;
      sw.style.setProperty('--m', m);
      btns.forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
      const apply = () => {
        MODES[m].v.forEach((txt, k) => {
          const el = vals[k];
          el.textContent = txt;
          const isMark = txt === '✓' || txt === '✕';
          el.classList.toggle('mk', isMark);
          el.classList.toggle('ko', txt === '✕');
          el.classList.toggle('txt130', !isMark && k === 5);
        });
        citT.textContent = MODES[m].t; citP.textContent = MODES[m].p;
      };
      if (motion) {
        G.timeline()
          .to([...vals, citT, citP], { opacity: 0, y: -6, duration: .16, stagger: .01, ease: 'power2.in' })
          .add(apply)
          .fromTo(vals, { opacity: 0, y: 8, scale: .8 }, { opacity: 1, y: 0, scale: 1, duration: .45, stagger: .035, ease: 'back.out(2)' })
          .fromTo([citT, citP], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, stagger: .06, ease: 'power3.out' }, '-=.35');
      } else apply();
    }));
  }

  /* ---------------------------------------------------------
     Formulaire : étapes (mobile) + envoi simulé
     --------------------------------------------------------- */
  const form = $('#form-demo');
  if (form) {
    const champ = (name) => form.elements[name];
    const isOk = (el) => {
      const v = el.value.trim();
      if (el.required && !v) return false;
      if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return false;
      return true;
    };
    const check = (names) => {
      let first = null;
      names.forEach((n) => {
        const el = champ(n);
        const ok = isOk(el);
        el.closest('.champ').classList.toggle('is-erreur', !ok);
        if (!ok && !first) first = el;
      });
      if (first) {
        first.focus({ preventScroll: true });
        if (motion) G.fromTo(first.closest('.champ'), { x: -6 }, { x: 0, duration: .5, ease: 'elastic.out(1, .3)' });
      }
      return !first;
    };
    form.addEventListener('input', (e) => { const c = e.target.closest('.champ'); if (c) c.classList.remove('is-erreur'); });
    const nomEtape = $('.form__etape-nom', form), numEtape = $('.form__etape-n', form), prog = $$('.form__prog i', form);
    const setStep = (s) => {
      form.classList.toggle('is-step2', s === 2);
      nomEtape.textContent = s === 2 ? 'Votre marque' : 'Vous';
      numEtape.textContent = s === 2 ? '2 / 2' : '1 / 2';
      prog[1].classList.toggle('is-on', s === 2);
      const g = $(`.form__groupe[data-step="${s}"]`, form);
      if (motion) G.fromTo(g, { opacity: 0, x: s === 2 ? 24 : -24 }, { opacity: 1, x: 0, duration: .5, ease: 'power3.out' });
      if (ST) ST.refresh();
    };
    $('.form__continuer', form).addEventListener('click', () => { if (check(['nom', 'email'])) setStep(2); });
    $('.form__retour', form).addEventListener('click', () => setStep(1));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = mqMob.matches && !form.classList.contains('is-step2')
        ? false
        : check(['nom', 'email', 'marque']);
      if (!ok) {
        if (mqMob.matches && !form.classList.contains('is-step2')) { if (check(['nom', 'email'])) setStep(2); }
        else if (mqMob.matches && (!isOk(champ('nom')) || !isOk(champ('email')))) setStep(1);
        return;
      }
      const btn = $('.form__envoyer', form);
      btn.disabled = true;
      btn.querySelector('span').textContent = 'Envoi…';
      setTimeout(() => {
        form.classList.add('is-sent');
        const okBox = $('.form__ok', form);
        okBox.hidden = false;
        if (motion) {
          G.from(okBox.children, { y: 16, opacity: 0, duration: .7, stagger: .1, ease: 'power3.out' });
          G.from(okBox.firstElementChild, { scale: .4, rotation: -30, duration: .9, ease: 'back.out(2.2)' });
        }
        if (ST) ST.refresh();
      }, 650);
    });
  }

  /* ---------------------------------------------------------
     FAQ : accordéons animés en hauteur
     --------------------------------------------------------- */
  $$('.qa').forEach((qa) => {
    const q = $('.qa__q', qa), r = $('.qa__r', qa);
    q.setAttribute('aria-controls', r.id = `rep-${Math.random().toString(36).slice(2, 8)}`);
    q.addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      qa.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', String(open));
      if (motion) {
        G.fromTo(r, { height: open ? 0 : r.offsetHeight }, {
          height: open ? 'auto' : 0, duration: .6, ease: 'power3.inOut',
          onComplete: () => { if (open) r.style.height = 'auto'; ST.refresh(); },
        });
        if (open) G.fromTo(r.firstElementChild, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: .5, delay: .12, ease: 'power3.out' });
      } else {
        r.style.height = open ? 'auto' : '0px';
      }
    });
  });
  const faq = $('.faq');
  const voir = $('.faq__voir');
  voir && voir.addEventListener('click', () => {
    faq.classList.add('is-all');
    if (motion) {
      const items = $$('.qa--plus').sort((a, b) => +a.style.getPropertyValue('--o') - +b.style.getPropertyValue('--o'));
      G.from(items, { opacity: 0, y: 14, duration: .5, stagger: .03, ease: 'power3.out' });
    }
    if (ST) ST.refresh();
  });

  /* ---------------------------------------------------------
     Motion (GSAP) : tout est posé ici
     --------------------------------------------------------- */
  if (!motion) return;

  // Mot à mot pour le Claim
  const splitWords = (el) => {
    const nodes = Array.from(el.childNodes);
    el.textContent = '';
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w'; s.textContent = part;
          el.appendChild(s);
        });
      } else el.appendChild(n);
    });
  };
  $$('[data-words] > span').forEach(splitWords);

  /* Hero : visible dès le chargement, mouvement léger par-dessus */
  G.from('.hero__title .line > span', { yPercent: 22, duration: 1.1, ease: 'power3.out', stagger: .08 });
  G.from('[data-hero]', { y: 14, duration: 1, ease: 'power3.out', stagger: .08, delay: .1 });
  G.fromTo('.hero__frame', { clipPath: 'inset(2.5% 2.5% 2.5% 2.5% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.4, ease: 'power3.out' });
  G.fromTo('.hero__video', { scale: 1.14 }, { scale: 1.06, duration: 1.8, ease: 'power3.out' });
  G.fromTo('.hero__bg img', { scale: 1.08 }, { scale: 1.02, duration: 2, ease: 'power3.out' });

  const mm = G.matchMedia();

  // Reveals génériques
  $$('[data-reveal]').forEach((el) => {
    G.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('[data-lines]').forEach((el) => {
    G.from($$('.line > span', el), {
      yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: .1,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Logos : entrée douce
  G.from('.logos__viewport', { opacity: 0, y: 12, duration: 1.2, delay: .5, ease: 'power2.out' });

  // Pourquoi : contraintes barrées au scroll
  const strikes = $$('.strike');
  strikes.forEach((s) => s.style.setProperty('--s', 0));
  const tlStrike = G.timeline({ scrollTrigger: { trigger: '.shooting', start: 'top 75%', end: 'bottom 62%', scrub: .6 } });
  strikes.forEach((s, k) => {
    tlStrike.to(s, { '--s': 1, duration: 1, ease: 'none' }, k * .9)
      .to(s.parentElement, { color: 'rgba(255,255,255,.72)', duration: .5 }, k * .9)
      .fromTo(s.previousElementSibling, { rotation: -90, scale: .4, opacity: .3 }, { rotation: 0, scale: 1, opacity: 1, duration: .6, ease: 'back.out(2)' }, k * .9);
  });
  tlStrike.fromTo('.shooting__fin', { opacity: .25 }, { opacity: 1, duration: .8 }, '>-0.2');
  G.set($$('.shooting__list li'), { color: 'rgba(255,255,255,.95)' });

  // Picto souris : s'efface dès qu'on commence à défiler
  G.to('.hero__scroll', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '18% top', scrub: true } });
  // Hero : léger parallaxe à la sortie
  mm.add('(min-width: 900px)', () => {
    G.to('.hero__text', { y: -60, opacity: .35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__video', { yPercent: 3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__bg img', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    // Le visuel plein écran se rétracte en carte arrondie au scroll (même geste que le prototype Immo)
    G.fromTo('.hero--plein .hero__bg', { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(7% 3.5% 0% 3.5% round 32px)', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Piliers : quinconce + parallaxe par colonne
    const cols = $$('.piliers__col');
    const order = [cols[0].children[0], cols[1].children[0], cols[0].children[1], cols[1].children[1]];
    G.from(order, { y: 80, opacity: 0, duration: 1.1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.piliers', start: 'top 82%', once: true } });
    G.fromTo(cols[0], { y: 20 }, { y: -20, ease: 'none', scrollTrigger: { trigger: '.pourquoi', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.fromTo(cols[1], { y: 50 }, { y: -50, ease: 'none', scrollTrigger: { trigger: '.pourquoi', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Équipe : parallaxe des photos
    G.fromTo('.equipe__atelier img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.equipe', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.fromTo('.equipe__sourire', { y: 50 }, { y: -50, ease: 'none', scrollTrigger: { trigger: '.equipe', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.from('.equipe__atelier', { clipPath: 'inset(0% 100% 0% 0% round 0 16px 16px 0)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.equipe', start: 'top 75%', once: true } });

    // Tableau comparatif : coches en cascade
    const rows = $$('.tableau__ligne');
    G.from('.tableau__bandeau', { scaleY: 0, transformOrigin: 'top', duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.tableau', start: 'top 80%', once: true } });
    G.from(rows, { opacity: 0, x: -14, duration: .7, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.tableau', start: 'top 80%', once: true } });
    G.from($$('.tableau .ok, .tableau .ko'), { scale: 0, rotation: -35, opacity: 0, duration: .55, stagger: .035, delay: .35, ease: 'back.out(2.4)', scrollTrigger: { trigger: '.tableau', start: 'top 80%', once: true } });

    // Catalogue : progression auto quand la section est à l'écran
    ST.create({
      trigger: '.cat', start: 'top 75%', end: 'bottom 20%',
      onToggle: (self) => { autoOn = self.isActive; if (autoOn) startAuto(); else stopAuto(true); },
    });
    G.from('.cat__liste .cat__ligne', { opacity: 0, x: -24, duration: .8, stagger: .06, ease: 'power3.out', scrollTrigger: { trigger: '.cat', start: 'top 80%', once: true } });
    G.from('.cat__visuel', { clipPath: 'inset(8% 8% 8% 8% round 16px)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.cat', start: 'top 80%', once: true } });
    return () => { stopAuto(true); autoOn = false; };
  });

  mm.add('(max-width: 899.98px)', () => {
    G.from('.pilier', { y: 30, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.piliers', start: 'top 85%', once: true } });
    G.from('.catm__carte', { x: 60, opacity: 0, duration: 1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.catm', start: 'top 85%', once: true } });
    G.fromTo('.equipe__atelier img', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.equipe', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.fromTo('.equipe__sourire', { y: 40 }, { y: -10, ease: 'none', scrollTrigger: { trigger: '.equipe__photos', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.from('.comparem__ligne', { opacity: 0, y: 10, duration: .6, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.comparem', start: 'top 85%', once: true } });
  });

  // Galerie : tuiles révélées en clip-path + parallaxe interne
  const tiles1 = $$('.galerie__grille[data-serie="1"] .tuile');
  G.fromTo(tiles1, { clipPath: 'inset(100% 0% 0% 0% round 16px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.3, stagger: .09, ease: 'expo.out',
    scrollTrigger: { trigger: '.galerie__scene', start: 'top 82%', once: true },
    onComplete: () => G.set(tiles1, { clearProps: 'clipPath' }),
  });
  $$('.tuile').forEach((t) => {
    const m = t.firstElementChild;
    G.fromTo(m, { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.galerie', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Claim : texte qui s'allume mot par mot
  G.fromTo('.claim__titre .w', { opacity: .14 }, {
    opacity: 1, stagger: .12, ease: 'none',
    scrollTrigger: { trigger: '.claim', start: 'top 72%', end: 'center 42%', scrub: .5 },
  });

  // Deux façons : cartes qui entrent, badge « ou »
  const dx = mqMob.matches ? 0 : 50;
  G.from('.carte--clair', { x: -dx, y: 40, rotation: mqMob.matches ? 0 : -1.5, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.carte--clair', start: 'top 85%', once: true } });
  G.from('.carte--fonce', { x: dx, y: 40, rotation: mqMob.matches ? 0 : 1.5, opacity: 0, duration: 1.2, ease: 'power3.out', delay: mqMob.matches ? 0 : .1, scrollTrigger: { trigger: mqMob.matches ? '.carte--fonce' : '.cartes', start: 'top 85%', once: true } });
  G.from('.badge-ou', { scale: 0, rotation: -120, duration: 1, delay: .55, ease: 'back.out(2.2)', scrollTrigger: { trigger: '.cartes', start: 'top 80%', once: true } });
  G.from('.carte__formats span', { y: 16, opacity: 0, duration: .6, stagger: .07, delay: .6, ease: 'power3.out', scrollTrigger: { trigger: '.cartes', start: 'top 80%', once: true } });

  // Tarification : le fil se trace de 01 à 03
  const nums = $$('.etape__num');
  G.set(nums, { color: 'rgba(59,43,31,.22)' });
  const fil = $('.panneau__fil i');
  const tlFil = G.timeline({ scrollTrigger: { trigger: '.panneau', start: 'top 78%', end: 'bottom 62%', scrub: .6 } });
  tlFil.fromTo(fil, { '--f': 0 }, { '--f': 1, duration: 3, ease: 'none' }, 0);
  nums.forEach((n, k) => tlFil.to(n, { color: '#3b2b1f', duration: .35 }, k * 1.2));
  G.from('.etape', { y: 40, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.panneau', start: 'top 82%', once: true } });

  // Rafraîchir une fois les médias chargés
  window.addEventListener('load', () => ST.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
})();
