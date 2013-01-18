var self = module.exports = {

	loadRoutes: function(ss, $app, $html, $body, $container) {

		$app.get('/profiles', function(req) {
			$container.append('<h1>PROFILES!</h1>');
		});

		$app.get('/profiles/:profileUrl', function(req) {
			ss.rpc('shared.profiles.getProfileInformation', req.params['profileUrl'], function(info) {
					$container.append(JT['profiles-singleprofile'](info));
			});
		});

	}

};