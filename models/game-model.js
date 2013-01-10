module.exports = function(mongoose, db, Schema, ObjectId) {

	var gameSchema = new Schema({
		players: Number,
		tilesColored: Number,
		tilesColoredGoal: Number,
		state: Number,
		levelQuestion: [String],
		leaderboard: [{
			name: String,
			count: Number
		}]
	});

	var GameModel = db.model('Game', gameSchema, 'game');

	return GameModel;

};