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
		_progressArea = $('.progressArea'),
		_helpShowing = false,
		_pledgeFeedbackTimeout = null;

	_w.on('beforeunload', function() {
		var x = leaveThisJoint();
		return x;
	});

	/******* RPC EVENTS *********/


	//new player joining to keep track of
	ss.event.on('ss-addPlayer', function(data, chan) {
		console.log(data, chan);
		$game.numPlayers = data.num;
		$game.$others.add(data.info);
		_activePlayers.text(data.num);
		if(data.info.id !== $game.$player.id) {
			$game.temporaryStatus(data.info.name + ' has joined!');
		}
	});

	ss.event.on('ss-removePlayer', function(data, chan) {
		$game.numPlayers = data.num;
		if(data.id != $game.$player.id) {
			$game.$others.remove(data.id);
		}
		_activePlayers.text(data.num);
	});

	ss.event.on('ss-playerMoved', function(data, chan) {
		// console.log('ss-playerMoved: ', id, moves);
		//check if that quad is relevant to the current player
		//this will also have the player info so as to id the appropriate one
		// console.log('check ids for player move:', id, $game.$player.id);
		if(data.id != $game.$player.id) {
			$game.$others.sendMoveInfo(data.moves, data.id);
		}
	});
	//all this breakdown will be on the server side, not client side,
	//but we will pass the tiles info
	ss.event.on('ss-seedDropped', function(data, chan) {
		//console.log('ss-seedDropped: ',data);
		$game.$map.newBomb(data.bombed, data.id);
		if($game.$player.id !== data.id) {
			$game.$others.updateTilesColored(data.id, data.tilesColored);
		}
	});

	//new message from chat
	ss.event.on('ss-newMessage', function(data, chan) {
		// console.log('ss-newMessage: ',message, id );
		if(data.id === $game.$player.id) {
			$game.$player.message(data.message);
		}
		else {
			$game.$others.message(data.message, data.id);
		}
	});

	ss.event.on('ss-statusUpdate', function(data, chan) {
		$game.temporaryStatus(data);
	});

	ss.event.on('ss-progressChange', function(data, chan) {
		$game.seedsDropped = data.dropped;
		$game.tilesColored = data.colored;

		$game.percent = Math.floor(($game.seedsDropped / $game.seedsDroppedGoal) * 100);
		$game.percentString = $game.percent + '%';
		_progressHudCount.text($game.percentString);

		//if we have gone up a milestone, feedback it
		if($game.percent > 99) {
			//do something for game over?
			$game.temporaryStatus('the color has been restored!');
		}
		if($game.prevPercent != $game.percent) {
			$game.prevPercent = $game.percent;
			if($game.percent % 5 === 0) {
				$game.temporaryStatus('the world is now ' + $game.percentString + ' colored!');
			}
		}
	});

	ss.event.on('ss-leaderChange', function(data, chan) {
		// console.log(data);
		var leaderChange = true;
		if($game.leaderboard.length > 0) {
			leaderChange = ($game.leaderboard[0].name === data.board[0].name) ? false : true;
			// console.log($game.leaderboard[0], data.board[0], leaderChange);
		}
		if(leaderChange) {
			$game.temporaryStatus(data.board[0].name + ' is top seeder!');
		}
		$game.leaderboard = data.board;
	});

	ss.event.on('ss-addAnswer', function(data, chan) {
		$game.$resources.addAnswer(data);
	});

	ss.event.on('ss-removeAnswer', function(data, chan) {
		$game.$resources.removeAnswer(data);
	});

	//level change for a player
	ss.event.on('ss-levelChange', function(data, chan) {
		$game.$others.levelChange(data.id, data.level);
	});

	//some one pledged a seed to someone's answer
	ss.event.on('ss-seedPledged', function(data, chan) {
		if($game.$player.id === data) {
			$game.temporaryStatus('a peer liked your answer, +1 seed');
			$game.$player.game.seeds.riddle += 1;
			$('.riddleButton .hudCount').text($game.$player.game.seeds.riddle);
			var numSeeds = $game.$player.game.seeds.normal + $game.$player.game.seeds.riddle + $game.$player.game.seeds.special;
			$('.seedButton .hudCount').text(numSeeds);
		}
	});


	/********** BUTTON / MOUSE EVENTS **********/

	$('.seedButton').on('click', function () {
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
				$(this).removeClass('currentButton');
				$game.$player.saveMapImage();
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
				$game.temporaryStatus('seed mode ended, as you were');
			}
			$(this).removeClass('currentButton');
			$game.$player.saveMapImage();
		}
	});

	$('.normalButton').on('click', function () {
		$game.$player.startSeeding(1);
	});
	$('.riddleButton').on('click', function () {
		$game.$player.startSeeding(2);
	});
	$('.specialButton').on('click', function () {
		$game.$player.startSeeding(3);
	});

	//disbaling WASD for now until debugging done.
	// _w.on('keypress', (function (key) {
	// 	//$game.$player.seedMode = $game.$player.seedMode ? false : true;
	// 	if(!$game.inTransit && !$game.$player.isMoving && key.which === 115 && $game.ready) {
	// 			//$game.$player.dropSeed({mouse:false});
	// 	}
	// }));
	//change cursor on mouse move
	_gameboard.on('mousemove', function(m) {
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
	_gameboard.on('click', function(m) {

		var goAhead = startNewAction();
		if(goAhead) {
				var mInfo = {
				x: m.pageX,
				y: m.pageY,
				offX: this.offsetLeft,
				offY: this.offsetTop,
				debug: true
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
				name: $game.$player.name,
				id: $game.$player.id,
				log: sentence,
				instanceName: $game.$player.game.instanceName
			};
			$game.$audio.playTriggerFx('chatSend');
			ss.rpc('game.chat.sendMessage', data, function(r) {

			});
			_chatText.val('');
		}
		return false;
	});

	$('.chatButton').click(function(e) {
		$('.chatButton').toggleClass('currentButton');
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
					$game.changeStatus();
					$('.inventoryButton').removeClass('currentButton');
				});	
			}
			else {
				_inventory.slideDown(function() {
					$game.$player.inventoryShowing = true;
					_displayBoxText.text('click items to view again');
					$('.inventoryButton').addClass('currentButton');
				});	
			}	
		}
		return false;
	});
	$('.resourceArea a i, .resourceArea .closeButton').on('click', (function (e) {
		e.preventDefault();
		$('.check').hide();
		$game.$resources.hideResource();
		return false;
	}));
	$('.resourceArea .nextButton').on('click', (function () {
		$('.check').hide();
		$game.$resources.nextSlide();
	}));
	$('.resourceArea .backButton').on('click', (function () {
		$('.check').hide();
		$game.$resources.previousSlide();
	}));
	$('.resourceArea .answerButton, .resourceArea .sureButton').on('click', (function (e) {
		e.preventDefault();
		$('.check').hide();
		$game.$resources.submitAnswer();
		return false;
	}));
	$('.resourceArea .sureButton').on('click', (function (e) {
		e.preventDefault();
		$('.check').hide();
		$game.$resources.submitAnswer(true);
		return false;
	}));
	$('.resourceArea .retryButton').on('click', (function (e) {
		e.preventDefault();
		$('.check').fadeOut();
		return false;
	}));

	$('.gnomeArea a i, .gnomeArea .closeButton').on('click', (function (e) {
		e.preventDefault();
		$game.$gnome.hideResource();
		return false;
	}));
	$('.gnomeArea .nextButton').on('click', (function () {
		$game.$gnome.nextSlide();
	}));
	$('.gnomeArea .backButton').on('click', (function () {
		$game.$gnome.previousSlide();
	}));
	$('.gnomeArea .answerButton').on('click', (function (e) {
		e.preventDefault();
		$game.$gnome.submitAnswer();
		return false;
	}));

	$('.gnomeArea .clearBoardButton').on('click', (function (e) {
		e.preventDefault();
		$game.$gnome.clearBoard();
		return false;
	}));

	$('.progressArea a i').on('click', (function (e) {
		e.preventDefault();
		$('.progressButton').removeClass('currentButton');
		_progressArea.fadeOut(function() {
			$game.showingProgress = false;
			$game.changeStatus();
		});
		return false;
	}));

	$('.activePlayers').click(function() {
		$('#minimapPlayer').toggleClass('hide');
	});

	$('.progressButton').on('click', function() {

		if($game.showingProgress) {
			$(this).toggleClass('currentButton');
			_progressArea.fadeOut(function() {
				$game.showingProgress = false;
				$game.changeStatus();
			});
		}
		else {
			var goAhead = startNewAction();
			if(goAhead) {
				$(this).toggleClass('currentButton');
				$game.showProgress();
				$game.changeStatus('game progress and leaderboard');
			}
		}
	});
	$('.muteButton').on('click', function() {
		var musicOff = $game.$audio.toggleMute();

		if(musicOff) {
			$('.muteButton i').removeClass('icon-volume-up').addClass('icon-volume-off');
		}
		else {
			$('.muteButton i').removeClass('icon-volume-off').addClass('icon-volume-up');
		}
	});

	$('.helpButton').on('click', function() {
		_helpShowing = !_helpShowing;
		$(this).toggleClass('currentButton');
		$('.helpArea').fadeToggle();
	});
	$('.helpArea a i').on('click', function() {
		$('.helpButton').toggleClass('currentButton');
		$('.helpArea').fadeOut('fast', function() {
			_helpShowing = false;
		});
	});
	$('.globalHud > div > i, .playerHud > div > i, .seedventory > div > i').on('mouseenter',function() {
		var info = $(this).attr('title');
		$(this).tooltip('show');
	});

	$('body').on('click', '.publicButton', function() {
		$game.$player.makePublic($(this).attr('data-npc'));
	});
	$('body').on('click', '.privateButton', function() {
		$game.$player.makePrivate($(this).attr('data-npc'));
	});
	$('body').on('click', '.pledgeButton', function() {
		var info = {
				id: $(this).attr('data-player'),
				npc: $(this).attr('data-npc')
			};

		if($game.$player.game.pledges > 0) {
			ss.rpc('game.player.pledgeSeed', info, function(r) {
				$game.$player.game.pledges -= 1;
				clearTimeout(_pledgeFeedbackTimeout);
				$('.resourceArea .feedback').text('Thanks! (they will say). You can seed ' + $game.$player.game.pledges + ' more answers this level.').show();
				_pledgeFeedbackTimeout = setTimeout(function() {
					$('.resourceArea .feedback').fadeOut();
				}, 3000);
			});
		}
		else {
			clearTimeout(_pledgeFeedbackTimeout);
			$('.resourceArea .feedback').text('You cannot seed any more answers this level.').show();
			_pledgeFeedbackTimeout = setTimeout(function() {
				$('.resourceArea .feedback').fadeOut();
			}, 3000);
		}
	});
	$('body').on('click', '.collectedButton', function() {
		$('.collectedResources').show();
	});
	$('body').on('click', '.collectedResources .backToProgress', function() {
		$('.collectedResources').hide();
	});

	var startNewAction = function() {
		//check all the game states (if windows are open ,in transit, etc.) to begin a new action
		if(!$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && !$game.$player.inventoryShowing && !$game.showingProgress  &&  !$game.$player.seedventoryShowing && $game.running && !$game.$gnome.isChat && !_helpShowing){
			return true;
		}
		return false;
	};
});

function leaveThisJoint() {
	if(sessionStorage.isPlaying === 'true') {
		$game.$player.exitAndSave(function() {
			console.log('exit');
		});
	}
}