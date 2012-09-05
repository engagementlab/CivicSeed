// var environment;
// var nodeEnv;
// var User;

var self = module.exports = {

	init: function (app, service, hbs) {

		// environment = service.environment;
		// nodeEnv = environment.app.nodeEnv;
		// User = service.useModel('user').UserModel;

		app.get('/admin', function(req, res) {
			res.render('admin/admin.hbs', {
				title: 'Admin',
				bodyClass: 'admin',
				message: 'User admin panel.',
			});
		});

	}

};