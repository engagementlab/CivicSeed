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
				require('/main');
			});
		}

	});

});