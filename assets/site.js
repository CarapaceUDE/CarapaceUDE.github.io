/**
 * Copyright (c) 2026 Carapace LLC. All rights reserved.
 *
 * Carapace site shell — navigation, Cortex brand logo init, layout helpers.
 * Proprietary; unauthorized copying or distribution prohibited.
 */
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

  /** Copyright (c) 2026 Carapace LLC — Cortex brand logo initialization. */
  function setupBrandLogos() {
    const logos = document.querySelectorAll('[data-cortex-brand-logo]');
    if (!logos.length) return;

    const base = getAssetsBase();
    loadScript(base + 'harness-brain-canvas.js?v=20260626')
      .then(function () {
        if (typeof window.initCortexHubTabOrbCanvas !== 'function') return;
        logos.forEach(function (wrap) {
          if (wrap.dataset.cortexBrandLogoInit === '1') return;
          const canvas = wrap.querySelector('canvas');
          if (!canvas) return;
          wrap.dataset.cortexBrandLogoInit = '1';
          const api = window.initCortexHubTabOrbCanvas(canvas);
          if (api) wrap._cortexBrandLogoApi = api;
        });
      })
      .catch(function () {
        /* ring shell still renders */
      });
  }

  function setupFooterCopyright() {
    document.querySelectorAll('footer').forEach(function (footer) {
      if (footer.querySelector('.site-copyright')) return;

      const wrap = footer.querySelector('.wrap') || footer;
      const line = document.createElement('div');
      line.className = 'site-copyright';
      line.textContent = '\u00A9 2026 Carapace LLC. All rights reserved.';
      wrap.appendChild(line);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupDropdowns();
    setupReveals();
    setupHeroTilt();
    setupBrandLogos();
    setupFooterCopyright();
  });
})();
