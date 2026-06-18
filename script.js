document.addEventListener('DOMContentLoaded', () => {

  // Mode focus : true quand le viewer vidéo est ouvert (on gèle l'arrière-plan)
  const viewerOpen = () => document.body.classList.contains('viewer-open');

  // â”€â”€â”€ Shared drag engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let drag = null;
  let resize = null;

  document.addEventListener('mousemove', e => {
    if (resize) {
      const { el: re, dir, startX, startY, startW, startH, startL, startT } = resize;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      const minW = 520, minH = 380;
      let nW = startW, nH = startH, nL = startL, nT = startT;
      if (dir.includes('e')) nW = Math.max(minW, startW + dx);
      if (dir.includes('s')) nH = Math.max(minH, startH + dy);
      if (dir.includes('w')) { nW = Math.max(minW, startW - dx); nL = startL + (startW - nW); }
      if (dir.includes('n')) { nH = Math.max(minH, startH - dy); nT = startT + (startH - nH); }
      re.style.width  = nW + 'px';
      re.style.height = nH + 'px';
      re.style.left   = nL + 'px';
      re.style.top    = nT + 'px';
    }
    if (!drag) return;
    const now = performance.now(), dt = now - drag.lt;
    if (dt > 0 && dt < 80) {
      drag.vx = drag.vx * 0.4 + ((e.clientX - drag.lx) / dt) * 0.6;
      drag.vy = drag.vy * 0.4 + ((e.clientY - drag.ly) / dt) * 0.6;
    }
    drag.lt = now; drag.lx = e.clientX; drag.ly = e.clientY;
    const mL = window.innerWidth  - drag.el.offsetWidth;
    const mT = window.innerHeight - drag.el.offsetHeight;
    drag.el.style.left = Math.max(0, Math.min(drag.wx + e.clientX - drag.sx, mL)) + 'px';
    drag.el.style.top  = Math.max(0, Math.min(drag.wy + e.clientY - drag.sy, mT)) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (resize) {
      resize.el.classList.remove('pw-resizing');
      resize = null;
      document.body.classList.remove('pw-resizing');
      delete document.body.dataset.resizeDir;
    }
    if (!drag) return;
    document.body.classList.remove('win-dragging');
    const el = drag.el;
    let vx = drag.vx * 16, vy = drag.vy * 16;
    drag = null;
    if (Math.sqrt(vx * vx + vy * vy) < 0.2) return;
    let x = parseFloat(el.style.left), y = parseFloat(el.style.top);
    (function bounce() {
      x += vx; y += vy;
      vx *= 0.88; vy *= 0.88;
      const mX = window.innerWidth  - el.offsetWidth;
      const mY = window.innerHeight - el.offsetHeight;
      if (x < 0)  { x = 0;  vx =  Math.abs(vx) * 0.45; }
      if (x > mX) { x = mX; vx = -Math.abs(vx) * 0.45; }
      if (y < 0)  { y = 0;  vy =  Math.abs(vy) * 0.45; }
      if (y > mY) { y = mY; vy = -Math.abs(vy) * 0.45; }
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      if (Math.abs(vx) > 0.2 || Math.abs(vy) > 0.2) requestAnimationFrame(bounce);
    })();
  });

  function initDrag(winEl, titlebarEl, skipFn) {
    titlebarEl.addEventListener('mousedown', e => {
      if (window.innerWidth <= 960) return;
      if (e.target.closest('.tl') || e.target.closest('a') || (skipFn && skipFn())) return;
      const rect = winEl.getBoundingClientRect();
      Object.assign(winEl.style, {
        position: 'fixed',
        top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
        margin: '0', maxWidth: 'none', maxHeight: 'none', transition: 'none',
      });
      winEl.offsetHeight;
      drag = {
        el: winEl, sx: e.clientX, sy: e.clientY,
        wx: rect.left, wy: rect.top,
        vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, lt: performance.now(),
      };
      document.body.classList.add('win-dragging');
      e.preventDefault();
    });
  }

  // â”€â”€â”€ Main window controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const mainWindow = document.getElementById('mainWindow');
  const winRestore = document.getElementById('winRestore');
  let winState = 'normal';

  document.getElementById('tlRed')?.addEventListener('click', () => {
    if (winState === 'minimized') restoreFromMin();
    winState = 'closed';
    mainWindow.classList.add('win-closed');
    winRestore.classList.add('visible');
    displaceChatWidget();
  });

  winRestore?.addEventListener('click', () => {
    mainWindow.classList.remove('win-closed');
    winRestore.classList.remove('visible');
    winState = 'normal';
    restoreChatWidget();
  });

  document.getElementById('tlYellow')?.addEventListener('click', () => {
    if (winState === 'minimized') restoreFromMin();
    else if (winState === 'normal') { minimizeWin(); displaceChatWidget(); }
  });

  mainWindow?.addEventListener('click', e => {
    if (winState === 'minimized' && !e.target.closest('.tl')) restoreFromMin();
  });

  document.getElementById('tlGreen')?.addEventListener('click', () => {
    if (winState === 'maximized') { mainWindow.classList.remove('win-maximized'); winState = 'normal'; }
    else if (winState === 'normal') { mainWindow.classList.add('win-maximized'); winState = 'maximized'; }
  });

  initDrag(mainWindow, document.querySelector('.window-titlebar'), () => winState !== 'normal');


  function minimizeWin() {
    const rect = mainWindow.getBoundingClientRect();
    const pillW = 240, pillH = 42;
    mainWindow.style.transition = 'none';
    Object.assign(mainWindow.style, {
      position: 'fixed',
      top: rect.top + 'px', left: rect.left + 'px',
      width: rect.width + 'px', height: rect.height + 'px',
      margin: '0', maxWidth: 'none', maxHeight: 'none',
    });
    mainWindow.dataset.orig = JSON.stringify({ top: rect.top, left: rect.left, w: rect.width, h: rect.height });
    mainWindow.offsetHeight;
    const tx = 'top .44s cubic-bezier(.4,0,.2,1),left .44s cubic-bezier(.4,0,.2,1),width .44s cubic-bezier(.4,0,.2,1),height .44s cubic-bezier(.4,0,.2,1),border-radius .44s ease';
    mainWindow.style.transition   = tx;
    mainWindow.style.top          = `${window.innerHeight - pillH - 16}px`;
    mainWindow.style.left         = `${(window.innerWidth - pillW) / 2}px`;
    mainWindow.style.width        = `${pillW}px`;
    mainWindow.style.height       = `${pillH}px`;
    mainWindow.style.borderRadius = '24px';
    mainWindow.classList.add('win-minimized');
    winState = 'minimized';
  }

  function restoreFromMin() {
    const { top, left, w, h } = JSON.parse(mainWindow.dataset.orig);
    const tx = 'top .44s cubic-bezier(.4,0,.2,1),left .44s cubic-bezier(.4,0,.2,1),width .44s cubic-bezier(.4,0,.2,1),height .44s cubic-bezier(.4,0,.2,1),border-radius .44s ease';
    Object.assign(mainWindow.style, { transition: tx, top: `${top}px`, left: `${left}px`, width: `${w}px`, height: `${h}px`, borderRadius: '18px' });
    mainWindow.classList.remove('win-minimized');
    winState = 'normal';
    setTimeout(() => { mainWindow.style.cssText = ''; }, 450);
    restoreChatWidget();
  }

  function displaceChatWidget() {
    const widget = document.getElementById('chatWidget');
    const toggle = document.getElementById('chatToggle');
    const panel  = document.getElementById('chatPanel');
    if (!widget || !toggle) return;
    panel?.classList.remove('open');
    const r  = toggle.getBoundingClientRect();
    const dx = window.innerWidth  / 2 - (r.left + r.width  / 2);
    const dy = window.innerHeight / 2 - (r.top  + r.height / 2);
    widget.style.transform = `translate(${dx}px, ${dy}px)`;
    widget.classList.add('displaced');
  }

  function restoreChatWidget() {
    const widget = document.getElementById('chatWidget');
    if (!widget) return;
    widget.style.transform = '';
    widget.classList.remove('displaced');
  }

  // â”€â”€â”€ Smooth inertia scroll â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function initSmoothScroll(el) {
    let current = 0;
    let target  = 0;
    let raf     = null;
    const LERP  = 0.09;

    el.addEventListener('wheel', e => {
      e.preventDefault();
      target = Math.min(
        Math.max(target + e.deltaY, 0),
        el.scrollHeight - el.clientHeight
      );
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: false });

    function loop() {
      const d = target - current;
      current += d * LERP;
      el.scrollTop = current;
      if (Math.abs(d) > 0.3) {
        raf = requestAnimationFrame(loop);
      } else {
        current = target;
        el.scrollTop = current;
        raf = null;
      }
    }
  }

  // â”€â”€â”€ Project windows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let pwTopZ = 50;

  const PROJECTS = [
    {
      id: 'maisons-du-monde',
      title: 'Maisons du Monde Business — Landing page',
      logo: 'assets/maisonsdumonde/logo_mdm.svg',
      category: 'Product Design · B2B',
      context: 'Refonte complète de la plateforme B2B Rhinov intégrée à l\'univers Maisons du Monde. De la research au delivery : tunnel de commande, simulateur de budget, pages secteur, design system.',
      figma: 'https://www.figma.com/design/KbGmDnR1LTCRJwM6IjZApg/Johan-is-designing?node-id=2023-7663&p=f&t=4PnVbQX3Wx3FTjXY-0',
      specs: [
        { label: 'Année',   value: '2024â€“26' },
        { label: 'Rôle',    value: 'Lead UI/UX' },
        { label: 'Client',  value: 'MdM &times; Rhinov' },
        { label: 'Secteur', value: 'B2B · Ameublement' },
      ],
      images: [
        { src: 'assets/maisonsdumonde/allstar-1.png' },
        { src: 'assets/maisonsdumonde/Frame 17.jpg' },
        { src: 'assets/maisonsdumonde/Frame 18.jpg' },
        { src: 'assets/maisonsdumonde/Frame 19.jpg' },
      ],
      tags: ['Figma', 'Design System', 'UX Research', 'B2B', 'Web'],
    },
    {
      id: 'rhinov-rebrand',
      title: 'Rhinov — Rebranding',
      logo: 'assets/rhinov-rebrand/logo-rhinov.svg',
      category: 'Brand Design · Rhinov',
      context: 'Refonte de l\'identité visuelle de Rhinov : nouveau logo, charte graphique, motion design et déclinaisons digitales. Du concept au déploiement sur l\'ensemble des supports.',
      collaborator: { name: 'Constance Belloni', url: 'https://constancebelloni.com' },
      figma: 'https://www.figma.com/design/KbGmDnR1LTCRJwM6IjZApg/Johan-x-Rhinov?node-id=0-1&p=f&t=4PnVbQX3Wx3FTjXY-0',
      specs: [
        { label: 'Année',   value: '2025' },
        { label: 'Rôle',    value: 'Lead Designer' },
        { label: 'Client',  value: 'Rhinov' },
        { label: 'Secteur', value: 'Branding · Digital' },
      ],
      images: [
        { src: 'assets/rhinov-rebrand/logotype.jpg' },
        { src: 'assets/rhinov-rebrand/Frame 24.jpg' },
        { src: 'assets/rhinov-rebrand/mock-rhinov-1.jpeg' },
        { src: 'assets/rhinov-rebrand/mock-rhinov-2.jpeg', zoom: true },
        [{ src: 'assets/rhinov-rebrand/STORY.jpg' },   { src: 'assets/rhinov-rebrand/STORY-1.jpg' }],
        [{ src: 'assets/rhinov-rebrand/STORY-2.jpg' }, { src: 'assets/rhinov-rebrand/STORY-3.jpg' }],
      ],
      tags: ['Figma', 'Branding', 'Motion', 'Identité', 'Charte'],
    },
  ];

  function buildProjectWin(project) {
    const el = document.createElement('div');
    el.className = 'project-win';
    el.id = `pw-${project.id}`;

    const imgs = project.images || [];

    const imgsHtml = imgs.map((rowOrItem, i) => {
      const row = Array.isArray(rowOrItem) ? rowOrItem : [rowOrItem];
      const is2col = row.length === 2;
      return `
      <div class="pw-group ${is2col ? 'pw-group-2col' : ''} pw-reveal">
        ${row.map((item, j) => `
          <div class="pw-imgwrap">
            <img class="pw-float-img${item.zoom ? ' pw-float-img-zoom' : ''}" src="${item.src}" alt=""
                 loading="${i === 0 && j === 0 ? 'eager' : 'lazy'}">
          </div>`).join('')}
      </div>`;
    }).join('');

    const specRows = (project.specs || []).map(s =>
      `<div class="pw-spec-row"><dt>${s.label}</dt><dd>${s.value}</dd></div>`
    ).join('');

    el.innerHTML = `
      <div class="pw-titlebar">
        <div class="traffic-lights">
          <span class="tl tl-red" data-icon="&times;"></span>
          <span class="tl tl-yellow" data-icon="âˆ'"></span>
          <span class="tl tl-green" data-icon="+"></span>
        </div>
        <span class="pw-title-label">${project.title}</span>
        <div style="width:60px"></div>
      </div>

      <div class="pw-body">

        <div class="pw-main">

          <!-- Intro strip -->
          <div class="pw-ed-intro pw-reveal">
            <span class="pw-cat-tag">${project.category} — ${(project.specs || [])[0]?.value || ''}</span>
          </div>

          ${imgsHtml}

          <!-- Context text -->
          <div class="pw-context-block pw-reveal" style="--rv-delay:.06s">
            <p>${project.context}</p>
          </div>

          <!-- Figma embed -->
          ${project.figma ? `
          <div class="pw-figma-embed pw-reveal" style="--rv-delay:.07s">
            <div class="pw-figma-label">Explorer le projet</div>
            <iframe
              src="https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(project.figma)}"
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>` : ''}

          <!-- Closing Trexa-style -->
          <div class="pw-closing pw-reveal" style="--rv-delay:.08s">
            <div class="pw-closing-rule">
              <div class="pw-author-avatar"></div>
            </div>
            <span class="pw-closing-name">Johan Trigeard</span>
            <span class="pw-closing-role">Lead UI/UX Designer · B2B · Product</span>
            ${project.collaborator ? `<p class="pw-closing-collab">Co-réalisé avec <a href="${project.collaborator.url}" target="_blank" rel="noopener">${project.collaborator.name}</a></p>` : ''}
            <a href="mailto:johan.trigeard@gmail.com" class="pw-cta">Get in touch</a>
          </div>

        </div>

        <aside class="pw-aside">
          <div class="pw-aside-top">
            ${project.logo ? `<img class="pw-aside-logo" src="${project.logo}" alt="${project.title} logo">` : ''}
            <span class="pw-aside-proj-lbl">Projet</span>
            <h3 class="pw-aside-title">${project.title.toUpperCase()}</h3>
            <p class="pw-aside-cat">${project.category}</p>
            <p class="pw-aside-ctx">${project.context}</p>
          </div>
          <div class="pw-aside-bottom">
            <dl class="pw-specs">${specRows}</dl>
            <div class="pw-aside-tags">
              ${project.tags.map(t => `<span class="pw-tag">${t}</span>`).join('')}
            </div>
          </div>
        </aside>

      </div>

      <div class="pw-rh" data-dir="n"></div>
      <div class="pw-rh" data-dir="ne"></div>
      <div class="pw-rh" data-dir="e"></div>
      <div class="pw-rh" data-dir="se"></div>
      <div class="pw-rh" data-dir="s"></div>
      <div class="pw-rh" data-dir="sw"></div>
      <div class="pw-rh" data-dir="w"></div>
      <div class="pw-rh" data-dir="nw"></div>
    `;

    // Traffic lights
    el.querySelector('.tl-red').addEventListener('click', () => {
      el.style.display = 'none';
      el.classList.remove('pw-open');
    });
    el.querySelector('.tl-yellow').addEventListener('click', () => {
      if (el.classList.contains('pw-minimized')) restorePW(el);
      else minimizePW(el);
    });
    el.addEventListener('click', e => {
      if (el.classList.contains('pw-minimized') && !e.target.closest('.tl')) restorePW(el);
    });
    el.querySelector('.tl-green').addEventListener('click', () => {
      el.style.transition = '';
      if (el.classList.contains('pw-maximized')) {
        el.classList.remove('pw-maximized');
        const s = el.dataset.preMax ? JSON.parse(el.dataset.preMax) : null;
        if (s) { el.style.left = s.l; el.style.top = s.t; el.style.width = s.w; el.style.height = s.h; }
      } else {
        el.dataset.preMax = JSON.stringify({ l: el.style.left, t: el.style.top, w: el.style.width, h: el.style.height });
        el.classList.add('pw-maximized');
      }
    });

    // Multi-edge resize
    el.querySelectorAll('.pw-rh').forEach(handle => {
      handle.addEventListener('mousedown', e => {
        e.stopPropagation();
        const rect = el.getBoundingClientRect();
        const dir = handle.dataset.dir;
        el.classList.add('pw-resizing');
        document.body.classList.add('pw-resizing');
        document.body.dataset.resizeDir = dir;
        resize = { el, dir, startX: e.clientX, startY: e.clientY,
          startW: rect.width, startH: rect.height, startL: rect.left, startT: rect.top };
        e.preventDefault();
      });
    });

    el.addEventListener('mousedown', () => focusPW(el), true);
    initDrag(el, el.querySelector('.pw-titlebar'));
    document.body.appendChild(el);

    const mainEl = el.querySelector('.pw-main');

    // Smooth inertia scroll
    initSmoothScroll(mainEl);

    // Scroll reveal (rooted to pw-main)
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('pw-in-view');
          revObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, root: mainEl });
    el.querySelectorAll('.pw-reveal').forEach(r => revObs.observe(r));

    return el;
  }

  function minimizePW(el) {
    const rect = el.getBoundingClientRect();
    const pillW = 200, pillH = 42;
    el.style.transition = 'none';
    Object.assign(el.style, { position:'fixed', top:rect.top+'px', left:rect.left+'px', width:rect.width+'px', height:rect.height+'px', margin:'0' });
    el.dataset.origPW = JSON.stringify({ t:rect.top, l:rect.left, w:rect.width, h:rect.height });
    el.offsetHeight;
    const tx = 'top .44s cubic-bezier(.4,0,.2,1),left .44s cubic-bezier(.4,0,.2,1),width .44s cubic-bezier(.4,0,.2,1),height .44s cubic-bezier(.4,0,.2,1),border-radius .44s ease';
    el.style.transition = tx;
    el.style.top          = `${window.innerHeight - pillH - 20}px`;
    el.style.left         = `${(window.innerWidth - pillW) / 2 + 140}px`;
    el.style.width        = `${pillW}px`;
    el.style.height       = `${pillH}px`;
    el.style.borderRadius = '24px';
    el.classList.add('pw-minimized');
  }

  function restorePW(el) {
    if (!el.classList.contains('pw-minimized')) return;
    const { t, l, w, h } = JSON.parse(el.dataset.origPW);
    const tx = 'top .44s cubic-bezier(.4,0,.2,1),left .44s cubic-bezier(.4,0,.2,1),width .44s cubic-bezier(.4,0,.2,1),height .44s cubic-bezier(.4,0,.2,1),border-radius .44s ease';
    el.style.transition = tx;
    el.style.top = t+'px'; el.style.left = l+'px'; el.style.width = w+'px'; el.style.height = h+'px'; el.style.borderRadius = '16px';
    el.classList.remove('pw-minimized');
  }

  function openProject(projectId) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    if (window.innerWidth <= 960) {
      openProjectSheet(project);
      return;
    }

    let el = document.getElementById(`pw-${project.id}`);
    if (!el) el = buildProjectWin(project);

    // Center if no position saved
    if (!el.style.left) {
      const w = Math.min(1100, window.innerWidth - 40);
      const h = Math.min(760, window.innerHeight - 40);
      el.style.left   = Math.round((window.innerWidth  - w) / 2) + 'px';
      el.style.top    = Math.round((window.innerHeight - h) / 2) + 'px';
      el.style.width  = w + 'px';
      el.style.height = h + 'px';
    }

    el.style.display = 'flex';
    el.classList.remove('pw-minimized');
    focusPW(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('pw-open')));
  }

  function focusPW(el) {
    el.style.zIndex = ++pwTopZ;
  }

  function openMosaic() {
    if (document.getElementById('pw-mosaic')) return;

    const overlay = document.createElement('div');
    overlay.id = 'pw-mosaic';
    overlay.className = 'pw-mosaic';

    const cardsHtml = carouselProjects.map((p, i) => `
      <div class="pw-mosaic-card" data-id="${p.id}" style="--i:${i}; background-color:${p.color}; background-image:url('${p.img}')">
        <div class="pw-mosaic-card-overlay"></div>
        <img class="pw-mosaic-logo" data-idx="${i}" src="" alt="${p.title}">
        <div class="pw-mosaic-info">
          <span class="pw-mosaic-cat">${p.cat}</span>
          <h3 class="pw-mosaic-title">${p.title}</h3>
        </div>
      </div>`).join('');

    overlay.innerHTML = `
      <div class="pw-mosaic-bg"></div>
      <div class="pw-mosaic-inner">
        <div class="pw-mosaic-header">
          <span class="pw-mosaic-label">Projets</span>
          <button class="pw-mosaic-close">&times;</button>
        </div>
        <div class="pw-mosaic-grid">${cardsHtml}</div>
      </div>`;

    document.body.appendChild(overlay);

    // Logos (reuse svgColored)
    overlay.querySelectorAll('.pw-mosaic-logo').forEach(img => {
      const p = carouselProjects[+img.dataset.idx];
      if (p.logoColor) {
        img.style.opacity = '1';
        svgColored(p.logo, p.logoColor)
          .then(url => { img.src = url; })
          .catch(() => { img.style.filter = 'brightness(0) invert(1)'; img.src = p.logo; });
      } else {
        img.style.filter = 'brightness(0) invert(1)';
        img.style.opacity = '0.88';
        img.src = p.logo;
      }
    });

    function closeMosaic() {
      overlay.classList.remove('pw-mosaic-open');
      overlay.classList.add('pw-mosaic-closing');
      setTimeout(() => overlay.remove(), 560);
    }

    overlay.querySelector('.pw-mosaic-close').addEventListener('click', closeMosaic);
    overlay.querySelector('.pw-mosaic-bg').addEventListener('click', closeMosaic);

    overlay.querySelectorAll('.pw-mosaic-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        closeMosaic();
        setTimeout(() => openProject(id), 320);
      });
    });

    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('pw-mosaic-open')));
  }

  function openProjectSheet(project) {
    document.querySelector('.pw-sheet-wrap')?.remove();

    const imgs = project.images || [];
    const imgsHtml = imgs.map((rowOrItem, i) => {
      const row = Array.isArray(rowOrItem) ? rowOrItem : [rowOrItem];
      const is2col = row.length === 2;
      return `
      <div class="pw-group ${is2col ? 'pw-group-2col' : ''}">
        ${row.map((item, j) => `
          <div class="pw-imgwrap">
            <img class="pw-float-img${item.zoom ? ' pw-float-img-zoom' : ''}" src="${item.src}" alt="" loading="${i === 0 && j === 0 ? 'eager' : 'lazy'}">
          </div>`).join('')}
      </div>`;
    }).join('');

    const specRows = (project.specs || []).map(s =>
      `<div class="pw-spec-row"><dt>${s.label}</dt><dd>${s.value}</dd></div>`
    ).join('');

    const wrap = document.createElement('div');
    wrap.className = 'pw-sheet-wrap';
    wrap.innerHTML = `
      <div class="pw-sheet-backdrop"></div>
      <div class="pw-sheet">
        <div class="pw-sheet-handle-wrap">
          <div class="pw-sheet-handle"></div>
        </div>
        <div class="pw-sheet-header">
          <div class="pw-sheet-meta">
            <div class="pw-sheet-title-wrap">
              <span class="pw-cat-tag">${project.category}</span>
              <h2 class="pw-sheet-title">${project.title}</h2>
            </div>
          </div>
          <button class="pw-sheet-close" aria-label="Fermer">&times;</button>
        </div>
        <div class="pw-sheet-scroll">
          ${imgsHtml}
          <div class="pw-context-block">
            <p>${project.context}</p>
          </div>
          ${project.figma ? `
          <div class="pw-figma-link-mobile">
            <a href="${project.figma}" target="_blank" rel="noopener" class="pw-figma-btn">
              <svg width="14" height="14" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Z" fill="currentColor" opacity=".6"/><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0Z" fill="currentColor" opacity=".4"/><path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19Z" fill="currentColor" opacity=".9"/><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5Z" fill="currentColor"/><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5Z" fill="currentColor" opacity=".7"/></svg>
              Explorer le projet Figma
            </a>
          </div>` : ''}
          <div class="pw-sheet-info">
            <dl class="pw-specs">${specRows}</dl>
            <div class="pw-aside-tags">
              ${project.tags.map(t => `<span class="pw-tag">${t}</span>`).join('')}
            </div>
          </div>
          <div class="pw-closing">
            <div class="pw-closing-rule"><div class="pw-author-avatar"></div></div>
            <span class="pw-closing-name">Johan Trigeard</span>
            <span class="pw-closing-role">Lead UI/UX Designer · B2B · Product</span>
            ${project.collaborator ? `<p class="pw-closing-collab">Co-réalisé avec <a href="${project.collaborator.url}" target="_blank" rel="noopener">${project.collaborator.name}</a></p>` : ''}
            <a href="mailto:johan.trigeard@gmail.com" class="pw-cta">Get in touch</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';

    const sheet = wrap.querySelector('.pw-sheet');
    const backdrop = wrap.querySelector('.pw-sheet-backdrop');
    const scrollEl = wrap.querySelector('.pw-sheet-scroll');

    function closeSheet() {
      sheet.style.transform = 'translateY(100%)';
      backdrop.style.opacity = '0';
      document.body.style.overflow = '';
      setTimeout(() => wrap.remove(), 450);
    }

    wrap.querySelector('.pw-sheet-close').addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    let touchStartY = 0;
    sheet.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    sheet.addEventListener('touchmove', e => {
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 0 && scrollEl.scrollTop <= 0) {
        sheet.style.transition = 'none';
        sheet.style.transform = `translateY(${Math.min(dy, window.innerHeight * 0.6)}px)`;
      }
    }, { passive: true });

    sheet.addEventListener('touchend', e => {
      const dy = e.changedTouches[0].clientY - touchStartY;
      sheet.style.transition = '';
      if (dy > 80 && scrollEl.scrollTop <= 0) {
        closeSheet();
      } else {
        sheet.style.transform = 'translateY(0)';
      }
    });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.classList.add('pw-sheet-active');
      sheet.style.transform = 'translateY(0)';
      backdrop.style.opacity = '1';
    }));
  }

  // XP bar
  requestAnimationFrame(() => {
    setTimeout(() => {
      const xp = document.querySelector('.xp-fill');
      if (xp) xp.style.width = xp.dataset.width + '%';
    }, 400);
  });

  // Skill bars
  setTimeout(() => {
    document.querySelectorAll('.skill-fill').forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  }, 600);

  // Stats counter
  document.querySelectorAll('.stat-num').forEach(counter => {
    const target = parseInt(counter.dataset.target, 10);
    if (!Number.isFinite(target)) return; // ex. BPM : géré à part
    const suffix = counter.dataset.suffix || '';
    const steps  = 60;
    let step = 0;
    setTimeout(() => {
      const timer = setInterval(() => {
        step++;
        counter.textContent = Math.min(Math.round(target / steps * step), target) + suffix;
        if (step >= steps) clearInterval(timer);
      }, 1400 / steps);
    }, 800);
  });

  // Nav pills
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // â”€â”€â”€ Card entrance animations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cards = document.querySelectorAll('.bento-grid .card');

  function revealCard(card, delay) {
    setTimeout(() => {
      card.classList.add('card-visible');
      card.addEventListener('animationend', () => {
        card.classList.remove('card-visible');
        card.classList.add('card-entered');
      }, { once: true });
    }, delay);
  }

  if (window.innerWidth > 960) {
    cards.forEach((card, i) => revealCard(card, 80 + i * 60));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealCard(entry.target, 0);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    cards.forEach(card => observer.observe(card));
  }

  // â”€â”€â”€ Portfolio carousel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const carouselProjects = [
    { title: 'Maisons du Monde', cat: 'Product Design', color: '#2C3A28', img: 'assets/maisonsdumonde/chambre.jpg', logo: 'assets/maisonsdumonde/logo_mdm.svg',                        id: 'maisons-du-monde' },
    { title: 'Rhinov Rebrand',   cat: 'Brand Design',   color: '#0f0f0f', img: 'assets/rhinov-rebrand/element.jpg', logo: 'assets/rhinov-rebrand/logo-rhinov.svg', logoColor: '#8C6848', id: 'rhinov-rebrand' },
  ];

  let current = 0;

  const thumb   = document.getElementById('projectThumb');
  const logoEl  = document.getElementById('portfolioProjectLogo');
  const dotsEl  = document.getElementById('pdots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!thumb) return;

  // SVG color rewriter — fetch SVG, swap fill, return data URI (cached)
  const svgColorCache = {};
  async function svgColored(src, color) {
    const key = `${src}::${color}`;
    if (svgColorCache[key]) return svgColorCache[key];
    const text = await fetch(src).then(r => {
      if (!r.ok) throw new Error(`SVG fetch failed: ${r.status}`);
      return r.text();
    });
    const recolored = text
      .replace(/fill="#000100"/g, `fill="${color}"`)
      .replace(/fill="black"/g,   `fill="${color}"`)
      .replace(/fill="#000"/g,    `fill="${color}"`);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(recolored);
    svgColorCache[key] = url;
    return url;
  }

  // Build slide track
  const track = document.createElement('div');
  track.className = 'pw-carousel-track';
  carouselProjects.forEach(p => {
    const slide = document.createElement('div');
    slide.className = 'pw-carousel-slide';
    slide.style.backgroundColor = p.color;
    if (p.img) slide.style.backgroundImage = `url('${p.img}')`;
    track.appendChild(slide);
  });
  thumb.insertBefore(track, thumb.firstChild);

  function renderLogo(p) {
    if (!logoEl) return;
    if (!p.logo) { logoEl.style.display = 'none'; return; }
    logoEl.style.display = 'block';
    logoEl.style.opacity = '0';
    if (p.logoColor) {
      logoEl.style.filter = 'none';
      svgColored(p.logo, p.logoColor)
        .then(url => { logoEl.src = url; logoEl.style.opacity = '1'; })
        .catch(() => { logoEl.style.filter = 'brightness(0) invert(1)'; logoEl.src = p.logo; logoEl.style.opacity = '1'; });
    } else {
      logoEl.style.filter = 'brightness(0) invert(1)';
      logoEl.src = p.logo;
      logoEl.style.opacity = '0.88';
    }
  }

  function render(idx) {
    const p = carouselProjects[idx];
    track.style.transform = `translateX(-${idx * 100}%)`;
    // Logo: fade out then fade in new one mid-slide
    if (logoEl) {
      logoEl.style.opacity = '0';
      setTimeout(() => renderLogo(p), 180);
    }
    dotsEl.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function goTo(idx) {
    current = (idx + carouselProjects.length) % carouselProjects.length;
    render(current);
  }

  renderLogo(carouselProjects[0]);
  dotsEl.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('active', i === 0));

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  dotsEl?.querySelectorAll('.pdot').forEach((d, i) => {
    d.addEventListener('click', () => { if (i !== current) goTo(i); });
  });

  let carouselTimer;
  function startCarouselTimer() {
    clearInterval(carouselTimer);
    carouselTimer = setInterval(() => goTo(current + 1), 5000);
  }
  startCarouselTimer();

  const portfolioCard = document.querySelector('.card-portfolio');
  portfolioCard?.addEventListener('mouseenter', () => clearInterval(carouselTimer));
  portfolioCard?.addEventListener('mouseleave', () => startCarouselTimer());

  // "Tous les projets" â†' open mosaic
  document.querySelector('.portfolio-all-link')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openMosaic();
  });

  // Open project window on portfolio card click (not on controls or mosaic link)
  portfolioCard?.addEventListener('click', e => {
    if (e.target.closest('.parrow') || e.target.closest('.pdot') || e.target.closest('.portfolio-all-link')) return;
    const id = carouselProjects[current]?.id;
    if (id) openProject(id);
  });

  // â”€â”€â”€ Memoji seamless loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const memojiVid = document.querySelector('.memoji-video');
  if (memojiVid) {
    const memojiRestart = () => {
      memojiVid.currentTime = 0;
      memojiVid.play().catch(() => {});
    };
    memojiVid.addEventListener('timeupdate', () => {
      if (memojiVid.duration && memojiVid.currentTime >= memojiVid.duration - 0.15)
        memojiRestart();
    });
    memojiVid.addEventListener('ended', memojiRestart);
    memojiVid.addEventListener('stalled', () => memojiVid.play().catch(() => {}));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && memojiVid.paused) memojiVid.play().catch(() => {});
    });
    setInterval(() => {
      if (!document.hidden && !viewerOpen() && memojiVid.paused) memojiVid.play().catch(() => {});
    }, 2000);
  }

  // â”€â”€â”€ Chat widget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const chatToggle = document.getElementById('chatToggle');
  const chatPanel  = document.getElementById('chatPanel');
  const chatClose  = document.getElementById('chatClose');
  const chatNudge  = document.getElementById('chatNudge');

  const nudgeMessages = ['Pssst', 'Hey ça va ?', 'Une question ?', 'Je suis là !', 'On se connaît ?', 'Curieux ?'];
  let nudgeTimeout;

  function showNudge() {
    if (!chatNudge || chatPanel.classList.contains('open')) return;
    chatNudge.textContent = nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)];
    chatNudge.classList.add('visible');
    clearTimeout(nudgeTimeout);
    nudgeTimeout = setTimeout(() => chatNudge.classList.remove('visible'), 3500);
    setTimeout(showNudge, 10000 + Math.random() * 10000);
  }

  setTimeout(showNudge, 5000);

  chatToggle?.addEventListener('click', e => {
    e.stopPropagation();
    const widget = document.getElementById('chatWidget');
    if (widget?.classList.contains('displaced')) {
      if (winState === 'closed') {
        mainWindow.classList.remove('win-closed');
        winRestore.classList.remove('visible');
        winState = 'normal';
      } else if (winState === 'minimized') {
        restoreFromMin();
      }
      restoreChatWidget();
      return;
    }
    chatNudge?.classList.remove('visible');
    chatPanel.classList.toggle('open');
  });

  chatClose?.addEventListener('click', () => chatPanel.classList.remove('open'));

  document.addEventListener('click', e => {
    if (!e.target.closest('.chat-widget')) chatPanel?.classList.remove('open');
  });

  // ─── Hue gauge — accent dynamique ───────────────────────────
  const hueSlider = document.getElementById('hueSlider');

  function hslToRgbStr(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return `${Math.round(255 * f(0))}, ${Math.round(255 * f(8))}, ${Math.round(255 * f(4))}`;
  }

  function applyAccent(hue) {
    const root = document.documentElement.style;
    root.setProperty('--blue-rgb',      hslToRgbStr(hue, 68, 77));
    root.setProperty('--blue-mid-rgb',  hslToRgbStr(hue, 60, 67));
    root.setProperty('--blue-deep-rgb', hslToRgbStr(hue, 45, 53));
  }

  if (hueSlider) {
    applyAccent(parseInt(hueSlider.value, 10)); // défaut = violet (231), reset au refresh
    hueSlider.addEventListener('input', () => applyAccent(parseInt(hueSlider.value, 10)));
  }

  // ─── BPM + statut de vie (corrélés) ─────────────────────────
  const bpmValueEl   = document.getElementById('bpmValue');
  const statusTextEl = document.getElementById('statusText');
  if (bpmValueEl) {
    const heart = document.querySelector('.bpm-heart');

    const ACTIVITIES = [
      { label: 'Chilling',  emoji: '🛋️', min: 60,  max: 70  },
      { label: 'Designing', emoji: '🎨', min: 70,  max: 82  },
      { label: 'Ptit café', emoji: '☕', min: 74,  max: 86  },
      { label: 'Gaming',    emoji: '🎮', min: 82,  max: 96  },
      { label: 'Walking',   emoji: '🚶', min: 88,  max: 104 },
      { label: 'Training',  emoji: '🏋️', min: 120, max: 150 },
    ];
    const SLEEP = { label: 'Sleeping', emoji: '😴', min: 48, max: 56 };

    const isSleepTime = () => {
      // ancré sur l'heure de Bordeaux, pas celle du visiteur
      const parts = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris', hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
      }).formatToParts(new Date());
      const h = +parts.find(p => p.type === 'hour').value;
      const mn = +parts.find(p => p.type === 'minute').value;
      const m = h * 60 + mn;
      return m >= 22 * 60 + 30 || m < 7 * 60; // 22h30 → 7h00
    };

    let activity = isSleepTime() ? SLEEP : ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
    let bpm = Math.round((activity.min + activity.max) / 2);

    const applyActivity = a => {
      activity = a;
      if (statusTextEl) statusTextEl.textContent = a.label;
      bpm = Math.round((a.min + a.max) / 2);
    };

    const tick = () => {
      if (viewerOpen()) return;
      if (isSleepTime() && activity.label !== SLEEP.label) applyActivity(SLEEP);
      bpm += Math.round((Math.random() - 0.5) * 6);
      bpm = Math.max(activity.min, Math.min(activity.max, bpm));
      bpmValueEl.textContent = bpm;
      heart?.style.setProperty('--bpm-dur', (60 / bpm).toFixed(2) + 's');
    };

    const rotate = () => {
      if (!isSleepTime() && !viewerOpen()) applyActivity(ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]);
      setTimeout(rotate, 20000 + Math.random() * 25000); // nouveau statut toutes les 20–45s
    };

    applyActivity(activity);
    tick();
    setInterval(tick, 2200);
    setTimeout(rotate, 20000 + Math.random() * 25000);
  }

  // ─── Compteur de réunions (humour) ──────────────────────────
  const meetingsEl = document.getElementById('meetingsValue');
  if (meetingsEl) {
    const BASE = 752;                 // point de départ (clin d'œil)
    const NS   = 'edyhean-portfolio'; // namespace du compteur
    const KEY  = 'reunions';

    const fmt = n => n.toLocaleString('fr-FR');

    function animateMeetingsTo(target) {
      const start = parseInt(meetingsEl.textContent.replace(/\D/g, ''), 10) || BASE;
      if (target <= start) { meetingsEl.textContent = fmt(target); return; }
      const steps = 28, inc = (target - start) / steps;
      let i = 0;
      const t = setInterval(() => {
        i++;
        meetingsEl.textContent = fmt(Math.round(start + inc * i));
        if (i >= steps) { meetingsEl.textContent = fmt(target); clearInterval(t); }
      }, 18);
    }

    meetingsEl.textContent = fmt(BASE); // valeur immédiate, même si le réseau traîne

    // Compteur global (+1 par visite) — repli localStorage si le service ne répond pas
    fetch(`https://abacus.jasoncameron.dev/hit/${NS}/${KEY}`)
      .then(r => r.json())
      .then(d => {
        if (typeof d.value !== 'number') throw new Error('bad payload');
        animateMeetingsTo(BASE + d.value);
      })
      .catch(() => {
        const local = (parseInt(localStorage.getItem('reunions') || '0', 10) || 0) + 1;
        localStorage.setItem('reunions', local);
        animateMeetingsTo(BASE + local);
      });
  }

  // ─── Onglets Chrome (jitter léger) ──────────────────────────
  const chromeEl = document.getElementById('chromeTabs');
  if (chromeEl) {
    let tabs = 137;
    chromeEl.textContent = tabs;
    setInterval(() => {
      if (viewerOpen()) return;
      tabs += Math.round((Math.random() - 0.45) * 6); // légère tendance à monter
      tabs = Math.max(108, Math.min(214, tabs));
      chromeEl.textContent = tabs;
    }, 2400);
  }

  // ─── Tokens / jour (compteur qui défile) ────────────────────
  const tokensEl = document.getElementById('tokensDay');
  if (tokensEl) {
    let tokens = 1200000 + Math.floor(Math.random() * 80000);
    const render = () => { tokensEl.textContent = (tokens / 1e6).toFixed(2) + 'M'; };
    render();
    setInterval(() => {
      if (viewerOpen()) return;
      tokens += Math.floor(Math.random() * 6000) + 2000;
      render();
    }, 800);
  }

  // ─── Hellobar (en chantier) ─────────────────────────────────
  const hellobar = document.getElementById('hellobar');
  document.getElementById('hellobarClose')?.addEventListener('click', () => hellobar?.classList.add('hidden'));

  // ─── Brand wall — carousel de logos ─────────────────────────
  const BRANDS = [
    { name: 'Maisons du Monde', src: 'assets/maisonsdumonde/logo_mdm.svg' },
    { name: 'Rhinov',           src: 'assets/rhinov-rebrand/logo-rhinov.svg' },
    { name: 'Activision',       src: 'assets/Activision.svg' },
    { name: 'Webedia',          src: 'assets/Webedia-logo-2022.svg' },
    { name: 'Samsung',          src: 'assets/Samsung.svg' },
    { name: 'Lapeyre',          src: 'assets/lapeyre.svg' },
    { name: 'Ledvance',         src: 'assets/ledvance.svg' },
    { name: 'ixina',            src: 'assets/ixina.svg' },
  ];
  const brandsTrack = document.getElementById('brandsTrack');
  if (brandsTrack && BRANDS.length) {
    const set = BRANDS.map(b => `<img src="${b.src}" alt="${b.name}" title="${b.name}">`).join('');
    brandsTrack.innerHTML = set + set; // dupliqué pour boucle sans couture
    let bIdx = 0;
    const stepBrands = () => {
      if (viewerOpen()) return;
      bIdx++;
      const node = brandsTrack.children[bIdx];
      if (!node) return;
      brandsTrack.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
      brandsTrack.style.transform = `translateX(-${node.offsetLeft}px)`;
      if (bIdx >= BRANDS.length) {
        setTimeout(() => {              // retour sans couture sur le set dupliqué
          brandsTrack.style.transition = 'none';
          brandsTrack.style.transform = 'translateX(0)';
          bIdx = 0;
        }, 720);
      }
    };
    setInterval(stepBrands, 2600);
  }

  // ─── Showreel lightbox ──────────────────────────────────────
  const showreelCard = document.getElementById('showreelCard');
  const showreelLightbox = document.getElementById('showreelLightbox');
  const showreelLightboxClose = document.getElementById('showreelLightboxClose');
  const showreelEmbed = document.getElementById('showreelEmbed');

  const VIMEO_SRC = 'https://player.vimeo.com/video/591673847?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&title=0&byline=0&portrait=0&dnt=1';

  function openShowreel() {
    if (!showreelLightbox) return;
    document.body.classList.add('viewer-open'); // gèle l'arrière-plan (perf focus player)
    document.querySelector('.memoji-video')?.pause(); // memoji du chat
    showreelLightbox.classList.add('open');
    showreelLightbox.setAttribute('aria-hidden', 'false');
    if (showreelEmbed) showreelEmbed.src = VIMEO_SRC; // charge & autoplay Vimeo
  }
  function closeShowreel() {
    if (!showreelLightbox) return;
    document.body.classList.remove('viewer-open');
    showreelLightbox.classList.remove('open');
    showreelLightbox.setAttribute('aria-hidden', 'true');
    if (showreelEmbed) showreelEmbed.src = ''; // stoppe la lecture
    document.querySelector('.memoji-video')?.play().catch(() => {}); // relance memoji
  }

  showreelCard?.addEventListener('click', openShowreel);
  showreelCard?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openShowreel(); }
  });
  showreelLightboxClose?.addEventListener('click', closeShowreel);
  showreelLightbox?.addEventListener('click', e => {
    if (e.target === showreelLightbox) closeShowreel();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && showreelLightbox?.classList.contains('open')) closeShowreel();
  });

});

