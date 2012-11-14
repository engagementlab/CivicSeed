module.exports = function(mongoose, db, Schema, ObjectId) {

	var npcSchema = new Schema({
		id: Number,
		name: String,
		level: Number,
		spriteMap: [{
			x: Number,
			y: Number
		}],
		dialog: {
			random: [String],
			prompts: [String],
			questions: [String],
			answers: [String],
			responses: [String]
		},
		resource: {
			kind: String,
			url: String
		}
	});

	var NpcModel = db.model('npc', npcSchema, 'npcs');

	return NpcModel;

};