/*!
 * Page bootstrap
 * - If #search-form exists, instantiate SearchPage (from search-page.js)
 * - Otherwise, initialize datepickers normally
 */
(function(){
  function initDatepickers(root){
    var scope = root || document;
    var dateEls = scope.querySelectorAll('.js-datepicker');
    try {
      if (window.AirDatepicker) {
        var ideas = window.Ideas;
        if (!ideas || !ideas.datepicker) {
          console.warn('Ideas.datepicker config missing');
          return;
        }
        var shared = ideas.datepicker;
        var enLocale = shared.locale;
        dateEls.forEach(function (el) {
          if (el.dataset.adpBound === '1') return;
          var baseOptions = shared.options;
          new window.AirDatepicker(el, Object.assign({}, baseOptions, { locale: enLocale }));
          el.dataset.adpBound = '1';
        });
      }
    } catch (e) {
      console.warn('Datepicker init failed', e);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    var hasSearchForm = !!document.getElementById('search-form');
    if (hasSearchForm && window.SearchPage) {
      try { new window.SearchPage({ root: document }).init(); }
      catch (e) { console.warn('SearchPage init failed', e); }
    } else {
      initDatepickers(document);
    }
  });

})();
