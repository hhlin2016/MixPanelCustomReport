var selectorPlatform = 
	function main() { 
		return Events({from_date: params.from_date,
		to_date: params.to_date,
		event_selectors: [{event: params.event}]})
		.filter(function(event) { return (event.name === params.event ) })
		.groupBy(["properties.Platform"], mixpanel.reducer.count())
		.reduce(function(previousData, object){
			var allData = [];
			var total = 0;
			for (var i = 0; i < previousData.length;i++){
				var elementPreviousData = previousData[i];
				for (var j = 0; j < elementPreviousData.length;j++){
					allData.push(elementPreviousData[j]);
				}
			}
			for (i=0; i<object.length; i++){
				var element = object[i].key["0"];
				if (element){
				  allData.push(element);
				}
				else{
				  allData.push("undefined");
				}
			}
			return allData;
		})			
	}