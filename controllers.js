var fs = require('fs');

module.exports = function(app, service, environment) {

	// console.log('----------------------------------------------'.rainbow);
	// console.log(app.get);
	// console.log('----------------------------------------------'.rainbow);
	// console.log(service);
	// console.log('----------------------------------------------'.rainbow);
	// console.log(environment);
	// console.log('----------------------------------------------'.rainbow);


	fs.readdir(__dirname + '/controllers', function(err, files) {
		var isJs = /\.js$/g;
		if(err) {
			throw err;
		}
		files.forEach(function(file) {
			// var name = '';
			// var name = file.replace('.js', '');
			if(file.match(isJs)) {
				// console.log(name);
				// require('./controllers/' + name)(app, service);
				// console.log(file.red);
			}
		});
		require('./controllers/user-control')(app, service);
		// require('./controllers/homeController')(app, service);
		// require('./controllers/accountController')(app, service);
	});
};