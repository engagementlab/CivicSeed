'use strict';

var _loaded  = false,
    _allNpcs = {},
    _curNpc  = null

var $npc = $game.$npc = {

  ready:      false,
  hideTimer:  null,
  isResource: false,
  isChat:     false,

  //pull all npc info from the DB
  init: function (callback) {
    //load all the npc info from the DB store it in an array
    //where the index is the id of the npc / mapIndex
    ss.rpc('game.npc.getNpcs', function(response) {
      // console.log(response);
      //iterate through repsonses, create a key
      //with the id and value is the object
      _allNpcs = {};
      $.each(response, function(key, npc) {
        $game.$npc.addNpc(npc);
      });
      _loaded = true;
      $game.$npc.ready = true;
      callback();
    });
  },

  resetInit: function () {
    _loaded  = false;
    _allNpcs = {};
    _curNpc  = null;

    $game.$npc.ready      = false;
    $game.$npc.hideTimer  = null;
    $game.$npc.isResource = false;
    $game.$npc.isChat     = false;
  },

  //add an npc to the list
  addNpc: function(npc) {
    var newbie = $game.$npc.createNpc(npc);
    newbie.getMaster();
    _allNpcs[npc.index] = newbie;
  },

  //update all npcs (for movement and rendering)
  update: function() {
    //if is moving, move
    $.each(_allNpcs, function(key, npc) {
      npc.update();
    });
  },

  //clear all npcs to draw fresh
  clear: function() {
    //if is moving, move
    $.each(_allNpcs, function(key, npc) {
      npc.clear();
    });
  },

  //get render info for all npcs to draw them
  getRenderInfo: function() {
    var all = [];
    if((!$game.bossModeUnlocked && $game.$player.currentLevel > 3) || $game.$player.currentLevel <= 3) {
      $.each(_allNpcs, function(key, npc) {
        var temp = npc.getRenderInfo();
        if(temp) {
          all.push(temp);
        }
      });
    }
    return all;
  },

  //create an npc with all its data bound to it
  createNpc: function (npc) {

    var npcObject = {

      name: npc.name,
      id: npc.id,
      index: npc.index,
      dialog: npc.dialog,
      dependsOn: npc.dependsOn,
      level: npc.level,
      isHolding: npc.isHolding,
      resource: npc.resource,
      onScreen: null,
      numSteps: 64,
      counter: Math.floor(Math.random() * 64),
      curFrame: 0,
      numFrames: 4,
      skinSuit: npc.skinSuit,

      info: {
        x: npc.index % $game.TOTAL_WIDTH,
        y: Math.floor(npc.index / $game.TOTAL_WIDTH),
        spriteY: npc.sprite * 64
      },

      renderInfo: {
        prevX: (npc.index % $game.TOTAL_WIDTH) * $game.TILE_SIZE,
        prevY: (Math.floor(npc.index / $game.TOTAL_WIDTH)) * $game.TILE_SIZE,
        curX: (npc.index % $game.TOTAL_WIDTH) * $game.TILE_SIZE,
        curY: (Math.floor(npc.index / $game.TOTAL_WIDTH)) * $game.TILE_SIZE,
        srcX: 0,
        srcY: 0,
        kind: 'npc'
      },

      //update the npc's rendering
      update: function() {

        if(!$game.inTransit) {
          npcObject.idle();
        }
        else if($game.inTransit) {
          npcObject.getMaster();
        }
      },

      //figure out if it is on screen or not
      getMaster: function() {
        var loc = $game.$map.masterToLocal(npcObject.info.x, npcObject.info.y);
        if(loc) {
          var prevX = loc.x * $game.TILE_SIZE,
              prevY = loc.y * $game.TILE_SIZE,
              curX  = loc.x * $game.TILE_SIZE,
              curY  = loc.y * $game.TILE_SIZE;

          npcObject.renderInfo.prevX = prevX;
          npcObject.renderInfo.prevY = prevY;

          npcObject.renderInfo.curX = curX;
          npcObject.renderInfo.curY = curY;
          npcObject.onScreen = true;
        }
        else {
          npcObject.onScreen = false;
        }
      },

      //advance the idle cycle for animation
      idle: function() {
        npcObject.counter += 1;

        if(npcObject.counter >= 56) {
          npcObject.counter = 0;
          npcObject.renderInfo.srcX = 0;
          npcObject.renderInfo.srcY = npcObject.info.spriteY;
        }

        else if(npcObject.counter == 24) {
          npcObject.renderInfo.srcX = 32;
          npcObject.renderInfo.srcY = npcObject.info.spriteY;
        }

        else if(npcObject.counter == 28) {
          npcObject.renderInfo.srcX = 64;
          npcObject.renderInfo.srcY = npcObject.info.spriteY;
        }

        else if(npcObject.counter == 32) {
          npcObject.renderInfo.srcX = 96;
          npcObject.renderInfo.srcY = npcObject.info.spriteY;
        }
      },

      //clear from the screen
      clear: function() {
        $game.$renderer.clearCharacter(npcObject.renderInfo);
      },

      // Returns actual numerical value of level
      getLevel: function () {
        return this.level + 1
      },

      //get the render information to draw it
      getRenderInfo: function() {
        if(npcObject.onScreen) {
          return npcObject.renderInfo;
        }
        else {
          return false;
        }
      },

      // Check if an NPC's resource is locked
      isLocked: function () {
        var id = this.dependsOn
        // An NPC is locked if obtaining its resource depends on a player owning the resource of another NPC.
        if (id !== null) {
          // Check if player already has it
          return ($game.$player.checkForResource(id)) ? false : true
        }
        return false
      },

      // Form smalltalk dialog
      getSmalltalk: function () {
        var dialog = '',
            place = ''

        if (this.isHolding) {
          switch ($game.$player.currentLevel) {
            case 0:
              place = 'northwest'
              break
            case 1:
              place = 'northeast'
              break
            case 2:
              place = 'southeast'
              break
            case 3:
              place = 'southwest'
              break
          }
          dialog = 'You should go explore ' + $game.world[place].name + ', in the ' + place + '.'
        }
        // If NPC has a response for past, present, future
        else {
          if ($game.$player.currentLevel === this.level) {
            dialog = this.dialog.smalltalk[1]
          }
          else if ($game.$player.currentLevel < this.level) {
            dialog = this.dialog.smalltalk[2]
          }
          else {
            dialog = this.dialog.smalltalk[0]
          }
        }
        return dialog
      },
    };

    return npcObject;
  },

  // Determine NPC content to display when clicked
  activate: function (index) {
    var npc = $npc.getNpc(index)

    // Once activated, reset global NPC state
    // TODO: This should be deprecated eventually
    $game.$player.npcOnDeck = false

    // NPC interaction to display if the player has not finished speaking with Botanist
    if ($game.$botanist.getState() === 0 && $game.$player.getLevel() === 1 && $game.$botanist.tutorialState === 0) {
      $npc.showSpeechBubble(npc.name, 'You should really see the Botanist before exploring the world.')
    }
    else if ($game.$botanist.getState() < 2 ) {
      $npc.showSpeechBubble(npc.name, 'The Botanist still has more to tell you! Head back to The Botanist’s Garden to hear the rest.')
    }
    // If resource is available for the player
    else if (npc.isHolding && $game.$player.getLevel() >= npc.getLevel()) {
      // Check if NPC's availability depends on player talking to a different NPC
      if (npc.isLocked()) {
        var dialogue = 'Before I help you out, you need to go see ' + $npc.getNpc(npc.dependsOn).name + '. Come back when you have their resource.'
        $npc.showSpeechBubble(npc.name, dialogue)
      }
      else {
        $npc.createPrompt(npc)
      }
    }
    // If no resource is available for the player, make small talk instead.
    else {
      $npc.showSpeechBubble(npc.name, npc.getSmalltalk())
    }
  },

  // Show an NPC's speech bubble
  showSpeechBubble: function (speaker, messages, prompt, callback) {
    var $el           = $('.speechBubble'),
        hasPrompt     = false,
        isMultiline   = false,
        text          = null

    // Set global chat state
    $npc.isChat = true

    // Play sound effect
    $game.$audio.playTriggerFx('npcBubble')

    // Set up message
    $el.find('.speakerName').text(speaker)
    $el.find('.dialog').show()        // This is sometimes hidden - who hides it?

    // Clear any residue of interaction detritus
    $el.find('.dialog').removeClass('fit')
    $el.find('button').hide()

    if (_.isArray(messages)) {
      // An array of strings is acceptable as for messages.
      // This would create 'next' buttons until the full array of messages have been displayed.
      // If a prompt is provided, the prompt will always be on the last message.
      // Callbacks are not performed until the player clicks 'Close' of the speech bubble.
      // Sometimes it's useful to provide a single-item array if you want a user to acknowledge
      // a speech bubble and the game to provide additional actions.
      isMultiline = true
      _showMultiline(0)
    }
    else {
      // Assume that messages is a string.
      text = messages
      $el.find('.message').text(text)
    }

    // If it has a prompt, set up prompt.
    if (typeof prompt === 'function' && isMultiline === false) {
      hasPrompt = true
      _setupPrompt()
    }

    // If neither array nor prompt
    if (!isMultiline && !hasPrompt) {
      // Set up callback function
      if (typeof callback === 'function') _storeCallback()
    }

    // Display the speech bubble
    $el.fadeIn(300, function () {
      // If no prompt, the dialog box should fade on its own after some time.
      // The timer is set by the length of the message, but no less than 2 seconds at minimum.
      if (!isMultiline && !hasPrompt) {
        var hideTimer = text.length * 50
        if (hideTimer < 2000) hideTimer = 2000
        $npc.hideTimer = setTimeout($npc.hideSpeechBubble, hideTimer)
      }
    })

    // Utility functions for showSpeechBubble()
    function _showMultiline (index) {
      $el.find('.dialog').addClass('fit')

      text = messages[index]
      $el.find('.message').text(text)

      if (index < messages.length - 1) {
        // Intermediary messages
        $el.find('.nextButton').off('click').on('click', function (e) {
          e.stopImmediatePropagation()
          _showMultiline(index + 1)
        }).show()
      }
      else {
        // Last message
        $el.find('.nextButton').off('click').hide()
        if (hasPrompt === true) {
          _setupPrompt()
        }
        else {
          $el.find('.closeButton').on('click', function (e) {
            e.stopImmediatePropagation()
            $npc.hideSpeechBubble(callback)
          }).show()
        }
      }
    }

    function _setupPrompt () {
      $el.find('.dialog').addClass('fit')

      // prompt is a callback function that is executed when player clicks the Yes button.
      // Currently assuming that all prompt responses automatically closes the speech bubble
      // rather than lead to next line of conversation.
      $el.find('.yesButton').on('click', function (e) {
        e.stopImmediatePropagation()
        $npc.hideSpeechBubble(prompt)
      }).show()

      // Close prompt
      $el.find('.noButton').on('click', function (e) {
        e.stopImmediatePropagation()
        $npc.hideSpeechBubble(callback)
      }).show()
    }

    function _storeCallback () {
      // Binds callback to a hidden button element so that it is called on hide
      var button = document.createElement('button')
      button.id = 'callback-button'
      button.addEventListener('click', function _onClose (e) {
        e.preventDefault()
        callback()
        button.removeEventListener('click', _onClose)
      })

      $el.querySelector('.buttonCorner').appendChild(button)
    }

  },

  // Hide an NPC's chat bubble
  hideSpeechBubble: function (callback) {
    clearTimeout($game.$npc.hideTimer)
    var $el = $('.speechBubble')

    $game.$npc.isChat = false
    $el.find('.nextButton').off('click')
    $el.find('.closeButton').off('click')
    $el.find('.yesButton').off('click')
    $el.find('.noButton').off('click')

    $el.fadeOut(300, function () {
      // Execute a callback function passed to this method
      if (typeof callback === 'function') callback()

      // Execute a callback function bound to the speech bubble DOM
      var $storedCallback = $el.find('.callback-button')
      if ($storedCallback.length > 0) {
        $storedCallback.triggerHandler('click')
        $storedCallback.remove()
      }
    })
  },

  //choose prompt based on PLAYERs memory of interaction
  //there are 3 prompts (0: fresh visit, 1: visited, wrong answer, 2: already answered
  createPrompt: function (npc) {
    var promptIndex = $game.$player.getPrompt(npc.index)
    var dialogue = npc.dialog.prompts[promptIndex]

    if (promptIndex === 2) {
      dialogue += ' Want to view again?'
    }

    $npc.showSpeechBubble(npc.name, dialogue, function () {
      $game.$resources.showResource(npc.index)
    })
  },

  //set the current npc to specific one so we can operate on it in the near future
  selectNpc: function (index) {
    // TODO: Deprecate setting of _curNpc global variable, used primarily by getNpcLevel() and various
    // resource-related functions that rely on it.
    var stringId = String(index);
    _curNpc = _allNpcs[stringId];
    if(!_curNpc) {
      index += $game.TOTAL_WIDTH;
      stringId = String(index);
      _curNpc = _allNpcs[stringId];
    }

    // Hack to pass the selected NPC index somewhere
    // This is still used in player.js to trigger the correct NPC
    $game.$player.npcOnDeck = index;
  },

  getNpc: function (index) {
    // Get NPC data given its index id
    // This should act as a replacement to the use of a global _curNpc variable.
    var npc      = _allNpcs[index]

    // What does this do?! (selects the spot above NPC b/c of double height sprite?)
    if (!npc) {
      index += $game.TOTAL_WIDTH
      npc    = _allNpcs[index]
    }

    return npc
  },

  // Get NPC's level.
  getLevel: function (index) {
    // This differs from refering to the .level property of the NPC since this returns
    // actual level (+1)
    if (index) {
      return $npc.getNpc(index).getLevel()
    }
    else {
      $game.debug('Getting NPC level with _curNpc global is deprecated. Please provide an NPC by index directly.')
      return _curNpc.level + 1
    }
  },

  // Alias for $npc.getLevel()
  getNpcLevel: function (index) {
    $game.debug('$npc.getNpcLevel() is deprecated. Use $npc.getLevel() or npc.getLevel() (on NPC object) instead.')
    $npc.getLevel(index)
  },

  //get all npc data
  getNpcData: function () {
    return _allNpcs;
  },

  //get a specific name of npc
  getName: function (index) {
    return _allNpcs[index].name
  },

  getOnScreenNpcs: function() {
    var onScreen = [];
    $.each(_allNpcs, function(key, npc) {
      if(npc.onScreen) {
        onScreen.push(npc.index);
      }
    });
    return onScreen;
  },

  getNpcCoords: function(index) {
    var stringId = String(index),
      npc = _allNpcs[stringId];
    return({x: npc.renderInfo.curX, y: npc.renderInfo.curY});
  }
};
