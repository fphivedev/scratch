/*
 * SearchPage class (ES module)
 * - Encapsulates Air Datepicker init and live search summary wiring
 * - Idempotent: safe to call init() multiple times
 *
 * Usage (module):
 *   import { SearchPage } from './search-page.js';
 *   import { datepicker } from './date-config.js';
 *   new SearchPage({ root: document }).init(datepicker);
 */
export class SearchPage {
  constructor(opts) {
    this.root = (opts && opts.root) || document;
    this._dateConfig = null;
  }

  _cssEscape(id) {
    return (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/"/g, '\\"');
  }

  _initDatepickers() {
    const scope = this.root || document;
    const dateEls = scope.querySelectorAll('.js-datepicker');
    try {
      if (window.AirDatepicker) {
        const shared = this._dateConfig;
        if (!shared) { console.warn('Datepicker config missing'); return; }
        const enLocale = shared.locale;
        dateEls.forEach((el) => {
          if (el.dataset.adpBound === '1') return;
          const baseOptions = shared.options;
          /* eslint no-new: 0 */
          new window.AirDatepicker(el, Object.assign({}, baseOptions, {
            locale: enLocale,
            onSelect: function () {
              try {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              } catch (_) { /* no-op */ }
            }
          }));
          el.dataset.adpBound = '1';
        });
      }
    } catch (e) {
      console.warn('Datepicker init failed', e);
    }
  }

  _isPlaceholderOpt(opt) {
    const txt = (opt.text || '').toLowerCase();
    return opt.value === '' || txt.indexOf('choose') >= 0 || txt.indexOf('open this select') >= 0;
  }

  _getLabelText(form, el) {
    if (el.id) {
      const lbl = form.querySelector('label[for="' + this._cssEscape(el.id) + '"]');
      if (lbl) return lbl.textContent.trim();
    }
    const parent = el.closest('.col, .col-md-3, .col-md-6, .col-md-4');
    if (parent) {
      const plbl = parent.querySelector('label');
      if (plbl) return plbl.textContent.trim();
    }
    return (el.name || el.id || 'Field').replace(/[_-]/g, ' ').trim();
  }

  _describeField(form, el) {
    if (el.disabled) return null;
    const tag = el.tagName;
    const type = (el.type || '').toLowerCase();
    const label = this._getLabelText(form, el);

    if (tag === 'SELECT') {
      const opts = Array.prototype.slice.call(el.selectedOptions || []);
      const selected = opts.filter((o) => !this._isPlaceholderOpt(o));
      if (selected.length === 0) return null;
      const values = selected.map((o) => (o.label || o.text || o.value)).filter(Boolean);
      if (el.multiple) return label + ' includes ' + values.map((v) => '"' + v + '"').join(', ');
      return label + ' is "' + values[0] + '"';
    }

    if (type === 'checkbox') {
      if (el.checked) {
        // Prefer explicit label[for], else fallback to closest .form-check > label
        let cbLabel = form.querySelector('label[for="' + this._cssEscape(el.id) + '"]');
        if (!cbLabel) {
          const cf = el.closest && el.closest('.form-check');
          if (cf) cbLabel = cf.querySelector('label');
        }
        const itemText = (cbLabel ? cbLabel.textContent : label || el.value || '').trim();

        // Include group heading (e.g., "Location") if present in the nearest column block
        const groupContainer = el.closest && el.closest('.col, .col-md-3, .col-md-4, .col-md-6, .col-sm-6');
        const groupLabelEl = groupContainer ? (groupContainer.querySelector('label.form-label') || groupContainer.querySelector(':scope > label.form-label')) : null;
        const groupText = groupLabelEl ? groupLabelEl.textContent.trim() : '';
        return groupText ? (groupText + ': ' + itemText) : itemText;
      }
      return null;
    }

    if (type === 'radio') {
      if (!el.checked) return null;
      return label + ' is "' + el.value + '"';
    }

    const val = (el.value || '').trim();
    if (!val) return null;

    const isDateLike = type === 'date' || el.classList.contains('date-input') || /date/i.test(el.id || '') || /date/i.test(el.name || '');
    if (isDateLike) {
      const ph = (el.getAttribute('placeholder') || '').toLowerCase();
      const nm = (el.name || '').toLowerCase();
      // Heuristics: treat first field as "after/from", second as "before/to"
      const isAfter = ph.includes('after') || nm.endsWith('1') || nm.includes('after') || nm.includes('from');
      const isBefore = ph.includes('before') || nm.endsWith('2') || nm.includes('before') || nm.includes('to');
      if (isAfter) return label + ' on or after "' + val + '"';
      if (isBefore) return label + ' on or before "' + val + '"';
      return label + ' is "' + val + '"';
    }

    if (type === 'number' || /^\d+(\.\d+)?$/.test(val)) return label + ' is ' + val;
    if (type === 'email') return label + ' contains "' + val + '"';
    return label + ' contains "' + val + '"';
  }

  _getKind(el){
    const tag = (el.tagName || '').toUpperCase();
    const type = (el.type || '').toLowerCase();
    if (tag === 'SELECT') return 'select';
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'date' || /date/i.test(el.id || '') || /date/i.test(el.name || '') || el.classList.contains('date-input')) return 'date';
    if (type === 'number') return 'number';
    if (type === 'email') return 'email';
    return 'text';
  }

