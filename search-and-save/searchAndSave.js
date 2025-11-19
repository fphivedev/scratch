class SearchAndSave {
  constructor(opts = {}) {
    // selectors can be overridden
    this.selectors = Object.assign({
      addedResults: '#addedResults',
      searchResult: '#searchResult',
      searchInput: '#searchInput',
      searchAdd: '#searchAdd',
      actionAddClass: 'action-add-and-reload',
      actionDeleteClass: 'action-delete'
    }, opts);

    this.elAdded = document.querySelector(this.selectors.addedResults);
    this.elSearchResult = document.querySelector(this.selectors.searchResult);
    this.elSearchInput = document.querySelector(this.selectors.searchInput);
    this.elSearchAdd = document.querySelector(this.selectors.searchAdd);

    if (!this.elAdded || !this.elSearchResult) {
      console.warn('SearchAndSave: required elements not found');
    }

  // event system and optional callbacks
  this._listeners = {};
    this.onAddSuccess = opts.onAddSuccess || null;
    this.onAddError = opts.onAddError || null;
    this.onDeleteSuccess = opts.onDeleteSuccess || null;
    this.onDeleteError = opts.onDeleteError || null;
    this.onLoadAdded = opts.onLoadAdded || null;
    this.onLoadSearch = opts.onLoadSearch || null;
  }

  addEventListener(name, fn) {
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(fn);
  }

  _emit(name /*, ...args */) {
    const args = Array.prototype.slice.call(arguments, 1);
    if (this._listeners[name]) {
      this._listeners[name].forEach(fn => {
        try { fn.apply(null, args); } catch (e) { console.error('listener error', e); }
      });
    }
    // call direct callback prop if set (backwards-compatible)
    const cbName = 'on' + name.charAt(0).toUpperCase() + name.slice(1);
    if (typeof this[cbName] === 'function') {
      try { this[cbName].apply(null, args); } catch (e) { console.error(cbName + ' callback error', e); }
    }
  }

  init() {
    // initial load of existing results
    this.loadAddedResults();

    // wire search button
    if (this.elSearchAdd && this.elSearchInput) {
      this.elSearchAdd.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadSearchResults();
      });

      // optional: pressing Enter in search input triggers search
      this.elSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.loadSearchResults();
        }
      });
    }

    // delegate clicks for add/delete actions (works for dynamically loaded content)
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.' + this.selectors.actionAddClass);
      if (addBtn) {
        e.preventDefault();
        this.handleAddAndReload(addBtn);
        return;
      }
      const delBtn = e.target.closest('.' + this.selectors.actionDeleteClass);
      if (delBtn) {
        e.preventDefault();
        this.handleDelete(delBtn);
        return;
      }
    });
  }

  // helper to build/replace a query param in a URL string
  setOrAppendParam(url, key, value) {
    try {
      // Use URL API to handle relative URLs safely by providing base
      const u = new URL(url, window.location.href);
      u.searchParams.set(key, value);
      // Return relative URL if original was relative
      if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) {
        return u.pathname + u.search + u.hash;
      }
      return u.toString();
    } catch (err) {
      // Fallback for older environments: regex replace or append
      const encoded = encodeURIComponent(value);
      const re = new RegExp('([?&])' + key + '=[^&]*');
      if (re.test(url)) {
        return url.replace(re, '$1' + key + '=' + encoded);
      } else {
        return url + (url.indexOf('?') === -1 ? '?' : '&') + key + '=' + encoded;
      }
    }
  }

  async fetchText(url, opts = {}) {
    opts.credentials = opts.credentials || 'same-origin';
    const resp = await fetch(url, opts);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return resp.text();
  }

  async fetchJson(url, opts = {}) {
    opts.credentials = opts.credentials || 'same-origin';
    const resp = await fetch(url, opts);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return resp.json();
  }

  async loadAddedResults() {
    if (!this.elAdded) return;
    const url = this.elAdded.dataset.url;
    if (!url) return;
    this._setLoading(this.elAdded, true);
    try {
      const html = await this.fetchText(url);
      this.elAdded.innerHTML = html;
      this._emit('loadAdded', html, this.elAdded);
    } catch (err) {
      console.error('loadAddedResults error', err);
      this.elAdded.innerHTML = '<div class="error">Could not load items.</div>';
    } finally {
      this._setLoading(this.elAdded, false);
    }
  }

  async loadSearchResults() {
    if (!this.elSearchResult || !this.elSearchInput) return;
    let base = this.elSearchResult.dataset.url || '';
    const value = this.elSearchInput.value || '';
    // append to param name `searchInput` (matches your default.asp data-url)
    const url = this.setOrAppendParam(base, 'searchInput', value);
    this._setLoading(this.elSearchResult, true);
    try {
      const html = await this.fetchText(url);
      this.elSearchResult.innerHTML = html;
      this._emit('loadSearch', html, this.elSearchResult);
    } catch (err) {
      console.error('loadSearchResults error', err);
      this.elSearchResult.innerHTML = '<div class="error">Search failed.</div>';
    } finally {
      this._setLoading(this.elSearchResult, false);
    }
  }

  async handleAddAndReload(el) {
    // el is the clicked element with data-url attribute
    const url = el.dataset.url;
    if (!url) return;
    this._setElementLoading(el, true);
  try {
      // call endpoint; accept JSON or HTML; prefer JSON if content-type is application/json
      const resp = await fetch(url, { credentials: 'same-origin' });
      const ct = resp.headers.get('content-type') || '';
      if (!resp.ok) throw new Error('Request failed: ' + resp.status);
      if (ct.indexOf('application/json') !== -1) {
        const j = await resp.json();
        if (j && j.success) {
          this._emit('addSuccess', j, el);
          await this.loadAddedResults();
          // refresh search results so the UI reflects the newly-added item
          await this.loadSearchResults();
        } else {
          console.warn('add endpoint returned non-success JSON', j);
          this._emit('addError', j, el);
          // still reload to be safe
          await this.loadAddedResults();
          await this.loadSearchResults();
        }
      } else {
        // If non-json, treat it as HTML or text and reload the added list after
  const txt = await resp.text();
  this._emit('addSuccess', txt, el);
  await this.loadAddedResults();
  await this.loadSearchResults();
      }
    } catch (err) {
      console.error('handleAddAndReload error', err);
      // optionally show a small error near the element
      this._emit('addError', err, el);
      this._flashError(el, 'Add failed');
    } finally {
      this._setElementLoading(el, false);
    }
  }

  async handleDelete(el) {
    const url = el.dataset.url;
    if (!url) return;
    // optional confirmation if data-confirm attribute present
    const confirmMsg = el.dataset.confirm;
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    this._setElementLoading(el, true);
  try {
      const resp = await fetch(url, { credentials: 'same-origin' });
      const ct = resp.headers.get('content-type') || '';
      if (!resp.ok) throw new Error('Delete failed: ' + resp.status);
      if (ct.indexOf('application/json') !== -1) {
        const j = await resp.json();
        if (j && j.success) {
          this._emit('deleteSuccess', j, el);
          await this.loadAddedResults();
        } else {
          console.warn('delete returned non-success JSON', j);
          this._emit('deleteError', j, el);
          await this.loadAddedResults();
        }
      } else {
        // if delete returns HTML/text, still reload
        const txt = await resp.text();
        this._emit('deleteSuccess', txt, el);
        await this.loadAddedResults();
      }
    } catch (err) {
      console.error('handleDelete error', err);
      this._emit('deleteError', err, el);
      this._flashError(el, 'Delete failed');
    } finally {
      this._setElementLoading(el, false);
    }
  }

  // small UI helpers
  _setLoading(container, isLoading) {
    container.classList.toggle('loading', isLoading);
    if (isLoading) this._showSpinner(container); else this._hideSpinner(container);
  }

  _setElementLoading(el, isLoading) {
    if (isLoading) {
      el.dataset._disabled = '1';
      el.classList.add('loading');
      el.setAttribute('aria-busy', 'true');
      // add a small spinner next to the element using Font Awesome
      if (!el._sasSpinner) {
        const s = document.createElement('i');
        // Font Awesome spinner + small helper class
        s.className = 'fas fa-spinner fa-spin sas-spinner-inline';
        s.style.cssText = 'color:#666;font-size:12px;margin-left:6px';
        el.insertAdjacentElement('afterend', s);
        el._sasSpinner = s;
      }
    } else {
      delete el.dataset._disabled;
      el.classList.remove('loading');
      el.removeAttribute('aria-busy');
      if (el._sasSpinner) { el._sasSpinner.remove(); delete el._sasSpinner; }
    }
  }

  _flashError(el, msg) {
    // show a tiny tooltip-like message next to element for a short time
    try {
      const tip = document.createElement('span');
      tip.className = 'sas-error-tip';
      tip.textContent = msg;
      tip.style.cssText = 'color:#fff;background:#d33;padding:3px 6px;margin-left:6px;border-radius:3px;font-size:12px';
      el.insertAdjacentElement('afterend', tip);
      setTimeout(() => tip.remove(), 3000);
    } catch (err) {
      // ignore
    }
  }

  // spinner helpers (simple text-based spinner)
  _showSpinner(container) {
    if (!container) return;
    if (container._sasSpinner) return;
    try {
      const s = document.createElement('div');
      s.className = 'sas-spinner';
      s.style.cssText = 'color:#666;font-size:12px;margin-top:6px;display:flex;align-items:center;gap:6px';
      // use a Font Awesome spinner icon followed by optional text
      s.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span style="font-size:12px;color:#666">Loading…</span>';
      container.appendChild(s);
      container._sasSpinner = s;
    } catch (e) { /* ignore */ }
  }

  _hideSpinner(container) {
    if (!container) return;
    try {
      if (container._sasSpinner) { container._sasSpinner.remove(); delete container._sasSpinner; }
      const maybe = container.querySelector && container.querySelector('.sas-spinner');
      if (maybe) maybe.remove();
    } catch (e) { /* ignore */ }
  }
}