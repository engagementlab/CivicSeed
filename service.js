var rootDir = process.cwd(),
config = require(rootDir + '/config'),
mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var self = module.exports = {

	db: null,
	mongooseConnected: (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2),

	connectMongoose: function(app, callback) {
		console.log('\n\n   * * * * * * * * * * * *   Starting Database Services and Loading Predefined Data   * * * * * * * * * * * *   \n\n'.yellow);
		// connect to database
		if(!self.mongooseConnected) {
			self.db = mongoose.createConnection(config.get('MONGO_URL'));
			self.db.on('error', console.error.bind(console, '  CONNECTION ERROR: '.red.inverse));
			self.db.once('open', function () {
				console.log('CS:'.blue + ' Database: connection to '.green + app.get('env'));
				if(typeof callback !== 'undefined') {
					callback({ mongooseDb: self.db });
				}
			});
		}
	},

	connectRedis: function(callback) {
		// var client = redis.createClient(9098, 'cowfish.redistogo.com');
		// client.auth('[...pw...]', function (err) {
		// 	if (err) { throw err; }
		// 	// You are now connected to your redis.
		// });
	},

	useModel: function(modelName, state) {
		if(state === 'preload') {
			console.log('CS: '.blue + 'Initializing database by using model '.green + modelName.yellow.underline);
		} else if(state === 'ss') {
			console.log('CS: '.blue + 'Importing model '.magenta + modelName.yellow.underline + ' into socket stream RPC.'.magenta);
		} else {
			console.log('CS: '.blue + 'Import model '.blue + modelName.yellow.underline + ' into following controller: '.blue);
		}
		return require(rootDir + '/models/' + modelName + '-model')(mongoose, self.db, Schema, ObjectId);
	},

	useModule: function (moduleName, state) {
		return require(rootDir + '/modules/' + moduleName);
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