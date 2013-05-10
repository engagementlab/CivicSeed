//events recevied by RPC
$(function() {
	var _w = $(window),
		$BODY = $('body');
		$chatText = $('#chatText'),
		$chatBox = $('.chatBox'),
		$displayBox = $('.displayBox'),
		$inventory = $('.inventory'),
		$displayBoxText = $('.displayBoxText'),
		$progressArea = $('.progressArea'),
		_helpShowing = false,
		_pledgeFeedbackTimeout = null;

	_w.on('beforeunload', function() {
		var x = leaveThisJoint();
		return x;
	});
		/********** BUTTON / MOUSE EVENTS **********/

	$BODY.on('click', '.seedButton', function () {
		//$game.$player.seedMode = $game.$player.seedMode ? false : true;
		var goAhead = startNewAction();
		if(goAhead) {
			//this mean seedventory is DOWN
			//the user clicked meaning they want to open or end seed mode
			//END seed mode
			if($game.$player.seedMode > 0) {
				$game.$player.seedMode = 0;
				$game.$player.seedPlanting = false;
				$game.$player.resetRenderColor();
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

	$BODY.on('click', '.normalButton', function () {
		$game.$player.startSeeding(1);
	});

	$BODY.on('click', '.riddleButton', function () {
		$game.$player.startSeeding(2);
	});

	$BODY.on('click', '.specialButton', function () {
		$game.$player.startSeeding(3);
	});

	//change cursor on mouse move
	$BODY.on('mousemove', '.gameboard', function(e) {
		if( !$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && $game.running){
			var mInfo = {
				x: e.pageX,
				y: e.pageY,
				offX: this.offsetLeft,
				offY: this.offsetTop,
				debug: false
			};
			$game.$mouse.updateMouse(mInfo, false);
		}
	});

	//figure out if we shoupdatuld transition (or do other stuff later)
	$BODY.on('click', '.gameboard', function (e) {
		var goAhead = startNewAction();
		if(goAhead) {
				var mInfo = {
				x: e.pageX,
				y: e.pageY,
				offX: this.offsetLeft,
				offY: this.offsetTop,
				debug: true
			};
			$game.$mouse.updateMouse(mInfo,true);
		}
	});

	//send whatever is in the chat field
	$BODY.on('click', '#chatButton', function (e) {
		e.preventDefault();
		if(!$game.$npc.isResource && !$game.inTransit && !$game.$player.isMoving) {
			var sentence = $chatText.val();
			var data = {
				msg: $game.checkPotty(sentence),
				name: $game.$player.name,
				id: $game.$player.id,
				log: sentence,
				instanceName: $game.$player.instanceName
			};
			$game.$audio.playTriggerFx('chatSend');
			if(data.msg.indexOf('beam me up, Scotty!') > -1) {
				$game.$player.beamMeUpScotty();
			} else {
				ss.rpc('game.chat.sendMessage', data, function(r) {
					//nothing here...
				});
			}
			$chatText.val('');
		}
		return false;
	});

	$BODY.on('click', '.chatButton', function () {
		$('.chatButton').toggleClass('currentButton');
		$chatBox.toggleClass('hide');
		$displayBox.toggleClass('hide');
		return false;
	});

	$BODY.on('click', '.inventoryButton, .inventory button', function () {
		if(!$game.$resources.isShowing && !$game.$player.seedventoryShowing && !$game.$botanist.isShowing) {
			if($game.$player.inventoryShowing) {
				$inventory.slideUp(function() {
					$game.$player.inventoryShowing = false;
					$game.changeStatus();
					$('.inventoryButton').removeClass('currentButton');
				});
			}
			else {
				$inventory.slideDown(function() {
					$game.$player.inventoryShowing = true;
					$displayBoxText.text('click items to view again');
					$('.inventoryButton').addClass('currentButton');
				});
			}
		}
		return false;
	});

	$BODY.on('click', '.resourceArea a i, .resourceArea .closeButton', function (e) {
		e.preventDefault();
		$('.check').hide();
		$game.$resources.hideResource();
		return false;
	});

	$BODY.on('click', '.resourceArea .nextButton', function () {
		$('.check').hide();
		$game.$resources.nextSlide();
	});

	$BODY.on('click', '.resourceArea .backButton', function () {
		$('.check').hide();
		$game.$resources.previousSlide();
	});

	$BODY.on('click', '.resourceArea .answerButton, .resourceArea .sureButton', function (e) {
		e.preventDefault();
		$('.check').hide();
		$game.$resources.submitAnswer();
		return false;
	});

	$BODY.on('click', '.resourceArea .sureButton', function (e) {
		e.preventDefault();
		$('.check').hide();
		$game.$resources.submitAnswer(true);
		return false;
	});

	$BODY.on('click', '.resourceArea .retryButton', function (e) {
		e.preventDefault();
		$('.check').fadeOut();
		return false;
	});

	$BODY.on('click', '.botanistArea a i, .botanistArea .closeButton', function (e) {
		e.preventDefault();
		$game.$botanist.hideResource();
		return false;
	});

	$BODY.on('click', '.botanistArea .nextButton', function (e) {
		$game.$botanist.nextSlide();
	});

	$BODY.on('click', '.botanistArea .backButton', function (e) {
		$game.$botanist.previousSlide();
	});

	$BODY.on('click', '.botanistArea .answerButton', function (e) {
		e.preventDefault();
		$game.$botanist.submitAnswer();
		return false;
	});

	$BODY.on('click', '.botanistArea .clearBoardButton', function (e) {
		e.preventDefault();
		$game.$botanist.clearBoard();
		return false;
	});

	$BODY.on('click', '.progressArea a i', function (e) {
		e.preventDefault();
		$('.progressButton').removeClass('currentButton');
		$progressArea.fadeOut(function() {
			$game.showingProgress = false;
			$game.changeStatus();
		});
		return false;
	});

	$BODY.on('click', '.activePlayers', function () {
		$('#minimapPlayer').toggleClass('hide');
	});

	$BODY.on('click', '.progressButton', function () {
		if($game.showingProgress) {
			$(this).toggleClass('currentButton');
			$progressArea.fadeOut(function() {
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

	$BODY.on('click', '.muteButton', function () {
		var musicOff = $game.$audio.toggleMute();
		if(musicOff) {
			$('.muteButton i').removeClass('icon-volume-up').addClass('icon-volume-off');
		}
		else {
			$('.muteButton i').removeClass('icon-volume-off').addClass('icon-volume-up');
		}
	});

	$BODY.on('click', '.helpButton', function () {
		_helpShowing = !_helpShowing;
		$(this).toggleClass('currentButton');
		$('.helpArea').fadeToggle();
	});

	$BODY.on('click', '.helpArea a i', function () {
		$('.helpButton').toggleClass('currentButton');
		$('.helpArea').fadeOut('fast', function() {
			_helpShowing = false;
		});
	});

	$BODY.on('mouseenter', '.globalHud > div > i, .playerHud > div > i, .seedventory > div > i', function () {
		var info = $(this).attr('title');
		$(this).tooltip('show');
	});

	$BODY.on('click', '.publicButton', function() {
		$game.$player.makePublic($(this).attr('data-npc'));
	});

	$BODY.on('click', '.privateButton', function() {
		$game.$player.makePrivate($(this).attr('data-npc'));
	});

	$BODY.on('click', '.pledgeButton', function() {
		var info = {
			id: $(this).attr('data-player'),
			npc: $(this).attr('data-npc')
		};
		var pledges = $game.$player.getPledges();
		if(pledges > 0) {
			ss.rpc('game.player.pledgeSeed', info, function(r) {
				$game.$player.updatePledges(-1);
				clearTimeout(_pledgeFeedbackTimeout);
				$('.resourceArea .feedback').text('Thanks! (they will say). You can seed ' + (pledges - 1) + ' more answers this level.').show();
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

	$BODY.on('click', '.collectedButton', function() {
		$('.collectedResources').show();
	});

	$BODY.on('click', '.collectedResources .backToProgress', function() {
		$('.collectedResources').hide();
	});

	//pause menu if we want it
	// _w.blur(function(e) {
	// 	if(!$game.$npc.isResource) {
	// 		//$game.pause();
	// 	}	
	// });

	// $('.unPause').click(function () {
	// 	$game.resume();
	// });

	var startNewAction = function() {
		//check all the game states (if windows are open ,in transit, etc.) to begin a new action
		if(!$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && !$game.$player.inventoryShowing && !$game.showingProgress  &&  !$game.$player.seedventoryShowing && $game.running && !$game.$botanist.isChat && !_helpShowing){
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