var rootDir = process.cwd();
var service = require(rootDir + '/service');
var UserModel = service.useModel('user');

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	return {

		getProfileInformation: function(fullName) {
			//parse name, search in db
			var name = fullName.split('.');
			UserModel.findOne({ firstName: name[0], lastName: name[1]} , function(err, user) {
				if(err) {
					console.log(err);
					res({firstName: false});
				}
				else if(user) {
					var profileInfo = {
						firstName: user.firstName,
						lastName: user.lastName,
						school: user.school,
						resume: user.game.resume,
						gameStarted: user.gameStarted,
						profileUnlocked: user.profileUnlocked,
						profileSetup: user.profileSetup,
						colorNum: user.game.colorInfo.tilesheet,
						colorMap: user.game.colorMap,
						email: user.email
					};
					res(profileInfo);
				}
				else {
					res({firstName: false});
				}
			});
		},

		getAllProfiles: function() {
			UserModel.find({role: 'actor'}, function(err, users) {
				if(err) {
					console.log(err);
					res(false);
				}
				else if(users){
					var all = [];
					users.forEach(function(u,i) {
						var profile = {
							firstName: u.firstName,
							lastName: u.lastName
						};
						all.push(profile);
					});
					res(all);
				}
			});
		}

	};

}