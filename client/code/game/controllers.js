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

		read: false,

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
	
			$game.gridTiles = new Array($game.VIEWPORT_HEIGHT);

			for(var y = 0; y < $game.VIEWPORT_HEIGHT; y += 1) {
					
				$game.gridTiles[y] = new Array($game.VIEWPORT_WIDTH);

				for(var  x = 0; x < $game.VIEWPORT_WIDTH; x += 1) {		
				
					$game.isNoGo(x, y, function(val) {
						//the pathfinding takes 1 means its clear 0 not
						var tempNoGo;
						if(val>0) {
							tempNoGo = 0;
						}	
						else {
							tempNoGo = 1;
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

		isNoGo: function(x, y, callback) {
			//var i = y*$game.viewportWidthInTiles + (x%$game.viewportWidthInTiles);
			var noGoVal = $game.currentTiles[x][y].tileState;
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
			$game.$player.isMoving = false;
			//now that the transition has ended, create a new grid
			$game.createPathGrid(function() {
				
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
		_mouseContext = null,
		_tilesheetContext= null;


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
			_tilesheetContext = _tilesheetCanvas.getContext('2d');

			_allImages = ['img/game/tilesheet.png','img/game/player.png','img/game/mario.png']
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
			else if($game.$player.isMoving) {
				$game.$player.render();
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
	
		renderAll: function() {
			for(var i = 0; i < $game.VIEWPORT_WIDTH; i+=1) {
				
				for(var j = 0; j < $game.VIEWPORT_HEIGHT; j+=1) {
					
					var backIndex = $game.currentTiles[i][j].background - 1,
						backIndex2 = $game.currentTiles[i][j].background2 - 1,
						foreIndex = $game.currentTiles[i][j].foreground - 1,
						tileStateVal = $game.currentTiles[i][j].tileState;

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

					if(tileStateVal === 2) {

					}
				}
			}		
		},

		renderAllTiles: function() {
			//not worried about clearing previous because every 
			//tile is being overwritten

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
					
					//npcs
					if(tileStateVal === 2) {
						//get npc spritesheet data, pass it to tiledata, render
						//$game.$renderer.renderTile(tileData);
						$game.$npc.render($game.currentTiles[i][j]);
					}	

					//foreground tiles 
					if(foreIndex > -1) {
						tileData.srcX = foreIndex % _tilesheetWidth;
						tileData.srcY = Math.floor(foreIndex / _tilesheetWidth);
						$game.$renderer.renderTile(tileData);
					}

						
				}
			}
		},

		renderNpc: function (npcData) {

			$game.masterToLocal(npcData.x, npcData.y, function(loc) {			
				var curX = loc.x * $game.TILE_SIZE;
					curY = loc.y * $game.TILE_SIZE;
			
				_backgroundContext.drawImage(
					_tilesheets[2], 
					npcData.srcX * $game.TILE_SIZE,
					npcData.srcY * $game.TILE_SIZE,
					$game.TILE_SIZE,
					$game.TILE_SIZE*2,
					curX,
					curY - $game.TILE_SIZE,
					$game.TILE_SIZE,
					$game.TILE_SIZE*2
				);
		
			});

			//old method 

			// //draw the top half of body on the foreground
			// //bottom half on the background
			// //var prevIndex = $game.masterToLocal(npc.prevY * $game.TOTAL_WIDTH + npc.prevX);
			// //console.log(npc.prevX+" : "+npc.curX);
			// var preIndex = npc.curY * $game.TOTAL_WIDTH + npc.curX;
			// console.log("master index: "+preIndex);
			// var i = $game.masterToLocal(preIndex);
			// console.log("local index: "+i);
			// //var pi = $game.masterToLocal(npc.prevY * $game.TOTAL_WIDTH + npc.prevX);
			// var x = i % $game.VIEWPORT_WIDTH,
			// 	y = Math.floor(i / $game.VIEWPORT_WIDTH),
			// 	srcX = npc.spriteMap[0].x * $game.TILE_SIZE,
			// 	srcY = npc.spriteMap[0].y * $game.TILE_SIZE,
			// 	destX = x * $game.TILE_SIZE,
			// 	destY = y * $game.TILE_SIZE;
			// console.log("local coords: "+x+", "+y)
			// _backgroundContext.drawImage(
			// 	_npcTilesheet, 
			// 	srcX,
			// 	srcY,
			// 	$game.TILE_SIZE,
			// 	$game.TILE_SIZE,
			// 	destX,
			// 	destY-$game.TILE_SIZE,
			// 	$game.TILE_SIZE,
			// 	$game.TILE_SIZE
			// );
			// _backgroundContext.drawImage(
			// 	_npcTilesheet, 
			// 	srcX,
			// 	srcY+$game.TILE_SIZE,
			// 	$game.TILE_SIZE,
			// 	$game.TILE_SIZE,
			// 	destX,
			// 	destY,
			// 	$game.TILE_SIZE,
			// 	$game.TILE_SIZE
			// );

		},

		renderMouse: function(mouse) {
			$('.cursor').css({
				left: mouse.cX * 32,
				top: mouse.cY * 32
			});
		}

	};

})();


//npc file
(function() {

	var _loaded = false,
	_allNpcs = [];

	$game.$npc = {

		//onScreenNpcs: [],
		ready: false,

		init: function() {
			ss.rpc('npc.getNpcs', function(response) {
				_allNpcs = response;
				_loaded = true;
				$game.$npc.ready = true;
			});
			// 		var x = response[0].id % $game.TOTAL_WIDTH,
			// 			y = Math.floor(response[0].id / $game.TOTAL_WIDTH);
			// 		response[0].prevX = x,
			// 		response[0].prevY = y,
			// 		response[0].curX = x,
			// 		response[0].curY = y;
			// 		$game.$npc.onScreenNpcs.push(response[0]);
			// 		_loaded = true;
			// 	});
			// }

			//load all the npcs data and store it aqui

			//old method

			// //load the npcs that are on the current screen
			// var idList = [];
			// for(var x = 0; x < $game.currentTiles.length; x+=1) {
			// 	for(var y = 0; y < $game.currentTiles[x].length; y+=1) {
			// 		if($game.currentTiles[x][y].tileState === 2) {
			// 			//add to list, the index, get it from db
			// 			idList.push($game.currentTiles[x][y].mapIndex);
			// 		}
			// 	}	
			// }

			// //go through all the npcs who should be on the list
			// //get their data, update their coords to local coords 
			// //for prev and next movements 
			// for(var i = 0; i<idList.length; i++) {
			// 	ss.rpc('npc.getNpcById', idList[i], function(response) {
			// 		var x = response[0].id % $game.TOTAL_WIDTH,
			// 			y = Math.floor(response[0].id / $game.TOTAL_WIDTH);
			// 		response[0].prevX = x,
			// 		response[0].prevY = y,
			// 		response[0].curX = x,
			// 		response[0].curY = y;
			// 		$game.$npc.onScreenNpcs.push(response[0]);
			// 		_loaded = true;
			// 	});
			// }

			

			// var firstRender = function(){
			// 		if(_loaded){
			// 			$game.$npc.render();
			// 		}	
			// 		else{
			// 			setTimeout(firstRender,16);
			// 		}
			// };
			
			// firstRender();

		},

		add: function(id) {
			//add previous locations here for rendering
		},

		remove: function(id) {

		},

		slide: function() {
			var stepX, stepY;
			if($game.stepDirection==='left') {
				stepX = 1;
				stepY = 0;
			}
			else if($game.stepDirection==='right') {
				stepX = -1;
				stepY = 0;
			}
			else if($game.stepDirection==='up') {
				stepX = 0;
				stepY = 1;
			}
			else if($game.stepDirection==='down') {
				stepX = 0;
				stepY = -1;
			}
			for(var i = 0; i < $game.$npc.onScreenNpcs.length; i += 1) {
				$game.$npc.onScreenNpcs[i].prevX = $game.$npc.onScreenNpcs[i].curX;
				$game.$npc.onScreenNpcs[i].prevY = $game.$npc.onScreenNpcs[i].curY;
				$game.$npc.onScreenNpcs[i].curX += stepX;
				$game.$npc.onScreenNpcs[i].curY += stepY;

				// var localIndex = $game.masterToLocal($game.$npc.onScreenNpcs[i].curY * $game.TOTAL_WIDTH + $game.$npc.onScreenNpcs[i].curX),
				// locX = localIndex % $game.VIEWPORT_WIDTH,
				// locY = Math.floor(localIndex / $game.VIEWPORT_WIDTH);
				// if(locX < 0 || locY < 0 || locX >= $game.VIEWPORT_WIDTH || locY >= $game.VIEWPORT_HEIGHT) { 
				// 	//$game.$npc.remove(i);
				// }
			}
			//check if off screen using masterlocal

			$game.$npc.render();
		},

		render: function(tile) {
			var data = {};
			for(var z = 0; z < _allNpcs.length; z += 1) {
				if(_allNpcs[z].id === tile.mapIndex) {
					data.srcX = _allNpcs[z].spriteMap[0].x * $game.TILE_SIZE,
					data.srcY = _allNpcs[z].spriteMap[0].y * $game.TILE_SIZE,
					data.x = tile.x,
					data.y = tile.y;
					$game.$renderer.renderNpc(data);
				}
			}
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
				requestAnimFrame($game.$player.move);
			}
		},

		endMove: function () {
			//console.log("travel time");

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
					alert('here is ya question mate');
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
				$game.isNoGo($game.$mouse.curX, $game.$mouse.curY, function(state) {
					//go
					if(state === 0) {
						$game.$player.beginMove($game.$mouse.curX,$game.$mouse.curY);
					}
					//nogo
					else if(state === 1 ) {

					}
					//npc
					else {
						//move them to the spot to the 
						//BOTTOM LEFT corner of the npc 
						//(consistent so we leave that open in tilemap)
						//also make sure it is not a transition tile
						$game.$player.npcOnDeck = true;
						$game.$player.beginMove($game.$mouse.curX-1,$game.$mouse.curY+2);
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
				debug: true
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
