exports.init = function(callback) {

	var $body;

	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		//console.log('game-setup getUserSession:', userSessionObject);
		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else {
			//check if they are ACTUALLY playing
			ss.rpc('shared.account.checkGameSession', function(err,response) {
				// console.log('hey now', err, response);
				if(err) {

				} else {
					if(response) {
						location.href = '/profiles/' + userSessionObject.profileLink;
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
							sessionStorage.setItem('profileLink', userSessionObject.profileLink);
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