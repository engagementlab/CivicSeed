var self = module.exports = {

	loadRoutes: function($app) {
		// if (valid(text)) {
		// 	return ss.rpc('demo.sendMessage', text, cb);
		// } else {
		// 	return cb(false);
		// }

		$app.get('/', function(req) {
			$CONTAINER.append(JT['pages-home']());
		});

		$app.get('/about', function(req) {
			$CONTAINER.append(JT['pages-about']());
		});

		$app.get('/contact', function(req) {
			$CONTAINER.append(JT['pages-contactus']());
		});

		$app.get('/game', function(req) {
			// have to force it unfortunately
			location.href = '/game';
		});

		$app.get('/introduction', function(req) {
			// have to force it unfortunately
			$CONTAINER.append(JT['pages-introduction']());
		});

	}

};