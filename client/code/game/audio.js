var _soundtracks = [],
	_effects = [],
	_currentTrack = 0,
	_numTracks = 1,
	_numEffects = 0;

$game.$audio = {
	
	ready: false,

	init: function() {
		
		$game.$audio.loadTrack(0);
	},

	loadTrack: function(num) {
		_soundtracks[num] = document.createElement('audio');

		if(num === _numTracks) {
			$game.$audio.loadEffect(0);
		}
		else {

			_soundtracks[num].preload = "auto";
			_soundtracks[num].autobuffer = true;
			_soundtracks[num].loop = true;
			_soundtracks[num].src = 'http://russellgoldenberg.com/civicseed_audio/' + num + '.wav';
			_soundtracks[num].volume = 0.2;
			_soundtracks[num].load();

			_soundtracks[num].addEventListener('canplaythrough', function (e) {
				this.removeEventListener('canplaythrough', arguments.callee, false);
				console.log(num, 'ready to play.');
				num += 1;
				$game.$audio.loadTrack(num);
			},false);
			
			_soundtracks[num].addEventListener('error', function (e) {
				console.log(num, 'error sound');
			}, false);
		}
	},

	loadEffect: function(num) {
		_effects[num] = document.createElement('audio');

		if(num === _numEffects) {
			$game.$audio.ready = true;
		}
		else {

			_effects[num].preload = "auto",
			_effects[num].autobuffer = true,
			_effects[num].src = '/audio/tile.mp3',
			_effects[num].volume = 0.3,
			_effects[num].load();

			_effects[num].addEventListener('canplaythrough', function (e) {
				this.removeEventListener('canplaythrough', arguments.callee, false);
				console.log(num, 'ready to play.');
				num += 1;
				$game.$audio.loadeEffect(num);
			},false);
			
			_effects[num].addEventListener('error', function (e) {
				console.log(num, 'error sound');
			}, false);
		}
	},

	playTheme: function() {
		_soundtracks[_currentTrack].play();
	},

	pauseTheme: function() {
		_soundtracks[_currentTrack].pause();
	},

	playSound: function(i) {
		_effects[i].play();
	},

	slideVolume: function(val) {
		var diff = val - _soundtracks[_currentTrack].volume;
		
		if(diff >= 0) {
			dir = 0.01;
		}
		else {
			dir = -0.01;
		}
		if(Math.abs(diff) > 0.02) {
			if(dir >= 0) {
				_soundtracks[_currentTrack].volume += 0.01;
			}
			else {
				_soundtracks[_currentTrack].volume -= 0.01;
			}
			setTimeout(function() {
				$game.$audio.slideVolume(val);
			}, 50);
		}
		else{
			console.log( _soundtracks[_currentTrack].volume);
		}
	},

	updateSoundtracks: function() {
		//compare player position to centers of the world 
		var pos = $game.$player.getPosition();
		console.log(pos);
	}

};