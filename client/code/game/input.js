'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    input.js

    - Handles on-screen buttons, HUD elements, generic gameboard
      interactions, keypresses, and codes/effects triggered in chat.
    - Also handles various UI interactions, like show / hide / toggle of
      overlays.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $input = $game.$input = module.exports = {

  init: function () {

    /* * * * * * * *       GENERIC GAMEBOARD INTERACTION       * * * * * * * */

    // Update cursor on mouse move
    $BODY.on('mousemove', '#gameboard', function (e) {
      if (!$game.checkFlag('in-transit') && $game.running) {
        $game.$mouse.onMove({
          event: e,
          x:     e.pageX,
          y:     e.pageY,
          offX:  this.offsetLeft,
          offY:  this.offsetTop
        })
      }
    })

    // Decide what to do on mouse click
    $BODY.on('click', '#gameboard', function (e) {
      if (_input.isNewActionAllowed() === true) {
        $game.$mouse.onClick({
          event: e,
          x:     e.pageX,
          y:     e.pageY,
          offX:  this.offsetLeft,
          offY:  this.offsetTop
        })
      }
    })

    /* * * * * * * *                HUD BUTTONS                * * * * * * * */

    // Toggle display of Inventory
    $BODY.on('click', '.hud-inventory, #inventory button', function () {
      $input.toggleInventory()
    })

    // Toggle display of Changing Room (skinventory)
    $BODY.on('click', '.hud-skinventory', function () {
      $input.toggleSkinventory()
    })

    // Toggle display of Seed inventory (seedventory)
    $BODY.on('click', '.hud-seed', function () {
      $input.toggleSeedMode()
    })

    // Toggle display of Game log
    $BODY.on('click', '.hud-log', function () {
      $input.toggleGameLog()
    })

    // Toggle display of Progress window
    $BODY.on('click', '.hud-progress', function () {
      $input.toggleProgress()
    })

    // Toggle Audio on/off
    $BODY.on('click', '.hud-mute', function () {
      $input.toggleMute()
    })

    // Toggle display of Help window
    $BODY.on('click', '.hud-help', function () {
      $input.toggleHelp()
    })

    // Display a tooltip when player hovers over HUD controls
    $BODY.on('mouseenter', '.hud-button a', function () {
      $(this).tooltip('show')
    })

    // When player clicks a highlighted HUD button, remove the highlight
    $BODY.on('click', '.hud-button-highlight', function () {
      $input.unhighlightHUDButton(this)
    })

    /* * * * * * * *      SEEDVENTORY WINDOW INTERACTIONS      * * * * * * * */

    // When a seed button is clicked, clear all seed selected (highlight) classes
    $BODY.on('click', '#seedventory .seed', function () {
      $('#seedventory .seed').removeClass('selected')
    })

    // Select regular seed
    $BODY.on('click', '#seedventory .regular-button', function () {
      $('.regular-button').addClass('selected')
      $game.$player.startSeeding('regular')
    });

    // Select draw seed
    $BODY.on('click', '#seedventory .draw-button', function () {
      $('.draw-button').addClass('selected')

      $game.$player.startSeeding('draw');
      $BODY.on('mousedown touchstart', '#gameboard', function () {
        $game.$player.drawFirstSeed();
        $game.$mouse.drawMode = true;
      });
      $BODY.on('mouseup touchend', '#gameboard', function () {
        $game.$mouse.drawMode = false;
      });
    });

    // Close Seed inventory
    $BODY.on('click', '#seedventory .close-button', function () {
      $input.endSeedMode()
    })

    /* * * * * * * *       PROGRESS WINDOW INTERACTIONS        * * * * * * * */

    $BODY.on('click', '.tabbable li a', function (e) {
      e.preventDefault();
      return false;
    });

    //view all player resource answers
    $BODY.on('click', '.collected-button', function () {
      $('#collected-resources').show();
    });

    //go back to progress menu from player resource answers
    $BODY.on('click', '#collected-resources .backToProgress', function () {
      $('#collected-resources').hide();
    });

    // Close Progress window
    $BODY.on('click', '#progress-area .close-overlay', function (e) {
      e.preventDefault()
      $input.closeProgress()
      return false
    })

    /* * * * * * * *      SKINVENTORY WINDOW INTERACTIONS      * * * * * * * */

    // Click to equip a new skin part
    $BODY.on('click', '#skinventory .outer', function () {
      if (!$(this).hasClass('locked')) {
        var part = $(this).parent().data('part')
        var name = $(this).data('name')

        // Set highlight class
        $(this).parent().children().removeClass('equipped')
        $(this).addClass('equipped')

        // Set suit
        $game.$player.setSkinSuit(name, part)
      }
    })

    // Close skinventory
    $BODY.on('click', '#skinventory .close-button', function (e) {
      e.preventDefault()
      $input.closeSkinventory()
      return false
    })

    /* * * * * * * *            HELP WINDOW OVERLAY            * * * * * * * */

    // Close Help window
    $BODY.on('click', '#help-area a i, #help-area .close-button', function (e) {
      e.preventDefault()
      $input.closeHelp()
      return false
    })

    /* * * * * * * *        RESOURCE WINDOW INTERACTIONS       * * * * * * * *

    NOTE:   Interactions bound to some buttons in the resource overlay are
            programatically bound when needed in resources.js.

     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    // Close the resource area
    $BODY.on('click', '#resource-area .close-overlay', function (e) {
      e.preventDefault()
      $game.$resources.hideResource()
      return false
    })

    //make your comment public
    $BODY.on('click', '.public-button button', function () {
      $game.$player.makePublic($(this).attr('data-npc'))
      // Toggle state of button
      // TODO: place this presentation logic elsewhere
      $(this).parent().removeClass('public-button').addClass('private-button')
      $(this).parent().find('i').removeClass('fa-lock').addClass('fa-unlock-alt')
      $(this).text('Make Private')
    });

    //make your comment private
    $BODY.on('click', '.private-button button', function () {
      $game.$player.makePrivate($(this).attr('data-npc'))
      // Toggle state of button
      // TODO: place this presentation logic elsewhere
      $(this).parent().removeClass('private-button').addClass('public-button')
      $(this).parent().find('i').removeClass('fa-unlock-alt').addClass('fa-lock')
      $(this).text('Make Public')
    });

    //pledge a seed to a comment
    $BODY.on('click', '.pledge-button button', function () {
      var info = {
        id: $(this).attr('data-player'),
        pledger: $game.$player.firstName,
        npc: $(this).attr('data-npc')
      };
      var pledges = $game.$player.getPledges();
      if (pledges > 0) {
        ss.rpc('game.player.pledgeSeed', info, function (r) {
          $game.$player.updatePledges(-1);
          $game.$resources.showCheckMessage('Thanks! (they will say). You can seed ' + (pledges - 1) + ' more answers this level.')
          if ($game.checkFlag('pledge-reward')) {
            $game.$player.addSeeds('draw', 10)
            _input.outfitLog('You gained 10 paintbrush seeds for seeding another player’s response.')
          }
        });
      }
      else {
        $game.$resources.showCheckMessage('You cannot seed any more answers this level.')
      }
    });

    /* * * * * * * *       BOTANIST OVERLAY INTERACTIONS       * * * * * * * *

    NOTE:   Interactions bound to buttons in the botanist overlay are
            programatically bound when needed in botanist.js.

     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    // Close botanist window
    $BODY.on('click', '#botanist-area .close-overlay', function (e) {
      e.preventDefault()
      $game.$botanist.hideOverlay()
      return false
    })

    /* * * * * * * *        OTHER GAMEBOARD HUD ELEMENTS       * * * * * * * */

    $BODY.on('click', '#speech-bubble, #inventory, #botanist-area', function (e) {
      // Prevent clicking on interface elements from interacting with gameboard below
      e.stopImmediatePropagation()
    })

    // When scrolling article or log content, prevent page from scrolling also
    $BODY.on('mouseenter', '.scrollable, .content-box', function () {
      $(this).scroll(function () {
        $('body').css('overflow', 'hidden')
      })
    })
    $BODY.on('mouseleave', '.scrollable, .content-box', function () {
      $('body').css('overflow', 'auto')
    })

    // Send a chat message when submitted from the chat input field
    $BODY.on('click', '#chat-submit', function (e) {
      e.preventDefault()
      var el = document.getElementById('chat-input'),
          message = el.value

      // Stop chatting if player has tried to submit a blank message
      if (message === '') {
        el.blur()
        return false
      }

      $game.$audio.playTriggerFx('chatSend')

      // Check for chat triggers (e.g. cheat codes)
      if (_input.trigger(message) === false && _input.cheat(message) === false) {
        $game.$chat.send(message)
      }

      // Reset input box
      el.value = ''
      return true
    })

    $BODY.on('click', '#game-log', function () {
      $game.$log.clearUnread();
    });

    //pause menu if we want it
    // $WINDOW.blur(function (e) {
    //  if (!$game.$npc.isResource) {
    //    //$game.pause();
    //  }
    // });

    // $('.unpause').click(function () {
    //  $game.resume();
    // });

    /* * * * * * * *                KEYBINDINGS                * * * * * * * */

    $BODY.keydown(function (e) {
      // If escape is pressed, cancels any current action and returns to default gameboard view
      if (e.which === 27) {
        $input.resetUI()
      }

      // Allow keyboard inputs only when gameboard is active.
      if (!_input.isNewActionAllowed()) return
      if (!_input.isKeyInputAccepted()) return

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
        case 76:  // 'l'
          // Game log
          $input.toggleGameLog()
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
        case 191: // 'question mark' (?)
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
    document.getElementById('chat-input').focus()
  },

  toggleMinimap: function () {
    $('#minimap-player').toggle()
  },

  showMinimap: function () {
    $('#minimap-player').show()
  },

  // Toggles Seed Mode.
  toggleSeedMode: function () {
    if ($game.$player.seedMode === true || $game.checkFlag('seed-mode') === true) {
      $input.endSeedMode()
    }
    else {
      $input.startSeedMode()
    }
  },

  startSeedMode: function () {
    var seeds = $game.$player.getSeeds()

    $input.resetUI()

    $game.$player.seedMode = true
    $game.setFlag('seed-mode')
    $input.activeHUDButton('.hud-seed')

    // Force update of mouse cursor
    $game.$mouse.updateCursor()

    // Special controls for boss mode
    if ($game.checkFlag('boss-mode')) {
      $game.$boss.startSeedMode()
    }
    // If player has multiple types of seeds, open up the seed inventory
    else if (seeds.draw > 0) {
      $input.openSeedventory(seeds)
    }
    // Otherwise, go straight to regular seed planting mode
    else if (seeds.regular > 0) {
      $game.$player.seedPlanting = true
      $game.$player.seedMode = 'regular'
      $game.alert('Click anywhere to plant a seed and watch color bloom there')
    }
    else {
      // No seeds, cancel out of seed mode.
      $game.alert('You have no seeds!')
      $game.$input.endSeedMode()
    }
  },

  endSeedMode: function () {
    $game.$player.seedMode = false
    $game.removeFlag('seed-mode')
    if ($game.$player.seedventoryShowing) {
      $input.closeSeedventory()
    }
    $BODY.off('mousedown touchend', '#gameboard');
    $BODY.off('mouseup touchend', '#gameboard');
    $('.graffiti').hide();
    $game.$mouse.drawMode = false;
    $game.$player.seedPlanting = false;
    $game.$player.resetRenderColor();
    $input.inactiveHUDButton('.hud-seed')

    // Force update of mouse cursor
    $game.$mouse.updateCursor()

    $game.$player.saveMapImage();
    $game.$player.saveSeeds();
  },

  openSeedventory: function (seeds) {
    $game.alert('Choose a seed to plant')
    $('#seedventory').slideDown(300, function () {
      if (seeds.regular > 0) $('.regular-button').addClass('active')
      if (seeds.draw > 0) $('.draw-button').addClass('active')
      $game.$player.seedventoryShowing = true;
      $game.setFlag('viewing-seedventory')
    })
  },

  closeSeedventory: function () {
    $('#seedventory').slideUp(300, function () {
      $game.$player.seedventoryShowing = false;
      $game.removeFlag('viewing-seedventory')
    })
  },

  // Shows the inventory overlay only.
  // Used to restore inventory overlay after reviewing an inventory item / resource.
  showInventory: function (callback) {
    $game.setFlag('visible-inventory')
    $('#inventory').slideDown(300, function () {
      if (typeof callback === 'function') callback()
    })
  },

  // Only visually hides the inventory window.
  // Used to temporarily hide the inventory with the intention of re-opening it.
  hideInventory: function (callback) {
    $('#inventory').slideUp(300, function () {
      $game.removeFlag('visible-inventory')
      if (typeof callback === 'function') callback()
    })
  },

  toggleInventory: function () {
    if ($('#inventory').is(':visible')) {
      $input.closeInventory()
    }
    else {
      $input.openInventory()
    }
  },

  // The following extends showInventory() and hideInventory() respectively for actual inventory interaction.
  openInventory: function (callback) {
    $input.resetUI()
    $input.activeHUDButton('.hud-inventory')

    this.showInventory(function () {
      if ($game.$player.getInventory().length > 0) {
        $game.alert('Click on a piece to review again')
      }
      if (typeof callback === 'function') callback()
    })
  },

  closeInventory: function (callback) {
    this.hideInventory(function () {
      $input.inactiveHUDButton('.hud-inventory')
      $game.removeFlag('viewing-inventory')
      if (typeof callback === 'function') callback()
    })
  },

  toggleSkinventory: function () {
    return ($game.checkFlag('visible-skinventory') === true) ? $input.closeSkinventory() : $input.openSkinventory()
  },

  openSkinventory: function () {
    $input.resetUI()
    $input.activeHUDButton('.hud-skinventory')
    $game.setFlag('visible-skinventory')
    $('#skinventory').show()

    // Reset badge count
    $game.setBadgeCount('.hud-skinventory', 0)
  },

  closeSkinventory: function () {
    $game.removeFlag('visible-skinventory')
    $input.inactiveHUDButton('.hud-skinventory')
    $('#skinventory').hide()
  },

  toggleGameLog: function () {
    $input.resetUI()
    $game.$log.clearUnread()

    if (!$('#game-log').is(':visible')) {
      $('#game-log-overlay').hide()
      var h = $(window).height();
      $('html, body').stop().animate({
        scrollTop: h
      }, 250);
      $('#game-log').show()
    }
    else {
      $('#game-log').hide()
      $('#game-log-overlay').fadeIn(200)
    }
  },

  toggleProgress: function () {
    return ($game.checkFlag('visible-progress') === true) ? $input.closeProgress() : $input.openProgress()
  },

  openProgress: function () {
    $input.resetUI()
    $input.activeHUDButton('.hud-progress')
    $game.setFlag('visible-progress')
    $game.updateProgressOverlay()
    $('#progress-area').show()
  },

  closeProgress: function () {
    $game.removeFlag('visible-progress')
    $input.inactiveHUDButton('.hud-progress')
    $('#progress-area').hide()
  },

  toggleHelp: function () {
    return ($game.checkFlag('visible-help') === true) ? $input.closeHelp() : $input.openHelp()
  },

  openHelp: function () {
    $input.resetUI()
    $input.activeHUDButton('.hud-help')
    $game.setFlag('visible-help')
    $('#help-area').show()
  },

  closeHelp: function () {
    $game.removeFlag('visible-help')
    $input.inactiveHUDButton('.hud-help')
    $('#help-area').hide()
  },

  toggleMute: function () {
    return ($game.$audio.toggleMute() === true) ? $input.muteAudio() : $input.unmuteAudio()
  },

  muteAudio: function () {
    $('.hud-mute .fa').removeClass('fa-volume-up').addClass('fa-volume-off')
  },

  unmuteAudio: function () {
    $('.hud-mute .fa').removeClass('fa-volume-off').addClass('fa-volume-up')
  },

  // Add a highlight to a HUD button
  highlightHUDButton: function (target) {
    $('#hud .hud-button').removeClass('hud-button-highlight') // Removes all previous HUD highlights
    $(target).addClass('hud-button-highlight')
  },

  // Remove a highlight to a HUD button
  unhighlightHUDButton: function (target) {
    $(target).removeClass('hud-button-highlight')
  },

  // Highlight an active HUD button
  activeHUDButton: function (target) {
    $('#hud .hud-button').removeClass('hud-button-active') // Removes all previous HUD highlights
    $(target).addClass('hud-button-active')
  },

  // Remove highlight to active HUD button
  inactiveHUDButton: function (target) {
    $(target).removeClass('hud-button-active')
  },

  // Clears UI and sets everything into the most defaultest mode we can
  resetUI: function () {
    // Close any overlays
    $input.closeInventory()
    $input.closeSkinventory()
    $input.closeProgress()
    $input.closeHelp()
    $input.endSeedMode()

    // TODO: Also simultaneously cancel out of resources, botanist, and speechbubbles.

    // Unfocus chat input box
    document.getElementById('chat-input').blur()

    // Sets cursor to walk action
  }

}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _input = {

  // Decide if we should or should not let buttons be clicked based on state
  isNewActionAllowed: function () {
    //check all the game states (if windows are open ,in transit, etc.) to begin a new action
    return (
      !$game.checkFlag('in-transit') &&
      !$game.$player.isMoving &&
      !$game.$player.seedventoryShowing &&
      $game.running &&
      !$game.checkFlag('botanist-chatting') &&
      !$game.checkFlag('visible-skinventory') &&
      !$game.checkFlag('visible-help') &&
      !$game.checkFlag('visible-progress') &&
      !$game.checkFlag('visible-resource-overlay') &&
      !$game.checkFlag('visible-botanist-overlay') &&
      !$game.checkFlag('visible-boss-overlay')
    ) ? true : false
  },

  isKeyInputAccepted: function () {
    // TODO: There may be other conditions to test whether keypad input should be accepted.
    return (!$('input, textarea').is(':focus')) ? true : false
  },

  // Inputs for game activities
  trigger: function (input) {
    switch (input) {
      case 'FOREST':
        if ($game.checkFlag('teleport-forest')) {
          _input.outfitLog('Teleporting to ' + $game.world.northwest.name + '!')
          $game.$player.beam({x: 15, y: 22})
        }
        else return false
        break
      case 'TOWN':
        if ($game.checkFlag('teleport-town')) {
          _input.outfitLog('Teleporting to ' + $game.world.northeast.name + '!')
          $game.$player.beam({x: 99, y: 29})
        }
        else return false
        break
      case 'RANCH':
        if ($game.checkFlag('teleport-ranch')) {
          _input.outfitLog('Teleporting to ' + $game.world.southeast.name + '!')
          $game.$player.beam({x: 131, y: 96})
        }
        else return false
        break
      case 'PORT':
        if ($game.checkFlag('teleport-port')) {
          _input.outfitLog('Teleporting to ' + $game.world.southwest.name + '!')
          $game.$player.beam({x: 47, y: 99})
        }
        else return false
        break
      case 'kazaam':
        _input.outfitLog('Starting collaborative challenge.')
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

  // Cheats only
  cheat: function (input) {
    switch (input.toLowerCase()) {
      case 'beam me up scotty':
      case 'beam me up, Scotty!':   // Legacy cheat with punctuation
        _input.cheatLog('Teleporting to botanist.')
        $game.$player.beam({x: 70, y: 74})
        break
      case 'show me the money':
        _input.cheatLog('Adding 50 seeds.')
        $game.$player.addSeeds('regular', 50)
        break
      case 'like one of your french girls':
        _input.cheatLog('Adding 50 paint seeds.')
        $game.$player.addSeeds('draw', 50)
        break
      case 'loki':
        _input.cheatLog('Debug seed amount.')
        $game.$player.setSeeds('regular', 0)
        $game.$player.setSeeds('draw', 3)
        break
      case 'ding me':
        _input.cheatLog('Leveling up!')
        $game.$player.nextLevel()
        break
      case 'suit alors':
        _input.cheatLog('All suits unlocked!')
        var sets = $game.$skins.getSetsList()
        for (var i in sets) {
          $game.$skins.unlockSkin(sets[i])
        }
        break
      case 'birthday suit':
        _input.cheatLog('All suits removed!')
        $game.$skins.resetSkinventory()
        break
      case 'pleasantville':
        _input.cheatLog('Welcome to Pleasantville!')
        $game.bossModeUnlocked = true
        $game.setFlag('boss-mode-unlocked')
        $game.setFlag('boss-mode-ready')
        $game.$player.currentLevel = 4
        $game.toBossLevel()
        break
      default:
        return false
    }
  },

  log: function (color, tag, message) {
    $game.log('<span class="color-' + color + '">[' + tag + ']</span>' + ' ' + message)
  },

  outfitLog: function (message) {
    this.log('lightpurple', 'Outfit effect', message)
  },

  cheatLog: function (message) {
    this.log('yellow', 'Cheat code activated', message)
  },


}

