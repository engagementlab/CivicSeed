var ss = require('socketstream');

var self = module.exports = {

	init: function (app, service, hbs) {

		ss.client.define('game', {
			view: 'game.html',
			css: 'game.stylus',
			code: [
				'libs/jquery-1.8.2.min.js',
				'libs/bootstrap.min.js',
				'game'
			],
			tmpl: [
				'game',
				'partials'
			]
		});

		app.get('/game', function(req, res) {
			res.serveClient('game');
		});

	}

};