module.exports = function(mongoose, db, Schema, ObjectId) {

	var gameSchema = new Schema({
		players: Number,
		tilesColored: Number,
		seedsDropped: Number,
		seedsDroppedGoal: Number,
		active: Boolean,
		bossModeUnlocked: Boolean,
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