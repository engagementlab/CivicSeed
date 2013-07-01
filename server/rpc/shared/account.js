var rootDir = process.cwd(),
	emailUtil = require(rootDir + '/server/utils/email'),
	service = require(rootDir + '/service'),
	UserModel = service.useModel('user'),
	singleHtml;

var html = '<h2>Password reminder for #{firstName}</h2>';
html += '<p style="color:red;">Someone is requesting access to your account. ';
html += 'If you did not request this information, you can ignore and delete this email.</p>';
html += '<p>Your username is: &ldquo;<strong>#{email}</strong>&rdquo; ✔</p>';
html += '<p>Your password is: &ldquo;<strong>#{password}</strong>&rdquo; ✔</p>';

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	return {

		authenticate: function(email, password) {
			console.log('**** authenticate ******');
			UserModel.findOne({ email: email } , function(err, user) {
				if(user) {
					if(user.password === password) {
						req.session.setUserId(user.id);
						req.session.firstName = user.firstName;
						req.session.lastName = user.lastName;
						req.session.email = user.email;
						req.session.role = user.role;
						req.session.game = user.game;
						req.session.gameStarted = user.gameStarted;
						req.session.profileSetup = user.profileSetup;
						req.session.isPlaying = user.isPlaying;
						// if(!user.isPlaying) {}
						req.session.channel.subscribe(user.game.instanceName);

						// req.session.gameChannel = channel....
						req.session.save();
						res(true);
					} else {
						res(false);
					}
				} else {
					res(false);
				}

			});

		},

		deAuthenticate: function() {
			// console.log(req.session.firstName, req.session.email, req.session.role, req.session.gameChannel, req.session.userId);
			console.log('****** deAuthenticate ******');
			req.session.channel.reset();
			req.session.setUserId(null);
			req.session.firstName = null;
			req.session.lastName = null;
			req.session.email = null;
			req.session.role = null;
			req.session.game = null;
			req.session.gameStarted = null;
			req.session.profileSetup = null;
			req.session.isPlaying = null;
			req.session.save();
			res(true);
		},

		getUserSession: function() {
			//console.log('**** getUserSession ******');
			if(req.session.userId) {
				res({
					id: req.session.userId,
					firstName: req.session.firstName,
					lastName: req.session.lastName,
					email: req.session.email,
					role: req.session.role,
					game: req.session.game,
					gameStarted: req.session.gameStarted,
					profileSetup: req.session.profileSetup,
					isPlaying: req.session.isPlaying
				});
			} else {
				//console.log('Not authenticated . . . rerouting . . . '.yellow.inverse);
				res('NOT_AUTHENTICATED');
			}
		},

		checkGameSession: function() {
			UserModel
				.findById(req.session.userId, function(err,result) {
					if(!result.isPlaying) {
						result.isPlaying = true;
						result.save(function(err,okay) {
							res(err,false);
						});
					} else {
						res(err,result.isPlaying);
					}
				});
		},

		remindMeMyPassword: function(email) {
			UserModel.findOne({ email: email } , function(err, user) {
				if(!err && user) {
					// TODO: validate email before sending
					singleHtml = html.replace('#{firstName}', user.firstName);
					singleHtml = singleHtml.replace('#{email}', user.email);
					singleHtml = singleHtml.replace('#{password}', user.password);
					emailUtil.openEmailConnection();
					emailUtil.sendEmail('Password reminder from Civic Seed (Working Test 1) ✔', singleHtml, user.email);
					// TODO: close connection on *** CALLBACK ***
					emailUtil.closeEmailConnection();
					res(true);
				} else {
					res(false);
				}
			});
		},

		sendProblem: function(email, problem) {
			var problemHTML = '<h2>BUG! ahhhhh!</h2>';
				problemHTML += '<p>User: ' + email + '</p>';
				problemHTML += '<p>Problem: ' + problem + '</p>';
				emailUtil.openEmailConnection();
				emailUtil.sendEmail('User submitted issue', problemHTML, 'russellgoldenberg@gmail.com');
				// TODO: close connection on *** CALLBACK ***
				emailUtil.closeEmailConnection();
				res(true);
		},

		changeInfo: function(info) {
			UserModel.findOne({ email: req.session.email } , function(err, user) {
				if(!err && user) {
					user.set({
						firstName: info.first,
						lastName: info.last,
						school: info.school,
						profileSetup: true
					});
					user.save(function(err,suc) {
						if(!err && suc) {
							req.session.firstName = info.first;
							req.session.lastName = info.last;
							req.session.save();
							res({firstName: info.first, lastName: info.last});
						}
						else {
							res(false);
						}
					});
				} else {
					res(false);
				}
			});
		},

		startGame: function() {
			UserModel.findOne({ email: req.session.email } , function(err, user) {
				if(err) {

				} else if(user) {
					user.set({
						gameStarted: true
					});
					user.save(function(err,suc) {
						res(true);
					});
				}
			});
		}

	};

}