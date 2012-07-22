var mongoose = require('mongoose'),
// hash = require('password-hash'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId,
nodeEnv = process.env.NODE_ENV,
databaseEnv,
connectionURL;

// to run a different database, set the ALT_DB to the environment on run:
// example: 'NODE_ENV=local ALT_DB=testing nodemon app.js'
if('ALT_DB' in process.env) {
	databaseEnv = process.env.ALT_DB;
} else {
	databaseEnv = nodeEnv;
}

// configure database according to environment
// the order of configuration here is important
if(databaseEnv === 'production') {
} else if(databaseEnv === 'staging') {
} else if(databaseEnv === 'testing') {
	connectionURL = 'mongodb://root:root@ds033767.mongolab.com:33767/civicseeddev';
} else if(databaseEnv === 'local') {
	connectionURL = 'mongodb://localhost/civic_dev_db';
} else {
	console.log('  DATABASE CONNECTION INFORMATION MISSING  '.red.inverse);
}

console.log('CS: Database: connection to '.blue + databaseEnv);


// module.exports.appName = "Express template"; <--------- I don't know what this is... delete?
module.exports.db = {
	connectionURL: connectionURL
}

// connect to database
mongoose.connect(connectionURL);

var User = new Schema({
	username: String,
	title: String
});



var userModel = mongoose.model('User', User);
var user = new userModel();

user.username = 'Grumpy';
user.title = 'Old Man Coder';
console.log(user);


//UNCOMMENT FOR TESTING:
// user.save(function(err) {
// 	if(err) {
// 		console.log('  ERROR SAVING USER  '.red.inverse);
// 		throw err;
// 	} else {
// 		console.log('User saved! Hooray!');
// 	}
// });

var all = userModel.find(function(err, docs){
	console.log(docs);
});