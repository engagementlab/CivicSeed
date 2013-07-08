var self = module.exports = {

	loadRoutes: function(ss, $app, $html, $body, $container) {
		var profile = require('/profile');
		profile.init();

		$app.get('/profiles', function(req) {
			ss.rpc('shared.profiles.getAllProfiles', function(users) {
				$container.append(JT['profiles-allprofiles']({users: users}));
			});
		});

		$app.get('/profiles/:random', function(req) {
			ss.rpc('shared.profiles.getProfileInformation', req.params['random'], function(info) {
				if(!info.profileSetup && sessionStorage.userEmail === info.email) {
					//reroute to change info
					location.href = 'change-info';
				} else {
					$container.append(JT['profiles-singleprofile'](info));
				}
			});
		});

	}

};