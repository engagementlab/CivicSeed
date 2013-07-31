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

	var _setUserSession = function(user) {
		req.session.setUserId(user.id);
		req.session.firstName = user.firstName;
		req.session.lastName = user.lastName;
		req.session.email = user.email;
		req.session.role = user.role;
		req.session.game = user.game;
		req.session.gameStarted = user.gameStarted;
		req.session.profileSetup = user.profileSetup;
		req.session.isPlaying = user.isPlaying;
		req.session.profileLink = user.profileLink;
		req.session.channel.subscribe(user.game.instanceName);
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
			isPlaying: req.session.isPlaying,
			profileLink: req.session.profileLink
		};
	};

	return {

		authenticate: function(email, password) {
			console.log('**** authenticate ******');
			UserModel.findOne({ email: email } , function(err, user) {

				if(user) {
					// console.log('user.activeSessionID: '.green + String(user.activeSessionID).green);
					if(user.password === password) {
						if(user.activeSessionID) {
							// console.log(user.activeSessionID, req.sessionId);
							if(user.activeSessionID === req.sessionId) {
								// console.log('Active session matches session ID!'.green);
								res({ status: true, session: _setUserSession(user) });
								// // TODO: do we need to ALSO check if the user has already logged in???
								// if(req.session.id === user.id) {
								// 	console.log('THIS USER IS ALREADY LOGGED IN!!!'.red.inverse);
								// }
							} else {
								console.error('Active session ID does not match session ID.'.red);
								res({ status: false, reason: 'Active session ID does not match session ID.' });
								// // TODO: handle the session changeover w/ a separate RPC call
								// ss.session.store.get().get(req.sessionId, function(unknownVariable, session) {
								// 	console.log('redone'.red.inverse);
								// 	console.log(unknownVariable);
								// 	console.log(session);
								// 	console.log('redtwo'.red.inverse);
								// });
							}
						} else {
							console.log('No active session ID.');
							// make sure to save the active session to mongodb, so we can look it up again
							user.set({ activeSessionID: req.sessionId });
							user.save(function(error) {
								if(error) {
									console.error('Error saving active session ID to mongodb'.red);
									res({ status: false, reason: error });
								} else {
									// console.log('Active session ID saved to mongodb'.green);
									res({ status: true, session: _setUserSession(user) });
								}
							});
						}
					} else {
						res({ status: false, reason: 'Incorrect password.' });
					}
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
			req.session.userId = null;
			req.session.save(function(error) {
				if(error) {
					console.error('User session destroy failed!'.red)
					res({ status: false, reason: error });
				} else {
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
					isPlaying: req.session.isPlaying,
					profileLink: req.session.profileLink
				});
			} else {
				//console.log('Not authenticated . . . rerouting . . . '.yellow.inverse);
				res('NOT_AUTHENTICATED');
			}
		},

		checkGameSession: function() {
			UserModel.findById(req.session.userId, function(err, result) {
				if(!result.isPlaying) {
					result.isPlaying = true;
					result.save(function(err, okay) {
						res(err, false);
					});
				} else {
					res(err, result.isPlaying);
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