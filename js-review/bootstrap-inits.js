/**
 * Bootstrap component initializers
 */

/**
 * Initialize Bootstrap popovers for notes
 * Finds .input-group elements with .notes-popover triggers and .notes-popover-content
 */
export function initNotesPopovers() {
  document.querySelectorAll('.input-group').forEach(group => {
    const trigger = group.querySelector('.notes-popover');
    const contentEl = group.querySelector('.notes-popover-content');

    if (!trigger || !contentEl) return;

    new bootstrap.Popover(trigger, {
      html: true,
      container: 'body', // optional, but helps with overflow issues
      content: () => contentEl.innerHTML
    });
  });
}
