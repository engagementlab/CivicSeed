'use strict';

var _hideTimer = null

var $chat = $game.$chat = {

  init: function (callback) {
    _chat.flag(false)
    callback()
  },

  resetInit: function () {
    _hideTimer = null
  },

  message: function (data) {
    var gameboard = document.getElementById('gameboard'),
        bubble    = document.getElementById('chat-' + data.id),
        name      = 'me',
        message   = data.message,
        other     = false

    // See if message is from current player or another player
    if (data.id !== $game.$player.id) {
      other = true
      name  = data.name
    }

    // Set some appearance vars
    var len       = message.length + name.length + 2,
        fadeTime  = Math.min(len * 150 + 1000, 11500),
        sz        = Math.floor(len * 8) + 20

    // Clear previous timeout, if any
    clearTimeout(_hideTimer)

    // Re-use the existing element or create a new one, if not present
    if (bubble) {
      bubble.innerText = name + ': '+ message
    }
    else {
      $(gameboard).append('<p class=\'player-chat\' id="chat-' + data.id + '">' + name +': '+ message + '</p>')
    }

    // Setup a timer to hide the message after some time
    _hideTimer = setTimeout(function () {
      $chat.hideChat(data)
    }, fadeTime)

    // Place the chat bubble
    _chat.place(sz, data)

    //
    if (other) {
      $game.$audio.playTriggerFx('chatReceive')
    }
    else {
      _chat.flag(true)
    }

    // Add the message to the log
    $game.$log.addMessage(data)
  },

  // Remove chat from screen
  hideChat: function (data) {
    if (!data) data = { id: $game.$player.id }
    var el = document.getElementById('chat-' + data.id)

    clearTimeout(_hideTimer)

    $(el).fadeOut('fast',function() {
      $(this).remove()
      _chat.flag(false)
    })
  }
}

var _chat = {

  flag: function (bool) {
    if (bool === true) {
      $game.$player.setFlag('chatting')
      return true
    }
    else if (bool === false) {
      $game.$player.removeFlag('chatting')
      return false
    }
    return $game.$player.checkFlag('chatting')
  },

  //this places the chat centered above player, or if too big then left/right align with screen edge
  place: function (sz, data) {
    var half     = sz / 2,
        placeX   = null,
        placeY   = null,
        position = null,
        adjustY  = 0,
        other    = false

    if (data.id !== $game.$player.id) other = true

    if (other) {
      position = data.position;
    }
    else {
      position = $game.$player.getRenderPosition()
    }

    if (position.x > 470 ) {
      var rem = 940 - position.x;
      if (half > rem) {
        placeX = position.x - half - (half - rem);
      }
      else {
        placeX = position.x - half + 16;
      }
    }
    else {
      if (half > position.x) {
        placeX = position.x - half + (half - position.x) + 10;
      }
      else {
        placeX = position.x - half + 16;
      }
    }

    // Vertical position of chat bubble - based on game's tile size.
    // To add further adjustment, edit the adjustY variable.
    // adjustY - positive integers cause it to move up, negative moves down.
    if (position.y <= 1 * $game.TILE_SIZE) {
      // Prevent bubble from appearing above the gameboard if
      // player is standing within the top two rows.
      placeY = $game.TILE_SIZE - adjustY
    }
    else {
      placeY = position.y - ($game.TILE_SIZE * 2 + adjustY)
    }

    var el = document.getElementById('chat-' + data.id)
    $(el).css({
      'top': placeY,
      'left': placeX,
      'width': sz
    })
  }
}
