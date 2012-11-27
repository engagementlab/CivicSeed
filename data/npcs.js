module.exports.global = [
{
	id: '1150',
	name: 'Ricky Bobby',
	level: 1,
	spriteMap: [{
		x: 0,
		y: 64
	}, {
		x: 32,
		y: 64
	}, {
		x: 64,
		y: 64
	}, {
		x: 96,
		y: 64
	}],
	dialog: {
		random: ['Can\'t touch this!', 'Hammertime!', 'Pop pop!', 'I wanna dance with somebody!'],
		prompts: ['Hi there! Thanks for pitching in around here. I have a resource that might come in handy. Wanna see it?','Back for more huh...How about you try again?', 'I already gave you something but want to look at my resource again?']
	}
},
{
	id: '872',
	name: 'Wizard',
	level: 1,
	spriteMap: [{
		x: 0,
		y: 0
	}, {
		x: 32,
		y: 0
	}, {
		x: 64,
		y: 0
	}, {
		x: 96,
		y: 0
	}],
	dialog: {
		random: ['I say stuff not if I am not in your current level.'],
		prompts: ['Check out this resource.', 'Try again.','You already did this one.']
	}
}
];