
	// Game.initialize();
	
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
			$(".cursor").css({
				'left': x*32,
				'top': y*32
			});
		});
 	});
	$(".gameboard").click(function(m){
		calculateMouse(m.pageX,m.pageY,this.offsetLeft,this.offsetTop,function(x,y){
			$(".debug .tile").text(x+", "+y);
		});
	});

angular.module('multiPlayer', ['ssAngular'])
.controller('PlayerController',function($scope,$http,pubsub,rpc) {
	$http.get('data/development/map.json').success(function(data) {
    	console.log(data);
  	});

	$scope.players;
	$scope.infos = 
	{
		"id": 0,
		"x": Math.floor(Math.random()*500),
		"y": Math.floor(Math.random()*400+100),
		"r": Math.floor(Math.random()*250),
		"g": Math.floor(Math.random()*250),
		"b": Math.floor(Math.random()*250)
	}
	var s = rpc('multiplayer.checkIn');
	$scope.infos.id = s;
	console.log($scope.infos);
	rpc('multiplayer.addMe',$scope.infos);
	$scope.messages = [];
	$scope.streaming = false;
	$scope.status = "";


	$scope.$on('ss-count', function(event,num) {
		$scope.playerCount = num;
	});
	$scope.$on('ss-allPlayers',function(event,nubes){
		$scope.players = nubes;
	});

	//player movement
	$(window).keydown(function(event) {
		//left
  		if(event.which == 37) {
   			$scope.infos.x-=32;
   			$(".gameboard").addClass("gameboard-left");
			var x = parseInt($(".gameboard").css("background-position-x"))+896;
			var y = parseInt($(".gameboard").css("background-position-y"));
			$(".gameboard-left").css({
				"background-position-x":x+"px",
				"background-position-y":y+"px"
			});
   		}

   		//up
   		if(event.which == 38) {
   			$scope.infos.y-=32;
   			$(".gameboard").addClass("gameboard-up");
			var x = parseInt($(".gameboard").css("background-position-x"));
			var y = parseInt($(".gameboard").css("background-position-y"))+416;
			$(".gameboard-up").css({
				"background-position-x":x+"px",
				"background-position-y":y+"px"
			});
   		}

   		//right
   		if(event.which == 39) {
   			$scope.infos.x+=32;
   			$(".gameboard").addClass("gameboard-right");
			var x = parseInt($(".gameboard").css("background-position-x"))-896;
			var y = parseInt($(".gameboard").css("background-position-y"));
			$(".gameboard-right").css({
				"background-position-x":x+"px",
				"background-position-y":y+"px"
			});
   		}

   		//down
   		if(event.which == 40) {
   			$scope.infos.y+=32;
   			$(".gameboard").addClass("gameboard-down");
			var x = parseInt($(".gameboard").css("background-position-x"));
			var y = parseInt($(".gameboard").css("background-position-y"))-416;
			$(".gameboard-down").css({
				"background-position-x":x+"px",
				"background-position-y":y+"px"
			});
   		}

   		$(".gameboard").bind('transitionend webkitTransitionEnd', function() { 
			
			$(this).removeClass(".gameboard-left");
			$(this).removeClass(".gameboard-right");
			$(this).removeClass(".gameboard-up");
			$(this).removeClass(".gameboard-down");

		});
   		//super inefficient
   		rpc('multiplayer.playerMoved',$scope.infos);
   		return false;
	});
	
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
