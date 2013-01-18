var rootDir = process.cwd();
var service = require(rootDir + '/service');
var UserModel = service.useModel('user');

exports.actions = function(req, res, ss) {

	// req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	return {

		getProfileInformation: function(fullName) {
			UserModel.findOne({ profileUrl: fullName } , function(err, user) {
				if(user) {
					var profileInfo = {
						firstName: user.firstName,
						lastName: user.lastName,
						resume: user.game.resume,
						img: user.game.colorMap
					};
					res(profileInfo);
				}
				else {
					res(false);
				}
			});
		}

	};

}