//
//  config.js
//  directory_listing_server
//
//  Created by Michael Steele on 3/16/17.
//  Copyright © 2017 Michael Steele. All rights reserved.
//

var fs = require('fs');

var boolSelfSigned = true;
var privateKey = null;
var certificate = null;

var sslDirectory = 'sslcert/';
var publicDirectory = 'public/';
var staticDirectory = 'static/';
var sslKeyLocation = sslDirectory + 'server.key';
var sslPublicKeyLocation = sslDirectory + 'server.pub';
var sslCertLocation = publicDirectory + 'server.crt'; // For download and installation
var downloadCertLocation = staticDirectory + 'server.crt'; // For download and installation

if (boolSelfSigned == true) {
	if (!fs.existsSync(sslDirectory)) {
		fs.mkdirSync(sslDirectory);
	}
	var selfSigned = require('selfsigned');
	var attrs = [{ name: 'commonName', value: 'test.com' }];
	var pems = selfSigned.generate(attrs, { days: 365 });
	privateKey = pems['private'];
	publicKey = pems['public'];
	certificate = pems['cert'];
	if (!fs.existsSync(sslKeyLocation)) {
		console.log("Generating self signed private key " + sslKeyLocation);
		fs.writeFile(sslKeyLocation, privateKey);
	}
	if (!fs.existsSync(sslPublicKeyLocation)) {
		console.log("Generating self signed public key " + sslPublicKeyLocation);
		fs.writeFile(sslPublicKeyLocation, publicKey);
	}
	if (!fs.existsSync(sslCertLocation)) {
		console.log("Generating self signed certificate key " + sslCertLocation);
		fs.writeFile(sslCertLocation, certificate);
	}
} else {
	privateKey = fs.readFileSync(sslKeyLocation, 'utf8');
	certificate = fs.readFileSync(sslCertLocation, 'utf8');
}

module.exports = {
	serverType : 'https', // http or https.  https will also spin up a http server for the server public cert only
	hostSecurePort: 8443,
	hostInsecurePort: 8080,
	hostName: 'localhost',
	hostDirectory: 'api/',
	imagesDir : "static/images/", // relative relative location
	authType : "digest", // "none" or "digest"
	digestSession: true, // true or false - if using authType digest, allow session or not
	users: [
		{ id: 1, username: 'test', password: 'test', displayName: 'Test User', emails: [ { value: 'test@test.com' } ] }
	],
	credentials : function() {
		return {key: privateKey, cert: certificate};
	},
	serverURL : function() {
		return this.serverType + "://" + this.hostName + ":" + this.port() + "/";
	},
	certURL : function() {
		return "http://" + this.hostName + ":" + this.hostInsecurePort + "/" + this.certPath();
	},
	certPath : function() {
		return downloadCertLocation;
	},
	certServerPath : function() {
		return sslCertLocation;
	},
	apiURL : function() {
		return this.serverURL() + this.hostDirectory;
	},
	port: function() {
		return this.serverType == "http" ? this.hostInsecurePort : this.hostSecurePort;
	}
}

