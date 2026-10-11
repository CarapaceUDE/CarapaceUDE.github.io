(function () {
  const themeToggle = document.getElementById('theme-toggle');
  function syncTheme() {
    const light = document.documentElement.dataset.theme === 'light';
    themeToggle.setAttribute('aria-pressed', String(light));
    themeToggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    document.getElementById('theme-label').textContent = light ? 'Light' : 'Dark';
    document.getElementById('meta-theme-color').content = light ? '#f2f2f4' : '#0f0f10';
  }
  themeToggle.addEventListener('click', function () {
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('carapace-theme', theme); } catch (error) { /* Private mode. */ }
    syncTheme();
  });
  syncTheme();

  const form = document.getElementById('workshop-form');
  const button = form.querySelector('button[type="submit"]');
  const progress = document.getElementById('form-progress');
  const errorMessage = document.getElementById('form-error');
  const thanks = document.getElementById('thanks');
  let sending = false;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    errorMessage.textContent = '';
    progress.textContent = 'Sending...';
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form)),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        errorMessage.textContent = result.error || 'We could not confirm your signup. Please try again or email carapaceai@gmail.com for help.';
        throw new Error('Submission failed');
      }
      form.reset();
      form.hidden = true;
      thanks.classList.add('is-visible');
      thanks.focus();
    } catch (error) {
      if (!errorMessage.textContent) errorMessage.textContent = 'We could not confirm your signup. Please try again or email carapaceai@gmail.com for help.';
      // Tokens are single-use. Get a fresh spam check before a retry.
      if (window.turnstile) window.turnstile.reset();
    } finally {
      window.clearTimeout(timeout);
      progress.textContent = '';
      button.disabled = false;
      form.removeAttribute('aria-busy');
      sending = false;
    }
  });
})();
