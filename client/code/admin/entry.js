window.ss = require('socketstream');
var appInitialized = false;

ss.server.on('disconnect', function() {
	console.log('Lost connection to server...');
});

ss.server.on('reconnect', function() {
	console.log('Connection to server...');
});

ss.server.on('ready', function() {

	jQuery(function() {

		console.log('hittheeerr');

		// if(!appInitialized) {
		// 	require('/admin-setup').init(function() {

		// 		appInitialized = true;

		// 		// var $account = require('/account');
		// 		// $account.accountHandlers();

		// 	});
		// }

	});

});