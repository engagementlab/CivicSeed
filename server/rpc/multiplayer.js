var intervalId = {};
var numPlayers = 0;
var players = [];

exports.actions = function(req, res, ss) {

	var service, db, users;
	

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
			db = ss.db;
			users = service.useModel('user', 'ss');
			quadrants = service.useModel('map', 'ss');

			quadrants.find({quadrantNumber: 0},function(err,quad){
				console.log(quad);
				res(err,quad);
			});
			// users.find(function (err, users) {
			// 	if (err) { return handleError(err); }
			// 	console.log(users);
			// 	console.log(users.length);
			// });
		},
		getMapData: function(quadNumber){
			quadrants.find({quadrantNumber: quadNumber},function(err,quad){
				//console.log(quad);
				res(quad);
			});
		},	
		addMe: function(player) {
			players.push(player);
			ss.publish.all('ss-allPlayers',players);
		},
		playerMoved: function(player){
			console.log(player);
			for(var p=0; p<players.length;p++){
				//console.log("in array: "+p.id);
				console.log(players[p]);

				//ridic stupid way to check if it's the right one (id isn't working)
				if(players[p].r ==player.r && players[p].g ==player.g){
					players[p].x = player.x;
					players[p].y = player.y;
					continue;
				}
			}
			ss.publish.all('ss-allPlayers',players);
		}

	};
}