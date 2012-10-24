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
			$game.$map.init();
			//$game.$audio.init();
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
            	$game.$renderer.renderFrame();   
            }
			requestAnimFrame($game.tick);
		}
	};

	window.$game = $game;

})();

// map file
(function() {

	$game.$map = {

		coloredTiles: [], //needs x, y, display
		growingSeed: false,
		seedsInProgress: [],

		init: function() {
			setInterval($game.$map.updateMiniMap, 5000);
		},

		growSeeds: function() {


		},

		newBomb: function(bombed) {

			//THIS WILL MOVE TO THE RPC on server, NOT local
			//this will simply send out the coords of the tiles to redraw 

			for(var b = 0; b < bombed.length; b += 1) {
				//only add it to render list if it is on current screen
				$game.masterToLocal(bombed[b].x, bombed[b].y, function(loc){
	  				if(loc) {

						//if there IS a color
	  					if($game.currentTiles[loc.x][loc.y].color) {
	  						//if the tile is an owner, don't do shit
							if(!$game.currentTiles[loc.x][loc.y].color.owner) {
								//is color, no owner, add count (maybe modify color later)
								//but only if it isn't over-colored

								//if the new guy is now chief
	  							if(bombed[b].color.owner) {
	  								$game.currentTiles[loc.x][loc.y].color = bombed[b].color;

	  							}
	  							//reassign color based on previous alpha (increase)
	  							else if($game.currentTiles[loc.x][loc.y].color.a < .8 ) {
	  								$game.currentTiles[loc.x][loc.y].color.a += .15;
	  								
	  								if($game.currentTiles[loc.x][loc.y].color.a == .35) {
	  									$game.currentTiles[loc.x][loc.y].color.h = 0;
	  								}
	  								else if($game.currentTiles[loc.x][loc.y].color.a == .5) {
	  									$game.currentTiles[loc.x][loc.y].color.h = 50;
	  								}
	  								else if($game.currentTiles[loc.x][loc.y].color.a == .65) {
	  									$game.currentTiles[loc.x][loc.y].color.h = 100;
	  								}
	  								else {
	  									$game.currentTiles[loc.x][loc.y].color.h = 150;
	  								}
	  							}
	  						}
	  				
	  					}
	  					//add new color data to tile if nothing there
	  					else {
	  						$game.currentTiles[loc.x][loc.y].color = bombed[b].color;
	    				}
	  					
	  					//redraw whole tile, bg included
	  					$game.$renderer.renderTile(loc.x,loc.y);
	  					
	  					//play sound clip
	  					//$game.$audio.playSound(0);
	  				}
	  					
	  			});
			}
		},

		updateMiniMap: function() {
			//show where the player is and the colored tiles 
			//possibly all players too
			$game.$renderer.renderMiniMap();
		}
	}

})();

