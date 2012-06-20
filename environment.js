var mongoose = require('mongoose');
module.exports.appName = "Express template",
// module.exports.db = {
// 	URL: 'mongodb://localhost:27017/template_development'
// }



// // Database (WE SHOULD FIGURE OUT DEV VERSUS STAGING VERSUS LIVE)
// mongoose.connect('mongodb://localhost/civic_dev_db');
// var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://root:root@ds033767.mongolab.com:33767/civicseeddev');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var User = new Schema({
	username: String,
	title: String
});



var userModel = mongoose.model('User', User);
// var user = new userModel();

// user.username = 'Grumpy';
// user.title = 'Old Man Coder';
// user.save(function(err) {
// 	if (err) throw err;
// 	console.log('User saved! Hooray!');
// });
var all = userModel.find(function(err,docs){
	console.log(docs);
});
