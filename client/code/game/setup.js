exports.init = function(callback) {

	var $body = $(document.body);
	var tmplEngine = ss.tmpl;

	$body.append(tmplEngine['game-navigation'].render());
	$body.append(tmplEngine['game-gameboard'].render());
	$body.append(tmplEngine['game-resourceStage'].render());
	$body.append(tmplEngine['game-hud'].render());

	callback();
}