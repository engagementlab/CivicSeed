var mongoose = require('mongoose'),
connected = (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2),
// hash = require('password-hash'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId,
useModel,
useModule,
env,
nodeEnv,
db;

module.exports.init = function(environment, callback) {

	console.log('\n\n   * * * * * * * * * * * *   Starting Database Services and Loading Predefined Data   * * * * * * * * * * * *   \n\n'.yellow)

	env = environment; // for use throughout this file
	nodeEnv = env.app.nodeEnv;

	// connect to database
	if(!connected) {
		db = mongoose.createConnection(env.database.URL);
		db.on('error', console.error.bind(console, 'connection error: '));
		db.once('open', function () {
			console.log('CS:'.blue + ' Database: connection to '.green + env.database.environment);
			
			// require models and load setup data
			// just creating some scope for easy declaration of variables
			(function() {
				var map,
				user = useModel('user', 'preload');

				if(nodeEnv === 'production') {
				} else if(nodeEnv === 'staging') {
				} else if(nodeEnv === 'testing') {
				} else if(nodeEnv === 'development') {

					// user.create([{name:'Robert',password:'temp'},], function (err) {
					// 	if(err) {

					// 	}
					// });

					// user.find(function (err, users) {
					// 	if(err) {

					// 	}
					// 	console.log(users)
					// });

				} else {
					console.log('  NODE_ENV VARIABLE CONNECTION ERROR: cannot use for preloading data   '.red.inverse);
				}

			})();

			callback();
		});
	}

};


// var hash = require('password-hash');

// exports.login = function(name, pass, callback) {
// 	UserModel.findOne({email:name},function(err,user){
// 		if(!user){
// 			return callback("you don't belong here.",null);
// 		}
// 		else {
// 			var hashedPassword = user.password;
// 			if(hash.verify(pass, hashedPassword)){
// 				return callback(null,user);
// 			}
// 			else {
// 				return  callback("wrong! try again.",null);
// 			}
// 		}
// 	});
// };


useModel = module.exports.useModel = function(modelName, state) {
	var checkConnectionExists = (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2);
	if(!checkConnectionExists) {
		db = mongoose.connect(env.database.URL);
	}
	if(state === 'preload') {
		console.log('CS: '.blue + 'Initializing database by using model '.green + modelName.yellow.underline);
	} else {
		console.log('CS: '.blue + 'Import model '.blue + modelName.yellow.underline + ' into following controller: '.blue);
	}
	return require("./models/" + modelName + '-model')(mongoose, db);
};

useModule = module.exports.useModule = function (moduleName, state) {
	return require("./modules/" + moduleName);
};