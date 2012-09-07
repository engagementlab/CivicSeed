var intervalId = {};
// var crypto = require('crypto');

var self = exports.actions = function(req, res, ss) {

	console.log('CS:'.blue + ' chat RPC request ---->'.magenta);
	console.log(req);

	return {
		on: function() {
			intervalId = setInterval(function() {
					var message = 'Message from player';
					ss.publish.all('ss-multi', message);
			}, 3000);
			setTimeout(function() {
				res("Receiving SpaceMail"); 
			}, 2000);
		},
		off: function(reason) {
			console.log("Received reason: %s", reason);
			clearInterval(intervalId);
			setTimeout(function() {
				ss.publish.all('ss-multi', reason);
				res("Ignoring SpaceMail");
			}, 2000);
		},
		// on: function() {
		// 	intervalId = setInterval(function() {
		// 		crypto.randomBytes(16, function(ex,buf) {
		// 			var message = 'Message from space: ' + buf;
		// 			ss.publish.all('ss-example', message);
		// 		});
		// 	}, 3000);
		// 	setTimeout(function() {
		// 		res("Receiving SpaceMail"); 
		// 	}, 2000);
		// },
		// off: function(reason) {
		// 	console.log("Received reason: %s", reason);
		// 	clearInterval(intervalId);
		// 	setTimeout(function() {
		// 		ss.publish.all('ss-example', reason);
		// 		res("Ignoring SpaceMail");
		// 	}, 2000);
		// }
	};
}