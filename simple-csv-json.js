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
var serverURL = config.serverURL();
var imagesDir = config.imagesDir;
var createHash = require('sha.js');
var sha256 = createHash('sha256');

module.exports = function (fileName) {
	

	return {
		preload : function () {
			this.get(null)
		},
		cachedData: null,
		getCachedData: function () {
			return cachedData;
		},
		getCachedDataToNumericArray: function () {
			var numericArray = new Array();
			for (var items in cachedData){
				numericArray.push(cachedData[items]);
			}
			return numericArray;
		},
		header: null,
		getHeader: function () {
			return header;
		},
		columns: 0,
		fetch : function (callBack) {
			if (this.getCachedData() === null) {
				console.log('Server cache empty.  Getting data.');
				this.get(callBack);
			} else {
				console.log('Using server cache.');
				callBack(this.getCachedDataToNumericArray())
			}
		},
		get : function (callBack) {

			var stream = fs.createReadStream(fileName);
		 
			var output = {};

			header = null;

			columns = 0;

			var csvStream = csv()
			.on("data", function(data){
				var out = {};
				out["id"] = "";
				if (header == null) {
					header = data;
					columns = header.length;
					return
				}
				var dataToHash = "";
				for (i = 0; i < columns; i++) {
					var value = data[i];
					if (value == "false") {
						value = false;
					}
					if (value == "true") {
						value = true;
					}
					out[header[i]] = value;
					dataToHash = dataToHash + value;
				}
				out['profilePicture'] = serverURL + imagesDir + out['profilePicture'];
				var key = sha256.update(dataToHash, 'utf8').digest('hex')
				out['id'] = key;
				out['imageCheck'] =  sha256.update(out['profilePicture'], 'utf8').digest('hex');
				output[key] = out;
			})
			.on("end", function(){
				console.log("Parsed " + fileName);
				console.log("Count " +  Object.keys(output).length);
				cachedData = output;
				if (callBack != null) {
					callBack(getCachedDataToNumericArray());
				}
			});
			 
			stream.pipe(csvStream);
		},
		deleteById: function (id, callBack) {
			index = id; // TO DO: Add parsing of ID
			if (cachedData[index] != null) {
				callBack(id, cachedData[index]);
				delete cachedData[index];
				console.log("Deleted " + id);
			} else {
				callBack(null,null);
				console.log("Failed to delete " + id);
			}
		},
		create: function (individual, callBack) {
			data = individual;
			// To Do: Ignore all fields but what is in header
			// To Do: Validation needed 
			var out = {};
			out["id"] = "";
			var dataToHash = "";
			for (i = 0; i < columns; i++) {
				var value = data[header[i]];
				if (value == "false") {
					value = false;
				}
				if (value == "true") {
					value = true;
				}
				out[header[i]] = value;
				dataToHash = dataToHash + value;
			}

			createdId = sha256.update(dataToHash, 'utf8').digest('hex')
			out["id"] = createdId;
			out["imageCheck"] =  sha256.update(out['profilePicture'], 'utf8').digest('hex');
			cachedData[createdId] = out;
			console.log("Added individual:" + createdId);
			callBack(createdId, out);
		},
		modify: function (modifiedId, individual, callBack) {
			data = individual;
			// To Do: Ignore all fields but what is in header
			// To Do: Validation needed 
			var out = cachedData[modifiedId];
			console.log("Modified individual:" + modifiedId);
			for (i = 0; i < columns; i++) {
				if (header[i] in data) {
					var value = data[header[i]];
					if (value == "false") {
						value = false;
					}
					if (value == "true") {
						value = true;
					}
					out[header[i]] = value;
					console.log("key " + header[i] + " = " + value);
				}
			}

			out["id"] = modifiedId;
			out["imageCheck"] =  sha256.update(out['profilePicture'], 'utf8').digest('hex');
			cachedData[modifiedId] = out;
			callBack(modifiedId, out);
		}
	}
};

