// Small page utilities
// initSearchFormField: wire Enter key on header search input to navigate
export function initSearchFormField() {
  const el = document.getElementById('searchFormField');
  if (!el) return;

  // Use keydown to reliably catch Enter across browsers
  el.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const searchVal = (document.getElementById('searchFormField') || {}).value || '';
      if (searchVal.trim() !== '') {
        window.location.href = '?submit=search&case_number=' + encodeURIComponent(searchVal);
      }
    }
  });
}
