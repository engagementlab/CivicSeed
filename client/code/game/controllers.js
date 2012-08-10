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
  		if(event.which == 37) {
   			$scope.infos.x-=32;
   		}
   		if(event.which == 38) {
   			$scope.infos.y-=32;
   		}
   		if(event.which == 39) {
   			$scope.infos.x+=32;
   		}
   		if(event.which == 40) {
   			$scope.infos.y+=32;
   		}

   		//super inefficient
   		rpc('multiplayer.playerMoved',$scope.infos);
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
