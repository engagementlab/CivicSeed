

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
  		
         function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();



exports.$game = {

	//GLOBAL GAME VARS
	masterX: 0,
	masterY: 0,
	nextX: 0,
	nextY: 0,
	stepX: 0,
	stepY: 0,
	currentTiles: [],
	nextTiles: [],
	graphTiles: [],
	shiftArray: 0,
	stepNumber: 0,
	numberOfSteps: 0,
	stepDirection: null,
	inTransit: false,
	firstLaunch: true,
	graph: null,
	started: false,

	//GLOBAL CONSTANTS
	VIEWPORT_WIDTH: 30,
	VIEWPORT_HEIGHT: 15,
	TOTAL_WIDTH: 142,
	TOTAL_HEIGHT: 132,
	TILE_SIZE: 32,
	STEP_PIXELS: 4,

	ready: false,

	onScreenNpcs: [],

	numPlayers: 0,

	init: function() {
		
		//init everything:
		//renderer loads all the image files 
		$game.$renderer.init();
		//npc loads the npc data from DB
		$game.$npc.init();
		//player WILL load its previous data from DB
		$game.$player.init();
		$game.$map.init();
		//$game.$audio.init();
		
		//games init must load the map info for current location
		//in future, surrounding as well
		$game.getTiles($game.masterX, $game.masterY, $game.VIEWPORT_WIDTH, $game.VIEWPORT_HEIGHT, function() {
			//new tile data stored in nextTiles by default
			//since this is the initial load w/ no transition, 
			//copy them over to currentTiles instead of transitioning
			$game.copyTileArray(function() {
				$game.createPathGrid(function() {
					$game.ready = true;
				});
			});
		});
		//trigger the game to start, only when everything is loaded
		var beginGame = function() {
			if($game.$renderer.ready && $game.$npc.ready && $game.$player.ready && $game.ready) {
				$game.started = true;
				$game.tick();
			}
			
			else {
				setTimeout(beginGame, 20);
			}

		};

		beginGame();


		
	},

	getTiles: function(x, y, x2, y2, callback) {
		ss.rpc('game.player.getMapData', x, y, x + x2, y + y2, function(response) {
			//breakdown single array into 2d array
			
			$game.nextTiles = new Array(x2);
			for(var i = 0; i < x2 ; i+=1) {
				
				$game.nextTiles[i] = new Array(y2);
				
				for(var j = 0; j < y2; j+=1) {

					var index = j * x2 + (i % x2);
					$game.nextTiles[i][j] = response[index];
					
				}
			}
			callback();
		});
	},

	copyTileArray: function(callback) {

		$game.currentTiles = new Array($game.VIEWPORT_WIDTH);
		
		for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {	
			$game.currentTiles[i] = new Array($game.VIEWPORT_HEIGHT);
			

			for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
				
				$game.currentTiles[i][j] = $game.nextTiles[i][j];
			}
		}
		//reset array
		$game.nextTiles.length = 0;
		callback();
		
	},

	createPathGrid: function(callback) {
		
		//wipe the on screen npc array
		$game.onScreenNpcs.length = 0;
		$game.gridTiles = new Array($game.VIEWPORT_HEIGHT);

		for(var y = 0; y < $game.VIEWPORT_HEIGHT; y += 1) {

			$game.gridTiles[y] = new Array($game.VIEWPORT_WIDTH);

			for(var  x = 0; x < $game.VIEWPORT_WIDTH; x += 1) {		

				$game.getTileState(x, y, function(val) {
					//the pathfinding takes 1 means its clear 0 not
					var tempNoGo;
					if(val === -1) {
						tempNoGo = 1;
					}	
					else if (val >= 0) {
						tempNoGo = 0;
						//since the restful state of the current bg 
						//is settled, figure out if there is a npc on here
						//this will let the renderer know if we need to animate
						//any npcs (by index)
						var stringId = String(val),
						found = false;
						
						//see if that is in there already (because of the two tiles)

						for(var i = 0; i<$game.onScreenNpcs.length; i += 1) {
							if($game.onScreenNpcs[i] === stringId) {
								found = true;
								continue;
							}
						}
						if(!found) {
							$game.onScreenNpcs.push(stringId);
						} 
						

					}
					else {
						tempNoGo = 0;
					}
					$game.gridTiles[y][x] = tempNoGo;
				});

			}	
		}

		$game.graph = new Graph($game.gridTiles);
		//var st = $game.graph.toString();
		//console.log(st);
		callback();
	},

	getTileState: function(x, y, callback) {
		//must first do a check to see if the tile BOTTOM is the npc
		//if so, then return npc val (THIS IS A HACK SORT OF)
		
		//only if it is not in the bottom row (obviously)
		var tileStateVal = $game.currentTiles[x][y].tileState;
		if( y < $game.VIEWPORT_HEIGHT-1) { 
			var belowState = $game.currentTiles[x][y+1].tileState;

			if(belowState >= 0 ) {
				tileStateVal = belowState;
			}
		}
		callback(tileStateVal);
	},

	isMapEdge: function(x, y, callback) {
		//var i = y*$game.viewportWidthInTiles + (x%$game.viewportWidthInTiles);
		var edge = $game.currentTiles[x][y].isMapEdge;
		callback(edge);
	},

	calculateNext: function(x, y, callback){
		var getThisManyX,
		getThisManyY,
		getThisX,
		getThisY;
		
		//left
		if(x === 0) {
			$game.nextX = $game.masterX - ($game.VIEWPORT_WIDTH - 2);
			$game.stepX = -1;
			$game.shiftArray = -1;
			$game.numberOfSteps = $game.VIEWPORT_WIDTH - 2;
			$game.stepDirection = 'left';
			getThisManyX = $game.VIEWPORT_WIDTH - 2;
			getThisManyY = $game.VIEWPORT_HEIGHT;
			getThisX = $game.nextX;
			getThisY = $game.masterY;
		}

		//right
		else if(x === $game.VIEWPORT_WIDTH - 1) {
			$game.nextX = $game.masterX + $game.VIEWPORT_WIDTH - 2;
			$game.stepX = 1;
			$game.shiftArray = 1;
			$game.numberOfSteps = $game.VIEWPORT_WIDTH - 2;
			$game.stepDirection = 'right';
			getThisManyX = $game.VIEWPORT_WIDTH - 2;
			getThisManyY = $game.VIEWPORT_HEIGHT;
			getThisX = $game.nextX + 2;
			getThisY = $game.masterY;
		}

		//up
		else if(y === 0) {
			$game.nextY = $game.masterY - ($game.VIEWPORT_HEIGHT - 2);
			$game.stepY = -1;
			$game.shiftArray = -$game.totalVIEWPORT_HEIGHT;
			$game.numberOfSteps = $game.VIEWPORT_HEIGHT - 2;
			$game.stepDirection = 'up';
			getThisManyX = $game.VIEWPORT_WIDTH;
			getThisManyY = $game.VIEWPORT_HEIGHT - 2;
			getThisX = $game.masterX;
			getThisY = $game.nextY;
		}

		//down
		else if(y === $game.VIEWPORT_HEIGHT - 1) {
			$game.nextY = $game.masterY+$game.VIEWPORT_HEIGHT - 2;
			$game.stepY = 1;
			$game.shiftArray = $game.totalVIEWPORT_HEIGHT;
			$game.numberOfSteps = $game.VIEWPORT_HEIGHT - 2;
			$game.stepDirection = 'down';
			getThisManyX = $game.VIEWPORT_WIDTH;
			getThisManyY = $game.VIEWPORT_HEIGHT - 2;
			getThisX = $game.masterX;
			getThisY = $game.nextY + 2;
		}

		$game.getTiles(getThisX, getThisY, getThisManyX, getThisManyY, function() {
			$game.dataLoaded = true;
			callback();
		});
	},

	beginTransition: function() {
		$game.inTransit = true;
		$game.stepNumber = 0;
		$game.stepTransition();

	},

	stepTransition: function() {
		if($game.stepNumber !== $game.numberOfSteps) {
			$game.updateAndDraw();
		}
		else {
			$game.endTransition();
		}
	},

	endTransition: function() {
		$game.inTransit = false;
		$game.$player.isMoving = false;
		$game.$player.resetRenderValues();
		//now that the transition has ended, create a new grid
		$game.createPathGrid(function() {
			$game.stepDirection = false;
		});

	},

	updateAndDraw: function() {
		$game.stepNumber += 1;
		//--------RIGHT------------
		//go thru current array and shift everthing
		if($game.stepDirection === 'right') {
			//shift all except last column
			for(var i = 0; i < $game.VIEWPORT_WIDTH - 1; i+=1) {
				for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
					$game.currentTiles[i][j] = $game.currentTiles[ i + 1 ][j];
				}
			}
			
			//shift a new column from the next array to the last spot
			for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
				$game.currentTiles[$game.VIEWPORT_WIDTH - 1][j] = $game.nextTiles[$game.stepNumber - 1][j];
			}
			$game.masterX += 1;
			$game.$player.slide(1,0);

		}

		//--------LEFT------------
		//go thru current array and shift everthing
		if($game.stepDirection === 'left') {
			//shift all except last column
			for(var i = $game.VIEWPORT_WIDTH - 1; i > 0; i-=1) {
				for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
					$game.currentTiles[i][j] = $game.currentTiles[ i - 1 ][j];
				}
			}
			//shift a new column from the next array to the last spot
			for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
				$game.currentTiles[0][j] = $game.nextTiles[$game.nextTiles.length - $game.stepNumber ][j];
			}
			$game.masterX -= 1;
			$game.$player.slide(-1,0);
		}

		//--------UP------------
		//go thru current array and shift everthing
		if($game.stepDirection==='up') {
			//shift all except last column
			for(var j = $game.VIEWPORT_HEIGHT - 1; j > 0; j-=1) {
				for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {
					$game.currentTiles[i][j] = $game.currentTiles[i][j - 1];
				}
			}
			//shift a new column from the next array to the last spot
			for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {
				$game.currentTiles[i][0] = $game.nextTiles[i][$game.nextTiles[0].length - $game.stepNumber];
			}
			$game.masterY -= 1;
			$game.$player.slide(0,-1);
		}

		//--------DOWN------------
		//go thru current array and shift everthing
		if($game.stepDirection === 'down') {
			//shift all except last column
			for(var j = 0; j < $game.VIEWPORT_HEIGHT - 1; j+=1) {
				for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {
					$game.currentTiles[i][j] = $game.currentTiles[i][j + 1];
				}
			}
			//shift a new column from the next array to the last spot
			for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {
				$game.currentTiles[i][$game.VIEWPORT_HEIGHT - 1] = $game.nextTiles[i][$game.stepNumber - 1];
			}
			$game.masterY += 1;
			$game.$player.slide(0,1);
		}

		//change the npc and players local positions 
		//the tiles have been updated, now tell render to look over everything
		//and re-render EVERYTHING
		//$game.$renderer.renderAll();
		requestAnimFrame($game.stepTransition); 
	},

	masterToLocal: function(x, y, callback) {
		//look through the currentTiles to find the same index and returns
		//the local grid coords (because they shift)
		var found = false;
		for( var a = 0; a < $game.currentTiles.length; a += 1) {
			for( var b = 0; b < $game.currentTiles[a].length; b += 1) {
				if(x === $game.currentTiles[a][b].x && y === $game.currentTiles[a][b].y) {
					var local =  {
						x: a,
						y: b
					};
					found = true;
					callback(local);
				}
			}	
		}
		if(!found) {
			callback(false);
		}
	},				

	tick: function() {
		if($game.started) {
			$game.$others.update();
			$game.$player.update();
			$game.$renderer.renderFrame();   
		}
		requestAnimFrame($game.tick);
	}
};

exports.gameModuleReady = function(callback) {

	callback();

};