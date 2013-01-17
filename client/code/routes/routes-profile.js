var self = module.exports = {

	loadRoutes: function(ss, $app, $html, $body, $container) {

		$app.get('/profiles', function(req) {
			$container.append('<h1>PROFILES!</h1>');
		});

		$app.get('/profiles/:name', function(req) {
			ss.rpc('shared.account.getProfileInformation', req.params['name'], function(info) {
					$container.append(JT['profiles-singleprofile'](info));
			});
		});

	}

};