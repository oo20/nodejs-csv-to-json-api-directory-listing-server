//
//  config.js
//  directory_listing_server
//
//  Created by Michael Steele on 3/16/17.
//  Copyright © 2017 Michael Steele. All rights reserved.
//

var defaultPort = 8080

module.exports = {
	port: defaultPort,
	serverURL : 'http://localhost:' + defaultPort + '/',
	imagesDir : "static/images/"
}

