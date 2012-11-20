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
			question: String,
			answer: String,
			responses: [String]
		},
		resource: {
			kind: String,
			url: String,
			tagline: String,
			tangram: Number
		}
	});

	var NpcModel = db.model('npc', npcSchema, 'npcs');

	return NpcModel;

};