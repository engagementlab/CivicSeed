module.exports = function(mongoose, db, Schema, ObjectId) {

	var npcSchema = new Schema({
		id: Number,
		name: String,
		level: Number,
		sprite: Number,
		isHolding: Boolean,
		dialog: {
			random: [String],
			prompts: [String]
		},
		resource: {
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
		}
	});

	var NpcModel = db.model('npc', npcSchema, 'npcs');

	return NpcModel;

};