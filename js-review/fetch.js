import { showBootstrapToast, showBadge } from './toast.js';

export async function fetchJsonOrText(url, opts = {}) {
  opts.credentials = opts.credentials || 'same-origin';
  try {
    const res = await fetch(url, opts);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const txt = await res.text().catch(() => null);
      return { ok: false, status: res.status, text: txt };
    }
    if (ct.indexOf('application/json') !== -1) {
      const j = await res.json();
      return { ok: true, status: res.status, json: j };
    }
    const text = await res.text();
    return { ok: true, status: res.status, text };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function handleAsync(el) {
  const url = el?.dataset?.url;
  if (!url) return;

  const result = await fetchJsonOrText(url, { method: 'GET' });
  if (!result.ok) {
    if (el.classList.contains('show-toast')) {
      showBootstrapToast('Request failed', 'Error', 'bg-danger-subtle border border-danger-subtle');
    } else if (el.classList.contains('show-badge')) {
      showBadge(el, 'Error');
    }
    return;
  }

  let content = '';
  let className = '';
  if (result.json) {
    const json = result.json;
    content = json.message || json.status || (json.success ? 'Success' : 'Done') || JSON.stringify(json);
    if (json.className) className = json.className;
  } else if (result.text) {
    content = result.text.trim();
  }

  if (el.classList.contains('show-toast')) {
    const label = el.textContent?.trim() || 'Notice';
    showBootstrapToast(content, label, className);
  } else if (el.classList.contains('show-badge')) {
    showBadge(el, content);
  }
}

// Initialise delegated async handlers (idempotent)
export function fetchInit() {
  try {
    if (document.body && document.body.dataset.fetchInitBound === '1') return;
    document.addEventListener('click', (evt) => {
      const el = evt.target && evt.target.closest && evt.target.closest('.action-async-result');
      if (!el) return;

      if (el.dataset._busy === '1') return;
      el.dataset._busy = '1';
      // call handleAsync and ensure we clear busy flag when finished
      // handleAsync is in this module's scope
      handleAsync(el).finally(() => { el.dataset._busy = '0'; });
    });
    if (document.body) document.body.dataset.fetchInitBound = '1';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('fetchInit failed', e);
  }
}
