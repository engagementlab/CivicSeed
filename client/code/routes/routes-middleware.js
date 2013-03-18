var self = module.exports = {

	loadMiddleware: function(ss, $app, $html, $body, $container) {

		// // check if user experiences/authentic
		$app.before(function(req) {

			var fullPath = req.fullPath;

			$container.empty().append(JT['partials-navigation']({ fullPath: fullPath }));

			// TODO: SOMEHOW PAUSE DAVIS HANDLING UNTIL THE RPC IS FINISHED!!!!
			// OTHERWISE, IT HANDLES STUFF, THEN DOES THIS, ARGH....
			// see: https://github.com/olivernn/davis.js/issues/67
			// check if user experiences/authentic
			console.log('middleware session check');
			ss.rpc('shared.account.getUserSession', function(userSessionObject) {
				console.log('server getUserSession response: ', userSessionObject);
				if(userSessionObject.role) {
					// console.log('Authenticated...');
					console.log('session storage:', sessionStorage);
					if(!sessionStorage.getItem('userId')) {
						sessionStorage.setItem('userId', userSessionObject.id);
						sessionStorage.setItem('userFirstName', userSessionObject.firstName);
						sessionStorage.setItem('userLastName', userSessionObject.lastName);
						sessionStorage.setItem('userEmail', userSessionObject.email);
						sessionStorage.setItem('userRole', userSessionObject.role);
					}
					if(userSessionObject.role !== 'superadmin' && userSessionObject.role !== 'admin') {
						// console.log('No admin rights...');
						if(fullPath.indexOf('/admin') > -1) {
							// console.log('not admin rights...rerouting...');
							sessionStorage.setItem('userRole', userSessionObject.role);
							// req.redirect('/');
							Davis.location.replace('/');
						}
					} else if(userSessionObject.role !== 'superadmin') {
						// console.log('No super admin rights...');
						if(fullPath.indexOf('/admin/startup') > -1) {
							// console.log('not super admin rights...rerouting...');
							sessionStorage.setItem('userRole', userSessionObject.role);
							// req.redirect('/admin');
							Davis.location.replace('/admin');
						}
					}
				} else {
					// console.log('Not authenticated...');
					if(fullPath.indexOf('/admin') > -1 || fullPath.indexOf('/game') > -1) {
						// console.log('not authenticated...rerouting...');
						// req.redirect('/');
						Davis.location.replace('/');
					}
				}

			});

		});

	}

};