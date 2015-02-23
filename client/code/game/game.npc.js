'use strict'
/* global ss, $, $game */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    npc.js

    - Functions related to the creation and interaction of NPCs.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var _ = require('underscore')

// NPC class
// Currently not a standalone thing because to many internal
// functions are depending on other bits of game
function Npc (data) {
  this.name       = data.name
  this.id         = data.id
  this.sprite     = data.sprite
  this.level      = data.level
  this.dialog     = data.dialog
  this.dependsOn  = data.dependsOn
  this.isHolding  = data.isHolding
  this.resource   = data.resource
  this.skinSuit   = data.skinSuit
  this.onScreen   = null

  this.position = {
    x: data.position.x,
    y: data.position.y
  }

  // Two concepts of render data
  // 1. Render position (named renderInfo currently)
  // 2. Animation frame (position on spritesheet)
  this.renderInfo = {
    kind: 'npc',
    prevX: this.position.x * $game.TILE_SIZE,
    prevY: this.position.y * $game.TILE_SIZE,
    curX: this.position.x * $game.TILE_SIZE,
    curY: this.position.y * $game.TILE_SIZE,
    srcX: 0,
    srcY: this.sprite * 64
  }

  // Begin animation frame at a random counter, so that
  // NPCs are not all weirdly synchronized
  this.animation = {
    counter: Math.floor(Math.random() * 64)
  }
}

// Update the npc's rendering
Npc.prototype.update = function () {
  var check = $game.flags.check('screen-transition')
  if (!check) {
    this.idle()
  } else {
    this.setRenderInfo()
  }
}

// Idle for one frame of animation and set the render info to the appropriate sprite
Npc.prototype.idle = function () {
  var spriteWidth = $game.TILE_SIZE
  this.animation.counter += 1

  if (this.animation.counter >= 56) {
    this.renderInfo.srcX = 0
    // Reset counter
    this.animation.counter = 0
  } else if (this.animation.counter === 24) {
    this.renderInfo.srcX = 1 * spriteWidth
  } else if (this.animation.counter === 28) {
    this.renderInfo.srcX = 2 * spriteWidth
  } else if (this.animation.counter === 32) {
    this.renderInfo.srcX = 3 * spriteWidth
  }
}

// Determine if NPC is on screen, and if so, update its render location
Npc.prototype.setRenderInfo = function () {
  var local = $game.$map.masterToLocal(this.position.x, this.position.y)
  if (local) {
    var curX = local.x * $game.TILE_SIZE
    var curY = local.y * $game.TILE_SIZE

    // NPCs do not move, so there is no previous X/Y, but set it to
    // current X/Y in case renderer chokes without it
    this.renderInfo.prevX = curX
    this.renderInfo.prevY = curY
    this.renderInfo.curX = curX
    this.renderInfo.curY = curY

    this.onScreen = true
  } else {
    this.onScreen = false
  }
}

// Get the render information to draw it
Npc.prototype.getRenderInfo = function () {
  return (this.onScreen) ? this.renderInfo : false
}

// Get {x,y} coordinates for local position, a subset of renderInfo
Npc.prototype.getLocalPosition = function () {
  return (this.onScreen) ? {
    x: this.renderInfo.curX,
    y: this.renderInfo.curY
  } : false
}

// Clear from the screen
Npc.prototype.clear = function () {
  $game.$render.clearCharacter(this.renderInfo)
}

// Returns actual numerical value of level
Npc.prototype.getLevel = function () {
  return this.level + 1
}

// Check if an NPC's resource is locked
// An NPC is locked if the player must own the resource of another NPC,
// before being able to obtain its resource
// TODO: The concept of "locked" will change somewhat away from the
// concept of resource ownership - it means whether a player is "done"
// with answering a given NPC's questions.
Npc.prototype.isLocked = function () {
  if (this.dependsOn) {
    var npc = $game.$npc.get(this.dependsOn)
    // Check if player already has it
    return ($game.$player.checkForCompletedResource(npc.resource.id)) ? false : true
  }
  return false
}

// Form smalltalk dialog
Npc.prototype.getSmalltalk = function () {
  var dialog = ''
  var place = ''

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
      default:
        // No default
        break
    }
    dialog = 'You should go explore ' + $game.world[place].name + ', in the ' + place + '.'
  } else {
    // If NPC has a response for past, present, future
    // Past (smalltalk index 0) = Player has surpassed NPC's level
    // Present (smalltalk index 1) = Player matches NPC's level
    // Future (smalltalk index 2) = Player has not reached NPC's level

    if ($game.$player.currentLevel === this.level) {
      dialog = this.dialog.smalltalk[1]
    } else if ($game.$player.currentLevel < this.level) {
      dialog = this.dialog.smalltalk[2]
    } else {
      // Not all NPCs have "past" text content.
      // Check to make sure "past" has content; if not, default to "present" index
      if (this.dialog.smalltalk[0].length > 1) {
        dialog = this.dialog.smalltalk[0]
      } else {
        dialog = this.dialog.smalltalk[1]
      }
    }
  }
  return dialog
}

