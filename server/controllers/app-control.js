var rootDir = process.cwd(),
	CivicSeed = require(rootDir + '/CivicSeed').getGlobals(),
	ss = require('socketstream');

var self = module.exports = {

	init: function(app) {

		ss.client.define('main', {
			view: 'main.jade',
			css: ['styles.styl'],
			code: [
				'libs/jquery-1.8.2.min.js',
				'libs/davis-0.9.6.min.js',
				'libs/bootstrap.min.js',
				'routes',
				'admin',
				'main',
				'shared'
			],
			tmpl: '*'
		});

		ss.http.route('/', function(req, res) {
			res.serveClient('main');
		});

		ss.client.define('game', {
			view: 'game.jade',
			css: ['styles.styl'],
			code: [
				'libs/jquery-1.8.2.min.js',
				'libs/davis-0.9.6.min.js',
				'libs/bootstrap.min.js',
				'libs/d3.v2.min.js',
				'libs/howler.min.js',
				'routes',
				'game',
				'shared'
			],
			tmpl: [
				'game',
				'partials'
			]
		});

		ss.http.route('/game', function(req, res) {
			res.serveClient('game');
		});

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