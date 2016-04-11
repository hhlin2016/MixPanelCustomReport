// Function to reorganize the data to limit parameter constraints
// Inputs: data, an Array of sub-arrays (defined below),
//			limit, Integer value of maximum allowed devices,
//			setting, Integer value depending on structure of input
//			data
function reduceLength(data, limit, setting){
	var newData = [];
	// Make sure the data needs to be modified
	if (data.length > limit){
		var sum = 0;
		// determine input data structure
		// setting === 0, data is in [Name, value] format
		// setting === 1, data is in [Rank, Name, value, percentage] format
		if (setting <= 1){
			for (var i = 0; i < limit; i++){
				// Consider using a splice here since the structure
				// remains the same but for loop still needed for
				// sum
				var value = parseInt(data[i][1 + setting]);
				newData.push([data[i][0 + setting],value]);
				sum += value;
			}
		}
		else {
			console.log("reduceLength, invalid setting value used");
		}
		// Create Other Devices entry
		newData.push(["Other Devices", totalNumUsers - sum]);
	}
	return newData;
}

// Function to parse data by selected devices
// Input: dataSet, array of [Rank, Device Name, Num Users, Percentage Users],
//			plotLimit, integer value denoting how many items can be displayed
function plotGraphSelectedDevices(dataSet, plotLimit){
	console.log(dataSet, propertiesList.deviceFilterNumbers)
	plotData = [];
	var sum = 0;
	// Go through each selected device and pull it from the overall list
	// using its recorded index number and add to new list
	for (var i = 0; i < propertiesList.deviceFilterNumbers.length; i++){
		var index = propertiesList.deviceFilterNumbers[i]-1;
		plotData.push([dataSet[index][1], dataSet[index][2]]);
		sum += dataSet[index][2];
	}
	// The number of devices selected were greater than the limit
	// Filter by limit
	if (plotData.length > plotLimit){
		plotData = reduceLength(plotData, plotLimit, 0);
	}
	// Limit is not violated, add Other Devices column here
	else{
		plotData.push(["Other Devices", totalNumUsers - sum]);
	}
	return plotData;
}

// Function to parse data by selected devices
// Input: dataSet, array of [Rank, Device Name, Num Users, Percentage Users],
//			plotLimit, integer value denoting how many items can be displayed
function plotGraphAllDevices(dataSet, plotLimit){
	plotData = [];
	// Limit exceeded, filter by limit
	if (dataSet.length > plotLimit){
		plotData = reduceLength(dataSet, plotLimit, 1);
	}
	// Limit is not exceeded, copy relevant data to plotData
	else {
		for (var i = 0; i < dataSet.length;i++){
			plotData.push([dataSet[i][1], dataSet[i][2]]);
		}
	}
	return plotData;
}
// Function to plot a graph using MPCharts
// Input: dataSet, array of [Rank, Device Name, Num Users, Percentage Users]
function plotGraph(dataSet){
	// Verify there is data to plot
	if (dataSet){
		// determine plotting limit
		var plotLimit = (propertiesList.limit <= graphDisplayUpperLimit) ?
				propertiesList.limit : graphDisplayUpperLimit;
		var plotData = [];
		// selector for whether plotData has an Other Devices sub-array
		var otherDevicesCategory = 0;
		// Devices were selected therefore screen for them
		if (propertiesList.deviceFilterNumbers){
			plotData = plotGraphSelectedDevices(dataSet, plotLimit)
		}
		// Devices were not selected
		else {
			plotData = plotGraphAllDevices(dataSet, plotLimit);
		}
		// Determine if Other Devices was added to the array. If so,
		//	set otherDevicesCategory to 1 so it's discounted later
		if (plotData[plotData.length-1][0] === "Other Devices"){
				var otherDevicesCategory = 1;
		}
		// GRAPH SEGMENT
		// Must remove the old graph then create a new one to accommodate
		// changes to chart type
		// Delete the old table
		if (eventGraph.length > 0) {
			eventGraph.remove();
		}
		// Create a new table
		eventGraph = $('<div id="#graph" />')
		$(".mixpanel-platform-section").after(eventGraph)
		
		// Setup graph titles
		var titleString = (plotData.length - otherDevicesCategory).toString() + ' of ' + deviceList.length + ' devices shown';
		var subTitleString = 'Total users: ' + totalNumUsers;
		var fontSettings = { "color": "#333333", "fontSize": "18px" };
		var titleSettings = {
						align : 'center',
						floating : true,
						text: titleString,
						style: fontSettings
					};
		var subTitleSettings = {
						align : 'center',
						floating : true,
						text: subTitleString,
						style: fontSettings
					}

					// Select display type based on number of datapoints
		if (plotData.length <= graphNumberLimit + 1){
			eventGraph.MPChart({chartType: 'pie',
				highchartsOptions: {
					title: titleSettings,
					subtitle: subTitleSettings
				}
			});
		}
		else {
			eventGraph.MPChart({chartType: 'bar',
				highchartsOptions: {
					title: titleSettings,
					subtitle: subTitleSettings
				}
			});
		}
		// Convert data back to acceptable form for MPChart
		var graphData = convertArrayToObject(plotData); 
		eventGraph.MPChart('setData', graphData);
	}
	else{
		console.log("Warning: plotGraph, no DATA!");
	}
}

