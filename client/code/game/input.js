'use strict';

var $chatText,
	$chatBox,
	$inventory,
	$progressArea,
	$gameLog,
	_helpShowing,
	_logShowing,
	_pledgeFeedbackTimeout;

var $input = $game.$input = module.exports = {

	registerVariables: function() {
		$chatText = $('#chatText');
		$chatBox = $('.chatBox');
		$inventory = $('.inventory');
		$progressArea = $('.progressArea');
		$gameLog = $('.gameLog');
		_helpShowing = false;
		_logShowing = false;
		_pledgeFeedbackTimeout = null;
	},

	init: function() {

    // ************* GENERIC GAMEBOARD INTERACTION *************

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

    // ************* MENU OVERLAYS *************

    // Toggle display of Changing Room (skinventory)
		$BODY.on('click', '.skinventoryButton', function () {
      $input.toggleSkinventory()
		});

    // Toggle display of Progress window
    $BODY.on('click', '.progressButton', function () {
      $input.toggleProgress()
    });

    // Close Progress window
    $BODY.on('click', '.progressArea a i', function (e) {
      e.preventDefault()
      $input.closeProgress()
      return false
    });

    // Toggle display of Help window
    $BODY.on('click', '.helpButton', function () {
      $input.toggleHelp()
    })

    // Close Help window
    $BODY.on('click', '.helpArea a i', function (e) {
      e.preventDefault()
      $input.closeHelp()
      return false
    })


    // ************* INVENTORY OVERLAYS *************

    //show / hide the inventory
    $BODY.on('click', '.inventoryButton, .inventory button', function () {
      var goAhead = startNewAction();
      if(goAhead || $game.$player.inventoryShowing) {
        $input.toggleInventory()
      }
      return false;
    });

    //show / hide the seed inventory, start blinking
    $BODY.on('click', '.seedButton', function () {
      var goAhead = startNewAction();
      if(goAhead) {
        $input.toggleSeedMode()
      }
    });

    //regular seed select
    $BODY.on('click', '.regularButton', function () {
      // Not particularly scalable but works so far for 2 seeds
      $('.drawButton').removeClass('selected')
      $('.regularButton').addClass('selected')

      $game.$player.startSeeding('regular');
    });

    //draw seed select
    $BODY.on('click', '.drawButton', function () {
      $('.regularButton').removeClass('selected')
      $('.drawButton').addClass('selected')

      $game.$player.startSeeding('draw');
      $BODY.on('mousedown touchstart', '.gameboard', function() {
        $game.$player.drawFirstSeed();
        $game.$mouse.drawMode = true;
      });
      $BODY.on('mouseup touchend', '.gameboard', function() {
        $game.$mouse.drawMode = false;
      });
    });

    // ************* PROGRESS WINDOW INTERACTIONS *************

    //view all player resource answers
    $BODY.on('click', '.collectedButton', function() {
      $('.collectedResources').show();
    });

    //go back to progress menu from player resource answers
    $BODY.on('click', '.collectedResources .backToProgress', function() {
      $('.collectedResources').hide();
    });

    // ************* RESOURCE WINDOW INTERACTIONS *************

    // ************* SKINVENTORY WINDOW INTERACTIONS *************

    $BODY.on('click', '.skinventory .outer', function () {
      if(!$(this).hasClass('locked')) {
        var part = $(this).parent().data('part')
        var name = $(this).data('name')

        // Set highlight class
        $(this).parent().children().removeClass('equipped')
        $(this).addClass('equipped')

        // Set suit
        $game.$player.setSkinSuit(name, part)
      }
    })

    $BODY.on('click', '.skinventory .closeButton', function (e) {
      e.preventDefault()
      $input.closeSkinventory()
      return false
    });

    // ************* OTHER GAMEBOARD HUD ELEMENTS *************

    $BODY.on('click', '.speechBubble', function (e) {
      // Prevent clicking on speech bubble from interacting with gameboard below
      e.stopImmediatePropagation()
    })

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
			// 	$('.logButton').toggleClass('hud-button-active');
			// 	$gameLog.fadeToggle();
			// 	$gameLog.scrollTop($gameLog[0].scrollHeight);
			// 	$game.$log.clearUnread();
			// }
			// return false;
		});

		$BODY.on('click', '.gameLog', function() {
			$game.$log.clearUnread();
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
		$BODY.on('click', '.resourceArea .answerButton', function (e) {
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
			$('.check').fadeOut(100);
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

		//toggle audio on/off
		$BODY.on('click', '.muteButton', function () {
      $input.toggleMute()
		});

		//tooltip for HUD controls
		$BODY.on('mouseenter', '.hud-button a', function () {
			var info = $(this).attr('title');
			$(this).tooltip('show');
		});

		//make your comment public
		$BODY.on('click', '.publicButton button', function() {
			$game.$player.makePublic($(this).attr('data-npc'));
		});

		//make your comment private
		$BODY.on('click', '.privateButton button', function() {
			$game.$player.makePrivate($(this).attr('data-npc'));
		});

		//pledge a seed to a comment
		$BODY.on('click', '.pledgeButton button', function() {
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

		$BODY.on('click', '.bossArea .bossButton', function () {
			$game.$boss.nextSlide();
		});

		$BODY.on('click', '.tabbable li a', function(e) {
			e.preventDefault();
			return false;
		});

    // When player clicks a highlighted HUD button, remove the highlight
    $BODY.on('click', '.hud-button-highlight', function () {
      $game.unhighlightUI(this)
    })

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

    var acceptKeyInput = function () {
      return (!$('input, textarea').is(':focus')) ? true : false
    }

    // Keybindings for actions
    $BODY.keydown(function (e) {
      // If escape is pressed, cancels  any current action and returns to default gameboard view
      if (e.which === 27) {
        // Close any overlays
        $input.closeInventory()
        $input.closeProgress()
        $input.closeHelp()
        $input.endSeedMode()

        // Unfocus chat input box
        if ($chatText.is(':focus')) {
          $chatText.blur()
        }

        // Sets cursor to walk action
      }

      // Allow keyboard inputs only when gameboard is active.
      if (!startNewAction()) return
      if (!acceptKeyInput()) return

      // Refuse inputs if Ctrl or Command is pressed so that the game doesn't overwrite other system/client command keys
      // This does not cover Mac's fn' key
      if (e.ctrlKey === true || e.metaKey === true || e.altKey === true) return

      // Attach keys to actions
      switch (e.which) {
        // **** MOVEMENT ****
        // Each movement event has .preventDefault() to prevent it from scrolling browser window
        case 87:  // 'w'
        case 38:  // 'up arrow', 'numpad 2' (numlock on)
        case 104: // 'numpad 2' (numlock off)
        case 56:  // 'numpad 2' (numlock off/opera)
          // Move player character up.
          e.preventDefault()
          $input.moveUp()
          break
        case 65:  // 'a'
        case 37:  // 'left arrow', 'numpad 4'
        case 100: // 'numpad 4' (numlock off)
        case 52:  // 'numpad 4' (numlock off/opera)
          // Move player character to the left.
          e.preventDefault()
          $input.moveLeft()
          break
        case 83:  // 'a'
        case 40:  // 'down arrow', 'numpad 8'
        case 98:  // 'numpad 8' (numlock off)
        case 50:  // 'numpad 8' (numlock off/opera)
          // Move player character down.
          e.preventDefault()
          $input.moveDown()
          break
        case 68:  // 'd'
        case 39:  // 'right arrow', 'numpad 6'
        case 102: // 'numpad 6' (numlock off)
        case 54:  // 'numpad 6' (numlock off/opera)
          // Move player character to the right.
          e.preventDefault()
          $input.moveRight()
          break
        // **** CHAT ****
        case 84:  // 't'
        case 13:  // 'enter'
          // Focus chat input field.
          e.preventDefault() // prevent 't' from appearing in the input.
          $input.focusChatInput()
          break
        // **** DISPLAY HUD OVERLAYS & WINDOWS ****
        case 73:  // 'i'
          // Display inventory overlay.
          $input.toggleInventory()
          break
        case 69:  // 'e'
          // Seedventory
          $input.toggleSeedMode()
          break
        case 77:  // 'm'
          // Toggles minimap.
          $input.toggleMinimap()
          break
        case 67:  // 'c'
          // Changing room
          $input.toggleSkinventory()
          break
        case 80:  // 'p'
          // Progress
          $input.toggleProgress()
          break
        case 86:  // 'v'
          // Mute audio
          $input.toggleMute()
          break
        case 72:  // 'h'
        case 191: // 'question mark'
          // Help
          $input.toggleHelp()
          break
        // Default switch: all other key presses, no action.
        default:
          break
      }
    })
  },

  // Wrapper functions for inputs and interactions
  moveUp: function () {
    $game.$player.moveUp()
  },

  moveDown: function () {
    $game.$player.moveDown()
  },

  moveLeft: function () {
    $game.$player.moveLeft()
  },

  moveRight: function () {
    $game.$player.moveRight()
  },

  focusChatInput: function () {
    $chatText.focus()
  },

  toggleMinimap: function () {
    $('#minimapPlayer').toggleClass('hide')
  },

  toggleSeedMode: function () {
    if ($game.$player.seedMode !== false) {
      $input.endSeedMode()
    }
    else {
      $input.startSeedMode()
    }
  },

  startSeedMode: function () {
    $game.$player.seedMode = true
    $('.hud .seedButton').addClass('hud-button-active')
    $input.openSeedventory()
  },

  endSeedMode: function () {
    $game.$player.seedMode = false
    if($game.$player.seedventoryShowing) {
      $input.closeSeedventory()
    }
    $BODY.off('mousedown touchend', '.gameboard');
    $BODY.off('mouseup touchend', '.gameboard');
    $('.graffiti').hide();
    $game.$mouse.drawMode = false;
    $game.$player.seedPlanting = false;
    $game.$player.resetRenderColor();
    $('.hud .seedButton').removeClass('hud-button-active')

    $game.$player.saveMapImage();
    $game.$player.saveSeeds();
  },

  openSeedventory: function () {
    // The logic for this is in another controller!
    $game.$player.openSeedventory()

    // That should be separated into startSeedMode() or openSeedventory()
  },

  closeSeedventory: function () {
    $('.seedventory').slideUp(function() {
      $game.$player.seedventoryShowing = false;
    })
  },

  toggleInventory: function () {
    if($game.$player.inventoryShowing) {
      $input.closeInventory()
    }
    else {
      $input.openInventory()
    }
  },

  openInventory: function () {
    $('.inventoryButton').addClass('hud-button-active')
    $game.$player.inventoryShowing = true
    $inventory.slideDown(function () {
      if ($game.$player.getInventoryLength() > 0) {
        $game.alert('click items to view again')
      }
    })
  },

  closeInventory: function () {
    $inventory.slideUp(function () {
      $game.$player.inventoryShowing = false
      $('.inventoryButton').removeClass('hud-button-active')
    })
  },

  toggleSkinventory: function () {
    $game.showingSkinventory = !$game.showingSkinventory
    $('.skinventoryButton').toggleClass('hud-button-active')
    $('.skinventory').toggle()

    // Resets badge count - lame that it happens here
    if ($game.showingSkinventory === true) {
      $game.setBadgeCount('.skinventoryButton', 0)
    }
  },

  closeSkinventory: function () {
    $game.showingSkinventory = false
    $('.skinventoryButton').removeClass('hud-button-active')
    $('.skinventory').hide()
  },

  toggleProgress: function () {
    $game.showingProgress = !$game.showingProgress
    if ($game.showingProgress) {
      $game.showProgress()
    }
    $('.progressButton').toggleClass('hud-button-active')
    $progressArea.toggle()
  },

  closeProgress: function () {
    $game.showingProgress = false
    $('.progressButton').removeClass('hud-button-active')
    $progressArea.hide()
  },

  toggleHelp: function () {
    _helpShowing = !_helpShowing
    $('.helpButton').toggleClass('hud-button-active')
    $('.helpArea').toggle()
  },

  closeHelp: function () {
    _helpShowing = false
    $('.helpButton').removeClass('hud-button-active')
    $('.helpArea').hide()
  },

  toggleMute: function () {
    return ($game.$audio.toggleMute() === true) ? $input.muteAudio() : $input.unmuteAudio()
  },

  muteAudio: function () {
    $('.muteButton i').removeClass('fa fa-volume-up').addClass('fa fa-volume-off')
  },

  unmuteAudio: function () {
    $('.muteButton i').removeClass('fa fa-volume-off').addClass('fa fa-volume-up')
  },

  cheat: function (input) {
    switch (input.toLowerCase()) {
      case 'beam me up scotty':
      case 'beam me up, Scotty!':   // Legacy cheat with punctuation
        $game.$input._cheatActivated('Teleporting to botanist.')
        $game.$player.beamMeUpScotty()
        break
      case 'show me the money':
        $game.$input._cheatActivated('Adding 200 seeds.')
        $game.$player.addSeeds('regular', 200)
        break
      case 'like one of your french girls':
        $game.$input._cheatActivated('Adding 200 paint seeds.')
        $game.$player.addSeeds('draw', 200)
        break
      case 'loki':
        $game.$input._cheatActivated('Debug seed amount.')
        $game.$player.setSeeds('regular', 0)
        $game.$player.setSeeds('draw', 3)
        break
      case 'ding me':
        $game.$input._cheatActivated('Leveling up!')
        $game.$player.nextLevel()
        break
      case 'suit alors':
        $game.$input._cheatActivated('All suits unlocked!')
        for (var skin in $game.$skins.data) {
          $game.$skins.unlockSkin(skin)
        }
        break
      case 'birthday suit':
        $game.$input._cheatActivated('All suits removed!')
        $game.$skins.resetSkinventory()
        break
      case 'pleasantville':
        $game.$input._cheatActivated('Welcome to Pleasantville!')
        // Doesn't actually do anything
        break
      case 'brain dump':
        console.log($game)
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