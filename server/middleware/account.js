// Only let a request through if the session has been authenticated
exports.authenticated = function(framework) {
	return function(req, res, next) {
		if(req.session && (req.session.userId != null)) {
			console.log(req.session);
			console.log(req.session.userId);
			console.log('GREEN LIGHT'.green.inverse);
			return next();
		} else {
			if(framework === 'express') {
				if(req.url.match(/^\/admin/g)) {
					console.log('Not authenticated . . . rerouting . . . '.yellow.inverse);
					return res.redirect('/');
				}
				return next();
			} else {
				return res('Non admitte!');
			}
		}
	};
};

// EXAMPLE
// exports.log = function() {
// 	return function(req, res, next) {
// 		console.log('%s %s'.magenta.inverse, req.method, req.url);
// 		next();
// 	};
// };

