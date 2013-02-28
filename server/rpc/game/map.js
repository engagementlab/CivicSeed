var userModel,service,canvas,ctx,collectiveMap;
//var Canvas = require('canvas');

exports.actions = function(req, res, ss) {

	req.use('session');
	req.use('debug');

	// canvas = new Canvas(142,132);
	// Image = Canvas.Image;
	// ctx = canvas.getContext('2d');

	return {
		
		// init: function() {
		// 	service = ss.service;
		// 	userModel = service.useModel('user', 'ss');
		// 	userModel.find(function (err, users) {
		// 		if(err) {
		// 			console.log(err);
		// 		}
		// 		else {
		// 			var l = users.length;
		// 			var i =0;
		// 			while(i < l) {
		// 				if(users[i].game.colorMap !== undefined) {
		// 					var img = new Image;
		// 					img.src = users[i].game.colorMap;
  // 							ctx.drawImage(img, 0, 0);	
		// 				}
		// 				i++;
		// 			}
		// 			collectiveMap = canvas.toDataURL();
  // 					res(collectiveMap);
		// 		}
		// 	});
		// }

		// sendMessage: function(message, id) {
		// 	if (message && message.length > 0) {         // Check for blank messages
		// 		ss.publish.all('ss-newMessage', message, id);     // Broadcast the message to everyone
		// 		return res(true);                          // Confirm it was sent to the originating client
		// 	} else {
		// 		return res(false);
		// 	}
		// },

	};

};