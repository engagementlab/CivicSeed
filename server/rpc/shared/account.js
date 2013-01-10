var rootDir = process.cwd();
var service = require(rootDir + '/service');
var UserModel = service.useModel('user');

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

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
						req.session.name =  user.name;
						req.session.email = user.email;
						req.session.role = user.role;
						req.session.game = user.game;
						// req.session.gameChannel = channel....
						req.session.save();
						// console.log(req.session.name, req.session.email, req.session.role, req.session.gameChannel, req.session.userId, user.id);
						res(true);
					} else {
						res(false);
					}
				} else {
					res(false);
				}

			});

		},

		deAuthenticate: function() {
			// console.log(req.session.name, req.session.email, req.session.role, req.session.gameChannel, req.session.userId);
			req.session.setUserId(null);
			req.session.name = null;
			req.session.email = null;
			req.session.role = null;
			req.session.save();
			// console.log(req.session.name, req.session.email, req.session.role, req.session.gameChannel, req.session.userId);
			res(true);
		},

		getUserSession: function() {
			if(req.session.userId) {
				res({
					id: req.session.userId,
					name: req.session.name,
					email: req.session.email
				});
			} else {
				// console.log('Not authenticated . . . rerouting . . . '.yellow.inverse);
				res('NOT_AUTHENTICATED');
			}
		}

	};

}