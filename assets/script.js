/* SHARED BEHAVIOUR. HTML provides the content; styles.css provides presentation.
   config.js must load before this file, as shown at the bottom of each HTML page. */
'use strict';
const config = window.NORUVA_CONFIG;
const t = text => window.NoruvaI18n?.t(text) || text;

// 1. Mobile navigation: aria-expanded keeps the visible state available to screen readers.
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}
toggle?.addEventListener('click', () => {
  const open = navigation.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation?.classList.contains('is-open')) {
    closeMenu();
    toggle.focus();
  }
});
navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });

// 2. Direct communication: every data-whatsapp anchor uses the same confirmed number.
const whatsappUrl = message => `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
function refreshWhatsApp() {
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    link.href = whatsappUrl(t(config.whatsappGreeting));
  });
}
refreshWhatsApp();
document.addEventListener('noruva:languagechange', refreshWhatsApp);
document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

// 3. Contact form: native HTML validates fields. WhatsApp opens a draft; the user sends it.
// No backend, database, mail() configuration, or third-party form service is required.
const form = document.querySelector('#enquiry-form');
if (form) {
  const selectedService = new URLSearchParams(window.location.search).get('service');
  if (selectedService && [...form.elements.service.options].some(option => option.value === selectedService)) {
    form.elements.service.value = selectedService;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const serviceLabel = form.elements.service.selectedOptions[0].textContent;
    const message = [
      t('Website enquiry — Noruva Africa'),
      `${t('Name')}: ${data.get('name')}`, `${t('Organisation')}: ${data.get('company')}`,
      `${t('Business email')}: ${data.get('email')}`, `${t('Country')}: ${data.get('country')}`,
      `${t('I am a:')} ${t(data.get('role'))}`, `${t('Service')}: ${serviceLabel}`,
      `${t('Product/category')}: ${data.get('category') || t('Not specified')}`, '', data.get('message')
    ].join('\n');
    const url = whatsappUrl(message);
    // A persistent link provides a fallback if the browser blocks the new tab.
    const status = document.querySelector('#form-status');
    status.replaceChildren(document.createTextNode(t('Your message is ready.') + ' '));
    const fallback = document.createElement('a');
    fallback.href = url;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    fallback.textContent = t('Open WhatsApp to review and send →');
    fallback.style.textDecoration = 'underline';
    status.append(fallback);
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}
