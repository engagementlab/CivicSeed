module.exports = function(mongoose, db, Schema, ObjectId) {

	var gameSchema = new Schema({
		players: Number,
		tilesColored: Number,
		seedsDropped: Number,
		seedsDroppedGoal: Number,
		state: Number,
		levelQuestion: [String],
		leaderboard: [{
			name: String,
			count: Number
		}],
		levelNames: [String],
		resourceCount: [Number]
	});

	var GameModel = db.model('Game', gameSchema, 'game');

	return GameModel;

};