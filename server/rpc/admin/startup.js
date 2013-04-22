var rootDir = process.cwd();
var config = require(rootDir + '/config');
var service = require(rootDir + '/service');
var fs = require('fs');
var dbActions = require(rootDir + '/server/utils/databaseActions');

var userModel = service.useModel('user', 'preload');
var tileModel = service.useModel('tile', 'preload');
var colorModel = service.useModel('color', 'preload');
var npcModel = service.useModel('npc', 'preload');
var resourceModel = service.useModel('resource','preload');
var gnomeModel = service.useModel('gnome', 'preload');
var gameModel = service.useModel('game', 'preload');

// var nodeEnv;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	req.use('account.authenticated');

	return {

		loadData: function(dataType) {

			var userData, tileData, npcData, gnomeData, resourceData, gameData;

			if(req.session.role && req.session.role === 'superadmin') {

				if(dataType === 'users') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Users   * * * * * * * * * * * *   \n\n'.yellow);
					userData = require(rootDir + '/data/users');
					var colorData = require(rootDir + '/data/colors');
					dbActions.dropCollection('users', function() {
						dbActions.saveDocuments(userModel, userData.global, function() {
							//create demo users
							demoUsers = [];
							for(var i = 1; i < 16; i++) {
								var newColor = colorData.global[i-1];
								var d = {
									firstName: 'Demo',
									lastName: ('User' + i),
									password: 'demo',
									email: ('demo' + i),
									role: 'actor',
									gameStarted: true,
									profileSetup: true,
									profileUnlocked: false,
									isPlaying: false,
									game: {
										instanceName: 'demo',
										currentLevel: 0,
										rank: 'novice gardener',
										position: {
											x: 64,
											y: 77,
											inTransit: false
										},
										colorInfo: {
											rgb: newColor,
											tilesheet: i
										},
										resources: [],
										inventory: [],
										seeds: {
											normal: 0,
											riddle: 0,
											special: 0,
											dropped: 0
										},
										gnomeState: 0,
										firstTime: true,
										resume: [],
										seenThing: false,
										resourcesDiscovered: 0,
										playingTime: 0,
										tilesColored: 0,
										pledges: 5
									}
								};
								demoUsers.push(d);
							}
							dbActions.saveDocuments(userModel, demoUsers, function() {
								res('Data loaded: ' + dataType);
							});
						});
					});
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
							//3: this is the pink? tile, it is the gnome
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
					var colors = [{
						instanceName: 'test',
						x: 0,
						y: 0,
						mapIndex: 0,
						color: {
							r: 255,
							g: 0,
							b: 0,
							a: 0.5,
							owner: 'nobody'
						},
						curColor: 'rgba(255,0,0,0.5)'
					}];
					dbActions.dropCollection('colors', function() {
						dbActions.saveDocuments(colorModel, colors, function() {
							res('Data loaded: ' + dataType);
						});
					});
				} else if(dataType === 'npcs') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading NPCs and Gnome   * * * * * * * * * * * *   \n\n'.yellow);
					npcData = require(rootDir + '/data/npcs');
					gnomeData = require(rootDir + '/data/gnome');
					dbActions.dropCollection('npcs', function() {
						dbActions.saveDocuments(npcModel, npcData.global, function() {
							dbActions.dropCollection('gnomes', function() {
								dbActions.saveDocuments(gnomeModel, gnomeData.global, function() {
									res('Data loaded: ' + dataType);
								});
							});
						});
					});
				} else if(dataType === 'game') {
					console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Game   * * * * * * * * * * * *   \n\n'.yellow);
					gameData = require(rootDir + '/data/game');
					dbActions.dropCollection('game', function() {
						dbActions.saveDocuments(gameModel, gameData.global, function() {
							res('Data loaded: ' + dataType);
						});
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
					dbActions.dropCollection('chat', function() {
						res('Chat logs deleted');
					});
				}
			}
		}

	};

}