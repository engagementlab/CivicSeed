window.ss = require('socketstream');
var appInitialized = false;

ss.server.on('disconnect', function(){
	console.log('Lost connection to server...');
});

ss.server.on('reconnect', function(){
	console.log('Connection to server...');
});

ss.server.on('ready', function(){

	jQuery(function(){

		if(!appInitialized) {
			require('/setup').init(function() {

				appInitialized = true;

				var gameModule = require('/game');

				gameModule.gameModuleReady(function() {

					window.$game = gameModule.$game;

					var $account = require('/account');
					$account.accountHandlers();

					var $map = require('/map');
					var $render = require('/render');
					var $npc = require('/npc');
					var $player = require('/player');
					var $others = require('/others');
					var $thing = require('/thing')
					var $mouse = require('/mouse');
					var $audio = require('/audio');
					var $pathfinder = require('/pathfinder');
					var $events = require('/events');

					$game.init();

				});

			});
		}

	});

});