var _nextTiles = null,
	_gridTiles = null,
	_graph = null,
	_nextX = 0,
	_nextY = 0,
	_stepX = 0,
	_stepY = 0;
	_nextTiles = [],
	_shiftArray = 0,
	_stepNumber = 0,
	_leftEdge = 0,
	_rightEdge = 0,
	_topEdge = 0,
	_bottomEdge = 0;

$game.$map = {

	coloredTiles: [],
	growingSeed: false,
	seedsInProgress: [],
	collectiveImage: null,
	ready: false,
	miniMap: {},
	currentTiles: null,
	dataLoaded: false,
	numberOfSteps: 0,
	stepDirection: null,

	init: function(callback) {
		var id = $game.$player.id,
			position = $game.$player.getPosition(),
			color = $game.$player.getColor();
		$game.$map.addPlayer(id, position.x, position.y, color);
		ss.rpc('game.map.init', function() {
			$game.$map.ready = true;
			callback();
		});
	},

	firstStart: function(callback) {
		var info = {
			x: $game.masterX,
			y: $game.masterY,
			numX: $game.VIEWPORT_WIDTH,
			numY: $game.VIEWPORT_HEIGHT
		};
		_getTiles(info, function() {
			_copyTileArray(function() {
				$game.$map.createPathGrid(function() {
					callback();
				});
			});
		});
	},

	createPathGrid: function(callback) {
		_gridTiles = null;
		_graph = null;
		_gridTiles = new Array($game.VIEWPORT_HEIGHT);

		var y = $game.VIEWPORT_HEIGHT;

		while(--y >= 0) {
			_gridTiles[y] = new Array($game.VIEWPORT_WIDTH);

			var x = $game.VIEWPORT_WIDTH;
			while(--x >= 0) {
				val = $game.$map.getTileState(x, y);
				//the pathfinding takes 1 means its clear 0 not
				var tempNoGo, stringId;
				if(val === -1) {
					tempNoGo = 1;
				}
				else {
					tempNoGo = 0;
				}
				_gridTiles[y][x] = tempNoGo;
			}
		}

		_graph = new Graph(_gridTiles);
		callback();
	},

	getTileState: function(x, y) {
		//must first do a check to see if the tile BOTTOM is the npc
		//if so, then return npc val (THIS IS A HACK SORT OF)
		var tileStateVal = $game.$map.currentTiles[x][y].tileState;
		if( y < $game.VIEWPORT_HEIGHT - 1) {
			var belowState = $game.$map.currentTiles[x][y+1].tileState;

			if(belowState >= 0 ) {
				tileStateVal = belowState;
			}
		}
		return tileStateVal;
	},

	isMapEdge: function(x, y, callback) {
		var edge = $game.$map.currentTiles[x][y].isMapEdge;
		callback(edge);
	},

	addPlayer: function(id, x, y, col) {
		$game.$map.miniMap[id] = {};
		$game.$map.miniMap[id].x = x,
		$game.$map.miniMap[id].y = y;
		$game.$map.miniMap[id].col = col;
		$game.$map.render();
	},

	updatePlayer: function(id, x, y) {
		$game.$renderer.clearMiniMap();
		$game.$map.miniMap[id].x = x;
		$game.$map.miniMap[id].y = y;
		$game.$map.render();
	},

	removePlayer: function(id) {
		$game.$renderer.clearMiniMap();
		delete $game.$map.miniMap[id];
		$game.$map.render();
	},

	render: function() {
		$game.$renderer.renderMiniMapConstants();
		$.each($game.$map.miniMap, function(key, player) {
			$game.$renderer.renderMiniPlayer(player);
		});
	},

	newBomb: function(bombed, id) {
		for(var b = 0; b < bombed.length; b += 1) {
			//only add it to render list if it is on current screen
			var loc = $game.$map.masterToLocal(bombed[b].x, bombed[b].y),
				curTile = null;
			if(loc) {
				//if there IS a color
				curTile = $game.$map.currentTiles[loc.x][loc.y];
				curTile.color = bombed[b].color;
				curTile.curColor = bombed[b].curColor;
				$game.$renderer.clearMapTile(loc.x * $game.TILE_SIZE, loc.y * $game.TILE_SIZE);
				$game.$renderer.renderTile(loc.x,loc.y);

				if(id === $game.$player.id) {
					$game.$renderer.renderMiniTile(bombed[b].x, bombed[b].y, bombed[b].color);
				}
			}
		}
	},

	saveImage: function() {
		var myDrawing = document.getElementById('minimapTile');
		var drawingURL = myDrawing.toDataURL('img/png');
		return drawingURL;
	},

	createCollectiveImage: function() {
		ss.rpc('game.player.getAllImages', function(data) {
			//console.log(data.length);
			var index = data.length;
			//go thru each image create a new image using canvas?
			while(--index > -1) {
				$('.colorMapEveryone').append('<img src="'+ data[index] + '">');
			}
		});
	},

	findPath: function(local, master, callback) {
		//calc local for start point for pathfinding
		var start = _graph.nodes[local.y][local.x],
			end = _graph.nodes[master.y][master.x];

		$game.$astar.search(_graph.nodes, start, end, function(result) {
			callback(result);
		});
	},

	calculateNext: function(x, y){
		var getThisManyX,
			getThisManyY,
			getThisX,
			getThisY;

		//left
		if(x === 0) {
			_nextX = $game.masterX - ($game.VIEWPORT_WIDTH - 2);
			_stepX = -1;
			_shiftArray = -1;
			$game.$map.numberOfSteps = $game.VIEWPORT_WIDTH - 2;
			$game.$map.stepDirection = 'left';
			getThisManyX = $game.VIEWPORT_WIDTH - 2;
			getThisManyY = $game.VIEWPORT_HEIGHT;
			getThisX = _nextX;
			getThisY = $game.masterY;
		}
		//right
		else if(x === $game.VIEWPORT_WIDTH - 1) {
			_nextX = $game.masterX + $game.VIEWPORT_WIDTH - 2;
			_stepX = 1;
			_shiftArray = 1;
			$game.$map.numberOfSteps = $game.VIEWPORT_WIDTH - 2;
			$game.$map.stepDirection = 'right';
			getThisManyX = $game.VIEWPORT_WIDTH - 2;
			getThisManyY = $game.VIEWPORT_HEIGHT;
			getThisX = _nextX + 2;
			getThisY = $game.masterY;
		}
		//up
		else if(y === 0) {
			_nextY = $game.masterY - ($game.VIEWPORT_HEIGHT - 2);
			_stepY = -1;
			_shiftArray = -$game.totalVIEWPORT_HEIGHT;
			$game.$map.numberOfSteps = $game.VIEWPORT_HEIGHT - 2;
			$game.$map.stepDirection = 'up';
			getThisManyX = $game.VIEWPORT_WIDTH;
			getThisManyY = $game.VIEWPORT_HEIGHT - 2;
			getThisX = $game.masterX;
			getThisY = _nextY;
		}
		//down
		else if(y === $game.VIEWPORT_HEIGHT - 1) {
			_nextY = $game.masterY+$game.VIEWPORT_HEIGHT - 2;
			_stepY = 1;
			_shiftArray = $game.totalVIEWPORT_HEIGHT;
			$game.$map.numberOfSteps = $game.VIEWPORT_HEIGHT - 2;
			$game.$map.stepDirection = 'down';
			getThisManyX = $game.VIEWPORT_WIDTH;
			getThisManyY = $game.VIEWPORT_HEIGHT - 2;
			getThisX = $game.masterX;
			getThisY = _nextY + 2;
		}

		_getTiles({x:getThisX, y: getThisY, numX: getThisManyX, numY: getThisManyY}, function() {
			return;
		});
	},

	transitionMap: function(stepNumber) {
		//--------RIGHT------------
		//go thru current array and shift everthing
		var i, j;
		if($game.$map.stepDirection === 'right') {
			//shift all except last column
			i = 0;
			while(i < $game.VIEWPORT_WIDTH - 1) {
				j = 0;
				while(j < $game.VIEWPORT_HEIGHT) {
					$game.$map.currentTiles[i][j] = $game.$map.currentTiles[ i + 1 ][j];
					j += 1;
				}
				i += 1;
			}
			//shift a new column from the next array to the last spot
			j = $game.VIEWPORT_HEIGHT;
			while(--j >= 0) {
				$game.$map.currentTiles[$game.VIEWPORT_WIDTH - 1][j] = _nextTiles[stepNumber - 1][j];
			}
			$game.masterX += 1;
			$game.$player.slide(1,0);
			$game.$others.slide(1,0);
		}
		//--------LEFT------------
		//go thru current array and shift everthing
		if($game.$map.stepDirection === 'left') {
			//shift all except last column
			i = $game.VIEWPORT_WIDTH - 1;

			while(i > 0) {
				j = 0;
				while(j < $game.VIEWPORT_HEIGHT) {
					$game.$map.currentTiles[i][j] = $game.$map.currentTiles[ i - 1 ][j];
					j += 1;

				}
				i -= 1;
			}
			//shift a new column from the next array to the last spot
			j = $game.VIEWPORT_HEIGHT;
			while(--j >= 0) {
				$game.$map.currentTiles[0][j] = _nextTiles[_nextTiles.length - stepNumber ][j];
			}

			$game.masterX -= 1;
			$game.$player.slide(-1,0);
			$game.$others.slide(-1,0);
		}
		//--------UP------------
		//go thru current array and shift everthing
		if($game.$map.stepDirection==='up') {
			//shift all except last column
			j = $game.VIEWPORT_HEIGHT - 1;
			while(j > 0) {
				i = 0;
				while(i < $game.VIEWPORT_WIDTH) {
					$game.$map.currentTiles[i][j] = $game.$map.currentTiles[i][j - 1];
					i += 1;
				}
				j -= 1;
			}
			//shift a new column from the next array to the last spot
			i = $game.VIEWPORT_WIDTH;
			while(--i >= 0) {
				$game.$map.currentTiles[i][0] = _nextTiles[i][_nextTiles[0].length - stepNumber];
			}
			$game.masterY -= 1;
			$game.$player.slide(0,-1);
			$game.$others.slide(0,-1);
		}
		//--------DOWN------------
		//go thru current array and shift everthing
		if($game.$map.stepDirection === 'down') {
			//shift all except last column
			j = 0;
			while(j < $game.VIEWPORT_HEIGHT-1) {
				i = 0;
				while(i < $game.VIEWPORT_WIDTH) {
					$game.$map.currentTiles[i][j] = $game.$map.currentTiles[i][j + 1];
					i += 1;
				}
				j += 1;
			}
			//shift a new column from the next array to the last spot
			i = $game.VIEWPORT_WIDTH;
			while(--i >= 0) {
				$game.$map.currentTiles[i][$game.VIEWPORT_HEIGHT - 1] = _nextTiles[i][stepNumber - 1];
			}
			$game.masterY += 1;
			$game.$player.slide(0,1);
			$game.$others.slide(0,1);
		}
		//update the edges since we shift em son
		_leftEdge = $game.masterX,
		_rightEdge = $game.masterX + $game.VIEWPORT_WIDTH,
		_topEdge = $game.masterY,
		_bottomEdge = $game.masterY + $game.VIEWPORT_HEIGHT + 1;

		requestAnimationFrame($game.stepTransition);
	},

	masterToLocal: function(x, y, offscreen) {
		//if this works I am a dolt for not doing it earlier (I am a dolt)
		var local = {
			x: x - _leftEdge,
			y: y - _topEdge
		};

		if(local.y <= $game.VIEWPORT_HEIGHT-1 && local.y >= 0 && local.x <= $game.VIEWPORT_WIDTH -1 && local.x >= 0) {
			return local;
		} else {
			if(offscreen) {
				return local;
			} else {
				return false;
			}
		}
	},

	setBoundaries: function() {
		_leftEdge = $game.masterX,
		_rightEdge = $game.masterX + $game.VIEWPORT_WIDTH,
		_topEdge = $game.masterY,
		_bottomEdge = $game.masterY + $game.VIEWPORT_HEIGHT + 1;
	}
};

