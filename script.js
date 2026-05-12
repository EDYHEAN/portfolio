document.addEventListener('DOMContentLoaded', () => {

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

  function render(idx, dir) {
    const p = projects[idx];

    thumb.style.transition = 'opacity 0.16s ease, transform 0.16s ease';
    thumb.style.opacity    = '0';
    thumb.style.transform  = `translateX(${dir > 0 ? 14 : -14}px)`;

    setTimeout(() => {
      thumb.style.background = p.color;
      catEl.textContent      = p.cat;
      titleEl.textContent    = p.title;

      thumb.style.transition = 'opacity 0.32s ease, transform 0.32s ease';
      thumb.style.opacity    = '1';
      thumb.style.transform  = 'translateX(0)';

      dotsEl.querySelectorAll('.pdot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });
    }, 160);
  }

  function goTo(idx) {
    const dir = idx > current ? 1 : -1;
    current = (idx + projects.length) % projects.length;
    render(current, dir);
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  dotsEl?.querySelectorAll('.pdot').forEach((d, i) => {
    d.addEventListener('click', () => { if (i !== current) goTo(i); });
  });

  // Auto-advance every 5s
  setInterval(() => goTo(current + 1), 5000);

});
