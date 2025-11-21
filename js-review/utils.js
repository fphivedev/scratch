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

// initGoLinks: delegated click handler for .go elements with data-url
// - .go + data-url → navigate to URL in same tab
// - .go.go-new + data-url → open URL in new tab
export function initGoLinks() {
  try {
    if (document.body && document.body.dataset.goLinksInitBound === '1') return;
    
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest && event.target.closest('.go');
      if (!trigger) return;

      const url = trigger.dataset.url;
      if (!url) return;

      // Prevent default if it's an anchor or button
      event.preventDefault();

      if (trigger.classList.contains('go-new')) {
        // Open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        // Navigate in same tab
        window.location.href = url;
      }
    });
    
    if (document.body) document.body.dataset.goLinksInitBound = '1';
  } catch (e) {
    console.warn('initGoLinks failed', e);
  }
}
