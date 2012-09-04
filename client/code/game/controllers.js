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

	//PRIVATE VARS 
	
	
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

		//private functions

	
		init: function() {
			$game.$map.init();
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



	};

	window.$game = $game;

})();

// map file
(function() {

	_renderAll = function() {

	};

	$game.$map = {

		init: function() {
			console.log($game.not);
		}

	};

})();

// renderer file
(function() {

	//private render vars
	_tilesheet: null,
	_tilesheetWidthPx: 640;
	_tilesheetHeightPx: 3136; 
	_tilesheetWidth: _tilesheetWidthPx / $game.TILE_SIZE,
	_tilesheetWidth: _tilesheetHeightPx / $game.TILE_SIZE,
	_tilesheetCanvas: null,
	_backgroundContext: null,
	_foregroundContext: null,
	_charactersContext: null,
	_tilesheetContext: null,


	$game.$renderer = {

		init: function() {
			_tilesheetCanvas = document.createElement('canvas');
        	_tilesheetCanvas.setAttribute('width', _tilesheetWidth * $game.TILE_SIZE);
        	_tilesheetCanvas.setAttribute('height', _tilesheetHeight * $game.TILE_SIZE);

	        //initialize DB and let all players know there is a new active one
			ss.rpc('multiplayer.init', function(response) {
				console.log('rpc init: '+ response);
			});

			//load in tilesheet png
			_tilesheet = new Image();
			_tilesheet.src = 'img/game/tilesheet.png';
			
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
						$game._copyTileArray(function() {

							$game._renderAll();

						});
					});
			};		
				
		}

	};

})();


//init file
$(function() {
	$game.init();

	
});
 


var inTransit = false;

