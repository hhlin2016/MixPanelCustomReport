// Provided by MixPanel staff with minor modifications to account
// for Footer
// Export to CSV function, don't need to edit unless CSV breaks
function exportToCSV() {
	var csv = $("#dataTable").table2CSV({delivery:'string'});
	download(csv, "export.csv", "text/csv");
}

// Table2CSV
jQuery.fn.table2CSV = function(options) {
	var options = jQuery.extend({
		separator: ',',
		header: [],
		delivery: 'popup' // popup, value
	},
	options);

	var csvData = [];
	var headerArr = [];
	var el = this;

	//header
	var numCols = options.header.length;
	var tmpRow = []; // construct header avalible array
				var footerRow = [];

	if (numCols > 0) {
		for (var i = 0; i < numCols; i++) {
			tmpRow[tmpRow.length] = formatData(options.header[i]);
		}
	} else {
		$(el).filter(':visible').find('th').each(function() {
			if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).html());
		});
	}
	
	footerRow = tmpRow.splice(0,4); // Remove footer data and move to end
	tmpRow.splice(0,4); // Remove footer data
	row2CSV(tmpRow);
	

	// actual data
	$(el).find('tr').each(function() {
		var tmpRow = [];
		$(this).filter(':visible').find('td').each(function() {
			if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).html());
		});
		row2CSV(tmpRow);
	});
	
	row2CSV(footerRow);// Insert Footer Data 

	if (options.delivery == 'popup') {
		var mydata = csvData.join('\n');
		return popup(mydata);
	} else {
		var mydata = csvData.join('\n');
		return mydata;
	}

	function row2CSV(tmpRow) {
		var tmp = tmpRow.join('') // to remove any blank rows
		// alert(tmp);
		if (tmpRow.length > 0 && tmp != '') {
			var mystr = tmpRow.join(options.separator);
			csvData[csvData.length] = mystr;
		}
	}
	
	function formatData(input) {
		// replace " with â€œ
		var regexp = new RegExp(/["]/g);
		var output = input.replace(regexp, "â€œ");
		//HTML
		var regexp = new RegExp(/\<[^\<]+\>/g);
		var output = output.replace(regexp, "");
		if (output == "") return '';
		return '"' + output + '"';
	}
	
	function popup(data) {
		var generator = window.open('', 'csv', 'height=400,width=600');
		generator.document.write('<html><head><title>CSV</title>');
		generator.document.write('</head><body >');
		generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
		generator.document.write(data);
		generator.document.write('</textArea>');
		generator.document.write('</body></html>');
		generator.document.close();
		return true;
	}
};

// Code to download the CSV
function download(strData, strFileName, strMimeType) {
	var D = document,
	a = D.createElement("a");
	strMimeType= strMimeType || "application/octet-stream";
	if (navigator.msSaveBlob) { // IE10
		return navigator.msSaveBlob(new Blob([strData], {type: strMimeType}), strFileName);
	}  // end if(navigator.msSaveBlob)

	if ('download' in a) { //html5 A[download]
		a.href = "data:" + strMimeType + "," + encodeURIComponent(strData);
		a.setAttribute("download", strFileName);
		a.innerHTML = "downloading...";
		D.body.appendChild(a);
		setTimeout(function() {
			a.click();
			D.body.removeChild(a);
		}, 66);
		return true;
	} // end if('download' in a) 


	//do iframe dataURL download (old ch+FF):
	var f = D.createElement("iframe");
	D.body.appendChild(f);
	f.src = "data:" +  strMimeType   + "," + encodeURIComponent(strData);

	setTimeout(function() {
		D.body.removeChild(f);
	}, 333);
	return true;
} // end download()
