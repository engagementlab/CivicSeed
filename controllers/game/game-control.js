var self = module.exports = {

	init: function (app, service, hbs) {

		app.get('/game', function(req, res) {
			res.serveClient('main');
		});
		app.get('/gameMap',function(req,res){
			console.log("auwoqehwq");
			res.render('gameMap.hbs');
		});

	}

};