// renderer file
(function() {

	//TILESHEET iS 0, PlAYER IS 1, NPC is 2
	//private render vars
	var _tilesheets = [],
		_allImages = [],
		_tilesheetWidthPx= 2688,
		_tilesheetHeightPx= 2688,
		_tilesheetWidth= _tilesheetWidthPx / $game.TILE_SIZE,
		_tilesheetHeight= _tilesheetHeightPx / $game.TILE_SIZE,
		_tilesheetCanvas= null,
		_backgroundContext= null,
		_foregroundContext= null,
		_charactersContext= null,
		_npcsContext= null,
		_mouseContext = null,
		_minimapPlayerContext = null,
		_minimapTileContext = null,
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
			_minimapPlayerContext = document.getElementById('minimapPlayer').getContext('2d');
			_minimapTileContext = document.getElementById('minimapTile').getContext('2d');

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
				if($game.onScreenNpcs.length > 0) {
					$game.$npc.animateFrame();
				}
				if($game.$player.isMoving) {
					$game.$player.render();
				}
				if($game.$map.growingSeed) {
					$game.$map.growSeeds();	
				}				
			}
		},
		renderTile: function(i, j) {
			//tilemap reference to images starts at 1 instead of 0
			var backIndex = $game.currentTiles[i][j].background-1,
				backIndex2 = $game.currentTiles[i][j].background2-1,
				foreIndex = $game.currentTiles[i][j].foreground-1,
				tileStateVal = $game.currentTiles[i][j].tileState,
				colorVal = $game.currentTiles[i][j].color,

			

			tileData = {
				srcX: backIndex % _tilesheetWidth,
				srcY: Math.floor(backIndex / _tilesheetWidth),
				destX: i,
				destY: j
			};
			//base tile data info
			_backgroundContext.clearRect (
				tileData.destX * $game.TILE_SIZE, 
				tileData.destY * $game.TILE_SIZE, 
				$game.TILE_SIZE, $game.TILE_SIZE,
				$game.TILE_SIZE, $game.TILE_SIZE
			);

				//color tile first (move this above once it has transparency)
			if(colorVal) {
				tileData.color = colorVal;
				$game.$renderer.drawColor(tileData);
				//if it is an owner tile, draw a flower!

				//this will be removed when we ACTUALLY 
				//change the src of the owner tile in the DB
				if(tileData.color.owner) {
					//tileData.srcX = 17;
					//tileData.srcY = 5;
					//$game.$renderer.drawTile(tileData);
				}
			}

			//background tile 1
			if(backIndex > -1) {
				$game.$renderer.drawTile(tileData);
			}

		
							

			//second layer background tiles (rocks, etc.)
			if( backIndex2 > -1) {
				tileData.srcX = backIndex2 % _tilesheetWidth;
				tileData.srcY = Math.floor(backIndex2 / _tilesheetWidth);

				$game.$renderer.drawTile(tileData);
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
				$game.$renderer.drawForegroundTile(tileData);
			}

			

		},
		drawTile: function(tileData) {
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
		drawColor: function(tileData) {

			var hsla = 'hsla('+tileData.color.h+','+tileData.color.s +','+tileData.color.l +','+tileData.color.a + ')';
			_backgroundContext.fillStyle = hsla;
			_backgroundContext.fillRect(
				tileData.destX * $game.TILE_SIZE,
				tileData.destY * $game.TILE_SIZE,
				$game.TILE_SIZE,
				$game.TILE_SIZE
				);
		},
		drawForegroundTile: function(tileData) {
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
					$game.TILE_SIZE,
					$game.TILE_SIZE*2
				);

				_charactersContext.drawImage(
					_tilesheets[1], 
					tileData.srcX,
					tileData.srcY,
					$game.TILE_SIZE,
					$game.TILE_SIZE*2,
					curX,
					curY - $game.TILE_SIZE,
					$game.TILE_SIZE,
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
					$game.$renderer.renderTile(i,j);
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
				
				//clear previous mouse
				_backgroundContext.clearRect (_prevMouseX * $game.TILE_SIZE, _prevMouseY * $game.TILE_SIZE, $game.TILE_SIZE, $game.TILE_SIZE);
				
				$game.$renderer.renderTile(_prevMouseX, _prevMouseY);
				// //evenetually modularize this shit son
				// //redraw the background that it tarnished
				// var backIndex = $game.currentTiles[_prevMouseX][_prevMouseY].background - 1,
				// 	backIndex2 = $game.currentTiles[_prevMouseX][_prevMouseY].background2 - 1;

				// var tileData = {
				// 	srcX: backIndex % _tilesheetWidth,
				// 	srcY: Math.floor(backIndex / _tilesheetWidth),
				// 	destX: _prevMouseX,
				// 	destY: _prevMouseY
				// };

				// $game.$renderer.renderTile(tileData);

				// tileData.srcX = backIndex2 % _tilesheetWidth;
				// tileData.srcY = Math.floor(backIndex2 / _tilesheetWidth);
				
				// $game.$renderer.renderTile(tileData);
				
				// tileData.color = $game.currentTiles[_prevMouseX][_prevMouseY].color;
				
				// if(tileData.color !== undefined) {
				// 	$game.$renderer.renderColor(tileData);	
				// }
				
	
				//do the players color if seed mode ya hurr?
				// if($game.$player.seedMode) {
				// 	_backgroundContext.strokeStyle = 'rgba(100,100,100,.4)';
				// 	_backgroundContext.fillStyle = 'rgba(250,0,250,.5)';
				// 	_backgroundContext.fillRect(mX+2, mY+2, $game.TILE_SIZE-4, $game.TILE_SIZE-4);
				// 	_backgroundContext.strokeRect(mX+2, mY+2, $game.TILE_SIZE-4, $game.TILE_SIZE-4);

				// }
				//regular exploring mode

				// else {
					//nogo

					if($game.$player.seedMode) {
						_backgroundContext.strokeStyle = 'rgba(255,255,0,.4)'; // red
					}
					else {
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
					}
					
					_backgroundContext.strokeRect(mX+2, mY+2, $game.TILE_SIZE-4, $game.TILE_SIZE-4);
				//}
				
				_backgroundContext.lineWidth = 4;

				

				//draw the new mouse
				

				_prevMouseX = mouse.cX;
				_prevMouseY = mouse.cY;
			});
			
		},

		renderMiniMap: function() {
			_minimapPlayerContext.clearRect(0,0,$game.TOTAL_WIDTH,$game.TOTAL_HEIGHT);

			//draw player
			_minimapPlayerContext.fillStyle = 'rgb(255,0,0)';
			_minimapPlayerContext.fillRect(
				$game.$player._masterX,
				$game.$player._masterY,
				4,
				4
				);
		},
		renderMiniTile: function(sq) {
			
			var hsla = 'hsla('+sq.color.h+','+sq.color.s+','+sq.color.l+',1)';
			_minimapTileContext.fillStyle = hsla;
			_minimapTileContext.fillRect( 
				sq.x,
				sq.y,
				1,
				1
				);
		}

	};

})();


