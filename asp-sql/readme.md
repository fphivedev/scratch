<form id="myForm" method="post" enctype="multipart/form-data" action="process.asp">
  <label><input type="checkbox" name="colors" value="red"> Red</label>
  <label><input type="checkbox" name="colors" value="green"> Green</label>
  <label><input type="checkbox" name="colors" value="blue"> Blue</label>

  <label><input type="checkbox" name="fruits" value="apple"> Apple</label>
  <label><input type="checkbox" name="fruits" value="orange"> Orange</label>
  <label><input type="checkbox" name="fruits" value="banana"> Banana</label>

  <label><input type="checkbox" name="subscribe" value="yes"> Subscribe to newsletter</label>

  <button type="submit">Submit</button>
</form>

<script>
function collectCheckboxesIntoArrays(form) {
  const groups = {};

  // Group all checkboxes by name
  form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (!groups[cb.name]) groups[cb.name] = [];
    groups[cb.name].push(cb);
  });

  // For each group with multiple checkboxes, create a hidden array field
  for (const [baseName, checkboxes] of Object.entries(groups)) {
    if (checkboxes.length <= 1) continue; // skip singles

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

// Hook into submit event
document.getElementById("myForm").addEventListener("submit", function () {
  collectCheckboxesIntoArrays(this);
});
</script>
