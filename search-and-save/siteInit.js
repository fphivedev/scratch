document.addEventListener('DOMContentLoaded', function () {
  // instantiate the module and wire simple callbacks/events
  const sas = new SearchAndSave();

  // example event listeners
  sas.addEventListener('loadAdded', function (html, container) {
    // run any post-processing on the added list if needed
    console.debug('added list loaded', container);
  });

  sas.addEventListener('loadSearch', function (html, container) {
    // highlight search results or attach extra handlers
    console.debug('search results loaded', container);
  });

  sas.addEventListener('addSuccess', function (resp, el) {
    console.info('add succeeded', resp, el);
  });

  sas.addEventListener('addError', function (err, el) {
    console.warn('add failed', err, el);
  });

  sas.addEventListener('deleteSuccess', function (resp, el) {
    console.info('delete succeeded', resp, el);
  });

  sas.addEventListener('deleteError', function (err, el) {
    console.warn('delete failed', err, el);
  });

  // expose for manual use in dev console
  window.sas = sas;

  sas.init();
});
