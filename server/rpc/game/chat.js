// Server-side Code
var service, chatModel;

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

	return {

		init: function() {
			service = ss.service;
			console.log('initChat');
			chatModel = service.useModel('chat', 'ss');
		},

		sendMessage: function(data) {
			console.log('sendMessage: ', data);
			if (data.msg && data.msg.length > 0) {         // Check for blank messages
				var logChat = {
					who: data.name,
					id: data.id,
					what: data.log,
					when: Date.now()
				};
				chatModel.create(logChat, function(err, suc) {
					
				});
				ss.publish.all('ss-newMessage', data.msg, data.id);     // Broadcast the message to everyone
				return res(true);                          // Confirm it was sent to the originating client
			} else {
				return res(false);
			}
		}

	};

};