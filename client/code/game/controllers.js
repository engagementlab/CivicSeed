// javascript-astar
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Includes Binary Heap (with modifications) from Marijn Haverbeke. 
// http://eloquentjavascript.net/appendix2.html

var GraphNodeType = { 
    OPEN: 1, 
    WALL: 0 
};

// Creates a Graph class used in the astar search algorithm.
function Graph(grid) {
    var nodes = [];

    for (var x = 0; x < grid.length; x++) {
        nodes[x] = [];
        
        for (var y = 0, row = grid[x]; y < row.length; y++) {
            nodes[x][y] = new GraphNode(x, y, row[y]);
        }
    }

    this.input = grid;
    this.nodes = nodes;
}

Graph.prototype.toString = function() {
    var graphString = "\n";
    var nodes = this.nodes;
    var rowDebug, row, y, l;
    for (var x = 0, len = nodes.length; x < len; x++) {
        rowDebug = "";
        row = nodes[x];
        for (y = 0, l = row.length; y < l; y++) {
            rowDebug += row[y].type + " ";
        }
        graphString = graphString + rowDebug + "\n";
    }
    return graphString;
};

function GraphNode(x,y,type) {
    this.data = { };
    this.x = x;
    this.y = y;
    this.pos = {
        x: x, 
        y: y
    };
    this.type = type;
}

GraphNode.prototype.toString = function() {
    return "[" + this.x + " " + this.y + "]";
};

GraphNode.prototype.isWall = function() {
    return this.type == GraphNodeType.WALL;
};


