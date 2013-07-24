var self = module.exports = {

	loadRoutes: function($app) {
		var profile = require('/profile');
		profile.init();

		$app.get('/profiles', function(req) {
			ss.rpc('shared.profiles.getAllProfiles', function(users) {
				$CONTAINER.append(JT['profiles-allprofiles']({users: users}));
			});
		});

		$app.get('/profiles/:random', function(req) {
			ss.rpc('shared.profiles.getProfileInformation', req.params['random'], function(info) {
				if(!info.profileSetup && sessionStorage.userEmail === info.email) {
					//reroute to change info
					location.href = 'change-info';
				} else {
					$CONTAINER.append(JT['profiles-singleprofile'](info));
				}
			});
		});

	}

};