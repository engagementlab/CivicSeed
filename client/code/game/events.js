	//events recevied by RPC

// SEE http://stackoverflow.com/questions/9626059/window-onbeforeunload-in-chrome-what-is-the-most-recent-fix
//detect when a client leaves and send something to server

$(function() {
	var _w = $(window),
		_activePlayers = $('.activePlayers span'),
		_progressHudCount = $('.progressButton .hudCount'),
		_gameboard = $('.gameboard'),
		_chatText = $('#chatText'),
		_chatBox = $('.chatBox'),
		_displayBox = $('.displayBox'),
		_inventory = $('.inventory'),
		_displayBoxText = $('.displayBoxText'),
		_progressArea = $('.progressArea');

	_w.on('beforeunload', function() {
		var x = leaveThisJoint();
		return x;
	});
	
	/******* RPC EVENTS *********/


	//new player joining to keep track of
	ss.event.on('ss-addPlayer', function(num, player) {
		$game.numPlayers = num;
		$game.$others.add(player);
		_activePlayers.text(num);
		if(player.name !== $game.$player.name) {
			$game.statusUpdate(player.name + ' has joined!');
		}
	});

	ss.event.on('ss-removePlayer', function(num, playerId) {
		$game.numPlayers = num;
		$game.$others.remove(playerId);
		_activePlayers.text(num);
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

	ss.event.on('ss-statusUpdate', function(message) {
		$game.statusUpdate(message);
	});

	ss.event.on('ss-progressChange', function(num) {
		$game.seedsDropped = num.dropped;
		$game.tilesColored = num.colored;

		$game.percent = Math.floor(($game.seedsDropped / $game.seedsDroppedGoal) * 100);
		$game.percentString = $game.percent + '%';
		_progressHudCount.text($game.percentString);

		//if we have gone up a milestone, feedback it
		if($game.percent > 99) {
			//do something for game over?
			$game.statusUpdate('the color has been restored!');
		}
		if($game.prevPercent != $game.percent) {
			$game.prevPercent = $game.percent;
			if($game.percent % 5 === 0) {
				$game.statusUpdate('the world is now ' + $game.percentString + ' colored!');
			}
		}
	});

	ss.event.on('ss-leaderChange', function(board, newOne) {
		
		if($game.leaderboard.length > 0) {
			var leaderChange = ($game.leaderboard[0].name === board[0].name) ? false : true;
		}
		$game.leaderboard = board;
		if(newOne) {
			$game.statusUpdate(newOne + ' is now a top seeder');
		}
		else if(leaderChange) {
			$game.statusUpdate(board[0].name + ' is top dog!');
		}
	});

	ss.event.on('ss-addPlayerAnswer', function(data, id) {
		$game.$resources.addAnswer(data,id);
	});


	/********** BUTTON / MOUSE EVENTS **********/

	$('.seedButton').bind('click', function () {
		//$game.$player.seedMode = $game.$player.seedMode ? false : true;
		var goAhead = startNewAction();
		if(goAhead) {
			//this mean seedventory is DOWN
			//the user clicked meaning they want to open or end seed mode
			//END seed mode
			if($game.$player.seedMode > 0) {
				$game.$player.seedMode = 0;
				$game.$player.seedPlanting = false;
				_renderInfo.colorNum = _playerColorNum;
				$game.changeStatus();
			}
			else {
				//open it up OR turn it on
				$game.$player.openSeedventory();
			}
		}
		else {
			//if it is UP, then we want to clsoe it and turn it off
			if($game.$player.seedventoryShowing) {
				$('.seedventory').slideUp(function() {
					$game.$player.seedventoryShowing = false;
					$game.changeStatus();
				});	
			}
			else {
				$game.$player.seedPlanting = false;
				$game.statusUpdate('seed mode ended, as you were');
			}
			
		}
	});

	$('.normalButton').bind('click', function () {
		$game.$player.startSeeding(1);
	});
	$('.riddleButton').bind('click', function () {
		$game.$player.startSeeding(2);
	});
	$('.specialButton').bind('click', function () {
		$game.$player.startSeeding(3);
	});

	_w.bind('keypress', (function (key) {
		//$game.$player.seedMode = $game.$player.seedMode ? false : true;
		if(!$game.inTransit && !$game.$player.isMoving && key.which === 115 && $game.ready) {
				//$game.$player.dropSeed({mouse:false});
		}
	}));
	//change cursor on mouse move
	_gameboard.bind('mousemove', function(m) {
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
	_gameboard.bind('click', function(m) {

		var goAhead = startNewAction();
		if(goAhead) {
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
			var sentence = _chatText.val();
			var data = {
				msg: $game.checkPotty(sentence),
				who: $game.$player.name,
				id: $game.$player.id,
				log: sentence
			};
			ss.rpc('game.chat.sendMessage', data);
			_chatText.val('');
		}
		return false;
	});

	$('.chatButton').click(function(e) {
		
		_chatBox.toggleClass('hide');
		_displayBox.toggleClass('hide');
		//return false;
	});

	_w.blur(function(e) {
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
		if(!$game.$resources.isShowing && !$game.$player.seedventoryShowing && !$game.$gnome.isShowing) {
			if($game.$player.inventoryShowing) {
				_inventory.slideUp(function() {
					$game.$player.inventoryShowing = false;
					_displayBoxText.text('you are in the forest');
				});	
			}
			else {
				_inventory.slideDown(function() {
					$game.$player.inventoryShowing = true;
					_displayBoxText.text('click items to view again');
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
		_progressArea.fadeOut(function() {
			$game.showingProgress = false;
			$game.changeStatus();
		});
		return false;
	}));

	$('.activePlayers').click(function() {
		$('#minimapPlayer').toggleClass('hide');
	});

	$('.progressButton').bind('click', function() {
		if($game.showingProgress) {
			_progressArea.fadeOut(function() {
				$game.showingProgress = false;
				$game.changeStatus();
			});
		}
		else {
			var goAhead = startNewAction();
			if(goAhead) {
				$game.showProgress();
				$game.changeStatus('game progress and leaderboard');
			}
		}
	});
	$('.muteButton').bind('click', function() {
		var musicOff = $game.$audio.toggleMute();

		if(musicOff) {
			$('.muteButton i').removeClass('icon-volume-up').addClass('icon-volume-off');
		}
		else {
			$('.muteButton i').removeClass('icon-volume-off').addClass('icon-volume-up');
		}
	});

	$('.helpButton').bind('click', function() {
		$('.helpArea').fadeToggle();
	});

	$('.globalHud > div > i, .playerHud > div > i, .seedventory > div > i').bind('mouseenter',function() {
		var info = $(this).attr('title');
		$(this).tooltip('show');
	});
	_w.bind('keydown',function(e) {
		var goAhead = startNewAction();
		if(!$('#chatText').is(':focus')) {
			if(goAhead) {
				$game.$mouse.updateKey(e.which);
			}
		}
	});
	$(window).bind('keyup',function(e) {
		$game.$player.keyWalking = false;
	});

});

function startNewAction() {
	//check all the game states (if windows are open ,in transit, etc.) to begin a new action
	if(!$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && !$game.$player.inventoryShowing && !$game.showingProgress  &&  !$game.$player.seedventoryShowing && $game.running && !$game.$gnome.isChat){
		return true;
	}
	else {
		return false;
	}
}
function leaveThisJoint() {
	$game.$player.exitAndSave();
}