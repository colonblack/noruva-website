/* LOCAL INTERNATIONALISATION — loaded after translations.js, before script.js.
   English lives in HTML. Each language has editable files under translations/.
   The compiler joins those files into translations.js; the server needs no runtime.
   Text is updated through textContent/nodeValue, never by injecting translated HTML. */
(() => {
  'use strict';
  const dictionaries = window.NORUVA_TRANSLATIONS || {};
  const supported = ['en', 'fr', 'sw', 'ln', 'lua'];
  const selector = document.querySelector('#language-select');
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalLinks = new WeakMap();
  const originalTitle = document.title;
  const heading = document.querySelector('[data-language-heading]');
  const englishHeading = heading?.cloneNode(true);
  let language = 'en';
  function translate(text) { return language === 'en' ? text : dictionaries[language]?.[text] || text; }
  function readPreference() {
    const query = new URLSearchParams(location.search).get('lang');
    if (supported.includes(query)) return query;
    try { return localStorage.getItem('noruva-language'); } catch { return 'en'; }
  }
  function apply(nextLanguage) {
    language = supported.includes(nextLanguage) ? nextLanguage : 'en';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest('script, style, #language-select, [translate="no"], input, textarea, #form-status')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const english = originalText.get(node);
      const key = english.trim();
      if (key) node.nodeValue = english.replace(key, translate(key));
    }
    if (heading && englishHeading) {
      if (language === 'en') heading.replaceChildren(...[...englishHeading.childNodes].map(child => child.cloneNode(true)));
      else heading.textContent = translate(heading.dataset.languageHeading);
    }
    document.querySelectorAll('[aria-label], [alt]').forEach(element => {
      if (element.closest('[translate="no"]')) return;
      if (!originalAttributes.has(element)) {
        originalAttributes.set(element, {label: element.getAttribute('aria-label'), alt: element.getAttribute('alt')});
      }
      const original = originalAttributes.get(element);
      if (original.label) element.setAttribute('aria-label', translate(original.label));
      if (original.alt) element.setAttribute('alt', translate(original.alt));
    });
    const titleParts = originalTitle.split(' | ');
    document.title = `${translate(titleParts[0])} | Noruva Africa`;
    document.documentElement.lang = language;
    selector.value = language;
    // Carry the choice in local links as well as localStorage, including when storage is unavailable.
    document.querySelectorAll('a[href]').forEach(link => {
      if (!originalLinks.has(link)) originalLinks.set(link, link.getAttribute('href'));
      const original = originalLinks.get(link);
      if (!original || !/^[a-z-]+\.html(?:[?#]|$)/.test(original)) return;
      const url = new URL(original, location.href);
      url.searchParams.set('lang', language);
      link.href = `${url.pathname.split('/').pop()}${url.search}${url.hash}`;
    });
    try { localStorage.setItem('noruva-language', language); } catch { /* URL retains preference. */ }
    // Form entries are never altered when changing language.
    document.dispatchEvent(new CustomEvent('noruva:languagechange', {detail: {language}}));
  }
  window.NoruvaI18n = {t: translate, setLanguage: apply, getLanguage: () => language};
  selector?.addEventListener('change', event => apply(event.target.value));
  apply(readPreference());
})();
