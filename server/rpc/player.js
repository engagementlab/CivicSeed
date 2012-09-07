var intervalId = {};
var numPlayers = 0;
var players = [];

var self = exports.actions = function(req, res, ss) {

	console.log('CS:'.blue + ' player RPC request ---->'.magenta);
	console.log(req);

	return {
		checkIn: function(){
			numPlayers++;
			ss.publish.all('ss-count',numPlayers);
		},
		addMe: function(player){
			players.push(player);
			ss.publish.all('ss-allPlayers',players);
		},
		movePlayer: function(player){
			// for(var p=0; p<players.length;p++){
			// 	console.log(players[p].id);
			// 	if(players[p].r == player.r){
			// 		players[p].x = player.x;
			// 		players[p].y = player.y;
			// 		continue;
			// 	}
			// }
			console.log(player);
			ss.publish.all('ss-playerMoved',player);
		}

	};
}