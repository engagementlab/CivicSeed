(function() {

	$account = {

		init: function() {

			$account.accountHandlers();

		},

		accountHandlers: function() {
			$('#loginForm').on('submit', function() {
				var email = document.getElementById('username').value,
				password = document.getElementById('password').value;
				$account.authenticate(email, password);
				return false;
			});
		},

		authenticate: function(email, password) {
			ss.rpc('account.actions.authenticate', email, password, function(authenticated) {
				if(authenticated) {
					location.href = '/game';
				} else {
					// handle the fact that it isn't authenticating...
					console.log('it\'s not authentic!');
				}
			});
		}

	};

	$account.init();

})();