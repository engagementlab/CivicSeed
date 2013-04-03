var _soundtracks = [],
	_triggerFx = null,
	_environmentLoopFx = null,
	_environmentOnceFx = null,
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
	_environmentLoopFxPlaces = [
		{places: [
			{sound: 'stream',locations: [{x: 30, y: 35}], prox: 10, playing: false}
		]},
		{places: [
			{sound: 'stream',locations: [{x: 30, y: 35}], prox: 10, playing: false}
		]},
		{places: [
			{sound: 'stream',locations: [{x: 30, y: 35}], prox: 10, playing: false}
		]},
		{places: [
			{sound: 'stream',locations: [{x: 30, y: 35}], prox: 10, playing: false}
		]}
	],
	_environmentOnceFxPlaces = [
		{places: [
			{location: {x: 50, y: 50}, sounds: ['trek', 'neo', 'bigger', 'dude'], prox: 100, chance: 0.15}
		]},
		{places: [
			{location: {x: 50, y: 50}, sounds: ['trek', 'neo', 'bigger', 'dude'], prox: 100, chance: 0.1}
		]},
		{places: [
			{location: {x: 50, y: 50}, sounds: ['trek', 'neo', 'bigger', 'dude'], prox: 100, chance: 0.1}
		]},
		{places: [
			{location: {x: 50, y: 50}, sounds: ['trek', 'neo', 'bigger', 'dude'], prox: 100, chance: 0.1}
		]}
	],
	_currentLoop = null,
	_currentPos = null;

$game.$audio = {

	ready: false,
	isMuted: false,

	init: function(pos) {
		if(CivicSeed.ENVIRONMENT !== 'development') {
			_extension = CivicSeed.version;
		}
		var firstTrack = $game.$audio.whichTrack(pos.x, pos.y);
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
				$game.$audio.loadEnvironmentLoopFx();
			}
		});
	},

	loadEnvironmentLoopFx: function() {
		var mp3 = _musicPath + 'environmentLoop.mp3?VERSION=',
			ogg = _musicPath +'environmentLoop.ogg?VERSION=';
		if(_extension) {
			mp3 += _extension;
			ogg += _extension;
		} else {
			mp3 += Math.round(Math.random(1) * 1000000000),
			ogg += Math.round(Math.random(1) * 1000000000);
		}
		_environmentLoopFx = new Howl({
			urls: [mp3, ogg],
			sprite: {
				stream: [0, 5100]
			},
			loop: true,
			onend: function() {
				$game.$audio.checkLoopExit();
			},
			volume: 0.3,
			onload: function() {
				console.log('environment loop fx loaded');
				$game.$audio.loadEnvironmenOnceFx();
			}
		});
	},
	loadEnvironmenOnceFx: function() {
		var mp3 = _musicPath + 'environmentOnce.mp3?VERSION=',
			ogg = _musicPath +'environmentOnce.ogg?VERSION=';
		if(_extension) {
			mp3 += _extension;
			ogg += _extension;
		} else {
			mp3 += Math.round(Math.random(1) * 1000000000),
			ogg += Math.round(Math.random(1) * 1000000000);
		}
		_environmentOnceFx = new Howl({
			urls: [mp3, ogg],
			sprite: {
				trek: [0,1300],
				neo: [2000, 2500],
				bigger: [5000, 5300],
				dude: [11000,2400]
			},
			volume: 0.4,
			onend: function() {
			},
			onload: function() {
				$game.$audio.ready = true;
				console.log('environment once fx loaded');
			}
		});
	},

	playTriggerFx: function(fx) {
		_triggerFx.play(fx);
	},

	playEnvironmentLoopFx: function(fx) {
		_environmentLoopFx.play(fx);
	},

	playEnvironmentOnceFx: function(fx) {
		_environmentOnceFx.play(fx);
	},

	update: function(posX, posY) {
		_currentPos = {x: posX, y: posY};
		var trackNum = $game.$audio.whichTrack(posX, posY);
		$game.statusUpdate(_newPlace);
		console.log('new:', trackNum, 'cur: ', _currentTrack, _soundtracks[trackNum]._loaded);
		if(_soundtracks[trackNum]._loaded && trackNum !== _currentTrack && !_midTransition) {
			$game.$audio.switchTrack(trackNum);
		}
		if(!_currentLoop) {
			$game.$audio.checkEnvironmentLoopFx(trackNum);
		}
		$game.$audio.checkEnvironmentOnceFx(trackNum);
	},

	checkEnvironmentLoopFx: function(level) {
		if(level < 4) {
			var numPlaces = _environmentLoopFxPlaces[level].places.length,
				p = 0;

			while(p < numPlaces) {
				var place = _environmentLoopFxPlaces[level].places[p],
					numLocations = place.locations.length,
					l = 0,
					insideRange = false;

				while(l < numLocations) {
					var inProx = $game.$audio.getProximity(place.locations[l], place.prox);
						if(inProx) {
							_currentLoop = place;
							$game.$audio.playEnvironmentLoopFx(place.sound);
							//get out of BOTH loops
							l = numLocations;
							p = numPlaces;
						}
					l++;
				}
				p++;
			}
		}
	},

	checkEnvironmentOnceFx: function(level) {
		if(level < 4) {
			var numPlaces = _environmentOnceFxPlaces[level].places.length,
				p = 0;

			while(p < numPlaces) {
				var place = _environmentOnceFxPlaces[level].places[p],
					inProx = $game.$audio.getProximity(place.location, place.prox);
				if(inProx) {
					var rollDice = Math.random();
					if(rollDice < place.chance) {
						var soundIndex = Math.floor((rollDice / place.chance) * place.sounds.length);
						console.log(soundIndex, place.sounds[soundIndex]);
						$game.$audio.playEnvironmentOnceFx(place.sounds[soundIndex]);
						p = numPlaces;
					}
				}
				p++;
			}
		}
	},

	getProximity: function(location, thresh) {
		var dist1 = Math.abs(_currentPos.x - location.x) + Math.abs(_currentPos.y - location.y);
		if(dist1 < thresh) {
			return true;
		} else {
			return false;
		}
	},

	checkLoopExit: function() {
		var inProx = $game.$audio.getProximity(_currentLoop.locations[0], _currentLoop.prox);
		if(!inProx) {
			_currentLoop = null;
			_environmentLoopFx.pause();
		}
	},

	switchTrack: function(swap) {
		_midTransition = true;
		_prevTrack = _currentTrack;
		_soundtracks[_currentTrack].fadeOut(0, 1000, function() {
			_soundtracks[_prevTrack].pause();
		});
		_currentTrack = swap;
		_soundtracks[swap].fadeIn(0.2, 3000, function(swap) {
			_midTransition = false;
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