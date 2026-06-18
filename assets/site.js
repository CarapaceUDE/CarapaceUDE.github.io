(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupNavigation() {
    const nav = document.querySelector('.nav');
    const inner = nav && nav.querySelector('.nav-inner');
    const links = inner && inner.querySelector('.links');
    if (!nav || !inner || !links) return;

    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span>';
    inner.insertBefore(toggle, links);

    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    const path = location.pathname.split('/').pop() || 'index.html';
    links.querySelectorAll('a[href]').forEach(function (link) {
      const href = link.getAttribute('href').split('#')[0].replace(/\/$/, '/index.html');
      if (href === path || (path === 'index.html' && href === 'index.html')) link.setAttribute('aria-current', 'page');
    });
  }

  function setupDropdowns() {
    document.querySelectorAll('.dropdown').forEach(function (dropdown) {
      const button = dropdown.querySelector('.dropbtn');
      if (!button || button.dataset.siteBound) return;
      button.dataset.siteBound = 'true';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const open = dropdown.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
      });
    });
    document.addEventListener('click', function (event) {
      document.querySelectorAll('.dropdown.open').forEach(function (dropdown) {
        if (!dropdown.contains(event.target)) {
          dropdown.classList.remove('open');
          const button = dropdown.querySelector('.dropbtn');
          if (button) button.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function setupReveals() {
    const candidates = document.querySelectorAll('main > section, .card, .surface, .shot, .pitch-frame, .system-detail, .step');
    candidates.forEach(function (element) { element.dataset.reveal = ''; });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      candidates.forEach(function (element) { element.classList.add('is-visible'); });
      return;
    }
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -5% 0px' });
    candidates.forEach(function (element) { observer.observe(element); });
  }

  function setupHeroTilt() {
    const visual = document.querySelector('.hero-visual');
    if (!visual || reduceMotion) return;
    visual.addEventListener('pointermove', function (event) {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      visual.style.setProperty('--rx', (-y * 2.2).toFixed(2) + 'deg');
      visual.style.setProperty('--ry', (x * 3.2).toFixed(2) + 'deg');
    });
    visual.addEventListener('pointerleave', function () {
      visual.style.setProperty('--rx', '0deg');
      visual.style.setProperty('--ry', '0deg');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupDropdowns();
    setupReveals();
    setupHeroTilt();
  });
})();
