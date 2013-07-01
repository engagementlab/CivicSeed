module.exports = function(mongoose, db, Schema, ObjectId) {

	var botanistSchema = new Schema({
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
					response: String
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
						id: String,
						x: Number,
						y: Number
					}
				]
			}
		]

	});

	var BotanistModel = db.model('botanist', botanistSchema, 'botanists');

	return BotanistModel;

};