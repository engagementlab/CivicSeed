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
				last = document.getElementById('lastname').value.trim();

			var firstCheck = /^[a-zA-Z]*$/.test(first),
				secondCheck = /^[a-zA-Z]*$/.test(last);
			if(firstCheck && secondCheck) {
				ss.rpc('shared.account.changeInfo', first, last, function(response) {
					if(response) {
						sessionStorage.setItem('userFirstName', response.firstName);
						sessionStorage.setItem('userLastName', response.lastName);
						location.href = '/introduction';
					}
					else {
						$('#message').addClass('error').text('There was an error. Please panic.');
					}
				});
			} else {
				alert('only letters and no spaces please.');
			}
			return false;
		});
		$body.on('click', '#startGame', function() {
			ss.rpc('shared.account.startGame');
		});
	},

	authenticate: function(email, password) {
		console.log('client: account.authenticate');
		ss.rpc('shared.account.authenticate', email, password, function(authenticated) {
			// console.log(authenticated);
			if(authenticated) {

				$account.getUserSession(function(userInfo) {
					sessionStorage.setItem('userId', userInfo.id);
					sessionStorage.setItem('userFirstName', userInfo.firstName);
					sessionStorage.setItem('userLastName', userInfo.lastName);
					sessionStorage.setItem('userEmail', userInfo.email);
					sessionStorage.setItem('userRole', userInfo.role);
					sessionStorage.setItem('isPlaying', userInfo.isPlaying);
					if(!userInfo.profileSetup) {
						//send them to setup their profile info
						location.href = '/change-info';
					}
					else if(!userInfo.gameStarted) {
						//send them to watch the intro video
						location.href = '/introduction';
					}
					else {
						//send them to their profile
						//send them to their profile page
						location.href = '/profiles/' + userInfo.firstName + '.' + userInfo.lastName;
					}
				});
			} else {
				alert('Incorrect email/password pair.');
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
			// console.log('after: ', sessionStorage);
			if(deAuthenticate) {
				location.href = '/';
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