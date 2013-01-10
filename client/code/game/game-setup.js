exports.init = function(callback) {

	var $body;

	ss.rpc('shared.account.getUserSession', function(userSessionObject) {

		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else {
			$body = $(document.body);
			if(!sessionStorage.getItem('userId')) {
				sessionStorage.setItem('userId', userSessionObject.id);
				sessionStorage.setItem('userName', userSessionObject.name);
				sessionStorage.setItem('userEmail', userSessionObject.email);
			}
			$body.append(JT['partials-navigation']());
			$body.append(JT['game-gameboard']());
			$body.append(JT['game-resourceStage']());
			$body.append(JT['game-hud']());
			callback();
		}
	});

};