var fs = require('fs'),
hbs = require('hbs');

module.exports = function(app, service, environment) {

	fs.readdir(__dirname + '/controllers', function(err, files) {
		var isJs = /\.js$/g,
		hidden = /^\_/g;
		if(err) {
			throw err;
		}
		files.forEach(function(file) {
			// var name = '';
			var name = file.replace('.js', '');
			if(file.match(isJs)) {
				if(!file.match(hidden)) {
					require('./controllers/' + file)(app, service, hbs);
					console.log('CS: '.blue + 'Initialize controller file: '.blue + file.yellow.underline);
				}
			}
		});
		// if we want to explicitly require controllers, do it here:
		// require('./...controller-file.js...')(app, service);

	});
};