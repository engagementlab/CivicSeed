exports.init = function(callback) {

	var $body;

	console.log('game-setup getUserSession:');
	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		console.log(userSessionObject);
		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else {
			//check if they are ACTUALLY playing
			ss.rpc('shared.account.checkGameSession', function(err,response) {
				// console.log('hey now', err, response);
				if(err) {

				} else {
					if(response) {
						location.href = '/profiles/' + userSessionObject.firstName + '.' + userSessionObject.lastName;
					} else {
						$body = $(document.body);

						// console.log(sessionStorage);
						if(!sessionStorage.getItem('userId')) {
							sessionStorage.setItem('userId', userSessionObject.id);
							sessionStorage.setItem('userFirstName', userSessionObject.firstName);
							sessionStorage.setItem('userLastName', userSessionObject.lastName);
							sessionStorage.setItem('userEmail', userSessionObject.email);
							sessionStorage.setItem('userRole', userSessionObject.role);
							sessionStorage.setItem('isPlaying', userSessionObject.isPlaying);
						}
						sessionStorage.setItem('isPlaying', true);
						$body.append(JT['partials-navigation']());
						$body.append(JT['game-gameboard']());
						$body.append(JT['game-resourceStage']());
						$body.append(JT['game-hud']());
						callback();
					}
				}
			});
		}
	});

};