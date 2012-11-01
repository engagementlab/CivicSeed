var rootDir = process.cwd();
var service = require(rootDir + '/service');
var UserModel = service.useModel('user').UserModel;

exports.actions = function(req, res, ss) {

	req.use('session');

	return {

		authenticate: function(email, password) {

			UserModel.findOne({email: email} , function(err, user) {

				if(user) {
					// var hashedPassword = user.password;
					// if(hash.verify(pass, hashedPassword)){
					//     return callback(null,user);
					// }
					if(user.password === password) {
						req.session.setUserId(user.id);
						res(true);
					} else {
						res(false);
					}
				} else {
					res(false);
				}

			});

		},

		logout: function() {

			req.session.setUserId(null);

		}

	};

}