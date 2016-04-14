/*
	Functions and variables segmented into:
		Global Variables
		Dropdown Menu functions and variables
		Custom User Input Variables
		Data Parsing
		Time Operations
		Sort Functions
		Adjust Data for Apple Models
*/

/*
	Global Variables
		graphNumberLimit
		graphDisplayUpperLimit
		propertiesList
		dropdownVariables
		var lastDataPull;
		// Global variables for referencing
			deviceList
			totalNumUsers
			eventSelect
			eventGraph
		initialSettings()
*/
// Limiting variables for graph display
var graphNumberLimit = 20; // maximum number of items for pie chart (switches 
							//to bar chart after)
var graphDisplayUpperLimit = 100; // maximum number for display regardless of 
									//custom input

// Set initial properties required for segmentation
var propertiesList = {
	appNameString : null,
	platformOSString : null,
	deviceModelString: null,
	from: moment().subtract(1, 'months').format("YYYY-MM-DD"),
	to: moment().format("YYYY-MM-DD"),
	limit : 10,
	adjustForApple: false
}
var dropdownVariables = {
	platformOS : { title : 'Platform', ID : '.chosen-platformOS', 
		stringName : "platformOSString"},
	appName : { title : 'App Name', ID : '.chosen-appName', 
		stringName : "appNameString"},
	model : { title : '$model', ID : '.chosen-model', 
		stringName : "deviceModelString"}
};

// Store data from last pull (for use with limit changes)
var lastDataPull;
// Global variables for referencing
var deviceList;
var totalNumUsers;
var appleDevicesInList = {};

// Initialize menus and graph
var eventSelect;
var eventGraph = $('#graph');

function initializeChosenInterface(){
				// Initial variables
	eventSelect = $('#eventSelect').MPEventSelect();

	// Initialize Chosen Interface
	$('.chosen-model').chosen().val();
	$('.chosen-platformOS').chosen().val();
	$('.chosen-appName').chosen().val();
}

/*
	Dropdown Menu functions and variables
		limitOptions
		dateOptions
		initializeDropdownMenus()
		updateDropdownMenu(dropdownMenuVariables, data)
		clearDropdownMenu(dropdownMenuVariables)
		updateDropdownMenuData(dropdownMenuVariables)
*/

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

// Dropdown Platform or OS Options
var platformOSOptions = {
	items: [
		{label: 'Platform', value: 'Platform'},
		{label: 'OS', value: 'OS'}
	]
};

// Dropdown Adjust for Apple Models or Not
// A checkbox, switch, etc. could all be used but for uniformity, a dropdown box was selected
var AppleAdjustmentOptions = {
	items: [
		{label: 'No', value: false},
		{label: 'Yes', value: true}
	]
};

// Instantiate dropdown menus
var dropdownLimit;
var dropdownDates;
var dropdownPlatformOS;
var dropdownAdjustForAppleModels;

function initializeDropdownMenus() {
	// limit Options  
	dropdownLimit = $('#numResultsSelect').MPSelect(limitOptions); 
	// date Options
	dropdownDates = $('#timeSelect').MPSelect(dateOptions);     
	// Select Platform or OS
	dropdownPlatformOS = $('#selectPlatformOS').MPSelect(platformOSOptions);     
	// Select to Adjust for Apple Model Names or not
	dropdownAdjustForAppleModels = $('#selectAdjustForAppleModels').MPSelect(AppleAdjustmentOptions);     
}

function updatePlatformOS(PlatformOSSelection) {
	switch (PlatformOSSelection){
		case 'Platform':	dropdownVariables['platformOS'] = { title : 
			'Platform', ID : '.chosen-platformOS', stringName : 
			"platformOSString"};
			$(".chosen-platformOS").attr("data-placeholder", 
				"Select Platform(s), leave empty for all");
			$(".chosen-platformOS").trigger("chosen:updated");
			break;
		case 'OS':	dropdownVariables['platformOS'] = { title : '$os', 
			ID : '.chosen-platformOS', stringName : "platformOSString"};
			//$('.chosen-platformOS').chosen()
			$(".chosen-platformOS").attr("data-placeholder", 
				"Select OS(es), leave empty for all");
			$(".chosen-platformOS").trigger("chosen:updated");
			break;
		default:
			console.log("updatePlatformOS, invalid input option");
	}
}

// Function to update the Chosen dropdown menu selections
// Input: dropdownVariables dataset for identification parameters, data, an 
//		array of names
function updateDropdownMenu(dropdownMenuVariables, data){
	// Initialize chosen plugin searchbox
	$(dropdownMenuVariables.ID).chosen(); 
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
// Called in Response to User Clicking On: dropdownDates, datePicker, 
//		appName dropdown, eventSelect, Platform dropdown
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
		updateDataTablesSearchResults(null);
	}
}

