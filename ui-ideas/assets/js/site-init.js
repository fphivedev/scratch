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
        // Clear manual past-date entries on blur: parse using configured format and clear if before today
        const dateFormat = (baseOptions && baseOptions.dateFormat) || 'dd/MM/yyyy';
        const parseInputDate = (val) => {
          if (!val) return null;
          // Support dd/MM/yyyy specifically; fallback to Date.parse for other formats
          if (dateFormat === 'dd/MM/yyyy') {
            const m = val.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
            if (!m) return null;
            const day = parseInt(m[1], 10);
            const month = parseInt(m[2], 10) - 1;
            const year = parseInt(m[3], 10);
            const d = new Date(year, month, day);
            return isNaN(d.getTime()) ? null : d;
          }
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        };

        const onBlurClearPast = (ev) => {
          const v = el.value && el.value.trim();
          if (!v) return;
          const parsed = parseInputDate(v);
          if (!parsed) return; // can't parse, don't clear
          const today = new Date();
          today.setHours(0,0,0,0);
          parsed.setHours(0,0,0,0);
          if (parsed < today) {
            el.value = '';
            // notify any listeners
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };

        el.addEventListener('blur', onBlurClearPast);
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
