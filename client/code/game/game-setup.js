exports.init = function(callback) {

	var $body;

	console.log('game-setup getUserSession:');
	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		console.log(userSessionObject);
		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else {
			$body = $(document.body);

			console.log(sessionStorage);
			if(!sessionStorage.getItem('userId')) {
				sessionStorage.setItem('userId', userSessionObject.id);
				sessionStorage.setItem('userName', userSessionObject.firstName);
				sessionStorage.setItem('userEmail', userSessionObject.email);
				sessionStorage.setItem('userRole', userSessionObject.role);
			}
			$body.append(JT['partials-navigation']());
			$body.append(JT['game-gameboard']());
			$body.append(JT['game-resourceStage']());
			$body.append(JT['game-hud']());
			callback();
		}
	});

};