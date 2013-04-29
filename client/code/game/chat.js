var _isChatting = false,
	_hideTimer = null,
	_chatId = null,
	_chatIdSelector = null;

$game.$chat = {
	init: function(callback) {
		_chatId = 'player'+ $game.$player.id,
		_chatIdSelector = '#' + _chatId;
		$gameboard = $('.gameboard');
		callback();
	},

	message: function(message, other) {
		var len = message.length + 4,
			fadeTime = len * 150 + 1000,
			sz = Math.floor(len * 8) + 10;
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
			sz = Math.floor(len * 8) + 10;
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

function _placeChat(sz, other) {
	var half = sz / 2,
		placeX = null,
		position = null;

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
	if(other) {
		$(other.chatIdSelector).css({
			'top': position.y - 72,
			'left': placeX,
			'width': sz
		});
	} else {
		$(_chatIdSelector).css({
			'top': position.y - 72,
			'left': placeX,
			'width': sz
		});
	}
	
}