function BinaryHeap(scoreFunction){
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    },
    pop: function() {
        // Store the first element so we can return it later.
        var result = this.content[0];
        // Get the element at the end of the array.
        var end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
             this.content[0] = end;
             this.bubbleUp(0);
        }
        return result;
    },
    remove: function(node) {
        var i = this.content.indexOf(node);
    
        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        var end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end;
            
            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            }
            else {
                this.bubbleUp(i);
            }
        }
    },
    size: function() {
        return this.content.length;
    },
    rescoreElement: function(node) {
        this.sinkDown(this.content.indexOf(node));
    },
    sinkDown: function(n) {
        // Fetch the element that has to be sunk.
        var element = this.content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {

            // Compute the parent element's index, and fetch it.
            var parentN = ((n + 1) >> 1) - 1,
                parent = this.content[parentN];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                // Update 'n' to continue at the new position.
                n = parentN;
            }

            // Found a parent that is less, no need to sink any further.
            else {
                break;
            }
        }
    },
    bubbleUp: function(n) {
        // Look up the target element and its score.
        var length = this.content.length,
            element = this.content[n],
            elemScore = this.scoreFunction(element);
        
        while(true) {
            // Compute the indices of the child elements.
            var child2N = (n + 1) << 1, child1N = child2N - 1;
            // This is used to store the new position of the element,
            // if any.
            var swap = null;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
            // Look it up and compute its score.
            var child1 = this.content[child1N],
                child1Score = this.scoreFunction(child1);

            // If the score is less than our element's, we need to swap.
            if (child1Score < elemScore)
                swap = child1N;
            }

            // Do the same checks for the other child.
            if (child2N < length) {
                var child2 = this.content[child2N],
                    child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }

            // Otherwise, we are done.
            else {
                break;
            }
        }
    }
};





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
		graphTiles: [],
		shiftArray: 0,
		stepNumber: 0,
		numberOfSteps: 0,
		stepDirection: null,
		inTransit: false,
		graph: null,
	
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
			ss.rpc('player.getMapData', x, y, x + x2, y + y2, function(response) {
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
	
			$game.gridTiles = new Array($game.VIEWPORT_HEIGHT);

			for(var y = 0; y < $game.VIEWPORT_HEIGHT; y += 1) {
					
				$game.gridTiles[y] = new Array($game.VIEWPORT_WIDTH);

				for(var  x = 0; x < $game.VIEWPORT_WIDTH; x += 1) {		
					
					//console.log(x+", "+ y);
					$game.isNoGo(x, y, function(val) {
						//console.log(val);
						$game.gridTiles[y][x] = val ? 0 : 1;
					});

				}	
			}

			$game.graph = new Graph($game.gridTiles);
			var st = $game.graph.toString();
			console.log(st);
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
				getThisX = $game.nextX + 1;
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
				getThisY = $game.nextY + 1;
			}

			$game.getTiles(getThisX, getThisY, getThisManyX, getThisManyY, function() {
				$game.dataLoaded = true;
				console.log(getThisX);
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

			//now that the transition has ended, create a new grid
			$game.createPathGrid(function() {
				console.log("grid is ready for pathfinding");
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


			$game.$player.slide();
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
			ss.rpc('player.init', function(response) {
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

							$game.createPathGrid(function() {

							});
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

		renderPath: function(x, y) {
			// _charactersContext.clearRect(
			// 	0,
			// 	0,
			// 	960,
			// 	480
			// );
			_charactersContext.drawImage(
			_tilesheet, 
			3 * $game.TILE_SIZE, 
			1 * $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE,
			x * $game.TILE_SIZE,
			y * $game.TILE_SIZE,
			$game.TILE_SIZE,
			$game.TILE_SIZE
			);

		},

		renderPlayer: function(tileData) {
			_charactersContext.clearRect(
				tileData.prevX * $game.TILE_SIZE,
				(tileData.prevY - 1) * $game.TILE_SIZE,
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
				(tileData.destY - 1) * $game.TILE_SIZE,
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

	var _currentX = 10,
 		_currentY = 12,
 		_currentMove = 0,
 		_willTravel = null;
		
	
	$game.$player = {

		seriesOfMoves: null,

		//private methods

		init: function() {
				
			var tileData = {
				srcX: 0,
				srcY: 0,
				destX: _currentX,
				destY: _currentY,
				prevX: 0,
				prevY: 0
			}
			
			$game.$renderer.renderPlayer(tileData);	
			console.log("render me");
		},

		move: function () {
			//note: x and y are really flipped!!!
			
			_currentMove += 1;
			if(_currentMove >= $game.$player.seriesOfMoves.length) {
				$game.$player.endMove();
			}
			else {
				var playerInfo = {
					srcX: 0,
					srcY: 0,
					destX: $game.$player.seriesOfMoves[_currentMove].y,
					destY: $game.$player.seriesOfMoves[_currentMove].x,
					prevX: _currentX,
					prevY: _currentY
				}

			
				$game.$renderer.renderPlayer(playerInfo);

				_currentX  = $game.$player.seriesOfMoves[_currentMove].y;
				_currentY  = $game.$player.seriesOfMoves[_currentMove].x;

				requestAnimFrame($game.$player.move);
			}
		},

		endMove: function () {
			//console.log("travel time");
			if(_willTravel){
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
		},

		
		beginMove: function(x, y) {

			//check if it is an edge in here, to load data while moving player
			$game.isMapEdge(x, y, function(isIt) {
				_willTravel = false;
				//if a transition is necessary, load new data
				if(!isIt) {
					if(x === 0 || x === 29 || y === 0 || y === 14) {
						_willTravel = true;
						$game.calculateNext(x, y, function() {
							//data is loaded!
							console.log("next quadrant is loaded!");
							// $game.$player.getPath();
						});
					}
				}

				//consider grouping this under a new function to call once 
				//map stuff has loaded in case it hasn't
				_currentMove = -1;
				var start = $game.graph.nodes[_currentY][_currentX];
  				var end = $game.graph.nodes[y][x];
    			var result = $game.$astar.search($game.graph.nodes, start, end);
    			
    			ss.rpc('player.movePlayer', result);	

			});
		},

		slide: function() {
			var prevX  = _currentX,
				prevY = _currentY;

			if($game.stepDirection === 'right') {
				_currentX -= 1;
			}
			else if($game.stepDirection === 'left') {
				_currentX += 1;
			}
			else if($game.stepDirection === 'up') {
				_currentY += 1;
			}
			else if($game.stepDirection === 'down') {
				_currentY -= 1;
			}

			var playerInfo = {
				srcX: 0,
				srcY: 0,
				destX: _currentX,
				destY: _currentY,
				prevX: prevX,
				prevY: prevY
			}
			
			$game.$renderer.renderPlayer(playerInfo);	
		}
	};

})();


//init file
$(function() {
	$game.init();
});

//mouse stufff
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


//courtesy of github/bgrins, pathfinding algorithm
(function() {
	$game.$astar = {
	    init: function(grid) {
	        for(var x = 0, xl = grid.length; x < xl; x++) {
	            for(var y = 0, yl = grid[x].length; y < yl; y++) {
	                var node = grid[x][y];
	                node.f = 0;
	                node.g = 0;
	                node.h = 0;
	                node.cost = node.type;
	                node.visited = false;
	                node.closed = false;
	                node.parent = null;
	            }
	        }
	    },
	    heap: function() {
	        return new BinaryHeap(function(node) { 
	            return node.f; 
	        });
	    },
	    search: function(grid, start, end, diagonal, heuristic) {
	        $game.$astar.init(grid);
	        heuristic = heuristic || $game.$astar.manhattan;
	        diagonal = !!diagonal;

	        var openHeap = $game.$astar.heap();

	        openHeap.push(start);

	        while(openHeap.size() > 0) {

	            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
	            var currentNode = openHeap.pop();

	            // End case -- result has been found, return the traced path.
	            if(currentNode === end) {
	                var curr = currentNode;
	                var ret = [];
	                while(curr.parent) {
	                    ret.push(curr);
	                    curr = curr.parent;
	                }
	                return ret.reverse();
	            }

	            // Normal case -- move currentNode from open to closed, process each of its neighbors.
	            currentNode.closed = true;

	            // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
	            var neighbors = $game.$astar.neighbors(grid, currentNode, diagonal);

	            for(var i=0, il = neighbors.length; i < il; i++) {
	                var neighbor = neighbors[i];

	                if(neighbor.closed || neighbor.isWall()) {
	                    // Not a valid node to process, skip to next neighbor.
	                    continue;
	                }

	                // The g score is the shortest distance from start to current node.
	                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
	                var gScore = currentNode.g + neighbor.cost;
	                var beenVisited = neighbor.visited;

	                if(!beenVisited || gScore < neighbor.g) {

	                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
	                    neighbor.visited = true;
	                    neighbor.parent = currentNode;
	                    neighbor.h = neighbor.h || heuristic(neighbor.pos, end.pos);
	                    neighbor.g = gScore;
	                    neighbor.f = neighbor.g + neighbor.h;

	                    if (!beenVisited) {
	                        // Pushing to heap will put it in proper place based on the 'f' value.
	                        openHeap.push(neighbor);
	                    }
	                    else {
	                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
	                        openHeap.rescoreElement(neighbor);
	                    }
	                }
	            }
	        }

	        // No result was found - empty array signifies failure to find path.
	        return [];
	    },
	    manhattan: function(pos0, pos1) {
	        // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html

	        var d1 = Math.abs (pos1.x - pos0.x);
	        var d2 = Math.abs (pos1.y - pos0.y);
	        return d1 + d2;
	    },
	    neighbors: function(grid, node, diagonals) {
	        var ret = [];
	        var x = node.x;
	        var y = node.y;

	        // West
	        if(grid[x-1] && grid[x-1][y]) {
	            ret.push(grid[x-1][y]);
	        }

	        // East
	        if(grid[x+1] && grid[x+1][y]) {
	            ret.push(grid[x+1][y]);
	        }

	        // South
	        if(grid[x] && grid[x][y-1]) {
	            ret.push(grid[x][y-1]);
	        }

	        // North
	        if(grid[x] && grid[x][y+1]) {
	            ret.push(grid[x][y+1]);
	        }

	        if (diagonals) {

	            // Southwest
	            if(grid[x-1] && grid[x-1][y-1]) {
	                ret.push(grid[x-1][y-1]);
	            }

	            // Southeast
	            if(grid[x+1] && grid[x+1][y-1]) {
	                ret.push(grid[x+1][y-1]);
	            }

	            // Northwest
	            if(grid[x-1] && grid[x-1][y+1]) {
	                ret.push(grid[x-1][y+1]);
	            }

	            // Northeast
	            if(grid[x+1] && grid[x+1][y+1]) {
	                ret.push(grid[x+1][y+1]);
	            }

	        }

	        return ret;
	    }
	};

})();

(function() {
	ss.event.on('ss-playerMoved', function(moves){
  		//check if that quad is relevant to the current player
  		//this will also have the player info so as to id the appropriate one
  		$game.$player.seriesOfMoves = new Array(moves.length);
  		$game.$player.seriesOfMoves = moves;
  		$game.$player.move();

	});
})();


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
 						$game.$player.beginMove(x, y);
 					}
 				
 				});
 			});
 		}
 	});
});


