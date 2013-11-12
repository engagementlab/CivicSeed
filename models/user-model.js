module.exports = function(mongoose, db, Schema, ObjectId) {

	var UserSchema = new Schema({
		activeSessionID: String,
		gameChannel: String, // not sure what type this should be...
		firstName: String,
		lastName: String,
		school: String,
		password: String,
		email: String,
		role: String,
		profilePublic: Boolean,
		profileLink: String,
		profileSetup: Boolean,
		profileUnlocked: Boolean,
		gameStarted: Boolean,
		game: {
			instanceName: String,
			currentLevel: Number,
			position: {
				x: Number,
				y: Number
			},
			resources: [{
				answers: [String],
				attempts: Number,
				result: Boolean,
				seeded: [String],
				questionType: String,
				tagline: String,
				index: Number
			}],
			resourcesDiscovered: Number,
			inventory: [{
				name: String,
				tagline: String,
				npc: Number
			}],
			seeds: {
				regular: Number,
				draw: Number,
				dropped: Number
			},
			botanistState: Number,
			firstTime: Boolean,
			colorMap: String,
			resume: [String],
			resumeFeedback: [{
				comment: String,
				resumeIndex: Number
			}],
			seenRobot: Boolean,
			playingTime: Number,
			tilesColored: Number,
			pledges: Number,
			collaborativeChallenge: Boolean,
			skinSuit: {
				head: String,
				torso: String,
				legs: String,
				unlocked: {
					head: [String],
					torso: [String],
					legs: [String]
				}
			}
		},
		admin: {
			instances: [String]
		}
	});

	//the third param specifies an exact collection to look for in the DB
	var UserModel = db.model('User', UserSchema, 'users');

	return UserModel;
};

module.exports.createAndSaveUser = function(jsonArray) {

	console.log('model');

};