function initAsyncActionResults() {
  // Ensure a toast container exists (for Bootstrap toasts)
  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      document.body.appendChild(container);
    }
    return container;
  }

  function showBootstrapToast(message, title = 'Notice') {
    const container = ensureToastContainer();

    // Build toast element
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

    // Use Bootstrap's JS API if available
    const BootstrapToast = window.bootstrap && window.bootstrap.Toast;
    if (BootstrapToast) {
      const toast = new BootstrapToast(toastEl, { delay: 3000, autohide: true });
      toast.show();
    } else {
      // Fallback if Bootstrap JS isn't loaded: simple auto-hide
      toastEl.classList.add('show'); // visually display
      setTimeout(() => toastEl.remove(), 3000);
    }
  }

  function showBadge(el, content) {
    // Reuse existing .badge if present, otherwise create one
    let badge = el.querySelector('.badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge';
      el.appendChild(badge);
    }

    // Reset any previous fade
    badge.style.transition = '';
    badge.style.opacity = '1';

    badge.textContent = `[${content}]`;

    // Fade out and remove after 3 seconds
    setTimeout(() => {
      badge.style.transition = 'opacity 1s';
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 1000);
    }, 3000);
  }

  // Attach behavior to a single element
  const attachHandler = el => {
    if (el.dataset.asyncBound) return; // avoid double-binding
    el.dataset.asyncBound = 'true';

    el.addEventListener('click', async () => {
      const url = el.dataset.url;
      if (!url) return;

      // For badge mode, remove any old badge so we don't stack
      if (!el.classList.contains('show-badge') && !el.classList.contains('show-toast')) {
        const existingBadge = el.querySelector('.badge');
        if (existingBadge) existingBadge.remove();
      }

      try {
        const response = await fetch(url, { method: 'GET' });
        const text = (await response.text()).trim() || 'OK';

        // Priority: show-toast > show-badge > default (badge)
        if (el.classList.contains('show-toast')) {
          const label = el.textContent?.trim() || 'Notice';
          showBootstrapToast(text, label);
        } else {
          // Either explicitly show-badge or default to badge behavior
          showBadge(el, text);
        }
      } catch (error) {
        console.error('Async action failed:', error);
        if (el.classList.contains('show-toast')) {
          showBootstrapToast('Request failed', 'Error');
        } else {
          showBadge(el, 'Error');
        }
      }
    });
  };

  // Initial binding
  document.querySelectorAll('.action-async-result').forEach(attachHandler);

  // Observe for dynamically added elements
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList.contains('action-async-result')) {
            attachHandler(node);
          } else {
            node.querySelectorAll?.('.action-async-result').forEach(attachHandler);
          }
        }
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Run once on page load
document.addEventListener('DOMContentLoaded', initAsyncActionResults);
