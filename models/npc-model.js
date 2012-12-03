module.exports = function(mongoose, db, Schema, ObjectId) {

	var npcSchema = new Schema({
		id: Number,
		name: String,
		level: Number,
		spriteY: Number,
		dialog: {
			random: [String],
			prompts: [String]
		}
	});

	var NpcModel = db.model('npc', npcSchema, 'npcs');

	return NpcModel;

};