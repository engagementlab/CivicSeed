window.ss = require('socketstream');
var gameInitialized = false;

ss.server.on('disconnect', function(){
	console.log('Lost connection to server...');
});

ss.server.on('reconnect', function(){
	console.log('Connection to server...');
});

ss.server.on('ready', function(){

	jQuery(function(){

		if(!gameInitialized) {
			require('/setup').init(function() {
				gameInitialized = true;
				require('/controllers');
			});
		}

	});

});