$game.$npc = module.exports = (function () {
  var _npc = {
    data: {},

    // Add an npc to the data object
    add: function (npcData) {
      var npc = new Npc(npcData)

      npc.setRenderInfo()
      _npc.data[npc.id] = npc
    },

    // Choose prompt based on PLAYER's memory of interaction
    // There are 3 prompts:
    //  0: fresh visit
    //  1: player has previously visited, but provided a wrong answer
    //  2: player has correctly answered and collected this resource
    createPrompt: function (npc) {
      var promptIndex = $game.$player.getPrompt(npc.resource.id)
      var dialogue = npc.dialog.prompts[promptIndex]
      var resource = $game.$resources.get(npc.resource.id)

      // If the NPC is holding a resource with content, then ask the
      // player if they want to review the resource article content
      if (promptIndex === 2 && resource.url !== '') {
        dialogue += ' Want to view again?'
      }

      // If the NPC is holding a resource and the resource has no
      // content URL, then do not allow any resource to display
      if (promptIndex === 2 && resource.url === '') {
        $game.$npc.showSpeechBubble(npc.name, dialogue)
      } else {
        // Show the prompt smalltalk and then follow up by showing
        // the resource article / question window
        $game.$npc.showSpeechBubble(npc.name, dialogue, function () {
          $game.$resources.showResource(resource.id)
        })
      }
    }
  }

  return {
    ready: false,
    hideTimer: null,

    // Pull all npc info from the DB
    init: function (callback) {
      // Load all the npc info from the DB store it in an array
      ss.rpc('game.npc.getNpcs', function (response) {
        $.each(response, function (key, npc) {
          _npc.add(npc)
        })
        this.ready = true
        callback()
      }.bind(this))
    },

    resetInit: function () {
      this.ready = false
      this.hideTimer = null
    },

    // Update all npcs (for movement and rendering)
    update: function () {
      $.each(_npc.data, function (key, npc) {
        npc.update()
      })
    },

    // Clear all npcs to draw fresh
    clear: function () {
      $.each(_npc.data, function (key, npc) {
        npc.clear()
      })
    },

    // Get render info for all npcs to draw them
    getRenderInfo: function () {
      var allRenderInfo = []
      if ((!$game.bossModeUnlocked && $game.$player.currentLevel > 3) || $game.$player.currentLevel <= 3) {
        $.each(_npc.data, function (key, npc) {
          var info = npc.getRenderInfo()
          if (info) {
            allRenderInfo.push(info)
          }
        })
      }
      return allRenderInfo
    },

    // Determine NPC content to display when clicked
    activate: function (npcId) {
      var MASTER_NPC_ID = 64
      var npc = this.get(npcId)
      var botanistState = $game.$botanist.getState()

      // Once activated, reset global NPC state
      // TODO: This should be deprecated eventually
      $game.$player.npcOnDeck = false

      // NPC interaction to display if the player has not finished speaking with Botanist
      // (1) If the player attempts to roam the world before completing the tutorial
      if ($game.flags.check('first-time') === true) {
        this.showSpeechBubble(npc.name, 'You should really see the Botanist before exploring the world.')
      } else if (botanistState < 2 || botanistState > 3) {
        // (2) If the player attempts to roam the world before the Botanist is done talking
        this.showSpeechBubble(npc.name, 'The Botanist still has more to tell you! Head back to The Botanist’s Garden to hear the rest.')
      } else if (npc.isHolding && $game.$player.getLevel() >= npc.getLevel()) {
        // If resource is available for the player
        // Check if NPC's availability depends on player talking to a different NPC
        if (npc.isLocked()) {
          var dialogue = 'Before I help you out, you need to go see ' + this.get(npc.dependsOn).name + '. Come back when you have their resource.'

          // TODO HACK
          // Different dialogue for the community NPCs
          if (npc.dependsOn === MASTER_NPC_ID) {
            dialogue = 'We’re here to talk about your host communities! Talk to <strong class="color-blue">Katamari</strong> to hear what you need to do. That’s the little green toad standing there in the lab coat, if you didn’t know. Come back soon!'
            // Player obtains Master NPC's placeholder resource
            // after speaking to him the first time.
            if ($game.$player.checkForResource(4000) === true) {
              _npc.createPrompt(npc)
              return
            }
          }

          this.showSpeechBubble(npc.name, dialogue)
        } else if (npc.id === MASTER_NPC_ID) {
          // TODO HACK
          // Shoe horn in different behavior for the Master NPC
          // If player has not completed community NPCs:
          if ($game.$player.checkForCompletedResource(4001) === true ||
              $game.$player.checkForCompletedResource(4002) === true ||
              $game.$player.checkForCompletedResource(4003) === true) {
            _npc.createPrompt(npc)
          } else {
            // If not, show special master NPC screen
            $game.$resources.showResource(4000)
          }
        } else {
          // NPC's resource dialog and prompt
          _npc.createPrompt(npc)
        }
      } else {
        // If no resource is available for the player, make small talk instead.
        this.showSpeechBubble(npc.name, npc.getSmalltalk())
      }
    },

    // Show an NPC's speech bubble
    showSpeechBubble: function (speaker, messages, prompt, callback) {
      var el = document.getElementById('speech-bubble')
      var $el = $(el) // Cache jQuery reference
      var hasPrompt = false
      var isMultiline = false
      var text = null
      var self = this

      // If a speech bubble is currently open, just hide it quickly so that text change can happen
      if ($el.is(':visible')) {
        el.style.display = 'none'
      }

      // Set global chat state
      $game.flags.set('npc-chatting')

      // Play sound effect
      $game.$audio.playTriggerFx('npcBubble')

      // Set up message
      $el.find('.speaker').text(speaker)

      // Clear any residue of interaction detritus
      $el.find('.dialog').removeClass('fit')
      $el.find('button').hide()

      if (_.isArray(messages)) {
        // An array of strings is acceptable for messages.
        // This would create 'next' buttons until the full array of messages have been displayed.
        // If a prompt is provided, the prompt will always be on the last message.
        // Callbacks are not performed until the player clicks 'Close' of the speech bubble.
        // Sometimes it's useful to provide a single-item array if you want a user to acknowledge
        // a speech bubble and the game to provide additional actions.
        isMultiline = true
        _showMultiline(0)
      } else {
        // Assume that messages is a string.
        text = messages
        $el.find('.message').html(text) // Allow HTML tags inline
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
        // The timer is set by the length of the message, but no less than 4 seconds at minimum.
        if (!isMultiline && !hasPrompt) {
          var hideTimer = text.length * 50
          if (hideTimer < 4000) hideTimer = 4000
          this.hideTimer = setTimeout(this.hideSpeechBubble, hideTimer)
        }
      }.bind(this))

      // Utility functions for showSpeechBubble()
      function _showMultiline (index) {
        $el.find('.dialog').addClass('fit')

        text = messages[index]
        $el.find('.message').html(text) // Allow HTML tags inline

        if (index < messages.length - 1) {
          // Intermediary messages
          $el.find('.next-button').off('click').on('click', function (e) {
            e.stopImmediatePropagation()
            _showMultiline(index + 1)
          }).show()
        } else {
          // Last message
          $el.find('.next-button').off('click').hide()
          if (hasPrompt === true) {
            _setupPrompt()
          } else {
            $el.find('.close-button').on('click', function (e) {
              e.stopImmediatePropagation()
              self.hideSpeechBubble(callback)
            }).show()
          }
        }
      }

      function _setupPrompt () {
        $el.find('.dialog').addClass('fit')

        // prompt is a callback function that is executed when player clicks the Yes button.
        // Currently assuming that all prompt responses automatically closes the speech bubble
        // rather than lead to next line of conversation.
        $el.find('.yes-button').on('click', function (e) {
          e.stopImmediatePropagation()
          self.hideSpeechBubble(prompt)
        }).show()

        // Close prompt
        $el.find('.no-button').on('click', function (e) {
          e.stopImmediatePropagation()
          self.hideSpeechBubble(callback)
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

        el.querySelector('.buttons').appendChild(button)
      }
    },

    // Hide an NPC's chat bubble
    hideSpeechBubble: function (callback) {
      clearTimeout(this.hideTimer)
      var $el = $('#speech-bubble')

      $game.flags.unset('npc-chatting')
      $el.find('.next-button').off('click')
      $el.find('.close-button').off('click')
      $el.find('.yes-button').off('click')
      $el.find('.no-button').off('click')

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

    // Set the current npc to specific one so we can operate on it in the near future
    select: function (npcId) {
      // Pass the selected NPC id to $player to trigger the selected NPC
      $game.$player.npcOnDeck = npcId
    },

    // Get an NPC by its ID
    get: function (npcId) {
      return _npc.data[npcId]
    },

    // Get all npc data
    getNpcData: function () {
      return _npc.data
    },

    findNpcByResourceId: function (id) {
      // Get NPC data given its resource id
      var result = _.filter(_npc.data, function (npc) {
        return npc.resource.id === id
      })
      return result[0]
    },

    getOnScreenNpcs: function () {
      var onScreenNpcs = []
      $.each(_npc.data, function (key, npc) {
        if (npc.onScreen) {
          onScreenNpcs.push(npc.id)
        }
      })
      return onScreenNpcs
    }
  }
})()
