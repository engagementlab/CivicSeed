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

// top of game file
(function() {

	//PRIVATE VARS to GAME

	$game = {

		//GLOBAL GAME VARS
		masterX: 0,
		masterY: 0,
		nextX: 0,
		nextY: 0,
		stepX: 0,
		stepY: 0,
		currentTiles: [],
		nextTiles: [],
		shiftArray: 0,
		stepNumber: 0,
		numberOfSteps: 0,
		stepDirection: null,
		inTransit: false,
	
		//GLOBAL CONSTANTS
		VIEWPORT_WIDTH: 30,
		VIEWPORT_HEIGHT: 15,
		TOTAL_WIDTH: 146,
		TOTAL_HEIGHT: 141,
		TILE_SIZE: 32,

	
		init: function() {
			
			$game.$renderer.init();
		},

		getTiles: function(x, y, x2, y2, callback) {
			ss.rpc('multiplayer.getMapData', x, y, x + x2, y + y2, function(response) {
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

		isNoGo: function(x, y, callback) {
			//var i = y*$game.viewportWidthInTiles + (x%$game.viewportWidthInTiles);
			var noGoVal = $game.currentTiles[x][y].nogo;
			// console.log(noGoVal + 'Get No Go Yo');
			callback(noGoVal);
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
				$game.nextX = $game.masterX - ($game.VIEWPORT_WIDTH - 1);
				$game.stepX = -1;
				$game.shiftArray = -1;
				$game.numberOfSteps = 29;
				$game.stepDirection = 'left';
				getThisManyX = $game.VIEWPORT_WIDTH - 1;
				getThisManyY = $game.VIEWPORT_HEIGHT;
				getThisX = $game.nextX;
				getThisY = $game.masterY;
			}

			//right
			else if(x === $game.VIEWPORT_WIDTH - 1) {
				$game.nextX = $game.masterX + $game.VIEWPORT_WIDTH - 1;
				$game.stepX = 1;
				$game.shiftArray = 1;
				$game.numberOfSteps = 29;
				$game.stepDirection = 'right';
				getThisManyX = $game.VIEWPORT_WIDTH - 1;
				getThisManyY = $game.VIEWPORT_HEIGHT;
				getThisX = $game.nextX + 1;
				getThisY = $game.masterY;
			}

			//up
			else if(y === 0) {
				$game.nextY = $game.masterY - ($game.VIEWPORT_HEIGHT - 1);
				$game.stepY = -1;
				$game.shiftArray = -$game.totalVIEWPORT_HEIGHT;
				$game.numberOfSteps = 14;
				$game.stepDirection = 'up';
				getThisManyX = $game.VIEWPORT_WIDTH;
				getThisManyY = $game.VIEWPORT_HEIGHT - 1;
				getThisX = $game.masterX;
				getThisY = $game.nextY;
			}

			//down
			else if(y === $game.VIEWPORT_HEIGHT - 1) {
				$game.nextY = $game.masterY+$game.VIEWPORT_HEIGHT - 1;
				$game.stepY = 1;
				$game.shiftArray = $game.totalVIEWPORT_HEIGHT;
				$game.numberOfSteps = 14;
				$game.stepDirection = 'down';
				getThisManyX = $game.VIEWPORT_WIDTH;
				getThisManyY = $game.VIEWPORT_HEIGHT - 1;
				getThisX = $game.masterX;
				getThisY = $game.nextY + 1;
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
			// if($game.masterX!=$game.nextX){
			// 	$game.masterX+=$game.stepX;
			// 	$game._updateAndDraw();
			// }
			// else if($game.masterY!=$game.nextY){
			// 	$game.masterY+=$game.stepY;
			// 	$game._updateAndDraw();
			// }
			else {
				$game.endTransition();
			}
		},

		endTransition: function() {
			$game.inTransit = false;
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
			}




			$game.$renderer.renderAll();
			requestAnimFrame($game.stepTransition); 
		}

	};

	window.$game = $game;

})();

// map file
(function() {

	// _renderAll = function() {

	// };

	// $game.$map = {

	// 	init: function() {
	// 		console.log($game.not);
	// 	}

	// };

})();

// renderer file
(function() {
	//private render vars
	var _tilesheet = null,
	_playerTilesheet = null,
	_tilesheetWidthPx= 640,
	_tilesheetHeightPx= 3136,
	_tilesheetWidth= _tilesheetWidthPx / $game.TILE_SIZE,
	_tilesheetHeight= _tilesheetHeightPx / $game.TILE_SIZE,
	_tilesheetCanvas= null,
	_backgroundContext= null,
	_foregroundContext= null,
	_charactersContext= null,
	_tilesheetContext= null;


	$game.$renderer = {

		init: function() {
			_tilesheetCanvas = document.createElement('canvas');
        	_tilesheetCanvas.setAttribute('width', _tilesheetWidth * $game.TILE_SIZE);
        	_tilesheetCanvas.setAttribute('height', _tilesheetHeight * $game.TILE_SIZE);

	        //initialize DB and let all players know there is a new active one
			ss.rpc('multiplayer.init', function(response) {
				console.log('rpc init: '+ response);
			});

			//load in tilesheets png
			_tilesheet = new Image();
			_tilesheet.src = 'img/game/tilesheet.png';

			_playerTilesheet = new Image();
			_playerTilesheet.src = 'img/game/mario.png';
			
			
			//access the canvases for rendering
			_backgroundContext = document.getElementById('background').getContext('2d');
			_foregroundContext = document.getElementById('foreground').getContext('2d');
			_charactersContext = document.getElementById('characters').getContext('2d');
			_tilesheetContext = _tilesheetCanvas.getContext('2d');

			//start doing stuff once the tilesheet png loads
			_tilesheet.onload = function() {
				console.log("ready to render");

				//render out the whole tilesheet to the offscreen canvas
				_tilesheetContext.drawImage(_tilesheet, 0, 0);

				//get all the tiles for the current viewport (default to 0,0)
				$game.getTiles($game.masterX, $game.masterY, $game.VIEWPORT_WIDTH, $game.VIEWPORT_HEIGHT, function() {
					
						//new tile data stored in nextTiles by default
						//since this is the initial load w/ no transition, 
						//copy them over to currentTiles instead of transitioning
						$game.copyTileArray(function() {

							$game.$renderer.renderAll();

						});
				});
			
				$game.$player.init();
			

			};		
		},

		renderTile: function(tileData) {
			_backgroundContext.drawImage(
			_tilesheet, 
			tileData.srcX * $game.TILE_SIZE,
			tileData.srcY * $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE,
			tileData.destX * $game.TILE_SIZE,
			tileData.destY * $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE
			);
		},

		renderPlayer: function(tileData) {
			_charactersContext.clearRect(
				tileData.prevX*$game.TILE_SIZE,
				tileData.prevY*$game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE*2
			);
			_charactersContext.drawImage(
				_playerTilesheet, 
				tileData.srcX * $game.TILE_SIZE,
				tileData.srcY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE*2,
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE*2
			);
		},
	
		renderAll: function() {
			for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {
				
				for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
					
					var backIndex = $game.currentTiles[i][j].background - 1,
						backIndex2 = $game.currentTiles[i][j].background2 - 1,
						foreIndex = $game.currentTiles[i][j].foreground - 1,
					
					//tilemap starts at 1 instead of 0
					
					//background tiles first
					tileData = {
						srcX: backIndex % _tilesheetWidth,
						srcY: Math.floor(backIndex / _tilesheetWidth),
						destX: i,
						destY: j
					};
					
					$game.$renderer.renderTile(tileData);
					
					//second layer background tiles (not all have something)
					if( backIndex2 > -1) {
						tileData.srcX = backIndex2 % _tilesheetWidth;
						tileData.srcY = Math.floor(backIndex2 / _tilesheetWidth);
						$game.$renderer.renderTile(tileData);
					}

					//foreground tiles 
					if(foreIndex > -1) {
						tileData.srcX = foreIndex % _tilesheetWidth;
						tileData.srcY = Math.floor(foreIndex / _tilesheetWidth);
						$game.$renderer.renderTile(tileData);
					}

				}
			}	
		}

	};

})();


//player file
(function() {

	var _currentX = 0,
 		_currentY = 1,


 	//return the distance "as the crow flies" between start and end
	//ie disregarding "nogo" tiles, the vertical + horizontal distance
	//between the two passed tiles	
 	_getHScore = function(a, b) {
 		var dX = Math.abs(a.x-b.x);
 		var dY = Math.abs(a.y-b.y);
 		var dT = dX + dY;
 		return dT;
	},

	_lowestScoreInOpen = function(open) {
		var lowIndex = 0;
		var lowValue = 999;
		for(var i = 0; i<open.length; i++){
			if(open[i].fScore < lowValue){
				lowIndex = open[i].index;
			}
		}
		return lowIndex;
	},

	_adjacentTiles = function(currentTile) {
		var tiles = [];
		//top
		//edge check
		if(currentTile.y > 0){
			$game.isNoGo(currentTile.x, currentTile.y, function(val){
				if(!val){
					var coords = {x: currentTile.x, y: currentTile.y - 1, gScore: 0};
					tiles.push(coords);
				}
			});
		}
		//bottom
		if(currentTile.y < 14){
			$game.isNoGo(currentTile.x, currentTile.y, function(val){
				if(!val){
					var coords = {x: currentTile.x, y: currentTile.y + 1, gScore: 0};
					tiles.push(coords);
				}
			});
			
		}
		//left
		if(currentTile.x > 0){
			$game.isNoGo(currentTile.x, currentTile.y, function(val){
				if(!val){
					var coords = {x: currentTile.x - 1, y: currentTile.y, gScore: 0};
					tiles.push(coords);
				}
			});
			
		}
		//right
		if(currentTile.x < 29){
			$game.isNoGo(currentTile.x, currentTile.y, function(val){
				if(!val){
					var coords = {x: currentTile.x + 1, y: currentTile.y, gScore: 0};
					tiles.push(coords);
				}
			});
		}

		return tiles;
	}
		
	
	$game.$player = {


		//private methods

		init: function() {
			//access the canvases for rendering
				
			var tileData = {
				srcX: 0,
				srcY: 0,
				destX: 0,
				destY: _currentY-1,
				prevX: 0,
				prevY: 0
			}
			
			$game.$renderer.renderPlayer(tileData);	
			console.log("render me");
		},

		move: function(x, y) {
			//check if it is an edge in here, to load data while moving player
			$game.isMapEdge(x, y, function(isIt) {
				var willTravel = false;
				//if a transition is necessary, load new data
				if(!isIt){
					if(x === 0 || x === 29 || y === 0 || y === 14) {
						willTravel = true;
						$game.calculateNext(x, y, function() {
							//data is loaded!
							console.log("data is loaded!");
 							
						});
					}
				}

				//clear current, then render new

				// $game.$player.findPath(_currentX, _currentY, x, y, function(moves){
				// 	console.log(moves);
				// });

				//temp jump the player
				var tileData = {
					srcX: 0,
					srcY: 0,
					destX: x,
					destY: y-1,
					prevX: _currentX,
					prevY: _currentY-1
				};

				$game.$renderer.renderPlayer(tileData);

				_currentX = x,
				_currentY = y;
				

				//begin pathfinding algorithm

				//when the pathfinding is done, travel!
				if(willTravel){
					var beginTravel = function(){
						if($game.dataLoaded){
							console.log("we have lift off");
							$game.dataLoaded = false;
							$game.beginTransition();
						}	
						else{
							//keep tryin!
							console.log("not yet...");
							setTimeout(beginTravel,50);
						}
					};
					beginTravel();
					
				}
				
			});
		},

		findPath: function(x, y, x2, y2, callback) {
			var closed = [],
				start = {x: x, y: y, cameFrom: null, index: (y * $game.VIEWPORT_WIDTH) + x},
				goal = {x: x2, y: y2, cameFrom: null, index: (y2 * $game.VIEWPORT_WIDTH) + x2},
				open = [start],
				orderedMoves = [],

				retracePath = function(lastTile){

					if (latestTile.cameFrom != null){
						//add latestTile to the stack of orderedmoves?
						orderedMoves.push(latestTile);
						//go to next until orig
						retracePath(latestTile.cameFrom);
					}
				};
				
				//the gscore of each Tile is the cost to reach it from the “start” tile.
				//each Tile’s fscore ends up being a metric of fitness for inclusion in the final path; it is the sum of its gscore and the heuristic distance between it and the “goal”
				start.gScore = 0;
				start.fScore = start.gScore + _getHScore(start, goal);

				while(open.length > 0) {
					//get the lowest score in open tiles
					var lowIndex = _lowestScoreInOpen(open),
						copyThis = open[lowIndex],
						currentTile = {
							x: copyThis.x,
							y: copyThis.y,
							cameFrom: copyThis.cameFrom,
							gScore: copyThis.gScore,
							fScore: copyThis.fScore,
							index: copyThis.index
						};

					console.log(copyThis.fScore);

					//see if the lowest tile is the goal tile
					if (currentTile.x === goal.x && currentTile.y === goal.y) {
						//retracePath(currentTile);
						callback("got moves");
					}

					//take it off the open list
					open.splice(lowIndex,1);

					//add it to the closed list 
					closed.push(currentTile);

					//look at all the adjacent tiles
					var neighbors = _adjacentTiles(currentTile);
				
					for(var n = 0; n < neighbors.length; n += 1) {
						//if the neighbor is on the closed list, skip it, go to next neighb
						for( var c = 0; c < closed.length; c +=1) {
							if (closed[c].x === neighbors[n].x && closed[c].y === neighbors[n].y) {
								continue;
							}
						}
						
						//possible g score
						var tentativeGScore = currentTile.gScore + 1;

						//if the neighor is NOT on the open list or the g score is less than the neighbors gscore
						//add the neighbor to the openlist
						//set its values
						var gScoreDiff = tentativeGScore - neighbors[n].gScore,
							notInOpen = true;

						for(var o = 0; o < open.length; o +=1) {
							if (open[o].x === neighbors[n].x && open[o].y === neighbors[n].y) {
								notInOpen = false;
								continue;
							}
						}

						if(notInOpen) {
							neighbors[n].cameFrom = currentTile.index;
							neighbors[n].index = idCount;
							neighbors[n].gScore = tentativeGScore;
							neighbors[n].fScore = _getHScore(neighbors[n], goal);
							open.push(neighbors[n]);
							idCount += 1;
						}
						else if(gScoreDiff < 0){

						}
					}
					
				}
				//if we exhausted all options, return null
				callback("no moves for you");

		}
	};

})();


//init file
$(function() {
	$game.init();
});

(function() {

	$game.$mouse = {
		
		prevX: 0,
		prevY: 0,
		curX: 0,
		curY: 0,
		changed: false,

		//returns local x,y grid data based on mouse location
		updateMouse: function( a, b, oa, ob, callback) {
			var x = a - oa;
			var y = b - ob;
			$game.$mouse.prevX = $game.$mouse.curX;
			$game.$mouse.prevY = $game.$mouse.curY;

			$game.$mouse.curX = Math.floor(x/32);
			$game.$mouse.curY = Math.floor(y/32);
			
			//extremes(if at edge it will be just over)
			if($game.$mouse.curX > 29) {
				$game.$mouse.curX = 29;
			}
			else if($game.$mouse.curX < 0) {
				$game.$mouse.curX = 0;
			}
			if($game.$mouse.curY > 14) {
				$game.$mouse.curY = 14;
			}
			else if($game.$mouse.curY < 0) {
				$game.$mouse.curY = 0;
			}

			//if the grid is different update boolean
			if($game.$mouse.curX !== $game.$mouse.prevX || $game.$mouse.curY !== $game.$mouse.prevY){
				$game.$mouse.changed = true;
			}
			else{
				$game.$mouse.changed = false;
			}
			callback($game.$mouse.curX,$game.$mouse.curY,$game.$mouse.changed);
		}

	};

})();
	
 

// //old version (not modularized)
// var inTransit = false;

// var Game = {
	
// 	masterX: 0,
// 	masterY: 0,
// 	nextX: 0,
// 	nextY: 0,
// 	stepX: 0,
// 	stepY: 0,
// 	shiftArray: 0,
// 	viewportWidthInTiles: 30,
// 	viewportHeightInTiles: 15,
// 	totalviewportWidthInTiles: 146,
// 	totalviewportHeightInTiles: 141,
// 	tileSize: 32,
// 	tilesheet: null,
// 	tilesheetWidth: 640/32,
// 	tilesheetHeight: 3136/32,
// 	tilesheetCanvas: null,
// 	backgroundContext: null,
// 	foregroundContext: null,
// 	charactersContext: null,
// 	tilesheetContext: null,
// 	currentTiles: [],
// 	nextTiles: [],
// 	stepNumber: 0,
// 	numberOfSteps: 0,
// 	stepDirection: null,

// 	// Game initialization
// 	init: function() {
		
// 		//create offscreen canvas for the tilesheet
// 		tilesheetCanvas = document.createElement('canvas');
//         tilesheetCanvas.setAttribute('width', Game.tilesheetWidth * Game.tileSize);
//         tilesheetCanvas.setAttribute('height', Game.tilesheetHeight * Game.tileSize);

//         //initialize DB and let all players know there is a new active one
// 		ss.rpc('multiplayer.init',function(response) {
// 			console.log('rpc init: '+response);
// 		});

// 		//load in tilesheet png
// 		Game.tilesheet = new Image();
// 		Game.tilesheet.src = 'img/game/tilesheet.png';
		
// 		//access the canvases for rendering
// 		Game.backgroundContext = document.getElementById('background').getContext('2d');
// 		Game.foregroundContext = document.getElementById('foreground').getContext('2d');
// 		Game.charactersContext = document.getElementById('characters').getContext('2d');
// 		Game.tilesheetContext = tilesheetCanvas.getContext('2d');

// 		//start doing stuff once the tilesheet png loads
// 		Game.tilesheet.onload = function() {
			
// 			//render out the whole tilesheet to the offscreen canvas
// 			Game.tilesheetContext.drawImage(Game.tilesheet, 0, 0);

// 			//get all the tiles for the current viewport (default to 0,0)
// 			Game._getTiles(Game.masterX,Game.masterY, Game.viewportWidthInTiles, Game.viewportHeightInTiles, function() {
				
// 				//new tile data stored in nextTiles by default
// 				//since this is the initial load w/ no transition, 
// 				//copy them over to currentTiles instead of transitioning
// 				Game._copyTileArray(function() {

// 					Game._renderAll();

// 				});
// 			});
// 		};
// 	},

// 	_copyTileArray: function(callback) {
		
// 		Game.currentTiles = new Array(Game.viewportWidthInTiles);
		
// 		for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {	
// 			Game.currentTiles[i] = new Array(Game.viewportHeightInTiles);
			

// 			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
				
// 				Game.currentTiles[i][j] = Game.nextTiles[i][j];
			
// 			}
// 		}
// 		//reset array
// 		Game.nextTiles.length = 0;

// 		callback();
// 	},

// 	_getTiles: function(x, y, x2, y2, callback) {
// 		ss.rpc('multiplayer.getMapData', x, y, x + x2, y + y2, function( response) {
// 			//breakdown single array into 2d array
// 			Game.nextTiles = new Array(x2);
// 			for(var i = 0; i < x2 ; i+=1) {
				
// 				Game.nextTiles[i] = new Array(y2);
				
// 				for(var j = 0; j < y2; j+=1) {

// 					var index = j * x2 + (i % x2);
// 					Game.nextTiles[i][j] = response[index];
// 				}
// 			}
// 			callback();
// 		});
// 	},
	
// 	_renderTile: function(tileData) {
// 		Game.backgroundContext.drawImage(
// 			Game.tilesheet, 
// 			tileData.srcX * Game.tileSize,
// 			tileData.srcY * Game.tileSize,
// 			Game.tileSize,
// 			Game.tileSize,
// 			tileData.destX * Game.tileSize,
// 			tileData.destY * Game.tileSize,
// 			Game.tileSize,
// 			Game.tileSize
// 		);
// 	},
	
// 	_renderAll: function() {
// 		for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
			
// 			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
				
// 				var backIndex = Game.currentTiles[i][j].background - 1,
// 					backIndex2 = Game.currentTiles[i][j].background2 - 1,
// 					foreIndex = Game.currentTiles[i][j].foreground - 1,
				
// 				//tilemap starts at 1 instead of 0
				
// 				//background tiles first
// 				tileData = {
// 					srcX: backIndex % Game.tilesheetWidth,
// 					srcY: Math.floor(backIndex / Game.tilesheetWidth),
// 					destX: i,
// 					destY: j
// 				};
				
// 				Game._renderTile(tileData);
				
// 				//second layer background tiles (not all have something)
// 				if( backIndex2 > -1) {
// 					tileData.srcX = backIndex2 % Game.tilesheetWidth;
// 					tileData.srcY = Math.floor(backIndex2 / Game.tilesheetWidth);
// 					Game._renderTile( tileData );
// 				}

// 				//foreground tiles 
// 				if(foreIndex > -1) {
// 					tileData.srcX = foreIndex % Game.tilesheetWidth;
// 					tileData.srcY = Math.floor(foreIndex / Game.tilesheetWidth);
// 					Game._renderTile(tileData);
// 				}

// 			}
// 		}	
// 	},

// 	getNoGo: function(x, y, callback) {
// 		//var i = y*Game.viewportWidthInTiles + (x%Game.viewportWidthInTiles);
// 		var noGoVal = Game.currentTiles[x][y].nogo;
// 		// console.log(noGoVal + 'Get No Go Yo');
// 		callback(noGoVal);
// 	},

// 	isMapEdge: function(x, y, callback) {
// 		//var i = y*Game.viewportWidthInTiles + (x%Game.viewportWidthInTiles);
// 		var edge = Game.currentTiles[x][y].isMapEdge;
// 		callback(edge);
// 	},

// 	beginTransition: function(x, y) {
// 		var getThisManyX,
// 		getThisManyY,
// 		getThisX,
// 		getThisY;
		
// 		//left
// 		if(x === 0) {
// 			Game.nextX = Game.masterX - (Game.viewportWidthInTiles - 1);
// 			Game.stepX = -1;
// 			Game.shiftArray = -1;
// 			Game.numberOfSteps = 29;
// 			Game.stepDirection = 'left';
// 			getThisManyX = Game.viewportWidthInTiles - 1;
// 			getThisManyY = Game.viewportHeightInTiles;
// 			getThisX = Game.nextX;
// 			getThisY = Game.masterY;
// 		}

// 		//right
// 		else if(x === Game.viewportWidthInTiles - 1) {
// 			Game.nextX = Game.masterX + Game.viewportWidthInTiles - 1;
// 			Game.stepX = 1;
// 			Game.shiftArray = 1;
// 			Game.numberOfSteps = 29;
// 			Game.stepDirection = 'right';
// 			getThisManyX = Game.viewportWidthInTiles - 1;
// 			getThisManyY = Game.viewportHeightInTiles;
// 			getThisX = Game.nextX + 1;
// 			getThisY = Game.masterY;
// 		}

// 		//up
// 		else if(y === 0) {
// 			Game.nextY = Game.masterY - (Game.viewportHeightInTiles - 1);
// 			Game.stepY = -1;
// 			Game.shiftArray = -Game.totalviewportHeightInTiles;
// 			Game.numberOfSteps = 14;
// 			Game.stepDirection = 'up';
// 			getThisManyX = Game.viewportWidthInTiles;
// 			getThisManyY = Game.viewportHeightInTiles - 1;
// 			getThisX = Game.masterX;
// 			getThisY = Game.nextY;
// 		}

// 		//down
// 		else if(y === Game.viewportHeightInTiles - 1) {
// 			Game.nextY = Game.masterY+Game.viewportHeightInTiles - 1;
// 			Game.stepY = 1;
// 			Game.shiftArray = Game.totalviewportHeightInTiles;
// 			Game.numberOfSteps = 14;
// 			Game.stepDirection = 'down';
// 			getThisManyX = Game.viewportWidthInTiles;
// 			getThisManyY = Game.viewportHeightInTiles - 1;
// 			getThisX = Game.masterX;
// 			getThisY = Game.nextY + 1;
// 		}
		
// 		Game.stepNumber = 0;
// 		Game._getTiles(getThisX, getThisY, getThisManyX, getThisManyY, function() {
// 			Game._stepTransition();
// 		});
// 	},

// 	_stepTransition: function() {
// 		if(Game.stepNumber !== Game.numberOfSteps) {
// 			Game._updateAndDraw();
// 		}
// 		// if(Game.masterX!=Game.nextX){
// 		// 	Game.masterX+=Game.stepX;
// 		// 	Game._updateAndDraw();
// 		// }
// 		// else if(Game.masterY!=Game.nextY){
// 		// 	Game.masterY+=Game.stepY;
// 		// 	Game._updateAndDraw();
// 		// }
// 		else {
// 			Game._endTransition();
// 		}
// 	},

// 	_endTransition: function() {
// 		inTransit = false;
// 	},

// 	_updateAndDraw: function() {
// 		Game.stepNumber += 1;
// 		//--------RIGHT------------
// 		//go thru current array and shift everthing
// 		if(Game.stepDirection === 'right') {
// 			//shift all except last column
// 			for(var i = 0; i < Game.viewportWidthInTiles - 1; i+=1) {
// 				for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
// 					Game.currentTiles[i][j] = Game.currentTiles[ i + 1 ][j];
// 				}
// 			}
			
// 			//shift a new column from the next array to the last spot
// 			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
// 				Game.currentTiles[Game.viewportWidthInTiles - 1][j] = Game.nextTiles[Game.stepNumber - 1][j];
// 			}
// 			Game.masterX += 1;
// 		}

// 		//--------LEFT------------
// 		//go thru current array and shift everthing
// 		if(Game.stepDirection === 'left') {
// 			//shift all except last column
// 			for(var i = Game.viewportWidthInTiles - 1; i > 0; i-=1) {
// 				for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
// 					Game.currentTiles[i][j] = Game.currentTiles[ i - 1 ][j];
// 				}
// 			}
// 			//shift a new column from the next array to the last spot
// 			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
// 				Game.currentTiles[0][j] = Game.nextTiles[Game.nextTiles.length - Game.stepNumber ][j];
// 			}
// 			Game.masterX -= 1;
// 		}

// 		//--------UP------------
// 		//go thru current array and shift everthing
// 		if(Game.stepDirection==='up') {
// 			//shift all except last column
// 			for(var j = Game.viewportHeightInTiles - 1; j > 0; j-=1) {
// 				for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
// 					Game.currentTiles[i][j] = Game.currentTiles[i][j - 1];
// 				}
// 			}
// 			//shift a new column from the next array to the last spot
// 			for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
// 				Game.currentTiles[i][0] = Game.nextTiles[i][Game.nextTiles[0].length - Game.stepNumber];
// 			}
// 			Game.masterY -= 1;
// 		}

// 		//--------DOWN------------
// 		//go thru current array and shift everthing
// 		if(Game.stepDirection === 'down') {
// 			//shift all except last column
// 			for(var j = 0; j < Game.viewportHeightInTiles - 1; j+=1) {
// 				for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
// 					Game.currentTiles[i][j] = Game.currentTiles[i][j + 1];
// 				}
// 			}
// 			//shift a new column from the next array to the last spot
// 			for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
// 				Game.currentTiles[i][Game.viewportHeightInTiles - 1] = Game.nextTiles[i][Game.stepNumber - 1];
// 			}
// 			Game.masterY += 1;
// 		}




// 		Game._renderAll();
// 		requestAnimFrame(Game._stepTransition); 
// 	}
// };

$(document).ready(function() {
		
	//change cursor on mouse move
	$('.gameboard').mousemove(function(m) {
		$game.$mouse.updateMouse(m.pageX, m.pageY, this.offsetLeft, this.offsetTop,function(x, y, c) {
			
			//c is true if the mouse snaps to a new grid
			if(c){
				$game.isNoGo(x, y, function(noGoValue) {
					$('.cursor').css({
						'left': x * 32,
						'top': y * 32,
						'border-color': noGoValue ? 'red' : 'white',
					});
				});
			}
		});
 	});

 	//figure out if we should transition (or do other stuff later)
 	$('.gameboard').click(function(m) {
 		if( !$game.inTransit ){
 			$game.$mouse.updateMouse(m.pageX, m.pageY, this.offsetLeft, this.offsetTop, function(x, y, c) {
 				
 				//if it ISN'T a no go, then do some stuff
 				$game.isNoGo(x, y, function(resp) {
 					if(!resp) {
 						//it is a go, so move character, THEN transition if edge
 						$game.$player.move(x, y);
 					}
 				
 				});
 			});
 		}
 	});
});


angular.module('multiPlayer', ['ssAngular'])
.controller('PlayerController',function($scope,$http,pubsub,rpc) {
	//rpc('multiplayer.init');
	$scope.$on('ss-numActivePlayers', function(event,num) {
		$scope.numActivePlayers = num;
	});
	
	// $scope.players;
	// $scope.infos = 
	// {
	// 	'id': 0,
	// 	'x': Math.floor(Math.random()*500),
	// 	'y': Math.floor(Math.random()*400+100),
	// 	'r': Math.floor(Math.random()*250),
	// 	'g': Math.floor(Math.random()*250),
	// 	'b': Math.floor(Math.random()*250)
	// }
	
	// console.log($scope.infos);
	// rpc('multiplayer.addMe',$scope.infos);
	// $scope.messages = [];
	// $scope.streaming = false;
	// $scope.status = '';
	// var quadInView = rpc('multiplayer.getMapData',0,function(data){
	// 	console.log(data);
	// });


	// $scope.$on('ss-count', function(event,num) {
	// 	$scope.playerCount = num;
	// });
	// $scope.$on('ss-allPlayers',function(event,nubes){
	// 	$scope.players = nubes;
	// });

	
});
// angular.module('exampleApp', ['ssAngular'])
// .controller('SSCtrl',function($scope,pubsub,rpc) {
// 	$scope.messages = []
// 	$scope.streaming = false;
// 	$scope.status = '';
// 	$scope.cx =40;
// 	$scope.cy = 200;
// 	$scope.$on('ss-example', function(event,msg) {
// 		$scope.messages.push(msg);
// 	});
	
// 	$scope.toggleData = function() {
// 		if(!$scope.streaming) {
// 			$scope.streaming = true;
// 			$scope.status = rpc('example.on');
// 		}
// 		else {
// 			$scope.streaming = true;
// 			$scope.messages = [];
// 			$scope.status = rpc('example.off', 'Too random');
// 		}
// 	};
// });
