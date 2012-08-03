module.exports = function (app, service, hbs) {

	app.get('/game', function(req, res) {
		res.serveClient('main');
	});

};