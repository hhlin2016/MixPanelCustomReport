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