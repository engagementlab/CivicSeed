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
			if(sessionStorage.isPlaying) {
				$game.$player.exitAndSave(function() {
					$account.deAuthenticate();
				});
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
		$body.on('submit', '#changeInfoForm', function() {
			var first = document.getElementById('firstname').value,
				last = document.getElementById('lastname').value;

			ss.rpc('shared.account.changeInfo', first, last, function(response) {
				if(response) {
					location.href = '/introduction';
				}
				else {
					$('#message').addClass('error').text('There was an error. Please panic.');
				}
			});
			return false;
		});
		$body.on('click', '#startGame', function() {
			ss.rpc('shared.account.startGame');
		});
	},

	authenticate: function(email, password) {
		console.log('authenticate');
		// ss.rpc('shared.account.authenticate', 's', '', function(authenticated) { console.log(authenticated); });
		ss.rpc('shared.account.authenticate', email, password, function(authenticated) {
			console.log(authenticated);
			if(authenticated) {

				$account.getUserSession(function(userInfo) {
					sessionStorage.setItem('userId', userInfo.id);
					sessionStorage.setItem('userFirstName', userInfo.firstName);
					sessionStorage.setItem('userLastName', userInfo.lastName);
					sessionStorage.setItem('userEmail', userInfo.email);
					sessionStorage.setItem('userRole', userInfo.role);
					sessionStorage.setItem('isPlaying', false);
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
			console.log(deAuthenticate);
			console.log('before: ', sessionStorage);
			sessionStorage.removeItem('userId');
			sessionStorage.removeItem('userFirstName');
			sessionStorage.removeItem('userLastName');
			sessionStorage.removeItem('userEmail');
			sessionStorage.removeItem('userRole');
			sessionStorage.removeItem('isPlaying');
			console.log('after: ', sessionStorage);
			if(deAuthenticate) {
				location.href = '/';
				// console.log('Logging out...');
			}
		});
	},

	getUserSession: function(callback) {
		console.log('getUserSession');
		// ss.rpc('shared.account.getUserSession', function(session) { console.log(session); });
		ss.rpc('shared.account.getUserSession', function(session) {
			console.log(session);
			if(session) {
				callback(session);
			}
		});
	}

};