//npc file
(function() {

	var _loaded = false,
		_allNpcs = [],
		_index = 0;
		_currentSlide = 0;
		_numSlides = 0;
		_curNpc = null;
		_answered = false;
		_who = null;

	$game.$npc = {

		ready: false,
		hideTimer: null,
		isResource: false,
		isChat: false,

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

			//bind all the buttons 
			
					
		},

		show: function() {
			if(!$game.$npc.isResource && !$game.$npc.isChat) {
				var stringId = String(_index);
				_curNpc = _allNpcs[stringId];
				
				//if this is false, it means we clicked the npc square 
				//that is the top one (which doesn't have a unique id in our list
				//but rather corresponds to the one below it)
				if(!_curNpc) {
					_index += $game.TOTAL_WIDTH;
					stringId = String(_index);
					_curNpc = _allNpcs[stringId];
				}

				_who = _allNpcs[stringId].name;

				if($game.$player.currentLevel === _curNpc.level) {
					$game.$npc.isResource = true;
					$game.$npc.showPrompt();
				}
				else {
					$game.$npc.isChat = true;
					$game.$npc.showChat();
				}
			}
			
		},
		//returns local x,y grid data based on mouse location
		showPrompt: function() {
			//window overlay?
			//check index below no exist

			//figure out which npc was clicked
			//this was set on the click if an npc was clicked

			
			//this number should be dynamically generated based on html content
			//reset the slide to 0 
			_currentSlide = 0;

			//the prompt looks like a chat, so show the damn chat son
			var speak = 'I have a resource about (pull from db), would you like to see it?',
				buttons = '<button class="btn btn-success">Yes</button><button class="btn btn-danger">No</button>';

			$('.speechBubble').css('height',55);
			$('.speechBubble').append('<p><span class="speakerName">'+_who+': </span>'+speak+buttons+'</p>').slideDown(function() {
				$(".speechBubble .btn-success").bind("click", (function () {
					$game.$npc.showResource();
				}));
				$(".speechBubble .btn-danger").bind("click", (function () {
					$game.$npc.hideChat();
				}));
			});
						
		},

		showResource: function() {

			_numSlides = 2;

			$('.resourceStage').empty();
			$('.resourceStage').load(_curNpc.resource.url,function() {
				_numSlides = $('.resourceStage .pages > .page').length;
			});
			
			$('.speechBubble').slideUp(function() {
				$('.speechBubble').empty();
				$game.$npc.isChat = false;
				$game.$npc.isResource = true;
				$(".speechBubble .btn-success").unbind("click");
				$(".speechBubble .btn-danger").unbind("click");

				//ready to show the resource now 
				var speak = _curNpc.dialog.question[0];
				$('.resourceArea').empty();
				$game.$npc.addContent();
				$game.$npc.addButtons();
				$('.resourceArea').slideDown();
			});
			
		},

		addButtons: function() {
		//determine which buttons to put on the resource area 
		//based on page number, if its a form yet, etc.
		//buttons: next, back, answer, close
		//bind functionality

		//assume that the buttons were removed before 
			
			

		//if its been answered, we have a close button
			if(_answered) {
				$('.resourceArea').append('<button class="btn btn-primary closeButton">Close</button>');
				$('.closeButton').text('Close');
				$(".closeButton").bind("click", (function () {
					$game.$npc.hideResource();
				}));
			}
			else {
				//if its the first page, we DEF. have a next and no back
				if(_currentSlide === 0) {
					$('.resourceArea').append('<button class="btn btn-primary nextButton">Next</button>');		
					$('.nextButton').text('Next');
					$(".nextButton").bind("click", (function () {
						$game.$npc.nextSlide();
					}));
				}
				
				//if its not the first page or the last page, we have both
				else if(_currentSlide > 0 && _currentSlide < _numSlides) {
					$('.resourceArea').append('<button class="btn btn-primary nextButton">Next</button><button class="btn btn-inverse backButton">Back</button>');				
					$('.nextButton').text('Next');
					$('.backButton').text('Back');
					$(".nextButton").bind("click", (function () {
						$game.$npc.nextSlide();
					}));
					$(".backButton").bind("click", (function () {
						$game.$npc.previousSlide();
					}));
				}

				//if its the last page, we have an answer button and a back
				else if(_currentSlide === _numSlides) {
					$('.resourceArea').append('<button class="btn btn-success answerButton">Answer</button><button class="btn btn-inverse backButton">Back</button>');				
					$('.answerButton').text('Answer');
					$('.backButton').text('Back');
					$(".answerButton").bind("click", (function () {
						$game.$npc.submitAnswer();
					}));
					$(".backButton").bind("click", (function () {
						$game.$npc.previousSlide();
					}));
				}	
			}
		},

		addContent: function() {

			//add the close button
			
			$('.resourceArea').append('<a href="#" style="font-size: 24px;"><i class="icon-remove-sign icon-large"></i></a>');
			$(".resourceArea a i").bind("click", (function () {
				$game.$npc.hideResource();
				return false;
			}));
			//add the answer form
			if(_answered) {
				var speak = 'Well done!  Take this (thing from db) and solve that riddle!';
				$('.resourceArea').append('<p><span class="speakerName">'+_who+': </span>'+speak+'</p>');
				$('.resourceArea').append('<p><br><img src="http://www.fordesigner.com/imguploads/Image/cjbc/zcool/png20080525/1211728737.png"></p>');		
			}
			else {
				if(_currentSlide === _numSlides) {
					var finalQuestion = _curNpc.dialog.question[1],
						inputBox = '<form><input></input></form>';	
					$('.resourceArea').append('<p><span class="speakerName">'+_who+': </span>'+finalQuestion+'</p>'+inputBox);
				}
				else if(_currentSlide === 0) {
					var intro = _curNpc.dialog.question[0],
						inputBox = '<form><input></input></form>',
						content = $('.resourceStage .pages .page').get(0).innerHTML;

					$('.resourceArea').append('<p><span class="speakerName">'+_who+': </span>'+intro+'</p>'+content);
				}
				else if(_currentSlide > 0) {
					var content = $('.resourceStage .pages .page').get(_currentSlide).innerHTML;
					$('.resourceArea').append(content);
				}		
			}
			
			

		},

		showChat: function() {		
			var ran = Math.floor(Math.random() * _curNpc.dialog.random.length),
			speak = _curNpc.dialog.random[ran];
			
			$('.speechBubble').css('height',40);
			$('.speechBubble').append('<p><span class="speakerName">'+_who+': </span>'+speak+'</p>').slideDown(function() {
				$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,5000);
			});
			
		},

		hideResource: function() {
			$('.resourceArea').slideUp(function() {
				$('.resourceArea p').remove();
				$('.resourceArea h2').remove();
				$game.$npc.isResource = false;
			});		
		},

		hideChat: function() {
			
			clearTimeout($game.$npc.hideTimer);
			$('.speechBubble').slideUp(function() {
				$('.speechBubble').empty();
				$game.$npc.isChat = false;
				$game.$npc.isResource = false;
				$(".speechBubble .btn-success").unbind("click");
				$(".speechBubble .btn-danger").unbind("click");
			});
		},

		//super ghetto hack to go back a page
		previousSlide: function() {
			_currentSlide -= 2;
			$game.$npc.nextSlide();
		},

		nextSlide: function() {
			
			_currentSlide += 1;

			//wipe the resource area
			$('.resourceArea').empty();

			$game.$npc.addContent();

			$game.$npc.addButtons();

			//add content (depending on what it is )
			
			
			
		},

		submitAnswer: function() {
			//if the answer is true, give them something!
			if(true) {
				_answered = true;
				$game.$npc.nextSlide();
			}
			else {

			}

			//otherwise tell them they are wrong, stay on form page 


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
			$game.$renderer.renderNpc(data);
		}
 
	}

})();

