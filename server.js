//
//  server.js
//  directory_listing_server
//
//  Created by Michael Steele on 3/16/17.
//  Copyright © 2017 Michael Steele. All rights reserved.
//

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var config = require("./config");
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var port = process.env.PORT || config.port;

var router = express.Router();


router.get('/', function(req, res) {
	res.json({"server":"ok"});
});

var directoryListing = require("./simple-csv-json")(path.join(__dirname, 'public') + "/directory_listing.csv")
directoryListing.preload()

router.get('/individuals/directory/', function(req, res) {

	directoryListing.fetch(function(output){
		res.json({"individuals":output});
	});
});

router.delete('/individual/delete/:id', function(req, res) {
	directoryListing.deleteById(req.params.id, function(deletedId, output){
		res.json({"individuals": [output]});
	});
});

router.post('/individual/create', upload.array(), function(req, res) {
	individuals = req.body.individuals;
	individual = individuals[0];
	directoryListing.create(individual, function(createdId, output){
		res.json({"individuals": [output]});
	});
});

router.put('/individual/modify/:id', upload.array(), function(req, res) {
	individuals = req.body.individuals;
	individual = individuals[0];
	directoryListing.modify(req.params.id, individual, function(modifiedId, output){
		res.json({"individuals": [output]});
	});
});


app.use('/api', router);

app.use('/static', express.static(path.join(__dirname, 'public')));

app.listen(port);
console.log('Server at ' + config.serverURL + 'api/');
