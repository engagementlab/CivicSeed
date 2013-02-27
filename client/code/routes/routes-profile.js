var self = module.exports = {

	loadRoutes: function(ss, $app, $html, $body, $container) {

		$app.get('/profiles', function(req) {
			ss.rpc('shared.profiles.getAllProfiles', function(users) {
				$container.append(JT['profiles-allprofiles']({users: users}));
			});
		});

		$app.get('/profiles/:name', function(req) {
			ss.rpc('shared.profiles.getProfileInformation', req.params['name'], function(info) {
					$container.append(JT['profiles-singleprofile'](info));
			});
		});

	}

};