//player file
(function() {

	//current values are there for the inbetween squares
	//master is the most previously gridded position
	
 	var _offX = 0,
 		_offY = 0,
 		_prevOffX = 0,
 		_prevOffY = 0,
 		_srcX = 0,
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

		_masterX: 10,
 		_masterY: 10,
		seriesOfMoves: null,
		currentMove: 0,
		currentStep: 0,
		isMoving: false,
		npcOnDeck: false,
		ready: false,
		currentLevel: 1,
		seedMode: false,
		hue: 0,
		saturation: '90%', 
		lightness: '80%',  

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
				$game.$player._masterX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX;
				$game.$player._masterY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY;
				$game.$player.currentMove += 1;
				//render mini map every spot player moves
				$game.$renderer.renderMiniMap();

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
					_currentStepIncX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX - $game.$player._masterX;
					_currentStepIncY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY - $game.$player._masterY;
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
						_direction = 2;
					}
					else if(_currentStepIncX === -1) {
						_direction = 1;
					}
					else if(_currentStepIncY === -1) {
						_direction = 4;
					}
					else {
						_direction = 3;
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

				// _currentX = ($game.$player._masterX * $game.TILE_SIZE) + $game.$player.currentStep * (_currentStepIncX * $game.STEP_PIXELS ),
				// _currentY = ($game.$player._masterY * $game.TILE_SIZE) + $game.$player.currentStep * (_currentStepIncY * $game.STEP_PIXELS );

				//try only changing the src (frame) every X frames
				if(($game.$player.currentStep-1)%8 == 0) {
					_curFrame += 1;
					if(_curFrame >= _numFrames) {
						_curFrame = 0;
					}
				}
				_srcX = _curFrame * $game.TILE_SIZE,
				_srcY =  _direction * $game.TILE_SIZE*2;

				//$game.$renderer.renderPlayer(playerInfo);
				//setTimeout($game.$player.move, 17);
				requestAnimFrame($game.$player.move);
			}
		},

		endMove: function () {
			_offX = 0,
			_offY = 0;

			//put the character back to normal position
			_srcX = 0,
			_srcY =  0;

			_prevOffX= 0;
			_prevOffY= 0;

			$game.$player.render();
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

						$game.$npc.show();					
					//trigger npc to popup info and stuff
				}
				$game.$player.isMoving = false;
			}
			

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
				$game.masterToLocal($game.$player._masterX, $game.$player._masterY, function(loc) {
					var start = $game.graph.nodes[loc.y][loc.x],
						end = $game.graph.nodes[y][x],
						result = $game.$astar.search($game.graph.nodes, start, end);
						if(result.length > 0) {
							ss.rpc('player.movePlayer', result);
						}
						else {

						}
					
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
				x: $game.$player._masterX,
				y: $game.$player._masterY,
				offX: _offX,
				offY: _offY,
				prevX: _prevOffX,
				prevY: _prevOffY
			}
			$game.$renderer.renderPlayer(playerInfo);
		},

		dropSeed: function(options) {
			//add color the surrounding tiles
			var oX, oY, mX, mY;


			if(options.mouse) {
				oX = options.x,
				oY = options.y;
				mX = $game.currentTiles[oX][oY].x;
				mY = $game.currentTiles[oX][oY].y;
			}
			else {
				$game.masterToLocal($game.$player._masterX, $game.$player._masterY,  function(loc) {
					oX = loc.x;
					oY = loc.y;
				});
				mX = $game.$player._masterX;
				mY = $game.$player._masterY;
			}

			var bombed = [];
			//color algorithms for different levels:
			if($game.$player.currentLevel === 0) {
				var square = {
					x: $game.$player._masterX,
					y: $game.$player._masterY,
					color: 
					{
						h: Math.floor(Math.random()),
						s: $game.$player.saturation,
						l: $game.$player.lightness,
						a: .8,
						owner: 'Russell'
					}
				};

				bombed.push(square);
				ss.rpc('player.dropSeed', bombed);
			}

			//not the "intro level"
			else {
				//do a check to see if the tile is owned
				
				if($game.currentTiles[oX][oY].color) {
					if($game.currentTiles[oX][oY].color.owner) {
						console.log('can\'t plant here.');
					}
				//if it's colored and NOT owned
					else {
						$game.$player.addColor(true, mX,mY);
					}	
				}
				//if it is not colored at all
				else{
					$game.$player.addColor(false, mX, mY);
				}
				
			}
			
		},

		addColor: function(isColored, x, y) {
			var bombed = [];
			//square
			//start at top left corner
			var origX = x - 1;
			var origY = y - 1;
			var newHue = Math.floor(Math.random()*255);
			for(var a = 0; a<3; a++) {
				for(var b = 0; b<3; b++) {
					
					var square = {
						x: origX + a,
						y: origY + b,
						
						color: 
						{
							h: newHue,
							s: $game.$player.saturation,
							l: $game.$player.lightness,
							a: .2,
							owner: false
						}
					};

					//only add it if it is on the map	
					if(origX + a>-1 && origX + a<$game.TOTAL_WIDTH && origY + b>-1 && origY + b < $game.TOTAL_HEIGHT) {
						//assign the middle one the owner
						if( a === 1 && b === 1) {
							//this will be put in the ACTUAL DB,
							//instead of local
							square.color.a = 1;
							square.color.owner = 'Russell'; 			
						}
						bombed.push(square);	
					}

					$game.$renderer.renderMiniTile(square);
				}
			}
			ss.rpc('player.dropSeed', bombed);		
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
				if($game.$player.seedMode) {
					var m = {
							mouse: true,
							x: $game.$mouse.curX,
					 		y: $game.$mouse.curY
					 		};
					$game.$player.dropSeed(m);
				}
				else {
					$game.getTileState($game.$mouse.curX, $game.$mouse.curY, function(state) {
						//go
						if(state === -1) {
							$game.$player.beginMove($game.$mouse.curX,$game.$mouse.curY);
							$game.$npc.hideChat();
						}
						
						//npc
						else if(state >= 0 ) {
							//only trave to a npc if we are not planting
						
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
							$game.$player.beginMove($game.$mouse.curX-2,$game.$mouse.curY+1);
							
							
						}
					});
				}
				
			}		
		}

	};

})();

