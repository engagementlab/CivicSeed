var self = module.exports = {

	loadRoutes: function(ss, $app) {

		var $container = $('#container');

		$app.get('/profiles/:name', function(req) {
			ss.rpc('shared.account.getProfileInformation', req.params['name'], function(info) {
					$container.append(JT['profiles-singleprofile'](info));
			});
		});

	}

};