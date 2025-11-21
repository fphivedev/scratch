// Minimal form utilities
export function collectCheckboxesIntoArrays(form) {
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