var Game = {
	
	masterX: 0,
	masterY: 0,
	nextX: 0,
	nextY: 0,
	stepX: 0,
	stepY: 0,
	shiftArray: 0,
	viewportWidthInTiles: 30,
	viewportHeightInTiles: 15,
	totalviewportWidthInTiles: 146,
	totalviewportHeightInTiles: 141,
	tileSize: 32,
	tilesheet: null,
	tilesheetWidth: 640/32,
	tilesheetHeight: 3136/32,
	tilesheetCanvas: null,
	backgroundContext: null,
	foregroundContext: null,
	charactersContext: null,
	tilesheetContext: null,
	currentTiles: [],
	nextTiles: [],
	stepNumber: 0,
	numberOfSteps: 0,
	stepDirection: null,

	// Game initialization
	init: function() {
		
		//create offscreen canvas for the tilesheet
		tilesheetCanvas = document.createElement('canvas');
        tilesheetCanvas.setAttribute('width', Game.tilesheetWidth * Game.tileSize);
        tilesheetCanvas.setAttribute('height', Game.tilesheetHeight * Game.tileSize);

        //initialize DB and let all players know there is a new active one
		ss.rpc('multiplayer.init',function(response) {
			console.log('rpc init: '+response);
		});

		//load in tilesheet png
		Game.tilesheet = new Image();
		Game.tilesheet.src = 'img/game/tilesheet.png';
		
		//access the canvases for rendering
		Game.backgroundContext = document.getElementById('background').getContext('2d');
		Game.foregroundContext = document.getElementById('foreground').getContext('2d');
		Game.charactersContext = document.getElementById('characters').getContext('2d');
		Game.tilesheetContext = tilesheetCanvas.getContext('2d');

		//start doing stuff once the tilesheet png loads
		Game.tilesheet.onload = function() {
			
			//render out the whole tilesheet to the offscreen canvas
			Game.tilesheetContext.drawImage(Game.tilesheet, 0, 0);

			//get all the tiles for the current viewport (default to 0,0)
			Game._getTiles(Game.masterX,Game.masterY, Game.viewportWidthInTiles, Game.viewportHeightInTiles, function() {
				
				//new tile data stored in nextTiles by default
				//since this is the initial load w/ no transition, 
				//copy them over to currentTiles instead of transitioning
				Game._copyTileArray(function() {

					Game._renderAll();

				});
			});
		};
	},

	_copyTileArray: function(callback) {
		
		Game.currentTiles = new Array(Game.viewportWidthInTiles);
		
		for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {	
			Game.currentTiles[i] = new Array(Game.viewportHeightInTiles);
			

			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
				
				Game.currentTiles[i][j] = Game.nextTiles[i][j];
			
			}
		}
		//reset array
		Game.nextTiles.length = 0;

		callback();
	},

	_getTiles: function(x, y, x2, y2, callback) {
		ss.rpc('multiplayer.getMapData', x, y, x + x2, y + y2, function( response) {
			//breakdown single array into 2d array
			Game.nextTiles = new Array(x2);
			for(var i = 0; i < x2 ; i+=1) {
				
				Game.nextTiles[i] = new Array(y2);
				
				for(var j = 0; j < y2; j+=1) {

					var index = j * x2 + (i % x2);
					Game.nextTiles[i][j] = response[index];
				}
			}
			callback();
		});
	},
	
	_renderTile: function(tileData) {
		Game.backgroundContext.drawImage(
			Game.tilesheet, 
			tileData.srcX * Game.tileSize,
			tileData.srcY * Game.tileSize,
			Game.tileSize,
			Game.tileSize,
			tileData.destX * Game.tileSize,
			tileData.destY * Game.tileSize,
			Game.tileSize,
			Game.tileSize
		);
	},
	
	_renderAll: function() {
		for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
			
			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
				
				var backIndex = Game.currentTiles[i][j].background - 1,
					backIndex2 = Game.currentTiles[i][j].background2 - 1,
					foreIndex = Game.currentTiles[i][j].foreground - 1,
				
				//tilemap starts at 1 instead of 0
				
				//background tiles first
				tileData = {
					srcX: backIndex % Game.tilesheetWidth,
					srcY: Math.floor(backIndex / Game.tilesheetWidth),
					destX: i,
					destY: j
				};
				
				Game._renderTile(tileData);
				
				//second layer background tiles (not all have something)
				if( backIndex2 > -1) {
					tileData.srcX = backIndex2 % Game.tilesheetWidth;
					tileData.srcY = Math.floor(backIndex2 / Game.tilesheetWidth);
					Game._renderTile( tileData );
				}

				//foreground tiles 
				if(foreIndex > -1) {
					tileData.srcX = foreIndex % Game.tilesheetWidth;
					tileData.srcY = Math.floor(foreIndex / Game.tilesheetWidth);
					Game._renderTile(tileData);
				}

			}
		}	
	},

	getNoGo: function(x, y, callback) {
		//var i = y*Game.viewportWidthInTiles + (x%Game.viewportWidthInTiles);
		var noGoVal = Game.currentTiles[x][y].nogo;
		// console.log(noGoVal + 'Get No Go Yo');
		callback(noGoVal);
	},

	isMapEdge: function(x, y, callback) {
		//var i = y*Game.viewportWidthInTiles + (x%Game.viewportWidthInTiles);
		var edge = Game.currentTiles[x][y].isMapEdge;
		callback(edge);
	},

	beginTransition: function(x, y) {
		var getThisManyX,
		getThisManyY,
		getThisX,
		getThisY;
		
		//left
		if(x === 0) {
			Game.nextX = Game.masterX - (Game.viewportWidthInTiles - 1);
			Game.stepX = -1;
			Game.shiftArray = -1;
			Game.numberOfSteps = 29;
			Game.stepDirection = 'left';
			getThisManyX = Game.viewportWidthInTiles - 1;
			getThisManyY = Game.viewportHeightInTiles;
			getThisX = Game.nextX;
			getThisY = Game.masterY;
		}

		//right
		else if(x === Game.viewportWidthInTiles - 1) {
			Game.nextX = Game.masterX + Game.viewportWidthInTiles - 1;
			Game.stepX = 1;
			Game.shiftArray = 1;
			Game.numberOfSteps = 29;
			Game.stepDirection = 'right';
			getThisManyX = Game.viewportWidthInTiles - 1;
			getThisManyY = Game.viewportHeightInTiles;
			getThisX = Game.nextX + 1;
			getThisY = Game.masterY;
		}

		//up
		else if(y === 0) {
			Game.nextY = Game.masterY - (Game.viewportHeightInTiles - 1);
			Game.stepY = -1;
			Game.shiftArray = -Game.totalviewportHeightInTiles;
			Game.numberOfSteps = 14;
			Game.stepDirection = 'up';
			getThisManyX = Game.viewportWidthInTiles;
			getThisManyY = Game.viewportHeightInTiles - 1;
			getThisX = Game.masterX;
			getThisY = Game.nextY;
		}

		//down
		else if(y === Game.viewportHeightInTiles - 1) {
			Game.nextY = Game.masterY+Game.viewportHeightInTiles - 1;
			Game.stepY = 1;
			Game.shiftArray = Game.totalviewportHeightInTiles;
			Game.numberOfSteps = 14;
			Game.stepDirection = 'down';
			getThisManyX = Game.viewportWidthInTiles;
			getThisManyY = Game.viewportHeightInTiles - 1;
			getThisX = Game.masterX;
			getThisY = Game.nextY + 1;
		}
		
		Game.stepNumber = 0;
		Game._getTiles(getThisX, getThisY, getThisManyX, getThisManyY, function() {
			Game._stepTransition();
		});
	},

	_stepTransition: function() {
		if(Game.stepNumber !== Game.numberOfSteps) {
			Game._updateAndDraw();
		}
		// if(Game.masterX!=Game.nextX){
		// 	Game.masterX+=Game.stepX;
		// 	Game._updateAndDraw();
		// }
		// else if(Game.masterY!=Game.nextY){
		// 	Game.masterY+=Game.stepY;
		// 	Game._updateAndDraw();
		// }
		else {
			Game._endTransition();
		}
	},

	_endTransition: function() {
		inTransit = false;
	},

	_updateAndDraw: function() {
		Game.stepNumber += 1;
		//--------RIGHT------------
		//go thru current array and shift everthing
		if(Game.stepDirection === 'right') {
			//shift all except last column
			for(var i = 0; i < Game.viewportWidthInTiles - 1; i+=1) {
				for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
					Game.currentTiles[i][j] = Game.currentTiles[ i + 1 ][j];
				}
			}
			
			//shift a new column from the next array to the last spot
			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
				Game.currentTiles[Game.viewportWidthInTiles - 1][j] = Game.nextTiles[Game.stepNumber - 1][j];
			}
			Game.masterX += 1;
		}

		//--------LEFT------------
		//go thru current array and shift everthing
		if(Game.stepDirection === 'left') {
			//shift all except last column
			for(var i = Game.viewportWidthInTiles - 1; i > 0; i-=1) {
				for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
					Game.currentTiles[i][j] = Game.currentTiles[ i - 1 ][j];
				}
			}
			//shift a new column from the next array to the last spot
			for(var j = 0; j < Game.viewportHeightInTiles; j+=1) {
				Game.currentTiles[0][j] = Game.nextTiles[Game.nextTiles.length - Game.stepNumber ][j];
			}
			Game.masterX -= 1;
		}

		//--------UP------------
		//go thru current array and shift everthing
		if(Game.stepDirection==='up') {
			//shift all except last column
			for(var j = Game.viewportHeightInTiles - 1; j > 0; j-=1) {
				for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
					Game.currentTiles[i][j] = Game.currentTiles[i][j - 1];
				}
			}
			//shift a new column from the next array to the last spot
			for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
				Game.currentTiles[i][0] = Game.nextTiles[i][Game.nextTiles[0].length - Game.stepNumber];
			}
			Game.masterY -= 1;
		}

		//--------DOWN------------
		//go thru current array and shift everthing
		if(Game.stepDirection === 'down') {
			//shift all except last column
			for(var j = 0; j < Game.viewportHeightInTiles - 1; j+=1) {
				for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
					Game.currentTiles[i][j] = Game.currentTiles[i][j + 1];
				}
			}
			//shift a new column from the next array to the last spot
			for(var i = 0; i < Game.viewportWidthInTiles; i+=1) {
				Game.currentTiles[i][Game.viewportHeightInTiles - 1] = Game.nextTiles[i][Game.stepNumber - 1];
			}
			Game.masterY += 1;
		}




		Game._renderAll();
		requestAnimFrame(Game._stepTransition); 
	}
};

