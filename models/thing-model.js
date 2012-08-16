module.exports = function(mongoose, db) {

	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var ThingSchema = new Schema({
		name: String,
		password: String,
		email: String,
		type: String
	});

	//the third param specifies an exact collection to look for in the DB
	var ThingModel = db.model('Thing', ThingSchema, 'things');

	return ThingModel;

};