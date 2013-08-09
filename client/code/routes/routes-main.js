var self = module.exports = {

	loadRoutes: function($app) {

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
			CivicSeed.gameEngine.init();
		});

		$app.get('/introduction', function(req) {
			$CONTAINER.append(JT['pages-introduction']());
		});

	}

};