'use strict';

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

var $input = $game.$input = module.exports = {

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

		$BODY.on('click', '.skinventoryButton', function () {
			var goAhead = startNewAction();
			if(goAhead) {
				$game.showingSkinventory = true;
				$('.skinventory').show();
			} else if($game.showingSkinventory) {
				$('.skinventory').hide();
				$game.showingSkinventory = false;
			}
		});

		//change cursor on mouse move
		$BODY.on('mousemove', '.gameboard', function(e) {
			if( !$game.inTransit && $game.running){
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
			// Check for cheat codes
      if ($game.$input.cheat(data.msg) === false) {
        ss.rpc('game.chat.sendMessage', data, function(r) {
          //nothing here...
        });
			} 
			$chatText.val('');
			return false;
		});

		//open the game log
		$BODY.on('click', '.logButton', function () {
			var h = $(window).height();
			$('html, body').stop().animate({
            	scrollTop: h
        	}, 250);
        		$game.$log.clearUnread();
			// var goAhead = startNewAction();
			// if(goAhead || _logShowing) {
			// 	_logShowing = !_logShowing;
			// 	$('.logButton').toggleClass('currentButton');
			// 	$gameLog.fadeToggle();
			// 	$gameLog.scrollTop($gameLog[0].scrollHeight);
			// 	$game.$log.clearUnread();
			// }
			// return false;
		});

		$BODY.on('click', '.gameLog', function() {
			$game.$log.clearUnread();
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
			$progressArea.hide();
			$game.showingProgress = false;
			return false;
		});

		//toggle minimap
		// $BODY.on('click', '.activePlayers', function () {
		// 	$('#minimapPlayer').toggleClass('hide');
		// });

		//open or close progress area
		$BODY.on('click', '.progressButton', function () {
			if($game.showingProgress) {
				$(this).toggleClass('currentButton');
				$progressArea.hide();
				$game.showingProgress = false;
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
      $input.toggleHelp()
		});

		//close help area
		$BODY.on('click', '.helpArea a i', function (e) {
      e.preventDefault()
      $input.closeHelp()
      return false
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

		$BODY.on('click', '.outer', function () {
			var locked = $(this).find('i').hasClass('locked');
			if(!locked) {
				var parent = $(this).parent();
				$(parent).children().removeClass('currentPart');
				$(this).addClass('currentPart');

				var part = $(parent).attr('data-part');
				var child = $(this).children().first(),
					name = $(child).attr('data-name');
				$game.$player.setSkinSuit(part, name);
			}
		});

		$BODY.on('click', '.skinventory .closeButton', function (e) {
			e.preventDefault();
			$('.skinventory').hide();
			$game.showingSkinventory = false;
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
			// console.log(!$game.inTransit, !$game.$player.isMoving, !$game.$resources.isShowing, !$game.$player.inventoryShowing, !$game.showingProgress ,  !$game.$player.seedventoryShowing, $game.running, !$game.$botanist.isChat, !_helpShowing, !_logShowing, !$game.$boss.isShowing);
			// !$game.$player.inventoryShowing
			return (
        !$game.inTransit &&
        !$game.$player.isMoving &&
        !$game.$resources.isShowing &&
        !$game.showingProgress &&
        !$game.$player.seedventoryShowing &&
        $game.running &&
        !$game.$botanist.isChat &&
        !_helpShowing &&
        !_logShowing &&
        !$game.$boss.isShowing &&
        !$game.showingSkinventory
      ) ? true : false
		};

    // Keybindings for actions
    $BODY.keydown(function (e) {

      // Allow keyboard inputs only when gameboard is active.
      if (!startNewAction()) return

      // Refuse inputs if Ctrl or Command is pressed so that the game doesn't overwrite other system/client command keys
      // This does not cover the 'fn' or 'option'/'alt' keys (should it?)
      if (e.ctrlKey === true || e.metaKey === true) return
      // Refuse inputs if a form input has focus

      // Attach keys to actions
//      e.preventDefault()
      $game.alert(e.which)
      switch (e.which) {
        // WASD or arrow key movement controls.
        case 87:  // 'w' 
        case 38:  // 'up arrow', 'numpad 2' (numlock on)
        case 104: // 'numpad 2' (numlock off)
        case 56:  // 'numpad 2' (numlock off/opera)
          // Move player character up.
          e.preventDefault()
          $game.alert('Move up')
          break
        case 65:  // 'a'
        case 37:  // 'left arrow', 'numpad 4'
        case 100: // 'numpad 4' (numlock off)
        case 52:  // 'numpad 4' (numlock off/opera)
          // Move player character to the left.
          e.preventDefault()
          $game.alert('Move left')
          break
        case 83:  // 'a'
        case 40:  // 'down arrow', 'numpad 8'
        case 98:  // 'numpad 8' (numlock off)
        case 50:  // 'numpad 8' (numlock off/opera)
          // Move player character down.
          e.preventDefault()
          $game.alert('Move down')
          break
        case 68:  // 'd'
        case 39:  // 'right arrow', 'numpad 6'
        case 102: // 'numpad 6' (numlock off)
        case 54:  // 'numpad 6' (numlock off/opera)
          // Move player character to the right.
          e.preventDefault()
          $game.alert('Move right')
          break
        // Chat
        case 84:  // 't'
        case 13:  // 'enter'
          // Focus chat input field.
          $input.focusChatInput()
          break
        // Display overlays
        case 73:  // 'i'
          // Display inventory overlay.
          $game.alert('Show inventory')
          break
        case 77:  // 'm'
          // Toggles minimap.
          $input.toggleMinimap()
          break
        case 67:  // 'c'
          // Changing room
          $game.alert('Changing room')
          break
        // Seedventory
        case 80: // 'p'
          // Progress
          $game.alert('Progress')
          break
        case 72:  // 'h'
        case 191: // 'question mark'
          // Help
          $input.toggleHelp()
          break
        // Cancels any current action and returns to default gameboard view
        case 27:  // 'escape'
          // Close any overlays
          // Removes focus from chat
          // Sets cursor to walk action
          break
        // Default switch, no action.
        default:
          break
      }
    })
  },

  focusChatInput: function () {
    $chatText.focus()
  },

  toggleMinimap: function () {
    $('#minimapPlayer').toggleClass('hide')
  },

  toggleHelp: function () {
    _helpShowing = !_helpShowing
    $('.helpButton').toggleClass('currentButton')
    $('.helpArea').toggle()
  },

  closeHelp: function () {
    _helpShowing = false
    $('.helpButton').removeClass('currentButton')
    $('.helpArea').hide()
  },

  cheat: function (input) {
    switch (input.toLowerCase()) {
      case 'beam me up scotty':
      case 'beam me up, Scotty!':   // Legacy cheat with punctuation
        $game.$input._cheatActivated('Teleporting to botanist.')
        $game.$player.beamMeUpScotty()
        break
      case 'show me the money':
        $game.$input._cheatActivated('Adding 500 seeds.')
        $game.$player.updateSeeds('regular', 500)
        break
      case 'ding me':
        $game.$input._cheatActivated('Leveling up!')
        $game.$player.nextLevel()
        break
      case 'suit alors':
        $game.$input._cheatActivated('All suits unlocked!')
        for (var skin in $game.playerSkins) {
          $game.$player.updateSkinventory(skin)
        }
        break
      case 'kazaam':
        $game.$input._cheatActivated('Starting collaborative challenge.')
        ss.rpc('game.player.collaborativeChallenge', function (err) {
          //nothing here...
          if (err) {
            $game.log('Whoops: you came alone, you get no bone(us).')
          }
        });
        break
      default:
        return false
    }
  },

  _cheatActivated: function (message) {
    var cheatMessage = '<span class="color-lightpurple">[Cheat code activated]</span>'
    $game.log(cheatMessage + ' ' + message)
  },

	resetInit: function() {
		_helpShowing = null;
		_logShowing = null;
		_pledgeFeedbackTimeout = null;
	}

};