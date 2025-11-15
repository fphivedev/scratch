<form id="myForm" method="post" enctype="multipart/form-data" action="process.asp">
  <label><input type="checkbox" name="colors" value="red"> Red</label>
  <label><input type="checkbox" name="colors" value="green"> Green</label>
  <label><input type="checkbox" name="colors" value="blue"> Blue</label>

  <label><input type="checkbox" name="fruits" value="apple"> Apple</label>
  <label><input type="checkbox" name="fruits" value="orange"> Orange</label>
  <label><input type="checkbox" name="fruits" value="banana"> Banana</label>

  <button type="submit">Submit</button>
</form>

<script>
function renameCheckboxesAsArrays(form) {
  // Group checkboxes by their base name
  const groups = {};

  form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (!groups[cb.name]) groups[cb.name] = [];
    groups[cb.name].push(cb);
  });

  // For each group of checkboxes, rename checked ones as indexed arrays
  for (const [baseName, checkboxes] of Object.entries(groups)) {
    let index = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) {
        cb.name = `${baseName}[${index++}]`;
      } else {
        cb.disabled = true; // prevent unselected from being sent
      }
    });
  }
}

// Hook it to the submit event
document.getElementById("myForm").addEventListener("submit", function (e) {
  renameCheckboxesAsArrays(this);
});
</script>
