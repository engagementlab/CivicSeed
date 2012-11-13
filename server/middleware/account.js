// Only let a request through if the session has been authenticated
exports.authenticated = function(framework) {
	return function(req, res, next) {
		if(req.session && (req.session.userId != null)) {
			// console.log('Authenticated...'.green.inverse);
			return next();
		} else {
			console.log('RED LIGHT'.red.inverse);
			if(framework === 'express') {
				if(req.url.match(/^\/admin/g)) {
					// console.log('Not authenticated . . . rerouting . . . '.yellow.inverse);
					return res.redirect('/');
				}
				return next();
			} else {
				// console.log('Not authenticated . . . rerouting . . . '.yellow.inverse);
				return res('NOT_AUTHENTICATED');
			}
		}
	};
};