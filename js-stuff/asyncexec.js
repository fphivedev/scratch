(function () {
  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      // bottom-right, stack upward
      container.className =
        'toast-container position-fixed bottom-0 end-0 p-3 d-flex flex-column align-items-end gap-2';
      document.body.appendChild(container);
    }
    return container;
  }

  function showBootstrapToast(message, title = 'Notice') {
    const container = ensureToastContainer();

    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">${title}</strong>
        <small>just now</small>
        <button type="button" class="btn-close ms-2 mb-1" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${message}</div>
    `;

    container.appendChild(toastEl);

    const BootstrapToast = window.bootstrap && window.bootstrap.Toast;
    if (BootstrapToast) {
      const toast = new BootstrapToast(toastEl, { delay: 3000, autohide: true });
      toast.show();
    } else {
      toastEl.classList.add('show');
      setTimeout(() => toastEl.remove(), 3000);
    }
  }

  function showBadge(el, content) {
    let badge = el.querySelector('.badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge';
      el.appendChild(badge);
    }
    badge.style.transition = '';
    badge.style.opacity = '1';
    badge.textContent = `[${content}]`;

    setTimeout(() => {
      badge.style.transition = 'opacity 1s';
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 1000);
    }, 3000);
  }

  async function handleAsync(el) {
    const url = el?.dataset?.url;
    if (!url) return;

    try {
      const res = await fetch(url, { method: 'GET' });
      let text = await res.text();
      let content = text.trim();

      // Try to parse JSON if possible
      try {
        const json = JSON.parse(content);
        if (typeof json === 'object') {
          content =
            json.message ||
            json.status ||
            (json.success ? 'Success' : 'Done') ||
            JSON.stringify(json);
        }
      } catch {
        // not JSON, just plain text
      }

      if (el.classList.contains('show-toast')) {
        const label = el.textContent?.trim() || 'Notice';
        showBootstrapToast(content, label);
      } else {
        showBadge(el, content);
      }
    } catch (error) {
      console.error('Async action failed:', error);
      if (el.classList.contains('show-toast')) {
        showBootstrapToast('Request failed', 'Error');
      } else {
        showBadge(el, 'Error');
      }
    }
  }

  // Single delegated listener (no init timing issues)
  document.addEventListener('click', (evt) => {
    const el = evt.target.closest('.action-async-result');
    if (!el) return;

    // prevent spam
    if (el.dataset._busy === '1') return;
    el.dataset._busy = '1';

    handleAsync(el).finally(() => {
      el.dataset._busy = '0';
    });
  });
})();
