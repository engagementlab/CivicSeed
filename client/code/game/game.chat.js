'use strict'
/* global ss, $, $game */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    chat.js

    - Handles chatting & player speech bubbles.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$game.$chat = module.exports = (function () {
  // Placeholder for chat display time, after which a setTimeout is used to hide the chat bubble.
  var displayTimer = null

  var badWords = ['fuck', 'shit', 'bitch', 'cunt', 'damn', 'penis', 'vagina', 'crap', 'screw', 'suck', 'piss', 'whore', 'slut']

  // Check for bad language to censor it in chat
  function checkPotty (message) {
    var check = message.toLowerCase()

    for (var i = 0; i < badWords.length; i++) {
      if (check.indexOf(badWords[i]) > -1) {
        return 'I have a potty mouth and I am sorry for cussing.'
      }
    }
    return message
  }

  // Set a flag to indicate if a player has a chat bubble on screen
  function flag (bool) {
    if (bool === true) {
      $game.flags.set('chatting')
      return true
    } else {
      $game.flags.unset('chatting')
      return false
    }
    return $game.flags.check('chatting')
  }

  // Place the chat centered above player, or if too big then left/right align with screen edge
  function place (data) {
    var bubbleEl = document.getElementById('chat-' + data.id)
    var pointerEl = document.getElementById('chat-pointer-' + data.id)
    var sz = bubbleEl.offsetWidth
    var half = sz / 2
    var placeX
    var placeY
    var placePointerX
    var placePointerY
    var position
    var adjustY = 3
    var adjustPointerX = 5
    var other = false

    if (data.id !== $game.$player.id) {
      other = true
    }

    position = (other) ? data.position : $game.$player.getRenderPosition()

    if (position.x > 470) {
      var rem = 940 - position.x
      if (half > rem) {
        placeX = position.x - half - (half - rem)
      } else {
        placeX = position.x - half + 16
      }
      pointerEl.classList.add('flipped-horizontal')
    } else {
      if (half > position.x) {
        placeX = position.x - half + (half - position.x) + 10
      } else {
        placeX = position.x - half + 16
      }
    }

    placePointerX = position.x + ($game.TILE_SIZE * 1 - adjustPointerX)

    // Vertical position of chat bubble - based on game's tile size.
    // To add further adjustment, edit the adjustY variable.
    // adjustY - positive integers cause it to move up, negative moves down.
    if (position.y <= 1 * $game.TILE_SIZE) {
      // Prevent bubble from appearing above the gameboard if
      // player is standing within the top two rows.
      placeY = ($game.TILE_SIZE * 2) - adjustY
      placePointerY = ($game.TILE_SIZE * 2) - adjustY - 12
      pointerEl.classList.add('flipped-vertical')
    } else {
      placeY = position.y - ($game.TILE_SIZE * 2 + adjustY)
      placePointerY = position.y - ($game.TILE_SIZE * 1 + adjustY)
    }

    $(bubbleEl).css({
      'top': placeY,
      'left': placeX
    })
    $(pointerEl).css({
      'top': placePointerY,
      'left': placePointerX
    })
  }

  return {
    init: function (callback) {
      flag(false)
      callback()
    },

    send: function (message) {
      var data = {
            msg: checkPotty(message),
            name: $game.$player.firstName,
            id: $game.$player.id,
            log: message,
            color: $game.$player.getCSSColor(),
            instanceName: $game.$player.instanceName
          }
      ss.rpc('game.chat.sendMessage', data)
    },

    message: function (data) {
      var gameboard = document.getElementById('gameboard')
      var bubbleEl = document.getElementById('chat-' + data.id)
      var pointerEl = document.getElementById('pointer-' + data.id)
      var name = 'me'
      var message = data.message

      // Clear previous timeout, if any
      clearTimeout(displayTimer)

      // See if message is from current player or another player
      if (data.id !== $game.$player.id) {
        // This is the other player
        name = data.name
        // Play a sound
        $game.$audio.playTriggerFx('chatReceive')
      } else {
        // This is the current plater
        flag(true)
      }

      // Re-create the speech bubble & pointer, if it's not already present
      if (!bubbleEl) {
        bubbleEl = document.createElement('div')
        bubbleEl.classList.add('player-chat')
        bubbleEl.id = 'chat-' + data.id
        gameboard.appendChild(bubbleEl)

        pointerEl = document.createElement('div')
        pointerEl.classList.add('player-chat-pointer')
        pointerEl.id = 'chat-pointer-' + data.id
        gameboard.appendChild(pointerEl)
      }

      // Add bubble contents
      bubbleEl.textContent = name + ': ' + message

      // Set some appearance vars
      var displayTime = Math.min(bubbleEl.textContent.length * 200 + 1000, 11500)

      // Setup a timer to hide the message after some time
      displayTimer = setTimeout(function () {
        this.hideChat(data)
      }.bind(this), displayTime)

      // Place the chat bubble
      place(data)

      // Return the length of time for this message to display; used by $others.message timer
      return displayTime
    },

    // Remove chat from screen
    hideChat: function (data) {
      // If data is not passed in, assume it's the chat for current player
      if (!data) data = { id: $game.$player.id }
      var bubbleEl = document.getElementById('chat-' + data.id)
      var pointerEl = document.getElementById('chat-pointer-' + data.id)
      clearTimeout(displayTimer)
      $(bubbleEl).fadeOut('fast', function () {
        $(this).remove()
        flag(false)
      })
      $(pointerEl).fadeOut('fast', function () {
        $(this).remove()
      })
    },

    // Force clear all chats from screen
    // (TODO) This is a hack to address more pressing problems in the
    // others.js chat functionality (timer not clearing itself?)
    clearAllChats: function () {
      $('.player-chat').remove()
      $('.player-chat-pointer').remove()
    }
  }
}())
