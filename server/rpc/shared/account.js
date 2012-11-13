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
						req.session.name =  user.name;
						req.session.email = user.email;
						req.session.save();
						// console.log(req.session.name, req.session.email, req.session.userId, user.id);
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
			// console.log(req.session.name, req.session.email, req.session.userId);
			req.session.setUserId(null);
			req.session.name = null;
			req.session.email = null;
			req.session.save();
			// console.log(req.session.name, req.session.email, req.session.userId);
			res(true);
		},

		getUserSession: function() {
			if(req.session.userId) {
				console.log(req.session);
				res({
					user: {
						id: req.session.userId,
						name: req.session.name,
						email: req.session.email
					}
				});
			} else {
				res(false);
			}
		}

	};

}