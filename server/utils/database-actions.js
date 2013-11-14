var rootDir = process.cwd();
var service = require(rootDir + '/service');

exports.dropCollection = function(collection, callback) {
	var dbCollections = service.db.collections;
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
};

exports.saveDocuments = function(model, documents, count, callback) {
	var collectionName = model.collection.collection.collectionName;
	if(typeof count === 'function') {
		callback = count;
	}
	model.create(documents, function(err) {
		if(err) {
			console.error('  Could not create documents: %s  '.yellow.inverse, err);
			// process.exit(1);
			// throw err;
		} else {
			// // do some finding and logging here to validate data was pushed???
			// userModel.find(function (err, users) {
			// 	// handleError('Could not find document: %s', err);
			// 	// if(err) { return handleError(err); }
				
			// 	console.log(users);
			// 	consoleOutput += users;

			// 	// res.render('admin/startup.hbs', {
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
};

exports.resetDefaultData = function(model, callback) {
	var collectionName = model.collection.collection.collectionName;
	if(collectionName === 'users') {
		model.remove({'game.instanceName': 'demo'}, function(err) {
			if(err) {
				callback(err);
			} else {
				model.remove({'game.instanceName': 'test'}, function(err) {
					if(err) {
						callback(err);
					} else {
						model.remove({'game.instanceName': 'boss'}, function(err) {
							if(err) {
								callback(err);
							} else {
								callback();
							}
						});
					}
				});
			}
		});
	} else if(collectionName === 'game' || collectionName === 'colors' || collectionName === 'chat') {
		model.remove({instanceName: 'demo'}, function(err) {
			if(err) {
				callback(err);
			} else {
				model.remove({instanceName: 'test'}, function(err) {
					if(err) {
						callback(err);
					} else {
						model.remove({instanceName: 'boss'}, function(err) {
							if(err) {
								callback(err);
							} else {
								callback();
							}
						});
					}
				});
			}
		});
	}
};

exports.saveNpcTilestate = function(model, npcData, callback) {
	var tileModel = service.useModel('tile', 'ss'),
		i = 0;

	var saveTile = function(index) {
		var npc = npcData[index];

		tileModel
			.where('mapIndex').equals(npc.index)
			.find(function (err, tiles) {
				if(err) {
					callback(err);
				}
				var tile = tiles[0];
				tile.tileState = npc.index;
				tile.save(function(err,suc) {
					index++;
					if(index < npcData.length) {
						saveTile(index);
					} else {
						callback();
					}
				});
			});
	};
	saveTile(i);
};