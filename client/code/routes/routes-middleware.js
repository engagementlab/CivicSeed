var actorRoutes = [
	'/game'
];
var adminRoutes = [
	'/admin',
	'/admin/invitecodes',
	'/admin/monitor'
];
var superadminRoutes = [
	'/admin/startup',
	'/admin/npcs'
];

var self = module.exports = {

	loadMiddleware: function($app) {

		// // check if user experiences/authentic
		$app.before(function(req) {

			var fullPath = req.fullPath;
			var userRole = sessionStorage.getItem('userRole');

			if(Davis.previousPath && Davis.previousPath === '/game') {
				// do something special here
				$game.exitGame();
			}
			Davis.previousPath = req.fullPath;

			if(typeof userRole !== 'string') {
				userRole = 'non-user';
			}

			$CONTAINER.empty().append(JT['partials-navigation']({ fullPath: fullPath }));

			// TODO: apply a more robust, secure system for routing
			// this system is temporary, but sufficient for current needs
			if(actorRoutes.indexOf(fullPath) > -1) {
				if(userRole !== 'actor') {
					req.redirect('/');
					return false;
				}
			} else if(adminRoutes.indexOf(fullPath) > -1) {
				if(userRole !== 'superadmin' && userRole !== 'admin') {
					req.redirect('/');
					return false;
				}
			} else if(superadminRoutes.indexOf(fullPath) > -1) {
				if(userRole !== 'superadmin') {
					req.redirect('/');
					return false;
				}
			}

		});

	}

};