// COMPARE SHARED.ACCOUNT JS FILE
// var rootDir = process.cwd();
// var service = require(rootDir + '/service');
// var UserModel = service.useModel('user');

var intervalId = {};
var numActivePlayers = 0;
// var numPlayers = 0;
var players = {};

var service, db, userModel, tileModel;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	// console.log('CS:'.blue + ' player RPC request ---->'.magenta);
	// console.log(JSON.stringify(req).slice(0, 100).magenta + '...'.magenta);
	// Russ, it's all hooked up. Access the db via ss.db
	//console.log(ss.db);
	return {

		//MUST MAKE IT SO YOU CAN ONLY INIT ONCE PER SESSION
		init: function() {

			// load models and database service only once
			service = ss.service;
			userModel = service.useModel('user', 'ss');
			tileModel = service.useModel('tile', 'ss');

			console.log(req.session.game);
			// console.log('player ' + req.session.id + ' joined.');
			// console.log(req.session);
			//right now choose a random starting loc
			var playerInfo = {
					id: req.session.userId,
					name: req.session.name,
					game: req.session.game
				};

			//send the number of active players and the new player info
			res(playerInfo);
		},

		addPlayer: function(info) {
			players[info.id] = info;
			numActivePlayers += 1;
			ss.publish.all('ss-addPlayer',numActivePlayers, info);
		},
		removePlayer: function(id) {
		
			userModel.findById(id, function (err, user) {
				user.game.position.x = players[id].game.position.x,
				user.game.position.y = players[id].game.position.y;

				user.save(function (y) {
					ss.publish.all('ss-removePlayer', numActivePlayers, id);
					numActivePlayers -= 1;
					delete players[id];
				});
			});
		},

		getOthers: function() {
			res(players);
		},

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
		
		movePlayer: function(moves, id) {
			console.log("move "+id);

			//send out the moves to everybody
			ss.publish.all('ss-playerMoved', moves, id);
		},

		sendPosition: function(info) {
					players[info.id].game.position.x = info.x;
					players[info.id].game.position.y = info.y;
		},
		dropSeed: function(bombed) {
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
			ss.publish.all('ss-seedDropped', bombed);
		},
	}
}