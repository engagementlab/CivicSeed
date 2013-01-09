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



/******* RPC EVENTS *********/


//new player joining to keep track of
ss.event.on('ss-addPlayer', function(num, player) {
	$game.numPlayers = num;
	$game.$others.add(player);
	$('.activePlayers p').text(num);
	if(player.name !== $game.$player.name) {
		$game.statusUpdate(player.name + ' has joined!');
	}
	
});

ss.event.on('ss-removePlayer', function(num, playerId) {
	$game.numPlayers = num;
	$game.$others.remove(playerId);
	$('.activePlayers p').text(num);
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
ss.event.on('ss-seedDropped', function(bombed, id) {
	$game.$map.newBomb(bombed, id);
	if(id === $game.$player.id) {
		$game.$player.awaitingBomb = false;
	}
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

ss.event.on('ss-progressChange', function(num) {
	$game.tilesColored = num;
	$game.percent = Math.floor(($game.tilesColored / $game.tilesColoredGoal) * 100);
	$game.percentString = $game.percent + '%';
	$('.hudBar').css('width', $game.percentString);

	//if we have gone up a milestone, feedback it
	if($game.percent > 99) {
		//do something for game over?
		$game.statusUpdate('the color has been restored!');
	}
	else if($game.percent % 5 === 0) {
		$game.statusUpdate('the world is now ' + $game.percentString + ' colored!');
	}
});

ss.event.on('ss-leaderChange', function(board, newOne) {
	
	if($game.leaderboard.length > 0) {
		var leaderChange = ($game.leaderboard[0].name === board[0].name) ? false : true;	
	}
	$game.leaderboard = board;
	if(newOne) {
		$game.statusUpdate(newOne + ' is now a top seeder.');
	}
	else if(leaderChange) {
		$game.statusUpdate(board[0].name + ' is top dog!');
	}
});

ss.event.on('ss-addPlayerAnswer', function(data, id) {
	$game.$resources.addAnswer(data,id);
});


/********** BUTTON / MOUSE EVENTS **********/


$('.seedButton').bind('click', (function () {
	//$game.$player.seedMode = $game.$player.seedMode ? false : true;
	if(!$game.inTransit && !$game.$player.isMoving) {
		
		//turn it off if on
		if($game.$player.seedMode > 0) {
			$game.$player.seedMode = 0;
			$game.changeStatus();
		}
		else {
			$game.$player.seedMode = 1;
			$game.changeStatus();
		}
	}
}));
$('.seedButton2').bind('click', (function () {
	//$game.$player.seedMode = $game.$player.seedMode ? false : true;
	if(!$game.inTransit && !$game.$player.isMoving) {
		
		//turn it off if on
		if($game.$player.seedMode > 0) {
			$game.$player.seedMode = 0;
			$game.changeStatus();
		}
		else {
			$game.$player.seedMode = 2;
			$game.changeStatus();
		}
	}
}));
$(window).bind('keypress', (function (key) {
	//$game.$player.seedMode = $game.$player.seedMode ? false : true;
	if(!$game.inTransit && !$game.$player.isMoving && key.which === 115 && $game.ready) {
			//$game.$player.dropSeed({mouse:false});
	}
}));
//change cursor on mouse move
$('.gameboard').mousemove(function(m) {
	if( !$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && $game.running){
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

	if(!$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && !$game.$player.inventoryShowing && $game.running && !$game.$gnome.isChat && !$game.showingProgress){
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
		var sentence = $('#chatText').val();
		var data = {
			msg: $game.checkPotty(sentence),
			who: $game.$player.name,
			id: $game.$player.id,
			log: sentence
		};
		ss.rpc('game.chat.sendMessage', data);
		$('#chatText').val('');
	}
	return false;
});

$('.chatButton').click(function(e) {
	
	$('.chatBox').toggleClass('hide');
	$('.displayBox').toggleClass('hide');
	//return false;
});

$(window).blur(function(e) {
	if(!$game.$npc.isResource) {
		//$game.pause();
	}
	
});

$('.unPause').click(function () {
	$game.resume();
});

$('.resourceArea').keypress(function(event){
    
    if (event.keyCode == 10 || event.keyCode == 13) {
        event.preventDefault();
        return false;
    }
});

$('.inventoryButton, .inventory button').click(function () {
	if(!$game.$resources.isShowing && !$game.$gnome.isShowing) {
		if($game.$player.inventoryShowing) {
			$('.inventory').slideUp(function() {
				$game.$player.inventoryShowing = false;
				$('.displayBoxText').text('you are in the forest');
			});	
		}
		else {
			$('.inventory').slideDown(function() {
				$game.$player.inventoryShowing = true;
				$('.displayBoxText').text('click items to view again');
			});	
		}	
	}
	return false;
});

$('.resourceArea a i, .resourceArea .closeButton').bind('click', (function (e) {
	e.preventDefault();
	$game.$resources.hideResource();
	return false;
}));
$('.resourceArea .nextButton').bind('click', (function () {
	$game.$resources.nextSlide();
}));
$('.resourceArea .backButton').bind('click', (function () {
	$game.$resources.previousSlide();
}));								
$('.resourceArea .answerButton').bind('click', (function (e) {
	e.preventDefault();
	$game.$resources.submitAnswer();
	return false;
}));

$('.gnomeArea a i, .gnomeArea .closeButton').bind('click', (function (e) {
	e.preventDefault();
	$game.$gnome.hideResource();
	return false;
}));
$('.gnomeArea .nextButton').bind('click', (function () {
	$game.$gnome.nextSlide();
}));
$('.gnomeArea .backButton').bind('click', (function () {
	$game.$gnome.previousSlide();
}));								
$('.gnomeArea .answerButton').bind('click', (function (e) {
	e.preventDefault();
	$game.$gnome.submitAnswer();
	return false;
}));

$('.progressArea a i').bind('click', (function (e) {
	e.preventDefault();
	$('.progressArea').slideUp(function() {
		$game.showingProgress = false;
	});
	return false;
}));

$('.activePlayers').click(function() {
	$('#minimapPlayer').toggleClass('hide');
});

$('.progress').bind('click', function() {
	if($game.showingProgress) {
		$('.progressArea').slideUp(function() {
			$game.showingProgress = false;
		});
	}
	else {
		$game.showProgress();
	}
});

// $(window).bind('keydown',function(e) {
// 	if(!$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && !$game.$player.inventoryShowing && $game.running && !$game.$gnome.isChat){
// 		$game.$mouse.updateKey(e.which);
// 	}
// });
// $(window).bind('keyup',function(e) {
// 	$game.$player.keyWalking = false;
// });