(function() {

	_soundtrack = null;
	_effect = null;

	$game.$audio = {
		
		init: function() {
			_soundtrack = document.createElement('audio'),
    		_effect = document.createElement('audio'),
            
            _soundtrack.addEventListener('canplaythrough', function (e) {
                this.removeEventListener('canplaythrough', arguments.callee, false);
                console.log("soundtrack is ready to play.");
                _soundtrack.play();
                
            },false);
            _soundtrack.addEventListener('error', function (e) {
               console.log("error sound");
            }, false);
            _effect.addEventListener('canplaythrough', function (e) {
                this.removeEventListener('canplaythrough', arguments.callee, false);
                console.log("effect is ready to play.");                
            },false);
            _effect.addEventListener('error', function (e) {
               console.log("error effect");
            }, false);
        
            _soundtrack.preload = "auto";
            _soundtrack.autobuffer = true;
            _soundtrack.loop = true;
            _soundtrack.src = 'http://russellgoldenberg.com/civicseed_audio/temp.mp3';
            _soundtrack.volume = .3;
            _soundtrack.load();

            _effect.preload = "auto";
            _effect.autobuffer = true;
            _effect.src = '/audio/tile.mp3';
            _effect.volume = .7;
            _effect.load();
   
		},

		playSound: function(i) {

			_effect.play();
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
	$game.$music = {

	};

})();
//events recevied by RPC
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
	//all this breakdown will be on the server side, not client side, 
	//but we will pass the tiles info 
	ss.event.on('ss-seedDropped', function(bombed){
		$game.$map.newBomb(bombed);
	});

})();


$(document).ready(function() {

	$('.seedButton').bind("click", (function () {
		//$game.$player.seedMode = $game.$player.seedMode ? false : true;
		if(!$game.inTransit && !$game.$player.isMoving) {
			$game.$player.seedMode = !$game.$player.seedMode;
		}
		
	}));
	$(window).bind("keypress", (function (key) {
		//$game.$player.seedMode = $game.$player.seedMode ? false : true;
		if(!$game.inTransit && !$game.$player.isMoving && key.which === 115 && $game.ready) {
				$game.$player.dropSeed({mouse:false});
		}		
	}));
	//change cursor on mouse move
	$('.gameboard').mousemove(function(m) {
		if( !$game.inTransit && !$game.$player.isMoving && !$game.$npc.isResource){
 	
			var mInfo = {
				x: m.pageX,
				y: m.pageY,
				offX: this.offsetLeft,
				offY: this.offsetTop,
				debug: false
			};
			$game.$mouse.updateMouse(mInfo, false); 
		}
 	});

 	//figure out if we shoupdatuld transition (or do other stuff later)
 	$('.gameboard').click(function(m) {
 	
 		if(!$game.inTransit && !$game.$player.isMoving && !$game.$npc.isResource){
 	
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
