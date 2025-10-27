
function getSubCat(catVal, catName, subName, subVal, selectATT) {
	// Defensive refactor: check DOM nodes and arrays exist before touching them
	var subEl = document.getElementById(subName);
	if (!subEl) {
		// target sub-select not present on the page — nothing to do
		return;
	}

	// Clear existing options and add default option
	subEl.options.length = 0;
	subEl.options[0] = new Option("Please select", "");

	// Set the Category value to be the selected value (for post backs)
	var dropbox = document.getElementById(catName);
	if (dropbox) {
		for (var i = 0; i <= dropbox.length - 1; i++) {
			if (dropbox[i].value == catVal) {
				dropbox[i].selected = true;
				break;
			}
		}
	} else {
		// category element missing — stop early
		return;
	}

	// Build the expected global array names and resolve them from window
	var arrayVName = catName + catVal + 'v';
	var arrayIName = catName + catVal + 'i';
	var arrayVRef = window[arrayVName];
	var arrayIRef = window[arrayIName];

	if (!Array.isArray(arrayVRef) || !Array.isArray(arrayIRef)) {
		// No arrays to populate the sub-select from
		return;
	}

	var arrayVLen = arrayVRef.length;

	// Insert the Sub Category list
	for (var i = 1; i <= arrayVLen; i++) {
		// options are 0-based; we already set option[0]
		subEl.options[i] = new Option(arrayVRef[i - 1], arrayIRef[i - 1]);
	}

	// Set the Sub Category value to be the selected value (for post backs)
	for (var j = 0; j <= subEl.length - 1; j++) {
		if (subEl[j].value == subVal) {
			subEl[j].selected = true;
			break;
		}
	}

}
