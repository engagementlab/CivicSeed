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

	// NOT SURE HOW THIS IS GOING TO WORK YET...
	var gnomeSchema = new Schema({
		id: Number,
		name: String,
		level: Number,
		spriteMap: [{
			x: Number,
			y: Number
		}],
		dialog: {
			intro: [String],
			random: [String],
			question: [String],
			answer: [String]
		}
	});

	//the third param specifies an exact collection to look for in the DB
	var NpcModel = db.model('npc', npcSchema, 'npcs');
	var GnomeModel = db.model('gnome', gnomeSchema, 'gnomes');

	return {
		NpcModel: NpcModel,
		GnomeModel: GnomeModel
	};

};