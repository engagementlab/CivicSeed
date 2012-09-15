module.exports = function(mongoose, db, Schema, ObjectId) {

	// var schema = new Schema({
	// 	name:    String,
	// 	binary:  Buffer,
	// 	living:  Boolean,
	// 	updated: { type: Date, default: Date.now }
	// 	age:     { type: Number, min: 18, max: 65 }
	// 	mixed:   Schema.Types.Mixed,
	// 	_someId: Schema.Types.ObjectId,
	// 	array:      [],
	// 	ofString:   [String],
	// 	ofNumber:   [Number],
	// 	ofDates:    [Date],
	// 	ofBuffer:   [Buffer],
	// 	ofBoolean:  [Boolean],
	// 	ofMixed:    [Schema.Types.Mixed],
	// 	ofObjectId: [Schema.Types.ObjectId],
	// 	nested: {
	// 		stuff: { type: String, lowercase: true, trim: true }
	// 	}
	// });

	var npcSchema = new Schema({
		id: Number,
		spriteMap: {},
		name: String,
		role: String,
		attributes: {},
		dialog: {
			intro: [],
			random: []
		}

	});

	// NOT SURE HOW THIS IS GOING TO WORK YET...
	var gnomeSchema = new Schema({
		name: String,
		role: String
	});

	//the third param specifies an exact collection to look for in the DB
	var NpcModel = db.model('npc', npcSchema, 'npcs');
	var GnomeModel = db.model('gnome', gnomeSchema, 'gnomes');

	return {
		NpcModel: NpcModel,
		GnomeModel: GnomeModel
	};

};