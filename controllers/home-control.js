var ss = require('socketstream');

var self = module.exports = {

	init: function (app, service, hbs) {

		ss.client.define('main', {
			view: 'main.html',
			css: 'game.stylus',
			code: [
				'libs/jquery-1.8.2.min.js',
				'libs/bootstrap.min.js',
				'main'
			],
			tmpl: [
				'main',
				'partials'
			]
		});

		app.get('/', function(req, res) {
			res.serveClient('main');
		});

		// app.get('/', function(req, res) {
		// 	// if(req.user) {
		// 	// 	res.redirect('/profile');
		// 	// }
		// 	res.render('home.hbs', {
		// 		bodyClass: 'home'
		// 	});
		// });




	}

};