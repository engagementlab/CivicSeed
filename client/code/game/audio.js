var _soundtracks = [],
	_effects = [],
	_currentTrack = 0,
	_numTracks = 5,
	_numEffects = 0,
	_tweenTimeout = null;

$game.$audio = {
	
	ready: false,

	init: function() {
		$game.$audio.ready = true;
		//$game.$audio.loadTrack(0);
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
				_soundtracks[num].src = '/audio/music/' + num + '.wav?VERSION=' + Math.round(Math.random(1) * 1000000000);
			} else {
				_soundtracks[num].src = '/audio/music/' + num + '.wav?VERSION=' + CivicSeed.VERSION;
			}
			_soundtracks[num].volume = 0.0;
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
			_effects[num].volume = 0.4,
			_effects[num].load();

			_effects[num].addEventListener('canplaythrough', function (e) {
				this.removeEventListener('canplaythrough', arguments.callee, false);
				//console.log(num, 'ready to play.');
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

	slideVolume: function(val, swap) {
		//that means we aren't changing tracks, so just transition volume
		if(swap < 0) {
			

			$(_soundtracks[_currentTrack]).stop(true,true).animate({
				volume: val
			}, 2000, function() {
				
			});
		}
		//slide current track to 0, then use val to transition new track
		else {
			
			$(_soundtracks[_currentTrack]).stop(true,true).animate({
				volume: 0
			}, 1000, function() {
				$game.$audio.pauseTheme();
				
				_currentTrack = swap;
				$game.$audio.playTheme();
				$(_soundtracks[_currentTrack]).stop(true,true).animate({
					volume: val
				}, 2000, function() {
					
				});
			});
		}
		
		// var diff = val - _soundtracks[_currentTrack].volume;
		
		// if(diff >= 0) {
		// 	dir = 0.001;
		// }
		// else {
		// 	dir = -0.001;
		// }
		// if(Math.abs(diff) > 0.01) {
		// 		_soundtracks[_currentTrack].volume += dir;
		// 		tweenTimeout = setTimeout(function() {
		// 		$game.$audio.slideVolume(val, nextVal, swap);
		// 	}, 5);
		// }
		// else{
		// 	console.log('end:',swap);
		// 	if(swap > - 1) {
		// 		_soundtracks[_currentTrack].pause();
		// 		_currentTrack = swap;
		// 		console.log('current', _currentTrack);
		// 		_soundtracks[_currentTrack].volume = 0;
		// 		_soundtracks[_currentTrack].play();
		// 		$game.$audio.slideVolume(nextVal, false, -1);
		// 	}
		// }
		
	},

	update: function(posX, posY) {
	
		//compare player position to centers of the world 
		//var pos = $game.$player.getPosition();
		var diffX = posX - $game.TOTAL_WIDTH / 2,
			diffY = posY - $game.TOTAL_HEIGHT / 2,
			trackRegion = null,
			absX = Math.abs(diffX),
			absY = Math.abs(diffY);

		var closest, targetV;
		//check for gnome/s place first
		if(posX >= 57 && posX <= 84 && posY >= 66 && posY <= 78) {
			trackRegion = 4;
			targetV = .4;
		}
		else {
			//3 bottom right
			if(diffX > 0 && diffY > 0) {
				trackRegion = 2;
			}
			//2 top right
			else if(diffX > 0 && diffY < 0) {
				trackRegion = 1;
			}
			//1 top left
			else if(diffX < 0 && diffY < 0) {
				trackRegion = 0;
			}
			//4 bottom left
			else if(diffX < 0 && diffY > 0) {
				trackRegion = 3;
			}
			//no man/s land
			else {
				trackRegion = 4;
			}
			if (absX < absY) {
				closest = absX;
			}
			else {
				closest = absY;
			}

			if(closest < 30) {
				targetV = closest * 0.01;
			}
			else {
				targetV = 0.4;
			}
		}

		trackRegion = trackRegion === _currentTrack ? -1 : trackRegion;
		
		$game.$audio.slideVolume(targetV, trackRegion);

	}

};