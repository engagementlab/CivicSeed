var intervalId = {};
var numPlayers = 0;
var players = [];
exports.actions = function(req, res, ss) {
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
		checkIn: function(){
			numPlayers++;
			ss.publish.all('ss-count',numPlayers);
		},
		addMe: function(player){
			players.push(player);
			ss.publish.all('ss-allPlayers',players);
		},
		playerMoved: function(player){
			for(var p=0; p<players.length;p++){
				console.log(players[p].id);
				if(players[p].r == player.r){
					players[p].x = player.x;
					players[p].y = player.y;
					continue;
				}
			}
			ss.publish.all('ss-allPlayers',players);
		}

	};
}