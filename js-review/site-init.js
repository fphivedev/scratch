// ES module bootstrapper
import { SearchPage } from './search-page.js';
import { datepicker } from './date-config.js';
import { launchNotificationModal } from './launch-notification-modal.js';
import { loadHtmlIntoElement, initAutoLoadHtml  } from './load-html-into-element.js';
import { SearchAndSave  } from './search-and-save.js';

// initialise the datepicker
function initDatepickers(root) {
    const scope = root || document;
    const dateEls = scope.querySelectorAll('.js-datepicker');
    try {
        if (window.AirDatepicker) {
            const shared = datepicker;
            const enLocale = shared.locale;
            dateEls.forEach((el) => {
                if (el.dataset.adpBound === '1') return;
                const baseOptions = shared.options;
                // eslint-disable-next-line no-new
                new window.AirDatepicker(el, Object.assign({}, baseOptions, { locale: enLocale }));
                el.dataset.adpBound = '1';
            });
        }
    } catch (e) {
        console.warn('Datepicker init failed', e);
    }
}

// document upload forms + checkboxes don't play nice, so collect all the values into an array and then submit
function collectCheckboxesIntoArrays(form) {
  const groups = {};

  // Group all checkboxes by name
  form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (!groups[cb.name]) groups[cb.name] = [];
    groups[cb.name].push(cb);
  });

  // For each group with multiple checkboxes, create a hidden array field
  for (const [baseName, checkboxes] of Object.entries(groups)) {

    const checkedValues = checkboxes
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    // Remove any existing hidden field for this group (to avoid duplicates)
    const existing = form.querySelector(`input[name="${baseName}Array"]`);
    if (existing) existing.remove();

    // Create a hidden input with comma-delimited checked values
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = `${baseName}Array`;
    hidden.value = checkedValues.join(",");
    form.appendChild(hidden);
  }
}


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
	
	// initialise the wysiwig notes editor (Quill library)
	if (document.getElementById("editor")) {
		// initialise the quill html editor for the notes
		const quill = new Quill('#editor', {
			modules: {
				toolbar: ['bold', 'italic']
			},
			formats: ['italic', 'bold'],
			theme: 'snow'
		});
		
		// copy the  wysiwig notes editor content over to an input field for saving
		const editAppealsForm = document.getElementById('editAppealsForm');
		const notesContent = document.getElementById('notesContent');

		editAppealsForm.addEventListener('submit', function(event) {
			
			// Prevent default form submission to manually handle content
			event.preventDefault();
			
			// ensure the variable for the submit button gets copied over
			const submitButton = event.submitter;
			const submitInput = document.getElementById('submitSaveValue');
			if (submitButton && submitButton.type === 'submit' && submitInput) {
				submitInput.value = submitButton.value;
			}

			// Get Quill's content (e.g., as HTML or Delta format)
			notesContent.value = quill.root.innerHTML; // For HTML
			// Or for Delta format: notesContent.value = JSON.stringify(quill.getContents());
			
			// ensure that checkboxes are passed as an Array of values
			collectCheckboxesIntoArrays(this);

			// Now submit the form
			editAppealsForm.submit();
		});
				
		
				
		// enable the notes editing form 
		// Attach click handler to all current and future elements with the class action-edit-notes
		editAppealsForm.addEventListener("click", async (event) => {
			const btn = event.target.closest(".action-edit-notes");
			if (!btn) return; // Not a matching element

			const noteId = btn.dataset.id;
			if (!noteId) return;

			try {
				// Fetch JSON data for that note
				const response = await fetch(`default.asp?responseType=json&action=getSingleNote&id=${noteId}`);
				if (!response.ok) throw new Error(`HTTP error ${response.status}`);

				const data = await response.json();

				// Update form fields
				document.querySelector("#notesID").value = data.notesID || "";
				document.querySelector("#note_action_court_related").value = data.note_action_court_related || "";
				document.querySelector("#note_sub_typeID").value = (String(data.note_sub_typeID) || "") + ("|" + String(data.note_tertiary_typeID) || "");
				document.querySelector("#note_date").value = data.note_date || "";			  
				
				// Set the contents of the Quill editor with the generated Delta
				const delta = quill.clipboard.convert({ html: data.note });
				quill.setContents(delta, 'silent'); // 'silent' source prevents triggering change events
				
				// cancel the edit form
				const cancelEditNote = document.querySelector("#cancelEditNote");
				if (cancelEditNote) {
					cancelEditNote.classList.remove('d-none');
					cancelEditNote.addEventListener("click", async (event) => {								
								
						document.querySelector("#notesID").value = "";
						document.querySelector("#note_action_court_related").value = "";
						document.querySelector("#note_sub_typeID").value = "";
						document.querySelector("#note_date").value = "";		
						quill.setContents('', 'silent'); 
						cancelEditNote.classList.add('d-none');
					});
				}
				
			  
			} catch (err) {
			  console.error("Error fetching note:", err);
			  alert("Failed to load note details.");
			}
		});
	};
	
});

