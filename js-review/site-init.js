// ES module bootstrapper (final, refactored)
import { SearchPage } from './search-page.js';
import { datepicker } from './date-config.js';
import { launchNotificationModal } from './launch-notification-modal.js';
import { initAutoLoadHtml } from './load-html-into-element.js';
import { handleAsync } from './fetch.js';
import { initDatepickers } from './date-init.js';
import { initQuillNotes } from './quill-init.js';
import { initTabs } from './tabs.js';
import { initSas } from './seach-and-save-init.js';

// initialise components after the dom has loaded
document.addEventListener('DOMContentLoaded', () => {
  // load any html on .action-load-url-into-element + data-url=urlEndPoint
  initAutoLoadHtml();

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.action-launch-notifications-modal');
    if (!trigger) return;

    const id = trigger.dataset.id;
    if (!id) {
      alert('Missing data-id attribute.');
      return;
    }

    launchNotificationModal(id);
  });

  // Initialise the search form (if this is the search form)
  // Otherwise initialise the rest of the site elements
  const hasSearchForm = !!document.getElementById('search-form');
  if (hasSearchForm) {
    try { new SearchPage({ root: document }).init(datepicker); }
    catch (e) { console.warn('SearchPage init failed', e); }
  } else {
    initDatepickers(document);
  }

  // also initialise tab handling
  initTabs();

  // submit the header search form
  if (document.getElementById("searchFormField")) {
    const headerSearchInput = document.getElementById("searchFormField");
    headerSearchInput.addEventListener('keypress', function(event ) {
      if (event.key === 'Enter' ) {
        event.preventDefault();
        const searchVal = document.getElementById("searchFormField").value;
        if (searchVal.trim() != '') {
          window.location.href = '?submit=search&case_number='  + searchVal;
        }
      }
      return true;
    });
  };

  // initialise the wysiwig notes editor via quill-init.js
  initQuillNotes();

  // initialise SearchAndSave via module
  const sas = initSas();
  window.sas = sas;
});

// Small delegated async handler that uses the shared fetch helper
document.addEventListener('click', (evt) => {
  const el = evt.target.closest('.action-async-result');
  if (!el) return;

  if (el.dataset._busy === '1') return;
  el.dataset._busy = '1';
  handleAsync(el).finally(() => { el.dataset._busy = '0'; });
});
