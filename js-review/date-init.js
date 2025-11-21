// initDatepickers(root, datepicker) - initializes AirDatepicker elements within root
export function initDatepickers(root, datepicker) {
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
