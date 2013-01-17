var ss = require('socketstream');

var self = module.exports = {

	init: function(app) {

		ss.client.define('game', {
			view: 'game.jade',
			css: 'game.stylus',
			code: [
				'libs/jquery-1.8.2.min.js',
				'libs/davis-0.9.6.min.js',
				'libs/bootstrap.min.js',
				'libs/d3.v2.min.js',
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

	}

};