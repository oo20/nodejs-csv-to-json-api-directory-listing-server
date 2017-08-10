//
//  server.js
//  directory_listing_server
//
//  Created by Michael Steele on 3/16/17.
//  Copyright © 2017 Michael Steele. All rights reserved.
//

var config = require("./config");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var multer = require('multer'); // v1.0.5
var createHash = require('sha.js');
var sha256 = createHash('sha256');
var storage = multer.memoryStorage();
var upload = multer({
	limits: { fieldSize: 25 * 1024 * 1024 },
	storage: storage
}); // for parsing multipart/form-data
var users = require('./users');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
/*
app.use(bodyParser.json({verify:function(req,res,buf){
	req.rawBody=buf;
	console.log('req.rawBody: ' + req.rawBody);
}}));*/


var passport = require('passport');
var strategy = null;
var authType = config.authType;
if (authType == "basic") {
	strategy = require('passport-http').BasicStrategy;
} else {
	strategy = require('passport-http').DigestStrategy;
}
var sessionSupport = false;

if (authType == "digest") {
	passport.use(new strategy({ qop: 'auth' },
		function(username, cb) {
			users.findByUsername(username, function(err, user) {
				if (err) { return cb(err); }
				if (!user) { return cb(null, false); }
				return cb(null, user, user.password);
		})
	}));
}


app.get(['/api/','/api/status'], 
	checkAuth(),
	function(req, res) {
	
	res.json({"server":"ok"});
});

function checkAuth() {
	return passport.authenticate("digest", { session: sessionSupport});
}

var directoryListing = require("./simple-csv-json")(path.join(__dirname, 'public') + "/directory_listing.csv")
directoryListing.preload()
app.get('/api/individuals/directory/', 
	checkAuth(true), 
	function(req, res) {

	directoryListing.fetch(function(output){
		res.json({"individuals":output});
	});
});

app.delete('/api/individual/delete/:id', checkAuth(), function(req, res) {
	directoryListing.deleteById(req.params.id, function(deletedId, output){
		res.json({"individuals": [output]});
	});
});

app.post('/api/individual/create',  checkAuth(), function(req, res) {
	individuals = req.body.individuals;
	individual = individuals[0];
	directoryListing.create(individual, function(createdId, output){
		res.json({"individuals": [output]});
	});
});

app.put('/api/individual/modify/:id', checkAuth(), function(req, res) {
	individuals = req.body.individuals;
	individual = individuals[0];
	directoryListing.modify(req.params.id, individual, function(modifiedId, output){
		res.json({"individuals": [output]});
	});
});

app.post('/api/tempFile/:id', [checkAuth(), upload.any()], function (req, res, next) {
	id = req.params.id;
	//console.log('Upload temp file for ' + id);
	//Too verbose --- console.log(req);
	fileData = Buffer.from(req.body.tempFile, 'base64')
	tempFiles[id] = fileData;
	//Too verbose --- console.log('Output of file: ' + tempFiles[id]);
	console.log('Length of file: ' + tempFiles[id].length);
	var out = {};
	out['profilePicture'] = config.apiURL() + "getTempFile/" + id + ".jpg";
	out['imageCheck'] =  sha256.update(fileData, 'utf8').digest('hex');
	directoryListing.modify(id, out, function(modifiedId, output){
		res.json({"server":"ok"});
	});
});

app.get('/api/getTempFile/:id.jpg', checkAuth(), function (req, res) {
	id = req.params.id;
	//console.log('Getting tempFile ' + id);
	//Too verbose --- console.log('Getting data' + tempFiles[id]);
	//console.log('Length of file: ' + tempFiles[id].length);

	res.writeHead(200, {
		'Content-Type': 'image/jpeg',
		//'Content-disposition': 'attachment;filename=' + id + '.jpg',
		'Content-Length': tempFiles[id].length
	});
	res.end(tempFiles[id]);
});

app.get('/static/*', checkAuth());
app.use('/static', express.static(path.join(__dirname, 'public')));

var tempFiles = {};

if (config.serverType == "http") {
	var http = require("http");
	var httpServer = http.createServer(app);
	httpServer.listen(config.port());
	console.log('Server at ' + config.serverURL());
} else {
	var certApp = express();
	var http = require("http");
	var httpServer = http.createServer(certApp);
	certApp.get(['/api/','/api/status'], 
		function(req, res) {
		res.json({"server":"ok", "message": "Secure server access required."});
	});
	certApp.use("/" + config.certPath(), express.static(path.join(__dirname, config.certServerPath())));
	httpServer.listen(config.hostInsecurePort);
	console.log('Public cert at ' + config.certURL());

	var https = require("https");
	var httpsServer = https.createServer(config.credentials(), app);
	httpsServer.listen(config.port());
	console.log('Secure server at ' + config.serverURL());
}
