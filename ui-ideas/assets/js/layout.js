// Initialize Air Datepicker and demo form handler
document.addEventListener('DOMContentLoaded', function () {
  var dateEls = document.querySelectorAll('.js-datepicker');

  function initDatepicker() {
    try {
      if (window.AirDatepicker) {
        // explicit English locale to avoid falling back to system locale (which may be Cyrillic)
        var enLocale = {
          days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
          daysShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
          daysMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
          months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
          monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          firstDay: 1,
          weekHeader: 'Wk'
        };

        dateEls.forEach(function (el) {
          new window.AirDatepicker(el, {
            locale: enLocale,
            dateFormat: 'dd/MM/yyyy'
          });
        });
      } else if (window.Datepicker) {
        dateEls.forEach(function (el) {
          new window.Datepicker(el, {
            language: 'en',
            dateFormat: 'dd/MM/yyyy',
            formatter: function (date) {
              if (!date) return '';
              // use en-GB to ensure dd/mm/yyyy format regardless of user locale
              try {
                return new Date(date).toLocaleDateString('en-GB');
              } catch (e) {
                return new Date(date).toLocaleDateString();
              }
            }
          });
        });
      } else {
        console.warn('Air Datepicker not available');
      }
    } catch (e) {
      console.warn('Datepicker init failed', e);
    }
  }

  initDatepicker();

  var form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Form submitted (demo)');
    });
  }

  // Tabs implementation: wire up nav-item elements to show/hide .tab-pane
  (function initTabs() {
    var tabNav = document.querySelectorAll('.nav-tabs .nav-item');
    if (!tabNav || tabNav.length === 0) return;

    var panes = document.querySelectorAll('.tab-pane');

    function activateItem(item) {
      var target = item.getAttribute('data-target');
      // deactivate all nav items
      tabNav.forEach(function (i) {
        i.classList.remove('active');
        i.setAttribute('aria-selected', 'false');
      });
      // hide all panes
      panes.forEach(function (p) { p.classList.remove('active'); });

      // activate selected
      item.classList.add('active');
      item.setAttribute('aria-selected', 'true');
      var pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    }

    // initial activation: find first with .active or default to first
    var initiallyActive = Array.prototype.find.call(tabNav, function (i) { return i.classList.contains('active'); });
    if (!initiallyActive) initiallyActive = tabNav[0];
    if (initiallyActive) activateItem(initiallyActive);

    tabNav.forEach(function (item) {
      item.addEventListener('click', function () { activateItem(item); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateItem(item); }
        // left/right arrow navigation
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var idx = Array.prototype.indexOf.call(tabNav, item);
          var nextIdx = idx + (e.key === 'ArrowRight' ? 1 : -1);
          if (nextIdx < 0) nextIdx = tabNav.length - 1;
          if (nextIdx >= tabNav.length) nextIdx = 0;
          tabNav[nextIdx].focus();
        }
      });
    });
  })();

});