$(document).ready(function() {
	
	var Mouse = {
		prevX: 0,
		prevY: 0,
		curX: 0,
		curY: 0,
		changed: false,

		//returns local x,y grid data based on mouse location
		updateMouse: function( a, b, oa, ob, callback) {
			var x = a - oa;
			var y = b - ob;
			Mouse.prevX = Mouse.curX;
			Mouse.prevY = Mouse.curY;

			Mouse.curX = Math.floor(x/32);
			Mouse.curY = Math.floor(y/32);
			
			//extremes(if at edge it will be just over)
			if(Mouse.curX > 29) {
				Mouse.curX = 29;
			}
			else if(Mouse.curX < 0) {
				Mouse.curX = 0;
			}
			if(Mouse.curY > 14) {
				Mouse.curY = 14;
			}
			else if(Mouse.curY < 0) {
				Mouse.curY = 0;
			}

			//if the grid is different update boolean
			if(Mouse.curX !== Mouse.prevX || Mouse.curY !== Mouse.prevY){
				Mouse.changed = true;
			}
			else{
				Mouse.changed = false;
			}
			callback(Mouse.curX,Mouse.curY,Mouse.changed);
		}

	};
	
	//change cursor on mouse move
	$('.gameboard').mousemove(function(m) {
		Mouse.updateMouse(m.pageX, m.pageY, this.offsetLeft, this.offsetTop,function(x, y, c) {
			
			//c is true if the mouse snaps to a new grid
			if(c){
				console.log("we different");
				Game.getNoGo(x, y, function(noGoValue) {
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
 		if( !inTransit ){
 			Mouse.updateMouse(m.pageX, m.pageY, this.offsetLeft, this.offsetTop, function(x, y, c) {
 				Game.isMapEdge(x, y, function(reply) {
 					if(!reply) {
 						if(x === 0 || x === 29 || y === 0 || y === 14) {
 							inTransit = true;
 							Game.beginTransition(x, y);
 						}
 						else {
 							console.log('think outside the box');
 						}
 					}	
 					else {
 						console.log('edge');
 					}
 				});
 				
 			});
 		}
 	});

 	Game.init();

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
