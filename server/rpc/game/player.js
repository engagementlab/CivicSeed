var intervalId = {},
	games = {},
	service,
	db,
	userModel,
	tileModel,
	gameModel,
	colorModel,
	rootDir = process.cwd(),
	emailUtil = require(rootDir + '/server/utils/email'),
	colorHelpers = null;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	req.use('account.authenticated');

	return {
		//MUST MAKE IT SO YOU CAN ONLY INIT ONCE PER SESSION
		init: function() {
			// load models and database service only once
			service = ss.service;
			userModel = service.useModel('user', 'ss');
			tileModel = service.useModel('tile', 'ss');
			colorModel = service.useModel('color', 'ss');
			gameModel = service.useModel('game', 'ss');

			//should we pull the game info from the db instead of it being passed in a session?
			var lastInitial = req.session.lastName.substring(0,1).toUpperCase(),
				firstName = req.session.firstName.substring(0,1).toUpperCase() + req.session.firstName.substring(1,req.session.firstName.length),
				name = firstName + ' ' + lastInitial;
			var playerInfo = {
				id: req.session.userId,
				name: name,
				game: req.session.game
			};

			if(!games[playerInfo.game.instanceName]) {
				console.log('create! the game baby');
				games[playerInfo.game.instanceName] = {
					players: {},
					numActivePlayers: 0
				};
			}

			console.log('initializing ', playerInfo.name);
			games[req.session.game.instanceName].players[playerInfo.id] = playerInfo;
			games[req.session.game.instanceName].numActivePlayers += 1;
			ss.publish.channel(req.session.game.instanceName, 'ss-addPlayer', {num: games[req.session.game.instanceName].numActivePlayers, info: playerInfo});
			//send the number of active players and the new player info
			res(playerInfo);
		},

		exitPlayer: function(info, id) {
			//update redis
			req.session.game = info;
			req.session.save();
			//update mongo
			userModel
				.findById(id, function (err, user) {
					if(err) {
						console.log(err);
					} else if(user) {
						user.game = info;
						user.isPlaying = false;
						user.save(function (y) {
							games[req.session.game.instanceName].numActivePlayers -= 1;
							ss.publish.channel(req.session.game.instanceName,'ss-removePlayer', {num: games[req.session.game.instanceName].numActivePlayers, id: id});
							delete games[req.session.game.instanceName].players[id];
							res(true);
						});
					} else {
						// MIGHT NEED TO DO THIS HERE STILL???
						// ss.publish.channel(req.session.game.instanceName,'ss-removePlayer', numActivePlayers, id);
					}
				});
		},

		getOthers: function() {
			res(games[req.session.game.instanceName].players);
		},

		// ------> this should be moved into our map rpc handler???
		getMapData: function(x1,y1,x2,y2) {
			tileModel
				.where('x').gte(x1).lt(x2)
				.where('y').gte(y1).lt(y2)
				.sort('mapIndex')
				.find(function (err, allTiles) {
					if(err) {
						res(false);
					} else if(allTiles) {
						colorModel
							.where('instanceName').equals(req.session.game.instanceName)
							.where('x').gte(x1).lt(x2)
							.where('y').gte(y1).lt(y2)
							.sort('mapIndex')
							.find(function (err, colorTiles) {
								if(err) {
									res(false);
								} else if(colorTiles) {
									res(allTiles, colorTiles);
								}
							});
					}
				});
		},

		movePlayer: function(moves, id) {
			//send out the moves to everybody
			ss.publish.channel(req.session.game.instanceName,'ss-playerMoved', {moves: moves, id: id});
			res(true);
		},

		savePosition: function(info) {
			games[req.session.game.instanceName].players[info.id].game.position.x = info.x;
			games[req.session.game.instanceName].players[info.id].game.position.y = info.y;
			// req.session.save();
		},

		saveImage: function(info) {
			userModel
				.findById(req.session.userId, function (err, user) {
					if(err) {
						console.log(err);
						res(err);
					} else if(user) {
						user.game.colorMap = info;
						user.save(function (y) {
							res(true);
						});
					}
				});
		},

		dropSeed: function(bombed, info) {
			//welcome to the color server!
			var num = bombed.length,
				curOld = 0,
				index = 0,
				minX = info.x,
				maxX = info.x + info.sz,
				minY = info.y,
				maxY = info.y + info.sz,
				allTiles = null,
				updateTiles = [],
				insertTiles = [];

			//get a chunk of the bounding tiles from the DB (instead of querying each individually)
			colorModel
				.where('instanceName').equals(req.session.game.instanceName)
				.where('x').gte(minX).lt(maxX)
				.where('y').gte(minY).lt(maxY)
				.sort('mapIndex')
				.find(function (err, oldTiles) {
					if(err) {
						res(false);
					} else if(oldTiles) {
						//console.log('oldTiles: ', oldTiles);
						var modifiedTiles = null;
						if(oldTiles.length > 0) {
							modifiedTiles = colorHelpers.modifyTiles(oldTiles, bombed);
							console.log(modifiedTiles.insert.length);
							console.log(modifiedTiles.update.length);
						} else {
							modifiedTiles = {
								insert: bombed,
								update: []
							};
						}
						//saveEach tile
						colorHelpers.saveTiles(modifiedTiles, function(done) {
							allTiles = modifiedTiles.insert.concat(modifiedTiles.update);
								//send out new bombs AND player info to update score
								var newTileCount = info.tilesColored + allTiles.length,
								sendData = {
									bombed: allTiles,
									id: info.id,
									tilesColored: newTileCount
								};
								// //we are done,send out the color information to each client to render
								ss.publish.channel(req.session.game.instanceName,'ss-seedDropped', sendData);

								var newInfo = {
									name: info.name,
									numBombs: allTiles.length,
									count: info.tilesColored
								};

								colorHelpers.gameColorUpdate(newInfo, req.session.game.instanceName, function(updates) {
									if(updates.updateBoard) {
										ss.publish.channel(req.session.game.instanceName,'ss-leaderChange', {board: updates.board, name: newInfo.name});
									}
									ss.publish.channel(req.session.game.instanceName,'ss-progressChange', {dropped: updates.dropped, colored: updates.colored});
									//FINNNALLY done updating and stuff, respond to the player
									//telling them if it was sucesful
									res(allTiles.length);
								});
							});
					}
				});
		},

		getInfo: function(id) {
			userModel.findById(id, function (err, user) {
				if(err) {
					res('user not found');
				} else {
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
			gameModel
				.where('instanceName').equals(req.session.game.instanceName)
				.find(function (err, result) {
					if(err) {
						console.log(err);
					}
					else{
						res(result[0]);
					}
			});
		},

		getAllImages: function() {
			var maps = [];
			userModel
				.where('role').equals('actor')
				.where('game.instanceName').equals(req.session.game.instanceName)
				.select('game.colorMap')
				.find(function(err, users) {
					if(err) {
						console.log(err);
					} else {
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
			ss.publish.channel(req.session.game.instanceName,'ss-levelChange',{id: id, level: level});
		},

		statusUpdate: function(msg) {
			ss.publish.channel(req.session.game.instanceName,'ss-statusUpdate', msg);
		},

		gameOver: function(info, id) {
			//update redis
			req.session.game = info;
			req.session.profileSetup = true;
			// console.log('exit: ', info);
			req.session.save();
			//update mongo
			userModel.findById(id, function (err, user) {
				if(!err && user) {
					user.game = info;
					user.profileUnlocked = true;
					user.isPlaying = false;
					user.save(function (y) {
						var url = '/profiles/' + req.session.firstName + '.' + req.session.lastName;
						res(url);
					});
				} else {
					// MIGHT NEED TO DO THIS HERE STILL???
					// ss.publish.channel(req.session.game.instanceName,'ss-removePlayer', numActivePlayers, id);
				}
			});
		},

		pledgeSeed: function(info) {
			userModel.findById(info.id, function (err, user) {
				if(err) {

				} else if(user) {
					user.game.seeds.riddle += 1;
					//find resource, update seeded number
					var found = false,
						i = 0,
						npcId = parseInt(info.npc,10);
					while(!found) {
						if(user.game.resources[i].npc === npcId) {
							user.game.resources[i].seeded += 1;
							found = true;
						}
						i++;
						if(i >= user.game.resources.length) {
							found = true;
						}
					}
					user.save(function (err,suc) {
						res(suc);
						ss.publish.channel(req.session.game.instanceName,'ss-seedPledged', info.id);
					});
				}
			});
		},

		saveResource: function(info) {
			//update in req.session
			userModel
				.findById(info.id, function (err, user) {
					if(err) {
						console.log(err);
					} else if(user) {
						//look thru resources and update if found
						var found = false,
							cur = 0;
						while(cur < user.game.resources.length) {
							if(user.game.resources[cur].npc === info.resource.npc) {
								found = true;
								user.game.resources[cur] = info.resource;
								cur = user.game.resources.length;
							}
							cur++;
						}
						if(!found) {
							user.game.resources.push(info.resource);
						}
						user.save(function (y) {
							res('good');
						});
					}
				});
		}
	};
};

colorHelpers = {

	modifyTiles: function(oldTiles, bombed) {
		//console.log('old: ',oldTiles, 'new: ', bombed);
		//curIndex ALWAYS increases, but bomb only does if we found 
		//the matching tile, tricky
		var bIndex = bombed.length,
			updateTiles = [],
			insertTiles = [];

		//go thru each new tile (bombed)
		while(--bIndex > -1) {
			//unoptimized version:
			var oIndex = oldTiles.length,
				found = false;
			//stop when we find it
			while(--oIndex > -1) {
				if(oldTiles[oIndex].mapIndex === bombed[bIndex].mapIndex) {
					var modifiedTile = colorHelpers.modifyOneTile(oldTiles[oIndex], bombed[bIndex]);
					updateTiles.push(modifiedTile);
					found = true;
					oIndex = -1;
				}
			}
			if(!found) {
				insertTiles.push(bombed[bIndex]);
			}
		}
		return {insert: insertTiles, update: updateTiles};
			// //if we haven't hit the beginning (-1) of the old index, look thru it
			// //console.log(bIndex, oIndex);
			// if(oIndex > -1) {
			// 	console.log(bombed[bIndex].mapIndex, oldTiles[oIndex].mapIndex);
			// 	//make sure they are the same tile before we modify any colors
			// 	if(oldTiles[oIndex].mapIndex === bombed[bIndex].mapIndex) {
			// 		console.log('modify');
			// 		//modify tile
			// 		var modifiedTile = colorHelpers.modifyOneTile(oldTiles[oIndex], bombed[bIndex]);
			// 		updateTiles.push(modifiedTile);
			// 		//console.log('modded');
			// 		oIndex--;
			// 	} else {
			// 		//if we made it here, we are out of olds, must add it
			// 		insertTiles.push(bombed[bIndex]);
			// 		// console.log('new');
			// 	}
			// 	//check if new old tile index is <= the next one
			// 	var lower = false;
			// 	while(!lower) {
			// 		if(oIndex < 0) {
			// 			//exit out so we can continue
			// 			lower = true;
			// 		} else {
			// 			//make sure there is a next bomb
			// 			if(bIndex > 0) {
			// 				if(oldTiles[oIndex].mapIndex <= bombed[bIndex-1].mapIndex) {
			// 					lower = true;
			// 				} else{
			// 					oIndex--;
			// 				}
			// 			}
			// 		}
			// 	}
			// } else {
			// 	insertTiles.push(bombed[bIndex]);
			// 	//console.log('newb');
			// }
		//}
	},

	modifyOneTile: function(tile, bomb)  {
		//AHHHH SO MANY POSSIBILITIES, stripping this down
		//there IS a pre-existing color
		//if the old one is a nobody (not owned)
		if(tile.color.owner === 'nobody') {
			//if the NEW one should be owner, then update tile and bomb curColor
			if(bomb.color.owner !== 'nobody') {
				tile.color = bomb.color;
				tile.curColor = bomb.curColor;
				return tile;
			}
			//new one should be modified -- if the opacity hasn't maxed out 
			else if(tile.color.a < 0.5 ) {
				var prevR = tile.color.r,
					prevG = tile.color.g,
					prevB = tile.color.b,
					prevA = tile.color.a;
				var weightA = prevA / 0.1,
					weightB = 1;
				var newR = Math.floor((weightA * prevR + weightB * bomb.color.r) / (weightA + weightB)),
					newG = Math.floor((weightA * prevG + weightB * bomb.color.g) / (weightA + weightB)),
					newB = Math.floor((weightA * prevB + weightB * bomb.color.b) / (weightA + weightB)),
					newA = Math.round((tile.color.a + 0.1) * 100) / 100,
					rgbString = 'rgba(' + newR + ',' + newG + ',' + newB + ',' + newA + ')';
				tile.color.r = newR;
				tile.color.g = newG;
				tile.color.b = newB;
				tile.color.a = newA;
				tile.curColor = rgbString;
				return tile;
			}
			//don't modify. change tile for sending out since maxed
			else {
				return tile;
			}
		}
		//old one is the OWNER, so just modify tile for user
		else {
			return tile;
		}
	},

	saveTiles: function(tiles, callback) {
		var num = tiles.update.length,
			cur = 0;
		var save = function() {
			console.log(tiles.update[cur]);
			tiles.update[cur].save(function(err,suc) {
				cur++;
				if(cur >= num) {
					insertNew();
				} else {
					save();
				}
			});
		};

		var insertNew = function() {
			colorModel.create(tiles.insert, function(err,suc) {
				callback(true);
			});
		};
		if(num > 0) {
			save();
		} else {
			insertNew();
		}
	},

	gameColorUpdate: function(newInfo, instanceName, callback) {
		//access our global game model for status updates
		gameModel
			.where('instanceName').equals(instanceName)
			.find(function (err, results) {
			if(err) {

			} else {
				//add tile count to our progress
				var result = results[0],
					oldCount = result.seedsDropped,
					newCount = oldCount + 1;
					oldColored = result.tilesColored,
					newColored = oldColored + newInfo.numBombs,
					oldPercent = Math.floor((oldCount / result.seedsDroppedGoal) * 100),
					newPercent = Math.floor((newCount / result.seedsDroppedGoal) * 100);
				//update leadeboard
				var oldBoard = result.leaderboard,
					gState = result.state,
					ob = oldBoard.length,
					found = false,
					updateBoard = false,
					newGuy = {
						name: newInfo.name,
						count: (newInfo.count + newInfo.numBombs)
					};

				//if this is the first player on the leadeboard, push em and update status
				if(ob === 0) {
					oldBoard.push(newGuy);
					updateBoard = true;
				} else {
					//if new guy exists, update him
					while(--ob > -1) {
						if(oldBoard[ob].name === newGuy.name) {
							oldBoard[ob].count = newGuy.count;
							found = true;
							updateBoard = true;
							continue;
						}
					}
					//add new guy
					if(!found) {
						//onlly add him if he deserves to be on there!
						if(oldBoard.length < 10 || newGuy.count > oldBoard[oldBoard.length-1]) {
							oldBoard.push(newGuy);
							updateBoard = true;
						}
					}
					//sort them
					oldBoard.sort(function(a, b) {
						return b.count-a.count;
					});
					//get rid of the last one if too many
					if(oldBoard.length > 10) {
						oldBoard.pop();
					}
				}

				//check if the world is fully colored
				if(newPercent > 99) {
					//change the game state
					//send out emails
					result.set('bossModeUnlocked', true);
					//colorHelpers.endGameEmails();
					newPercent = 100;
				}
				//save all changes
				result.set('seedsDropped', newCount);
				result.set('leaderboard', oldBoard);
				result.set('tilesColored', newColored);
				result.save();

				var returnInfo = {
					updateBoard: updateBoard,
					board: oldBoard,
					dropped: newCount,
					colored: newColored
				};
				callback(returnInfo);
			}
		});
	},

	endGameEmails: function() {
		//the world is fully colored, 
		//advance the game state to 2 = boss level
		//send out emails
		//get all emails from actors
		userModel
			.where('role').equals('actor')
			.select('email')
			.find(function (err, users) {
				if(err) {
					res(false);
				}
				else if(users) {
					var emailListLength = users.length,
						html = null,
						subject = null;
					emailUtil.openEmailConnection();
					for(emailIterator = 0; emailIterator < emailListLength; emailIterator++) {
						//not done
						if(users[emailIterator].game.currentLevel < 4) {
							html = '<h2 style="color:green;">Hey! You need to finish!</h2>';
							html+= '<p>Most of your peers have finished and you need to get back in there and help them out.</p>';
							subject = 'Come back.';

						} else {
							html = '<h2 style="color:green;">The Color has Returned!</h2>';
							html+= '<p>Great job everybody. You have successfully restored all the color to the world. You must log back in now to unlock your profile.</p>';
							subject = 'Breaking News!';
						}
						emailUtil.sendEmail(subject, html, users[emailIterator].email);
					}
					emailUtil.closeEmailConnection();
				}
			});
	}
};