//private map functions 
function _getTiles(data, callback) {
	$game.$map.dataLoaded = false;
	var x1 = data.x,
		y1 = data.y,
		x2 = data.x + data.numX,
		y2 = data.y + data.numY;

	ss.rpc('game.map.getMapData',x1, y1, x2, y2, function(map, colors) {
		//breakdown single array into 2d array
		var index = null;

		_nextTiles = new Array(data.numX);
		var i = data.numX;

		while(--i >= 0) {
			_nextTiles[i] = new Array(data.numY);
			var j = data.numY;

			while(--j >= 0) {
				index = j * data.numX + (i % data.numX);
				_nextTiles[i][j] = map[index];
			}
		}
		//now go thru colors and attach to proper tile
		//should be going left to right, top to bottom
		var cLength = colors.length,
			a = 0,
			b = 0,
			c = 0,
			aMax = _nextTiles.length,
			bMax = _nextTiles[0].length;
		//console.log(colors, aMax, bMax);
		while(c < cLength) {
			var found = false;
			while(!found) {
				if(_nextTiles[a][b].mapIndex === colors[c].mapIndex) {
					_nextTiles[a][b].color = colors[c].color;
					_nextTiles[a][b].curColor = colors[c].curColor;
					found = true;
				}
				a++;
				if(a >= aMax) {
					a = 0;
					b++;
					if(b >= bMax) {
						console.log('errrr');
						found = true;
					}
				}
			}
			c++;
		}
		$game.$map.dataLoaded = true;
		callback();
	});
}

function _copyTileArray(callback) {
	// $game.$map.currentTiles = new Array($game.VIEWPORT_WIDTH);
	$game.$map.currentTiles = [$game.VIEWPORT_WIDTH];

	var i = $game.VIEWPORT_WIDTH;
	while(--i >= 0) {
		$game.$map.currentTiles[i] = [$game.VIEWPORT_HEIGHT];
		var j = $game.VIEWPORT_HEIGHT;
		while(--j >= 0) {
			$game.$map.currentTiles[i][j] = _nextTiles[i][j];
		}
	}
	//reset array
	_nextTiles = [];
	callback();
}