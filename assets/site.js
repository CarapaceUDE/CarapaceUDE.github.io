(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupNavigation() {
    const nav = document.querySelector('.nav');
    const inner = nav && nav.querySelector('.nav-inner');
    const links = inner && inner.querySelector('.links');
    if (!nav || !inner || !links) return;

    const toggle = document.createElement('button');
    const menuId = links.id || 'site-navigation';
    links.id = menuId;
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', menuId);
    toggle.innerHTML = '<span></span>';
    inner.insertBefore(toggle, links);

    function closeNavigation() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        closeNavigation();
      }
    });

    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target)) closeNavigation();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      const hadOpenMenu = nav.classList.contains('is-open') || Boolean(document.querySelector('.dropdown.open'));
      closeNavigation();
      document.querySelectorAll('.dropdown.open').forEach(function (dropdown) {
        dropdown.classList.remove('open');
        const button = dropdown.querySelector('.dropbtn');
        if (button) button.setAttribute('aria-expanded', 'false');
      });
      if (hadOpenMenu && getComputedStyle(toggle).display !== 'none') toggle.focus();
    });

    window.matchMedia('(min-width: 961px)').addEventListener('change', function (event) {
      if (event.matches) closeNavigation();
    });

    const normalizePath = function (pathname) {
      return pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
    };
    const currentPath = normalizePath(location.pathname);
    links.querySelectorAll('a[href]').forEach(function (link) {
      const linkPath = normalizePath(new URL(link.href, location.href).pathname);
      if (linkPath === currentPath) link.setAttribute('aria-current', 'page');
    });
  }

  function setupDropdowns() {
    document.querySelectorAll('.dropdown').forEach(function (dropdown) {
      const button = dropdown.querySelector('.dropbtn');
      if (!button || button.dataset.siteBound) return;
      dropdown.querySelectorAll('.dropdown-menu a').forEach(function (link) {
        link.setAttribute('role', 'menuitem');
      });
      button.dataset.siteBound = 'true';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        document.querySelectorAll('.dropdown.open').forEach(function (other) {
          if (other === dropdown) return;
          other.classList.remove('open');
          const otherButton = other.querySelector('.dropbtn');
          if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
        });
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

  function setupHomeThemeToggle() {
    if (!document.body.classList.contains('page-home')) return;
    var btn = document.getElementById('theme-toggle');
    if (!btn || btn.dataset.themeBound === '1') return;
    btn.dataset.themeBound = '1';

    var THEME_COLORS = { dark: '#1a1c24', light: '#f5f6f8' };

    function syncThemeUi(theme) {
      var isLight = theme === 'light';
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      btn.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      var label = document.getElementById('theme-label');
      if (label) label.textContent = isLight ? 'Light' : 'Dark';
      var meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.dark);
    }

    function applyTheme(theme) {
      var next = theme === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      syncThemeUi(next);
      try { localStorage.setItem('carapace-theme', next); } catch (e) { /* private mode */ }
      window.dispatchEvent(new CustomEvent('carapace-theme-change', { detail: { theme: next } }));
    }

    btn.addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
    });

    syncThemeUi(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }

  function getAssetsBase() {
    const script = document.querySelector('script[src*="site.js"]');
    if (!script) return 'assets/';
    return (script.getAttribute('src') || 'assets/site.js').replace(/site\.js(?:\?.*)?$/, '');
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const baseSrc = src.split('?')[0];
      if (document.querySelector('script[src="' + src + '"], script[src^="' + baseSrc + '"]')) {
        resolve();
        return;
      }
      const el = document.createElement('script');
      el.src = src;
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error('script failed: ' + src)); };
      document.head.appendChild(el);
    });
  }

  function setupBrandLogos() {
    const logos = document.querySelectorAll('[data-cortex-brand-logo]');
    if (!logos.length) return;

    const base = getAssetsBase();
    loadScript(base + 'harness-brain-canvas.js?v=20260706a')
      .then(function () {
        const init = window.initCortexBrandLogoCanvas || window.initCortexHubTabOrbCanvas;
        if (typeof init !== 'function') return;
        logos.forEach(function (wrap) {
          if (wrap.dataset.cortexBrandLogoInit === '1') return;
          const canvas = wrap.querySelector('canvas');
          if (!canvas) return;
          wrap.dataset.cortexBrandLogoInit = '1';
          const api = init(canvas);
          if (api) wrap._cortexBrandLogoApi = api;
        });
      })
      .catch(function () {
        /* conic ring shell still renders without canvas */
      });

  }

  function bootSite() {
    setupNavigation();
    setupDropdowns();
    setupReveals();
    setupHeroTilt();
    setupHomeThemeToggle();
    setupBrandLogos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSite);
  } else {
    bootSite();
  }
})();
