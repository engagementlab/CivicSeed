var _isChatting = false,
	_hideTimer = null,
	_chatId = null,
	_chatIdSelector = null;

$game.$chat = {
	init: function(callback) {
		_chatId = 'player'+ $game.$player.id;
		_chatIdSelector = '#' + _chatId;
		$gameboard = $('.gameboard');
		callback();
	},

	resetInit: function() {
		_isChatting = false;
		_hideTimer = null;
		_chatId = null;
		_chatIdSelector = null;
	},

  message: function (data) {
    var message = data.message,
        other = false;

		if(data.name !== $game.$player.firstName) {
			other = data;
		}

    var len = message.length + 4,
        fadeTime = len * 150 + 1000,
        sz = Math.floor(len * 8) + 20;
		fadeTime = (fadeTime > 11500) ? 11500 : fadeTime;
		//this was the client's message
		if(!other) {
			if(_isChatting) {
				clearTimeout(_hideTimer);
				$(_chatIdSelector).text('me: '+ message);
			}
			else {
				$gameboard.append('<p class=\'playerChat\' id=' + _chatId + '>me: ' + message + '</p>');
			}
			_hideTimer = setTimeout($game.$chat.hideChat, fadeTime);
			_placeChat(sz);
			_isChatting = true;
		} else {
			len = message.length + other.name.length + 2;
			sz = Math.floor(len * 8) + 20;
			if(other.isChatting) {
				$(other.chatIdSelector).text(other.name+': '+message);
			}
			else {
				$('.gameboard').append('<p class=\'playerChat\' id=' + other.chatId + '>' + other.name +': '+ message + '</p>');
			}
			$game.$audio.playTriggerFx('chatReceive');
			_placeChat(sz, other);
			return fadeTime;
		}
		$game.$log.addMessage(data);
	},

	hideChat: function(other) {
		//remove chat from screen
		clearTimeout(_hideTimer);
		$(_chatIdSelector).fadeOut('fast',function() {
			$(this).remove();
			_isChatting = false;
		});
	}
};

//this places the chat centered above player, or if too big then left/right align with screen edge
function _placeChat(sz, other) {
	var half = sz / 2,
		placeX = null,
		placeY = null,
		position = null,
    adjustY = 0

	if(other) {
		position = other.position;
	} else {
		position = $game.$player.getRenderPosition();
	}

	if(position.x > 470 ) {
		var rem = 940 - position.x;
		if(half > rem) {
			placeX = position.x - half - (half - rem);
		}
		else {
			placeX = position.x - half + 16;
		}
	}
	else {
		if(half > position.x) {
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

	if(other) {
		$(other.chatIdSelector).css({
			'top': placeY,
			'left': placeX,
			'width': sz
		});
	} else {
		$(_chatIdSelector).css({
			'top': placeY,
			'left': placeX,
			'width': sz
		});
	}

}