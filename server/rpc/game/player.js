var intervalId = {},
	numActivePlayers = 0,
	players = {},
	service,
	db,
	userModel,
	tileModel,
	gameModel;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

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
				name: req.session.firstName,
				game: req.session.game
			};
			players[playerInfo.id] = playerInfo;
			numActivePlayers += 1;

			// console.log('rpc.player.init: ', playerInfo);
			// console.log('rpc number of active players: ',  numActivePlayers);
			ss.publish.all('ss-addPlayer',numActivePlayers, playerInfo);
			//send the number of active players and the new player info
			res(playerInfo);
		},

		exitPlayer: function(info, id) {
			
			//update redis
			req.session.game = info;
			// console.log('exit: ', info);
			req.session.save();
			
			//update mongo
			userModel.findById(id, function (err, user) {
				if(!err && user) {
					user.game = info;
					user.save(function (y) {
						numActivePlayers -= 1;
						ss.publish.all('ss-removePlayer', numActivePlayers, id);
						delete players[id];
					});
				} else {
					// MIGHT NEED TO DO THIS HERE STILL???
					// ss.publish.all('ss-removePlayer', numActivePlayers, id);
				}
			});
		},

		getOthers: function() {
			res(players);
			// console.log('rpc.player.getOthers: ', players);
		},

		// ------> this should be moved into our map rpc handler???
		getMapData: function(x1,y1,x2,y2) {
			// tileModel.findOne(function(err,query) {
			// 	res(query);
			// });				
			//tileModel.find().gte('x', x1).gte('y',y1).lt('x',x2).lt('y',y2);
			// console.log('getMapData:', x1,y1);
			tileModel
			.where('x').gte(x1).lt(x2)
			.where('y').gte(y1).lt(y2)
			.sort('mapIndex')
			.find(function (err, allTiles) {
			 		if(err) {
			 			res(false);
			 		}
				if(allTiles) {
					res(allTiles);
				}
			});
			// quadrants.find({ quadrantNumber: quadNumber }, function(err, quad) {
			// 	res(err, quad, index);
			// });
			//return set of tiles based no bounds
		},
		
		movePlayer: function(moves, id) {
			// console.log('rpc.player.movePlayer: ', id);
			//send out the moves to everybody
			ss.publish.all('ss-playerMoved', moves, id);
			res(true);
		},

		savePosition: function(info) {
			players[info.id].game.position.x = info.x;
			players[info.id].game.position.y = info.y;
			//console.log(info);
			req.session.game = info;
		},
		dropSeed: function(bombed, info) {
			// console.log('dropSeed: ', info);
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
				if(err) {
					res(false);
				}
				if(oldTiles) {
					var saveColors = function(i) {
						if(oldTiles[i].x === bombed[index].x && oldTiles[i].y === bombed[index].y) {

							//color stuff here:
							if(oldTiles[i].color.owner !== undefined) {

								//if the old one is a nobody -
								if(oldTiles[i].color.owner === 'nobody') {
									
									//if the NEW one should be owner
									if(bombed[index].color.owner !== 'nobody') {
										var rgbString0 = 'rgba(' + bombed[index].color.r + ',' + bombed[index].color.g + ',' + bombed[index].color.b + ',' + bombed[index].color.a  + ')';
										bombed[index].curColor = rgbString0;
										oldTiles[i].set({
											color: bombed[index].color,
											curColor: rgbString0
										});
									}

									//new one should be modified
									else {
										//if there is still room
										if(oldTiles[i].color.a < 0.5 ) {

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
											
											var rgbString1 = 'rgba(' + newR + ',' + newG + ',' + newB + ',' + bombed[index].color.a + ')';
											oldTiles[i].set({
												color: bombed[index].color,
												curColor: rgbString1
											});
											bombed[index].curColor = rgbString1;
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
								var rgbString2 = 'rgba(' + bombed[index].color.r + ',' + bombed[index].color.g + ',' + bombed[index].color.b + ',' + bombed[index].color.a  + ')';
								oldTiles[i].set({
									color: bombed[index].color,
									curColor: rgbString2
								});
								bombed[index].curColor = rgbString2;
							}
						
							oldTiles[i].save(function(y) {
								index += 1;
								curOld += 1;
								if(index < num) {
									saveColors(curOld);
								}
								else {
									var newTileCount = info.tilesColored + bombed.length;
									
									var sendData = {
										bombed: bombed,
										id: info.id,
										tilesColored: newTileCount
									};
									//we are done,send out the color information to each client to render
									ss.publish.all('ss-seedDropped', sendData);
									
									//access our global game model for status updates
									gameModel.findOne({}, function (err, result) {
										if(err) {
									
										}
										else{
											//add tile count to our progress
											var oldCount = result.seedsDropped,
												newCount = oldCount + 1;
												oldColored = result.tilesColored,
												newColored = oldColored + bombed.length,
												oldPercent = Math.floor((oldCount / result.seedsDroppedGoal) * 100),
												newPercent = Math.floor((newCount / result.seedsDroppedGoal) * 100);

											//update leadeboard
											var oldBoard = result.leaderboard,
												gState = result.state,
												i = oldBoard.length,
												found = false,
												newNameForStatus = false,
												updateBoard = false,
												newGuy = {
													name: info.name,
													count: info.tilesColored + num
												};

											if(i === 0) {
												oldBoard.push(newGuy);
												updateBoard = true;
												newNameForStatus = newGuy.name;
											}
											else {
												//if new guy exists, update him
												while(--i > -1) {
													if(oldBoard[i].name === newGuy.name) {
														oldBoard[i].count = newGuy.count;
														found = true;
														updateBoard = true;
														continue;
													}
												}
												//add new guy
												if(!found) {
													if(oldBoard.length < 5 || newGuy.count > oldBoard[oldBoard.length-1]) {
														oldBoard.push(newGuy);
														newNameForStatus = newGuy.name;
														updateBoard = true;
													}
												}
												//sort them
												oldBoard.sort(function(a, b) {
													return b.count-a.count;
												});
												
												//get rid of the last one if too many
												if(oldBoard.length > 5) {
													oldBoard.pop();
												}
											}
											
											if(newPercent > 99) {
												result.set('state', 2);
											}

											//save all changes
											result.set('seedsDropped', newCount);
											result.set('leaderboard', oldBoard);
											result.set('tilesColored', newColored);
											result.save();
											
											
											//check if the leaderboard changed

											//if new guy > last
											//if new guy already on
											//if new leader
											if(updateBoard) {
												ss.publish.all('ss-leaderChange', oldBoard, newNameForStatus);
											}
											// //send out new percent if it has changed
											// if(oldPercent !== newPercent) {
											ss.publish.all('ss-progressChange', {dropped: newCount, colored: newColored});
											//}

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
						tilesColored: user.game.tilesColored,
						level: user.game.currentLevel,
						rank: user.game.rank,
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
		},

		getAllImages: function() {
			var maps = [];
			userModel.find(function(err, users) {
				if(err) {
					console.log('issue');
				}
				else {
					for(var i = 0; i < users.length; i +=1) {
						var map = users[i].game.colorMap;
						if(map) {
							maps.push(users[i].game.colorMap);
						}
					}
					res(maps);
				}
			});
		},

		levelChange: function(id, level) {
			ss.publish.all('ss-levelChange', id, level);
		},

		statusUpdate: function(msg) {
			ss.publish.all('ss-statusUpdate', msg);
		}
	};
}