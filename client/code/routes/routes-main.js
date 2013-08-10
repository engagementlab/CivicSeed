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
			// temporary fix, avoiding recursion but refreshing the game on '/game' route
			// TODO: do not refresh and fix 
			if(!sessionStorage.getItem('routing-the-game')) {
				sessionStorage.setItem('routing-the-game', true);
				location.href = '/game';
			} else {
				sessionStorage.removeItem('routing-the-game');
				$game.init();
			}
		});

		$app.get('/introduction', function(req) {
			$CONTAINER.append(JT['pages-introduction']());
		});

	}

};