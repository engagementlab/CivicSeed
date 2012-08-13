var fs = require('fs');

module.exports = function (app, service) {

	var environment = service.loadEnvironment(),
	nodeEnv = environment.app.nodeEnv,
	initialized = environment.app.initialized;


 

	app.get('/startup', function(req, res) {

		var user,
		quadrant,
		isJson = /\.json$/g,
		consoleOutput = '';

		// check for intialization of app
		// NOTE: THE VARIABLE 'initialized' CAN ONLY BE SET 'true' IN PRODUCTION OR STAGING...
		// ...THIS WAY, THE APP CAN BE (RE-)INITIALIZED MULTIPLE TIMES, IF NEEDS BE, IN DEVELOPMENT OR TESTING
		if(!initialized) {
			if(nodeEnv) {

				console.log('\n\n   * * * * * * * * * * * *   Initialization/Startup/Loading Predefined Data   * * * * * * * * * * * *   \n\n'.yellow);

				user = service.useModel('user', 'preload');
				quadrant = service.useModel('map', 'preload');

				// loading default users
				user.remove(function (err, users) {
					if (err) { return handleError(err); }
					user.create([{
						name: 'admin',
						password: 'password',
						email: 'langbert@gmail.com'
					}], function(err) {
						if (err) { return handleError(err); }
						user.find(function (err, users) {
							if (err) { return handleError(err); }
							console.log(users);
							consoleOutput += users;

							res.render('startup.hbs', {
								title: 'STARTUP',
								consoleOutput: consoleOutput
							});
						});
					});
				});

			} else if(nodeEnv === 'production') {
				initialized = true;
			} else if(nodeEnv === 'staging') {
				initialized = true;
			} else if(nodeEnv === 'testing') {
			} else if(nodeEnv === 'development') {
			} else {
				console.log('  NODE_ENV VARIABLE CONNECTION ERROR: cannot use for preloading data   '.red.inverse);
			}
		} else {
			// FIXME: THIS SHOULD ABSOLUTELY REDIRECT TO EITHER 404 OR HOME
			console.log('  ...THE APP HAS ALREADY BEEN INITIALIZED...  '.red.inverse);
			res.render('startup.hbs', {
				title: 'ERROR',
				consoleOutput: '...THE APP HAS ALREADY BEEN INITIALIZED...'
			});
		}


	});

	// app.get('/sessions/destroy', function(req, res) {
	// 	if (req.session) {
	// 		req.session.destroy(function() {});
	// 	}
	// 	res.redirect('/login');
	// });
};








			// loading map...
			// doing this just in development for now, but this should be universal
			// fs.readdir(__dirname + '/data/map', function(err, files) {
			// 	if(err) {
			// 		throw err;
			// 	}
			// 	files.forEach(function(file) {
			// 		if(file.match(isJson)) {
			// 			// require(newPath)(app, service, hbs);

			// 			console.log('CS: '.blue + 'Importing data file into mongodb: '.green + file.yellow.underline);
			// 		}
			// 	});
			// });
			// fs.readFile(__dirname + '/data/map/quadrant0.json', 'ascii', function(err, file) {
			// 	if(err) {
			// 		console.error("Could not open file: %s", err);
			// 		// process.exit(1);
			// 		throw err;
			// 	}
			// 	// VERY VERY TEMPORARY!!! USE WITH CARE
			// 	// VERY VERY TEMPORARY!!! USE WITH CARE
			// 	// VERY VERY TEMPORARY!!! USE WITH CARE
			// 	quadrant.create([file], function (err) {
			// 		if(err) {

			// 		}
			// 	});
			// 	quadrant.find(function (err, quadrants) {
			// 		if(err) {

			// 		}
			// 		console.log(quadrants);
			// 	});
			// 	// VERY VERY TEMPORARY!!! USE WITH CARE
			// 	// VERY VERY TEMPORARY!!! USE WITH CARE
			// 	// VERY VERY TEMPORARY!!! USE WITH CARE
			// 	console.log('CS: '.blue + 'Importing data file into mongodb: '.green + file.substr(0,50).yellow.underline + '...'.yellow.underline);
			// });