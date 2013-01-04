// COMPARE SHARED.ACCOUNT JS FILE
// var rootDir = process.cwd();
// var service = require(rootDir + '/service');
// var UserModel = service.useModel('user');

var intervalId = {};
var numActivePlayers = 0;
// var numPlayers = 0;
var players = {};

var service, db, userModel, tileModel, gameModel;

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
			gameModel = service.useModel('game', 'ss');
			
			//should we pull the game info from the db instead of it being passed in a session?
			var playerInfo = {
				id: req.session.userId,
				name: req.session.name,
				game: req.session.game
			};

			players[playerInfo.id] = playerInfo;
			numActivePlayers += 1;

			ss.publish.all('ss-addPlayer',numActivePlayers, playerInfo);
			//send the number of active players and the new player info
			res(playerInfo);
		},

		exitPlayer: function(info, id) {
			
			//update redis
			req.session.game = info;
			req.session.save();
			
			//update mongo
			userModel.findById(id, function (err, user) {
				user.game = info;

				user.save(function (y) {
					numActivePlayers -= 1;
					ss.publish.all('ss-removePlayer', numActivePlayers, id);
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
		
		movePlayer: function(pos, id) {

			//send out the moves to everybody
			ss.publish.all('ss-playerMoved', pos, id);
			res(true);
		},

		savePosition: function(info) {
			players[info.id].game.position.x = info.x;
			players[info.id].game.position.y = info.y;
			//console.log(info);
			req.session.game = info;
		},
		dropSeed: function(bombed, info) {

			//welcome to the color server
			//here, we will run through the array of tiles passed to us, call them from the db,
			//and update them if necessary (better way? is to do this on client, but client needs
			//to have the other viewports loaded as well)
			var num = bombed.length,
				curOld = 0,
				index = 0,
				minX = info.x,
				maxX = info.x + info.sz,
				minY = info.y,
				maxY = info.y + info.sz;

			tileModel
			.where('x').gte(minX).lt(maxX)
			.where('y').gte(minY).lt(maxY)
			.sort('mapIndex')
			.find(function (err, oldTiles) {
				if (err){
					res(false);
				}
				if (oldTiles) {
					var saveColors = function(i) {
						if(oldTiles[i].x === bombed[index].x && oldTiles[i].y === bombed[index].y) {

							//color stuff here:
							if(oldTiles[i].color.owner !== undefined) {

								//if the old one is a nobody -
								if(oldTiles[i].color.owner === 'nobody') {
									
									//if the NEW one should be owner
									if(bombed[index].color.owner !== 'nobody') {
										oldTiles[i].set('color', bombed[index].color);
									}

									//new one should be modified
									else {
										//if there is still room
										if(oldTiles[i].color.a < 0.7 ) {

											var prevR = oldTiles[i].color.r,
												prevG = oldTiles[i].color.g,
												prevB = oldTiles[i].color.b,
												prevA = oldTiles[i].color.a;

											var weightA = prevA / 0.1,
												weightB = 1;

											var newR = Math.floor((weightA * prevR + weightB * bombed[index].color.r) / (weightA + weightB)),
												newG = Math.floor((weightA * prevG + weightB * bombed[index].color.g) / (weightA + weightB)),
												newB = Math.floor((weightA * prevB + weightB * bombed[index].color.b) / (weightA + weightB));

											bombed[index].color.a = Math.round((oldTiles[i].color.a + 0.1) * 100) / 100,
											bombed[index].color.r = newR,
											bombed[index].color.g = newG,
											bombed[index].color.b = newB;
											
											oldTiles[i].set('color', bombed[index].color);
										}
										//don't incorp. new for sending out, use old one since at max
										else {
											bombed[index].color = oldTiles[i].color;
										}
									}
								}
								else {
									bombed[index].color = oldTiles[i].color;
								}
							}
							//if there is no color, then full on use the new values
							else {
								oldTiles[i].set('color', bombed[index].color);
							}
						
							oldTiles[i].save(function(y) {
								index += 1;
								curOld += 1;
								if(index < num) {
									saveColors(curOld);
								}
								else {
									//we are done,send out the color information to each client to render
									ss.publish.all('ss-seedDropped', bombed, info.id, info.name);
									
									//access our global game model for status updates
									gameModel.findOne({}, function (err, result) {
										if(err) {
									
										}
										else{
											//add tile count to our progress
											var oldCount = result.tilesColored,
												newCount = oldCount + bombed.length;
												oldPercent = Math.floor((oldCount / 18744) * 100),
												newPercent = Math.floor((newCount / 18744) * 100);

											//update leadeboard
											var oldBoard = result.leaderboard,
												i = oldBoard.length,
												found = false,
												newGuy = {
													name: info.name,
													count: info.dropped + bombed.length
												};

											//if new guy exists, update him
											while(--i > -1) {
												if(oldBoard[i].name === newGuy.name) {
													oldBoard[i].count = newGuy.count;
													found = true;
													continue;
												}
											}
											//add new guy
											if(!found) {
												oldBoard.push(newGuy);
											}

											//sort them
											oldBoard.sort(function(a, b){
												return b.count-a.count;
											});
											
											//get rid of the last one if too many
											if(oldBoard.length > 5) {
												oldBoard.pop();
											}

											//save all changes
											result.set('tilesColored', newCount);
											result.set('leaderboard', oldBoard);
											result.save();
											
											ss.publish.all('ss-leaderChange', oldBoard);
											//send out new percent if it has changed
											if(oldPercent !== newPercent) {
												ss.publish.all('ss-progressChange', newCount);
											}
										}
										res(bombed.length);
									});


								}
							});
						}
						else {
							curOld += 1;
							saveColors(curOld);
						}
					};
					saveColors(curOld);
				}
			});
		},

		getInfo: function(id) {
			userModel.findById(id, function (err, user) {
				if(err) {
					res('user not found');
				}
				else {
					var data = {
						dropped: user.game.seeds.dropped,
						level: user.game.currentLevel,
						name: user.name,
						color: user.game.color
					};
					res(data);
				}
			});
			
		},
		getGameInfo: function() {
			gameModel.findOne({}, function (err, result) {
				if(err) {
					console.log('game cannot start');
				}
				else{
					res(result);
				}
			});
		}
	};
}