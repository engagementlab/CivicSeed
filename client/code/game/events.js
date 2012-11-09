

//events recevied by RPC


//detect when a client leaves and send something to server
$(window).on('beforeunload', function() {
	var x = leaveThisJoint();
	return x;
});
function leaveThisJoint(){
	ss.rpc('game.player.removePlayer', $game.$player.id);
}

//new player joining to keep track of
ss.event.on('ss-addPlayer', function(num, player) {
	$game.numPlayers = num;
	$game.$others.add(player);
	console.log("total active players: " + $game.numPlayers);
});
ss.event.on('ss-removePlayer', function(num, playerId) {
	$game.numPlayers = num;
	$game.$others.remove(playerId);
	console.log("total active players: " + $game.numPlayers);
});

ss.event.on('ss-playerMoved', function(moves, id) {
		//check if that quad is relevant to the current player
		//this will also have the player info so as to id the appropriate one
		
		if(id == $game.$player.id) {
			$game.$player.sendMoveInfo(moves);
		}
		else {
			$game.$others.sendMoveInfo(moves, id);

		}
		

});
//all this breakdown will be on the server side, not client side,
//but we will pass the tiles info
ss.event.on('ss-seedDropped', function(bombed) {
	$game.$map.newBomb(bombed);
});


//new message from chat
ss.event.on('ss-newMessage', function(message, id) {
	
	if(id === $game.$player.id) {
		$game.$player.message(message);
	}
	else {
		$game.$others.message(message, id);
	}

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
			//$game.$player.dropSeed({mouse:false});
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

//send whatever is in the chat field
$('#chatButton').click(function(e) {
	e.preventDefault();
	if($game.$npc.isResource === false && $game.inTransit === false && $game.$player.isMoving === false) {
		var message = $('#chatText').val();
		ss.rpc('game.chat.sendMessage', message, $game.$player.id);
		$('#chatText').val('');
	}
	return false;

});
