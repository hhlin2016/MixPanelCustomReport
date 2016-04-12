// Limiting variables for graph display
var graphNumberLimit = 20; // maximum number of items for pie chart (switches to bar chart after)
var graphDisplayUpperLimit = 100; // maximum number for display regardless of custom input

// Set initial properties required for segmentation
var propertiesList = {
	appNameString : null,
	platformString : null,
	deviceModelString: null,
	from: moment().subtract(1, 'months').format("YYYY-MM-DD"),
	to: moment().format("YYYY-MM-DD"),
	limit : 10
}
var dropdownVariables = {
	platform : { title : 'Platform', ID : '.chosen-platform', stringName : "platformString"},
	appName : { title : 'App Name', ID : '.chosen-appName', stringName : "appNameString"},
	model : { title : '$model', ID : '.chosen-model', stringName : "deviceModelString"}
};

// Store data from last pull (for use with limit changes)
var lastDataPull;
// Global variables for referencing
var deviceList;
var totalNumUsers;
var eventSelect;
var eventGraph = $('#graph');

function initialSettings(){
				// Initial variables
	eventSelect = $('#eventSelect').MPEventSelect();

	// Initialize Chosen Interface
	$('.chosen-model').chosen().val();
	$('.chosen-platform').chosen().val();
	$('.chosen-appName').chosen().val();
}