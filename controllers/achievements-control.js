module.exports = {

	init: function (app, service) {

		// 	var accountMiddleware = service.useModule('middleware/account');

		// 	// app.get('/', accountMiddleware.requireRole('user'), function(req, res){
		// 	// 	res.render('index', { title: "Index" });
		// 	// });

		app.get('/achievements',  function(req, res) {
			res.render('achievements.hbs', {
				title: ' {:: Civic Seed - Login ::} '
			});
		});

	}

};