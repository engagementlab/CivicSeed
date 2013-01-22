var rootDir = process.cwd();
var service = require(rootDir + '/service');
var UserModel = service.useModel('user');

exports.actions = function(req, res, ss) {

	// req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	return {

		getProfileInformation: function(fullName) {
			//parse name, search in db
			var name = fullName.split('.');
			UserModel.findOne({ firstName: name[0], lastName: name[1]} , function(err, user) {
				if(user) {
					var profileInfo = {
						firstName: user.firstName,
						lastName: user.lastName,
						resume: user.game.resume,
						colorMap: user.game.colorMap
					};
					console.log(profileInfo.colorMap);
					res(profileInfo);
				}
				else {
					res({firstName: false});
				}
			});
		}

	};

}