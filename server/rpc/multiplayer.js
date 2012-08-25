var intervalId = {};
var numActivePlayers = 0;
var players = [];

var service, db, userModel;

var self = module.exports = {

	// userModel: null,

	actions: function(req, res, ss) {

		// Russ, it's all hooked up. Access the db via ss.db
		//console.log(ss.db);
		return {
			// on: function() {
			// 	intervalId = setInterval(function() {
			// 			var message = 'Message from player';
			// 			ss.publish.all('ss-multi', message);
			// 	}, 3000);
			// 	setTimeout(function() {
			// 		res("Receiving SpaceMail"); 
			// 	}, 2000);
			// },
			// off: function(reason) {
			// 	console.log("Received reason: %s", reason);
			// 	clearInterval(intervalId);
			// 	setTimeout(function() {
			// 		ss.publish.all('ss-multi', reason);
			// 		res("Ignoring SpaceMail");
			// 	}, 2000);
			// },

			init: function() {
				// load models and database service only once
				service = ss.service;
				userModel = service.useModel('user', 'ss');
				quadrants = service.useModel('map', 'ss');
				res(true);
			},
			checkIn: function(player) {
				numActivePlayers++;
				players.push(player);
				ss.publish.all('ss-numPlayers', numActivePlayers);
				// it's working now!
				userModel.find({ name: 'admin' }, function(err,result) {
					console.log(result);
				});
				userModel.find({ name: 'Robert Hall' }, function(err,result) {
					console.log(result);
				});
				res(numActivePlayers);
			},
			getMapData: function(index,quadNumber) {
				quadrants.find({ quadrantNumber: quadNumber }, function(err, quad) {
					res(err, quad, index);
				});
			},
			playerMoved: function(player) {
				console.log(player);
				for(var p = 0; p < players.length; p++) {
					//console.log("in array: "+p.id);
					console.log(players[p]);

					//ridic stupid way to check if it's the right one (id isn't working)
					if(players[p].r ==player.r && players[p].g ==player.g) {
						players[p].x = player.x;
						players[p].y = player.y;
						continue;
					}
				}
				ss.publish.all('ss-allPlayers',players);
			}

		}
	}
}