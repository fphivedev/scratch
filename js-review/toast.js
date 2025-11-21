// toast.js - small helpers to show bootstrap-like toasts and badges
function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3 d-flex flex-column align-items-end gap-2';
    document.body.appendChild(container);
  }
  return container;
}

export function showBootstrapToast(message, title = 'Notice', className = '') {
  const container = ensureToastContainer();

  const toastEl = document.createElement('div');
  toastEl.className = `toast ${className}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  const flex = document.createElement('div');
  flex.className = 'd-flex';

  const body = document.createElement('div');
  body.className = 'toast-body';
  body.textContent = `${title} ${message}`;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-close btn-close-dark me-2 m-auto';
  btn.setAttribute('data-bs-dismiss', 'toast');
  btn.setAttribute('aria-label', 'Close');

  flex.appendChild(body);
  flex.appendChild(btn);
  toastEl.appendChild(flex);
  container.appendChild(toastEl);

  const BootstrapToast = window.bootstrap && window.bootstrap.Toast;
  if (BootstrapToast) {
    try {
      const toast = new BootstrapToast(toastEl, { delay: 3000, autohide: true });
      toast.show();
    } catch (e) {
      toastEl.classList.add('show');
      setTimeout(() => toastEl.remove(), 3000);
    }
  } else {
    toastEl.classList.add('show');
    setTimeout(() => toastEl.remove(), 3000);
  }
}

export function showBadge(el, content) {
  if (!el) return;
  
  // Look for existing badge next to the element (sibling)
  let badge = el.nextElementSibling;
  if (!badge || !badge.classList.contains('badge')) {
    badge = document.createElement('span');
    badge.className = 'badge bg-secondary ms-2';
    // Insert badge as next sibling
    el.parentNode.insertBefore(badge, el.nextSibling);
  }
  
  badge.style.transition = '';
  badge.style.opacity = '1';
  badge.textContent = content;

  setTimeout(() => {
    badge.style.transition = 'opacity 1s';
    badge.style.opacity = '0';
    setTimeout(() => badge.remove(), 1000);
  }, 3000);
}
