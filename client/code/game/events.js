

//events recevied by RPC


//detect when a client leaves and send something to server
$(window).on('beforeunload', function() {
	var x = leaveThisJoint();
	return x;
});
function leaveThisJoint(){
	ss.rpc('game.player.playerLeft', $game.$player.id);
}

//new player joining to keep track of
ss.event.on('ss-numActivePlayers', function(num) {
	$game.numPlayers = num;
	console.log("total active players: " + $game.numPlayers);
});

ss.event.on('ss-playerMoved', function(moves) {
		//check if that quad is relevant to the current player
		//this will also have the player info so as to id the appropriate one
		$game.$player.seriesOfMoves = new Array(moves.length);
		$game.$player.seriesOfMoves = moves;
		$game.$player.currentMove = 1;
		$game.$player.currentStep = 0;
		$game.$player.isMoving = true;

});
//all this breakdown will be on the server side, not client side, 
//but we will pass the tiles info 
ss.event.on('ss-seedDropped', function(bombed) {
	$game.$map.newBomb(bombed);
});




$('.seedButton').bind("click", (function () {
	//$game.$player.seedMode = $game.$player.seedMode ? false : true;
	if(!$game.inTransit && !$game.$player.isMoving) {
		$game.$player.seedMode = !$game.$player.seedMode;
	}
	
}));
$(window).bind("keypress", (function (key) {
	//$game.$player.seedMode = $game.$player.seedMode ? false : true;
	if(!$game.inTransit && !$game.$player.isMoving && key.which === 115 && $game.ready) {
			$game.$player.dropSeed({mouse:false});
	}		
}));
//change cursor on mouse move
$('.gameboard').mousemove(function(m) {
	if( !$game.inTransit && !$game.$player.isMoving && !$game.$npc.isResource && $game.ready){
	
		var mInfo = {
			x: m.pageX,
			y: m.pageY,
			offX: this.offsetLeft,
			offY: this.offsetTop,
			debug: false
		};
		$game.$mouse.updateMouse(mInfo, false); 
	}
});

//figure out if we shoupdatuld transition (or do other stuff later)
$('.gameboard').click(function(m) {

	if(!$game.inTransit && !$game.$player.isMoving && !$game.$npc.isResource){

			var mInfo = {
			x: m.pageX,
			y: m.pageY,
			offX: this.offsetLeft,
			offY: this.offsetTop,
			debug: false
		};
			$game.$mouse.updateMouse(mInfo,true);
	}
});
