module.exports.global = [
{
	id: '1150',
	name: 'Ricky Bobby',
	level: 1,
	spriteMap: [{
		x: 0,
		y: 192
	}, {
		x: 32,
		y: 192
	}, {
		x: 64,
		y: 192
	}, {
		x: 96,
		y: 192
	}],
	dialog: {
		random: ['Can\'t touch this!', 'Hammertime!', 'Pop pop!', 'I wanna dance with somebody!'],
		prompts: ['Hi there! Thanks for pitching in around here. I have a resource that might come in handy. Wanna see it?','Don\'t get greedy now ya hear.','I\’ll give the resource to you if you can answer this question:'],
		questions: ['What did the student say was his motivation for joining Jumpstart?','What did the student say was his motivation for joining Jumpstart?'],
		answers: ['Tyrannosaurus Wrecks!','second answer'],
		responses: ['you are so smaht','ouch, laters.']

	},
	resource: {
		kind: 'article',
		// url: 'http://75eea06f1054d4744d1f-d2e02d108aac5382b47661a6ff656abe.r46.cf2.rackcdn.com/446.html',
		url: '/articles/446.html'
	}
}, 
{
	id: '872',
	name: 'Wizard',
	level: 2,
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
		random: ['I say stuff not if I am not in your current level.'],
		prompts: ['Check out this resource.', 'I already gave you something.','If you answer this, I will give you a medal.'],
		questions: ['Who are you?','What am I?'],
		answers: ['player','npc'],
		responses: ['You got it right. Take this medal.','Wrong. Leave me alone.']
	},
	resource: {
		kind: 'article',
		//url: 'http://75eea06f1054d4744d1f-d2e02d108aac5382b47661a6ff656abe.r46.cf2.rackcdn.com/7283.html'
		url: '/articles/7283.html'
	}
}
];