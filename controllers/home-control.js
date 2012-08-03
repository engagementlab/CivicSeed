module.exports = function (app, service, hbs) {



	// // var accountMiddleware = service.useModule('middleware/account');

	// // app.get('/', accountMiddleware.requireRole('user'), function(req, res){
	// // 	res.render('index', { title: "Index" });
	// // });
	// app.get('/', function(req, res) {
	// 	res.render('index.html', { title: "Index" });
	// });
	// // app.get('/OTHER.ETC.', function(req, res){
	// // 	res.render('index.html', { title: "Index" });
	// // });



	app.get('/', function(req, res) {
		// if(req.user==undefined){
		// 	res.redirect('/login');
		// }
		// else{
		// 	res.redirect('/profile');
		// }
		res.render('index.html', {
			title: ' {:: Civic Seed ::} '
		});
	});

// 	// if(user_signed_in(req) !== true) {
// 	// 	res.serve('login');
// 	// } else {
// 	// 	res.serve('top');
// 	// }
// 	//res.serve('login');



};