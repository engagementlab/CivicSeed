module.exports = function(mongoose, db, Schema, ObjectId) {

	var resourceSchema = new Schema({
		id: Number,
		kind: String,
		url: String,
		tagline: String,
		question: String,
		questionType: String,
		requiredLength: Number,
		possibleAnswers: [String],
		answer: String,
		feedbackWrong: String,
		feedbackRight: String,
		shape: {
			path: String,
			fill: String
		}
	});

	var ResourceModel = db.model('resource', resourceSchema, 'resources');

	return ResourceModel;

};