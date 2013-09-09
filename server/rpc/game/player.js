var rootDir = process.cwd(),

	emailUtil = require(rootDir + '/server/utils/email'),
	colorHelpers = null,
	dbHelpers = null,

	_games = {},
	_service,
	_userModel,
	_tileModel,
	_gameModel,
	_colorModel;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	//req.use('account.authenticated');

	return {
		// MUST MAKE IT SO YOU CAN ONLY INIT ONCE PER SESSION
		init: function() {

			// load models and database _service only once
			if(!_service) {
				_service = ss.service;
				_userModel = _service.useModel('user', 'ss');
				_tileModel = _service.useModel('tile', 'ss');
				_gameModel = _service.useModel('game', 'ss');
				_colorModel = _service.useModel('color', 'ss');
			}

				playerInfo = {
					id: req.session.userId,
					firstName: req.session.firstName,
					game: null
				};

			dbHelpers.getUserGameInfo(req.session.userId, function(game) {
				if(game) {
					playerInfo.game = game;	
					if(!_games[playerInfo.game.instanceName]) {
						console.log('create! the game baby');
						_games[playerInfo.game.instanceName] = {};
					}

					_games[req.session.game.instanceName][playerInfo.id] = playerInfo;
					var numActivePlayers = Object.keys(_games[playerInfo.game.instanceName]).length;
					
					console.log('initializing ', playerInfo.name, 'players: ', numActivePlayers);

					res(playerInfo);
					
				} else {
					res(false);
				}
			});
		},

		tellOthers: function(info) {
			// send the number of active players and the new player info
			var numActivePlayers = Object.keys(_games[req.session.game.instanceName]).length;
			ss.publish.channel(req.session.game.instanceName, 'ss-addPlayer', {num: numActivePlayers, info: info});
		},

		exitPlayer: function(id, name) {
			//update redis
			//req.session.game = info;
			//req.session.save();
			//update mongo
			if(id) {
				_userModel.findById(id, function (err, user) {
					if(err) {
						console.log(err);
					} else if(user) {
						if(user.activeSessionID && user.activeSessionID === req.sessionId) {
							user.set({ activeSessionID: null });
						}
						delete _games[req.session.game.instanceName][id];
						var numActivePlayers = Object.keys(_games[req.session.game.instanceName]).length;
						ss.publish.channel(req.session.game.instanceName,'ss-removePlayer', {num: numActivePlayers, id: id});
						if(name === 'Demo' && req.session.email.indexOf('demo') > -1) {
							user.game.currentLevel = 0;
							user.game.position.x = 64;
							user.game.position.y = 77;
							user.game.resources = {};
							user.game.resourcesDiscovered = 0;
							user.game.inventory = [];
							user.game.seeds.regular = 0;
							user.game.seeds.draw = 0;
							user.game.seeds.dropped = 0;
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
			} else {
				res();
			}
		},

		getOthers: function() {
			_userModel
				.where('activeSessionID').ne(null)
				.select('id firstName game.tilesColored game.rank game.currentLevel game.position game.colorInfo')
				.find(function (err, users) {
					if(err) {
						console.log('error', err);
					} else {
						res(users);
					}
				});
		},

		// ------> this should be moved into our map rpc handler???
		getMapData: function(x1,y1,x2,y2) {
			_tileModel
				.where('x').gte(x1).lt(x2)
				.where('y').gte(y1).lt(y2)
				.sort('mapIndex')
				.find(function (err, allTiles) {
					if(err) {
						res(false);
					} else if(allTiles) {
						_colorModel
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
			_games[req.session.game.instanceName][info.id].game.position.x = info.position.x;
			_games[req.session.game.instanceName][info.id].game.position.y = info.position.y;
			dbHelpers.saveInfo(info);
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
			_colorModel
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

							colorHelpers.gameColorUpdate(newInfo, info.instanceName, function(updates, gameOver) {
								if(updates.updateBoard) {
									ss.publish.channel(info.instanceName,'ss-leaderChange', {board: updates.board, name: newInfo.name});
								}
								ss.publish.channel(info.instanceName,'ss-progressChange', {dropped: updates.dropped});
								//FINNNALLY done updating and stuff, respond to the player
								//telling them if it was sucesful
								if(gameOver) {
									ss.publish.channel(req.session.game.instanceName, 'ss-bossModeUnlocked');
								}
								res(allTiles.length, bonus);
							});

							dbHelpers.saveInfo({id: info.id, tilesColored: info.tilesColored});
						});
					}
				});
		},

		getInfo: function(id) {
			_userModel.findById(id, function (err, user) {
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
			_gameModel
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
			_userModel
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

		unlockProfile: function() {
			_userModel.findById(id, function (err, user) {
				if(!err && user) {
					user.game = info;
					user.profileUnlocked = true;
					user.save(function (err,ok) {
						if(err) {
							console.log(err);
							res(true);
						} else {
							res(false);
						}
					});
				} else {
					res(true);
					// MIGHT NEED TO DO THIS HERE STILL???
					// ss.publish.channel(req.session.game.instanceName,'ss-removePlayer', numActivePlayers, id);
				}
			});
		},

		gameOver: function(id) {
			//update redis
			// req.session.game = info;
			//req.session.profileSetup = true;
			// console.log('exit: ', info);
			req.session.save();
			//update mongo
			_userModel.findById(id, function (err, user) {
				if(!err && user) {
					user.game = info;
					user.profileUnlocked = true;
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
			_userModel.findById(info.id, function (err, user) {
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
			// console.log(info);
			_userModel
				.findById(info.id, function (err, user) {
					if(err) {
						console.log(err);
					} else if(user) {
						//first we save the new resource
						if(user.game.resources[info.index]) {
							//TODO must use lookupIndex here
							user.game.resources[info.index].answers = info.resource.answers;
							user.game.resources[info.index].attempts = info.resource.attempts;
							user.game.resources[info.index].result = info.resource.result;
						} else {
							user.game.resources.push(info.resource);
						}
						//now we update the inventory and resourcesDiscovered
						user.game.inventory = info.inventory;
						user.game.resourcesDiscovered = info.resourcesDiscovered;
						//console.log(user.game.resources);
						user.save(function(err,suc) {
							if(err) {
								console.log('err');
							} else {
								console.log('successs');
							}
						});
					}
				});
		},

		updateGameInfo: function(info) {
			dbHelpers.saveInfo(info);
		},

		getRandomResumes: function(info) {
			_userModel
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
		},

		beam: function(info) {
			ss.publish.channel(req.session.game.instanceName,'ss-beam', info);
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
			_colorModel.create(tiles.insert, function(err,suc) {
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
		_gameModel
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
					console.log('game over!');
					//send out emails
					colorHelpers.endGameEmails(instanceName);
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
				callback(returnInfo, true);
			}
		});
	},

	endGameEmails: function(instanceName) {
		//set boss mode unlocked here for specific instance

		//send out emails to players who have completed game
		_userModel
			.where('role').equals('actor')
			.where('game.instanceName').equals(instanceName)
			.select('email game.currentLevel')
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
						//TODO remove this check
						if(users[emailIterator].email.length > 6) {
							emailUtil.sendEmail(subject, html, users[emailIterator].email);
						}
					}
					emailUtil.closeEmailConnection();
				}
			});
	}
};

dbHelpers = {
	saveInfo: function(info) {
		if(info && info.id) {
			_userModel.findById(info.id, function (err, user) {
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
		}
	},

	saveFeedback: function(info, index) {
		_userModel.findById(info[index].id, function(err,user) {
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
	},

	getUserGameInfo: function(id, callback) {
		_userModel.findById(id, function(err,user) {
			if(err) {
				callback(false);
			} else if(user) {
				callback(user.game);
			}
		});	
	}
 };