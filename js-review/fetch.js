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
    } else {
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
  } else {
    showBadge(el, content);
  }
}
