
function getSubCat(catVal, catName, subName, subVal, selectATT) {

// Empty Sub category list 
eval('document.getElementById("' + subName + '").options.length = 0;');
eval('document.getElementById("' + subName + '")[0]=new Option("Please select","");');
// Set the Category value to be the selected value (for post backs)

eval('dropbox=document.getElementById("' + catName + '")');

for (i=0; i<=dropbox.length-1; i++) {
	if (dropbox[i].value == catVal) {
		dropbox[i].selected=true;
		break;
		}
	}

// Get the array names to feed the select list

eval('arrayV="' + catName + catVal + 'v";');
eval('arrayI="' + catName + catVal + 'i";');

// Get the length of the array

eval('arrayVLen=' + arrayV+ '.length;');

// Insert the Sub Category list

for (i=1; i<=arrayVLen; i++) {
	eval('document.getElementById("' + subName + '")[' + i + ']=new Option(' + arrayV + '[' + (i-1) + '],' + arrayI + '[' + (i-1) + ']);');
	
	}

// Set the Sub Category value to be the selected value (for post backs)

eval('subDropbox=document.getElementById("' + subName + '")');

for (i=0; i<=subDropbox.length-1; i++) {
	if (subDropbox[i].value == subVal) {
		subDropbox[i].selected=true;
		break;
		}
	}

}
