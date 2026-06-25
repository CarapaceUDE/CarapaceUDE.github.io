(function () {
  function initBrandLogos() {
    if (typeof window.initCortexHubTabOrbCanvas !== 'function') return;

    document.querySelectorAll('[data-cortex-brand-logo]').forEach(function (wrap) {
      if (wrap.dataset.cortexBrandLogoInit === '1') return;

      var canvas = wrap.querySelector('canvas');
      if (!canvas) return;

      wrap.dataset.cortexBrandLogoInit = '1';
      var api = window.initCortexHubTabOrbCanvas(canvas);
      if (api) wrap._cortexBrandLogoApi = api;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrandLogos);
  } else {
    initBrandLogos();
  }
})();
