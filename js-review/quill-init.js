// Quill / notes editor initialization and wiring
import { collectCheckboxesIntoArrays } from './form-utils.js';

export function initQuillNotes() {
  if (!document.getElementById("editor")) return;

  // initialise the quill html editor for the notes
  const quill = new Quill('#editor', {
    modules: {
      toolbar: ['bold', 'italic']
    },
    formats: ['italic', 'bold'],
    theme: 'snow'
  });

  // copy the wysiwig notes editor content over to an input field for saving
  const editAppealsForm = document.getElementById('editAppealsForm');
  const notesContent = document.getElementById('notesContent');

  if (editAppealsForm && notesContent) {
    editAppealsForm.addEventListener('submit', function (event) {
      // Prevent default form submission to manually handle content
      event.preventDefault();

      // ensure the variable for the submit button gets copied over
      const submitButton = event.submitter;
      const submitInput = document.getElementById('submitSaveValue');
      if (submitButton && submitButton.type === 'submit' && submitInput) {
        submitInput.value = submitButton.value;
      }

      // Get Quill's content (e.g., as HTML)
      notesContent.value = quill.root.innerHTML;

      // Ensure that checkboxes are passed as an Array of values
      collectCheckboxesIntoArrays(this);

      // Now submit the form
      editAppealsForm.submit();
    });

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
        quill.setContents(delta, 'silent');

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
  }
}
