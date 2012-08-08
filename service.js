var mongoose = require('mongoose'),
connected = (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2),
// hash = require('password-hash'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId,
env;

module.exports.init = function(environment) {
	env = environment; // for use throughout this file

	// connect to database
	if(!connected) {
		mongoose.connect(env.database.URL);
		console.log('CS: Database: connection to '.blue + env.database.environment);
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


module.exports.useModel = function(modelName) {
	var checkConnectionExists = (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2);
	if(!checkConnectionExists) {
		mongoose.connect(env.db.URL);
	}
	console.log('CS: '.blue + 'Import model '.blue + modelName.yellow.underline + ' into following controller: '.blue);
	return require("./models/" + modelName + '-model')(mongoose);
};

module.exports.useModule = function (moduleName) {
	return require("./modules/" + moduleName);
};