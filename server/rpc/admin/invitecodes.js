var rootDir = process.cwd(),
	emailUtil = require(rootDir + '/server/utils/email'),
	xkcd = require('xkcd-pwgen'),
	service = require(rootDir + '/service'),
	userModel = service.useModel('user', 'preload'),
	emailListLength,
	emailIterator,
	singleHtml;

var html = '<h2>Why hello there, #{firstName}!</h2>';
html += '<p style="color:green;">WELCOME TO CIVIC SEED!</p>';
html += '<p><a href="http://xkcd.com/936/">xkcd</a> generated you a fine password: ';
html += '<strong>#{password}</strong></p>';
html += '<p>Your username is your email: <strong>#{email}</strong></p>';
html += '<h3 style="color:green;">You can get started by going <a href="http://testing.civicseed.org">here.</a></h3>';

// http://www.youtube.com/watch?v=nCCxpgVvQXo

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	req.use('account.authenticated');

	var colorData = require(rootDir + '/data/colors');

	var createUserAndSendInvite = function(email, i) {
		userModel.findOne({ email: email }, function(err, user) {
			var nameParts;
			if(err) {
				console.error('  Could not find \'actor\' user: %s'.red.inverse, err);
			} else {
				if(!user) {
						
					var newColor = colorData.global[i],
						tilesheetNum = i + 1;

					nameParts = email.split('@');
					user = new userModel();
					user.firstName = nameParts[0];
					user.lastName = nameParts[1];
					user.password = xkcd.generatePassword();
					user.email = email;
					user.role = 'actor';
					user.profileSetup = false;
					user.profileUnlocked = false;
					user.gameStarted = false;
					user.game = {
						currentLevel: 0,
						rank: 'nothing',
						position: {
							x: 66,
							y: 77,
							inTransit: false
						},
						colorInfo: {
							rgb: newColor,
							tilesheet: tilesheetNum
						},
						resources: [],
						inventory: [],
						seeds: {
							normal: 0,
							riddle: 0,
							special: 0,
							dropped: 0
						},
						gnomeState: 0,
						resume: [],
						seenThing: false,
						resourcesDiscovered: 0,
						playingTime: 0,
						tilesColored: 0
					};
					console.log('Created user: ' + user.email);
					user.save(function(err) {
						if(err) {
							console.error('  Could not save \'actor\' user: '.red.inverse + user.firstName.red.inverse, err);
						} else {
							singleHtml = html.replace('#{firstName}', user.firstName);
							singleHtml = singleHtml.replace('#{password}', user.password);
							singleHtml = singleHtml.replace('#{email}', user.email);
							emailUtil.sendEmail('Greetings from Civic Seed', singleHtml, user.email);
							if(i === emailListLength - 1) {
								emailUtil.closeEmailConnection();
								console.log('All emails have been sent...');
								res(true);
							}
						}
					});
				}
			}
		});
	};

	return {

		sendInvites: function(emailList) {

			if(req.session.role && (req.session.role === 'superadmin' || req.session.role === 'admin')) {
				// emailList = ['russell@engagementgamelab.org', 'russell@russellgoldenberg.com', 'russell_goldenberg@emerson.edu', 'samuel.a.liberty@gmail.com', 'thebookofrobert@gmail.com', 'langbert@gmail.com', 'arxpoetica@gmail.com'];

				console.log('\n\n   * * * * * * * * * * * *   Sending User Invites via Email   * * * * * * * * * * * *   \n\n'.yellow);
				console.log(emailList.join(', ') + '\n\n');
				emailUtil.openEmailConnection();

				emailList = emailList.slice(0, 20);
				emailListLength = emailList.length;
				for(emailIterator = 0; emailIterator < emailListLength; emailIterator++) {
					createUserAndSendInvite(emailList[emailIterator], emailIterator);
				}
			} else {
				res(false);
			}
		}

	};

};

