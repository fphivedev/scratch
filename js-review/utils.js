// Small page utilities
// initSearchFormField: wire Enter key and button click on search input to navigate
// - Looks for #searchFormField (input) and #searchFormButton (button with data-url)
// - Optionally collects checked checkboxes with name="decision_typeID"
// - Navigates to data-url with search and tribunal params
export function initSearchFormField() {
  const searchInput = document.getElementById('searchFormField');
  const searchButton = document.getElementById('searchFormButton');
  
  if (!searchInput && !searchButton) return;

  // Build URL with search parameters
  function performSearch() {
    const baseUrl = searchButton?.dataset?.url || '?submit=search';
    const searchVal = searchInput?.value || '';
    const checkedBoxes = document.querySelectorAll('input[name="decision_typeID"]:checked');
    const decision_typeID = Array.from(checkedBoxes).map(cb => cb.value);
      
    const urlParams = new URLSearchParams(baseUrl.includes('?') ? baseUrl.split('?')[1] : '');
    
    if (searchVal.trim()) {
      urlParams.set('search', searchVal);
    }
    
    if (decision_typeID.length > 0) {
      urlParams.set('tribunal', decision_typeID.join(','));
    }
    
    // Preserve base path from data-url
    const basePath = baseUrl.split('?')[0];
    window.location.href = basePath + '?' + urlParams.toString();
  }

  // Wire Enter key on search input
  if (searchInput) {
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        performSearch();
      }
    });
  }

  // Wire click on search button
  if (searchButton) {
    searchButton.addEventListener('click', function (event) {
      event.preventDefault();
      performSearch();
    });
  }
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

// initTableSort: delegated click handler for sortable table headers
// - Add class 'sortable' to table headers that should be sortable
// - Headers can have data-column attribute (defaults to column index if not provided)
// - Clicking toggles between ASC/DESC and navigates with sort params
// - URL params: sortColumn=X&sortDir=ASC|DESC
export function initTableSort() {
  try {
    if (document.body && document.body.dataset.tableSortInitBound === '1') return;
    
    document.addEventListener('click', (event) => {
      const header = event.target.closest && event.target.closest('th.sortable');
      if (!header) return;

      event.preventDefault();

      // Get column identifier (use data-column or calculate index)
      let columnId = header.dataset.column;
      if (!columnId) {
        // Calculate column index
        const row = header.parentElement;
        const headers = Array.from(row.querySelectorAll('th'));
        columnId = String(headers.indexOf(header));
      }

      // Determine current sort direction from URL params or header state
      const urlParams = new URLSearchParams(window.location.search);
      const currentColumn = urlParams.get('sortColumn');
      const currentDir = urlParams.get('sortDir') || 'ASC';

      // Toggle direction if clicking same column, otherwise default to ASC
      let newDir = 'ASC';
      if (currentColumn === columnId) {
        newDir = currentDir === 'ASC' ? 'DESC' : 'ASC';
      }

      // Update URL params
      urlParams.set('sortColumn', columnId);
      urlParams.set('sortDir', newDir);

      // Navigate to new URL
      window.location.search = urlParams.toString();
    });
    
    if (document.body) document.body.dataset.tableSortInitBound = '1';
  } catch (e) {
    console.warn('initTableSort failed', e);
  }
}

// updateTableSortArrows: visually update sort arrows based on current URL params
// Call this after page load to show current sort state
export function updateTableSortArrows() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sortColumn = urlParams.get('sortColumn');
    const sortDir = urlParams.get('sortDir') || 'ASC';

    // Remove all existing sort indicators
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      // Remove any existing arrow spans
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.remove();
    });

    if (!sortColumn) return;

    // Find and mark the active sorted column
    const activeHeader = document.querySelector(`th.sortable[data-column="${sortColumn}"]`);
    if (activeHeader) {
      activeHeader.classList.add(sortDir === 'ASC' ? 'sort-asc' : 'sort-desc');
      
      // Add visual arrow indicator
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow ms-1';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = sortDir === 'ASC' ? '▲' : '▼';
      activeHeader.appendChild(arrow);
    } else {
      // Try to find by index if data-column wasn't set
      document.querySelectorAll('th.sortable').forEach((th, index) => {
        if (!th.dataset.column && String(index) === sortColumn) {
          th.classList.add(sortDir === 'ASC' ? 'sort-asc' : 'sort-desc');
          
          const arrow = document.createElement('span');
          arrow.className = 'sort-arrow ms-1';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = sortDir === 'ASC' ? '▲' : '▼';
          th.appendChild(arrow);
        }
      });
    }
  } catch (e) {
    console.warn('updateTableSortArrows failed', e);
  }
}
