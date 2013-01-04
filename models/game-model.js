module.exports = function(mongoose, db, Schema, ObjectId) {

	var gameSchema = new Schema({
		players: Number,
		tilesColored: Number,
		state: Number,
		messages: [{
			who: String,
			what: String
		}],
		levelQuestion: [String],
		leaderboard: [{
			name: String,
			count: Number
		}]
	});

	var GameModel = db.model('Game', gameSchema, 'game');

	return GameModel;

};