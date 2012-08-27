// RUSS: do all your functions and members to "Game" in here
var Game = {
	masterX: 0,
	masterY: 0,
	tilesWidth: 30,
	tilesHeight: 15,
	tileSize: 32,
	tilesheet: null,
	tilesheetWidth: 640/32,
	tilesheetHeight: 3136/32,
	tilesheetCanvas: null,
	backgroundContext: null,
	foregroundContext: null,
	charactersContext: null,
	tilesheetContext: null,
	tiles: [],

	init: function() {
		// Game initialization
		tilesheetCanvas = document.createElement('canvas');
        // Set that canvas attributes
        tilesheetCanvas.setAttribute('width', Game.tilesheetWidth*Game.tileSize);
        tilesheetCanvas.setAttribute('height', Game.tilesheetHeight*Game.tileSize);

		ss.rpc('multiplayer.init',function(response){
			console.log("rpc init: "+response);
		});
		Game.tilesheet = new Image();
		Game.tilesheet.src = 'img/game/tilesheet.png';
		Game.backgroundContext = document.getElementById('background').getContext('2d');
		Game.foregroundContext = document.getElementById('foreground').getContext('2d');
		Game.charactersContext = document.getElementById('characters').getContext('2d');
		Game.tilesheetContext = tilesheetCanvas.getContext('2d');

		Game.tilesheet.onload = function(){
			Game.tilesheetContext.drawImage(Game.tilesheet,0,0);
			Game.getTiles();
		};
	},

	getTiles: function() {
		ss.rpc('multiplayer.getMapData',Game.masterX,Game.masterY,Game.masterX+30,Game.masterY+15,function(response){
			Game.tiles = response;
			Game.render();
		});
	},
	render: function() {

		for(var i=0;i<Game.tiles.length;i++){
			//console.log(Game.tiles[i].background);
			var index = Game.tiles[i].background-1;
			var srcX = index % Game.tilesheetWidth;
			var srcY = Math.floor(index / Game.tilesheetWidth);
			var destX = i % Game.tilesWidth; 
			var destY = Math.floor(i/Game.tilesWidth);

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
		}	
	}
};

$(document).ready(function(){
		
	Game.init();
	$(".gameboard").click(function(e){
		Game.getTiles();
	});
});


//******************** mouse interaction with grid 
	// calculateMouse = function(a,b,oa,ob,callback){
	// 	var x = a - oa;
	// 	var y = b - ob;
	// 	var snapX = Math.floor(x/32);
	// 	var snapY = Math.floor(y/32);
	// 	return callback(snapX,snapY);
	// };
	// $(".gameboard").mousemove(function(m) {
	// 	calculateMouse(m.pageX,m.pageY,this.offsetLeft,this.offsetTop,function(x,y){
			
	// 		var noGoValue = Game.getNoGo(x,y);
	// 		Game.setCurrentTile(x,y);
	// 		var tempColor;
	// 		if(noGoValue){
	// 			tempColor = 'red';
	// 		}
	// 		else{
	// 			tempColor = 'white';
	// 		}
	// 		//change cursor style and location
	// 		$(".cursor").css({
	// 			'left': x*32,
	// 			'top': y*32,
	// 			'border-color': tempColor
	// 		});
	// 	});
 // 	});

 	//******* moving player on click for now (only on edge of screen)
	// $(".gameboard").click(function(m){
	// 	if(Game.currentTile.nogo==false){

	// 		//left
	// 		if(Game.currentTile.x<1){
	// 			//move bg
	// 			$(".map").addClass("map-left");
	// 			var newX = parseInt($(".map").css("background-position-x"))+896;
	// 			var newY = parseInt($(".map").css("background-position-y"));
	// 			$(".map-left").css({
	// 				"background-position-x":newX+"px",
	// 				"background-position-y":newY+"px"
	// 			});

	// 			//move grid

	// 			$(".current").addClass("shiftRight");

	// 			//new quad is -1
	// 			Game.changeQuad(-1);
	// 		}
	// 		//right
	// 		else if(Game.currentTile.x>28){
	// 			$(".topRight").addClass("horizontalQuad").removeClass("cornerQuad");
	// 			$(".middleRight").addClass("fullQuad").removeClass("verticalQuad");
	// 			$(".bottomRight").addClass("horizontalQuad").removeClass("cornerQuad");
				
	// 			//move bg
	// 			$(".map").addClass("map-right");
	// 			var newX = parseInt($(".map").css("background-position-x"))-896;
	// 			var newY = parseInt($(".map").css("background-position-y"));
	// 			$(".map-right").css({
	// 				"background-position-x":newX+"px",
	// 				"background-position-y":newY+"px"
	// 			});
				
	// 			//move grid
	// 			$(".current").css("width","1856px");
	// 			$(".current").addClass("shiftLeft");
				
	// 			//new quad is +1
	// 			Game.changeQuad(1);
	// 		}
	// 		//up
	// 		else if(Game.currentTile.y<1){

	// 			$(".map").addClass("map-up");
	// 			var newX = parseInt($(".map").css("background-position-x"));
	// 			var newY = parseInt($(".map").css("background-position-y"))+416;
	// 			$(".map-up").css({
	// 				"background-position-x":newX+"px",
	// 				"background-position-y":newY+"px"
	// 			});

	// 			//move grid
	// 			$(".current").addClass("shiftUp");
	// 			//new quad is -5
	// 			Game.changeQuad(-5);
	// 		}
	// 		//down
	// 		else if(Game.currentTile.y>13){
	// 			$(".map").addClass("map-down");
	// 			var newX = parseInt($(".map").css("background-position-x"));
	// 			var newY = parseInt($(".map").css("background-position-y"))-416;
	// 			$(".map-down").css({
	// 				"background-position-x":newX+"px",
	// 				"background-position-y":newY+"px"
	// 			});
	// 			//move grid
	// 			$(".current").addClass("shiftDown");
	// 			//new quad is +5
	// 			Game.changeQuad(5);
	// 		}
	// 		//reset 
	// 		$(".map").bind('transitionend webkitTransitionEnd', function() { 
	// 			$(this).removeClass("map-left");
	// 			$(this).removeClass("map-right");
	// 			$(this).removeClass("map-up");
	// 			$(this).removeClass("map-down");
	// 			$("topLeft").remove();
	// 			$(".current").css({
	// 				"width": "960px"
	// 				// "left": "0px"
	// 			});
	// 			//$(".current").removeClass("shiftLeft");
	// 			$(".middleMiddle").css({
	// 				"width":"32px",
	// 				"left": "896px"
	// 			});
	// 			$(".cube").css("left","0px");

	// 		});
	// 	}
	// 		Game.info();
	// });
	//********************mouse interaction end ******


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