// Function to get data for the dropdown menus based on existing criteria
// Called in Response to User Clicking On: dropdownDates, datePicker, 
//		appName dropdown, eventSelect, Platform dropdown
// Inputs: dropdownVariables dataset for identification parameters
function updateDropdownMenuData(dropdownMenuVariables){
	var params = {
		from_date: propertiesList.from,
		to_date: propertiesList.to,
		event: eventSelect.MPEventSelect('value')
	};
	var script = buildCustomQueryFunctionScript(dropdownMenuVariables.title, 0);
	MP.api.jql(script, params).done(function(results) {
		var data = results[0];
//		console.log("updateDropdownMenuData, unmorphed data", data)
		// Updating model list but need to adjust for Apple entries first
		if (dropdownMenuVariables.title === '$model' && propertiesList.adjustForApple){	
			data = adjustTitlesForApple(data);
		}
		else{
			appleDevicesInList = {};
		}
		updateDropdownMenu(dropdownMenuVariables, data);
		
	});		
}


/* 
	Custom User Input Variables
		updateTime(period)
		customNumberDevicesSelect(numDevices) {
*/
// Function to update the selected time from the dropdown menu
// Also shows/hides elements relating to the jQuery datePicker
// Called in Response to User Clicking On: dropdownDates
// Inputs: 	Integer, period indicating months to go back (-1 denotes
// 			custom time period)
function updateTime(period) {
	// Custom Time period selected, show input box
	if (period === -1){
		// Show datepicker and set time data
		$("#from").datepicker('setDate', propertiesList["from"]);
		$("#to").datepicker('setDate', propertiesList["to"]);
		$(".timeSelectGroup").show();
	}
	else {
		// Hide datepicker and set time data based on selection
		var from_date = moment().subtract(parseInt(period), 
						'months').format("YYYY-MM-DD");
		var to_date = moment().format("YYYY-MM-DD");
		propertiesList["from"] = from_date;
		propertiesList["to"] = to_date;
		$(".timeSelectGroup").hide();
	}
}

// Function to update the selected number of devices to show from the 
// dropdown menu. Also shows/hides element relating to the custom input 
// textbox and button if the user selected Select Custom Value
// Called in Response to User Clicking On: dropdownLimit
// Input: numDevices, integer value of how many devices the user wants
// 		to see
function customNumberDevicesSelect(numDevices) {
	// Custom number of devices to show selected, show box and button
	if (numDevices === -1){
		$(".tbxNumSelect").show();
	}
	// Hide input box and button, adjust chart/graph according to selection
	else {
		propertiesList["limit"] = numDevices;
		$(".tbxNumSelect").hide();
		// Use last pulled server data to recompute list
		createDataTable(lastDataPull);
	}
}

/*
	Data Parsing
		convertArrayToObject(data)
		parseBaseData(data)
*/
// Function to convert Array data to a JSON object for MPCharts
// Input: Array of [Device Name, Number of Users] sub-arrays
function convertArrayToObject(data){
	outputData = {};
	var element;
	// Enter each data point in Key : Value pairs into Object
	for (var i = 0; i < data.length; i++){
		element = data[i];
		outputData[element[0]] = element[1];
	}
	return outputData
}

// Function to parse and store a list of the sorted Device Names (sorted by 
//		number of users) and calculate the total number of users
// Input: data, array of [Rank, Device Name, Num Users, Percentage Users]
function parseBaseData(data){
	deviceList = [];
	totalNumUsers = 0;
	if (data){
		for (var i = 0; i < data.length;i++){
			var deviceName = data[i][1];
			deviceList.push(deviceName);
			totalNumUsers += data[i][2];
		}
	}
	else{
		console.log("parseBaseData, no data provided");
	}
	
}

/*
	Time Operations
		updateTime(period)
*/

// Function to update the selected time from the dropdown menu
// Also shows/hides elements relating to the jQuery datePicker
// Inputs: 	Integer, period indicating months to go back (-1 denotes
// 			custom time period)
function updateTime(period) {
	if (period === -1){
		// Show datepicker and set time data
		$("#from").datepicker('setDate', propertiesList["from"]);
		$("#to").datepicker('setDate', propertiesList["to"]);
		$(".timeSelectGroup").show();
	}
	else {
		// Hide datepicker and set time data
		var from_date = moment().subtract(parseInt(period), 
						'months').format("YYYY-MM-DD");
		var to_date = moment().format("YYYY-MM-DD");
		propertiesList["from"] = from_date;
		propertiesList["to"] = to_date;
		$(".timeSelectGroup").hide();
	}
}

