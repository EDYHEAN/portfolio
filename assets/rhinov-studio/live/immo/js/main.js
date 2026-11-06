/* =========================================================
   Rhinov Studio Immo · prototype
   Lenis + GSAP ScrollTrigger, mêmes réglages que le prototype Retail.
   Ne jamais ajouter `scroll-behavior: smooth` en CSS : il se bat avec Lenis.
   Tous les états « masqués » sont posés ici, en JS : si le script
   ne charge pas, la page reste complète et lisible.
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqDesk = window.matchMedia('(min-width: 900px)');
  const G = window.gsap, ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;
  if (G && ST) G.registerPlugin(ST);

  /* ---------- Smooth scroll : mêmes réglages que le prototype Retail ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (G && ST) { lenis.on('scroll', ST.update); G.ticker.add((t) => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); const el = id ? document.getElementById(id) : null; if (!el) return;
    e.preventDefault();
    const offset = id === 'top' ? 0 : (mqDesk.matches ? -110 : -84);
    if (lenis) lenis.scrollTo(id === 'top' ? 0 : el, { offset, duration: 1.4 });
    else window.scrollTo({ top: id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Nav : se cache à la descente, revient à la montée ---------- */
  const nav = $('#nav'); let lastY = window.scrollY;
  // Même règle que le Retail : seuil de 3 px dans chaque sens, rien avant 240 px (sinon la nav tremble)
  const onScroll = () => {
    const y = window.scrollY;
    if (y > lastY + 3 && y > 240) nav.classList.add('is-cachee');
    else if (y < lastY - 3 || y < 240) nav.classList.remove('is-cachee');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Hero : lecture unique, arrêt sur la pièce finie ---------- */
  const video = $('#hero-video');
  const FIN = 'assets/img/hero-immo-derniere.webp';
  if (reduce) video.poster = FIN;
  else {
    video.src = window.innerWidth < 900 ? 'assets/video/hero-immo-1280.mp4' : 'assets/video/hero-immo-1920.mp4';
    const lancer = () => { const p = video.play(); if (p && p.catch) p.catch(() => { video.poster = FIN; }); };
    if (video.readyState >= 2) lancer(); else video.addEventListener('canplay', lancer, { once: true });
    video.addEventListener('ended', () => { video.poster = FIN; video.pause(); });
  }

  /* ---------- Vidéo de la carte : lecture seulement quand elle est à l'écran ---------- */
  const vCarte = $('.carte__video');
  if (vCarte && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { const p = vCarte.play(); if (p && p.catch) p.catch(() => {}); } else vCarte.pause();
    }, { threshold: .25 }).observe(vCarte);
  }

  /* ---------- Avant / après : glisser, cliquer, clavier ---------- */
  const initBA = (el) => {
    const poignee = $('.ba__poignee', el);
    el._pos = 50;
    const set = (pct) => {
      pct = Math.max(0, Math.min(100, pct)); el._pos = pct;
      el.style.setProperty('--pos', pct + '%'); poignee.setAttribute('aria-valuenow', Math.round(pct));
    };
    const fromEvent = (e) => { const r = el.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    let drag = false;
    el.addEventListener('pointerdown', (e) => { drag = true; el._touche = true; el.classList.add('is-drag'); el.setPointerCapture(e.pointerId); if (el._tw) el._tw.kill(); set(fromEvent(e)); });
    el.addEventListener('pointermove', (e) => { if (drag) set(fromEvent(e)); });
    const stop = () => { drag = false; el.classList.remove('is-drag'); };
    el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop);
    poignee.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
      if (k) { el._touche = true; set(el._pos + k); e.preventDefault(); }
      if (e.key === 'Home') { set(0); e.preventDefault(); } if (e.key === 'End') { set(100); e.preventDefault(); }
    });
    el._set = set;
  };
  $$('[data-ba]').forEach(initBA);

  /* ---------- Galerie : vignettes ---------- */
  const scene = $('#scene'), label = $('#scene-label'), vignettes = $$('.vignette');
  const choisir = (btn) => {
    if (btn.classList.contains('is-on')) return;
    vignettes.forEach((v) => { const on = v === btn; v.classList.toggle('is-on', on); v.setAttribute('aria-selected', on); });
    const i = btn.dataset.i, apres = $('.ba__apres', scene), avant = $('.ba__avant img', scene);
    const appliquer = () => {
      apres.src = `assets/img/p${i}-apres.webp`; apres.alt = `${btn.dataset.piece} après`;
      avant.src = `assets/img/p${i}-avant.webp`; avant.alt = `${btn.dataset.piece} avant`;
      label.innerHTML = `<b>${btn.dataset.presta}</b> ${btn.dataset.piece}`;
      Promise.all([apres, avant].map((im) => (im.decode ? im.decode().catch(() => {}) : 0))).then(() => {
        scene.classList.remove('is-change');
        if (motion) { const o = { p: 92 }; scene._tw = G.to(o, { p: 50, duration: 1.2, ease: 'power3.inOut', onUpdate: () => scene._set(o.p) }); }
        else scene._set(50);
      });
    };
    if (!motion) { appliquer(); return; }
    scene.classList.add('is-change'); setTimeout(appliquer, 260);
  };
  vignettes.forEach((v) => v.addEventListener('click', () => choisir(v)));
  if ('IntersectionObserver' in window) new IntersectionObserver(([en], o) => {
    if (!en.isIntersecting) return;
    for (let i = 2; i <= 6; i++) ['avant', 'apres'].forEach((k) => { new Image().src = `assets/img/p${i}-${k}.webp`; });
    o.disconnect();
  }, { rootMargin: '800px' }).observe(scene);

  /* ---------- Tarifs : Annuel / Mensuel, pastille qui glisse, prix qui roulent ---------- */
  const bascule = $('.bascule'), pastille = $('.bascule__pastille'), boutons = $$('.bascule button');
  const placerPastille = () => {
    const on = boutons.find((b) => b.classList.contains('is-on'));
    pastille.style.width = on.offsetWidth + 'px'; pastille.style.transform = `translateX(${on.offsetLeft - 4}px)`;
  };
  bascule.classList.add('is-pret'); placerPastille(); window.addEventListener('resize', placerPastille);
  if (document.fonts) document.fonts.ready.then(placerPastille);
  boutons.forEach((b) => b.addEventListener('click', () => {
    if (b.classList.contains('is-on')) return;
    const mode = b.dataset.mode;
    boutons.forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on); });
    placerPastille();
    const els = $$('.tarifs [data-' + mode + ']');
    if (!motion) { els.forEach((el) => { el.textContent = el.dataset[mode]; }); return; }
    G.to(els, { yPercent: -60, opacity: 0, duration: .22, ease: 'power2.in', stagger: .015, onComplete() {
      els.forEach((el) => { el.textContent = el.dataset[mode]; });
      G.fromTo(els, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: 'power3.out', stagger: .015 });
    } });
  }));

  /* =========================================================
     Motion au scroll
     ========================================================= */
  if (!motion) return;

  // Hero : entrée
  G.from('.hero__titre .line > span', { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: .1, delay: .15 });
  G.from('[data-hero]', { y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, delay: .45 });
  G.fromTo('.hero__video', { scale: 1.08 }, { scale: 1, duration: 2.2, ease: 'power3.out' });

  // Titres ligne à ligne + reveals
  $$('[data-lines]').forEach((el) => {
    G.from($$('.line > span', el), { yPercent: 105, duration: 1.15, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-reveal]').forEach((el) => {
    G.from(el, { y: 32, opacity: 0, duration: 1.05, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // Chiffres : compteur à rouleaux, chaque chiffre défile vers le haut jusqu'à sa valeur
  $$('[data-count]').forEach((el) => {
    const final = el.textContent;
    el.setAttribute('aria-label', final);
    el.innerHTML = '';
    const pistes = [];
    [...final].forEach((ch) => {
      if (/\d/.test(ch)) {
        const col = document.createElement('span'); col.className = 'odo'; col.setAttribute('aria-hidden', 'true');
        const piste = document.createElement('span'); piste.className = 'odo__piste';
        piste.innerHTML = Array.from({ length: 20 }, (_, k) => `<span>${k % 10}</span>`).join('');
        col.appendChild(piste); el.appendChild(col);
        pistes.push({ piste, cible: 10 + +ch });
      } else {
        const s = document.createElement('span'); s.className = 'odo__fixe'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; el.appendChild(s);
      }
    });
    const tl = G.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    pistes.forEach(({ piste, cible }, k) => {
      tl.fromTo(piste, { yPercent: 0 }, { yPercent: -(cible / 20) * 100, duration: 1.6 + k * .12, ease: 'expo.out' }, k * .08);
    });
  });

  // Cartes prestations : entrée en clip + balayage de démonstration
  G.from('.carte', { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.cartes', start: 'top 82%', once: true } });
  $$('[data-balaye]').forEach((el, k) => {
    const o = { p: 50 };
    G.timeline({ delay: .6 + k * .25, scrollTrigger: { trigger: el, start: 'top 70%', once: true } })
      .to(o, { p: 12, duration: .9, ease: 'power2.inOut', onUpdate: () => { if (!el._touche) el._set(o.p); } })
      .to(o, { p: 88, duration: 1.2, ease: 'power2.inOut', onUpdate: () => { if (!el._touche) el._set(o.p); } })
      .to(o, { p: 50, duration: .8, ease: 'power2.inOut', onUpdate: () => { if (!el._touche) el._set(o.p); } });
  });
  G.fromTo('.carte__video', { yPercent: -3, scale: 1.08 }, { yPercent: 3, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.prestations', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Plateforme : la capture glisse depuis la droite, le fil se trace de 01 à 03
  G.from('.plateforme__app', { x: 140, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.plateforme', start: 'top 72%', once: true } });
  const fil = $('.etapes__fil'), etapes = $$('.etapes li');
  etapes.forEach((li) => li.classList.add('is-attente'));
  fil.style.setProperty('--f', 0);
  const filO = { f: 0 };
  G.to(filO, { f: 1, ease: 'none', scrollTrigger: { trigger: '.etapes', start: 'top 78%', end: 'bottom 55%', scrub: .6 }, onUpdate: () => {
    fil.style.setProperty('--f', filO.f);
    etapes.forEach((li, k) => li.classList.toggle('is-attente', filO.f < k / (etapes.length - 1) - .02));
  } });
  G.from(etapes, { x: -20, opacity: 0, duration: .9, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.etapes', start: 'top 85%', once: true } });

  // Essai : le bloc s'ouvre
  G.fromTo('.essai__bloc', { clipPath: 'inset(10% 6% 10% 6% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.essai__bloc', start: 'top 85%', once: true } });

  // Tarifs : la colonne conseillée se dresse, les lignes tombent en cascade
  G.from('.tableau thead th', { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: '.tableau', start: 'top 82%', once: true } });
  G.from('.tableau tbody tr', { opacity: 0, y: 12, duration: .7, ease: 'power3.out', stagger: .06, delay: .25, scrollTrigger: { trigger: '.tableau', start: 'top 82%', once: true } });
  G.from('.tableau .oui', { scale: 0, rotation: -35, duration: .55, ease: 'back.out(2.4)', stagger: .1, delay: .7, scrollTrigger: { trigger: '.tableau', start: 'top 82%', once: true } });
  G.from('.forfait', { y: 28, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '.forfaits', start: 'top 85%', once: true } });

  const mm = G.matchMedia();
  mm.add('(min-width: 900px)', () => {
    // Hero : la vidéo se rétracte en carte arrondie pendant qu'on quitte l'écran
    G.fromTo('.hero__media', { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(7% 3.5% 0% 3.5% round 32px)', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__contenu', { y: -90, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });

    // Plateforme : légère parallaxe de la capture
    G.fromTo('.plateforme__app img', { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.plateforme', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // Scène avant/après : s'ouvre à l'arrivée puis fait un balayage de démonstration (sans épinglage)
  G.from('.ba--scene', { clipPath: 'inset(6% 6% 6% 6% round 28px)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.ba--scene', start: 'top 85%', once: true } });
  const oS = { p: 50 };
  const majS = () => { if (!scene._touche) scene._set(oS.p); };
  G.timeline({ delay: .3, scrollTrigger: { trigger: '.ba--scene', start: 'top 65%', once: true } })
    .to(oS, { p: 8, duration: 1, ease: 'power2.inOut', onUpdate: majS })
    .to(oS, { p: 92, duration: 1.4, ease: 'power2.inOut', onUpdate: majS })
    .to(oS, { p: 50, duration: .9, ease: 'power2.inOut', onUpdate: majS });

  // Picto scroll : s'efface dès qu'on descend
  G.to('.hero__scroll', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '18% top', scrub: true } });

  window.addEventListener('load', () => ST.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
})();
