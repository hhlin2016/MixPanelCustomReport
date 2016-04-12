//Dropdown Limit Options
var limitOptions = {
	items: [
		{label: '10', value: 10},
		{label: '20', value: 20},
		{label: '50', value: 50},
		{label: '100', value: 100},
		{label: 'Select Custom Value: ', value: -1},
		{label: 'All', value: Infinity}
	]
};

// Dropdown Date Options
var dateOptions = {
	items: [
		{label: '1 month', value: 1},
		{label: '3 months', value: 3},
		{label: '6 months', value: 6},
		{label: '12 months', value: 12},
		{label: 'Pick a Date Range', value: -1}
	]
};

// Instantiate dropdown menus
var dropdownLimit
var dropdownDates

function initializeDropdownMenus() {
	dropdownLimit = $('#numResultsSelect').MPSelect(limitOptions); // limit Options  
	dropdownDates = $('#timeSelect').MPSelect(dateOptions);     // date Options
}

			// Function to update the Chosen dropdown menu selections
// Input: dropdownVariables dataset for identification parameters, data, an 
//		array of names
function updateDropdownMenu(dropdownMenuVariables, data){
	$(dropdownMenuVariables.ID).chosen(); // Initialize chosen plugin searchbox
	if (data){
		for (var i = 0; i < data.length; i++){
			newKey = data[i];
			$(dropdownMenuVariables.ID).append("<option value='"+
				newKey+"'>"+newKey +"</option>");
		}
		// trigger update once all elements have been added
		$(dropdownMenuVariables.ID).trigger("chosen:updated");
	}
	else{
		console.log("updateDropdownMenu, no data");
	}		
}

// Function to clear the Chosen Menu Options (essentially reset them),
// 		propertiesList relevant String variable has to be cleared for new
// 		custom_query call
// Inputs: dropdownVariables dataset for identification parameters
function clearDropdownMenu(dropdownMenuVariables){
	// Clear String property
	propertiesList[dropdownMenuVariables.stringName] = null;
	// Clear chosen dropdown selectable values
	$(dropdownMenuVariables.ID).children().remove();
	// clear chosen dropdown selected values
	$(dropdownMenuVariables.ID).val('').trigger("chosen:updated");
	// Clear table and graph search criteria
	if (dropdownMenuVariables.title === '$model'){
		updateDataTablesSearch(null);
	}
}

// Function to get data for the dropdown menus based on existing criteria
// Inputs: dropdownVariables dataset for identification parameters
function getDropdownMenuData(dropdownMenuVariables){
	var params = {
		from_date: propertiesList.from,
		to_date: propertiesList.to,
		event: eventSelect.MPEventSelect('value')
	};
	var script = buildCustomQueryFunctionScript(dropdownMenuVariables.title, 0);
	MP.api.custom_query(script, params).done(function(results) {
		updateDropdownMenu(dropdownMenuVariables, results[0]);
	});		
}