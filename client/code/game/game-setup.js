exports.init = function(callback) {

	var $body;

	console.log('game-setup getUserSession:');
	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		console.log(userSessionObject);
		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else if(userSessionObject.isPlaying) {
			//they are already IN the game, redirect to their profile
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
			//must save this in mongo so if the user logs in again on another machine WHILE
			//playing the game, they can't play the game until they leave the game :)?
			ss.rpc('shared.account.setPlaying', userSessionObject.id, function(response) {
				sessionStorage.setItem('isPlaying', true);
				$body.append(JT['partials-navigation']());
				$body.append(JT['game-gameboard']());
				$body.append(JT['game-resourceStage']());
				$body.append(JT['game-hud']());
				callback();
			});
		}
	});

};