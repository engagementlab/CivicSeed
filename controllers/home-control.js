var ss = require('socketstream');

var self = module.exports = {

	init: function (app) {

		ss.client.define('main', {
			view: 'main.html',
			css: 'game.stylus',
			code: [
				'libs/jquery-1.8.2.min.js',
				'libs/bootstrap.min.js',
				'main',
				'shared'
			],
			tmpl: [
				'main',
				'partials'
			]
		});

		app.get('/', function(req, res) {
			res.serveClient('main');
		});

	}

};