(function () {
  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      // bottom-right, stack upward
      container.className =
        'toast-container position-fixed bottom-0 end-0 p-3 d-flex flex-column align-items-end gap-2';
      document.body.appendChild(container);
    }
    return container;
  }

  function showBootstrapToast(message, title = 'Notice', className = '') {
    const container = ensureToastContainer();

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${className}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
	 <div class="d-flex">
    <div class="toast-body">
      ${title} ${message}
    </div>
    <button type="button" class="btn-close btn-close-dark me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
  </div>
    `;
	
    container.appendChild(toastEl);

    const BootstrapToast = window.bootstrap && window.bootstrap.Toast;
    if (BootstrapToast) {
      const toast = new BootstrapToast(toastEl, { delay: 3000, autohide: true });
      toast.show();
    } else {
      toastEl.classList.add('show');
      setTimeout(() => toastEl.remove(), 3000);
    }
  }

  function showBadge(el, content) {
    let badge = el.querySelector('.badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge';
      el.appendChild(badge);
    }
    badge.style.transition = '';
    badge.style.opacity = '1';
    badge.textContent = `[${content}]`;

    setTimeout(() => {
      badge.style.transition = 'opacity 1s';
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 1000);
    }, 3000);
  }

  async function handleAsync(el) {
    const url = el?.dataset?.url;
    if (!url) return;

    try {
      const res = await fetch(url, { method: 'GET' });
      let text = await res.text();
      let content = text.trim();
	  let className = '';

      // Try to parse JSON if possible
      try {
        const json = JSON.parse(content);
		console.log(json);
        if (typeof json === 'object') {
          content =
            json.message ||
            json.status ||
            (json.success ? 'Success' : 'Done') ||
            JSON.stringify(json);
			
		 className= json.className
        }
      } catch {
        // not JSON, just plain text
      }

      if (el.classList.contains('show-toast')) {
        const label = el.textContent?.trim() || 'Notice';
        showBootstrapToast(content, label, className);
      } else {
        showBadge(el, content);
      }
    } catch (error) {
      console.error('Async action failed:', error);
      if (el.classList.contains('show-toast')) {
        showBootstrapToast('Request failed', 'Error', 'bg-danger-subtle border border-danger-subtle');
      } else {
        showBadge(el, 'Error');
      }
    }
  }

  // Single delegated listener (no init timing issues)
  document.addEventListener('click', (evt) => {
    const el = evt.target.closest('.action-async-result');
    if (!el) return;

    // prevent spam
    if (el.dataset._busy === '1') return;
    el.dataset._busy = '1';

    handleAsync(el).finally(() => {
      el.dataset._busy = '0';
    });
  });
})();

// load tab from url / update url with current tab
  document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");

    // Show the correct tab if ?tab= exists
    if (tabParam) {
      const tabTrigger = document.querySelector(`[data-bs-target="#${tabParam}"]`);
      if (tabTrigger) {
        const tab = new bootstrap.Tab(tabTrigger);
        tab.show();
      }
    }

    // Listen for tab changes and update only the "tab" param
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(link => {
      link.addEventListener("shown.bs.tab", e => {
        const targetSelector = e.target.dataset.bsTarget; // e.g. "#notes"
        const tabId = targetSelector.substring(1);

        // Copy current URL params
        const newParams = new URLSearchParams(window.location.search);
        newParams.set("tab", tabId); // add or update the tab param

        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        history.replaceState(null, "", newUrl); // update URL without reload
		
		const tab = document.getElementById("tab");
		if (tab) tab.value = tabId;
      });
    });
  });
  


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
