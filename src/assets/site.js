/* Progressive enhancement only. Core content and contact links work without JavaScript. */
(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const mobile = window.matchMedia('(max-width: 720px)');
  function setMenu(open) {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  if (menu && nav) {
    document.documentElement.classList.add('has-js');
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        setMenu(false); menu.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) setMenu(false);
    });
    mobile.addEventListener('change', () => setMenu(false));
  }
  const copy = document.querySelector('[data-copy-email]');
  const feedback = document.querySelector('#copy-feedback');
  if (copy && feedback && navigator.clipboard?.writeText) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copy.dataset.copyEmail);
        feedback.textContent = 'Email address copied.';
      } catch {
        feedback.textContent = 'Copy was not permitted. Select the email address above and copy it manually.';
      }
    });
  }
})();
