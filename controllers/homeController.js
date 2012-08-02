module.exports = function (app, service) {
	var accountMiddleware = service.useModule('middleware/account');

	// app.get('/', accountMiddleware.requireRole('user'), function(req, res){
	// 	res.render('index', { title: "Index" });
	// });
	app.get('/', function(req, res) {
		res.render('index.html', { title: "Index" });
	});
	// app.get('/OTHER.ETC.', function(req, res){
	// 	res.render('index.html', { title: "Index" });
	// });

	app.get('/canvasdemo', function(req, res) {
		res.render('canvasdemo.html', {
			title: ":: Canvas Demo ::"
		});
	});


};