  _clearField(target) {
    if (!target) return;
    if (target.tagName === 'SELECT') {
      if (target.multiple) Array.prototype.forEach.call(target.options, (o) => { o.selected = false; });
      else {
        const first = target.querySelector('option[value=""]') || target.options[0];
        if (first) first.selected = true;
      }
    } else if (target.type === 'checkbox' || target.type === 'radio') {
      target.checked = false;
    } else {
      target.value = '';
    }
    try {
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (_) { /* no-op */ }
  }

  _bindSummary() {
    const scope = this.root || document;
    const sForm = scope.getElementById ? scope.getElementById('search-form') : document.getElementById('search-form');
    const summaryEl = scope.getElementById ? scope.getElementById('searchSummary') : document.getElementById('searchSummary');
    const clearAllBtn = scope.getElementById ? scope.getElementById('clearAllFilters') : document.getElementById('clearAllFilters');
    if (!sForm || !summaryEl) return;

    if (summaryEl.dataset.summaryBound === '1') return;

    const self = this;
    let debounceId;

    // A11y: announce updates politely
    try {
      if (!summaryEl.getAttribute('aria-live')) summaryEl.setAttribute('aria-live', 'polite');
      if (!summaryEl.getAttribute('role')) summaryEl.setAttribute('role', 'status');
    } catch(_) {}

    function escHtml(s){
      return String(s).replace(/[&<>"']/g, function(ch){
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]);
      });
    }

    function getTabNameForElement(el){
      const pane = el.closest && el.closest('.tab-pane[id]');
      if (!pane) return null;
      const id = pane.id;
      const trigger = document.querySelector('[data-bs-toggle="tab"][data-bs-target="#' + id + '"]') ||
                      document.querySelector('[data-bs-toggle="tab"][href="#' + id + '"]');
      if (trigger && trigger.textContent) return trigger.textContent.trim();
      const labelledBy = pane.getAttribute('aria-labelledby');
      if (labelledBy){
        const lblEl = document.getElementById(labelledBy);
        if (lblEl && lblEl.textContent) return lblEl.textContent.trim();
      }
      return id || 'Tab';
    }

