var Game = {};

Game.fps = 30,
Game.x,
Game.y,
Game.quadrant = 0,
Game.data;

Game.init = function() {
	Game.x = 32;
	Game.y = 32;
	$(".map").css({
		"background-position-x":Game.x+"px",
		"background-position-y":Game.y+"px"
	});
	ss.rpc('multiplayer.init',function(err,data){
		Game.data = data[0];
	});
};

Game.draw = function() {
 
};

Game.update = function() {
  
};

Game.changePosition = function(x,y){
	Game.x = x;
	Game.y = y;
};


