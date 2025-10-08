/*!
 * SearchPage class
 * - Encapsulates datepicker initialization and live search summary wiring
 * - Idempotent: safe to call init() multiple times
 *
 * Constructor options
 *   - root?: HTMLElement | Document (default: document)
 *
 * Usage
 *   const page = new SearchPage({ root: document });
 *   page.init();
 */
(function(global){
  class SearchPage {
        constructor(opts) {
            this.root = (opts && opts.root) || document;
        }
        _initDatepickers() {
            var scope = this.root || document;
            var dateEls = scope.querySelectorAll('.js-datepicker');
            try {
                if (global.AirDatepicker) {
                    var ideas = global.Ideas;
                    if (!ideas || !ideas.datepicker) {
                        console.warn('Ideas.datepicker config missing');
                        return;
                    }
                    var shared = ideas.datepicker;
                    var enLocale = shared.locale;
                    dateEls.forEach(function (el) {
                        if (el.dataset.adpBound === '1') return;
                        var baseOptions = shared.options;
                        new global.AirDatepicker(el, Object.assign({}, baseOptions, {
                            locale: enLocale,
                            onSelect: function () {
                                try {
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                } catch (_) { }
                            }
                        }));
                        el.dataset.adpBound = '1';
                    });
                } else {
                    // Air Datepicker not present; skip silently
                }
            } catch (e) {
                console.warn('Datepicker init failed', e);
            }
        }
        _isPlaceholderOpt(opt) {
            var txt = (opt.text || '').toLowerCase();
            return opt.value === '' || txt.indexOf('choose') >= 0 || txt.indexOf('open this select') >= 0;
        }
        _getLabelText(form, el) {
            if (el.id) {
                var lbl = form.querySelector('label[for="' + this._cssEscape(el.id) + '"]');
                if (lbl) return lbl.textContent.trim();
            }
            var parent = el.closest('.col, .col-md-3, .col-md-6, .col-md-4');
            if (parent) {
                var plbl = parent.querySelector('label');
                if (plbl) return plbl.textContent.trim();
            }
            return (el.name || el.id || 'Field').replace(/[_-]/g, ' ').trim();
        }
        _describeField(form, el) {
            if (el.disabled) return null;
            var tag = el.tagName;
            var type = (el.type || '').toLowerCase();
            var label = this._getLabelText(form, el);

            if (tag === 'SELECT') {
                var opts = Array.prototype.slice.call(el.selectedOptions || []);
                var selected = opts.filter(function (o) { return !this._isPlaceholderOpt(o); }.bind(this));
                if (selected.length === 0) return null;
                var values = selected.map(function (o) { return (o.label || o.text || o.value); }).filter(Boolean);
                if (el.multiple) return label + ' includes ' + values.map(function (v) { return '"' + v + '"'; }).join(', ');
                return label + ' is "' + values[0] + '"';
            }

            if (type === 'checkbox') {
                if (el.checked) {
                    var cbLabel = form.querySelector('label[for="' + this._cssEscape(el.id) + '"]');
                    var txt = cbLabel ? cbLabel.textContent.trim() : label;
                    return txt;
                }
                return null;
            }

            if (type === 'radio') {
                if (!el.checked) return null;
                return label + ' is "' + el.value + '"';
            }

            var val = (el.value || '').trim();
            if (!val) return null;

            var isDateLike = type === 'date' || el.classList.contains('date-input') || /date/i.test(el.id || '') || /date/i.test(el.name || '');
            if (isDateLike) return label + ' is "' + val + '"';

            if (type === 'number' || /^\d+(\.\d+)?$/.test(val)) return label + ' is ' + val;
            if (type === 'email') return label + ' contains "' + val + '"';
            return label + ' contains "' + val + '"';
        }
        _clearField(target) {
            if (!target) return;
            if (target.tagName === 'SELECT') {
                if (target.multiple) Array.prototype.forEach.call(target.options, function (o) { o.selected = false; });
                else {
                    var first = target.querySelector('option[value=""]') || target.options[0];
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
            } catch (_) { }
        }
        _bindSummary() {
            var scope = this.root || document;
            var sForm = scope.getElementById ? scope.getElementById('search-form') : document.getElementById('search-form');
            var summaryEl = scope.getElementById ? scope.getElementById('searchSummary') : document.getElementById('searchSummary');
            var clearAllBtn = scope.getElementById ? scope.getElementById('clearAllFilters') : document.getElementById('clearAllFilters');
            if (!sForm || !summaryEl) return;

            if (summaryEl.dataset.summaryBound === '1') return;

            var self = this;
            var debounceId;

                function getTabNameForElement(el){
                    var pane = el.closest && el.closest('.tab-pane[id]');
                    if (!pane) return null;
                    var id = pane.id;
                    var trigger = document.querySelector('[data-bs-toggle="tab"][data-bs-target="#' + id + '"]') ||
                                                document.querySelector('[data-bs-toggle="tab"][href="#' + id + '"]');
                    if (trigger && trigger.textContent) return trigger.textContent.trim();
                    var labelledBy = pane.getAttribute('aria-labelledby');
                    if (labelledBy){
                        var lblEl = document.getElementById(labelledBy);
                        if (lblEl && lblEl.textContent) return lblEl.textContent.trim();
                    }
                    return id || 'Tab';
                }

                function buildSummary(){
                    var elements = Array.prototype.slice.call(sForm.querySelectorAll('input, select, textarea'));
                    var items = [];
                    elements.forEach(function(el){
                        var phrase = self._describeField(sForm, el);
                        if (phrase) items.push({ el: el, phrase: phrase, group: getTabNameForElement(el) });
                    });
                    if (items.length === 0){
                        summaryEl.innerHTML = '<li class="text-body-secondary">No filters applied</li>';
                        summaryEl._items = [];
                        return;
                    }

                    // Partition into general (no group) and grouped by tab name
                    var general = [];
                    var groups = Object.create(null);
                    items.forEach(function(it, idx){
                        it._idx = idx; // preserve index mapping for removal
                        if (!it.group) general.push(it);
                        else {
                            if (!groups[it.group]) groups[it.group] = [];
                            groups[it.group].push(it);
                        }
                    });

                    // Keep tab order according to nav triggers
                    var order = Array.prototype.slice.call(document.querySelectorAll('[data-bs-toggle="tab"]'))
                        .map(function(tr){ return (tr.textContent || '').trim(); })
                        .filter(function(name){ return !!name; });

                    var html = [];
                    // Render general (non-tab) items first
                    general.forEach(function(it){
                        html.push('<li class="d-flex justify-content-between align-items-center gap-2 mb-1" data-item-idx="' + it._idx + '">\
                                                <span>' + it.phrase + '</span>\
                                                <button type="button" class="btn-close" aria-label="Remove filter"></button>\
                                            </li>');
                    });

                    // Render grouped tab items by nav order, then any remaining groups
                    var renderedGroups = Object.create(null);
                    order.forEach(function(name){
                        var arr = groups[name];
                        if (!arr || arr.length === 0) return;
                        renderedGroups[name] = true;
                        html.push('<li class="mt-2 mb-1 small text-uppercase text-muted">' + name.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</li>');
                        arr.forEach(function(it){
                            html.push('<li class="d-flex justify-content-between align-items-center gap-2 mb-1" data-item-idx="' + it._idx + '">\
                                                    <span>' + it.phrase + '</span>\
                                                    <button type="button" class="btn-close" aria-label="Remove filter"></button>\
                                                </li>');
                        });
                    });

                    // Any groups not in nav order (fallback)
                    Object.keys(groups).forEach(function(name){
                        if (renderedGroups[name]) return;
                        var arr = groups[name];
                        html.push('<li class="mt-2 mb-1 small text-uppercase text-muted">' + name.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</li>');
                        arr.forEach(function(it){
                            html.push('<li class="d-flex justify-content-between align-items-center gap-2 mb-1" data-item-idx="' + it._idx + '">\
                                                    <span>' + it.phrase + '</span>\
                                                    <button type="button" class="btn-close" aria-label="Remove filter"></button>\
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
                summaryEl.addEventListener('click', function (e) {
                    var btn = e.target.closest('.btn-close');
                    if (!btn) return;
                    var li = btn.closest('[data-item-idx]');
                    var idx = li ? parseInt(li.getAttribute('data-item-idx'), 10) : -1;
                    var items = summaryEl._items || [];
                    var target = (idx >= 0 && items[idx]) ? items[idx].el : null;
                    self._clearField(target);
                    buildSummary();
                });
                summaryEl.dataset.summaryClickBound = '1';
            }

            if (clearAllBtn && clearAllBtn.dataset.clearAllBound !== '1') {
                clearAllBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    sForm.reset();
                    Array.prototype.forEach.call(sForm.querySelectorAll('select[multiple]'), function (sel) {
                        Array.prototype.forEach.call(sel.options, function (o) { o.selected = false; });
                    });
                    buildSummary();
                });
                clearAllBtn.dataset.clearAllBound = '1';
            }

            buildSummary();
            summaryEl.dataset.summaryBound = '1';
        }
        init() {
            this._initDatepickers();
            this._bindSummary();
            return true;
        }
    }

  SearchPage.prototype._cssEscape = (global.CSS && CSS.escape) ? CSS.escape : function(id){ return String(id).replace(/"/g,'\\"'); };








  global.SearchPage = SearchPage;
})(window);
