module.exports.global = [{
	id: '436',
	spriteMap: [{
		x: 8,
		y: 2
	}, {
		x: 8,
		y: 2
	}],
	name: 'Gnome',
	role: 'gnome',
	attributes: {},
	dialog: {
		intro: ['I\'m the Gnome.', 'I can help you out.', 'If you solve these riddles, you can become a master gardner.'],
		random: ['I\'m sure you believe everything you\'re saying.', 'If you believed something different, you wouldn\'t be sitting where you\'re sitting.', 'Stability means we run it.']
	}
}, 
{
	name: 'Civic Gardener',
	role: 'gardener',
	id: '446',
	spriteMap: [{
		x: 0,
		y: 0
	}],
	attributes: {},
	dialog: {
		intro: ['I don\'t say much to start with, but I try.'],
		random: ['I see you\'re back already!', 'I\'m just practicing planting seeds. You should try it too.']
	}
},
{
	name: 'Wizard',
	role: 'wizard',
	id: '7283',
	spriteMap: [{
		x: 0,
		y: 64
	}],
	attributes: {},
	dialog: {
		intro: ['What\'s up brah?'],
		random: ['Bring me a shrubbery!', 'The answer is 42.']
	}
}
];