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
			$account.deAuthenticate();
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
	},

	authenticate: function(email, password) {
		// ss.rpc('shared.account.authenticate', 's', '', function(authenticated) { console.log(authenticated); });
		ss.rpc('shared.account.authenticate', email, password, function(authenticated) {
			if(authenticated) {
				// console.log(authenticated);
				location.href = '/game';
			} else {
				// handle the fact that it isn't authenticating...
				// console.log('it\'s not authentic!');
			}
		});
	},

	deAuthenticate: function() {
		// ss.rpc('shared.account.deAuthenticate', function(deAuthenticate) { console.log(deAuthenticate); });
		ss.rpc('shared.account.deAuthenticate', function(deAuthenticate) {
			sessionStorage.removeItem('userId');
			sessionStorage.removeItem('userName');
			sessionStorage.removeItem('userEmail');
			sessionStorage.removeItem('userRole');
			if(deAuthenticate) {
				location.href = '/';
				// console.log('Logging out...');
			}
		});
	},

	getUserSession: function() {
		// ss.rpc('shared.account.getUserSession', function(session) { console.log(session); });
		ss.rpc('shared.account.getUserSession', function(session) {
			if(session) {
				// console.log(session);
			}
		});
	}

};