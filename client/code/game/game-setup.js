exports.init = function(callback) {

	var $body;

	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else {
			$body = $(document.body);
			$body.append(JT['partials-navigation'](userSessionObject));
			$body.append(JT['game-gameboard']());
			$body.append(JT['game-resourceStage']());
			$body.append(JT['game-hud']());
			callback();
		}
	});

}