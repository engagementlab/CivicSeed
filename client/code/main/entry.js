window.ss = require('socketstream');

ss.server.on('disconnect', function() { console.log('Lost connection to server...'); });
ss.server.on('reconnect', function() { console.log('Connection to server...'); });

ss.server.on('ready', function() {

	$(function() {

		require('/civicseed-engine').init();

	});

});