    function buildSummary(){
      const elements = Array.prototype.slice.call(sForm.querySelectorAll('input, select, textarea'));
      const items = [];
      elements.forEach(function(el){
        const phrase = self._describeField(sForm, el);
        if (phrase) items.push({ el: el, phrase: phrase, group: getTabNameForElement(el), kind: self._getKind(el) });
      });
      if (items.length === 0){
        summaryEl.innerHTML = '<li class="text-body-secondary">No filters applied</li>';
        summaryEl._items = [];
        return;
      }

      // Partition into general (no group) and grouped by tab name
      const general = [];
      const groups = Object.create(null);
      items.forEach(function(it, idx){
        it._idx = idx; // preserve index mapping for removal
        if (!it.group) general.push(it);
        else {
          if (!groups[it.group]) groups[it.group] = [];
          groups[it.group].push(it);
        }
      });

      // Keep tab order according to nav triggers
      const order = Array.prototype.slice.call(document.querySelectorAll('[data-bs-toggle="tab"]'))
        .map(function(tr){ return (tr.textContent || '').trim(); })
        .filter(function(name){ return !!name; });

      const html = [];
      // Render general (non-tab) items first
      general.forEach(function(it){
        const phr = escHtml(it.phrase);
        html.push('<li class="d-flex justify-content-between align-items-center gap-2 mb-1" data-item-idx="' + it._idx + '">\
                    <span class="d-inline-flex align-items-center gap-2">\
                      <span class="summary-type type-' + (it.kind || 'text') + '" aria-hidden="true"></span>\
                      <span>' + phr + '</span>\
                    </span>\
                    <button type="button" class="btn-close" aria-label="Remove: ' + phr + '"></button>\
                  </li>');
      });

      // Render grouped tab items by nav order, then any remaining groups
      const renderedGroups = Object.create(null);
      order.forEach(function(name){
        const arr = groups[name];
        if (!arr || arr.length === 0) return;
        renderedGroups[name] = true;
        html.push('<li class="summary-group mt-2 mb-1 small text-uppercase text-muted">' + escHtml(name) + '</li>');
        arr.forEach(function(it){
          const phr = escHtml(it.phrase);
          html.push('<li class="d-flex justify-content-between align-items-center gap-2 mb-1" data-item-idx="' + it._idx + '">\
                      <span class="d-inline-flex align-items-center gap-2">\
                        <span class="summary-type type-' + (it.kind || 'text') + '" aria-hidden="true"></span>\
                        <span>' + phr + '</span>\
                      </span>\
                      <button type="button" class="btn-close" aria-label="Remove: ' + phr + '"></button>\
                    </li>');
        });
      });

      // Any groups not in nav order (fallback)
      Object.keys(groups).forEach(function(name){
        if (renderedGroups[name]) return;
        const arr = groups[name];
        html.push('<li class="summary-group mt-2 mb-1 small text-uppercase text-muted">' + escHtml(name) + '</li>');
        arr.forEach(function(it){
          const phr = escHtml(it.phrase);
          html.push('<li class="d-flex justify-content-between align-items-center gap-2 mb-1" data-item-idx="' + it._idx + '">\
                      <span class="d-inline-flex align-items-center gap-2">\
                        <span class="summary-type type-' + (it.kind || 'text') + '" aria-hidden="true"></span>\
                        <span>' + phr + '</span>\
                      </span>\
                      <button type="button" class="btn-close" aria-label="Remove: ' + phr + '"></button>\
                    </li>');
        });
      });

      summaryEl.innerHTML = html.join('');
      summaryEl._items = items;
    }

    function schedule() {
      clearTimeout(debounceId);
      debounceId = setTimeout(buildSummary, 120);
    }

    if (sForm.dataset.summaryFormBound !== '1') {
      sForm.addEventListener('input', schedule, true);
      sForm.addEventListener('change', schedule, true);
      sForm.dataset.summaryFormBound = '1';
    }

