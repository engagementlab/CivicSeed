var _soundtracks = [],
	_triggerFx = null,
	_environmentFx = null,
	_currentTrack = -1,
	_prevTrack = -1,
	_numTracks = 7,
	_tweenTimeout = null,
	_newPlace = 'welcome...',
	_targetV = 0,
	_musicPath = CivicSeed.CLOUD_PATH + '/audio/music/',
	_audioFxPath = CivicSeed.CLOUD_PATH + '/audio/fx/',
	_midTransition = false,
	_extension = null,
	_environmentFxPlaces = [
		{places: [{sound: 'stream',locations: [{x: 50, y: 50}], prox: 10, playing: false}]},
		{places: [{sound: 'stream',locations: [{x: 50, y: 50}], prox: 10, playing: false}]},
		{places: [{sound: 'stream',locations: [{x: 50, y: 50}], prox: 10, playing: false}]},
		{places: [{sound: 'stream',locations: [{x: 50, y: 50}], prox: 10, playing: false}]}
	];

$game.$audio = {

	ready: false,
	isMuted: false,

	init: function(pos) {
		if(CivicSeed.ENVIRONMENT !== 'development') {
			_extension = CivicSeed.version;
		}
		var firstTrack = $game.$audio.whichTrack(pos.x, pos.y);
		console.log(firstTrack);
		if(firstTrack === -1) {
			firstTrack = 4;
		}
		$game.$audio.loadTrack(firstTrack);

	},

	loadTrack: function(num) {
		var mp3 = _musicPath + num + '.mp3?VERSION=',
			ogg = _musicPath + num + '.ogg?VERSION=';

		if(_extension) {
			mp3 += _extension;
			ogg += _extension;
		} else {
			mp3 += Math.round(Math.random(1) * 1000000000),
			ogg += Math.round(Math.random(1) * 1000000000);
		}

		_soundtracks[num] = new Howl({
			urls: [mp3, ogg],
			autoplay: true,
			loop: true,
			volume: 0.2,
			buffer: true
			// onload: function() {
			// 	//this goes thru all the tracks, and skips num since its preloaded
			// 	console.log('loaded first track: ', num);
			// 	$game.$audio.loadOtherTrack(0, num);
			// 	$game.$audio.loadTriggerFx();
			// 	_currentTrack = num;
			// }
		});
		//this goes thru all the tracks, and skips num since its preloaded
		console.log('loaded first track: ', num);
		$game.$audio.loadOtherTrack(0, num);
		$game.$audio.loadTriggerFx();
		_currentTrack = num;
	},

	loadOtherTrack: function(track, num) {
		if(track !== num) {
			var mp3 = _musicPath + track + '.mp3?VERSION=' + Math.round(Math.random(1) * 1000000000),
				ogg = _musicPath + track + '.ogg?VERSION=' + Math.round(Math.random(1) * 1000000000);
			_soundtracks[track] = new Howl({
				urls: [mp3, ogg],
				autoplay: false,
				loop: true,
				volume: 0.0,
				buffer: true
				// onload: function() {
				// 	console.log('loaded track: ', track);
				// 	track++;
				// 	if(track !== _numTracks) {
				// 		$game.$audio.loadOtherTrack(track, num);
				// 	}
				// }
			});
			console.log('loaded track: ', track);
			track++;
			if(track !== _numTracks) {
				$game.$audio.loadOtherTrack(track, num);
			}
		} else {
			track++;
			if(track !== _numTracks) {
				$game.$audio.loadOtherTrack(track, num);
			}
		}
	},

	loadTriggerFx: function() {
		var mp3 = _musicPath + 'triggers.mp3?VERSION=',
			ogg = _musicPath +'triggers.ogg?VERSION=';
		if(_extension) {
			mp3 += _extension;
			ogg += _extension;
		} else {
			mp3 += Math.round(Math.random(1) * 1000000000),
			ogg += Math.round(Math.random(1) * 1000000000);
		}
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
				console.log('sound fx loaded');
				$game.$audio.loadEnvironmentFx();
			}
		});
	},

	loadEnvironmentFx: function() {
		var mp3 = _musicPath + 'environment.mp3?VERSION=',
			ogg = _musicPath +'environment.ogg?VERSION=';
		if(_extension) {
			mp3 += _extension;
			ogg += _extension;
		} else {
			mp3 += Math.round(Math.random(1) * 1000000000),
			ogg += Math.round(Math.random(1) * 1000000000);
		}
		_environmentFx = new Howl({
			urls: [mp3, ogg],
			sprite: {
				stream: [0, 5100]
			},
			volume: 0.5,
			onload: function() {
				console.log('environment fx loaded');
				$game.$audio.ready = true;
			}
		});
	},

	playTriggerFx: function(fx) {
		console.log(fx);
		_triggerFx.play(fx);
	},

	playEnvironmentFx: function(fx) {
		console.log(fx);
		_environmentFx.play(fx);
	},

	update: function(posX, posY) {
		var trackNum = $game.$audio.whichTrack(posX, posY);
		$game.statusUpdate(_newPlace);
		console.log('new:', trackNum, 'cur: ', _currentTrack, _soundtracks[trackNum]._loaded);
		if(_soundtracks[trackNum]._loaded && trackNum !== _currentTrack && !_midTransition) {
			$game.$audio.switchTrack(trackNum);
		}
		$game.$audio.checkEnvironmentFx(trackNum, posX, posY);
	},

	checkEnvironmentFx: function(level, posX, posY) {
		if(level < 4) {
			var numPlaces = _environmentFxPlaces[level].places.length,
				p = 0;

			while(p < numPlaces) {
				var place = _environmentFxPlaces[p].places[p];
				var dist = Math.abs(posX - place.locations[0].x) + Math.abs(posY - place.locations[0].y);

				//check to see if in proximity
				if(dist < place.prox && !place.playing) {
					place.playing = true;
					$game.$audio.playEnvironmentFx(place.sound);
				}
				p++;
			}
		}
	},

	switchTrack: function(swap) {
		console.log('yannnnnkeeeeee swap', _midTransition);
		_midTransition = true;
		_prevTrack = _currentTrack;
		_soundtracks[_currentTrack].fadeOut(0, 1000, function() {
			console.log('pause: ', _prevTrack);
			_soundtracks[_prevTrack].pause();
		});
		_currentTrack = swap;
		_soundtracks[swap].fadeIn(0.2, 3000, function(swap) {
			_midTransition = false;
			console.log('fadeddd', _midTransition);
		});
	},

	whichTrack: function(posX, posY) {
		//compare player position to centers of the world
		var diffX = posX - $game.TOTAL_WIDTH / 2,
			diffY = posY - $game.TOTAL_HEIGHT / 2,
			trackRegion = null,
			absX = Math.abs(diffX),
			absY = Math.abs(diffY);

		//check for gnome/s place first
		if(posX >= 57 && posX <= 84 && posY >= 66 && posY <= 78) {
			trackRegion = 5;
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
		}

		return trackRegion;
	},

	toggleMute: function() {
		$game.$audio.isMute = $game.$audio.isMute ? false: true;
		if($game.$audio.isMute) {
			_soundtracks[_currentTrack].volume(0);
		}
		else {
			_soundtracks[_currentTrack].volume(0.2);
		}
		return $game.$audio.isMute;
	}

};