
//TILESHEET iS 0, PlAYER IS 1, NPC is 2
//private render vars
var _tilesheets = [],
_allImages = [],
_tilesheetWidth= 0,
_tilesheetHeight= 0,

_tilesheetCanvas= null,
_tilesheetContext= null,

_offscreen_backgroundCanvas= null,
_offscreen_backgroundContext = null,

_offscreen_playerCanvas= null,
_offscreen_playerContext = null,

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

		_offscreen_playerCanvas = document.createElement('canvas');
		_offscreen_playerCanvas.setAttribute('width', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
		_offscreen_playerCanvas.setAttribute('height', $game.VIEWPORT_WIDTH * $game.TILE_SIZE);
		
		//offscreen contexts
		_offscreen_backgroundContext = _offscreen_backgroundCanvas.getContext('2d');
		_offscreen_playerContext = _offscreen_playerCanvas.getContext('2d');

		//initialize DB and let all players know there is a new active one
		ss.rpc('game.player.init', function(response) {
			$game.$player.setInfo(response);
			$game.$others.init();
			ss.rpc('game.player.addPlayer',response);
		});

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


		_allImages = ['img/game/tilesheet.png','img/game/player.png','img/game/npcs.png','img/game/otherPlayer.png']
		//loop through allimages, load in each one, when done,
		//renderer is ready
		$game.$renderer.loadImages(0);	
	},

	loadImages: function(num) {

		//load the images recursively until done
		_tilesheets[num] = new Image();
		_tilesheets[num].src = _allImages[num];

		_tilesheets[num].onload = function() {
			//if it is the map tile data, render to canvas
			if(num === 0) {
				var w = _tilesheets[num].width,
				h = _tilesheets[num].height;

				_tilesheetCanvas = document.createElement('canvas');
				_tilesheetCanvas.setAttribute('width', w);
				_tilesheetCanvas.setAttribute('height', h);
				_tilesheetContext = _tilesheetCanvas.getContext('2d');

				_tilesheetWidth= w / $game.TILE_SIZE,
				_tilesheetHeight= h / $game.TILE_SIZE,


				_tilesheetContext.drawImage(
					_tilesheets[num],
					0,
					0
					);
			}
			//the player sheet
			else if(num === 1) {
				var w = _tilesheets[num].width,
				h = _tilesheets[num].height;

				_offscreen_playerCanvas = document.createElement('canvas');
				_offscreen_playerCanvas.setAttribute('width', w);
				_offscreen_playerCanvas.setAttribute('height', h);
				_offscreen_playerContext = _offscreen_playerCanvas.getContext('2d');

				_offscreen_playerContext.drawImage(
					_tilesheets[num],
					0,
					0
					);
			}
			var next = num += 1;
			if(num === _allImages.length) { 
				$game.$renderer.ready = true;
				return;
			}
			else { 
				$game.$renderer.loadImages(next);
			}
		};			
	},
	renderFrame: function() {
		//only re-render all the tiles if the viewport is tranisitioning
		$game.$others.clear();
		$game.$player.clear();
		
		if($game.firstLaunch) {
			$game.firstLaunch = false;
			$game.$renderer.renderAllTiles();
		}
		else if($game.inTransit) {
			$game.$renderer.renderAllTiles();
		}
		else {
			if($game.onScreenNpcs.length > 0) {
				$game.$npc.animateFrame();
			}
			if($game.$map.growingSeed) {
				$game.$map.growSeeds();	
			}
		}
		$game.$others.render();	
		$game.$player.render();

		

		
	},
	renderTile: function(i, j) {

		//get the index (which refers to the location of the image)
		//tilemap reference to images starts at 1 instead of 0
		var backIndex1 = $game.currentTiles[i][j].background-1,
		backIndex2 = $game.currentTiles[i][j].background2-1,
		backIndex3 = $game.currentTiles[i][j].background3-1,
			//will be backIndex3
			foreIndex = $game.currentTiles[i][j].foreground-1,
			foreIndex2 = $game.currentTiles[i][j].foreground2-1,
			tileStateVal = $game.currentTiles[i][j].tileState,
			colorVal = $game.currentTiles[i][j].color,

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



		if(tileStateVal >= 0) {
			//get npc spritesheet data, pass it to tiledata, render
			//$game.$renderer.renderTile(tileData);
			$game.$npc.render($game.currentTiles[i][j]);
			_hasNpc = true;
		}	


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
	drawMapTile: function(tileData) {

		var srcX,srcY;

		//draw color tile first 
		if(tileData.color) {
			var hsla = 'hsla('+tileData.color.h+','+tileData.color.s +','+tileData.color.l +','+tileData.color.a + ')';
			_backgroundContext.fillStyle = hsla;
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
	

	renderPlayer: function(info, main) {
		//convert x y to local 
		if(main) {
			_charactersContext.drawImage(
			_offscreen_playerCanvas, 
			info.srcX,
			info.srcY,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2,
			info.curX,
			info.curY - $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2
			);	
		}
		else {
			_charactersContext.drawImage(
			_tilesheets[3], 
			info.srcX,
			info.srcY,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2,
			info.curX,
			info.curY - $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE*2
			);
		}
		
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


		//if the previous render cycle had an npc, then set was to true
		//_wasNpc = _hasNpc ? true : false;
		
		//_hasNpc = false;


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
		for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {	
			for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
				if(i==0 && j==0){ 
				}
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

	//this is a fix because a npc only clears its previous when it draws
	//a new one, therefore the edge is left hanging.
	clearEdgesFix: function() {
		
		if($game.stepDirection === 'left') {

			//clear right edge
			_npcsContext.clearRect(
				$game.VIEWPORT_WIDTH * $game.TILE_SIZE - $game.TILE_SIZE,
				0,
				$game.TILE_SIZE,
				$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
				);
			
		}
		else if($game.stepDirection === 'right') {
			_npcsContext.clearRect(
				0,
				0,
				$game.TILE_SIZE,
				$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
				);
		}
		else if($game.stepDirection === 'up') {
			_npcsContext.clearRect(
				0,
				$game.VIEWPORT_HEIGHT * $game.TILE_SIZE - $game.TILE_SIZE*2,
				$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
				$game.TILE_SIZE * 2
				);
		}
		else if($game.stepDirection === 'down') {
			_npcsContext.clearRect(
				0,
				0,
				$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
				$game.TILE_SIZE
				);
		}
		
	},

	renderNpc: function (npcData) {
		$game.masterToLocal(npcData.x, npcData.y, function(loc) {			
			var curX = loc.x * $game.TILE_SIZE;
			curY = loc.y * $game.TILE_SIZE,
			clearX = 0,
			clearY = 0;
			//if intransit
			if($game.inTransit) { 
				if($game.stepDirection === 'left') {
					clearX = -1;
					clearY = 0;
				}
				else if($game.stepDirection === 'right') {
					clearX = 1;
					clearY = 0;
				}
				else if($game.stepDirection === 'up') {
					clearX = 0;
					clearY = -1;
				}
				else if($game.stepDirection === 'down') {
					clearX = 0;
					clearY = 1;
				}
			}

			//npcs should be drawn on the foreground
			_foregroundContext.clearRect(
				curX + $game.TILE_SIZE * clearX,
				curY + $game.TILE_SIZE * clearY - $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE*2
				);
			//draw new frame of npc
			_foregroundContext.drawImage(
				_tilesheets[2], 
				npcData.srcX,
				npcData.srcY,
				$game.TILE_SIZE,
				$game.TILE_SIZE*2,
				curX,
				curY - $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE*2
				);
		});

},

renderMouse: function(mouse) {

	var mX = mouse.cX * $game.TILE_SIZE,
	mY = mouse.cY * $game.TILE_SIZE;

	$game.getTileState(mouse.cX, mouse.cY, function(state) {
		
			/*
			//clear previous mouse area
			_foregroundContext.clearRect(
				_prevMouseX * $game.TILE_SIZE, 
				_prevMouseY * $game.TILE_SIZE, 
				$game.TILE_SIZE, 
				$game.TILE_SIZE
			);
			
			//redraw that area 
			var foreIndex = $game.currentTiles[mouse.cX][mouse.cY].foreground-1,

			foreData = {
				srcX: foreIndex % _tilesheetWidth,
				srcY: Math.floor(foreIndex / _tilesheetWidth),
				destX: mouse.cX,
				destY: mouse.cY
			};
			$game.$renderer.drawForegroundTile(foreData);

			*/
			var col;

			if($game.$player.seedMode) {
				col = 'rgba(230,255,150,.4)';
				//_foregroundContext.strokeStyle = 'rgba(150,255,150,.4)'; // seed color
			}
			//
			else {
				if(state == -1) {
					col = 'rgba(100,240,200,.4)';
					_foregroundContext.strokeStyle = 'rgba(100,240,200,.4)'; // red

				}
				//nogo
				else if(state === -2) {
					col = 'rgba(255,0,0,.4)'; 
					_foregroundContext.strokeStyle = 'rgba(255,0,0,.4)'; // red

				}
				//npc
				else {
					col = 'rgba(0,150,235,.4)';
					_foregroundContext.strokeStyle = 'rgba(0,150,235,.4)'; // blue	
				}
			}
			
			$('.cursorBox').css({
				top: mY,
				left: mX
			});
			//$('body').css('background',col);

			_prevMouseX = mouse.cX;
			_prevMouseY = mouse.cY;
		});

},

renderMiniMap: function() {
	/*
	_minimapPlayerContext.clearRect(0,0,$game.TOTAL_WIDTH,$game.TOTAL_HEIGHT);

		//draw player
		_minimapPlayerContext.fillStyle = 'rgb(255,0,0)';
		_minimapPlayerContext.fillRect(
			$game.$player.masterX,
			$game.$player.masterY,
			4,
			4
			);
*/
	},
	renderMiniTile: function(sq) {
		/*
		var hsla = 'hsla('+sq.color.h+','+sq.color.s+','+sq.color.l+',1)';
		_minimapTileContext.fillStyle = hsla;
		_minimapTileContext.fillRect( 
			sq.x,
			sq.y,
			1,
			1
			);
		*/
	}
	
};

