exports.init = function(callback) {

	var $body;

	// console.log('game-setup getUserSession:');
	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		// console.log(userSessionObject);
		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else {
			$body = $(document.body);

			// console.log(sessionStorage);
			if(!sessionStorage.getItem('userId')) {
				sessionStorage.setItem('userId', userSessionObject.id);
				sessionStorage.setItem('userFirstName', userSessionObject.firstName);
				sessionStorage.setItem('userLastName', userSessionObject.lastName);
				sessionStorage.setItem('userEmail', userSessionObject.email);
				sessionStorage.setItem('userRole', userSessionObject.role);
				sessionStorage.setItem('isPlaying', 'yes');
			}
			sessionStorage.setItem('isPlaying', 'yes');
			$body.append(JT['partials-navigation']());
			$body.append(JT['game-gameboard']());
			$body.append(JT['game-resourceStage']());
			$body.append(JT['game-hud']());
			callback();
		}
	});

};