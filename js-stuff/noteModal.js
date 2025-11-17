// notesModal.js
export const BASE_URL = 'https://jsonplaceholder.typicode.com/todos/'; // change as needed

/**
 * Launches a Bootstrap modal and loads JSON into it.
 * You can override selectors and baseUrl per call if needed.
 */
export async function launchNotesModal(
  id,
  {
    modalSelector = '#dataModal',
    containerSelector = '#dataContainer',
    baseUrl = BASE_URL,
  } = {}
) {
  const modalEl = document.querySelector(modalSelector);
  if (!modalEl) throw new Error(`Modal element not found: ${modalSelector}`);

  // Prefer container inside the modal if present; otherwise fallback to a global query
  const dataContainer =
    modalEl.querySelector(containerSelector) || document.querySelector(containerSelector);
  if (!dataContainer) throw new Error(`Container element not found: ${containerSelector}`);

  // Use Bootstrap’s helper to avoid double-instantiation
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

  const dataUrl = `${baseUrl}${encodeURIComponent(id)}`;
  dataContainer.innerHTML = '<div class="text-muted">Loading…</div>';
  bsModal.show();

  try {
    const res = await fetch(dataUrl, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const obj = Array.isArray(json) ? (json[0] ?? {}) : json;

    dataContainer.innerHTML = '';
    if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
      for (const [key, value] of Object.entries(obj)) {
        const p = document.createElement('p');
        const valText =
          value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value);
        p.textContent = `${key} - ${valText}`;
        dataContainer.appendChild(p);
      }
    } else {
      dataContainer.innerHTML = '<p class="text-muted">No data available.</p>';
    }
  } catch (err) {
    dataContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Failed to load data: ${err.message}
      </div>`;
  }
}
