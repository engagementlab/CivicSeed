exports.init = function(callback) {

	var $body, tmplEngine;

	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		if(userSessionObject === 'NOT_AUTHENTICATED') {
			window.location.href = '/';
		} else {
			$body = $(document.body);
			tmplEngine = ss.tmpl;
			$body.append(tmplEngine['partials-navigation'].render(userSessionObject));
			$body.append(tmplEngine['game-gameboard'].render());
			$body.append(tmplEngine['game-resourceStage'].render());
			$body.append(tmplEngine['game-hud'].render());
			callback();
		}
	});

}