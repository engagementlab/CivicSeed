'use strict';

var _hideTimer = null

var $chat = $game.$chat = {

  playerId: null,

  init: function (callback) {
    this.playerId = 'player' + $game.$player.id
    _chat.flag(false)
    callback()
  },

  resetInit: function () {
    _hideTimer = null
  },

  message: function (data) {
    var gameboard = document.getElementById('gameboard'),
        message   = data.message,
        other     = false,
        len       = message.length + 4,
        fadeTime  = len * 150 + 1000,
        sz        = Math.floor(len * 8) + 20

    // Set maximum display time of message
    fadeTime = (fadeTime > 11500) ? 11500 : fadeTime

    // See if message is from current player or another player
    if (data.name !== $game.$player.firstName) other = data

    //this was the client's message
    if (!other) {
      if (_chat.flag() === true) {
        clearTimeout(_hideTimer);
        document.getElementById('chat-' + this.playerId).innerText = 'me: '+ message
      }
      else {
        $(gameboard).append('<p class=\'playerChat\' id=chat-' + this.playerId + '>me: ' + message + '</p>');
      }
      _hideTimer = setTimeout($chat.hideChat, fadeTime);
      _chat.place(sz);
      _chat.flag(true)
    }
    else {
      len = message.length + other.name.length + 2;
      sz = Math.floor(len * 8) + 20;
      if(other.isChatting) {
        document.getElementById('chat-' + other.chatId).innerText = other.name + ': '+ message
      }
      else {
        $(gameboard).append('<p class=\'playerChat\' id=chat-' + other.chatId + '>' + other.name +': '+ message + '</p>');
      }
      $game.$audio.playTriggerFx('chatReceive');
      _chat.place(sz, other);
      return fadeTime;
    }

    $game.$log.addMessage(data)
  },

  // Remove chat from screen
  hideChat: function (other) {
    clearTimeout(_hideTimer)

    var el = document.getElementById('chat-' + $chat.playerId)
    console.log(el)

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
  place: function (sz, other) {
    var half     = sz / 2,
        placeX   = null,
        placeY   = null,
        position = null,
        adjustY  = 0

    if (other) {
      position = other.position;
    }
    else {
      position = $game.$player.getRenderPosition();
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

    if (other) {
      $(other.chatIdSelector).css({
        'top': placeY,
        'left': placeX,
        'width': sz
      });
    } else {
      var el = document.getElementById('chat-' + $chat.playerId)
      $(el).css({
        'top': placeY,
        'left': placeX,
        'width': sz
      });
    }
  }
}
