var self = module.exports = {

	loadMiddleware: function(ss, $app) {

		var $body = $(document.body);
		var $container = $('#container');

		// // check if user experiences/authentic
		$app.before(function(req) {

			var fullPath = req.fullPath;

			$container.empty().append(JT['partials-navigation']({ fullPath: fullPath }));

			// check if user experiences/authentic
			ss.rpc('shared.account.getUserSession', function(userSessionObject) {

				if(userSessionObject.role) {
					// console.log('Authenticated...');
					if(!sessionStorage.getItem('userId')) {
						sessionStorage.setItem('userId', userSessionObject.id);
						sessionStorage.setItem('userName', userSessionObject.name);
						sessionStorage.setItem('userEmail', userSessionObject.email);
						sessionStorage.setItem('userRole', userSessionObject.role);
					}
					if(userSessionObject.role !== 'superadmin' && userSessionObject.role !== 'admin') {
						// console.log('No admin rights...');
						if(fullPath.indexOf('/admin') > -1) {
							// console.log('not admin rights...rerouting...');
							sessionStorage.setItem('userRole', userSessionObject.role);
							req.redirect('/');
						}
					}
				} else {
					// console.log('Not authenticated...');
					if(fullPath.indexOf('/admin') > -1 || fullPath.indexOf('/game') > -1) {
						// console.log('not authenticated...rerouting...');
						req.redirect('/');
					}
				}

			});

		});

	}

};