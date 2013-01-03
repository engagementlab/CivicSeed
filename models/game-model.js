module.exports = function(mongoose, db, Schema, ObjectId) {

	var gameSchema = new Schema({
		players: Number,
		tilesColored: Number,
		state: Number,
		messages: [{
			who: String,
			what: String
		}],
		chatLog: [{
			who: String,
			what: String,
			when: Date
		}],
		levelQuestion: [String],
		leaderboard: [String]
	});

	var GameModel = db.model('Game', gameSchema, 'game');

	return GameModel;

};