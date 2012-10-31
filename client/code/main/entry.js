window.ss = require('socketstream');

ss.server.on('disconnect', function(){
	console.log('Lost connection to server...');
});

ss.server.on('reconnect', function(){
	console.log('Connection to server...');
});

ss.server.on('ready', function(){

	jQuery(function(){

		require('/setup').init(function() {
			require('/whatever-comes-next');
		});

	});

});