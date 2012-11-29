	//events recevied by RPC

// SEE http://stackoverflow.com/questions/9626059/window-onbeforeunload-in-chrome-what-is-the-most-recent-fix
//detect when a client leaves and send something to server
$(window).on('beforeunload', function() {
	var x = leaveThisJoint();
	return x;
});
function leaveThisJoint() {
	$game.$player.exitAndSave();
}

//new player joining to keep track of
ss.event.on('ss-addPlayer', function(num, player) {
	$game.numPlayers = num;
	$game.$others.add(player);
	console.log("total active players: " + $game.numPlayers);
	$('.activePlayers').text(num + ' active players!');
});
ss.event.on('ss-removePlayer', function(num, playerId) {
	$game.numPlayers = num;
	$game.$others.remove(playerId);
	console.log("total active players: " + $game.numPlayers);
});

ss.event.on('ss-playerMoved', function(moves, id) {
		//check if that quad is relevant to the current player
		//this will also have the player info so as to id the appropriate one
		
		if(id != $game.$player.id) {
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
	if( !$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && $game.ready){
	
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

	if(!$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && !$game.$player.inventoryShowing && $game.running){
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
	if(!$game.$npc.isResource && !$game.inTransit && !$game.$player.isMoving) {
		var message = $('#chatText').val();
		ss.rpc('game.chat.sendMessage', message, $game.$player.id);
		$('#chatText').val('');
	}
	return false;
});

$(window).blur(function(e) {
	if(!$game.$npc.isResource) {
		//$game.pause();
	}
	
});

$(".unPause").click(function () {
	$game.resume();
});

$('.resourceArea').keypress(function(event){
    
    if (event.keyCode == 10 || event.keyCode == 13) {
        event.preventDefault();
        return false;
    }
});

$('.inventoryButton, .inventory button').click(function () {
	if(!$game.$resources.isShowing) {
		if($game.$player.inventoryShowing) {
			$('.inventory').slideUp(function() {
				$game.$player.inventoryShowing = false;
			});	
		}
		else {
			$('.inventory').slideDown(function() {
				$game.$player.inventoryShowing = true;
			});	
		}	
	}
	return false;
});
