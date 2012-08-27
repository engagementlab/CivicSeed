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
	tilesWidth: 30,
	tilesHeight: 15,
	totalTilesWidth: 145,
	totalTilesHeight: 140,
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
			Game._getTiles(0,0,function(){

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
		for(var t=0;t<Game.nextTiles.length;t++){
			Game.currentTiles[t] = Game.nextTiles[t];
		}
		callback();
	},

	_getTiles: function(x,y,callback) {
		ss.rpc('multiplayer.getMapData',x,y,x+30,y+15,function(response){
			Game.nextTiles = response;
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
		for(var i=0;i<Game.currentTiles.length;i++){
			//tilemap starts at 1 instead of 0
			var index = Game.currentTiles[i].background-1;
			var srcX = index % Game.tilesheetWidth;
			var srcY = Math.floor(index / Game.tilesheetWidth);
			var destX = i % Game.tilesWidth; 
			var destY = Math.floor(i/Game.tilesWidth);

			Game._renderTile(index, srcX, srcY, destX, destY);
		}	
	},

	getNoGo: function(x,y) {
		var i = y*Game.tilesWidth + (x%Game.tilesWidth);
		var noGoVal = Game.currentTiles[i].nogo;
		//console.log(noGoVal);
		return noGoVal;
	},

	getWorldEdge: function(x,y){
		var i = y*Game.tilesWidth + (x%Game.tilesWidth);
		var edge = Game.currentTiles[i].isWorldEdge;
		return edge;
	},

	beginTransition: function(x,y){
		var isEdge = Game.getWorldEdge(x,y);

		if(!isEdge){
			if(x==0){
				Game.nextX = Game.masterX-(Game.tilesWidth-1);
				Game.stepX = -1;
				Game.shiftArray = -1;
			}
			else if(x==Game.tilesWidth-1){
				Game.nextX = Game.masterX+(Game.tilesWidth-1);
				Game.stepX = 1;
				Game.shiftArray = 1;
			}
			else if(y==0){
				Game.nextY = Game.masterX-(Game.tilesHeight-1);
				Game.stepY = -1;
				Game.shiftArray = -totalTilesHeight;
			}
			else if(y==Game.tilesHeight-1){
				Game.nextY = Game.masterX+(Game.tilesHeight-1);
				Game.stepY = 1;
				Game.shiftArray = totalTilesHeight;
			}
			Game._getTiles(Game.nextX,Game.nextY,function(){
				Game._stepTransition();
			});
		}
	},

	_stepTransition: function(){
		if(Game.masterX!=Game.nextX){
			Game.masterX+=Game.stepX;
			Game._updateAndDraw();
		}
		else if(Game.masterY!=Game.nextY){
			Game.masterY+=Game.stepY;
			Game._updateAndDraw();
		}
		else{
			Game._endTransition();
		}
	},

	_endTransition: function(){
		inTransit = false;
		console.log("done!!");
	},

	_updateAndDraw: function(){
		console.log(Game.masterX+", "+Game.masterY);
		// for(var i=0;i<currentTiles.length;i++){
			
		// }
		requestAnimFrame( Game._stepTransition );
    	//Game._renderAll();
	}
};

$(document).ready(function(){
	
	
	//returns local x,y grid data based on mouse location
	getXYFromMouse = function(a,b,oa,ob,callback){
		var x = a - oa;
		var y = b - ob;
		var snapX = Math.floor(x/32);
		var snapY = Math.floor(y/32);
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
 			inTransit = true;
 			getXYFromMouse(m.pageX,m.pageY,this.offsetLeft,this.offsetTop,function(x,y){
 				Game.beginTransition(x,y);
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
