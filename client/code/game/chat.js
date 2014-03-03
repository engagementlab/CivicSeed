'use strict';

var $chat = $game.$chat = {

  init: function (callback) {
    _chat.flag(false)
    callback()
  },

  send: function (message) {
    var data = {
          msg:          _chat.checkPotty(message),
          name:         $game.$player.firstName,
          id:           $game.$player.id,
          log:          message,
          instanceName: $game.$player.instanceName
        }
    ss.rpc('game.chat.sendMessage', data, function (r) {
      // Nothing
    })
  },

  message: function (data) {
    var gameboard = document.getElementById('gameboard'),
        bubbleEl  = document.getElementById('chat-' + data.id),
        pointerEl = document.getElementById('pointer-' + data.id),
        name      = 'me',
        message   = data.message,
        other     = false

    // Clear previous timeout, if any
    clearTimeout(_chat.displayTimer)

    // See if message is from current player or another player
    if (data.id !== $game.$player.id) {
      // This is the other player
      other = true
      name  = data.name
      // Play a sound
      $game.$audio.playTriggerFx('chatReceive')
    }
    else {
      // This is the current plater
      _chat.flag(true)
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
    bubbleEl.innerText = name + ': '+ message

    // Set some appearance vars
    var displayTime = Math.min(bubbleEl.innerText.length * 200 + 1000, 11500)

    // Setup a timer to hide the message after some time
    _chat.displayTimer = setTimeout(function () {
      $chat.hideChat(data)
    }, displayTime)

    // Place the chat bubble
    _chat.place(data)

    // Add the message to the log
    $game.$log.addMessage(data)

    // Return the length of time for this message to display; used by $others.message timer
    return displayTime
  },

  // Remove chat from screen
  hideChat: function (data) {
    // If data is not passed in, assume it's the chat for current player
    if (!data) data = { id: $game.$player.id }
    var bubbleEl  = document.getElementById('chat-' + data.id),
        pointerEl = document.getElementById('chat-pointer-' + data.id)
    clearTimeout(_chat.displayTimer)
    $(bubbleEl).fadeOut('fast', function () {
      $(this).remove()
      _chat.flag(false)
    })
    $(pointerEl).fadeOut('fast', function () {
      $(this).remove()
    })
  }
}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _chat = {

  // Placeholder for chat display time, after which a setTimeout is used to hide the chat bubble.
  displayTimer: null,
  badWords: ['fuck', 'shit', 'bitch', 'cunt', 'damn', 'penis', 'vagina', 'crap', 'screw', 'suck', 'piss', 'whore', 'slut'],

  // Check for bad language to censor it in chat
  checkPotty: function (message) {
    var check = message.toLowerCase()

    for (var i = 0; i < this.badWords.length; i++) {
      if (check.indexOf(this.badWords[i]) > -1) {
        return 'I have a potty mouth and I am sorry for cussing.'
      }
    }
    return message
  },

  // Set a flag to indicate if a player has a chat bubble on screen
  flag: function (bool) {
    if (bool === true) {
      $game.setFlag('chatting')
      return true
    }
    else if (bool === false) {
      $game.removeFlag('chatting')
      return false
    }
    return $game.checkFlag('chatting')
  },

  // Place the chat centered above player, or if too big then left/right align with screen edge
  place: function (data) {
    var bubbleEl  = document.getElementById('chat-' + data.id),
        pointerEl = document.getElementById('chat-pointer-' + data.id),
        sz        = bubbleEl.offsetWidth,
        half      = sz / 2,
        placeX    = null,
        placeY    = null,
        placePointerX = null,
        placePointerY = null,
        position  = null,
        adjustY   = 3,
        adjustPointerX = 5,
        other     = false

    if (data.id !== $game.$player.id) other = true

    position = (other) ? data.position : $game.$player.getRenderPosition()

    if (position.x > 470) {
      var rem = 940 - position.x;
      if (half > rem) {
        placeX = position.x - half - (half - rem);
      }
      else {
        placeX = position.x - half + 16;
      }
      pointerEl.classList.add('flipped-horizontal')
    }
    else {
      if (half > position.x) {
        placeX = position.x - half + (half - position.x) + 10;
      }
      else {
        placeX = position.x - half + 16;
      }
    }

    placePointerX = position.x + ($game.TILE_SIZE * 1 - adjustPointerX)

    // Vertical position of chat bubble - based on game's tile size.
    // To add further adjustment, edit the adjustY variable.
    // adjustY - positive integers cause it to move up, negative moves down.
    if (position.y <= 1 * $game.TILE_SIZE) {
      // Prevent bubble from appearing above the gameboard if
      // player is standing within the top two rows.
      placeY        = ($game.TILE_SIZE * 2) - adjustY
      placePointerY = ($game.TILE_SIZE * 2) - adjustY - 12
      pointerEl.classList.add('flipped-vertical')
    }
    else {
      placeY        = position.y - ($game.TILE_SIZE * 2 + adjustY)
      placePointerY = position.y - ($game.TILE_SIZE * 1 + adjustY)
    }

    $(bubbleEl).css({
      'top':  placeY,
      'left': placeX
    })
    $(pointerEl).css({
      'top':  placePointerY,
      'left': placePointerX
    })
  }
}