// angular.module('multiPlayer', ['ssAngular'])
// .controller('PlayerController',function($scope,$http,pubsub,rpc) {
// 	//rpc('player.init');
// 	$scope.$on('ss-numActivePlayers', function(event,num) {
// 		$scope.numActivePlayers = num;
// 	});
		

// 	// $scope.players;
// 	// $scope.infos = 
// 	// {
// 	// 	'id': 0,
// 	// 	'x': Math.floor(Math.random()*500),
// 	// 	'y': Math.floor(Math.random()*400+100),
// 	// 	'r': Math.floor(Math.random()*250),
// 	// 	'g': Math.floor(Math.random()*250),
// 	// 	'b': Math.floor(Math.random()*250)
// 	// }
	
// 	// console.log($scope.infos);
// 	// rpc('player.addMe',$scope.infos);
// 	// $scope.messages = [];
// 	// $scope.streaming = false;
// 	// $scope.status = '';
// 	// var quadInView = rpc('player.getMapData',0,function(data){
// 	// 	console.log(data);
// 	// });


// 	// $scope.$on('ss-count', function(event,num) {
// 	// 	$scope.playerCount = num;
// 	// });
// 	// $scope.$on('ss-allPlayers',function(event,nubes){
// 	// 	$scope.players = nubes;
// 	// });

	
// });
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
