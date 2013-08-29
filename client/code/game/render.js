var _tilesheets = [],
	_currentTilesheet = null,
	_allImages = [],
	_playerImages = [],
	_tilesheetWidth= 0,
	_tilesheetHeight= 0,

	_tilesheetCanvas= null,
	_tilesheetContext= null,

	_offscreen_backgroundCanvas= null,
	_offscreen_backgroundContext = null,

	_offscreenCharacterCanvas = [],
	_offscreenCharacterContext = [],

	_backgroundContext= null,
	_foregroundContext= null,
	_charactersContext= null,

	_minimapPlayerContext = null,
	_minimapTileContext = null,
	_prevMouseX = 0,
	_prevMouseY = 0,
	_hasNpc = false,
	_wasNpc = false,
	_playerColorNum = 0,
	_playerLevelNum = 0;

var $renderer = $game.$renderer = {

	ready: false,

	// setup all rendering contexts then load images
	init: function(callback) {
		// create offscreen canvases for optimized rendering
		_offscreen_backgroundCanvas = document.createElement('canvas');
		_offscreen_backgroundCanvas.setAttribute('width', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
		_offscreen_backgroundCanvas.setAttribute('height', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
		// offscreen contexts
		_offscreen_backgroundContext = _offscreen_backgroundCanvas.getContext('2d');

		// access the canvases for rendering
		_backgroundContext = document.getElementById('background').getContext('2d');
		_foregroundContext = document.getElementById('foreground').getContext('2d');
		_charactersContext = document.getElementById('characters').getContext('2d');

		_minimapPlayerContext = document.getElementById('minimapPlayer').getContext('2d');
		_minimapTileContext = document.getElementById('minimapTile').getContext('2d');

		// set stroke stuff for mouse
		_foregroundContext.strokeStyle = 'rgba(0,255,0,.4)'; // Green default
		_foregroundContext.lineWidth = 4;
		_foregroundContext.save();

		_allImages = ['tilesheet1.png', 'tilesheet2.png', 'tilesheet3.png', 'tilesheet4.png', 'tilesheet5.png','npcs.png', 'botanist.png', '1.png', '2.png', '3.png', 'robot.png', 'bossItems.png'];

		_playerColorNum = $game.$player.getColorNum();
		_playerLevelNum = $game.$player.currentLevel;
		$renderer.loadTilesheet(_playerLevelNum, false);

		// hack to check if all stuff is loaded so we can callback
		var checkDone = function() {
			if($renderer.ready) {
				callback();
			} else {
				setTimeout(checkDone, 30);
			}
		};
		checkDone();
	},

	// this loads the specified tilesheet
	loadTilesheet: function(num, now) {
		_currentTilesheet = new Image();
		_currentTilesheet.src = CivicSeed.CLOUD_PATH + '/img/game/' + _allImages[num];
		_currentTilesheet.onload = function() {
			// we are in the game
			if(now) {
				_tilesheetContext.clearRect(0,0,_tilesheetWidth,_tilesheetHeight);
			} else {
				_tilesheetCanvas = document.createElement('canvas');
				_tilesheetCanvas.setAttribute('width', _currentTilesheet.width);
				_tilesheetCanvas.setAttribute('height', _currentTilesheet.height);
				_tilesheetContext = _tilesheetCanvas.getContext('2d');

				_tilesheetWidth = _currentTilesheet.width / $game.TILE_SIZE;
				_tilesheetHeight = _currentTilesheet.height / $game.TILE_SIZE;
				// loop through all images, load in each one, when done, move on to map loading
				$renderer.loadImages(0);
			}
			_tilesheetContext.drawImage(
				_currentTilesheet,
				0,
				0
			);

			if(now) {
				// redraw all tiles
				$renderer.renderAllTiles();
			}
		};
	},

	//loads all other images (accessories, npcs, etc)
	loadImages: function(num) {

		//load the images recursively until done
		_tilesheets[num] = new Image();
		_tilesheets[num].src = CivicSeed.CLOUD_PATH + '/img/game/' + _allImages[num];
		_tilesheets[num].onload = function() {
			var next = num + 1;
			if(num === _allImages.length - 1) {
				$renderer.loadPlayerImages(0);
			}
			else {
				$renderer.loadImages(next);
			}
		};
	},

	//load all player images
	loadPlayerImages: function(num) {
		var next = num + 1,
			playerFile = CivicSeed.CLOUD_PATH + '/img/game/players/' + num + '.png';
		_playerImages[num] = new Image();
		_playerImages[num].src = playerFile;

		_playerImages[num].onload = function() {

			_offscreenCharacterCanvas[num] = document.createElement('canvas');
			_offscreenCharacterCanvas[num].setAttribute('width', _playerImages[num].width);
			_offscreenCharacterCanvas[num].setAttribute('height', _playerImages[num].height);
			_offscreenCharacterContext[num] = _offscreenCharacterCanvas[num].getContext('2d');

			_offscreenCharacterContext[num].drawImage(
				_playerImages[num],
				0,
				0
			);

			if(next === 21) {
				$renderer.ready = true;
				$renderer.playerToCanvas(_playerLevelNum, _playerColorNum, true);
				return;
			}
			else {
				$renderer.loadPlayerImages(next);
			}
		};
	},

	//render a frame on every tick, clear canvases and draw updated content
	renderFrame: function() {
		// $game.$others.clear();
		// $game.$player.clear();
		// $game.$npc.clear();
		// $game.$botanist.clear();
		// $game.$robot.clear();
		$renderer.clearAll();

		//only re-render all the tiles if the viewport is tranisitioning
		if($game.inTransit) {
			$renderer.renderAllTiles();
		}

		$renderer.makeQueue(function(all) {
			var a = all.length;
			while(--a > -1) {
				if(all[a].kind === 'npc') {
					$renderer.renderNpc(all[a]);
				}
				else if(all[a].kind === 'botanist') {
					$renderer.renderBotanist(all[a]);
				}
				else if(all[a].kind === 'robot') {
					$renderer.renderRobot(all[a]);
				}
				else {
					$renderer.renderPlayer(all[a]);
				}
			}
		});
	},

	//create order for drawing all characters (other players, your player, npcs, botanist, robot)
	makeQueue: function(callback) {
		var playerInfo = $game.$player.getRenderInfo(),
			order = [playerInfo],
			order2 = $game.$others.getRenderInfo(),
			order3 = $game.$npc.getRenderInfo(),
			botanistInfo = $game.$botanist.getRenderInfo(),
			robotInfo = $game.$robot.getRenderInfo();

		var finalOrder = order.concat(order2, order3);

		if(botanistInfo) {
			finalOrder.push(botanistInfo);
		}
		if(robotInfo) {
			finalOrder.push(robotInfo);
		}

		finalOrder.sort(function(a, b){
			return b.curY-a.curY;
		});
		callback(finalOrder);
	},

	//figure out the information to draw on a tile
	renderTile: function(i, j) {

		//get the index (which refers to the location of the image)
		//tilemap reference to images starts at 1 instead of 0
		var curTile = $game.$map.currentTiles[i][j],

			backIndex1 = curTile.background-1,
			backIndex2 = curTile.background2-1,
			backIndex3 = curTile.background3-1,
				//will be backIndex3
			foreIndex = curTile.foreground-1,
			foreIndex2 = curTile.foreground2-1,
			tileStateVal = curTile.tileState,
			colorVal = curTile.curColor,

			tileData = {
				b1: backIndex1,
				b2: backIndex2,
				b3: backIndex3,
				destX: i,
				destY: j
			};

		//color tile first if it needs to be done
		if(colorVal) {
			//rgb string
			tileData.color = colorVal;
		}

		//send the tiledata to the artist aka mamagoo
		$renderer.drawMapTile(tileData);

		//foreground tiles
		var foreData = {
			f1: foreIndex,
			f2: foreIndex2,
			destX: i,
			destY: j
		};

		if(foreIndex > -1 || foreIndex2 > -1) {
			$renderer.drawForegroundTile(foreData);
		}
	},

	//clear a single tile
	clearMapTile: function(x, y) {
		_backgroundContext.clearRect(
			x,
			y,
			$game.TILE_SIZE,
			$game.TILE_SIZE
			);
	},

	//draw the actual tile on the canvas
	drawMapTile: function(tileData) {

		var srcX,srcY;

		//draw color tile first
		if(tileData.color) {
			//var rgba = 'rgba('+tileData.color.r+','+tileData.color.g +','+tileData.color.b +','+tileData.color.a + ')';
			_backgroundContext.fillStyle = tileData.color;
			_backgroundContext.fillRect(
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
				);
		}

		//background1, the ground texture
		if(tileData.b1 > -1) {
			srcX =  tileData.b1 % _tilesheetWidth,
			srcY =  Math.floor(tileData.b1 / _tilesheetWidth),


			//draw it to offscreen
			_backgroundContext.drawImage(
				_tilesheetCanvas,
				srcX * $game.TILE_SIZE,
				srcY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE,
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
				);
		}

		if(tileData.b2 > -1) {
			srcX = tileData.b2 % _tilesheetWidth,
			srcY =  Math.floor(tileData.b2 / _tilesheetWidth),
			//draw it to offscreen
			_backgroundContext.drawImage(
				_tilesheetCanvas,
				srcX * $game.TILE_SIZE,
				srcY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE,
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
				);
		}
		if(tileData.b3 > -1) {
			srcX = tileData.b3 % _tilesheetWidth,
			srcY =  Math.floor(tileData.b3 / _tilesheetWidth),
			//draw it to offscreen
			_backgroundContext.drawImage(
				_tilesheetCanvas,
				srcX * $game.TILE_SIZE,
				srcY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE,
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
				);
		}
	},

	//draw a foreground tile to the canvas
	drawForegroundTile: function(tileData) {
		var srcX, srcY;
		if(tileData.f1 > -1) {
			srcX = tileData.f1 % _tilesheetWidth;
			srcY = Math.floor(tileData.f1 / _tilesheetWidth);
			_foregroundContext.drawImage(
				_tilesheetCanvas,
				srcX * $game.TILE_SIZE,
				srcY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE,
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
				);
		}
		if(tileData.f2 > -1) {
			srcX = tileData.f2 % _tilesheetWidth;
			srcY = Math.floor(tileData.f2 / _tilesheetWidth);
			_foregroundContext.drawImage(
				_tilesheetCanvas,
				srcX * $game.TILE_SIZE,
				srcY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE,
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
				);
		}

	},

	//draw acessory items to a player
	drawAccessories: function(srcX,destX,destY, level, color, client) {
		if(client) {
			//this will add your stuff to the gray player (for seed mode) as well
			_offscreenCharacterContext[0].drawImage(
				_tilesheets[level],
				srcX,
				0,
				32,
				64,
				destX,
				destY,
				32,
				64
			);
		}
		_offscreenCharacterContext[color].drawImage(
			_tilesheets[level],
			srcX,
			0,
			32,
			64,
			destX,
			destY,
			32,
			64
		);
	},

	//draw a player on the backup canvas
	playerToCanvas: function(lvl, color, client) {
		//hack to draw right accessories
		lvl = lvl < 4 ? lvl : 3;
		//MAKE  SHIT MORE EFFICIENT
		var h = 64,
			w = 32,
			level = lvl + 7;

		//clear and redraw then add accessories
		_offscreenCharacterContext[color].clearRect(
			0,
			0,
			_playerImages[color].width,
			_playerImages[color].height
		);
		_offscreenCharacterContext[color].drawImage(
			_playerImages[color],
			0,
			0
		);
		//+7 gets us to the RIGHT sheet in the array
		if(lvl > 0) {
			//go thru each level
			for(var curLevel = 7; curLevel < level; curLevel += 1) {
				//go through each accessory image, put it where approp. (there are 5)
				var j = 0;
				for (var i = 0; i < 5; i += 1) {
					var x = w * i;
					//0 - forward / down
					if(i === 0) {
						$renderer.drawAccessories(x,0,0,curLevel, color, client);
						for(j = 0; j < 4; j += 1) {
							$renderer.drawAccessories(x,w * j, h * 3,curLevel, color, client);
						}
					}
					//1 - idle
					else if(i === 1) {
						$renderer.drawAccessories(x,w,0,curLevel, color, client);
					}
					//2 - left
					else if(i === 2) {
						for(j = 0; j < 4; j += 1) {
							$renderer.drawAccessories(x, w * j, h * 1,curLevel, color, client);
						}
					}
					//3 - right
					else if(i === 3) {
						for(j = 0; j < 4; j += 1) {
							$renderer.drawAccessories(x, w * j, h * 2,curLevel, color, client);
						}
					}
					//4 - up
					else {
						for(j = 0; j < 4; j += 1) {
							$renderer.drawAccessories(x, w * j, h * 4,curLevel, color, client);
						}
					}
				}
			}
		}
	},

	//draw the player from backup to real canvas
	renderPlayer: function(info) {
		_charactersContext.drawImage(
			_offscreenCharacterCanvas[info.colorNum],
			info.srcX,
			info.srcY,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2,
			info.curX,
			info.curY - $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2
		);
	},

	//draw an npc to canvas
	renderCharacter: function(info) {
		_charactersContext.drawImage(
		_offscreenCharacterCanvas[info.colorNum],
		info.srcX,
		info.srcY,
		$game.TILE_SIZE,
		$game.TILE_SIZE*2,
		info.curX,
		info.curY - $game.TILE_SIZE,
		$game.TILE_SIZE,
		$game.TILE_SIZE*2
		);
	},

	//clear the character canvas
	clearAll: function() {
		_charactersContext.clearRect(
			0,
			0,
			$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
			$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
		);
	},

	//clear a specific region on the character canvas
	clearCharacter: function(info) {
		_charactersContext.clearRect(
			info.prevX,
			info.prevY - $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2
		);
	},

	//clear all the canvases and draw all the tiles
	renderAllTiles: function() {

		_foregroundContext.clearRect(
			0,
			0,
			$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
			$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
			);

		//start fresh for the offscreen every time we change ALL tiles
		_offscreen_backgroundContext.clearRect(
			0,
			0,
			$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
			$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
			);
		_backgroundContext.clearRect(
			0,
			0,
			$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
			$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
			);

		//go through and draw each tile to the appropriate canvas
		var i = $game.VIEWPORT_WIDTH;
		while(--i >= 0) {
			var j = $game.VIEWPORT_HEIGHT;
			while(--j >= 0) {
				$renderer.renderTile(i,j);
			}
		}

		_charactersContext.clearRect(
			0,
			0,
			$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
			$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
			);
	},

	//draw and npc to the canvas
	renderNpc: function (npcData) {
		_charactersContext.drawImage(
			_tilesheets[5],
			npcData.srcX,
			npcData.srcY,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2,
			npcData.curX,
			npcData.curY - $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2
		);
	},

	//draw the mouse box to the canvas
	renderMouse: function(mouse) {

		var mX = mouse.cX * $game.TILE_SIZE,
			mY = mouse.cY * $game.TILE_SIZE,
			state = $game.$map.getTileState(mouse.cX, mouse.cY);
			//clear previous mouse area
			_foregroundContext.clearRect(
				_prevMouseX * $game.TILE_SIZE,
				_prevMouseY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
			);

			//redraw that area
			var foreIndex = $game.$map.currentTiles[_prevMouseX][_prevMouseY].foreground-1,
				foreIndex2 =  $game.$map.currentTiles[_prevMouseX][_prevMouseY].foreground2-1,

				foreData = {
					f1: foreIndex,
					f2: foreIndex2,
					destX: _prevMouseX,
					destY: _prevMouseY
			};

			$renderer.drawForegroundTile(foreData);

			var col = $game.$player.getRGBA();

			if($game.$player.seedMode) {
				_foregroundContext.fillStyle = col; // seed color
				_foregroundContext.fillRect(
					mX,
					mY,
					$game.TILE_SIZE,
					$game.TILE_SIZE
				);
			}
			//
			else {
				if(state == -1) {
					col = 'rgba(50,255,50,.5)';
					_foregroundContext.strokeStyle = col;

				}
				//nogo
				else if(state === -2) {
					col = 'rgba(255,50,50,.5)';
					_foregroundContext.strokeStyle = col;

				}
				//npc
				else {
					col = 'rgba(50,50,235,.5)';
					_foregroundContext.strokeStyle = col;
				}
				_foregroundContext.strokeRect(
					mX + 2,
					mY + 2,
					$game.TILE_SIZE - 4,
					$game.TILE_SIZE - 4
				);
			}

			_prevMouseX = mouse.cX;
			_prevMouseY = mouse.cY;
	},

	//clear the mini mpa
	clearMiniMap: function() {
		_minimapPlayerContext.clearRect(0,0,$game.TOTAL_WIDTH,$game.TOTAL_HEIGHT);
	},

	//render a player to the mini map
	renderMiniPlayer: function(player) {
		//draw player
		_minimapPlayerContext.fillStyle = player.col;
		_minimapPlayerContext.fillRect(
			player.x,
			player.y,
			4,
			4
		);
	},

	//render the botanist and dividing lines on the mini map
	renderMiniMapConstants: function() {
		_minimapPlayerContext.fillStyle = 'rgb(150,150,150)';
		_minimapPlayerContext.fillRect(
			0,
			72,
			142,
			1
		);
		_minimapPlayerContext.fillRect(
			71,
			0,
			1,
			132
		);
		_minimapPlayerContext.fillStyle = 'rgb(255,255,255)';
		_minimapPlayerContext.fillRect(
			67,
			68,
			8,
			8
		);
		//_minimapPlayerContext.beginPath();
      	// _minimapPlayerContext.arc(71, 72, 20, 0, 2 * Math.PI, false);
      	// _minimapPlayerContext.lineWidth = 2;
      	// _minimapPlayerContext.strokeStyle = 'rgb(220,220,220)';
      	// _minimapPlayerContext.stroke();
	},

	//render a specific tile on the mini map
	renderMiniTile: function(x, y, col) {
		var	rgba = 'rgba('+col.r+','+col.g+','+col.b+','+col.a + ')';
		_minimapTileContext.fillStyle = rgba;
		_minimapTileContext.fillRect(
			x,
			y,
			1,
			1
		);
		
	},

	//clear the botanist from the canvas
	clearBotanist: function(info) {
		_charactersContext.clearRect(
			info.prevX,
			info.prevY - $game.TILE_SIZE * 4,
			$game.TILE_SIZE * 6,
			$game.TILE_SIZE * 5
		);
	},

	//clear the robot from canvas
	clearRobot: function(info) {
		_charactersContext.clearRect(
			info.prevX,
			info.prevY - $game.TILE_SIZE * 4,
			$game.TILE_SIZE * 6,
			$game.TILE_SIZE * 5
		);
	},

	//render the botanist on the canvas
	renderBotanist: function(info) {
		_charactersContext.drawImage(
			_tilesheets[6],
			info.srcX,
			info.srcY,
			$game.TILE_SIZE * 6,
			$game.TILE_SIZE * 5,
			info.curX,
			info.curY - $game.TILE_SIZE * 4,
			$game.TILE_SIZE * 6,
			$game.TILE_SIZE * 5
		);
	},

	//render the robot on the canvas
	renderRobot: function(info) {
		// console.log(info.srcX, info.srcY);
		_charactersContext.drawImage(
			_tilesheets[10],
			info.srcX,
			info.srcY,
			64,
			64,
			info.curX,
			info.curY - $game.TILE_SIZE * 1,
			64,
			64
		);
	},

	//display the mini map image on the canvas
	imageToCanvas: function(map) {
		var newImg = new Image();

		newImg.onload = function() {
			_minimapTileContext.drawImage(newImg,0,0);
		};
		newImg.src = map;
	},

	renderBossTiles: function(tiles) {
		for(var t = 0; t < tiles.length; t++) {
			$renderer.clearMapTile(tiles[t].x * $game.TILE_SIZE, tiles[t].y * $game.TILE_SIZE);
			_backgroundContext.fillStyle = tiles[t].color;
			_backgroundContext.fillRect(
				tiles[t].x * $game.TILE_SIZE,
				tiles[t].y * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
			);
			if(tiles[t].item > -1) {
				// _backgroundContext.fillStyle = 'rgba(0,' + tiles[t].item * 50 + ',200,0.5)';
				// _backgroundContext.fillRect(
				// 	tiles[t].x * $game.TILE_SIZE,
				// 	tiles[t].y * $game.TILE_SIZE,
				// 	$game.TILE_SIZE,
				// 	$game.TILE_SIZE
				// );
				_backgroundContext.drawImage(
					_tilesheets[11],
					tiles[t].item * $game.TILE_SIZE,
					0,
					$game.TILE_SIZE,
					$game.TILE_SIZE,
					tiles[t].x * $game.TILE_SIZE,
					tiles[t].y * $game.TILE_SIZE,
					$game.TILE_SIZE,
					$game.TILE_SIZE							
				);
			}
			if(tiles[t].charger > -1) {
				// _backgroundContext.fillStyle = 'rgba(255,0,0,0.9)';
				// _backgroundContext.fillRect(
				// 	tiles[t].x * $game.TILE_SIZE,
				// 	tiles[t].y * $game.TILE_SIZE,
				// 	$game.TILE_SIZE,
				// 	$game.TILE_SIZE
				// );
				_backgroundContext.drawImage(
					_tilesheets[11],
					128,
					0,
					$game.TILE_SIZE,
					$game.TILE_SIZE,
					tiles[t].x * $game.TILE_SIZE,
					tiles[t].y * $game.TILE_SIZE,
					$game.TILE_SIZE,
					$game.TILE_SIZE							
				);
			}
		}
	},

	clearBossLevel: function() {
		_backgroundContext.clearRect(
			0,
			0,
			$game.TILE_SIZE * $game.VIEWPORT_WIDTH,
			$game.TILE_SIZE * $game.VIEWPORT_HEIGHT
		);
	},

	clearMap: function() {
		_backgroundContext.clearRect(
			0,
			0,
			$game.TILE_SIZE * $game.VIEWPORT_WIDTH,
			$game.TILE_SIZE * $game.VIEWPORT_HEIGHT
		);
		_foregroundContext.clearRect(
			0,
			0,
			$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
			$game.VIEWPORT
		);
	}
};

