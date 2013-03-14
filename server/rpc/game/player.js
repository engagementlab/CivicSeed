var intervalId = {},
	numActivePlayers = 0,
	players = {},
	service,
	db,
	userModel,
	tileModel,
	gameModel,
	rootDir = process.cwd(),
	emailUtil = require(rootDir + '/server/utils/email'),
	colorHelpers = null;

exports.actions = function(req, res, ss) {

	req.use('session');
	req.use('debug');
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
			ss.publish.all('ss-addPlayer',numActivePlayers, playerInfo);
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

					} else if(user) {
						user.game = info;
						user.save(function (y) {
							numActivePlayers -= 1;
							ss.publish.all('ss-removePlayer', numActivePlayers, id);
							delete players[id];
							res(true);
						});
					} else {
						// MIGHT NEED TO DO THIS HERE STILL???
						// ss.publish.all('ss-removePlayer', numActivePlayers, id);
					}
				});
		},

		getOthers: function() {
			res(players);
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
						res(allTiles);
					}
				});
		},

		movePlayer: function(moves, id) {
			//send out the moves to everybody
			ss.publish.all('ss-playerMoved', moves, id);
			res(true);
		},

		savePosition: function(info) {
			players[info.id].game.position.x = info.x;
			players[info.id].game.position.y = info.y;
			req.session.game = info;
		},

		dropSeed: function(bombed, info) {
			//welcome to the color server!
			var num = bombed.length,
				curOld = 0,
				index = 0,
				minX = info.x,
				maxX = info.x + info.sz,
				minY = info.y,
				maxY = info.y + info.sz;

			//get a chunk of the bounding tiles from the DB (instead of querying each individually)
			tileModel
				.where('x').gte(minX).lt(maxX)
				.where('y').gte(minY).lt(maxY)
				.select('x y color curColor')
				.sort('mapIndex')
				.find(function (err, oldTiles) {
				if(err) {
					res(false);
				} else if(oldTiles) {
					colorHelpers.modifyTiles(oldTiles, bombed, function(newTiles, newBombs) {
						//saveEach tile
						colorHelpers.saveTiles(newTiles, function() {
							//send out new bombs AND player info to update score
							var newTileCount = info.tilesColored + newBombs.length,
							sendData = {
								bombed: newBombs,
								id: info.id,
								tilesColored: newTileCount
							};
							//we are done,send out the color information to each client to render
							ss.publish.all('ss-seedDropped', sendData);

							var newInfo = {
								name: info.name,
								numBombs: newBombs.length,
								count: info.tilesColored
							};

							colorHelpers.gameColorUpdate(newInfo, function(updates) {
								if(updates.updateBoard) {
									ss.publish.all('ss-leaderChange', updates.oldBoard, newInfo.name);
								}
								ss.publish.all('ss-progressChange', {dropped: updates.dropped, colored: updates.colored});
								//FINNNALLY done updating and stuff, respond to the player
								//telling them if it was sucesful
								res(newBombs.length);
							});
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
			userModel
				.where('role').equals('actor')
				.select('game.colorMap')
				.find(function(err, users) {
					if(err) {
						console.log('issue');
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
			ss.publish.all('ss-levelChange', id, level);
		},

		statusUpdate: function(msg) {
			ss.publish.all('ss-statusUpdate', msg);
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
					user.profileSetup = true;
					user.save(function (y) {
						var url = '/profiles/' + req.session.firstName + '.' + req.session.lastName;
						res(url);
					});
				} else {
					// MIGHT NEED TO DO THIS HERE STILL???
					// ss.publish.all('ss-removePlayer', numActivePlayers, id);
				}
			});
		}
	};
};

colorHelpers = {

	modifyTiles: function(oldTiles, bombed, callback) {
		//curIndex ALWAYS increases, but bomb only does if we found 
		//the matching tile, tricky
		var curIndex = 0,
			bombIndex = 0,
			newTiles = [],
			newBombs = [];

		var mod = function() {
			//make sure they are the same tile before we modify any colors
			if(oldTiles[curIndex].x === bombed[bombIndex].x && oldTiles[curIndex].y === bombed[bombIndex].y) {
				colorHelpers.modifyOneTile(oldTiles[curIndex], bombed[bombIndex], function(newTile, newBomb) {
					//increase the current spot in the tiles from db regardless
					curIndex++;
					bombIndex++;
					newTiles.push(newTile);
					newBombs.push(newBomb);
					if(curIndex >= oldTiles.length) {
							callback(newTiles, newBombs);
					} else {
						mod();
					}
				});
			} else {
				curIndex++;
				if(curIndex >= oldTiles.length) {
						callback(newTiles, newBombs);
				} else {
					mod();
				}
			}
		};
		mod();
	},

	modifyOneTile: function(tile, bomb, callback)  {
		//AHHHH SO MANY POSSIBILITIES, stripping this down
		//there IS a pre-existing color
		if(tile.color.owner !== undefined) {
			//if the old one is a nobody (not owned)
			if(tile.color.owner === 'nobody') {
				//if the NEW one should be owner, then update tile and bomb curColor
				if(bomb.color.owner !== 'nobody') {
					var rgbString0 = 'rgba(' + bomb.color.r + ',' + bomb.color.g + ',' + bomb.color.b + ',' + bomb.color.a  + ')';
					bomb.curColor = rgbString0;
					tile.set({
						color: bomb.color,
						curColor: rgbString0
					});
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
						newB = Math.floor((weightA * prevB + weightB * bomb.color.b) / (weightA + weightB));
					bomb.color.a = Math.round((tile.color.a + 0.1) * 100) / 100,
					bomb.color.r = newR,
					bomb.color.g = newG,
					bomb.color.b = newB;
					var rgbString1 = 'rgba(' + newR + ',' + newG + ',' + newB + ',' + bomb.color.a + ')';
					tile.set({
						color: bomb.color,
						curColor: rgbString1
					});
					bomb.curColor = rgbString1;
				}
				//don't modify. change bomb for sending out since maxed
				else {
					bomb.color = tile.color;
					bomb.curColor = tile.color;
				}
			}
			//old one is the OWNER, so just modify bomb for user
			else {
				bomb.color = tile.color;
				bomb.curColor = tile.curColor;
			}
		}
		//no color, add it to tile
		else {
			var rgbString2 = 'rgba(' + bomb.color.r + ',' + bomb.color.g + ',' + bomb.color.b + ',' + bomb.color.a  + ')';
			tile.set({
				color: bomb.color,
				curColor: rgbString2
			});
			bomb.curColor = rgbString2;
		}

		//now that we have exhausted everything, shall we return this?
		callback(tile,bomb);
	},

	saveTiles: function(tiles, callback) {
		var cur = 0;
		var saveMe = function() {
			tiles[cur].save(function(err, result) {
				if(err) {

				} else if(result) {
					cur++;
					if(cur >= tiles.length) {
						callback();
					} else{
						saveMe();
					}
				}
			});
		};
		saveMe();
	},

	gameColorUpdate: function(newInfo, callback) {
		//access our global game model for status updates
		gameModel.findOne({}, function (err, result) {
			if(err) {

			} else {
				//add tile count to our progress
				var oldCount = result.seedsDropped,
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
						if(oldBoard.length < 5 || newGuy.count > oldBoard[oldBoard.length-1]) {
							oldBoard.push(newGuy);
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

				//check if the world is fully colored
				if(newPercent > 99) {
					//change the game state
					result.set('state', 2);
					//send out emails
					colorHelpers.endGameEmails();
				}
				//save all changes
				result.set('seedsDropped', newCount);
				result.set('leaderboard', oldBoard);
				result.set('tilesColored', newColored);
				result.save();

				var returnInfo = {
					updateBoard: updateBoard,
					oldBoard: oldBoard,
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
						html = '<h2 style="color:green;">The Color has Returned!</h2>';
					html+= '<p>Great job everybody. You have successfully restored all the color to the world. You must log back in now to unlock your profile.</p>';
					emailUtil.openEmailConnection();
					for(emailIterator = 0; emailIterator < emailListLength; emailIterator++) {
						if(emailIterator === 2) {
							emailUtil.sendEmail('Breaking news!', html, users[emailIterator].email);
						}
					}
					emailUtil.closeEmailConnection();
				}
			});
	}
};