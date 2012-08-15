	$(document).ready(function(){
		Game.init();
	});
//******************** mouse interaction with grid 
	calculateMouse = function(a,b,oa,ob,callback){
		var x = a - oa;
		var y = b - ob;
		var snapX = Math.floor(x/32);
		var snapY = Math.floor(y/32);
		return callback(snapX,snapY);
	};
	$(".gameboard").mousemove(function(m) {
		calculateMouse(m.pageX,m.pageY,this.offsetLeft,this.offsetTop,function(x,y){
			$(".debug .coords").text(x*32+", "+y*32);
			
			//no go cursor
			var tileIndex = (y-1)*28+(x-1);
			var tempColor = "white";
			if(tileIndex>-1 && tileIndex<364){
				if(Game.data.tiles[tileIndex].nogo){
				tempColor = "red";
				}	
			}
			else{
				tempColor= "red";
			}

			//change cursor style and location
			$(".cursor").css({
				'left': x*32,
				'top': y*32,
				'border-color': tempColor
			});
			$(".debug .tile").text(x+", "+y);

		});
 	});

 	//******* moving player on click for now (only on edge of screen)
	$(".gameboard").click(function(m){
		calculateMouse(m.pageX,m.pageY,this.offsetLeft,this.offsetTop,function(x,y){
			//for now if they click in a corner, left right overides
			//modularize movement
			//change Game.x to quadrant check
			//scroll left

			if(x<1){
				console.log("ya");
				$(".map").addClass("map-left");
				var newX = parseInt($(".map").css("background-position-x"))+896;
				var newY = parseInt($(".map").css("background-position-y"));
				$(".map-left").css({
					"background-position-x":newX+"px",
					"background-position-y":newY+"px"
				});

			}
			//right
			else if(x>28){
				$(".map").addClass("map-right");
				var newX = parseInt($(".map").css("background-position-x"))-896;
				var newY = parseInt($(".map").css("background-position-y"));
				$(".map-right").css({
					"background-position-x":newX+"px",
					"background-position-y":newY+"px"
				});
			}
			//up
			else if(y<1){
				$(".map").addClass("map-up");
				var newX = parseInt($(".map").css("background-position-x"));
				var newY = parseInt($(".map").css("background-position-y"))+416;
				$(".map-up").css({
					"background-position-x":newX+"px",
					"background-position-y":newY+"px"
				});
			}
			//down
			else if(y>13){
				$(".map").addClass("map-down");
				var newX = parseInt($(".map").css("background-position-x"));
				var newY = parseInt($(".map").css("background-position-y"))-416;
				$(".map-down").css({
					"background-position-x":newX+"px",
					"background-position-y":newY+"px"
				});
			}
			//reset 
			$(".map").bind('transitionend webkitTransitionEnd', function() { 
				$(this).removeClass(".map-left");
				$(this).removeClass(".map-right");
				$(this).removeClass(".map-up");
				$(this).removeClass(".map-down");
				var temp = $(this).css('background-position-x');
				console.log(temp);
			});
		});
	});
	//********************mouse interaction end ******


angular.module('multiPlayer', ['ssAngular'])
.controller('PlayerController',function($scope,$http,pubsub,rpc) {

	
	

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
	// rpc('multiplayer.checkIn',function(s){
	// 	$scope.infos.id = s;
	// });
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
