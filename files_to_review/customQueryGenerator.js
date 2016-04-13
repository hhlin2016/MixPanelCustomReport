// Function to update the filter strings sent into custom query
// Strings should have format of similar to:
//		'(event.properties["App Name"] === "Friends" ||
//		event.properties["App Name"] === "Robots") '
// Called in Response to User Clicking On: Platform, appName, 
//		and model dropdowns
// Inputs: chosenNames dataset for identification parameters
function updateFilterString(dropdownMenu){
	// pull array of selected items
	var itemList = $(dropdownMenu.ID).chosen().val();
	if (itemList){
		var outputString = '(';
		// build the 'event.properties["App Name"] === ' part of the string
		var leftSideEquivalencyTest = 'event.properties["' + dropdownMenu.
			title + '"] === ';
		var selectedItemStrings = [];
		for (var i = 0; i < itemList.length; i++){
			var newEntry = stringCheckForItem(itemList[i],
			leftSideEquivalencyTest);
			// In the MixPanel data, undefined variables do not count as
			// 'null' entries but they return with the same reply when
			// pulling labels therefore requiring an added check to compensate
			if (itemList[i] === "null"){
				var newEntry2 = stringCheckForItem("undefined",
			leftSideEquivalencyTest);
				selectedItemStrings.push(newEntry2);
			}
			selectedItemStrings.push(newEntry);
		}		
		outputString += selectedItemStrings.join(' || ');
		outputString += ')';
		// set propertiesList variable for use elsewhere
		propertiesList[dropdownMenu.stringName] = outputString;
	}
	// nothing was selected therefore set to null
	else {
		propertiesList[dropdownMenu.stringName] = null;
	}
}

// Function to check an item input against select properties. If it's numerical
// 		or undefined, put into string without quotations else add quotations
// Inputs: selectedItem, String of selected item from dropdown menu
//		leftSideEquivalencyTest, String similar to:
//			'event.properties["App Name"] === '
// Output: 'event.properties["App Name"] === "Robots"'
function stringCheckForItem(selectedItem, leftSideEquivalencyTest){
	var outputString = '';
	// Due to test cases having numerical values, have created possibility
	// but may become invalid if new options that are non-numerical and of
	// length 1 come into play
	// NOTE: isNaN function doesn't work when checking numbers in a string 
	// so checking by length
	if (isNaN(selectedItem) && selectedItem !== "undefined" && selectedItem !== "null"){
		outputString = leftSideEquivalencyTest + '"' + selectedItem + '"';
	}
	// A numerical input or undefined value, do not add quotations
	else{
		outputString = leftSideEquivalencyTest + selectedItem;
	}
	return outputString;
}

// Function to build the script for use in custom_query commands
// Inputs: propertySelector, the string variant of the field 
//		name to be groupedBy,
//		selector, a variable determining if it's retrieving menu 
//		data or usable data
// 		selector == 0, retrieve menu data
// 		selector == 1, retrieve table data
function buildCustomQueryFunctionScript(propertySelector, selector){
	var startFunction = '\
		function main() { \
			return Events({from_date: params.from_date,\
				to_date: params.to_date,\
				event_selectors: [{event: params.event}]})';
	// filter by event
	var eventFilter = '.filter(function(event) { return (event.name === params.event ) })';
	// filter by properties (Platform, App Name, and $model)
	var propertyFilters = '';
	if (propertiesList.platformString){
		propertyFilters += '.filter(function(event) { return (' + propertiesList.platformString +' ) })';
	}
	if (propertiesList.appNameString){
		propertyFilters += '.filter(function(event) { return (' + propertiesList.appNameString +' ) })';
	}
	
	if (propertiesList.deviceModelString){
		propertyFilters += '.filter(function(event) { return (' + propertiesList.deviceModelString +' ) })';
	}
	var groupByString = '';
	var reducer = '';
	var map = '';
	switch (selector) {
		// Get data for dropdown menu options, returned as array of names
		case 0:
			groupByString = '.groupBy(["properties.'+ propertySelector +'"], mixpanel.reducer.count())';
			// reducer function to parse data specifically for menu lists
			reducer = 
				'.reduce(function(previousData, object){\
					var allData = [];\
					var total = 0;\
					for (var i = 0; i < previousData.length;i++){\
						var elementPreviousData = previousData[i];\
						for (var j = 0; j < elementPreviousData.length;j++){\
							allData.push(elementPreviousData[j]);\
						}\
					}\
					for (i=0; i<object.length; i++){\
						var element = object[i].key["0"];\
						allData.push(element);\
						}\
					return allData;\
				})'
			break;
		// Get data for actual use, returned in form of 
		//		[Rank, Device Name, # Users, % Users]
		case 1:
			groupByString = '.groupByUser(["properties.$model"],mixpanel.reducer.count())\
				.groupBy(["key.1"], mixpanel.reducer.count())';
			// reducer function to bring data into [device name, value] sub-arrays
			reducer =
				'.reduce(function(previousData, object){\
					var allData = [];\
					var total = 0;\
					for (var i = 0; i < previousData.length;i++){\
						var elementPreviousData = previousData[i];\
						for (var j = 0; j < elementPreviousData.length;j++){\
							allData.push(elementPreviousData[j]);\
						}\
					}\
					for (i=0; i<object.length; i++){\
						var element = [object[i].key["0"], object[i].value];\
						allData.push(element);\
					}\
					return allData;\
				})'
			// map to restructure the data to [rank, device name, value, percentage]
			map = 
				'.map(function(event){\
					function sortByValue(a, b) {\
						if (a[1] === b[1]) {\
							return 0;\
						}\
						else {\
							return (a[1] < b[1]) ? 1 : -1;\
						}\
					}\
					var allData = [];\
					var total = 0;\
					event.sort(sortByValue);\
					for (var i = 0; i < event.length; i++){\
						total += event[i][1];\
					}\
					for (i = 0; i < event.length; i++){\
						var name = event[i][0];\
						var element = [i+1, name, event[i][1], parseFloat(event[i][1] \
						/ total * 100).toFixed(2)];\
						allData.push(element);\
					}\
					return allData;\
				})'
			break;
		default:
			console.log("buildCustomQueryFunctionScript, incorrect selector value");
	}
	// Build the whole script and return
	outputString = startFunction + eventFilter + propertyFilters + groupByString + reducer + map + '}';
	return outputString;
}