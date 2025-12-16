/**
 * Modal form handler for single text input with fetch POST
 * Usage: Add class 'modal-form-trigger' with data attributes:
 * - data-modal-id: ID of the modal element
 * - data-post-url: URL to POST to
 * - data-input-label: Label for the text input (optional, default "Description")
 * - data-input-placeholder: Placeholder text (optional)
 * - data-input-name: Name attribute for the input (optional, default "description")
 * - data-success-message: Custom success message (optional, uses server response if available)
 * 
 * Modal HTML structure expected:
 * <div class="modal fade" id="yourModalId">
 *   <div class="modal-dialog">
 *     <div class="modal-content">
 *       <div class="modal-header">
 *         <h5 class="modal-title">Title</h5>
 *         <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
 *       </div>
 *       <div class="modal-body">
 *         <form class="modal-form">
 *           <div class="mb-3">
 *             <label class="form-label modal-form-label">Label</label>
 *             <input type="text" class="form-control modal-form-input" required>
 *           </div>
 *           <div class="alert d-none modal-form-alert"></div>
 *         </form>
 *       </div>
 *       <div class="modal-footer">
 *         <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
 *         <button type="button" class="btn btn-primary modal-form-submit">Save</button>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 */

export function initModalForm() {
  try {
    if (document.body && document.body.dataset.modalFormInitBound === '1') return;

    // Store modal instances
    const modalInstances = new Map();

    document.addEventListener('click', async (event) => {
      const trigger = event.target.closest && event.target.closest('.modal-form-trigger');
      if (!trigger) return;

      event.preventDefault();

      const modalId = trigger.dataset.modalId;
      const postUrl = trigger.dataset.postUrl;

      if (!modalId || !postUrl) {
        console.warn('modal-form: missing data-modal-id or data-post-url');
        return;
      }

      const modalEl = document.getElementById(modalId);
      if (!modalEl) {
        console.warn(`modal-form: modal not found with id "${modalId}"`);
        return;
      }

      // Get or create Bootstrap modal instance
      let modal = modalInstances.get(modalId);
      if (!modal) {
        modal = new bootstrap.Modal(modalEl);
        modalInstances.set(modalId, modal);
      }

      // Get form elements
      const form = modalEl.querySelector('.modal-form');
      const input = modalEl.querySelector('.modal-form-input');
      const label = modalEl.querySelector('.modal-form-label');
      const alert = modalEl.querySelector('.modal-form-alert');
      const submitBtn = modalEl.querySelector('.modal-form-submit');

      if (!form || !input || !submitBtn) {
        console.warn('modal-form: required form elements not found in modal');
        return;
      }

      // Configure form based on trigger data attributes
      const inputLabel = trigger.dataset.inputLabel || 'Description';
      const inputPlaceholder = trigger.dataset.inputPlaceholder || '';
      const inputName = trigger.dataset.inputName || 'description';

      if (label) label.textContent = inputLabel;
      input.placeholder = inputPlaceholder;
      input.name = inputName;
      input.value = '';

      // Hide alert
      if (alert) {
        alert.classList.add('d-none');
        alert.classList.remove('alert-success', 'alert-danger');
      }

      // Reset button state
      submitBtn.disabled = false;
      const originalBtnText = submitBtn.textContent;

      // Handle form submission
      const handleSubmit = async () => {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Saving...';

        try {
          // Build form data
          const formData = new FormData();
          formData.append(inputName, input.value);

          // Include any additional data from trigger
          if (trigger.dataset.additionalData) {
            try {
              const additionalData = JSON.parse(trigger.dataset.additionalData);
              Object.entries(additionalData).forEach(([key, value]) => {
                formData.append(key, value);
              });
            } catch (e) {
              console.warn('modal-form: failed to parse additional data', e);
            }
          }

          const response = await fetch(postUrl, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
          });

          let result;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          } else {
            const text = await response.text();
            result = { success: response.ok, message: text };
          }

          if (result.success || response.ok) {
            // Show success message
            const successMessage = trigger.dataset.successMessage || result.message || 'Saved successfully';
            
            if (alert) {
              alert.className = 'alert alert-success';
              alert.textContent = successMessage;
              alert.classList.remove('d-none');
            }

            // Reset form
            form.reset();

            // Close modal after brief delay
            setTimeout(() => {
              modal.hide();
              if (alert) alert.classList.add('d-none');
            }, 1500);

            // Dispatch custom event for parent page to handle
            trigger.dispatchEvent(new CustomEvent('modal-form-success', {
              bubbles: true,
              detail: { result, input: input.value }
            }));
          } else {
            // Show error
            const errorMessage = result.message || 'Failed to save. Please try again.';
            
            if (alert) {
              alert.className = 'alert alert-danger';
              alert.textContent = errorMessage;
              alert.classList.remove('d-none');
            }
          }
        } catch (error) {
          console.error('modal-form: save failed', error);
          
          if (alert) {
            alert.className = 'alert alert-danger';
            alert.textContent = 'An error occurred. Please try again.';
            alert.classList.remove('d-none');
          }
        } finally {
          // Reset button state
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      };

      // Remove any previous submit handler
      const oldHandler = submitBtn._modalFormHandler;
      if (oldHandler) {
        submitBtn.removeEventListener('click', oldHandler);
      }

      // Add new submit handler
      submitBtn._modalFormHandler = handleSubmit;
      submitBtn.addEventListener('click', handleSubmit);

      // Handle Enter key in input
      const handleEnter = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      };
      input.removeEventListener('keydown', handleEnter);
      input.addEventListener('keydown', handleEnter);

      // Show modal
      modal.show();

      // Focus input after modal is shown
      modalEl.addEventListener('shown.bs.modal', () => {
        input.focus();
      }, { once: true });
    });

    if (document.body) document.body.dataset.modalFormInitBound = '1';
  } catch (e) {
    console.warn('initModalForm failed', e);
  }
}
