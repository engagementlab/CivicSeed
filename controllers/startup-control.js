var fs = require('fs'),
userData = require('../data/users'),
tileData = require('../data/tiles');

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

			var userModel,
			quadrantModel,
			tileModel,
			mapArray = [],
			isJson = /\.json$/g,
			consoleOutput = '';

			// check for intialization of app
			// NOTE: THE VARIABLE 'initialized' CAN ONLY BE SET 'true' IN PRODUCTION OR STAGING...
			// ...THIS WAY, THE APP CAN BE (RE-)INITIALIZED MULTIPLE TIMES, IF NEEDS BE, IN DEVELOPMENT OR TESTING
			if(!initialized) {
				if(nodeEnv) {

					console.log('\n\n   * * * * * * * * * * * *   Initialization/Startup/Loading Predefined Data   * * * * * * * * * * * *   \n\n'.yellow);

					userModel = service.useModel('user', 'preload');
					// quadrantModel = service.useModel('map', 'preload');
					tileModel = service.useModel('tile', 'preload');

					res.render('startup.hbs', {
						title: 'STARTUP',
						bodyClass: 'startup',
						consoleOutput: consoleOutput
					});

					// adding users to database
					self.dropCollection('users', function() {
						self.saveDocuments(userModel, userData.global);
					});

					// creation and use of tiles
					self.dropCollection('tiles', function() {

						var i,
						tileObject = tileData.global,
						backgroundArray = tileObject.backgroundArray,
						background2Array = tileObject.background2Array,
						foregroundArray = tileObject.foregroundArray,
						nogoArray = tileObject.nogoArray,
						numberOfTiles = backgroundArray.length,
						mapTilesWidth = 145,
						mapTilesHeight = 140,
						mapX,
						mapY,
						tiles = [];

						// self.saveDocuments(tileModel, tileData.global);

						// (re)constructing tile data based on data dump from third party tool
						for(i = 0; i < numberOfTiles; i++) {
							mapX = i % mapTilesWidth;
							mapY = Math.floor(i / mapTilesWidth);

							//add the tile to the array
							tiles.push({
								x: mapX,
								y: mapY,
								nogo: (nogoArray[i] > 0) ? true : false,
								isMapEdge: (mapX === 0 || mapY === 0 || mapX === mapTilesWidth - 1 || mapY === mapTilesHeight - 1) ? true : false,
								background: backgroundArray[i],
								background2: background2Array[i],
								foreground: foregroundArray[i],
								mapIndex: i
							});

						}
						self.saveDocuments(tileModel, tiles, numberOfTiles);
						// console.log(tiles.length);
						// console.log(tiles[0]);
						// console.log(tiles[2]);
						// console.log(tiles[3]);
						// console.log(tiles[300]);

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
		// 	if(req.session) {
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
				// userModel.find(function (err, users) {
				// 	// handleError('Could not find document: %s', err);
				// 	// if(err) { return handleError(err); }
					
				// 	console.log(users);
				// 	consoleOutput += users;

				// 	// res.render('startup.hbs', {
				// 	// 	title: 'STARTUP',
				// 	// 	consoleOutput: consoleOutput
				// 	// });
				// });

				if(typeof count === 'number') {
					console.log('CS: '.blue + String(count).magenta + ' ' + collectionName.yellow.underline + ' document(s) created and saved to database.'.magenta);
				} else if(typeof count === 'undefined') {
					console.log('CS: '.blue + collectionName.yellow.underline + ' document(s) created and saved to database.'.magenta);
				}
			}
			if(typeof callback === 'function') {
				callback();
			}
		});
	}

};