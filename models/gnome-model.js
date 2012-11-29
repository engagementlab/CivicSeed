module.exports = function(mongoose, db, Schema, ObjectId) {

	var gnomeSchema = new Schema({
		id: Number,
		name: String,
		spriteMap: [{
			x: Number,
			y: Number
		}],
		dialog: {
			level: [{
				instruction: [String],
				riddle: {
					sonnet: String,
					prompt: [String],
					responses: [String]
				}
			}],
			finale: {
				videos: [String],
				explanations: [String]
			}
		}
	});

	var GnomeModel = db.model('gnome', gnomeSchema, 'gnomes');

	return GnomeModel;

};