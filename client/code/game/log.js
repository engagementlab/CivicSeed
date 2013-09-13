var $gameLog,
	$hudCount,

	_unread,
	_maxItems = 50,
	_numItems = 0;

$game.$log = {
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
			}
			$hudCount.text(hudText).removeClass('hide');
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
		$hudCount.text(_unread).addClass('hide');
		_unread = 0;
		$hudCount.text(_unread);
	}
};

function _setupDomSelectors() {
	$gameLog = $('.gameLog');
	$hudCount = $('.logButton .hudCount');
}