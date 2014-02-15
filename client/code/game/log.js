'use strict';

var _unread,
    _maxItems = 50,
    _numItems = 0;

var $log = $game.$log = {

  ready: false,

  init: function (callback) {
    $game.$log.ready = true
    $game.log('Welcome to Civic Seed')
    $game.$log.clearUnread()
    callback()
  },

	resetInit: function () {
		_unread = null;
		_maxItems = 50;
		_numItems = 0;
		$game.$log.ready = false;
	},

	//add message to game log
	addMessage: function (data) {
    var el = document.getElementById('game-log')

		//update unread messages icon number
		if ($game.$log.ready) {

      if ($(el).is(':visible')) {
        _unread++;
        _numItems++;
        var hudText = _unread;
        if (_unread > 10) {
          hudText = '10+';
          $game.alert('There are new messages in your game log below');
        }

        $game.setBadgeCount('.hud-log-button', hudText)
      }

			var	date = Date(),
				displayDate = date.substring(0,10) + date.substring(15,24),
				html;
			if (data.input === 'chat') {
				html = '<p class="globalChat"><span class="date">' + displayDate + '</span>';
				html += '<span class="playerName">' + data.name + ': </span>' + data.message + '</p>';
			}
      else {
				html = '<p class="status"><span class="date">' + displayDate + '</span>';
				html += data.message + '</p>';
			}
			if (_numItems > _maxItems) {
				$('#game-log p').last().remove();
				$('#game-log-overlay p').first().remove()
			}
			$(el).prepend(html);

      // Add to game log overlay and scroll it
      var overlay = document.getElementById('game-log-overlay')
      overlay.innerHTML += html
      overlay.scrollTop = overlay.scrollHeight
		}

	},

	clearUnread: function () {
    $game.setBadgeCount('.hud-log-button', 0)
		_unread = 0;
	}
}
