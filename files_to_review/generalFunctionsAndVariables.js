/*
	Functions and variables segmented into:
		Global Variables
		Dropdown Menu functions and variables
		Custom User Input Variables
		Data Parsing
		Time Operations
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
	limit : 10
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
	items: [
		{label: 'Platform', value: 'Platform'},
		{label: 'OS', value: 'OS'}
	]
};

// Instantiate dropdown menus
var dropdownLimit
var dropdownDates
var dropdownPlatformOS

function initializeDropdownMenus() {
	// limit Options  
	dropdownLimit = $('#numResultsSelect').MPSelect(limitOptions); 
	// date Options
	dropdownDates = $('#timeSelect').MPSelect(dateOptions);     
	// Select Platform or OS
}

function updatePlatformOS(PlatformOSSelection) {
	switch (PlatformOSSelection){
		case 'Platform':	dropdownVariables['platformOS'] = { title : 'Platform', ID : '.chosen-platformOS', 
			stringName : "platformOSString"};
			break;
		case 'OS':	dropdownVariables['platformOS'] = { title : '$os', ID : '.chosen-platformOS', 
			stringName : "platformOSString"};
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
		updateDropdownMenu(dropdownMenuVariables, results[0]);
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