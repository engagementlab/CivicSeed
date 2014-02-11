var rootDir = process.cwd(),

	emailUtil = require(rootDir + '/server/utils/email'),
	colorHelpers = null,
	dbHelpers = null,

	// _games = {},
	_service,
	_userModel,
	_tileModel,
	_gameModel,
	_colorModel;

exports.actions = function (req, res, ss) {

	req.use('session');
	// req.use('debug');
	//req.use('account.authenticated');

	return {
		// MUST MAKE IT SO YOU CAN ONLY INIT ONCE PER SESSION
		init: function () {

			// load models and database _service only once
			if (!_service) {
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

			dbHelpers.getUserGameInfo(req.session.userId, function (game) {
				if (game) {
					playerInfo.game = game;
					console.log('initializing ', playerInfo.firstName);
					res(playerInfo);

				} else {
					res(false);
				}
			});
		},

		tellOthers: function (info) {
			//send player info to all others
			ss.publish.channel(req.session.game.instanceName, 'ss-addPlayer', {info: info});
		},

		exitPlayer: function (id, name) {
			if (id) {
				_userModel.findById(id, function (err, user) {
					if (err) {
						console.log(err);
					} else if (user) {
						if (user.activeSessionID && user.activeSessionID === req.sessionId) {
							user.set({ activeSessionID: null });
						}
						ss.publish.channel(req.session.game.instanceName,'ss-removePlayer', {id: id, name: name});

						//if demo user reset all data
						if (name === 'Demo' && req.session.email.indexOf('demo') > -1) {
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

		getOthers: function () {
			//find out who else is playing and get their data
			_userModel
				.where('activeSessionID').ne(null)
				.where('game.instanceName').equals(req.session.game.instanceName)
				.select('id firstName game.tilesColored game.rank game.currentLevel game.position game.skinSuit')
				.find(function (err, users) {
					if (err) {
						console.log('error', err);
					} else {
						res(users);
					}
				});
		},

		getMapData: function (x1,y1,x2,y2) {
			_tileModel
				.where('x').gte(x1).lt(x2)
				.where('y').gte(y1).lt(y2)
				.sort('mapIndex')
				.find(function (err, allTiles) {
					if (err) {
						res(false);
					} else if (allTiles) {
						_colorModel
							.where('instanceName').equals(req.session.game.instanceName)
							.where('x').gte(x1).lt(x2)
							.where('y').gte(y1).lt(y2)
							.sort('mapIndex')
							.find(function (err, colorTiles) {
								if (err) {
									res(false);
								} else if (colorTiles) {
									res(allTiles, colorTiles);
								}
							});
					}
				});
		},

		movePlayer: function (moves, id) {
			//send out the moves to everybody
			ss.publish.channel(req.session.game.instanceName,'ss-playerMoved', {moves: moves, id: id});
			res(true);
		},

		savePosition: function (info) {
			dbHelpers.saveInfo(info);
		},

		dropSeed: function (bombed, info) {
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
					if (err) {
						res(false);
					} else if (oldTiles) {
						var newTiles = null;
						if (oldTiles.length > 0) {
							newTiles = colorHelpers.modifyTiles(oldTiles, bombed);
						} else {
							newTiles = bombed;
						}
						//saveEach tile
						colorHelpers.saveTiles(newTiles, function () {
							//only do updating stuff if new tiles
							if (newTiles.length > 0) {
								//send out new bombs AND player info to update score
								var numBombsScaled = Math.ceil(newTiles.length / 9);
								var newTileCount = info.tilesColored + newTiles.length;

								var sendData = {
									bombed: newTiles,
									id: info.id,
									tilesColored: newTileCount
								};
								// //we are done,send out the color information to each client to render
								ss.publish.channel(info.instanceName,'ss-seedDropped', sendData);

								var newInfo = {
									name: info.name,
									newCount: newTileCount,
									numBombs: numBombsScaled
								};

								colorHelpers.gameColorUpdate(newInfo, info.instanceName, function (updates, gameOver) {
									if (updates.updateBoard) {
										ss.publish.channel(info.instanceName,'ss-leaderChange', {board: updates.board, name: newInfo.name});
									}
									ss.publish.channel(info.instanceName,'ss-progressChange', {dropped: updates.dropped});
									//FINNNALLY done updating and stuff, respond to the player
									//telling them if it was sucesful
									if (gameOver) {
										ss.publish.channel(req.session.game.instanceName, 'ss-bossModeUnlocked');
									}
									res(newTiles.length);
								});
								dbHelpers.saveInfo({id: info.id, tilesColored: info.tilesColored});
							} else {
								res(0);
							}
						});
					}
				});
		},

		getInfo: function (id) {
			_userModel.findById(id, function (err, user) {
				if (err) {
					res('user not found');
				} else {
					var data = {
						tilesColored: user.game.tilesColored,
						level: user.game.currentLevel,
						rank: user.game.rank,
						name: user.name
					};
					res(data);
				}
			});
		},

		getGameInfo: function () {
			_gameModel
				.where('instanceName').equals(req.session.game.instanceName)
				.find(function (err, result) {
					if (err) {
						console.log(err);
					}
					else{
						res(result[0]);
					}
			});
		},

		getAllImages: function (id) {
			var maps = [];
			_userModel
				.where('role').equals('actor')
				.where('game.instanceName').equals(req.session.game.instanceName)
				.select('game.colorMap _id')
				.find(function (err, users) {
					if (err) {
						console.log(err);
					} else {
						for(var i = 0; i < users.length; i +=1) {
							var map = users[i].game.colorMap;
							if (map && id != users[i]._id) {
								maps.push(users[i].game.colorMap);
							}
						}
						res(maps);
					}
			});
		},

		levelChange: function (id, level) {
			ss.publish.channel(req.session.game.instanceName,'ss-levelChange',{id: id, level: level});
		},

		statusUpdate: function (msg) {
			ss.publish.channel(req.session.game.instanceName,'ss-statusUpdate', msg);
		},

		unlockProfile: function (id) {
			_userModel.findById(id, function (err, user) {
				if (!err && user) {
					user.profileUnlocked = true;
					user.save(function (err,ok) {
						if (err) {
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

		gameOver: function (id) {
			//update redis
			// req.session.game = info;
			//req.session.profileSetup = true;
			// console.log('exit: ', info);
			req.session.save();
			//update mongo
			_userModel.findById(id, function (err, user) {
				if (!err && user) {
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

		pledgeSeed: function (info) {
			// console.log(info);
			_userModel.findById(info.id, function (err, user) {
				if (err) {
					console.log(err);
				} else if (user) {
					//find resource, update seeded number
					var found = false,
						intNpc = parseInt(info.npc, 10);
					for(var r = 0; r < user.game.resources.length; r++) {
						if ((user.game.resources[r].index === intNpc) && !found) {
							found = true;
							user.game.seeds.regular += 3;
							user.game.resources[r].seeded.push(info.pledger);
							break;
						}
					}
					if (found) {
						user.save(function (err,suc) {
							res(true);
							ss.publish.channel(req.session.game.instanceName,'ss-seedPledged', info);

						});
					} else {
						res(false);
					}
				}
			});
		},

		saveResource: function (info) {
			// console.log(info);
			_userModel
				.findById(info.id, function (err, user) {
					if (err) {
						console.log(err);
					} else if (user) {
						//first we save the new resource
						if (user.game.resources[info.index]) {
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
						user.save(function (err,suc) {
							if (err) {
								console.log('err');
							} else {
								// console.log('successs');
							}
						});
					}
				});
		},

		updateGameInfo: function (info) {
			dbHelpers.saveInfo(info);
		},

		getRandomResumes: function (info) {
			_userModel
				.where('role').equals('actor')
				.where('game.instanceName').equals(info.instanceName)
				.select('game.resume')
				.find(function (err,results) {
					if (err) {
						console.log(err);
					} else if (results) {
						res(results);
					}
				});
		},

		resumeFeedback: function (info) {
			dbHelpers.saveFeedback(info, 0);
		},

		beam: function (info) {
			ss.publish.channel(req.session.game.instanceName,'ss-beam', info);
		},

		collaborativeChallenge: function () {
			//get all active players locations
			_userModel
				.where('role').equals('actor')
				.where('activeSessionID').ne(null)
				.where('game.instanceName').equals(req.session.game.instanceName)
				.select('game.position game.collaborativeChallenge _id game.seeds')
				.find(function (err,results) {
					if (err) {
						console.log(err);
						res(err);
					} else if (results) {
						//see if they are in the magic spot for this level (hard coded right now)
						var count = 0,
							ids = [];
						for(var i = 0; i < results.length; i++) {
							var pos = results[i].game.position;
							if (pos.x > 4 && pos.x < 17 && pos.y > 8 && pos.y < 12) {
								//add them to bonus list if in cave and not done one yet
								count++;
								if (!results[i].game.collaborativeChallenge) {
									ids.push(i);
								}
							}
						}
						//if more than 1 person showed up, reward them
						var playerIds = [];
						if (count > 1) {
							for(var d = 0; d < ids.length; d++) {
								playerIds.push(results[ids[d]]._id);
								results[ids[d]].game.collaborativeChallenge = true;
								results[ids[d]].game.seeds.draw += count * 50;
								results[ids[d]].save();
							}
							res();
							ss.publish.channel(req.session.game.instanceName, 'ss-collaborativeChallenge', {players: playerIds, seeds: count * 50});
						} else {
							res('not enough');
						}
					}
				});
		},

		changeSkinSuit: function (info) {
			dbHelpers.saveInfo(info);
			ss.publish.channel(req.session.game.instanceName,'ss-skinSuitChange', info);
		}
	};
};

colorHelpers = {
	modifyTiles: function (oldTiles, bombed) {
		//curIndex ALWAYS increases, but bomb only does if we found
		//the matching tile, tricky
		var bIndex = bombed.length,
			insertTiles = [];

		//go thru each new tile (bombed)
		while(--bIndex > -1) {
			//unoptimized version:
			var oIndex = oldTiles.length,
				found = false;
			//stop when we find it
			while(--oIndex > -1) {
				if (oldTiles[oIndex].mapIndex === bombed[bIndex].mapIndex) {
					found = true;
					oIndex = -1;
				}
			}
			if (!found) {
				insertTiles.push(bombed[bIndex]);
			}
		}
		return insertTiles;
	},

	saveTiles: function (tiles, callback) {
		var save = function () {
			_colorModel.create(tiles, function (err,suc) {
				callback();
			});
		};
		if (tiles.length > 0) {
			save();
		} else {
			callback();
		}
	},

	gameColorUpdate: function (newInfo, instanceName, callback) {
		//access our global game model for status updates
		_gameModel
			.where('instanceName').equals(instanceName)
			.find(function (err, results) {
			if (err) {
				console.log('error finding instance');
			} else {
				//add tile count to our progress
				var result = results[0],
					oldCount = result.seedsDropped,
					newCount = oldCount + newInfo.numBombs,
					bossModeUnlocked = result.bossModeUnlocked,
					seedsDroppedGoal = result.seedsDroppedGoal;

				//update leadeboard
				var oldBoard = result.leaderboard,
					ob = oldBoard.length,
					found = false,
					updateBoard = false,
					newGuy = {
						name: newInfo.name,
						count: newInfo.newCount
					};


				//if this is the first player on the leadeboard, push em and update status
				if (ob === 0) {
					oldBoard.push(newGuy);
					updateBoard = true;
				} else {
					//if new guy exists, update him
					while(--ob > -1) {
						if (oldBoard[ob].name === newGuy.name) {
							oldBoard[ob].count = newGuy.count;
							found = true;
							updateBoard = true;
							continue;
						}
					}
					//add new guy
					if (!found) {
						//onlly add him if he deserves to be on there!
						if (oldBoard.length < 10 || newGuy.count > oldBoard[oldBoard.length-1]) {
							oldBoard.push(newGuy);
							updateBoard = true;
						}
					}
					//sort them
					oldBoard.sort(function (a, b) {
						return b.count-a.count;
					});
					//get rid of the last one if too many
					if (oldBoard.length > 10) {
						oldBoard.pop();
					}
				}

				//check if the world is fully colored
				var gameisover = false;
				if (newCount >= seedsDroppedGoal && !bossModeUnlocked && instanceName !== 'demo') {
					//change the game state
					result.set('bossModeUnlocked', true);
					console.log('game over!');
					//send out emails
					gameisover = true;
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
				callback(returnInfo, gameisover);
			}
		});
	},

	endGameEmails: function (instanceName) {
		//set boss mode unlocked here for specific instance

		//send out emails to players who have completed game
		_userModel
			.where('role').equals('actor')
			.where('game.instanceName').equals(instanceName)
			.select('email game.currentLevel')
			.find(function (err, users) {
				if (err) {
					res(false);
				}
				else if (users) {
					var emailListLength = users.length,
						html = null,
						subject = null;
					emailUtil.openEmailConnection();
					for(emailIterator = 0; emailIterator < emailListLength; emailIterator++) {
						//not done
						if (users[emailIterator].game.currentLevel < 4) {
							html = '<h2 style="color:green;">Hey! You need to finish!</h2>';
							html+= '<p>Most of your peers have finished and you need to get back in there and help them out.</p>';
							subject = 'Update!';

						} else {
							html = '<h2 style="color:green;">The Color has Returned!</h2>';
							html+= '<p>Great job everybody. You have successfully restored all the color to the world. You must log back in now to unlock your profile.</p>';
							subject = 'Breaking News!';
						}
						//TODO remove this check (this is to not send out test player emails?)
						if (users[emailIterator].email.length > 6) {
							emailUtil.sendEmail(subject, html, users[emailIterator].email);
						}
					}
					emailUtil.closeEmailConnection();
				}
			});
	}
};

dbHelpers = {
	saveInfo: function (info) {
		if (info && info.id) {
			_userModel.findById(info.id, function (err, user) {
				if (err) {
					console.log(err);
				} else if (user) {
					for(var prop in info) {
						if (prop !== 'id') {
							user.game[prop] = info[prop];
						}
					}
					user.save();
				}
			});
		}
	},

	saveFeedback: function (info, index) {
		_userModel.findById(info[index].id, function (err,user) {
			if (err) {
				console.log(err);
			} else if (user) {
				user.game.resumeFeedback.push({comment: info[index].comment, resumeIndex: index});
				user.save(function (err,okay) {
					//keep savin til we aint got none
					index++;
					if (index < info.length) {
						dbHelpers.saveFeedback(info,index);
					}
				});
			}
		});
	},

	getUserGameInfo: function (id, callback) {
		_userModel.findById(id, function (err,user) {
			if (err) {
				callback(false);
			} else if (user) {
				callback(user.game);
			}
		});
	}
 };