var self = module.exports = {

	loadRoutes: function(ss, $app) {

		var $container = $('#container');

		$app.get('/profiles', function(req) {
			$container.append(JT['profiles-singleprofile']());
		});

	}

};