    if (!summaryEl.dataset.summaryClickBound) {
      summaryEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-close');
        const li = e.target.closest('[data-item-idx]');
        if (!li) return;
        const idx = parseInt(li.getAttribute('data-item-idx'), 10);
        const items = summaryEl._items || [];
        const target = (idx >= 0 && items[idx]) ? items[idx].el : null;
        if (btn) {
          this._clearField(target);
          schedule();
          return;
        }
        // Activate tab if needed, then focus the field and flash
        if (target) {
          const pane = target.closest && target.closest('.tab-pane[id]');
          if (pane) {
            const id = pane.id;
            const trigger = document.querySelector('[data-bs-toggle="tab"][data-bs-target="#' + id + '"]') ||
                            document.querySelector('[data-bs-toggle="tab"][href="#' + id + '"]');
            if (trigger) {
              const focusAfterShow = () => {
                try {
                  if (!target.hasAttribute('tabindex') && target.tabIndex < 0) target.setAttribute('tabindex','-1');
                  target.focus({ preventScroll: true });
                  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  target.classList.add('focus-flash');
                  setTimeout(() => { target.classList.remove('focus-flash'); }, 1200);
                } catch(_) {}
              };
              try {
                if (window.bootstrap && window.bootstrap.Tab) {
                  const once = (ev) => { if (ev && ev.target !== trigger) return; trigger.removeEventListener('shown.bs.tab', once); focusAfterShow(); };
                  trigger.addEventListener('shown.bs.tab', once);
                  new window.bootstrap.Tab(trigger).show();
                  return;
                }
              } catch(_) {}
              try { trigger.click(); } catch(_) {}
              setTimeout(focusAfterShow, 80);
              return;
            }
          }
          try {
            if (!target.hasAttribute('tabindex') && target.tabIndex < 0) target.setAttribute('tabindex','-1');
            target.focus({ preventScroll: true });
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            target.classList.add('focus-flash');
            setTimeout(() => { target.classList.remove('focus-flash'); }, 1200);
          } catch(_) {}
        }
      });
      summaryEl.dataset.summaryClickBound = '1';
    }

    if (clearAllBtn && clearAllBtn.dataset.clearAllBound !== '1') {
      clearAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sForm.reset();
        Array.prototype.forEach.call(sForm.querySelectorAll('select[multiple]'), (sel) => {
          Array.prototype.forEach.call(sel.options, (o) => { o.selected = false; });
        });
        schedule();
      });
      clearAllBtn.dataset.clearAllBound = '1';
    }

    buildSummary();
    summaryEl.dataset.summaryBound = '1';
  }

  init(dateConfig) {
    this._dateConfig = dateConfig || this._dateConfig;
    this._initDatepickers();
    this._bindSummary();
    return true;
  }
}

// Lightweight notification modal launcher + initializer
// - export launchNotificationModal(id): attempts to delegate to a global implementation
//   if present, otherwise emits a DOM event 'launch-notification' with the id.
// - export initNotificationModal(): idempotently binds a delegated click handler
//   for elements with class `.action-launch-notifications-modal` and forwards
//   the id to `launchNotificationModal(id)`.
export function launchNotificationModal(id) {
  if (!id) return;
  // If a site-specific implementation exists on window, prefer it
  try {
    if (typeof window !== 'undefined' && typeof window.launchNotificationModal === 'function') {
      return window.launchNotificationModal(id);
    }
  } catch (_) {}

  // Fallback: emit an event so other code can handle launching the modal
  try {
    const ev = new CustomEvent('launch-notification', { detail: { id: id } });
    (document || window).dispatchEvent(ev);
  } catch (e) {
    // Last resort: log so it's discoverable in console
    // eslint-disable-next-line no-console
    console.warn('No launchNotificationModal implementation available for id:', id);
  }
}

export function initNotificationModal() {
  try {
    if (document.body && document.body.dataset.notificationInitBound === '1') return;
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest && event.target.closest('.action-launch-notifications-modal');
      if (!trigger) return;

      const id = trigger.dataset.id;
      if (!id) {
        alert('Missing data-id attribute.');
        return;
      }

      launchNotificationModal(id);
    });
    if (document.body) document.body.dataset.notificationInitBound = '1';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('initNotificationModal failed', e);
  }
}
