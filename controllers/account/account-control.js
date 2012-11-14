var self = module.exports = {

	init: function (app, service, hbs) {

		// var Account = service.useModel('user');
		var User = service.useModel('user');



		// // console.log(User);
		// var redirectIfLogined = service.useModule('middleware/account').redirectIfLogined;

		// app.get('/login', redirectIfLogined, function(req, res){
		// 	res.render('account/login', { title: "Testing Login", redir: req.query.redir});
		// });

		// app.get('/register', redirectIfLogined, function(req, res) {
		// 	res.render('account/register', { title: "Register"});
		// });

		// app.post('/register', function(req, res){
		// 	var user = new User(req.body.user);
		// 	user.role = 'user';

		// 	function userSaveFailed() {
		// 		req.flash('error', 'Account creation failed');
		// 		res.redirect('/register');
		// 	}

		// 	user.save(function (err) {
		// 		if(err) return userSaveFailed();

		// 		req.flash('info', 'Your account has been created');
		// 		req.session.user = user;
		// 		res.redirect('/');
		// 	}); 
		// });

		// app.post('/login', function(req, res){
		// 	var email = req.body.user.email;
		// 	var password = req.body.user.password;

		// 	User.findOne({ 'email': email }, function(err, user) {
		// 		if (user && user.authenticate(password)) {
		// 			req.session.user = user;
		// 			req.session.cookie.expires = false;
		// 			res.redirect('/');
		// 		} else {
		// 			req.flash('error', 'Incorrect credentials');
		// 			res.redirect('/login');
		// 		}
		// 	});
		// });

		// app.get('/sessions/destroy', function(req, res) {
		// 	if (req.session) {
		// 		req.session.destroy(function() {});
		// 	}
		// 	res.redirect('/login');
		// });
	}

};