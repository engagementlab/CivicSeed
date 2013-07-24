module.exports.global = {
	id: 99999,
	x: 71,
	y: 74,
	name: 'The Botanist',
	spriteMap: [{
		x: 0,
		y: 0
	}],
	dialog: [{
		instructions: ['Thanks for coming to lend a hand today. As you can see, things are pretty gray. You’ll fix that by planting color seeds.', 'Once you’re done talking to me, you’ll have a seed! Plant it by clicking on the leaf icon at the bottom of your display. Try planting the seed now, then come back and talk to me.'],
		instructions2: ['Good work! But you need to plant a lot more. To fully color the world, you must work together with your peers and others in our community. Click the computer-screen icon on your display at any time to see your progress! When it reaches 100%, the world will be saved. Check it out, then come talk to me again.'],
		riddle: {
			prompts: ['There are two ways to get more seeds. As you explore Calliope, the people you meet will pose challenges and reward you with seeds. They’ll also give you bits of research that I’ve tasked them with creating. This research will help create the next generation of seed... the paintbrush seed! Here, look at this page from my note book.', 'I think you have enough pieces to make the paintbrush seed. Want to try?'],
			response: 'That\'s right! Great work! Now you’re ready to move to level 2. I’ve given you some Paintbrush Seeds so you can color the world as you see fit. Now, when you enter seed-planting mode, you will have the ability to enter Paintbrush Mode.'
		},
		hint: ['You must go to the northwest and talk to some people to collect the puzzle pieces. You can see how many pieces are available by looking at the empty spaces in your inventory.', 'Hmmm... It looks like you don\'t have enough research pieces to solve the puzzle! Go back into Brightwood Forest, in the northwest section of the world, and talk to some more people.']
	}, {
		instructions: ['To answer the second section of the enigma, journey to the town of Calliope, located in the northeast section of the world.','Level 2, Expanding Outward, is about exploring the concepts of community partnerships and specifics about Tufts host communities.','Now that you understand the importance of looking inward, it is important to learn about the basics of community engagement and discover as much as possible about the communities in which you will serve and learn.'],
		riddle: {
			prompts: ['Here, take a look at the next part of the enigma', 'It looks like you have enough pieces to solve the enigma, ready to try?'],
			response: 'Great work! Now you’re ready to move to level 3. Your Mega Seeds are now even more powerful!'
		},
		hint: ['You must go to the northeast and talk to some people to collect the puzzle pieces. You can see how many pieces are available by looking at the empty spaces in your inventory.', 'Hmmm... It looks like you don\'t have the right pieces to solve the enigma! Go back into the town of Calliope, in the northeast section of the world, and talk to some more people.']
	}, {
		instructions: ['To answer the third section of the enigma, journey to the Ranch, located in the southeast section of the world.','Working Together, is about feflecting on intercultural, social, and socio-economic identities, along with developing practical skills and common goals.','Working together successfully is dependent on building mutual trust and understanding, developing mutually beneficial goals, and having the skills needed for project implementation.'],
		riddle: {
			prompts: ['Here, take a look at the next part of the enigma', 'It looks like you have enough pieces to solve the enigma, ready to try?'],
			response: 'Great work! Now you’re ready to move to level 4. Your Mega Seeds have become more powerful than ever.'
		},
		hint: ['You must go to the southeast and talk to some people to collect the puzzle pieces. You can see how many pieces are available by looking at the empty spaces in your inventory.', 'Hmmm... It looks like you don\'t have the right pieces to solve the enigma! Go back to the Ranch, in the southeast section of the world, and talk to some more people.']
	}, {
		instructions: ['To answer the fourth section of the enigma, journey to the Port District, located in the southwest section of the world.','Level 4,  Looking Forward, is about building upon your experience, evaluating it, sustaining it, and connecting with others.','Even though you have not yet begun, it is useful to think about how you will build upon your community engagement experience to be an even more effective active citizen and create lasting positive change.'],
		riddle: {
			prompts: ['Here, take a look at the next part of the enigma', 'It looks like you have enough pieces to solve the enigma, ready to try?'],
			response: 'You did it! You solved the final piece of the enigma!'
		},
		hint: ['You must go to the southwest and talk to some people to collect the puzzle pieces. You can see how many pieces are available by looking at the empty spaces in your inventory.', 'Hmmm... It looks like you don\'t have the right pieces to solve the enigma! Go back to the Port District, in the southwest section of the world, and talk to some more people.']
	}, {
		instructions: ['Welcome to the game. I am your humble botanist.', 'We are a simple land, with creatures like you and me.', 'However, we have a constant problem where our world becomes colorless. We love color....', 'Solve my riddles and I will give you seeds to plant color.', 'LEAVE ME ALONE, ROARRRRRRR!!!!'],
		riddle: {
			prompts: ['Wanna see it?  Do you?', 'Wanna solve it? Think you are ready?'],
			response: 'ya'
		},
		hint: ['you need to gather more resources', 'you need to go talk to some citizens']
	}],
	tangram: [{
		answer: [{
			id: 'correct1',
			x: 430,
			y: 220
		}, {
			id: 'correct2',
			x: 470,
			y: 50
		}, {
			id: 'correct3',
			x: 470,
			y: 150
		}, {
			id: 'correct4',
			x: 470,
			y: 50
		}]
	}, {
		answer: [{
			id: 'correct1',
			x: 500,
			y: 240
		}, {
			id: 'correct2',
			x: 320,
			y: 160
		}, {
			id: 'correct3',
			x: 320,
			y: 360
		}, {
			id: 'correct4',
			x: 620,
			y: 360
		}, {
			id: 'correct5',
			x: 420,
			y: 120
		}]
	}, {
		answer: [{
			id: 'correct1',
			x: 420,
			y: 110
		}, {
			id: 'correct2',
			x: 320,
			y: 110
		}, {
			id: 'correct3',
			x: 320,
			y: 210
		}, {
			id: 'correct4',
			x: 380,
			y: 210
		}, {
			id: 'correct5',
			x: 480,
			y: 280
		}, {
			id: 'correct6',
			x: 320,
			y: 110
		}]
	}, {
		answer: [{
			id: 'correct1',
			x: 470,
			y: 140
		}, {
			id: 'correct2',
			x: 470,
			y: 360
		}, {
			id: 'correct3',
			x: 470,
			y: 180
		}, {
			id: 'correct4',
			x: 470,
			y: 180
		}, {
			id: 'correct5',
			x: 470,
			y: 220
		}]
	}]
};