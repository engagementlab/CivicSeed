var fs = require('fs'),
	walk = require('walk'),
	rootDir = process.cwd(),
	walker;

var self = module.exports = {

	loadAll: function(app, service, callback) {

		var isJs = /\.js$/g,
			hidden = /^\_/g;

		console.log('\n\n   * * * * * * * * * * * *   Loading Controllers   * * * * * * * * * * * *   \n\n'.yellow);

		walker = walk.walk(rootDir + '/server/controllers', {
			followLinks: false
		});

		walker.on('file', function(root, fileStats, next) {
			var file = fileStats.name;
			if(file.match(isJs) && !file.match(hidden)) {
				require(root + '/' + file).init(app, service);
				console.log('CS: '.blue + 'Initialize controller file: '.blue + file.yellow.underline);
			}
			next();
		});

		walker.on('end', function() {
			// purposefully load the _errors-control file *** LAST ***
			require(rootDir + '/server/controllers/_errors-control').init(app, service);
			console.log('CS: '.blue + 'Initialize controller file: '.blue + '_errors-control.js'.yellow.underline);
			// when it's all said and done, return control to the server
			console.log('All controllers loaded...'.yellow);
			if(typeof callback === 'function') { callback(); }
		});
	}

};