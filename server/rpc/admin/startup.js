var rootDir = process.cwd(),
	fs = require('fs'),

	config = require(rootDir + '/config'),
	service = require(rootDir + '/service'),
	dbActions = require(rootDir + '/server/utils/database-actions'),
	accountHelpers = require(rootDir + '/server/utils/account-helpers'),

	userModel = service.useModel('user', 'preload'),
	tileModel = service.useModel('tile', 'preload'),
	colorModel = service.useModel('color', 'preload'),
	npcModel = service.useModel('npc', 'preload'),
	botanistModel = service.useModel('botanist', 'preload'),
	gameModel = service.useModel('game', 'preload'),
	chatModel = service.useModel('chat', 'preload');

var _copyData;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	req.use('account.authenticated');

	return {

		loadData: function(dataType) {

			var userData,
				colorData,
				userDataLength,
				tileData,
				npcData,
				botanistData,
				resourceData,
				gameData,
				hashUserData;

			if(req.session.role && req.session.role === 'superadmin') {

				if(dataType === 'users') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Users   * * * * * * * * * * * *   \n\n'.yellow);
					userData = require(rootDir + '/data/users').global;
					colorData = require(rootDir + '/data/colors').global;

					var userDataCopy = _copyData(userData);
					userDataLength = userData.length;
					var numDemoUsers = 16;
					var demoUsers = [];

					hashUserData = function(i) {
						if(i < userDataLength) {
							accountHelpers.hashPassword(userData[i].password, function(hashedPassword) {
								userDataCopy[i].password = hashedPassword.hash;
								hashUserData(++i);
							});
						} else {
							// dbActions.dropCollection('users', function() {
							// 	dbActions.saveDocuments(userModel, userDataCopy, function() {
							// 		hashDemoData(0);
							// 	});
							// });
							dbActions.resetDefaultData(userModel, function(err) {
								if(err) {
									apprise(err);
								} else {
									dbActions.saveDocuments(userModel, userDataCopy, function() {
										hashDemoData(0);
									});
								}
							});
						}
					};
					hashDemoData = function(i) {
						if( i < numDemoUsers) {
							accountHelpers.hashPassword('demo', function(hashedPassword) {
								//create demo users
								var newColor = colorData[i-1];
								var d = {
									activeSessionID: null,
									firstName: 'Demo',
									lastName: ('User' + i),
									school: 'Demo University',
									password: hashedPassword.hash,
									email: ('demo' + i),
									role: 'actor',
									gameStarted: true,
									profilePublic: false,
									profileLink: Math.random().toString(36).slice(2),
									profileSetup: true,
									profileUnlocked: false,
									game: {
										instanceName: 'demo',
										currentLevel: 0,
										position: {
											x: 64,
											y: 77,
											inTransit: false
										},
										resources: [],
										resourcesDiscovered: 0,
										inventory: [],
										seeds: {
											regular: 0,
											draw: 0,
											dropped: 0
										},
										botanistState: 0,
										firstTime: true,
										// resume: ['My mother is an emergency room doctor in Worcester, MA. When I was younger, I sometimes spent a day with her at work when I was home sick from school, or on half days when her schedule didn\'t allow her to watch me at home. I saw people from all different walks of life. They had immediate problems (why else would they be in the ER?) but I also saw many who did not have insurance because they could not afford it. In comparison, I have been very fortunate, and I want to give something back to the community.','I\'ve done work at the Jewish Community Center, putting together care packages and delivering them, but I haven\'t had much "field experience" yet. That\'s something that I\'d like to improve on.','My main interest is in health and wellness, so I\'d like to work with people in that capacity. Signing up for insurance and learning about health care is difficult and time consuming, especially when communication barriers and education are a factor. I think I would be a great asset to under-served communities with poor access to health services.','I have been thinking about a career in medicine. I think engaging with people one-on-one will help give me important skills that I\'ll use later on.'],
										resume: [],
										seenRobot: false,
										playingTime: 0,
										tilesColored: 0,
										pledges: 5,
										collaborativeChallenge: false,
										skinSuit: {
											head: 'lion',
											torso: 'lion',
											legs: 'lion'
										}
									}
								};
								demoUsers.push(d);
								hashDemoData(++i);
							});
						} else {
							dbActions.saveDocuments(userModel, demoUsers, function() {
								res('Data loaded: ' + dataType);
							});
						}
					}; 
					hashUserData(0);
				} else if(dataType === 'tiles') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Tiles   * * * * * * * * * * * *   \n\n'.yellow);
					tileData = require(rootDir + '/data/tiles');
					dbActions.dropCollection('tiles', function() {
						var i,
						tileObject = tileData.global,
						backgroundArray = tileObject.backgroundArray,
						background2Array = tileObject.background2Array,
						background3Array = tileObject.background3Array,
						foregroundArray = tileObject.foregroundArray,
						foreground2Array = tileObject.foreground2Array,
						tileStateArray = tileObject.tileStateArray,
						numberOfTiles = backgroundArray.length,
						mapTilesWidth = 142,
						mapTilesHeight = 132,
						mapX,
						mapY,
						tileStateVal,
						tiles = [];

						// dbActions.saveDocuments(tileModel, tileData.global);

						// (re)constructing tile data based on data dump from third party tool
						for(i = 0; i < numberOfTiles; i++) {
							mapX = i % mapTilesWidth;
							mapY = Math.floor(i / mapTilesWidth);

							//add the tile to the array
							//tileState: -1 if nothing (go!), -2 if something (nogo!), the index if it's an NPC
							//checking values are arbitrary right now,
							//based on the image used in tiled map editor

							// 0: this means there was nothing place in tilestate layer, aka GO
							if(tileStateArray[i] === 0) {
								tileStateVal = -1;
							}

							//2: this refers to the BLUE tile, means there is an NPC
							else if(tileStateArray[i] === 2	) {
								tileStateVal = i;
							}
							//3: this is the pink? tile, it is the botanist
							else if(tileStateArray[i] === 3) {
								tileStateVal = 99999;
							}
							//3: this means there was something OTHER than the blue tile place, NOGO
							else {
								tileStateVal = -2;
							}
							tiles.push({
								x: mapX,
								y: mapY,
								tileState: tileStateVal,
								isMapEdge: (mapX === 0 || mapY === 0 || mapX === mapTilesWidth - 1 || mapY === mapTilesHeight - 1) ? true : false,
								background: backgroundArray[i],
								background2: background2Array[i],
								background3: background3Array[i],
								foreground: foregroundArray[i],
								foreground2: foreground2Array[i],
								mapIndex: i
							});
						}

						dbActions.saveDocuments(tileModel, tiles, numberOfTiles, function() {
							res('Data loaded: ' + dataType);
						});
					});
				} else if(dataType === 'colors') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Colors   * * * * * * * * * * * *   \n\n'.yellow);
					var colors = [{
						instanceName: 'test',
						x: 0,
						y: 0,
						mapIndex: 0
					}, {
						instanceName: 'demo',
						x: 0,
						y: 0,
						mapIndex: 0
					}];

					dbActions.resetDefaultData(colorModel, function(err) {
						if(err) {
							apprise(err);
						} else {
							dbActions.saveDocuments(colorModel, colors, function() {
								res('Data loaded: ' + dataType);
							});	
						}
					});
				
				} else if(dataType === 'botanist') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Botanist   * * * * * * * * * * * *   \n\n'.yellow);
					botanistData = require(rootDir + '/data/botanist');
					dbActions.dropCollection('botanists', function() {
						dbActions.saveDocuments(botanistModel, botanistData.global, function() {
							res('Data loaded: ' + dataType);
						});
					});
				} else if(dataType === 'npcs') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading NPCS   * * * * * * * * * * * *   \n\n'.yellow);
					npcData = require(rootDir + '/data/npcs');
					dbActions.dropCollection('npcs', function() {
						dbActions.saveDocuments(npcModel, npcData.global, function() {
							res('Data loaded: ' + dataType);
						});
					});	
				} else if(dataType === 'game') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Game   * * * * * * * * * * * *   \n\n'.yellow);
					gameData = require(rootDir + '/data/game');
					// dbActions.dropCollection('game', function() {
					// 	dbActions.saveDocuments(gameModel, gameData.global, function() {
					// 		res('Data loaded: ' + dataType);
					// 	});
					// });
					dbActions.resetDefaultData(gameModel, function(err) {
						if(err) {
							apprise(err);
						} else {
							dbActions.saveDocuments(gameModel, gameData.global, function() {
								res('Data loaded: ' + dataType);
							});	
						}
					});
				// } else if(dataType === 'resources') {
				// 	console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Resources   * * * * * * * * * * * *   \n\n'.yellow);
				// 	resourceData = require(rootDir + '/data/resources');
				// 	dbActions.dropCollection('resources', function() {
				// 		dbActions.saveDocuments(resourceModel, resourceData.global, function() {
				// 			res('Data loaded: ' + dataType);
				// 		});
				// 	});
				}
				else if(dataType === 'chat') {
					console.log('\n\n   * * * * * * * * * * * *   Deleting Chat Logs   * * * * * * * * * * * *   \n\n'.yellow);
					dbActions.resetDefaultData(chatModel, function(err) {
						if(err) {
							apprise(err);
						} else {
							res('Chat logs deleted');
						}
					});
					// dbActions.dropCollection('chat', function() {
					// 	res('Chat logs deleted');
					// });
				}
			}
		}

	};

};

_copyData = function(data) {
	var duplicate = [];
	for(var i = 0; i < data.length; i++) {
		var obj = data[i];
		duplicate[i] = {};
		for (var prop in obj) {
			if(obj.hasOwnProperty(prop)){
				duplicate[i][prop] = obj[prop];
			}
		}
	}
	return duplicate;
};