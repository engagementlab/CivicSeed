module.exports = function(mongoose, db) {

	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var npcSchema = new Schema({
		name: String,
		role: String,
		points: {},
		hitPoints: {},
		armorClass: {},
		defenses: {},
		attacks: {},
		attributes: {
			strength: {
				muscle: Number,
				endurance: Number,
				stamina: Number
			},
			dexterity: {
				handEyeCoordination: Number,
				agility: Number,
				reflexes: Number,
				fineMotorSkills: Number,
				balance: Number,
				speed: Number
			},
			constitution: {
				physique: Number,
				toughness: Number,
				health: Number,
				resistanceToDiseaseAndPoison: Number
			},
			intelligence: {
				iq: Number,
				mnemonicAbility: Number,
				reasoning: Number,
				learningAbility: Number
			},
			wisdom: {
				enlightenment: Number,
				judgment: Number,
				wile: Number,
				willpower: Number,
				intuitiveness: Number
			},
			charisma: {
				attractiveness: Number,
				persuasiveness: Number,
				personalMagnetism: Number
			},
		}



	});

	//the third param specifies an exact collection to look for in the DB
	var npcModel = db.model('npc', npcSchema, 'npcs');

	return npcModel;

};