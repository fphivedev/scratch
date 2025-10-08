// ES module bootstrapper
import { SearchPage } from './search-page.js';
import { datepicker } from './date-config.js';

function initDatepickers(root){
  const scope = root || document;
  const dateEls = scope.querySelectorAll('.js-datepicker');
  try {
    if (window.AirDatepicker) {
      const shared = datepicker;
      const enLocale = shared.locale;
      dateEls.forEach((el) => {
        if (el.dataset.adpBound === '1') return;
        const baseOptions = shared.options;
        // eslint-disable-next-line no-new
        new window.AirDatepicker(el, Object.assign({}, baseOptions, { locale: enLocale }));
        el.dataset.adpBound = '1';
      });
    }
  } catch (e) {
    console.warn('Datepicker init failed', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const hasSearchForm = !!document.getElementById('search-form');
  if (hasSearchForm) {
    try { new SearchPage({ root: document }).init(datepicker); }
    catch (e) { console.warn('SearchPage init failed', e); }
  } else {
    initDatepickers(document);
  }
});
