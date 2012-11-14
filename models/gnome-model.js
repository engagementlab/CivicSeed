module.exports = function(mongoose, db, Schema, ObjectId) {

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

	var GnomeModel = db.model('gnome', gnomeSchema, 'gnomes');

	return GnomeModel;

};