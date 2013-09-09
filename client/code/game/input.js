var $chatText,
	$chatBox,
	$displayBox,
	$inventory,
	$displayBoxText,
	$progressArea,
	$gameLog,
	_helpShowing,
	_logShowing,
	_pledgeFeedbackTimeout;

var $input = module.exports = {

	registerVariables: function() {
		$chatText = $('#chatText');
		$chatBox = $('.chatBox');
		$displayBox = $('.displayBox');
		$inventory = $('.inventory');
		$displayBoxText = $('.displayBoxText');
		$progressArea = $('.progressArea');
		$gameLog = $('.gameLog');
		_helpShowing = false;
		_logShowing = false;
		_pledgeFeedbackTimeout = null;
	},

	init: function() {

		//show / hide the seed inventory, start blinking
		$BODY.on('click', '.seedButton', function () {
			var goAhead = startNewAction();
			if(goAhead) {
				//this mean seedventory is DOWN
				//the user clicked meaning they want to open or end seed mode
				//END seed mode
				if($game.$player.seedMode) {
					$BODY.off('mousedown touchend', '.gameboard');
					$BODY.off('mouseup touchend', '.gameboard');
					$('.graffiti').hide();
					$game.$mouse.drawMode = false;
					$game.$player.seedMode = false;
					$game.$player.seedPlanting = false;
					$game.$player.resetRenderColor();
					$(this).removeClass('currentButton');
					$game.$player.saveMapImage();
					$game.$player.saveSeeds();
				}
				else {
					//open it up OR turn it on
					$game.$player.openSeedventory();
				}
			}
			else {
				//if it is UP, then we want to clsoe it and turn it off
				if($game.$player.seedventoryShowing) {
					$BODY.off('mousedown touchend', '.gameboard');
					$BODY.off('mouseup touchend', '.gameboard');
					$game.$mouse.drawMode = false;
					$('.seedventory').slideUp(function() {
						$game.$player.seedventoryShowing = false;
					});
				}
				else {
					$BODY.off('mousedown touchend', '.gameboard');
					$BODY.off('mouseup touchend', '.gameboard');
					$game.$mouse.drawMode = false;
					$game.$player.seedPlanting = false;
				}
				$('.graffiti').hide();
				$(this).removeClass('currentButton');
				$game.$player.saveMapImage();
			}
		});

		//regular seed select
		$BODY.on('click', '.regularButton', function () {
			$game.$player.startSeeding('regular');
		});

		//draw seed select
		$BODY.on('click', '.drawButton', function () {
			$game.$player.startSeeding('draw');
			$BODY.on('mousedown touchstart', '.gameboard', function() {
				$game.$player.drawFirstSeed();
				$game.$mouse.drawMode = true;
			});
			$BODY.on('mouseup touchend', '.gameboard', function() {
				$game.$mouse.drawMode = false;
			});
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

		//decide what to do based on generic mouse click
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

		//send a chat message, pulled from chat field
		$BODY.on('click', '#chatButton', function (e) {
			e.preventDefault();
			var sentence = $chatText.val(),
				data = {
					msg: $game.checkPotty(sentence),
					name: $game.$player.firstName,
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
			return false;
		});

		//open the game log
		$BODY.on('click', '.logButton', function () {
			var goAhead = startNewAction();
			if(goAhead || _logShowing) {
				_logShowing = !_logShowing;
				$('.logButton').toggleClass('currentButton');
				$gameLog.fadeToggle();
				$gameLog.scrollTop($gameLog[0].scrollHeight);
				$game.$log.clearUnread();
			}
			return false;
		});

		//show / hide the inventory
		$BODY.on('click', '.inventoryButton, .inventory button', function () {
			var goAhead = startNewAction();
			if(goAhead || $game.$player.inventoryShowing) {
			// if($game.startNewAction) {
				if($game.$player.inventoryShowing) {
					$inventory.slideUp(function() {
						$game.$player.inventoryShowing = false;
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

		//close the resource area
		$BODY.on('click', '.resourceArea a i, .resourceArea .closeButton', function (e) {
			e.preventDefault();
			if(!$game.$resources.waitingForTagline) {
				$('.check').hide();
				$game.$resources.hideResource();
			} else {
				$('.checkTagline').show().delay(2000).fadeOut();
			}
			return false;
		});

		//advance the content in resource to next page
		$BODY.on('click', '.resourceArea .nextButton', function () {
			$('.check').hide();
			$game.$resources.nextSlide();
		});

		//previous page of content in resource
		$BODY.on('click', '.resourceArea .backButton', function () {
			$('.check').hide();
			$game.$resources.previousSlide();
		});

		//previous page of content in resource
		$BODY.on('click', '.resourceArea .saveButton', function () {
			var tagline = $('.customTagline').val();
			$game.$resources.saveTagline(tagline);
		});

		//submit answer in resource
		$BODY.on('click', '.resourceArea .answerButton, .resourceArea .sureButton', function (e) {
			e.preventDefault();
			$('.check').hide();
			$game.$resources.submitAnswer();
			return false;
		});

		//acknowledge prompt that your answer is skimpy in resource
		$BODY.on('click', '.resourceArea .sureButton', function (e) {
			e.preventDefault();
			$('.check').hide();
			$game.$resources.submitAnswer(true);
			return false;
		});

		//cancel submit in resource
		$BODY.on('click', '.resourceArea .retryButton', function (e) {
			e.preventDefault();
			$('.check').fadeOut();
			return false;
		});

		//close botanist window
		$BODY.on('click', '.botanistArea a i, .botanistArea .closeButton', function (e) {
			e.preventDefault();
			$game.$botanist.hideResource();
			return false;
		});

		//advance to next content in botanist area
		$BODY.on('click', '.botanistArea .nextButton', function (e) {
			$game.$botanist.nextSlide();
		});

		//previous content in botanist area
		$BODY.on('click', '.botanistArea .backButton', function (e) {
			$game.$botanist.previousSlide();
		});

		//submit tangram answer in botanist area
		$BODY.on('click', '.botanistArea .answerButton', function (e) {
			e.preventDefault();
			$game.$botanist.submitAnswer();
			return false;
		});

		//clear all the pieces in botanist area off tangram board
		$BODY.on('click', '.botanistArea .clearBoardButton', function (e) {
			e.preventDefault();
			$game.$botanist.clearBoard();
			return false;
		});

		//close progress area
		$BODY.on('click', '.progressArea a i', function (e) {
			e.preventDefault();
			$('.progressButton').removeClass('currentButton');
			$progressArea.fadeOut(function() {
				$game.showingProgress = false;
			});
			return false;
		});

		//toggle minimap
		$BODY.on('click', '.activePlayers', function () {
			$('#minimapPlayer').toggleClass('hide');
		});

		//open or close progress area
		$BODY.on('click', '.progressButton', function () {
			if($game.showingProgress) {
				$(this).toggleClass('currentButton');
				$progressArea.fadeOut(function() {
					$game.showingProgress = false;
				});
			}
			else {
				var goAhead = startNewAction();
				if(goAhead) {
					$(this).toggleClass('currentButton');
					$game.showProgress();
				}
			}
		});

		//toggle audio on/off
		$BODY.on('click', '.muteButton', function () {
			var musicOff = $game.$audio.toggleMute();
			if(musicOff) {
				$('.muteButton i').removeClass('icon-volume-up').addClass('icon-volume-off');
			}
			else {
				$('.muteButton i').removeClass('icon-volume-off').addClass('icon-volume-up');
			}
		});

		//show or hide help area
		$BODY.on('click', '.helpButton', function () {
			_helpShowing = !_helpShowing;
			$('.helpArea').fadeToggle();
			$('.helpButton').toggleClass('currentButton');
		});

		//close help area
		$BODY.on('click', '.helpArea a i', function (e) {
			e.preventDefault();
			$('.helpButton').toggleClass('currentButton');
			$('.helpArea').fadeOut('fast', function() {
				_helpShowing = false;
			});
			return false;
		});

		//tooltip for HUD controls
		$BODY.on('mouseenter', '.globalHud > div > i, .playerHud > div > i, .seedventory > div > i', function () {
			var info = $(this).attr('title');
			$(this).tooltip('show');
		});

		//make your comment public
		$BODY.on('click', '.publicButton', function() {
			$game.$player.makePublic($(this).attr('data-npc'));
		});

		//make your comment private
		$BODY.on('click', '.privateButton', function() {
			$game.$player.makePrivate($(this).attr('data-npc'));
		});

		//pledge a seed to a comment
		$BODY.on('click', '.pledgeButton', function() {
			var info = {
				id: $(this).attr('data-player'),
				pledger: $game.$player.firstName,
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

		//view all player resource answers
		$BODY.on('click', '.collectedButton', function() {
			$('.collectedResources').show();
		});

		//go back to progress menu from player resource answers
		$BODY.on('click', '.collectedResources .backToProgress', function() {
			$('.collectedResources').hide();
		});

		$BODY.on('click', '.bossArea .bossButton', function () {
			$game.$boss.nextSlide();
		});

		$BODY.on('click', '.tabbable li a', function(e) {
			e.preventDefault();
			return false;
		});
		//pause menu if we want it
		// $WINDOW.blur(function(e) {
		// 	if(!$game.$npc.isResource) {
		// 		//$game.pause();
		// 	}	
		// });

		// $('.unPause').click(function () {
		// 	$game.resume();
		// });

		//decide if we should or should not let buttons be clicked based on state
		var startNewAction = function() {
			//check all the game states (if windows are open ,in transit, etc.) to begin a new action
			if(!$game.inTransit && !$game.$player.isMoving && !$game.$resources.isShowing && !$game.$player.inventoryShowing && !$game.showingProgress  &&  !$game.$player.seedventoryShowing && $game.running && !$game.$botanist.isChat && !_helpShowing && !_logShowing && !$game.$boss.isShowing){
				return true;
			}
			return false;
		};

	}

};