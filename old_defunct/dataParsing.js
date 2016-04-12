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

// Function to parse and store a list of the sorted Device Names (sorted by number of users) and calculate the total number of users
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