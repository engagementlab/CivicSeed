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
        tilesheetCanvas.setAttribute('width', Game.tilesheetWidth*Game.tileSize);
        tilesheetCanvas.setAttribute('height', Game.tilesheetHeight*Game.tileSize);

        //initialize DB and let all players know there is a new active one
		ss.rpc('multiplayer.init',function(response){
			console.log("rpc init: "+response);
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
		Game.tilesheet.onload = function(){
			
			//render out the whole tilesheet to the offscreen canvas
			Game.tilesheetContext.drawImage(Game.tilesheet,0,0);

			//get all the tiles for the current viewport (default to 0,0)
			Game._getTiles(Game.masterX,Game.masterY,Game.viewportWidthInTiles,Game.viewportHeightInTiles, function(){
				//new tile data stored in nextTiles by default
				//since this is the initial load w/ no transition, 
				//copy them over to currentTiles instead of transitioning
				Game._copyTileArray(function(){
					//render out every tile in currentTiles
					Game._renderAll();
				});
			});
		};
	},

	_copyTileArray: function(callback){
		Game.currentTiles = new Array(Game.viewportWidthInTiles);
		for(var i=0;i<Game.viewportWidthInTiles;i++){
			Game.currentTiles[i] = new Array(Game.viewportHeightInTiles);
			for(var j=0;j<Game.viewportHeightInTiles;j++){
				Game.currentTiles[i][j] = Game.nextTiles[i][j];
			}
		}
		//reset array
		Game.nextTiles.length = 0;

		callback();
	},

	_getTiles: function(x,y,x2,y2,callback) {
		ss.rpc('multiplayer.getMapData',x,y,x+x2,y+y2,function(response){
			//breakdown single array into 2d array
			Game.nextTiles = new Array(x2);
			for(var i=0;i<x2;i++){
				Game.nextTiles[i] = new Array(y2);
				for(var j=0;j<y2;j++){
					var index = j*x2 + (i%x2);
					Game.nextTiles[i][j] = response[index];
				}
			}
			// console.log(Game.nextTiles[0][0]);
			// console.log(Game.nextTiles[x2-1][0]);
			// console.log(Game.nextTiles[0][y2-1]);
			// console.log(Game.nextTiles[x2-1][y2-1]);
			console.log(Game.nextTiles);
			callback();
		});
	},
	
	_renderTile: function(index, srcX, srcY, destX, destY) {
		Game.backgroundContext.drawImage(
			Game.tilesheet, 
			srcX*Game.tileSize,
			srcY*Game.tileSize,
			Game.tileSize,
			Game.tileSize,
			destX*Game.tileSize,
			destY*Game.tileSize,
			Game.tileSize,
			Game.tileSize
		);
	},
	
	_renderAll: function() {
		for(var i=0;i<Game.viewportWidthInTiles;i++){
			for(var j=0;j<Game.viewportHeightInTiles;j++){
				//tilemap starts at 1 instead of 0
				var index = Game.currentTiles[i][j].background-1;
				var index2 = Game.currentTiles[i][j].background2-1;
				var srcX = index % Game.tilesheetWidth;
				var srcY = Math.floor(index / Game.tilesheetWidth);
				//var destX = i % Game.viewportWidthInTiles; 
				//var destY = Math.floor(i/Game.viewportWidthInTiles);
				
				Game._renderTile(index, srcX, srcY, i, j);
				if(index2>-1){
					var srcX2 = index2 % Game.tilesheetWidth;
					var srcY2 = Math.floor(index2 / Game.tilesheetWidth);
					Game._renderTile(index2,srcX2,srcY2,i,j);
				}
			}
		}	
	},

	getNoGo: function(x,y) {
		//var i = y*Game.viewportWidthInTiles + (x%Game.viewportWidthInTiles);
		var noGoVal = Game.currentTiles[x][y].nogo;
		//console.log(noGoVal);
		return noGoVal;
	},

	isMapEdge: function(x,y,callback){
		//var i = y*Game.viewportWidthInTiles + (x%Game.viewportWidthInTiles);
		var edge = Game.currentTiles[x][y].isMapEdge;
		callback(edge);
	},

	beginTransition: function(x,y){
		var getThisManyX,getThisManyY,getThisX,getThisY;
		//left
		if(x==0){
			Game.nextX = Game.masterX-(Game.viewportWidthInTiles-1);
			Game.stepX = -1;
			Game.shiftArray = -1;
			Game.numberOfSteps = 29;
			Game.stepDirection = 'left';
			getThisManyX = Game.viewportWidthInTiles-1;
			getThisManyY = Game.viewportHeightInTiles;
			getThisX = Game.nextX;
			getThisY = Game.masterY;
		}

		//right
		else if(x==Game.viewportWidthInTiles-1){
			Game.nextX = Game.masterX+Game.viewportWidthInTiles-1;
			Game.stepX = 1;
			Game.shiftArray = 1;
			Game.numberOfSteps = 29;
			Game.stepDirection = 'right';
			getThisManyX = Game.viewportWidthInTiles-1;
			getThisManyY = Game.viewportHeightInTiles;
			getThisX = Game.nextX+1;
			getThisY = Game.masterY;
		}

		//up
		else if(y==0){
			Game.nextY = Game.masterY-(Game.viewportHeightInTiles-1);
			Game.stepY = -1;
			Game.shiftArray = -Game.totalviewportHeightInTiles;
			Game.numberOfSteps = 14;
			Game.stepDirection = 'up';
			getThisManyX = Game.viewportWidthInTiles;
			getThisManyY = Game.viewportHeightInTiles-1;
			getThisX = Game.masterX;
			getThisY = Game.nextY;
		}

		//down
		else if(y==Game.viewportHeightInTiles-1){
			Game.nextY = Game.masterY+Game.viewportHeightInTiles-1;
			Game.stepY = 1;
			Game.shiftArray = Game.totalviewportHeightInTiles;
			Game.numberOfSteps = 14;
			Game.stepDirection = 'down';
			getThisManyX = Game.viewportWidthInTiles;
			getThisManyY = Game.viewportHeightInTiles-1;
			getThisX = Game.masterX;
			getThisY = Game.nextY+1;
		}
		console.log(Game.masterX+", "+Game.masterY);
		console.log(Game.nextX+", "+Game.nextY);
		Game.stepNumber = 0;
		Game._getTiles(getThisX,getThisY,getThisManyX,getThisManyY, function(){
			Game._stepTransition();
		});
	},

	_stepTransition: function(){
		if(Game.stepNumber!=Game.numberOfSteps){
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
		else{
			Game._endTransition();
		}
	},

	_endTransition: function(){
		inTransit = false;
		console.log("done!!");
	},

	_updateAndDraw: function(){
		Game.stepNumber += 1;
		//--------RIGHT------------
		//go thru current array and shift everthing
		if(Game.stepDirection=='right'){
			//shift all except last column
			for(var i=0;i<Game.viewportWidthInTiles-1;i++){
				for(var j=0;j<Game.viewportHeightInTiles;j++){
					Game.currentTiles[i][j] = Game.currentTiles[i+1][j];
				}
			}
			//shift a new column from the next array to the last spot
			for(var j=0;j<Game.viewportHeightInTiles;j++){
				Game.currentTiles[Game.viewportWidthInTiles-1][j] = Game.nextTiles[Game.stepNumber-1][j];
			}
			Game.masterX += 1;
		}

		//--------LEFT------------
		//go thru current array and shift everthing
		if(Game.stepDirection=='left'){
			//shift all except last column
			for(var i=Game.viewportWidthInTiles-1;i>0;i--){
				for(var j=0;j<Game.viewportHeightInTiles;j++){
					Game.currentTiles[i][j] = Game.currentTiles[i-1][j];
				}
			}
			//shift a new column from the next array to the last spot
			for(var j=0;j<Game.viewportHeightInTiles;j++){
				Game.currentTiles[0][j] = Game.nextTiles[Game.nextTiles.length-Game.stepNumber][j];
			}
			Game.masterX -= 1;
		}

		//--------UP------------
		//go thru current array and shift everthing
		if(Game.stepDirection=='up'){
			//shift all except last column
			for(var j=Game.viewportHeightInTiles-1;j>0;j--){
				for(var i=0;i<Game.viewportWidthInTiles;i++){
					Game.currentTiles[i][j] = Game.currentTiles[i][j-1];
				}
			}
			//shift a new column from the next array to the last spot
			for(var i=0;i<Game.viewportWidthInTiles;i++){
				Game.currentTiles[i][0] = Game.nextTiles[i][Game.nextTiles[0].length-Game.stepNumber];
			}
			Game.masterY -= 1;
		}

		//--------DOWN------------
		//go thru current array and shift everthing
		if(Game.stepDirection=='down'){
			//shift all except last column
			for(var j=0;j<Game.viewportHeightInTiles-1;j++){
				for(var i=0;i<Game.viewportWidthInTiles;i++){
					Game.currentTiles[i][j] = Game.currentTiles[i][j+1];
				}
			}
			//shift a new column from the next array to the last spot
			for(var i=0;i<Game.viewportWidthInTiles;i++){
				Game.currentTiles[i][Game.viewportHeightInTiles-1] = Game.nextTiles[i][Game.stepNumber-1];
			}
			Game.masterY += 1;
		}




		Game._renderAll();
		requestAnimFrame(Game._stepTransition); 
	}
};

$(document).ready(function(){
	
	
	//returns local x,y grid data based on mouse location
	getXYFromMouse = function(a,b,oa,ob,callback){
		var x = a - oa;
		var y = b - ob;
		var snapX = Math.floor(x/32);
		var snapY = Math.floor(y/32);
		
		//extremes(if at edge it will be just over)
		if(snapX>29){
			snapX= 29;
		}
		else if(snapX<0){
			snapX = 0;
		}
		if(snapY>14){
			snapX= 14;
		}
		else if(snapY<0){
			snapX= 0;
		} 
		return callback(snapX,snapY);
	};

	//change cursor on mouse move
	$(".gameboard").mousemove(function(m) {
		getXYFromMouse(m.pageX,m.pageY,this.offsetLeft,this.offsetTop,function(x,y){
			
			var noGoValue = Game.getNoGo(x,y);
			var tempColor = noGoValue ? 'red' : 'white';
			
			$(".cursor").css({
				'left': x*32,
				'top': y*32,
				'border-color': tempColor,
			});
		});
 	});

 	//figure out if we should transition (or do other stuff later)
 	$(".gameboard").click(function(m){
 		if(!inTransit){
 			getXYFromMouse(m.pageX,m.pageY,this.offsetLeft,this.offsetTop,function(x,y){
 				Game.isMapEdge(x,y,function(reply){
 					if(!reply){
 						if(x==0 || x==29 || y==0 || y==14){
 							inTransit = true;
 							Game.beginTransition(x,y);
 						}
 						else{
 							console.log('think outside the box');
 						}
 					}	
 					else{
 						console.log("edge");
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
	// 	"id": 0,
	// 	"x": Math.floor(Math.random()*500),
	// 	"y": Math.floor(Math.random()*400+100),
	// 	"r": Math.floor(Math.random()*250),
	// 	"g": Math.floor(Math.random()*250),
	// 	"b": Math.floor(Math.random()*250)
	// }
	
	// console.log($scope.infos);
	// rpc('multiplayer.addMe',$scope.infos);
	// $scope.messages = [];
	// $scope.streaming = false;
	// $scope.status = "";
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
// 	$scope.status = "";
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
