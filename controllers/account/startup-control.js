var fs = require('fs');

var handleError = function(message, err) {
	if(err) {
		if(message.length < 1) {
			message = 'Error: %s'
		}
		console.error(message, err);
		// process.exit(1);
		throw err;
	}
};

var self = module.exports = {

	service: null,

	init: function (app, service, hbs) {

		var environment = service.loadEnvironment(),
		nodeEnv = environment.app.nodeEnv,
		initialized = environment.app.initialized;

		self.service = service;

		app.get('/startup', function(req, res) {

			var user,
			quadrant,
			tile,
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
					tile = service.useModel('tile', 'preload');

					res.render('startup.hbs', {
						title: 'STARTUP',
						consoleOutput: consoleOutput
					});

					self.dropCollection('users', function() {
						fs.readFile(__dirname + '/../../data/account/users.json', 'ascii', function(err, file) {
							// handleError('Could not open file: %s', err);
							self.saveDocuments(user, JSON.parse(file));
						});
					});




					// loading default users
					// quadrant.remove(function (err, users) {
					// 	if (err) { return handleError(err); }



					// 	fs.readdir(__dirname + '/../../data/generateMapJSON/data', function(err, files) {
					// 		if(err) {
					// 			throw err;
					// 		}

					// 		// FIXME: THIS COUNT IS NOT RELIABLE!!! NEED A BETTER WAY!!!
					// 		var mapLength = 0;

					// 		files.forEach(function(file) {
					// 			if(file.match(isJson)) {

					// 				fs.readFile(__dirname + '/../../data/generateMapJSON/data/' + file, 'ascii', function(err, file) {
					// 					if(err) {
					// 						console.error("Could not open file: %s", err);
					// 						process.exit(1);
					// 						throw err;
					// 					}
					// 					mapArray.push(JSON.parse(file));
					// 					quadrant.create([JSON.parse(file)], function(err) {
					// 						if(err) { return handleError(err); }
					// 						// quadrant.find(function (err, quadrants) {
					// 						// 	if (err) { return handleError(err); }
					// 						// 	console.log(quadrants);
					// 						// 	consoleOutput += quadrants;
					// 						// });
					// 						console.log('CS: '.blue + 'Importing map data file into mongodb: '.green + file.substr(0,50).yellow.underline + '...'.yellow.underline);
					// 					});
					// 					// FIXME: THIS COUNT IS NOT RELIABLE!!! NEED A BETTER WAY!!!
					// 					mapLength += 1;
					// 					// console.log(mapLength);
					// 					if(mapLength === 50) {
					// 						res.render('startup.hbs', {
					// 							title: 'STARTUP',
					// 							consoleOutput: consoleOutput
					// 						});
					// 					}
					// 				});
					// 			}
					// 		});
					// 	});




					// 	// fs.readFile(__dirname + '/../../data/map/quadrant0.json', 'ascii', function(err, file) {
					// 	// 	if(err) {
					// 	// 		console.error("Could not open file: %s", err);
					// 	// 		process.exit(1);
					// 	// 		throw err;
					// 	// 	}
					// 	// 	quadrant.create([JSON.parse(file)], function(err) {
					// 	// 		if (err) { return handleError(err); }
					// 	// 		quadrant.find(function (err, quadrants) {
					// 	// 			if (err) { return handleError(err); }
					// 	// 			console.log(quadrants);
					// 	// 			consoleOutput += quadrants;

					// 	// 			res.render('startup.hbs', {
					// 	// 				title: 'STARTUP',
					// 	// 				consoleOutput: consoleOutput
					// 	// 			});
					// 	// 		});
					// 	// 	});
					// 	// });
					// });


					self.dropCollection('tiles', function() {

						var i,
						tileMapArray = [],
						arrayLength;

						fs.readFile(__dirname + '/../../data/generateMapJSON/data/tiles/world.json', 'ascii', function(err, file) {
							if(err) {
								console.error("Could not open file: %s", err);
								process.exit(1);
								throw err;
							}
							tileMapArray.push(JSON.parse(file));
							arrayLength = tileMapArray[0].length;
							for(i = 0; i < arrayLength; i++) {
								if(i === arrayLength - 1) {
									self.saveDocuments(tile, tileMapArray[0][i], arrayLength);
								} else {
									self.saveDocuments(tile, tileMapArray[0][i], false);
								}
							}
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

	},

	dropCollection: function(collection, callback) {
		var dbCollections = self.service.db.collections;
		dbCollections[collection].drop(function(err) {
			if(err) {
				console.error('  Could not drop database collection: %s  '.yellow.inverse, err);
				// process.exit(1);
				// throw err;
			} else {
				console.log('CS: '.blue + 'Database collection dropped: '.magenta + collection.yellow.underline);
			}
			callback();
		});
	},

	saveDocuments: function(model, documents, count, callback) {
		var collectionName = model.collection.collection.collectionName;
		if(typeof count === 'function') {
			callback = count;
		}
		model.create(documents, function(err) {
			if(err) {
				console.error('  Could not parse and create documents/JSON file: %s  '.yellow.inverse, err);
				// process.exit(1);
				// throw err;
			} else {
				// // do some finding and logging here to validate data was pushed???
				// user.find(function (err, users) {
				// 	// handleError('Could not find document: %s', err);
				// 	// if (err) { return handleError(err); }
					
				// 	console.log(users);
				// 	consoleOutput += users;

				// 	// res.render('startup.hbs', {
				// 	// 	title: 'STARTUP',
				// 	// 	consoleOutput: consoleOutput
				// 	// });
				// });

				if(typeof count === 'number') {
					console.log('CS: '.blue + String(count).magenta + ' ' + collectionName.yellow.underline + ' document(s) created and saved to database.'.magenta);
				} else if (typeof count === 'undefined') {
					console.log('CS: '.blue + collectionName.yellow.underline + ' document(s) created and saved to database.'.magenta);
				}
			}
			if(typeof callback === 'function') {
				callback();
			}
		});
	}

};