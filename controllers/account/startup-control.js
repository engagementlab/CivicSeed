var fs = require('fs');

module.exports = function (app, service) {

	var environment = service.loadEnvironment(),
	nodeEnv = environment.app.nodeEnv,
	initialized = environment.app.initialized;

	app.get('/startup', function(req, res) {

		var user,
		quadrant,
		mapArray = [],
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

					fs.readFile(__dirname + '/../../data/account/users.json', 'ascii', function(err, file) {
						if(err) {
							console.error("Could not open file: %s", err);
							process.exit(1);
							throw err;
						}
						user.create(JSON.parse(file), function(err) {
							if(err) { return handleError(err); }
							user.find(function (err, users) {
								if (err) { return handleError(err); }
								console.log(users);
								consoleOutput += users;

								// res.render('startup.hbs', {
								// 	title: 'STARTUP',
								// 	consoleOutput: consoleOutput
								// });
							});
						});
					});
				});

				// loading default users
				quadrant.remove(function (err, users) {
					if (err) { return handleError(err); }



					fs.readdir(__dirname + '/../../data/map', function(err, files) {
						if(err) {
							throw err;
						}

						// FIXME: THIS COUNT IS NOT RELIABLE!!! NEED A BETTER WAY!!!
						var mapLength = 0;

						files.forEach(function(file) {
							if(file.match(isJson)) {

								fs.readFile(__dirname + '/../../data/map/' + file, 'ascii', function(err, file) {
									if(err) {
										console.error("Could not open file: %s", err);
										process.exit(1);
										throw err;
									}
									mapArray.push(JSON.parse(file));
									quadrant.create([JSON.parse(file)], function(err) {
										if(err) { return handleError(err); }
										// quadrant.find(function (err, quadrants) {
										// 	if (err) { return handleError(err); }
										// 	console.log(quadrants);
										// 	consoleOutput += quadrants;
										// });
										console.log('CS: '.blue + 'Importing map data file into mongodb: '.green + file.substr(0,50).yellow.underline + '...'.yellow.underline);
									});
									// FIXME: THIS COUNT IS NOT RELIABLE!!! NEED A BETTER WAY!!!
									mapLength += 1;
									// console.log(mapLength);
									if(mapLength === 50) {
										res.render('startup.hbs', {
											title: 'STARTUP',
											consoleOutput: consoleOutput
										});
									}
								});
							}
						});
					});




					// fs.readFile(__dirname + '/../../data/map/quadrant0.json', 'ascii', function(err, file) {
					// 	if(err) {
					// 		console.error("Could not open file: %s", err);
					// 		process.exit(1);
					// 		throw err;
					// 	}
					// 	quadrant.create([JSON.parse(file)], function(err) {
					// 		if (err) { return handleError(err); }
					// 		quadrant.find(function (err, quadrants) {
					// 			if (err) { return handleError(err); }
					// 			console.log(quadrants);
					// 			consoleOutput += quadrants;

					// 			res.render('startup.hbs', {
					// 				title: 'STARTUP',
					// 				consoleOutput: consoleOutput
					// 			});
					// 		});
					// 	});
					// });
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