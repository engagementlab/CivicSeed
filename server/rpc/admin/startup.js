var rootDir = process.cwd();
var config = require(rootDir + '/config');
var service = require(rootDir + '/service');
var fs = require('fs');
var dbActions = require(rootDir + '/modules/utils/databaseActions');

var userModel = service.useModel('user', 'preload');
var tileModel = service.useModel('tile', 'preload');
var npcModel = service.useModel('npc', 'preload');
var resourceModel = service.useModel('resource','preload');
var gnomeModel = service.useModel('gnome', 'preload');

// var nodeEnv;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	req.use('account.authenticated');

	return {

		loadData: function(dataType) {

			var userData, tileData, npcData, gnomeData, resourceData;

			if(dataType === 'users') {
				console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Users   * * * * * * * * * * * *   \n\n'.yellow);
				userData = require(rootDir + '/data/users');
				dbActions.dropCollection('users', function() {
					dbActions.saveDocuments(userModel, userData.global, function() {
						res('Data loaded: ' + dataType);
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
					mapTilesWidth = config.get('MAP_TILES_WIDTH'),
					mapTilesHeight = config.get('MAP_TILES_HEIGHT'),
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
						if(tileStateArray[i] === 0) {
							tileStateVal = -1;
						}
						else if(tileStateArray[i] === 2	) {
							tileStateVal = i;
						} 
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
						res('Data loaded: ' + numberOfTiles + ' ' + dataType);
					});
				});
			} else if(dataType === 'npcs') {
				console.log('\n\n   * * * * * * * * * * * *   Pre-Loading NPCs and Gnome   * * * * * * * * * * * *   \n\n'.yellow);
				npcData = require(rootDir + '/data/npcs');
				gnomeData = require(rootDir + '/data/gnome');
				resourceData = require(rootDir + '/data/resources');
				dbActions.dropCollection('npcs', function() {
					dbActions.saveDocuments(npcModel, npcData.global, function() {
						dbActions.dropCollection('gnomes', function() {
							dbActions.saveDocuments(gnomeModel, gnomeData.global, function() {
								dbActions.dropCollection('resources', function() {
									dbActions.saveDocuments(resourceModel, resourceData.global, function() {
										res('Data loaded: ' + dataType);
									});
								});
							});
						});
					});
				});

			}
		}

	};

}