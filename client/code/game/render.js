
//TILESHEET iS 0, PlAYER IS 1, NPC is 2
//private render vars
var _tilesheets = [],
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
_wasNpc = false;

$game.$renderer = {

	ready: false,

	init: function() {
		//render the tilesheet to a canvas to pull from their rather than image
		
		//create offscreen canvases for optimized rendering
		_offscreen_backgroundCanvas = document.createElement('canvas');
		_offscreen_backgroundCanvas.setAttribute('width', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
		_offscreen_backgroundCanvas.setAttribute('height', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
		
		//offscreen contexts
		_offscreen_backgroundContext = _offscreen_backgroundCanvas.getContext('2d');

		//access the canvases for rendering
		_backgroundContext = document.getElementById('background').getContext('2d');
		_foregroundContext = document.getElementById('foreground').getContext('2d');
		_charactersContext = document.getElementById('characters').getContext('2d');
		
		_minimapPlayerContext = document.getElementById('minimapPlayer').getContext('2d');
		_minimapTileContext = document.getElementById('minimapTile').getContext('2d');


		//set stroke stuff for mouse
		_foregroundContext.strokeStyle = 'rgba(0,255,0,.4)'; // Greeen default
		_foregroundContext.lineWidth = 4;
		_foregroundContext.save();


		_allImages = ['tilesheet1.png', 'tilesheet2.png', 'tilesheet3.png', 'tilesheet4.png', 'tilesheet5.png','npcs.png', 'botanist.png', '1.png', '2.png', '3.png'];
		//loop through allimages, load in each one, when done,
		//renderer is ready
		$game.$renderer.loadImages(0);
	},
	loadImages: function(num) {

		//load the images recursively until done
		_tilesheets[num] = new Image();
		_tilesheets[num].src = '/img/game/' + _allImages[num];
		_tilesheets[num].onload = function() {
			//if it is the map tile data, render to canvas
			var next = num + 1;

			if(num === 0) {

				_tilesheetCanvas = document.createElement('canvas');
				_tilesheetCanvas.setAttribute('width', _tilesheets[num].width);
				_tilesheetCanvas.setAttribute('height', _tilesheets[num].height);
				_tilesheetContext = _tilesheetCanvas.getContext('2d');

				_tilesheetWidth= _tilesheets[num].width / $game.TILE_SIZE;
				_tilesheetHeight= _tilesheets[num].height / $game.TILE_SIZE;
			}

			if(num === _allImages.length - 1) {
				$game.$renderer.loadPlayerImages(0);
			}
			else {
				$game.$renderer.loadImages(next);
			}
		};
	},
	loadPlayerImages: function(num) {
		var next = num + 1,
			playerFile = 'img/game/players/' + num + '.png';
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


			//TODO: replace this with the number of image files
			if(next === 7) {
				$game.$renderer.ready = true;
				$game.$player.init();
				return;
			}
			else {
				$game.$renderer.loadPlayerImages(next);
			}
		};
	},
	renderFrame: function() {
		
		$game.$others.clear();
		$game.$player.clear();
		$game.$npc.clear();
		$game.$gnome.clear();
		$game.$thing.clear();

		//only re-render all the tiles if the viewport is tranisitioning
		if($game.inTransit) {
			$game.$renderer.renderAllTiles();
		}

		$game.$renderer.makeQueue(function(all) {
			var a = all.length;
			while(--a > -1) {
				if(all[a].kind === 'npc') {
					$game.$renderer.renderNpc(all[a]);
				}
				else if(all[a].kind === 'gnome') {
					$game.$renderer.renderGnome(all[a]);
				}
				else if(all[a].kind === 'thing') {
					$game.$renderer.renderThing(all[a]);
				}
				else {
					$game.$renderer.renderPlayer(all[a]);
				}
			}
		});

	},

	makeQueue: function(callback) {
		var playerInfo = $game.$player.getRenderInfo(),
			order = [playerInfo],
			order2 = $game.$others.getRenderInfo(),
			order3 = $game.$npc.getRenderInfo(),
			gnomeInfo = $game.$gnome.getRenderInfo(),
			thingInfo = $game.$thing.getRenderInfo();
			

		var finalOrder = order.concat(order2, order3);
		
		if(gnomeInfo) {
			finalOrder.push(gnomeInfo);
		}
		if(thingInfo) {
			finalOrder.push(thingInfo);
		}

		finalOrder.sort(function(a, b){
			return b.curY-a.curY;
		});
		callback(finalOrder);
	},

	renderTile: function(i, j) {

		//get the index (which refers to the location of the image)
		//tilemap reference to images starts at 1 instead of 0
		var curTile = $game.currentTiles[i][j],

			backIndex1 = curTile.background-1,
			backIndex2 = curTile.background2-1,
			backIndex3 = curTile.background3-1,
				//will be backIndex3
			foreIndex = curTile.foreground-1,
			foreIndex2 = curTile.foreground2-1,
			tileStateVal = curTile.tileState,
			colorVal = curTile.color,

			tileData = {
				b1: backIndex1,
				b2: backIndex2,
				b3: backIndex3,
				f: foreIndex,
				destX: i,
				destY: j
			};

		//color tile first if it needs to be done
		if(colorVal) {
			tileData.color = colorVal;
		}

		//send the tiledata to the artist aka mamagoo
		$game.$renderer.drawMapTile(tileData);

		//foreground tiles
		var foreData = {
			f1: foreIndex,
			f2: foreIndex2,
			destX: i,
			destY: j
		};

		if(foreIndex > -1 || foreIndex2 > -1) {
			$game.$renderer.drawForegroundTile(foreData);
		}
	},

	clearMapTile: function(x, y) {
		_backgroundContext.clearRect(
			x,
			y,
			$game.TILE_SIZE,
			$game.TILE_SIZE
			);
	},

	drawMapTile: function(tileData) {

		var srcX,srcY;

		//draw color tile first
		if(tileData.color) {

			var rgba = 'rgba('+tileData.color.r+','+tileData.color.g +','+tileData.color.b +','+tileData.color.a + ')';
			_backgroundContext.fillStyle = rgba;
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

	playerToCanvas: function(lvl, color, client) {
		//MAKE  SHIT MORE EFFICIENT
		var h = 64,
			w = 32,
			level = lvl + 7;

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
						$game.$renderer.drawAccessories(x,0,0,curLevel, color, client);
						for(j = 0; j < 4; j += 1) {
							$game.$renderer.drawAccessories(x,w * j, h * 3,curLevel, color, client);
						}
					}
					//1 - idle
					else if(i === 1) {
						$game.$renderer.drawAccessories(x,w,0,curLevel, color, client);
					}
					//2 - left
					else if(i === 2) {
						for(j = 0; j < 4; j += 1) {
							$game.$renderer.drawAccessories(x, w * j, h * 1,curLevel, color, client);
						}
					}
					//3 - right
					else if(i === 3) {
						for(j = 0; j < 4; j += 1) {
							$game.$renderer.drawAccessories(x, w * j, h * 2,curLevel, color, client);
						}
					}
					//4 - up
					else {
						for(j = 0; j < 4; j += 1) {
							$game.$renderer.drawAccessories(x, w * j, h * 4,curLevel, color, client);
						}
					}
				}
			}
		}
	},
	
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

	clearCharacter: function(info) {
		_charactersContext.clearRect(
			info.prevX,
			info.prevY - $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2
		);
	},
	
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
				$game.$renderer.renderTile(i,j);
			}
		}

		_charactersContext.clearRect(
			0,
			0,
			$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
			$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
			);



	},

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

	renderMouse: function(mouse) {

		var mX = mouse.cX * $game.TILE_SIZE,
			mY = mouse.cY * $game.TILE_SIZE,
			state = $game.getTileState(mouse.cX, mouse.cY);
		
			
			//clear previous mouse area
			_foregroundContext.clearRect(
				_prevMouseX * $game.TILE_SIZE,
				_prevMouseY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
			);
			
			//redraw that area
			var foreIndex = $game.currentTiles[_prevMouseX][_prevMouseY].foreground-1,
				foreIndex2 =  $game.currentTiles[_prevMouseX][_prevMouseY].foreground2-1,

				foreData = {
					f1: foreIndex,
					f2: foreIndex2,
					destX: _prevMouseX,
					destY: _prevMouseY
			};

			$game.$renderer.drawForegroundTile(foreData);

			
			var col;

			if($game.$player.seedMode > 0) {
				col = 'rgba('+$game.$player.game.colorInfo.rgb.r+','+$game.$player.game.colorInfo.rgb.g+','+$game.$player.game.colorInfo.rgb.b+','+ 0.5 + ')';
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

	clearMiniMap: function() {
		_minimapPlayerContext.clearRect(0,0,$game.TOTAL_WIDTH,$game.TOTAL_HEIGHT);
	},

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

	clearGnome: function(info) {
		_charactersContext.clearRect(
			info.prevX,
			info.prevY - $game.TILE_SIZE * 4,
			$game.TILE_SIZE * 6,
			$game.TILE_SIZE * 5
		);
	},

	clearThing: function(info) {
		_charactersContext.clearRect(
			info.prevX,
			info.prevY - $game.TILE_SIZE * 4,
			$game.TILE_SIZE * 6,
			$game.TILE_SIZE * 5
		);
	},

	renderGnome: function(info) {
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

	renderThing: function(info) {
		_charactersContext.drawImage(
			_tilesheets[4],
			16*32,
			18*32,
			$game.TILE_SIZE * 3,
			$game.TILE_SIZE * 2,
			info.curX,
			info.curY - $game.TILE_SIZE * 1,
			$game.TILE_SIZE * 3,
			$game.TILE_SIZE * 2
		);
	},

	imageToCanvas: function(map) {
		var newImg = new Image();
		
		newImg.onload = function() {
			_minimapTileContext.drawImage(newImg,0,0);
		};
		newImg.src = map;
	},

	changeTilesheet: function(num, now) {
		_tilesheetContext.drawImage(
			_tilesheets[num],
			0,
			0
		);
		if(now) {
			//redraw all tiles
			$game.$renderer.renderAllTiles();
		}
	}
	
};

