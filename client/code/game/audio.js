var _soundtracks = [],
	_effects = [],
	_currentTrack = 0,
	_numTracks = 5,
	_numEffects = 1,
	_tweenTimeout = null,
	_newPlace = 'welcome...',
	_targetV = 0,
	_musicPath = CivicSeed.CLOUD_PATH + '/audio/music/',
	_audioFxPath = CivicSeed.CLOUD_PATH + '/audio/fx/';

$game.$audio = {
	
	ready: false,
	isMuted: true,

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
			if(CivicSeed.ENVIRONMENT === 'development') {
				_soundtracks[num].src = Modernizr.audio.ogg ? _musicPath + num + '.wav?VERSION=' + Math.round(Math.random(1) * 1000000000):
										_musicPath + num + '.wav?VERSION=' + Math.round(Math.random(1) * 1000000000);
			} else {
				_soundtracks[num].src = Modernizr.audio.wav ? _musicPath + num + '.wav?VERSION=' + CivicSeed.VERSION:
										_musicPath + num + '.wav?VERSION=' + CivicSeed.VERSION;
			}
			_soundtracks[num].volume = 0;
			_soundtracks[num].load();

			_soundtracks[num].addEventListener('canplaythrough', function (e) {
				this.removeEventListener('canplaythrough', arguments.callee, false);
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
			if(CivicSeed.ENVIRONMENT === 'development') {
				_effects[num].src = Modernizr.audio.ogg ? _audioFxPath + num + '.ogg?VERSION=' + Math.round(Math.random(1) * 1000000000):
									_audioFxPath + num  + '.mp3?VERSION' + Math.round(Math.random(1) * 1000000000);

			} else {
				_effects[num].src = Modernizr.audio.ogg ? _audioFxPath + num + '.ogg?VERSION=' + CivicSeed.VERSION:
									_audioFxPath + num  + '.mp3?VERSION' + CivicSeed.VERSION;
			}
			_effects[num].preload = "auto",
			_effects[num].autobuffer = true,
			_effects[num].volume = 0.4,
			_effects[num].load();
			_effects[num].addEventListener('canplaythrough', function (e) {
				this.removeEventListener('canplaythrough', arguments.callee, false);
				//console.log(num, 'ready to play.');
				num += 1;
				$game.$audio.loadEffect(num);
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

	slideVolume: function(val, swap) {
		//that means we aren't changing tracks, so just transition volume
		if(swap < 0) {
			$(_soundtracks[_currentTrack]).stop(true,true).animate({
				// volume: val
				volume: 0
			}, 2000, function() {
				
			});
		}
		//slide current track to 0, then use val to transition new track
		else {
			$game.statusUpdate(_newPlace);
			$(_soundtracks[_currentTrack]).stop(true,true).animate({
				volume: 0
			}, 1000, function() {
				$game.$audio.pauseTheme();
				
				_currentTrack = swap;
				$game.$audio.playTheme();
				$(_soundtracks[_currentTrack]).stop(true,true).animate({
					// volume: val
					volume: 0
				}, 2000, function() {
					
				});
			});
		}
	},

	update: function(posX, posY) {
	
		//compare player position to centers of the world
		//var pos = $game.$player.getPosition();
		var diffX = posX - $game.TOTAL_WIDTH / 2,
			diffY = posY - $game.TOTAL_HEIGHT / 2,
			trackRegion = null,
			absX = Math.abs(diffX),
			absY = Math.abs(diffY);

		var closest;
		//check for gnome/s place first
		if(posX >= 57 && posX <= 84 && posY >= 66 && posY <= 78) {
			trackRegion = 4;
			_targetV = 0.4;
			_newPlace = 'entering the botanist\'s garden';
		}
		else {
			//3 bottom right
			if(diffX > 0 && diffY > 0) {
				trackRegion = 2;
				_newPlace = 'entering the ranch';
			}
			//2 top right
			else if(diffX > 0 && diffY < 0) {
				trackRegion = 1;
				_newPlace = 'entering the town';
			}
			//1 top left
			else if(diffX < 0 && diffY < 0) {
				trackRegion = 0;
				_newPlace = 'entering the forest';
			}
			//4 bottom left
			else if(diffX < 0 && diffY > 0) {
				trackRegion = 3;
				_newPlace = 'entering the port';
			}
			//no man/s land
			else {
				trackRegion = 4;
				_newPlace = 'you are on the equator';
			}
			if (absX < absY) {
				closest = absX;
			}
			else {
				closest = absY;
			}

			if(closest < 30) {
				_targetV = closest * 0.01;
			}
			else {
				_targetV = 0.4;
			}
		}

		trackRegion = trackRegion === _currentTrack ? -1 : trackRegion;
		
		$game.changeStatus();
		$game.$audio.slideVolume(_targetV, trackRegion);

	},

	toggleMute: function() {
		$game.$audio.isMute = $game.$audio.isMute ? false: true;
		if($game.$audio.isMute) {
			_soundtracks[_currentTrack].volume = 0;
		}
		else {
			_soundtracks[_currentTrack].volume = _targetV;
		}
		return $game.$audio.isMute;
	}

};