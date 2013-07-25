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
	},

	authenticate: function(email, password) {
		//console.log('client: account.authenticate');
		ss.rpc('shared.account.authenticate', email, password, function(authenticated) {
			// console.log(authenticated);
			if(authenticated) {
				sessionStorage.setItem('userId', authenticated.id);
				sessionStorage.setItem('userFirstName', authenticated.firstName);
				sessionStorage.setItem('userLastName', authenticated.lastName);
				sessionStorage.setItem('userEmail', authenticated.email);
				sessionStorage.setItem('userRole', authenticated.role);
				sessionStorage.setItem('isPlaying', authenticated.isPlaying);
				sessionStorage.setItem('profileLink', authenticated.profileLink);
				if(!authenticated.profileSetup) {
					//send them to setup their profile info
					Davis.location.assign('/change-info');
				} else if(!authenticated.gameStarted) {
					//send them to watch the intro video
					Davis.location.assign('/introduction');
				} else {
					//send them to their profile
					Davis.location.assign('/profiles/' + authenticated.profileLink);
				}
			} else {
				apprise('Incorrect email/password pair.');
				// handle the fact that it isn't authenticating...
				// console.log('it\'s not authentic!');
			}
		});
	},

	deAuthenticate: function() {
		// ss.rpc('shared.account.deAuthenticate', function(deAuthenticate) { console.log(deAuthenticate); });
	 	ss.rpc('shared.account.deAuthenticate', function(deAuthenticate) {
			// console.log(deAuthenticate);
			// console.log('before: ', sessionStorage);
			sessionStorage.removeItem('userId');
			sessionStorage.removeItem('userFirstName');
			sessionStorage.removeItem('userLastName');
			sessionStorage.removeItem('userEmail');
			sessionStorage.removeItem('userRole');
			sessionStorage.removeItem('isPlaying');
			sessionStorage.removeItem('profileLink');
			// console.log('after: ', sessionStorage);
			if(deAuthenticate) {
				Davis.location.assign('/');
				// console.log('Logging out...');
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