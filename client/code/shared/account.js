// private handlers
var _timer;
var _logoutCountDown = function(seconds, callback) {
	if(seconds > 0) {
		// console.log(seconds);
		$('.appriseOuter .countdown').html(seconds);
		seconds -= 1;
		_timer = setTimeout(function() { _logoutCountDown(seconds, callback); }, 1000);
	} else {
		clearTimeout(_timer);
		$('.appriseOuter .countdown').html(seconds);
		// console.log('ended countdown');
		callback();
	}
};

// public handlers
var $account = module.exports = {

	accountHandlers: function() {
		var $body = $(document.body);
		$body.on('submit', '#loginForm', function() {
			var email = document.getElementById('username').value,
				password = document.getElementById('password').value;
			$account.authenticate(email, password);
			return false;
		});
		$body.on('click', '.signOut', function() {
			//if the user is playing the game? be sure to save their progress?
			// console.log('look here dummy', sessionStorage.isPlaying);
			if(sessionStorage.isPlaying === 'true') {
				$game.$player.exitAndSave(function() {
					$account.deAuthenticate();
				});
			} else {
				$account.deAuthenticate();
			}
			return false;
		});
		$body.on('submit', '#remindMeForm', function() {
			var email = document.getElementById('username').value;
			ss.rpc('shared.account.remindMeMyPassword', email, function(response) {
				if(response) {
					$('#message').removeClass('error').text('A reminder email was successfully sent to you! ✔');
				} else {
					$('#message').addClass('error').text('There was an error. Please enter the correct email.');
				}
			});
			return false;
		});
		$body.on('submit', '#contactUs', function() {
			var email = document.getElementById('username').value,
				problem = document.getElementById('problem').value;
			ss.rpc('shared.account.sendProblem', email, problem, function(response) {
				if(response) {
					$('#message').removeClass('error').text('Thanks! We\'ll get on it right away.');
				} else {
					$('#message').addClass('error').text('There was an error. Email civicseed@gmail.com directly please.');
				}
			});
			return false;
		});
		$body.on('submit', '#changeInfoForm', function() {
			var first = document.getElementById('firstname').value.trim(),
				last = document.getElementById('lastname').value.trim(),
				school = document.getElementById('school').value.trim();

			var firstCheck = /^[a-zA-Z]*$/.test(first),
				secondCheck = /^[a-zA-Z]*$/.test(last);
			var info = {
				first: first,
				last: last,
				school: school
			};
			if(firstCheck && secondCheck) {
				ss.rpc('shared.account.changeInfo', info, function(response) {
					if(response) {
						sessionStorage.setItem('userFirstName', response.firstName);
						sessionStorage.setItem('userLastName', response.lastName);
						Davis.location.assign('/introduction');
					}
					else {
						$('#message').addClass('error').text('There was an error. Please panic.');
					}
				});
			} else {
				apprise('only letters and no spaces please.');
			}
			return false;
		});
		$body.on('click', '#startGame', function() {
			ss.rpc('shared.account.startGame');
		});


		// // socket events for authentication
		// ss.event.on('queryUserSession', function(message) {
		// 	apprise(message);
		// 	console.log(message);
		// });


		ss.event.on('verifySession', function(req) {
			apprise(req.message, { verify: true, textNo: 'Sign Out' }, function(response) {
				clearTimeout(_timer);
				if(response) {
					// console.log('Okay! Stay active!', req.requestingUserId);
					ss.rpc('shared.account.denyNewSession', req.requestingUserId);
				} else {
				// TODO: look at $game.$player.exitAndSave(function() { function...
				// DO THIS!!!

					console.log('booting the THIS user and logging OTHER USER in...', req.requestingUserId);
					// make sure to sign out first
					$account.deAuthenticate(function(deAuthenticate) {
						console.log(deAuthenticate);
						ss.rpc('shared.account.approveNewSession', req.requestingUserId, function() {



						});
					});
				}
			});
			_logoutCountDown(req.countdown, function() {
				console.log('booting the THIS user and logging OTHER USER in...', req.requestingUserId);
				$('#aOverlay').remove();
				$('.appriseOuter').remove();
				// ss.rpc('shared.account.allowSession', authenticated.sessionId, function() {
				// 	// finished
				// });
			});
		});
		ss.event.on('denyNewSession', function(message) {
			$('#aOverlay').remove();
			$('.appriseOuter').remove();
			apprise(message);
		});
		ss.event.on('approveNewSession', function(message) {
			$('#aOverlay').remove();
			$('.appriseOuter').remove();
			apprise(message);
		});

	},

	authenticate: function(email, password) {
		ss.rpc('shared.account.authenticate', email, password, function(authenticated) {
			var session;
			// console.log(authenticated);
			if(authenticated.status) {
				session = authenticated.session;
				sessionStorage.setItem('userId', session.id);
				sessionStorage.setItem('userFirstName', session.firstName);
				sessionStorage.setItem('userLastName', session.lastName);
				sessionStorage.setItem('userEmail', session.email);
				sessionStorage.setItem('userRole', session.role);
				sessionStorage.setItem('isPlaying', session.isPlaying);
				sessionStorage.setItem('profileLink', session.profileLink);
				if(!session.profileSetup) {
					//send them to setup their profile info
					Davis.location.assign('/change-info');
				} else if(!session.gameStarted) {
					//send them to watch the intro video
					Davis.location.assign('/introduction');
				} else {
					//send them to their profile
					Davis.location.assign('/profiles/' + session.profileLink);
				}
			} else {
				if(authenticated.activeSessionID) {
					apprise(authenticated.reason);
					// ss.rpc('shared.account.approveSession', authenticated.activeSessionID, function() {
					// 	// TO COME
					// });
				} else {
					apprise(authenticated.reason);
				}
			}
		});
	},

	deAuthenticate: function(callback) {
		ss.rpc('shared.account.deAuthenticate', function(deAuthenticate) {
			sessionStorage.clear();
			// if(deAuthenticate.status) { }
			// TODO: when game is compiled w/ app, should just use Davis.js
			if(Davis.location.current() === '/game') {
				window.location.href = '/';
			} else {
				Davis.location.assign('/');
			}
			if(typeof callback === 'function') {
				callback(deAuthenticate);
			}
		});
	},

	getUserSession: function(callback) {
		// console.log('getUserSession');
		// ss.rpc('shared.account.getUserSession', function(session) { console.log(session); });
		ss.rpc('shared.account.getUserSession', function(session) {
			// console.log(session);
			if(session) {
				callback(session);
			}
		});
	}

};