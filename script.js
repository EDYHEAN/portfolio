document.addEventListener('DOMContentLoaded', () => {

  // ─── Window controls ─────────────────────────────────────────
  const mainWindow = document.getElementById('mainWindow');
  const winRestore = document.getElementById('winRestore');
  let winState = 'normal'; // 'normal' | 'minimized' | 'maximized' | 'closed'

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
    if (winState === 'minimized') { restoreFromMin(); }
    else if (winState === 'normal') { minimizeWin(); displaceChatWidget(); }
  });

  mainWindow?.addEventListener('click', (e) => {
    if (winState === 'minimized' && !e.target.closest('.tl')) restoreFromMin();
  });

  document.getElementById('tlGreen')?.addEventListener('click', () => {
    if (winState === 'maximized') {
      mainWindow.classList.remove('win-maximized');
      winState = 'normal';
    } else if (winState === 'normal') {
      mainWindow.classList.add('win-maximized');
      winState = 'maximized';
    }
  });

  // ─── Drag titlebar ───────────────────────────────────────────
  const titlebar = document.querySelector('.window-titlebar');
  let isDragging = false;
  let dragStartX, dragStartY, winStartX, winStartY;
  let velX = 0, velY = 0;
  let lastMoveX = 0, lastMoveY = 0, lastMoveTime = 0;
  let bounceAnim = null;

  titlebar?.addEventListener('mousedown', (e) => {
    if (window.innerWidth <= 960) return;
    if (e.target.closest('.tl') || e.target.closest('.social-link') || winState !== 'normal') return;

    if (bounceAnim) { cancelAnimationFrame(bounceAnim); bounceAnim = null; }

    if (mainWindow.style.position !== 'fixed') {
      const rect = mainWindow.getBoundingClientRect();
      mainWindow.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;margin:0;max-width:none;max-height:none;transition:none`;
      mainWindow.offsetHeight;
    }

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    winStartX  = parseFloat(mainWindow.style.left);
    winStartY  = parseFloat(mainWindow.style.top);
    velX = 0; velY = 0;
    lastMoveX = e.clientX; lastMoveY = e.clientY; lastMoveTime = performance.now();
    mainWindow.style.transition = 'none';
    document.body.classList.add('win-dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const now = performance.now();
    const dt  = now - lastMoveTime;
    if (dt > 0 && dt < 80) {
      velX = velX * 0.4 + ((e.clientX - lastMoveX) / dt) * 0.6;
      velY = velY * 0.4 + ((e.clientY - lastMoveY) / dt) * 0.6;
    }
    lastMoveTime = now;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;

    const maxLeft = window.innerWidth  - mainWindow.offsetWidth;
    const maxTop  = window.innerHeight - mainWindow.offsetHeight;
    mainWindow.style.left = Math.max(0, Math.min(winStartX + e.clientX - dragStartX, maxLeft)) + 'px';
    mainWindow.style.top  = Math.max(0, Math.min(winStartY + e.clientY - dragStartY, maxTop))  + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove('win-dragging');

    if (Math.sqrt(velX * velX + velY * velY) < 0.2) return;

    let x  = parseFloat(mainWindow.style.left);
    let y  = parseFloat(mainWindow.style.top);
    let vx = velX * 16;
    let vy = velY * 16;

    function step() {
      x += vx; y += vy;
      vx *= 0.88; vy *= 0.88;

      const maxX = window.innerWidth  - mainWindow.offsetWidth;
      const maxY = window.innerHeight - mainWindow.offsetHeight;
      if (x < 0)    { x = 0;    vx =  Math.abs(vx) * 0.45; }
      if (x > maxX) { x = maxX; vx = -Math.abs(vx) * 0.45; }
      if (y < 0)    { y = 0;    vy =  Math.abs(vy) * 0.45; }
      if (y > maxY) { y = maxY; vy = -Math.abs(vy) * 0.45; }

      mainWindow.style.left = x + 'px';
      mainWindow.style.top  = y + 'px';

      bounceAnim = (Math.abs(vx) > 0.2 || Math.abs(vy) > 0.2)
        ? requestAnimationFrame(step)
        : null;
    }

    bounceAnim = requestAnimationFrame(step);
  });

  function minimizeWin() {
    const rect = mainWindow.getBoundingClientRect();
    const pillW = 240, pillH = 42;

    mainWindow.style.transition = 'none';
    mainWindow.style.cssText += `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      margin: 0;
      max-width: none;
      max-height: none;
    `;
    mainWindow.dataset.orig = JSON.stringify({ top: rect.top, left: rect.left, w: rect.width, h: rect.height });
    mainWindow.offsetHeight; // reflow

    const tx = 'top 0.44s cubic-bezier(0.4,0,0.2,1), left 0.44s cubic-bezier(0.4,0,0.2,1), width 0.44s cubic-bezier(0.4,0,0.2,1), height 0.44s cubic-bezier(0.4,0,0.2,1), border-radius 0.44s ease';
    mainWindow.style.transition = tx;
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
    const tx = 'top 0.44s cubic-bezier(0.4,0,0.2,1), left 0.44s cubic-bezier(0.4,0,0.2,1), width 0.44s cubic-bezier(0.4,0,0.2,1), height 0.44s cubic-bezier(0.4,0,0.2,1), border-radius 0.44s ease';
    mainWindow.style.transition   = tx;
    mainWindow.style.top          = `${top}px`;
    mainWindow.style.left         = `${left}px`;
    mainWindow.style.width        = `${w}px`;
    mainWindow.style.height       = `${h}px`;
    mainWindow.style.borderRadius = '18px';
    mainWindow.classList.remove('win-minimized');
    winState = 'normal';
    setTimeout(() => { mainWindow.style.cssText = ''; }, 450);
    restoreChatWidget();
  }

  function displaceChatWidget() {
    const widget   = document.getElementById('chatWidget');
    const toggle   = document.getElementById('chatToggle');
    const panel    = document.getElementById('chatPanel');
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
    const suffix = counter.dataset.suffix || '';
    const steps = 60;
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

  // ─── Card entrance animations ─────────────────────────────────
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

  // Portfolio carousel
  const projects = [
    {
      title: 'Rhinov App',
      cat: 'UI Design',
      desc: 'Redesign de l’interface mobile et web du service de décoration d’intérieur.',
      year: '2024',
      color: '#1B5EFF',
      tags: ['Figma', 'Mobile'],
    },
    {
      title: 'Infograpik UI',
      cat: 'Game UI',
      desc: 'Interface jeu-vidéo pour start-up suisse — direction artistique et motion.',
      year: '2022',
      color: '#3D72FF',
      tags: ['After Effects', 'UI'],
    },
    {
      title: 'Fière Allure',
      cat: 'Branding',
      desc: 'Identité visuelle complète et direction artistique pour start-up bordelaise.',
      year: '2020',
      color: '#6B9FFF',
      tags: ['Illustrator', 'Brand'],
    },
  ];

  let current = 0;

  const thumb   = document.getElementById('projectThumb');
  const catEl   = document.getElementById('projectCat');
  const titleEl = document.getElementById('projectTitle');
  const dotsEl  = document.getElementById('pdots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!thumb) return;

  function render(idx) {
    const p = projects[idx];

    // Background color transitions smoothly, card stays visible
    thumb.style.transition = 'background-color 0.45s ease';
    thumb.style.background = p.color;

    // Only text fades out/in
    catEl.style.transition   = 'opacity 0.15s ease';
    titleEl.style.transition = 'opacity 0.15s ease';
    catEl.style.opacity      = '0';
    titleEl.style.opacity    = '0';

    setTimeout(() => {
      catEl.textContent   = p.cat;
      titleEl.textContent = p.title;
      catEl.style.opacity   = '1';
      titleEl.style.opacity = '1';

      dotsEl.querySelectorAll('.pdot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });
    }, 150);
  }

  function goTo(idx) {
    current = (idx + projects.length) % projects.length;
    render(current);
  }

  // Init first project color without animation
  thumb.style.background = projects[0].color;

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  dotsEl?.querySelectorAll('.pdot').forEach((d, i) => {
    d.addEventListener('click', () => { if (i !== current) goTo(i); });
  });

  // Auto-advance every 5s
  setInterval(() => goTo(current + 1), 5000);


  // ─── Memoji seamless loop ────────────────────────────────────
  const memojiVid = document.querySelector('.memoji-video');
  if (memojiVid) {
    memojiVid.addEventListener('timeupdate', () => {
      if (memojiVid.duration && memojiVid.currentTime >= memojiVid.duration - 0.15) {
        memojiVid.currentTime = 0;
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && memojiVid.paused) memojiVid.play().catch(() => {});
    });
  }

  // ─── Chat widget ─────────────────────────────────────────────
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

  chatToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    chatNudge?.classList.remove('visible');
    chatPanel.classList.toggle('open');
  });

  chatClose?.addEventListener('click', () => {
    chatPanel.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.chat-widget')) {
      chatPanel?.classList.remove('open');
    }
  });

});
