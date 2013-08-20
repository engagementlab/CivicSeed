var bcrypt = require('bcrypt');

var self = module.exports = {

	// generates a hashed password and salt
	hashPassword: function(password, cb) {
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(password, salt, function(err, hash) {
				cb({
					hash: hash,
					salt: salt
				});
			});
		});
	}

};