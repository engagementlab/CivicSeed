var self = module.exports = {

	loadMiddleware: function(ss, $app) {


		// // check if user experiences/authentic
		$app.before(function(req) {

			var fullPath;

			// check if user experiences/authentic
			ss.rpc('shared.account.getUserSession', function(userSessionObject) {

				if(userSessionObject === 'NOT_AUTHENTICATED') {
					// console.log('Not authenticated...');
					fullPath = req.fullPath;
					if(fullPath.indexOf('/admin') > -1 || fullPath.indexOf('/game') > -1) {
						// console.log('not authenticated...rerouting...');
						req.redirect('/');
					}
				} else {
					// console.log('Authenticated...');
				}

			});

		});

	}

};