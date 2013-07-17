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
	colorHelpers = null,
	dbHelpers = null;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	//req.use('account.authenticated');

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

		exitPlayer: function(id, name) {
			//update redis
			//req.session.game = info;
			//req.session.save();
			//update mongo
			userModel
				.findById(id, function (err, user) {
					if(err) {
						console.log(err);
					} else if(user) {
						games[req.session.game.instanceName].numActivePlayers -= 1;
						ss.publish.channel(req.session.game.instanceName,'ss-removePlayer', {num: games[req.session.game.instanceName].numActivePlayers, id: id});
						delete games[req.session.game.instanceName].players[id];
						user.isPlaying = false;
						if(name === 'Demo U') {
							user.game.currentLevel = 0;
							user.game.position.x = 64;
							user.game.position.y = 77;
							user.game.resources = {};
							user.game.resourcesDiscovered = 0;
							user.game.inventory = [];
							user.game.seeds.regular = 0;
							user.game.seeds.draw = 0;
							user.game.seeds,dropped = 0;
							user.game.botanistState = 0;
							user.game.firstTime = true;
							user.game.resume = [];
							user.game.seenRobot = false;
							user.game.playingTime = 0;
							user.game.tilesColored = 0;
							user.game.pledges = 5;
						}
						user.save();
						res();
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

		dropSeed: function(bombed, info) {
			// console.log('info',info);
			//welcome to the color server!
			var num = bombed.length,
				curOld = 0,
				index = 0,
				minX = info.x1,
				maxX = info.x2,
				minY = info.y1,
				maxY = info.y2,
				allTiles = null,
				updateTiles = [],
				insertTiles = [];

			//get a chunk of the bounding tiles from the DB (instead of querying each individually)
			colorModel
				.where('instanceName').equals(info.instanceName)
				.where('x').gte(minX).lte(maxX)
				.where('y').gte(minY).lte(maxY)
				.sort('mapIndex')
				.find(function (err, oldTiles) {
					// console.log(oldTiles);
					if(err) {
						res(false);
					} else if(oldTiles) {
						//console.log('oldTiles: ', oldTiles);
						var modifiedTiles = null;
						if(oldTiles.length > 0) {
							modifiedTiles = colorHelpers.modifyTiles(oldTiles, bombed);
							// console.log(modifiedTiles.insert.length);
							// console.log(modifiedTiles.update.length);
						} else {
							modifiedTiles = {
								insert: bombed,
								update: []
							};
						}
						//saveEach tile
						colorHelpers.saveTiles(modifiedTiles, function(done) {
							var bonus = modifiedTiles.update.length > 0 ? true : false;
							allTiles = modifiedTiles.insert.concat(modifiedTiles.update);
							//send out new bombs AND player info to update score
							var numNewTilesScaled = Math.ceil(allTiles.length / 9);
							var newTileCount = info.tilesColored + allTiles.length;
							if(bonus) {
								var chance = Math.random();
								var addBonus = chance < 0.1 ? true : false;
								if(addBonus) {
									newTileCount += 10;
								} else {
									bonus = false;
								}
							}
							var sendData = {
								bombed: allTiles,
								id: info.id,
								tilesColored: newTileCount
							};
							// //we are done,send out the color information to each client to render
							ss.publish.channel(info.instanceName,'ss-seedDropped', sendData);

							var newInfo = {
								name: info.name,
								numBombs: numNewTilesScaled,
								newCount: newTileCount
							};

							colorHelpers.gameColorUpdate(newInfo, info.instanceName, function(updates) {
								if(updates.updateBoard) {
									ss.publish.channel(info.instanceName,'ss-leaderChange', {board: updates.board, name: newInfo.name});
								}
								ss.publish.channel(info.instanceName,'ss-progressChange', {dropped: updates.dropped});
								//FINNNALLY done updating and stuff, respond to the player
								//telling them if it was sucesful
								res(allTiles.length, bonus);
							});

							dbHelpers.saveInfo({id: info.id, tilesColored: info.tilesColored});
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

		gameOver: function(id) {
			//update redis
			// req.session.game = info;
			//req.session.profileSetup = true;
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
			// console.log(info);
			userModel.findById(info.id, function (err, user) {
				if(err) {

				} else if(user) {
					//find resource, update seeded number
					if(user.game.resources[info.npc]) {
						user.game.seeds.riddle += 1;
						user.game.resources[info.npc].seeded.push(info.pledger);
						user.save(function (err,suc) {
							res(true);
							ss.publish.channel(req.session.game.instanceName,'ss-seedPledged', info);
						});
					}
					else {
						res(false);
					}
				}
			});
		},

		saveResource: function(info) {
			//console.log(info);
			userModel
				.findById(info.id, function (err, user) {
					if(err) {
						console.log(err);
					} else if(user) {
						var npc = info.index;
						// //hack cuz game doesn't start with resource object...
						if(!user.game.resources) {
							user.game.resources = {};
						}
						
						//first we save the new resource
						if(user.game.resources[npc]) {
							user.game.resources[npc].answers = info.resource.answers;
							user.game.resources[npc].attempts = info.resource.attempts;
							user.game.resources[npc].result = info.resource.result;
						} else {
							user.game.resources[npc] = info.resource;
						}
						//now we update the inventory and resourcesDiscovered
						user.game.inventory = info.inventory;
						user.game.resourcesDiscovered = info.resourcesDiscovered;
						user.save();
					}
				});
		},

		updateGameInfo: function(info) {
			dbHelpers.saveInfo(info);
		},

		getRandomResumes: function(info) {
			userModel
				.where('role').equals('actor')
				.where('game.instanceName').equals(info.instanceName)
				.select('game.resume')
				.find(function(err,results) {
					if(err) {
						console.log(err);
					} else if(results) {
						res(results);
					}
				});
		},

		resumeFeedback: function(info) {	
			dbHelpers.saveFeedback(info, 0);
		}
	};
};

colorHelpers = {
	modifyTiles: function(oldTiles, bombed) {
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
	},

	modifyOneTile: function(tile, bomb)  {
		//if we it exists we have to modify
		if(tile.color) {
			//perform a dominant override if not at max opacity
			if(tile.color.a < 0.5 ) {
				var prevR = tile.color.r,
					prevG = tile.color.g,
					prevB = tile.color.b,
					prevA = tile.color.a;
				var weightOld = 0.2,
					weightNew = 0.8;
				var newR = Math.floor(weightOld * prevR + weightNew * bomb.color.r);
					newG = Math.floor(weightOld * prevG + weightNew * bomb.color.g),
					newB = Math.floor(weightOld * prevB + weightNew * bomb.color.b),
					newA = Math.round((tile.color.a + 0.1) * 100) / 100,
					rgbString = 'rgba(' + newR + ',' + newG + ',' + newB + ',' + newA + ')';
				tile.color.r = newR;
				tile.color.g = newG;
				tile.color.b = newB;
				tile.color.a = newA;
				tile.curColor = rgbString;
				return tile;
			} else {
				return tile;
			}
		} else {
			return tile;
		}
	},

	saveTiles: function(tiles, callback) {
		var num = tiles.update.length,
			cur = 0;
		var save = function() {
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
					newCount = oldCount + newInfo.numBombs;
					seedsDroppedGoal = result.seedsDroppedGoal;
				
				//update leadeboard
				var oldBoard = result.leaderboard,
					gState = result.state,
					ob = oldBoard.length,
					found = false,
					updateBoard = false,
					newGuy = {
						name: newInfo.name,
						count: newInfo.newCount
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
				if(newCount >= seedsDroppedGoal && instanceName !== 'demo') {
					//change the game state
					result.set('bossModeUnlocked', true);
					ss.publish.channel(req.session.game.instanceName, 'ss-bossModeUnlocked');
					//send out emails
					colorHelpers.endGameEmails();
				}
				//save all changes
				result.set('seedsDropped', newCount);
				result.set('leaderboard', oldBoard);
				result.save();

				var returnInfo = {
					updateBoard: updateBoard,
					board: oldBoard,
					dropped: newCount
				};
				callback(returnInfo);
			}
		});
	},

	endGameEmails: function() {
		//set boss mode unlocked here for specific instance

		//send out emails to players who have completed game
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
							subject = 'Update!';

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

dbHelpers = {
	saveInfo: function(info) {
		userModel
			.findById(info.id, function (err, user) {
				if(err) {
					console.log(err);
				} else if(user) {
					for(var prop in info) {
						if(prop !== 'id') {
							user.game[prop] = info[prop];
						}
					}
					user.save();
				}
			});
	},

	saveFeedback: function(info, index) {
		userModel.findById(info[index].id, function(err,user) {
			if(err) {
				console.log(err);
			} else if(user) {
				user.game.resumeFeedback.push({comment: info[index].comment, resumeIndex: index});
				user.save(function(err,okay) {
					//keep savin til we aint got none
					index++;
					if(index < info.length) {
						dbHelpers.saveFeedback(info,index);
					}
				});
			}
		});
	}
 };