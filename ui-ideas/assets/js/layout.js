// Initialize Air Datepicker and demo form handler
document.addEventListener('DOMContentLoaded', function () {
  var el = document.getElementById('date');

  function initDatepicker() {
    try {
      if (window.AirDatepicker) {
        new window.AirDatepicker(el, {
          dateFormat: 'mm/dd/yyyy'
        });
      } else if (window.Datepicker) {
        new window.Datepicker(el, {
          formatter: function (date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString();
          }
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
