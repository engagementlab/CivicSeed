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
var _bootUser = function(userId) {
	$('.appriseOverlay').remove();
	$('.appriseOuter').remove();
	console.log('Booting THIS user and allowing OTHER USER.', userId);
	// make sure to sign out first
	$game.exitGame(function() {
		$account.deAuthenticate(function(deAuthenticate) {
			ss.rpc('shared.account.approveNewSession', userId);
		});
	});
};

// public handlers
var $account = module.exports = {

	accountHandlers: function() {
		var $body = $(document.body);
		$body.on('submit', '#login-form', function() {
			var email = document.getElementById('username').value.toLowerCase(),
				password = document.getElementById('password').value;
			$account.authenticate(email, password);
			return false;
		});
		$body.on('click', '.dropdown-sign-out', function (e) {
			e.preventDefault();
			if(sessionStorage.isPlaying === 'true') {
				$game.exitGame(function() {
					$account.deAuthenticate();
				});
			} else {
				$account.deAuthenticate();
			}
			return false;
		});
		$body.on('submit', '#password-reminder-form', function() {
			var email = document.getElementById('username').value.toLowerCase();
			ss.rpc('shared.account.remindMeMyPassword', email, function(response) {
				if(response) {
					$('#username').val('');
					$('.server-response').removeClass('error').text('A reminder email was successfully sent to you! ✔');
				} else {
					$('.server-response').addClass('error').text('There was an error. Please enter the correct email.');
				}
			});
			return false;
		});
		$body.on('submit', '#contact-form', function() {
			var email   = document.getElementById('email').value,
					message = document.getElementById('message').value;
			ss.rpc('shared.account.sendMessage', email, message, function (response) {
				if (response) {
					$('.server-response').removeClass('error').text('We got it! Thanks!');
				} else {
					$('.server-response').addClass('error').text('There was an error. Email civicseed@gmail.com directly please.');
				}
			});
			return false;
		});
		$body.on('submit', '#change-info-form', function() {
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
						$('.server-response').addClass('error').text('There was an error. Please panic.');
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

		ss.event.on('verifyGameStatus', function(req) {
			var message;
			if(sessionStorage.getItem('isPlaying')) {
				message = 'Are you still there? Signing out in <strong class="countdown">' + req.countdown + '</strong> seconds.';
				apprise(message, { verify: true, textNo: 'Sign Out' }, function(response) {
					clearTimeout(_timer);
					if(response) {
						console.log('Okay! Stay active!', req.userId);
						ss.rpc('shared.account.denyNewSession', {
							userId: req.userId,
							profileLink: req.profileLink
						});
					} else {
						_bootUser(req.userId);
					}
				});
				_logoutCountDown(req.countdown, function() {
					_bootUser(req.userId);
				});
			} else {
				message = 'There is an active game with your creds. Please wait while we check it.<br>This may take a few seconds (<strong class="countdown">' + req.countdown + '</strong>).\
					<p>(If you think there is a problem, please use the Contact Us link to tell the admin.)</p>';
				apprise(message);
				//hack to prevent ok button from showing up so user has to wait countdown
				//so it doesn't say try starting game and showing error message
				$('.appriseInner .aButtons').remove();
				_logoutCountDown(req.countdown + 5, function() {
					$('.appriseOverlay').remove();
					$('.appriseOuter').remove();
					ss.rpc('shared.account.setActiveSessionId', req.userId);
					sessionStorage.setItem('isPlaying', true);
					$game.kickOffGame();
				});
			}
		});

		ss.event.on('inactiveGameRedirect', function(req) {
			Davis.location.assign('/profiles/' + req.profileLink);
		});

		ss.event.on('denyNewSession', function(req) {
			if(Davis.location.current() === '/game') {
				clearTimeout(_timer);
				if(!sessionStorage.getItem('isPlaying')) {
					Davis.location.assign('/profiles/' + req.profileLink);
					$('.appriseOverlay').remove();
					$('.appriseOuter').remove();
					apprise('Game access denied (possibly already logged in). Contact Admin if you think you should have access.');
				}
			}
		});
		ss.event.on('approveNewSession', function(userId) {
			clearTimeout(_timer);
			if(Davis.location.current() === '/game') {
				ss.rpc('shared.account.setActiveSessionId', userId);
				$('.appriseOverlay').remove();
				$('.appriseOuter').remove();
				sessionStorage.setItem('isPlaying', true);
				$game.kickOffGame();
			}
		});
	},

	authenticate: function(email, password) {
		ss.rpc('shared.account.authenticate', email, password, function(response) {
			var session;
			// console.log(response);
			if(response.status) {
				session = response.session;
				sessionStorage.setItem('userId', session.id);
				sessionStorage.setItem('userFirstName', session.firstName);
				sessionStorage.setItem('userLastName', session.lastName);
				sessionStorage.setItem('userEmail', session.email);
				sessionStorage.setItem('userRole', session.role);
				sessionStorage.setItem('profileLink', session.profileLink);
				if(session.role === 'superadmin' || session.role === 'admin') {
					// send them to admin
					Davis.location.assign('/admin');
				} else if(!session.profileSetup) {
					// send them to setup their profile info
					Davis.location.assign('/change-info');
				} else if(!session.gameStarted) {
					// send them to watch the intro video
					Davis.location.assign('/introduction');
				} else {
					// send them to their profile
					Davis.location.assign('/profiles/' + session.profileLink);
				}
			} else {
				apprise(response.reason);
			}
		});
	},

	deAuthenticate: function(callback) {
		ss.rpc('shared.account.deAuthenticate', function(deAuthenticate) {
			sessionStorage.clear();
			// if(deAuthenticate.status) { }
			Davis.location.assign('/');
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
