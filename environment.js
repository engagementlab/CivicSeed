module.exports.appName = "Express template",
module.exports.db = {
	URL: 'mongodb://localhost:27017/template_development'
}

// // Database (WE SHOULD FIGURE OUT DEV VERSUS STAGING VERSUS LIVE)
// mongoose.connect('mongodb://localhost/civic_dev_db');
// var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

// mongoose.connect('mongodb://root:root@ds033767.mongolab.com:33767/civicseeddev');
// var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

// var Person = new Schema({
// 	author: ObjectId,
// 	title: String,
// 	body: String,
// 	date: Date
// });