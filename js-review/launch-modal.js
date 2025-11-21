/*
 * Notification Modal Launcher (ES module)
 * - Provides delegated click handler for notification modal triggers
 * - Idempotent initializer for .action-launch-notifications-modal elements
 *
 * Usage:
 *   import { initNotificationModal } from './launch-notification-module.js';
 *   initNotificationModal();
 */

// Default configuration
const DEFAULT_CONFIG = {
  modalSelector: '#dataModal',
  containerSelector: '#dataContainer',
  baseUrl: '/api/notifications/', // adjust to your endpoint
};

/**
 * Fetches notification data and displays it in a Bootstrap modal.
 * @param {string|number} id - The notification ID to fetch
 * @param {Object} options - Configuration options
 * @param {string} options.modalSelector - CSS selector for the modal element
 * @param {string} options.containerSelector - CSS selector for content container
 * @param {string} options.baseUrl - Base URL for the notification API endpoint
 */
export async function launchModal(id, options = {}) {
  if (!id) return;

  const config = { ...DEFAULT_CONFIG, ...options };
  const { modalSelector, containerSelector, baseUrl } = config;

  const modalEl = document.querySelector(modalSelector);
  if (!modalEl) {
    console.error(`Modal element not found: ${modalSelector}`);
    return;
  }

  // Find container inside modal first, fallback to global selector
  const dataContainer = modalEl.querySelector(containerSelector) || document.querySelector(containerSelector);
  if (!dataContainer) {
    console.error(`Container element not found: ${containerSelector}`);
    return;
  }

  // Use Bootstrap's helper to get or create modal instance
  let bsModal;
  try {
    if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal) {
      bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    } else {
      console.warn('Bootstrap Modal not available, falling back to manual show');
      // Fallback: just add show class if Bootstrap isn't loaded
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
      modalEl.setAttribute('aria-modal', 'true');
      modalEl.removeAttribute('aria-hidden');
      document.body.classList.add('modal-open');
      // Create backdrop if needed
      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
    }
  } catch (e) {
    console.warn('Error initializing modal:', e);
  }

  // Show loading state
  dataContainer.innerHTML = '<div class="text-muted">Loading…</div>';
  if (bsModal) bsModal.show();

  // Fetch and display notification data
  const dataUrl = `${baseUrl}${encodeURIComponent(id)}`;
  try {
    const res = await fetch(dataUrl, { 
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const json = await res.json();
    const data = Array.isArray(json) ? (json[0] ?? {}) : json;

    dataContainer.innerHTML = '';
    
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      // Build content from JSON object
      for (const [key, value] of Object.entries(data)) {
        const p = document.createElement('p');
        const valText = value !== null && typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
        p.innerHTML = `<strong>${escapeHtml(key)}:</strong> ${escapeHtml(valText)}`;
        dataContainer.appendChild(p);
      }
    } else {
      dataContainer.innerHTML = '<p class="text-muted">No data available.</p>';
    }
  } catch (err) {
    dataContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Failed to load notification: ${escapeHtml(err.message)}
      </div>`;
  }
}

// Simple HTML escaping helper
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

export function initModalLoader() {
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

      launchModal(id);
    });
    if (document.body) document.body.dataset.notificationInitBound = '1';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('initNotificationModal failed', e);
  }
}
