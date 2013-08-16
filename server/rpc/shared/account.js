var rootDir = process.cwd(),
	bcrypt = require('bcrypt'),
	emailUtil = require(rootDir + '/server/utils/email'),
	service = require(rootDir + '/service'),
	UserModel = service.useModel('user'),
	_countdown = 10,
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

	var _setUserSession = function(user) {
		req.session.setUserId(user.id);
		req.session.firstName = user.firstName;
		req.session.lastName = user.lastName;
		req.session.email = user.email;
		req.session.role = user.role;
		req.session.game = user.game;
		req.session.gameStarted = user.gameStarted;
		req.session.profileSetup = user.profileSetup;
		req.session.profileLink = user.profileLink;
		req.session.channel.subscribe(user.game.instanceName);
		req.session.verifyingSession = null;
		req.session.save();
		return {
			id: req.session.userId,
			firstName: req.session.firstName,
			lastName: req.session.lastName,
			email: req.session.email,
			role: req.session.role,
			game: req.session.game,
			gameStarted: req.session.gameStarted,
			profileSetup: req.session.profileSetup,
			profileLink: req.session.profileLink
		};
	};

	return {

		authenticate: function(email, password) {
			console.log('**** checking authenticate ******');
			UserModel.findOne({ email: email } , function(err, user) {
				if(user) {
					bcrypt.compare(password, user.password, function(err, authenticated) {
						if(authenticated) {
							res({ status: true, session: _setUserSession(user) });
						} else {
							res({ status: false, reason: 'Incorrect password.' });
						}
					});
				} else {
					res({ status: false, reason: 'No user exists with that email.' });
				}
			});
		},

		deAuthenticate: function() {

			console.log('****** deAuthenticate ******');
			// console.log(req.session.firstName, req.session.email, req.session.role, req.session.gameChannel, req.session.userId);

			// MONGO
			UserModel.findOne({ email: req.session.email } , function(err, user) {
				if(user) {
					user.set({ activeSessionID: null });
					user.save(function(error) {
						if(error) {
							console.log('Error making active session ID null in mongodb'.red);
						} else {
							// console.log('Active session ID made null in mongodb'.green);
						}
					});
				}
			});

			// REDIS
			// NOTE: these cannot depend on each other: REDIS and MONGO deletions have to be independent
			req.session.setUserId(null);
			req.session.save(function(error) {
				if(error) {
					console.error('User session destroy failed!'.red)
					res({ status: false, reason: error });
				} else {
					// console.error('User session destroyed!'.red)
					// console.log(req.session.firstName, req.session.email, req.session.role, req.session.gameChannel, req.session.userId);
					req.session.channel.reset();
					res({ status: true, reason: 'Session destroyed.' });
				}
			});

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
					profileLink: req.session.profileLink
				});
			} else {
				//console.log('Not authenticated . . . rerouting . . . '.yellow.inverse);
				res('NOT_AUTHENTICATED');
			}
		},

		checkGameSession: function() {
			UserModel.findById(req.session.userId, function(error, user) {
				if(error) {
					console.error('Error finding user (game) session in Mongo.'.red);
					res({
						status: false,
						reason: error
					});
				} else {
					if(user.activeSessionID) {
						console.log(user.activeSessionID, req.sessionId);

						if(user.activeSessionID === req.sessionId) {
							// NOTE: this is sort of a weird scenario -- not sure it's even needed to check it!
							console.log('Active session matches session ID -- good to go!'.green);
							res({ status: true });
						} else {
							console.error('Active session ID does not match session ID.'.red);
							res({ status: false });

							// DO SOMETHING!!!
							// if(!req.session.verifyingSession) {
								ss.publish.user(user.id, 'verifyGameStatus', {
									// status: false,
									// message: 'Are you still there? Logging out in <strong class="countdown">' + _countdown + '</strong> seconds.',
									countdown: _countdown,
									// activeSessionID: user.activeSessionID,
									// requestingUserId: req.sessionId
									// sessionId: req.sessionId
									userId: user.id
								});
							// }

							// // NOTE: important to set userId === sessionId, so we can find this NON AUTHENTICATED user later
							// // so we can log them in (or not) and actually assign them a user id
							// req.session.setUserId(req.sessionId);
							// req.session.verifyingSession = true;
							// req.session.save();

						}
					} else {
						console.log('No active session ID.');
						// make sure to save the active session to mongodb, so we can look it up again
						user.set({ activeSessionID: req.sessionId });
						user.save(function(error) {
							if(error) {
								console.error('Error saving active session ID to mongodb'.red);
								res({
									status: false,
									reason: error,
									profileLink: user.profileLink
								});
							} else {
								console.log('Active session ID saved to mongodb'.green);
								res({ status: true });
							}
						});
					}
				}
			});
		},

		denyNewSession: function(userId) {
			ss.publish.user(userId, 'denyNewSession', 'Authentication denied. There is another session/user currently logged into your account.<br>Reasons for this may be that you have given your username and password to someone else.<br>Please contact the administrator of this site if you think something is in error.');
		},

		approveNewSession: function(userId) {
			ss.publish.user(userId, 'approveNewSession', 'Authenticating...');
		},

		remindMeMyPassword: function(email) {
			UserModel.findOne({ email: email } , function(err, user) {
				if(!err && user) {
					// TODO: validate email before sending
					// TODO: don't send them their password; do password reset
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
					user.save(function(err, suc) {
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