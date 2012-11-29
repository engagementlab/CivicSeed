// Server-side Code

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

	// // Example of pre-loading sessions into req.session using internal middleware
	// req.use('session');
	// req.use('account.user.authenticated');

	//console.log('CS:'.blue + ' chat RPC request ---->'.magenta);
	//console.log(JSON.stringify(req).slice(0, 100).magenta + '...'.magenta);

	return {

		sendMessage: function(message, id) {
			if (message && message.length > 0) {         // Check for blank messages
				ss.publish.all('ss-newMessage', message, id);     // Broadcast the message to everyone
				return res(true);                          // Confirm it was sent to the originating client
			} else {
				return res(false);
			}
		},

	};

};