module.exports = function(mongoose, db, Schema, ObjectId) {

	var LevelSchema = new Schema({
		// name: String,
		// password: String,
		// email: String,
		// type: String
	});

	//the third param specifies an exact collection to look for in the DB
	var LevelModel = db.model('Level', LevelSchema, 'levels');

	return LevelModel;

};