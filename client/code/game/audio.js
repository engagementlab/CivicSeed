var _soundtracks = [],
	_triggerFx = null,
	_currentTrack = -1,
	_numTracks = 7,
	_tweenTimeout = null,
	_newPlace = 'welcome...',
	_targetV = 0,
	_musicPath = CivicSeed.CLOUD_PATH + '/audio/music/',
	_audioFxPath = CivicSeed.CLOUD_PATH + '/audio/fx/',
	_midTransition = false;

$game.$audio = {

	ready: false,
	isMuted: true,

	init: function(pos) {
		var firstTrack = $game.$audio.whichTrack(pos.x, pos.y);
		console.log(firstTrack);
		if(firstTrack === -1) {
			firstTrack = 4;
		}
		$game.$audio.loadTrack(firstTrack);

	},

	loadTrack: function(num) {
		var mp3 = _musicPath + num + '.mp3?VERSION=' + Math.round(Math.random(1) * 1000000000),
			ogg = _musicPath + num + '.ogg?VERSION=' + Math.round(Math.random(1) * 1000000000);

		_soundtracks[num] = new Howl({
			urls: [mp3, ogg],
			autoplay: true,
			loop: true,
			volume: 0.2,
			buffer: false,
			onload: function() {
				//this goes thru all the tracks, and skips num since its preloaded
				$game.$audio.loadOtherTrack(0, num);
				$game.$audio.loadTriggerFx();
				_currentTrack = num;
			}
		});
	},
	loadOtherTrack: function(track, num) {
		console.log(track, num);
		if(track !== num) {
			var mp3 = _musicPath + track + '.mp3?VERSION=' + Math.round(Math.random(1) * 1000000000),
				ogg = _musicPath + track + '.ogg?VERSION=' + Math.round(Math.random(1) * 1000000000);
			_soundtracks[track] = new Howl({
				urls: [mp3, ogg],
				autoplay: false,
				loop: true,
				volume: 0.0,
				buffer: false,
				onload: function() {
					track++;
					if(track !== _numTracks) {
						$game.$audio.loadOtherTrack(track, num);
					}
				}
			});
		} else {
			track++;
			if(track !== _numTracks) {
				$game.$audio.loadOtherTrack(track, num);
			}
		}
	},

	loadTriggerFx: function() {
		var mp3 = _musicPath + 'triggers.mp3?VERSION=' + Math.round(Math.random(1) * 1000000000),
			ogg = _musicPath +'triggers.ogg?VERSION=' + Math.round(Math.random(1) * 1000000000);
		_triggerFx = new Howl({
			urls: [mp3, ogg],
			sprite: {
				chatSend: [0, 500],
				chatReceive: [1000,1300],
				npcBubble: [3000, 300],
				windowShow: [4000, 400],
				seedDrop: [5000, 500],
				riddleDrop1: [6000, 700],
				riddleDrop2: [7000, 700],
				riddleDrop3: [8000, 700],
				riddleDrop4: [9000, 700],
				resourceRight: [10000, 500],
				resourceWrong: [11000, 700],
				puzzleRight: [12000, 1200],
				puzzleWrong: [14000, 700],
				pieceSelect: [15000, 300],
				pieceDrop: [16000, 200]
			},
			volume: 0.8,
			onload: function() {
				console.log('fx loaded');
				$game.$audio.ready = true;
			}
		});
	},
	// loadTrack: function(num) {
	// 	_soundtracks[num] = document.createElement('audio');

	// 	if(num === _numTracks) {
	// 		$game.$audio.loadEffect(0);
	// 	}
	// 	else {

	// 		_soundtracks[num].preload = "auto";
	// 		_soundtracks[num].autobuffer = true;
	// 		_soundtracks[num].loop = true;
	// 		if(CivicSeed.ENVIRONMENT === 'development') {
	// 			_soundtracks[num].src = Modernizr.audio.ogg ? _musicPath + num + '.wav?VERSION=' + Math.round(Math.random(1) * 1000000000):
	// 									_musicPath + num + '.wav?VERSION=' + Math.round(Math.random(1) * 1000000000);
	// 		} else {
	// 			_soundtracks[num].src = Modernizr.audio.wav ? _musicPath + num + '.wav?VERSION=' + CivicSeed.VERSION:
	// 									_musicPath + num + '.wav?VERSION=' + CivicSeed.VERSION;
	// 		}
	// 		_soundtracks[num].volume = 0;
	// 		_soundtracks[num].load();

	// 		_soundtracks[num].addEventListener('canplaythrough', function (e) {
	// 			this.removeEventListener('canplaythrough', arguments.callee, false);
	// 			num += 1;
	// 			$game.$audio.loadTrack(num);
	// 		},false);
			
	// 		_soundtracks[num].addEventListener('error', function (e) {
	// 			console.log(num, 'error sound');
	// 		}, false);
	// 	}
	// },

	// loadEffect: function(num) {
	// 	_effects[num] = document.createElement('audio');

	// 	if(num === _numEffects) {
	// 		$game.$audio.ready = true;
	// 	}
	// 	else {
	// 		if(CivicSeed.ENVIRONMENT === 'development') {
	// 			_effects[num].src = Modernizr.audio.ogg ? _audioFxPath + num + '.ogg?VERSION=' + Math.round(Math.random(1) * 1000000000):
	// 								_audioFxPath + num  + '.mp3?VERSION' + Math.round(Math.random(1) * 1000000000);

	// 		} else {
	// 			_effects[num].src = Modernizr.audio.ogg ? _audioFxPath + num + '.ogg?VERSION=' + CivicSeed.VERSION:
	// 								_audioFxPath + num  + '.mp3?VERSION' + CivicSeed.VERSION;
	// 		}
	// 		_effects[num].preload = "auto",
	// 		_effects[num].autobuffer = true,
	// 		_effects[num].volume = 0.4,
	// 		_effects[num].load();
	// 		_effects[num].addEventListener('canplaythrough', function (e) {
	// 			this.removeEventListener('canplaythrough', arguments.callee, false);
	// 			//console.log(num, 'ready to play.');
	// 			num += 1;
	// 			$game.$audio.loadEffect(num);
	// 		},false);
			
	// 		_effects[num].addEventListener('error', function (e) {
	// 			console.log(num, 'error sound');
	// 		}, false);
	// 	}
	// },

	playTheme: function() {
		_soundtracks[_currentTrack].play();
	},

	pauseTheme: function() {
		_soundtracks[_currentTrack].pause();
	},

	playTriggerFx: function(fx) {
		console.log(fx);
		_triggerFx.play(fx);
	},

	switchTrack: function(swap) {
		if(_soundtracks[swap] && !_midTransition) {
			_midTransition = true;
			_soundtracks[_currentTrack].fadeOut(0, 2000, function() {
				this.stop();
				_currentTrack = swap;
				_soundtracks[swap].fadeIn(0.2, 2000, function() {
					_midTransition = false;
				});	
			});
		}
	},

	update: function(posX, posY) {
		var trackNum = $game.$audio.whichTrack(posX, posY);
		console.log(trackNum);
		if(trackNum > -1) {
			$game.$audio.switchTrack(trackNum);	
		}
		
	},

	whichTrack: function(posX, posY) {
		//compare player position to centers of the world
		var diffX = posX - $game.TOTAL_WIDTH / 2,
			diffY = posY - $game.TOTAL_HEIGHT / 2,
			trackRegion = null,
			absX = Math.abs(diffX),
			absY = Math.abs(diffY);

		var closest;
		//check for gnome/s place first
		if(posX >= 57 && posX <= 84 && posY >= 66 && posY <= 78) {
			trackRegion = 5;
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
		
		return trackRegion;
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