/*
	Sort Functions
		sortByValue
		sortByIndex1
*/

// Function to sort a list with, smallest to largest
// Note: this function is necessary as the standard sort function uses
//		== which means when you have an array of [12, 13, 15, 37, 2]
//		The result would be [12, 13, 15, 2, 37] in javascript
function sortByValue(a, b) {
	if (a === b) {
		return 0;
	}
	else {
		return (a < b) ? -1 : 1; // smallest to largest
	}
}

// Function to sort an array's 1st index from largest to smallest
function sortByIndex1(a, b) {
	if (a[1] === b[1]) {
		return 0;
	}
	else {
		return (a[1] < b[1]) ? 1 : -1; // largest to smallest
	}
}

/*
	Adjust Data for Apple Models
		adjustDataForApple
		adjustTitlesForApple
*/

// Group the Apple device data together into their desired names as per
// the appleDevices list
// Inputs: data, an Array of [Rank, Device Name, # users, % users] sub-arrays
// Outputs: data, an Array of [Rank, Device Name, # users, % users] sub-arrays
// CONSIDER: The data is being pulled in [Rank, Device Name, # Users, % Users] format. We actually need the data in [Device Name, # Users], consider adding a new script type that uses a reducer function for this purpose instead. It would reduce n computations as we loop through the list here to create a new list which we then add the Rank and % values to
function adjustDataForApple(data){
	// Need indexes of devices
	parseBaseData(data);
	console.log("adjustDataForApple, device list", deviceList)
	var newData = [];
	var locationData = [];
	var newResults = [];
	var appleKeys = Object.keys(appleDevicesInList);
	for (var i = 0; i < appleKeys.length; i++){
		var appleDeviceSum = 0;
		var foundAppleDevices = appleDevicesInList[appleKeys[i]];
		for (var j = 0; j < foundAppleDevices.length; j++){
			var device = foundAppleDevices[j];
			var locationDeviceInList = $.inArray(device, deviceList);
			locationData.push(locationDeviceInList);
			appleDeviceSum+= data[locationDeviceInList][2];
		}
		var newEntry = [appleKeys[i], appleDeviceSum];
		newData.push(newEntry);
	}
	var testSum = 0;
	var testSumApple = 0;
	for (var i = 0; i < data.length; i++){
		var entry = data[i];
		// -1 to account for ranking starting at 1 instead of 0
		var checkIfAlreadyCounted = $.inArray(parseInt(entry[0]-1), locationData);
		// Not an Apple device therefore add it
		if (checkIfAlreadyCounted === -1) {
			testSum += parseInt(entry[2]);
			newData.push([entry[1], entry[2]]);
		}
		else{
			testSumApple += parseInt(entry[2]);
		}
	}
	newData.sort(sortByIndex1);				
	// Reparse data to [Rank, Device Name, # Users, % Users]
	for (var i = 0; i < newData.length; i++) {
		var element = newData[i];
		var newElement = [i+1, element[0], element[1], parseFloat(element[1]
			/ total * 100).toFixed(2)];
		newData[i] = newElement;
	}

	return newData;
}

// Group the Apple device data together into their desired names as per
// the appleDevices list, used for setting of model dropdown menu
// Inputs: data, a list of device names
// Outputs: data, a list of device names
function adjustTitlesForApple(data){		
	// get cumulative device list and total number of users
	// Check against each of the Apple Devices to see if their entries exist in the 
	var appleKeys = Object.keys(appleDevices);
	for (var i = 0; i < appleKeys.length; i++){
		var appleElement = appleDevices[appleKeys[i]];
		var foundAppleDevicesForThisKey = [];
		for (var j = 0; j < appleElement.length; j++){
			// Check if Apple Device is in the device list. If so, add it to appleDevicesInList (so that list can be used for the actual data pull instead of redoing this loop) and update the list accordingly
			var indexOfAppleDevice = $.inArray(appleElement[j], data);
			if (indexOfAppleDevice >= 0){
				// Check if the Apple Device Name already exists in the list. If not, add it
				if ($.inArray(appleKeys[i], data) === -1){
					data.push(appleKeys[i]);
				}
				// Remove original Apple Device name from list
				data.splice(indexOfAppleDevice, 1);
				foundAppleDevicesForThisKey.push(appleElement[j]);
			}
		}
		// Add original Apple Device to list of Applie devices
		if (foundAppleDevicesForThisKey.length > 0){
			appleDevicesInList[appleKeys[i]] = foundAppleDevicesForThisKey;
		}
	}
	return data;
}