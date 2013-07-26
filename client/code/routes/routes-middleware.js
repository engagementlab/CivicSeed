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

	},

	validateUserSession: function(callback) {
		// // temporarily route them to a page that validates their user session
		// // "hold on their's been some confusion. We're revalidating your authentication credentials. Thanks for your patience."
		// // Davis.location.assign('/validating');
		// ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		// 	//console.log('routesmiddleware getUserSession: ', userSessionObject);
		// 	if(userSessionObject.role) {
		// 		// console.log('Authenticated...');
		// 		// console.log('session storage:', sessionStorage);
		// 		if(!sessionStorage.getItem('userId')) {
		// 			sessionStorage.setItem('userId', userSessionObject.id);
		// 			sessionStorage.setItem('userFirstName', userSessionObject.firstName);
		// 			sessionStorage.setItem('userLastName', userSessionObject.lastName);
		// 			sessionStorage.setItem('userEmail', userSessionObject.email);
		// 			sessionStorage.setItem('userRole', userSessionObject.role);
		// 			sessionStorage.setItem('profileLink', userSessionObject.profileLink);
		// 		}
		// 		if(typeof callback === 'function') { callback(); }
		// 	} else {
		// 		// LOG 'EM OUT!!!!
		// 	}
		// });
	}

};