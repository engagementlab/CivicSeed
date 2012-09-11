var intervalId = {};
var numActivePlayers = 0;
// var numPlayers = 0;
var players = [];

var service, db, userModel,tileModel;

var self = module.exports = {

	// userModel: null,

	actions: function(req, res, ss) {

		console.log('CS:'.blue + ' player RPC request ---->'.magenta);
		console.log(JSON.stringify(req).slice(0, 100).magenta + '...'.magenta);

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

			//MUST MAKE IT SO YOU CAN ONLY INIT ONCE PER SESSION
			init: function() {
				// load models and database service only once
				service = ss.service;
				userModel = service.useModel('user', 'ss');
				tileModel = service.useModel('tile', 'ss');
				numActivePlayers++;
				//send the number of active players to angular
				ss.publish.all('ss-numActivePlayers',numActivePlayers);
				res(true);
			},
			// checkIn: function(player) {
			// 	players.push(player);
			// 	ss.publish.all('ss-numPlayers', numActivePlayers);
			// 	// it's working now!
			// 	userModel.find({ name: 'admin' }, function(err,result) {
			// 		console.log(result);
			// 	});
			// 	userModel.find({ name: 'Robert Hall' }, function(err,result) {
			// 		console.log(result);
			// 	});
			// },

			// checkIn: function(){
			// 	numPlayers++;
			// 	ss.publish.all('ss-count',numPlayers);
			// },
			// addMe: function(player){
			// 	players.push(player);
			// 	ss.publish.all('ss-allPlayers',players);
			// },

			// ------> this should be moved into our map rpc handler???
			getMapData: function(x1,y1,x2,y2) {
				// tileModel.findOne(function(err,query){
				// 	res(query);
				// });
				
				
				//tileModel.find().gte('x', x1).gte('y',y1).lt('x',x2).lt('y',y2);
				tileModel
				.where('x').gte(x1).lt(x2)
				.where('y').gte(y1).lt(y2)
				.sort('mapIndex')
				.find(function (err, allTiles) {
 			 		if (err){
 			 			res(false);
 			 		}
					if (allTiles) {
						res(allTiles);
					}
				});
				// quadrants.find({ quadrantNumber: quadNumber }, function(err, quad) {
				// 	res(err, quad, index);
				// });
				//return set of tiles based no bounds
			},
			movePlayer: function(player) {
				// for(var p=0; p<players.length;p++){
				// 	console.log(players[p].id);
				// 		//ridic stupid way to check if it's the right one (id isn't working)
				// 		if(players[p].r ==player.r && players[p].g ==player.g) {
				// 			players[p].x = player.x;
				// 			players[p].y = player.y;
				// 			continue;
				// 		}
				// }
				// console.log(player);
				ss.publish.all('ss-playerMoved', player);
			},

		}
	}
}