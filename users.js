var config = require("./config");
var users = config.users;

exports.findByUsername = function(username, cb) {
	process.nextTick(function() {
		for (var i = 0, len = users.length; i < len; i++) {
			var user = users[i];
			if (user.username === username) {
				//console.log('Username ' + user.username + " logged in.");
				return cb(null, user);
			}
		}
		console.log('Username ' + username + " failed login.");
		return cb(null, null);
	});
}
