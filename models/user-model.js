module.exports = function(mongoose) {

	// var crypto = require('crypto');
	var user = {};

	// function validatePresenceOf(value) {
	// 	return value && value.length;
	// }

	user.schema = new mongoose.Schema({
		// email: { type: String, validate: [validatePresenceOf, 'An email is required'], match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,  index: { unique: true } },
		// hashedPassword: String,
		// salt: String,
		// role: { type: String, default: 'user', enum: ['user', 'admin'] },

		username: String,
		title: String

	});






	// user.schema.pre('save', function (next) {
	// 	if (!validatePresenceOf(this.password)) {
	// 		next(new Error('Invalid password'));
	// 	} else {
	// 		next();
	// 	}
	// });

	// user.schema.virtual('password')
	// .set(function(password) {
	// 	this._password = password;
	// 	this.salt = this.makeSalt();
	// 	this.hashedPassword = this.encryptPassword(password);
	// })
	// .get(function() { return this._password; });

	// user.schema.methods.encryptPassword = function (password) {
	// 	var pass =  crypto.createHmac('sha1', this.salt).update(password).digest('hex');
	// 	return pass;
	// };

	// user.schema.methods.makeSalt = function () {
	// 	return Math.round((new Date().valueOf() * Math.random())) + '';  
	// };

	// user.schema.methods.authenticate = function (password) {
	// 	return this.encryptPassword(password) === this.hashedPassword;
	// };

	user.model = mongoose.model('User', user.schema);

	// ????
	// var user = new userModel();
	// user.username = 'Grumpy';
	// user.title = 'Old Man Coder';


	return user;



};








// // UNCOMMENT FOR TESTING:
// user.save(function(err) {
// 	if(err) {
// 		console.log('  ERROR SAVING USER  '.red.inverse);
// 		throw err;
// 	} else {
// 		console.log('User saved! Hooray!');
// 	}
// });


// // UNCOMMENT FOR TESTING:
// userModel.find(function(err, docs) {
// 	console.log(docs);
// });


// // UNCOMMENT FOR TESTING:
// var all = userModel.find(function(err, docs) {
// 	var length = docs.length;

// 	for(var i = 0; i < length; i++) {
// 		docs[i].remove(function(err) {
// 			if(err) {
// 				console.log('  ERROR REMOVING USER  '.red.inverse);
// 				throw err;
// 			} else {
// 				console.log('User saved! Hooray!');
// 			}
// 		});
// 	}
// });