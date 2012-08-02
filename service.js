var mongoose = require('mongoose'),
connected = (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2),
// hash = require('password-hash'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId,
environment;


// var environment,
// mongoose = require('mongoose');

module.exports.init = function(env) {
	environment = env; // just in case

	// connect to database
	if(!connected) {
		mongoose.connect(env.database.URL);
		console.log('CS: Database: connection to '.blue + env.database.environment);
	}
};





var hash = require('password-hash');


exports.login = function(name,pass,callback){
	UserModel.findOne({email:name},function(err,user){
		if(!user){
			return callback("you don't belong here.",null);
		}
		else{
			var hashedPassword = user.password;
			if(hash.verify(pass, hashedPassword)){
				return callback(null,user);
			}
			else{
				return  callback("wrong! try again.",null);
			}
		}
	});
};








// module.exports.useModel = function (modelName) {
// 	var checkConnectionExists = (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2);
// 	if(!checkConnectionExists) {
// 		mongoose.connect(env.db.URL);
// 	}
// 	return require("./models/" + modelName)(mongoose);
// };

// module.exports.useModule = function (moduleName) {
// 	return require("./modules/" + moduleName);
// };
