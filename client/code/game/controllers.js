//map formula:
//viewport width * numQuads in width - (numQuads in width-1 * 2)

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

		init: function() {
			
			//init everything:
			//renderer loads all the image files 
			$game.$renderer.init();
			//npc loads the npc data from DB
				$game.$npc.init();
			//player WILL load its previous data from DB
			$game.$player.init();
			ss.rpc('npc.init');

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
			var st = $game.graph.toString();
			console.log(st);
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
			for( var a = 0; a < $game.currentTiles.length; a += 1) {
				for( var b = 0; b < $game.currentTiles[a].length; b += 1) {
					if(x === $game.currentTiles[a][b].x && y === $game.currentTiles[a][b].y) {
						var local =  {
							x: a,
							y: b
						};
						callback(local);
					}
				}	
			}
		},				

		tick: function() {
            if($game.started) {
            	$game.$renderer.renderFrame();   
            }
			requestAnimFrame($game.tick);
		}
	};

	window.$game = $game;

})();

// map file
(function() {


})();

// renderer file
(function() {

	//TILESHEET iS 0, PlAYER IS 1, NPC is 2
	//private render vars
	var _tilesheets = [],
		_allImages = [],
		_tilesheetWidthPx= 640,
		_tilesheetHeightPx= 3136,
		_tilesheetWidth= _tilesheetWidthPx / $game.TILE_SIZE,
		_tilesheetHeight= _tilesheetHeightPx / $game.TILE_SIZE,
		_tilesheetCanvas= null,
		_backgroundContext= null,
		_foregroundContext= null,
		_charactersContext= null,
		_npcsContext= null,
		_mouseContext = null,
		_tilesheetContext= null,
		_prevMouseX = 0,
		_prevMouseY = 0,
		_hasNpc = false,
		_wasNpc = false;

	$game.$renderer = {

		ready: false,

		init: function() {
			_tilesheetCanvas = document.createElement('canvas');
        	_tilesheetCanvas.setAttribute('width', _tilesheetWidth * $game.TILE_SIZE);
        	_tilesheetCanvas.setAttribute('height', _tilesheetHeight * $game.TILE_SIZE);

	        //initialize DB and let all players know there is a new active one
			ss.rpc('player.init', function(response) {
			});

			//access the canvases for rendering
			_backgroundContext = document.getElementById('background').getContext('2d');
			_foregroundContext = document.getElementById('foreground').getContext('2d');
			_charactersContext = document.getElementById('characters').getContext('2d');
			_npcsContext = document.getElementById('npcs').getContext('2d');
			_tilesheetContext = _tilesheetCanvas.getContext('2d');

			//set stroke stuff for mouse 
			
			_allImages = ['img/game/tilesheet.png','img/game/player.png','img/game/rick.png']
			//loop through allimages, load in each one, when done,
			//renderer is ready
			$game.$renderer.loadImages(0);	
		},

		loadImages: function(num) {

			//load the images recursively until done
			_tilesheets[num] = new Image();
			_tilesheets[num].src = _allImages[num];

			_tilesheets[num].onload = function() {
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
			if($game.firstLaunch) {
				$game.firstLaunch = false;
				$game.$renderer.renderAllTiles();
				$game.$player.render();
			}
			else if($game.inTransit) {
				//render tiles (bg,bg2, fg, and npcs)
				$game.$renderer.renderAllTiles();
				$game.$player.render();
				//render player (client)
				//render other players
				//render colors
			}
			else { 
				if($game.onScreenNpcs.length > 0 ) {
					$game.$npc.animateFrame();
				}
				if($game.$player.isMoving) {
					$game.$player.render();
				}				
			}
			
		},

		renderTile: function(tileData) {
			_backgroundContext.drawImage(
			_tilesheets[0], 
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
		renderForegroundTile: function(tileData) {
			_foregroundContext.drawImage(
			_tilesheets[0], 
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
			// console.log(tileData);
			//convert x y to local 
			$game.masterToLocal(tileData.x, tileData.y, function(loc) {			
				var prevX = loc.x * $game.TILE_SIZE + tileData.prevX * $game.STEP_PIXELS;
					prevY = loc.y * $game.TILE_SIZE + tileData.prevY * $game.STEP_PIXELS;
					curX = loc.x * $game.TILE_SIZE + tileData.offX * $game.STEP_PIXELS;
					curY = loc.y * $game.TILE_SIZE + tileData.offY * $game.STEP_PIXELS;

				_charactersContext.clearRect(
					prevX,
					prevY - $game.TILE_SIZE,
					$game.TILE_SIZE*2,
					$game.TILE_SIZE*2
				);

				_charactersContext.drawImage(
					_tilesheets[1], 
					tileData.srcX,
					tileData.srcY,
					$game.TILE_SIZE*2,
					$game.TILE_SIZE*2,
					curX,
					curY - $game.TILE_SIZE,
					$game.TILE_SIZE*2,
					$game.TILE_SIZE*2
				);
			});	
		},

		renderAllTiles: function() {
			//not worried about clearing previous because every 
			//tile is being overwritten

			//if the previous render cycle had an npc, then set was to true
			_wasNpc = _hasNpc ? true : false;
		
			_hasNpc = false;

			//since we are sliding here (or first time), clear foreground context?
			_foregroundContext.clearRect(
				0,
				0,
				$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
				$game.VIEWPORT_HEIGHT * $game.TILE_SIZE
			);


			for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {	
				for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
					if(i==0 && j==0){ 
					}
					//tilemap reference to images starts at 1 instead of 0
					var backIndex = $game.currentTiles[i][j].background - 1,
						backIndex2 = $game.currentTiles[i][j].background2 - 1,
						foreIndex = $game.currentTiles[i][j].foreground - 1,
						tileStateVal = $game.currentTiles[i][j].tileState;

					//background tiles first
					tileData = {
						srcX: backIndex % _tilesheetWidth,
						srcY: Math.floor(backIndex / _tilesheetWidth),
						destX: i,
						destY: j
					};
					
					$game.$renderer.renderTile(tileData);
					
					//second layer background tiles (rocks, etc.)
					if( backIndex2 > -1) {
						tileData.srcX = backIndex2 % _tilesheetWidth;
						tileData.srcY = Math.floor(backIndex2 / _tilesheetWidth);						
						$game.$renderer.renderTile(tileData);
					}

					if(tileStateVal >= 0) {
						//get npc spritesheet data, pass it to tiledata, render
						//$game.$renderer.renderTile(tileData);
						$game.$npc.render($game.currentTiles[i][j]);
						_hasNpc = true;
					}	

					//foreground tiles 
					if(foreIndex > -1) {
						tileData.srcX = foreIndex % _tilesheetWidth;
						tileData.srcY = Math.floor(foreIndex / _tilesheetWidth);
						$game.$renderer.renderForegroundTile(tileData);
					}

						
				}
			}

			//basically if theere was one on screen and now its gone
			//do the clear fix solution to remove the edge
			if(_wasNpc && !_hasNpc) {
				$game.$renderer.clearEdgesFix();
			}
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
					$game.VIEWPORT_HEIGHT * $game.TILE_SIZE - $game.TILE_SIZE,
					$game.VIEWPORT_WIDTH * $game.TILE_SIZE,
					$game.TILE_SIZE
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

				_npcsContext.clearRect(
					curX + $game.TILE_SIZE * clearX,
					curY + $game.TILE_SIZE * clearY - $game.TILE_SIZE,
					$game.TILE_SIZE,
					$game.TILE_SIZE*2
				);
				//draw new frame of npc
				_npcsContext.drawImage(
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
				
				//nogo
				if(state === -2) { 
					_backgroundContext.strokeStyle = 'rgba(255,0,0,.4)'; // red
				}

				//go
				else if(state === -1) { 
					_backgroundContext.strokeStyle = 'rgba(0,255,0,.4)'; // greeb
				}
				//npc
				else {
					_backgroundContext.strokeStyle = 'rgba(0,0,255,.4)'; // blue	
				}
				_backgroundContext.lineWidth   = 4;
				
				//clear previous mouse
				_backgroundContext.clearRect (_prevMouseX * $game.TILE_SIZE, _prevMouseY * $game.TILE_SIZE, $game.TILE_SIZE, $game.TILE_SIZE);
				
				//redraw the background that it tarnished
				var backIndex = $game.currentTiles[_prevMouseX][_prevMouseY].background - 1,
					backIndex2 = $game.currentTiles[_prevMouseX][_prevMouseY].background2 - 1;

					_backgroundContext.drawImage(
						_tilesheets[0], 
						backIndex % _tilesheetWidth * $game.TILE_SIZE,
						Math.floor(backIndex / _tilesheetWidth) * $game.TILE_SIZE,
						$game.TILE_SIZE,
						$game.TILE_SIZE,
						_prevMouseX * $game.TILE_SIZE,
						_prevMouseY * $game.TILE_SIZE,
						$game.TILE_SIZE,
						$game.TILE_SIZE
					);
					_backgroundContext.drawImage(
						_tilesheets[0], 
						backIndex2 % _tilesheetWidth * $game.TILE_SIZE,
						Math.floor(backIndex2 / _tilesheetWidth) * $game.TILE_SIZE,
						$game.TILE_SIZE,
						$game.TILE_SIZE,
						_prevMouseX * $game.TILE_SIZE,
						_prevMouseY * $game.TILE_SIZE,
						$game.TILE_SIZE,
						$game.TILE_SIZE
					);
	

				//draw the new mouse


				_backgroundContext.strokeRect(mX+2, mY+2, $game.TILE_SIZE-4, $game.TILE_SIZE-4);
				_prevMouseX = mouse.cX;
				_prevMouseY = mouse.cY;
			});
			
		}

	};

})();


//npc file
(function() {

	var _loaded = false,
		_allNpcs = [],
		_index = 0;

	$game.$npc = {

		ready: false,
		hideTimer: null,
		isShowing: false,

		init: function() {
			//load all the npc info from the DB store it in an array
			//where the index is the id of the npc / mapIndex
			ss.rpc('npc.getNpcs', function(response) {
				//iterate through repsonses, create a key 
				//with the id and value is the object
				for(var i = 0; i < response.length; i += 1) {
					var stringId = String(response[i].id);
					_allNpcs[stringId] = response[i];
					_allNpcs[stringId].counter = 0;
					_allNpcs[stringId].currentFrame = 0;
				}  
				_loaded = true;
				$game.$npc.ready = true;
			});
		},

		//returns local x,y grid data based on mouse location
		show: function() {
			//window overlay?
			//check index below no exist
			if(!$game.$npc.isShowing) {
				var stringId = String(_index),
					curNpc = _allNpcs[stringId];
				
				//if this is false, it means we clicked the npc square 
				//that is the top one (which doesn't have a unique id in our list
				//but rather corresponds to the one below it)
				if(!curNpc) {
					_index += $game.TOTAL_WIDTH;
					stringId = String(_index);
					console.log(stringId);
					curNpc = _allNpcs[stringId];
				}

				//decide which content to show, 
				//if it is on the level of the player, show that,
				//otherwise, show random dialog
				var who = _allNpcs[stringId].name;

				if($game.$player.currentLevel === curNpc.level) {
					
					for(var q = 0; q < curNpc.dialog.question.length; q += 1) {
						$(".resourceArea").append(curNpc.dialog.question[q]).slideDown(function() {
							
						});
					}
				}
				else {
					var ran = Math.floor(Math.random() * _allNpcs[stringId].dialog.random.length),
					speak = _allNpcs[stringId].dialog.random[ran];
					
					$(".speechBubble").append("<p><span>"+who+": </span>"+speak+"</p>").slideDown(function() {
						$game.$npc.hideTimer = setTimeout($game.$npc.hide,5000);
					});
				}
				
			
				
				$game.$npc.isShowing = true;
			}
			
		},

		hide: function() {
			clearTimeout($game.$npc.hideTimer);
			$(".speechBubble").slideUp(function() {
				$game.$npc.isShowing = false;
				$(".speechBubble p").remove();
			});
			$(".resourceArea").slideUp(function() {
				$game.$npc.isShowing = false;
				$(".resourceArea p").remove();
				$(".resourceArea h2").remove();
			});
		},
		setIndex: function(i) {
			_index = i;
		},

		animateFrame: function () {
			for(var i = 0; i < $game.onScreenNpcs.length; i += 1) {
				var curId = $game.onScreenNpcs[i];
				_allNpcs[curId].counter += 1;
				if(_allNpcs[curId].counter > 15) { 
					_allNpcs[curId].counter = 0;
				}

				if(_allNpcs[curId].counter % 6 === 0) {
					_allNpcs[curId].currentFrame += 1;
					if(_allNpcs[curId].currentFrame === 4) {
						_allNpcs[curId].currentFrame = 0;
					}
					var spot = _allNpcs[curId].currentFrame;
					data = {};
					data.srcX = _allNpcs[curId].spriteMap[spot].x,
					data.srcY = _allNpcs[curId].spriteMap[spot].y,
					data.x = _allNpcs[curId].id % $game.TOTAL_WIDTH,
					data.y = Math.floor(_allNpcs[curId].id / $game.TOTAL_WIDTH);
					$game.$renderer.renderNpc(data);
				}
				
			}
		},

		render: function(tile) {
			//get npc data based on tileStateVal to string
			var data = {};
				stringId = String(tile.tileState); 
			
			data.srcX = _allNpcs[stringId].spriteMap[0].x,
			data.srcY = _allNpcs[stringId].spriteMap[0].y,
			data.x = tile.x,
			data.y = tile.y;
			$game.$renderer.renderNpc(data,false);
		}
 
	}

})();

//player file
(function() {

	//current values are there for the inbetween squares
	//master is the most previously gridded position
	
 	var	_masterX = 10,
 		_masterY = 10,
 		_offX = 0,
 		_offY = 0,
 		_prevOffX = 0,
 		_prevOffY = 0,
 		_srcX = 80,
 		_srcY = 0,
 		_curFrame = 0,
 		_numFrames = 4,
 		_numSteps = 8,
 		_currentStepIncX = 0,
 		_currentStepIncY = 0,
 		_prevStepX = 0, //deprecated
 		_prevStepY = 0, //deprecated
 		_direction = 0,
 		_willTravel = null;
		
	
	$game.$player = {

		seriesOfMoves: null,
		currentMove: 0,
		currentStep: 0,
		isMoving: false,
		npcOnDeck: false,
		ready: false,
		currentLevel: 2,

		//private methods

		init: function() {
			
			$game.$player.ready = true;
		},

		move: function () {
			/** IMPORTANT note: x and y are really flipped!!! **/
			//update the step
			$game.$player.isMoving = true;

			//if the steps between the tiles has finished,
			//update the master location, and reset steps to go on to next move 
			if($game.$player.currentStep >= _numSteps) {
				$game.$player.currentStep = 0;
				_masterX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX;
				_masterY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY;
				$game.$player.currentMove += 1;

			}

			//if we done, finish
			if($game.$player.currentMove >= $game.$player.seriesOfMoves.length) {
				$game.$player.endMove();
			}

			//if we no done, then step through it yo.
			else {
				
				//increment the current step 
				$game.$player.currentStep += 1;

				//if it the first one, then figure out the direction to face
				if($game.$player.currentStep === 1) {
					_currentStepIncX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX - _masterX;
					_currentStepIncY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY - _masterY;
					// _prevStepX = _currentX * $game.TILE_SIZE;
					// _prevStepY = _currentY * $game.TILE_SIZE;
					
					//set the previous offsets to 0 because the last visit
					//was the actual rounded master 
					_prevOffX = 0;
					_prevOffY = 0;

					//set direction for sprite sheets
					//direction refers to the y location on the sprite sheet
					//since the character will be in different rows
					//will be 0,1,2,3
					if(_currentStepIncX === 1) {
						_direction = 0;
					}
					else if(_currentStepIncX === -1) {
						_direction = 0;
					}
					else if(_currentStepIncY === -1) {
						_direction = 4;
					}
					else {
						_direction = 7;
					}
				}

				else {
					_prevOffX = _offX;
					_prevOffY = _offY;
				}
				
				_offX = $game.$player.currentStep * _currentStepIncX;
				_offY = $game.$player.currentStep * _currentStepIncY;


				// _prevStepX = _currentX;
				// _prevStepY = _currentY;

				// _currentX = (_masterX * $game.TILE_SIZE) + $game.$player.currentStep * (_currentStepIncX * $game.STEP_PIXELS ),
				// _currentY = (_masterY * $game.TILE_SIZE) + $game.$player.currentStep * (_currentStepIncY * $game.STEP_PIXELS );

				//try only changing the src (frame) every X frames
				if(($game.$player.currentStep-1)%8 == 0) {
					_curFrame += 1;
					if(_curFrame >= _numFrames) {
						_curFrame = 0;
					}
				}
				_srcX = _curFrame * $game.TILE_SIZE*2,
				_srcY =  _direction * $game.TILE_SIZE*2;

				//$game.$renderer.renderPlayer(playerInfo);
				//setTimeout($game.$player.move, 17);
				requestAnimFrame($game.$player.move);
			}
		},

		endMove: function () {

			if(_willTravel) {
				var beginTravel = function(){
					if($game.dataLoaded){
						$game.dataLoaded = false;
						$game.beginTransition();
					}	
					else{
						//keep tryin!
						setTimeout(beginTravel,50);
					}
				};
				beginTravel();
			}
			else {
				if($game.$player.npcOnDeck) {
					$game.$player.npcOnDeck = false;
					

					$game.$npc.show()
					//trigger npc to popup info and stuff
				}
				$game.$player.isMoving = false;
			}
			_offX = 0,
			_offY = 0;

			//put the character back to normal position
			_srcX = 80,
			_srcY =  _direction * $game.TILE_SIZE*2;
			
		},

		
		beginMove: function(x, y) {
			_offX = 0,
			_offY = 0;
			//check if it is an edge of the world
			$game.isMapEdge(x, y, function(anEdge) {
				_willTravel = false;
				//if a transition is necessary, load new data
				if(!anEdge) {
					if(x === 0 || x === 29 || y === 0 || y === 14) {
						_willTravel = true;
						$game.calculateNext(x, y, function() {
							//data is loaded!
							// $game.$player.getPath();
						});
					}
				}
				

				//calc local for start point for pathfinding
				$game.masterToLocal(_masterX, _masterY, function(loc) {
					var start = $game.graph.nodes[loc.y][loc.x],
						end = $game.graph.nodes[y][x],
						result = $game.$astar.search($game.graph.nodes, start, end);
					ss.rpc('player.movePlayer', result);
				});
			

				
			});
			
			
		},

		slide: function(stepX, stepY) {

			_prevOffX = stepX * _numSteps;
			_prevOffY = stepY * _numSteps;

		},

		render: function() {
			// var playerInfo = {
			// 	srcX: (($game.$player.currentStep-1)%4)*$game.TILE_SIZE*2,
			// 	srcY: _direction * $game.TILE_SIZE*2,
			// 	destX: _currentX,
			// 	destY: _currentY,
			// 	prevX: _prevStepX,
			// 	prevY: _prevStepY
			// }

			var playerInfo = {
				srcX: _srcX,
				srcY: _srcY,
				x: _masterX,
				y: _masterY,
				offX: _offX,
				offY: _offY,
				prevX: _prevOffX,
				prevY: _prevOffY
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
		index: 0,

		//returns local x,y grid data based on mouse location
		updateMouse: function(mouseInfo, clicked) {

			var x = mouseInfo.x - mouseInfo.offX;
			var y = mouseInfo.y - mouseInfo.offY;

			$game.$mouse.prevX = $game.$mouse.curX;
			$game.$mouse.prevY = $game.$mouse.curY;

			$game.$mouse.curX = Math.floor(x/32);
			$game.$mouse.curY = Math.floor(y/32);

			
			if(mouseInfo.debug){
				console.log($game.currentTiles[$game.$mouse.curX][$game.$mouse.curY]);
			}
			
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
				//render new
				var mouseStuff = {
					pX: $game.$mouse.prevX,
					pY: $game.$mouse.prevY,
					cX: $game.$mouse.curX,
					cY: $game.$mouse.curY,
				};
				$game.$renderer.renderMouse(mouseStuff); 
			}

			if(clicked) {
				
				//check if it is a nogo or npc
				//if the tile BELOW the tile clicked is npc, 
				//then user clicked the head, so act like npc
				
				$game.getTileState($game.$mouse.curX, $game.$mouse.curY, function(state) {
					//go
					if(state === -1) {
						$game.$player.beginMove($game.$mouse.curX,$game.$mouse.curY);
						$game.$npc.hide();
					}
					
					//npc
					else if(state >= 0 ) {
						//set index val so reousrce can show right one
				
						var newIndex = $game.currentTiles[$game.$mouse.curX][$game.$mouse.curY].mapIndex;

						//if you click on a different square then the previously 
						//selected npc, then hide the npc info if it is showing

						$game.$npc.setIndex(newIndex);
				
						//move them to the spot to the 
						//BOTTOM LEFT corner of the npc 
						//(consistent so we leave that open in tilemap)
						//also make sure it is not a transition tile
						$game.$player.npcOnDeck = true;
						$game.$player.beginMove($game.$mouse.curX-2,$game.$mouse.curY+2);
					}
				});
			}		
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

	                //get masterX and masterY and put them inside node
	                node.masterX = $game.currentTiles[y][x].x;
	                node.masterY = $game.currentTiles[y][x].y;
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
	                ret.push(start);
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
  		$game.$player.currentMove = 1;
  		$game.$player.currentStep = 0;
  		$game.$player.move();

	});
})();


$(document).ready(function() {
		
	//change cursor on mouse move
	$('.gameboard').mousemove(function(m) {
		var mInfo = {
			x: m.pageX,
			y: m.pageY,
			offX: this.offsetLeft,
			offY: this.offsetTop,
			debug: false
		};

		$game.$mouse.updateMouse(mInfo, false); 
 	});

 	//figure out if we should transition (or do other stuff later)
 	$('.gameboard').click(function(m) {
 	
 		if( !$game.inTransit && !$game.$player.isMoving){
 			var mInfo = {
				x: m.pageX,
				y: m.pageY,
				offX: this.offsetLeft,
				offY: this.offsetTop,
				debug: false
			};
 			$game.$mouse.updateMouse(mInfo,true);
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
