module.exports = function(mongoose, db, Schema, ObjectId) {

	var ChatSchema = new Schema({
		id: String,
		who: String,
		what: String,
		when: Date,
		instanceName: String
	});

	//the third param specifies an exact collection to look for in the DB
	var chatModel = db.model('Chat', ChatSchema, 'chat');

	return chatModel;

};