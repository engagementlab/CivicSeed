var rootDir = process.cwd(),
	config = require(rootDir + '/config'),
	serverHelpers = require(rootDir + '/server/utils/server-helpers'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var self = module.exports = {

	db: null,
	mongooseConnected: (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2),

	connectMongoose: function(app, callback) {
		console.log('\n\n   * * * * * * * * * * * *   Starting Database Services   * * * * * * * * * * * *   '.yellow);
		// connect to database
		if(!self.mongooseConnected) {
			self.db = mongoose.createConnection(config.get('MONGO_URL'));
			self.db.on('error', console.error.bind(console, '  CONNECTION ERROR: '.red.inverse));
			self.db.once('open', function () {
				console.log('   * * * * * * * * * * * *   MongoDB: connection to '.green + app.get('env').yellow.inverse);
				if(typeof callback === 'function') {
					callback({ mongooseDb: self.db });
				}
			});
		}
	},

	useModel: function(modelName, state) {
		if(state === 'preload') {
			console.log('CS: '.blue + 'Preloading model for SS RPC: '.green + modelName.yellow.underline);
		} else if(state === 'ss') {
			console.log('CS: '.blue + 'Importing model '.magenta + modelName.yellow.underline + ' into socket stream RPC.'.magenta);
		} else {
			console.log('CS: '.blue + 'Import model '.blue + modelName.yellow.underline + ' into following controller: '.blue);
		}
		return require(rootDir + '/models/' + modelName + '-model')(mongoose, self.db, Schema, ObjectId);
	},

	useModule: function (moduleName, state) {
		return require(rootDir + '/modules/' + moduleName);
	},

	getAndSetNetworkIp: function(callback) {
		serverHelpers.getNetworkIPs(function(err, ips) {
			if(err || !ips.length) {
				config.set('IP', 'localhost');
				console.log('   * * * * * * * * * * * *   Civic Seed:'.yellow + ' could not find network ip. Defaulting to \'localhost.\'\n\n'.red);
			} else {
				config.set('IP', ips[0]);
				console.log('   * * * * * * * * * * * *   Civic Seed:'.yellow + ' running on network ip: ' + ips[0].yellow + '\n\n');
			}
			if(typeof callback === 'function') {
				callback();
			}
		});
	}

};

















// var hash = require('password-hash');

// exports.login = function(name, pass, callback) {
// 	UserModel.findOne({email:name},function(err,user){
// 		if(!user){
// 			return callback('you don't belong here.',null);
// 		}
// 		else {
// 			var hashedPassword = user.password;
// 			if(hash.verify(pass, hashedPassword)){
// 				return callback(null,user);
// 			}
// 			else {
// 				return callback('wrong! try again.',null);
// 			}
// 		}
// 	});
// };