'use strict';
// Progressive enhancements only. Navigation, forms and reservations work without JS.
const menu = document.querySelector('[data-menu]');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu) {
    document.body.classList.remove('menu-open');
    menu.setAttribute('aria-expanded', 'false');
  }
});
document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', event => {
    if (!window.confirm(form.dataset.confirm)) event.preventDefault();
  });
});
document.querySelector('[data-photo-input]')?.addEventListener('change', event => {
  const image = document.querySelector('.upload-preview');
  const file = event.target.files?.[0];
  if (!file || !image) return;
  if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    event.target.value = '';
    return;
  }
  if (image.dataset.objectUrl) URL.revokeObjectURL(image.dataset.objectUrl);
  image.dataset.objectUrl = URL.createObjectURL(file);
  image.src = image.dataset.objectUrl;
  image.hidden = false;
});
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const input = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(input.value);
      button.querySelector('span').textContent = button.dataset.copied;
    } catch {
      input.focus();
      input.select();
    }
  });
});