// DATATABLES IMPLEMENTATION
// create dummy table for destruction (required for dataTablesChart function)
var table = $('#instantlyDestroyedTable').DataTable(); 

// Function to create dataTable using jQuery plug-in, dataTables
// Inputs: dataSet, an object of Device : value pairings
function plotChart(dataSet){
	// Graph data
	plotGraph(dataSet);
	
	// Generate dataTable Variables
	var titleArray = [{title : "Rank"},
		  {title : "Device Name"}, 
		  {title : "Unique Users"},
		  {title : "Usage (%)"}];

	// Destroy the old table so it can be replaced with new data
	table.destroy();
	$('#dataTable').empty(); // empty in case the columns change
	// Set up table footer
	var columnString = '<tfoot><tr><th></th><th></th><th></th><th> \
						</th></tr></tfoot>'; 
	$("#dataTable").append(columnString);
	
	// Create a new table
	table = $('#dataTable').DataTable( {
		data: dataSet,
		columns: titleArray,
		"columnDefs": [
			{ className: "dt-center", "targets": [ 0 ] },
			{ className: "dt-center", "targets": [ 1 ] },
			{ className: "dt-center", "targets": [ 2 ] },
			{ className: "dt-center", "targets": [ 3 ] }
		],
		sDom : '<"top">tip', // hide search box
		// Set display limit to dropdown menu value
		"iDisplayLength": propertiesList.limit, 
		// Hide dataTable display X items option
		"bLengthChange": false, 
		// Create Footer with sums/percentages
		"footerCallback": function ( row, data, start, end, display ) {
			var api = this.api(), data;

			// Remove the formatting to get integer data for summation
			var intVal = function ( i ) {
				return typeof i === 'string' ?
					i.replace(/[\$,]/g, '')*1 :
					typeof i === 'number' ?
						i : 0;
				};

			// Total number of users over all pages
			total = totalNumUsers;

			totalNumDevices = deviceList.length;

			// Total number of users over this page
			pageTotal = api
				.column( 2, { page: 'current'} )
				.data()
				.reduce( function (a, b) {
					return intVal(a) + intVal(b);
				}, 0 );

			// Update footer
			// Set Number of Unique users on page
			$( api.column( 2 ).footer() ).html(
				'Unique Users: ' + pageTotal +' / ' + total
			);
			// Set Percentage of Unique users on page
			pagePercentTotal = parseFloat((pageTotal/total)*100).toFixed(2);
			$( api.column( 3 ).footer() ).html(
				
				'Usage (%): ' + pagePercentTotal +' / 100.00'
			);

			// Set number of devices overall
			$( api.column( 0 ).footer() ).html(
				'Total Number of Devices: ' + totalNumDevices
			);
		}
	});
}
// Function to update the datatables search results using the Chosen dropdown
// Note, this system requires a sorted list as it searches by index value due
// device names sometimes having spaces which DataTables interprets as a split
// to a new device.
// Inputs: data, an array of device names
function updateDataTablesSearch(data){
	// Since the search function doesn't work for names with spaces, search by index value
	if (data){
		// Find index of each device
		var indexValues = [];
		for (var i = 0; i < data.length; i++){
			indexValues.push(($.inArray(data[i], deviceList) + 1)); 
			console.log("updateDataTablesSearch, value pushed: ", ($.inArray(data[i], deviceList) + 1));
		}
		// Create search string, additions on left and right side are so
		// DataTables uses the exact value otherwise it would show everything
		// that had a partial match as well (i.e. 7 would return 7, 17, 27, 70, etc.)
		var itemString = "^\\s*"+indexValues[0].toString()+"\\s*$" ;		
		for (var i = 1; i < indexValues.length; i++){
			itemString += '|' + "^\\s*"+indexValues[i].toString()+"\\s*$"  ;
		}
		// Order the list for use in other functions
		console.log("updateDataTablesSearch, unsorted", indexValues);
		indexValues.sort(sortByValue);
		console.log("updateDataTablesSearch, sorted", indexValues);
		// Store index values
		propertiesList.deviceFilterNumbers = indexValues;
		// Search the table and draw the output
		table.column(0).search(itemString, true, false, true).draw();	
	}
	// In event search criteria have been cleared, clear the table and
	// the stored values
	else{
		table
			.search( '' )
			.columns().search( '' )
			.draw();
		propertiesList.deviceFilterNumbers = null;
	}
}

// Function to sort a list with, smallest to largest
// Note: this function is necessary as the standard sort function uses
//		== which means when you have an array of [12, 13, 15, 37, 2]
//		The result would be [12, 13, 15, 2, 37] in javascript
function sortByValue(a, b) {
	if (a === b) {
		return 0;
	}
	else {
		return (a < b) ? -1 : 1; // largest to smallest
	}
}