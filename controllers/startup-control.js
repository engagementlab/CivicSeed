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
						bodyClass: 'startup',
						consoleOutput: consoleOutput
					});

					// adding users to database
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
					// 						console.error('Could not open file: %s', err);
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
					// 	// 		console.error('Could not open file: %s', err);
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


					// creation and use of tiles
					self.dropCollection('tiles', function() {

						var i,
						tileMapArray = [],
						arrayLength;

						fs.readFile(__dirname + '/../../data/generateMapJSON/data/tiles/world.json', 'ascii', function(err, file) {
							if(err) {
								console.error('Could not open file: %s', err);
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


					// sandboxing for now
					(function() {

						var numberOfTiles = 20300,
						widthInTiles = 145,
						heightInTiles = 140,
						tiles = [],
						i,
						worldX,
						worldY,
						isWorldEdge,
						no,

						background,
						background2,
						foreground,
						nogo;

						for(i = 0; i < numberOfTiles; i++) {
							worldX = i % widthInTiles;
							worldY = Math.floor(i / widthInTiles);

							//calculate if the tile is on the edge of the map
							if (worldX === 0 || worldY === 0 || worldX === widthInTiles - 1 || worldY === heightInTiles - 1) {
								isWorldEdge = true;
							} else {
								isWorldEdge = false;
							}

							//
							if (localX == 0 || localX == numCols - 1 || localY == 0 || localY == numRows - 1) {
								isQuadEdge = true;
							}

							//look at the nogo array, if it is 0 then nogo = false (you CAN go)
							if (nogo[i] > 0) {
								no = true;
							} else {
								no = false;
							}

							//tile will have more things than listed here, will need to be fleshed out (see below)
							JSONObject tile = new JSONObject();
							//REPRESENTS DOCUMENT IN DB
							//REPRESENTS TILE IN DB
							tile.push('x', worldX);
							tile.push('y', worldY);
							tile.push('nogo', no);
							tile.push('isWorldEdge', isWorldEdge);

							//image refs 
							tile.push('background', background[i]);
							tile.push('background2', background2[i]);
							tile.push('foreground', foreground[i]);
							//possibly easier way to directly access tile, will be unique
							tile.push('worldIndex', i);

							//color
							//owner
							//has npc 
							//add the tile to the array
							tiles.push(tile);

						}

						// //create the file for the quadrant
						// File file = new File(dataPath('tiles') + File.separator + 'world.json');
						// // Create the data directory if it does not exist
						// file.getParentFile().mkdirs();
						// try {
						// 	// If the file already exists, it will be overwritten
						// 	FileWriter fstream = new FileWriter(file, false);
						// 	// Use this instead if you want to append the data to the file
						// 	//FileWriter fstream = new FileWriter(file, true);    
						// 	BufferedWriter out = new BufferedWriter(fstream);
						// 	// do the actual writing
						// 	tiles.write(out);
						// 	// Close the stream
						// 	out.close();
						// } catch (Exception e) {
						// 	System.err.println('Error writing the JSON file: ' + e.getMessage());
						// }

					})();









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