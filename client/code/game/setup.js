exports.init = function(callback) {

	var $body = $(document.body);
	var tmplEngine = ss.tmpl;

	ss.rpc('shared.account.getUserSession', function(userSessionObject) {
		$body.append(tmplEngine['partials-navigation'].render(userSessionObject));
	});

	$body.append(tmplEngine['game-gameboard'].render());
	$body.append(tmplEngine['game-resourceStage'].render());
	$body.append(tmplEngine['game-hud'].render());

	callback();
}