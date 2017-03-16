//
//  simple-csv-json.js
//  directory_listing_server
//
//  Created by Michael Steele on 3/16/17.
//  Copyright © 2017 Michael Steele. All rights reserved.
//

var config = require('./config.js');
const fs = require('fs');
var csv = require("fast-csv");
var serverURL = config.serverURL;
var imagesDir = config.imagesDir;

module.exports = function (fileName) {
	

	return {
		preload : function () {
			this.get(null)
		},
		cachedData : null,
		fetch : function (callBack) {
			if (this.cachedData == null) {
				this.get(callBack);
			} else {
				callBack(this.cachedData)
			}
		},
		get : function (callBack) {
			var stream = fs.createReadStream(fileName);
		 
			var header = null;

			var columns = 0;

			var output = [];

			var csvStream = csv()
			.on("data", function(data){
				var out = {};
				if (header == null) {
					header = data;
					columns = header.length;
					return
				}
				for (i = 0; i < columns; i++) {
					var value = data[i];
					if (value == "false") {
						value = false;
					}
					if (value == "true") {
						value = true;
					}
					out[header[i]] = value;
				}
				out['profilePicture'] = serverURL + imagesDir + out['profilePicture'];
				
				output.push(out);
			})
			.on("end", function(){
				console.log("Parsed " + fileName);
				if (callBack != null) {
					callBack(output);
				}
				this.cachedData = output;
			});
			 
			stream.pipe(csvStream);
		}
	}
};

