var rootDir = process.cwd(),
	config = require(rootDir + '/config');

var self = exports.actions = function(req, res, ss) {

	// req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	return {

		init: function() {

			res({
				VERSION: config.get('VERSION'),
				ENVIRONMENT: require(rootDir + '/bin/server').get('env')
			});

		}

	};

};