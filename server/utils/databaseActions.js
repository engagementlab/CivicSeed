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