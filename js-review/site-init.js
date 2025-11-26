import { SearchPage } from './search-page.js';
import { datepicker } from './date-config.js';
import { initModalLoader } from './launch-modal.js';
import { initAutoLoadHtml } from './load-html-into-element.js';
import { fetchInit } from './fetch.js';
import { initDatepickers } from './date-init.js';
import { initQuillNotes } from './quill-init.js';
import { initTabs } from './tabs.js';
import { initSearchAndSave } from './search-and-save.js';
import { initSearchFormField, initGoLinks, initTableSort, updateTableSortArrows } from './utils.js';

// initialise components after the dom has loaded
document.addEventListener('DOMContentLoaded', () => {

  // Initialise the search form (if this is the search form)
  // Otherwise initialise the rest of the site elements
  const hasSearchForm = !!document.getElementById('search-form');
  if (hasSearchForm) {
    try { new SearchPage({ root: document }).init(datepicker); }
    catch (e) { console.warn('SearchPage init failed', e); }
  } else {
    initDatepickers(document);
  }


  // Initialise notification modal launcher (delegated handler)
  initModalLoader('/api/notifications/');

  // also initialise tab handling
  initTabs();

  // submit the header search form (moved to utils.js)
  initSearchFormField();

  // Initialise .go click navigation links
  initGoLinks();

  // Initialise table sorting
  initTableSort();
  updateTableSortArrows();

  // initialise the wysiwig notes editor via quill-init.js
  initQuillNotes();

  // initialise SearchAndSave via module
  const sas = initSearchAndSave();
  window.sas = sas;

  // load any html on .action-load-url-into-element + data-url=urlEndPoint
  initAutoLoadHtml();

  // Initialise delegated fetch/async handlers
  fetchInit();
});
