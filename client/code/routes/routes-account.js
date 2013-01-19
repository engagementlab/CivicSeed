var self = module.exports = {

	loadRoutes: function(ss, $app, $html, $body, $container) {

		$app.get('/remind-me', function(req) {
			$container.append(JT['pages-remindme']());
		});

	}

};