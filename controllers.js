var fs = require('fs'),
hbs = require('hbs');

module.exports = function(app, service) {

	var isJs = /\.js$/g,
	hidden = /^\_/g,
	loadDirectory = function(rootDir, path) {

		fs.readdir(rootDir, function(err, files) {
			if(err) {
				throw err;
			}
			files.forEach(function(file) {
				var newRootDir = rootDir + '/' + file,
				newPath = path + '/' + file,
				stats;

				try {
					stats = fs.lstatSync(newRootDir);
					if(stats.isDirectory()) {
						loadDirectory(newRootDir, newPath);
					}
				}
				catch (e) {
					console.log(' *** ERROR CHECKING FOR CONTROLLERS DIRECTORY *** '.red.inverse)
				}
				if(file.match(isJs)) {
					if(!file.match(hidden)) {
						require(newPath).init(app, service, hbs);
						console.log('CS: '.blue + 'Initialize controller file: '.blue + file.yellow.underline);
					}
				}
			});
		});

	};

	// load all controller files in all folders, recursively
	loadDirectory(__dirname + '/controllers', './controllers');

	// if we want to explicitly require controllers, do it here:
	// require('./...controller-file.js...')(app, service);

};