module.exports = function(mongoose, db, Schema, ObjectId) {

	var gnomeSchema = new Schema({
		id: Number,
		x: Number,
		y: Number,
		name: String,
		spriteMap: [{
			x: Number,
			y: Number
		}],
		dialog: [
			{
				instructions: [String],
				riddle: {
					sonnet: String,
					prompts: [String],
					responses: [String]
				},
				hint: [String]
			}
		],
		finale: {
			videos: [String],
			explanations: [String]
		},
		tangram: [
			{
				answer: [
					{
						id: Number,
						x: Number,
						y: Number
					}
				]
			}

		]


	});

	var GnomeModel = db.model('gnome', gnomeSchema, 'gnomes');

	return GnomeModel;

};