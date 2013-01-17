var rootDir = process.cwd(),
	CivicSeed = require(rootDir + '/bin/server').CivicSeed;

var self = module.exports = {

	init: function(app) {

		// 404'd
		app.use(function(req, res, next) {
			if(req.path === '/404') {
				// res.send(404, 'Sorry cant find that!');
				CivicSeed.SocketStream = false;
				res.render(rootDir + '/client/views/app.jade', {
					title: '404 - Page Not Found',
					CivicSeed: JSON.stringify(CivicSeed),
					SocketStream: ''
				});
			} else {
				res.serveClient('main');
				// ... send up the 'req.path' route to the front end somehow???
				// ... or is that even needed????
				// ... could also do some SEO stuff here???
			}
		});

	}

};
