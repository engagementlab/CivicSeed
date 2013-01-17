var self = module.exports = {

	init: function (app, service, hbs) {

		// 	var accountMiddleware = service.useModule('middleware/account');

		// 	// app.get('/', accountMiddleware.requireRole('user'), function(req, res){
		// 	// 	res.render('index', { title: "Index" });
		// 	// });

		app.get('/achievements',  function(req, res) {
			res.render('achievements.hbs', {
				title: 'Achievements',
				bodyClass: 'achievements'
			});
		});

	}

};