'use strict';

var $gameLog,
    _unread,
    _maxItems = 50,
    _numItems = 0;

var $log = $game.$log = {

	ready: false,

	init: function(callback) {
		_setupDomSelectors();
		$game.$log.clearUnread();
		$game.$log.ready = true;
		$game.statusUpdate({message: 'Welcome to Civic Seed', input: 'status', log: true, screen: false});
		callback();
	},

	resetInit: function() {
		_unread = null;
		_maxItems = 50;
		_numItems = 0;
		$game.$log.ready = false;
	},

	//add message to game log
	addMessage: function(data) {
		//update unread messages icon number
		if($game.$log.ready) {
			_unread++;
			_numItems++;
			var hudText = _unread;
			if(_unread > 10) {
				hudText = '10+';
				$game.statusUpdate({message: 'There are new messages in your game log below', input: 'status', log: false, screen: true});
			}

      $game.setBadgeCount('.logButton', hudText)

			var	date = Date(),
				displayDate = date.substring(0,10) + date.substring(15,24),
				html;
			if(data.input === 'chat') {
				html = '<p class="globalChat"><span class="date">' + displayDate + '</span>';
				html += '<span class="playerName">' + data.name + ': </span>' + data.message + '</p>';
			} else {
				html = '<p class="status"><span class="date">' + displayDate + '</span>';
				html += data.message + '</p>';
			}
			if(_numItems > _maxItems) {
				$('.gameLog p').last().remove();
			}
			$gameLog.prepend(html);
			// $gameLog.scrollTop($gameLog[0].scrollHeight);
			// $gameLog.scrollTop(0);
		}

	},

	clearUnread: function() {
    $game.setBadgeCount('.logButton', 0)
		_unread = 0;
	}
};

function _setupDomSelectors() {
	$gameLog = $('.gameLog');
}
