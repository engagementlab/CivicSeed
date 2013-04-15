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
		{	sound: 'stream',
			locations: [{x: 30, y: 10}, {x: 30, y: 50}, {x: 30, y: 90}, {x: 30, y: 130}, {x: 30, y: 170}],
			prox: {x:20,y:20}
		},
		{	sound: 'wind',
			locations: [{x: 15, y: 8},{x: 60, y: 50}],
			prox: {x:20,y:15}
		},
		{	sound: 'chatter',
			locations: [{x: 100, y: 30}],
			prox: {x:20,y:20}
		},
		{	sound: 'waves',
			locations: [{x: 10, y: 80}],
			prox: {x:20,y:20}
		}
	],
	_environmentOnceFxPlaces = [
		{location: {x: 10, y: 0}, sounds: ['neo', 'bigger'], prox: {x: 10, y: 10}, chance: 0.50},
		{location: {x: 35, y: 30}, sounds: ['forest1', 'forest2','forest3', 'bird1', 'bird2','bird3'], prox: {x:35, y:30}, chance: 0.2},
		{location: {x: 105, y: 30}, sounds: ['churchBells', 'townBells','chatter', 'bird2', 'bird3'], prox: {x:35, y:30}, chance: 0.1},
		{location: {x: 105, y: 90}, sounds: ['chickens', 'sheep1', 'sheep2', 'horse', 'bird3'], prox: {x:35, y:30}, chance: 0.15},
		{location: {x: 35, y: 90}, sounds: ['portBells', 'foghorn', 'bird2'], prox: {x:35, y:30}, chance: 0.1}

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
			var mp3 = _musicPath + track + '.mp3?VERSION=',
			ogg = _musicPath + track + '.ogg?VERSION=';

			if(_extension) {
				mp3 += _extension;
				ogg += _extension;
			} else {
				mp3 += Math.round(Math.random(1) * 1000000000),
				ogg += Math.round(Math.random(1) * 1000000000);
			}
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
		console.log('loading triggers');
		var mp3 = _musicPath + 'triggers.mp3?VERSION=',
			ogg = _musicPath +'triggers.ogg?VERSION=';
		if(_extension) {
			mp3 += _extension;
			ogg += _extension;
		} else {
			mp3 += Math.round(Math.random(1) * 1000000000),
			ogg += Math.round(Math.random(1) * 1000000000);
		}
		console.log(mp3);
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
			volume: 0.4,
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
				stream: [0, 5010],
				chatter: [6000, 12025],
				wave: [19000, 16500],
				wind: [36000, 14350]
			},
			loop: true,
			onend: function() {
				$game.$audio.checkLoopExit();
			},
			volume: 0.1,
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
				neo: [0, 1520],
				bigger: [2000, 5300],
				horse: [8000,11000],
				sheep1: [11000,1600],
				sheep2: [13000, 1500],
				chickens: [15000, 4400],
				forest1: [20000, 1000],
				forest2: [21000, 1600],
				portBells: [23000,4400],
				churhBells: [28000, 3150],
				townBells: [32000, 2400],
				bird1: [35000, 700],
				bird2: [36000, 500],
				bird3: [37000, 900],
				foghorn: [38000, 4300],
				chatter: [43000, 5500],
				forest3: [49000, 2700]
			},
			volume: 0.3,
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
		var ranDelay = Math.random() * 2000;
		setTimeout(function() {
			_environmentOnceFx.play(fx);
		}, ranDelay);
	},

	update: function(posX, posY) {
		_currentPos = {x: posX, y: posY};
		var trackNum = $game.$audio.whichTrack(posX, posY);
		if(_soundtracks[trackNum]._loaded && trackNum !== _currentTrack && !_midTransition) {
			$game.$audio.switchTrack(trackNum);
			$game.temporaryStatus(_newPlace);
		}
		if(!_currentLoop) {
			$game.$audio.checkEnvironmentLoopFx(trackNum);
		}
		$game.$audio.checkEnvironmentOnceFx(trackNum);
	},

	checkEnvironmentLoopFx: function() {
		var numPlaces = _environmentLoopFxPlaces.length,
			p = 0;

		while(p < numPlaces) {
			var place = _environmentLoopFxPlaces[p],
				numLocations = place.locations.length,
				l = 0;

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
	},

	checkEnvironmentOnceFx: function() {
		var numPlaces = _environmentOnceFxPlaces.length,
			p = 0;

		while(p < numPlaces) {
			var place = _environmentOnceFxPlaces[p],
				inProx = $game.$audio.getProximity(place.location, place.prox);
			if(inProx) {
				var rollDice = Math.random();
				if(rollDice < place.chance) {
					var soundIndex = Math.floor((rollDice / place.chance) * place.sounds.length);
					$game.$audio.playEnvironmentOnceFx(place.sounds[soundIndex]);
					//if we don't want overlapping of sounds triggered at a time
					p = numPlaces;
				}
			}
			p++;
		}
	},

	getProximity: function(location, prox) {
		var distX = Math.abs(_currentPos.x - location.x),
			distY =  Math.abs(_currentPos.y - location.y);
		if(distX < prox.x && distY < prox.y) {
			return true;
		} else {
			return false;
		}
	},

	checkLoopExit: function() {
		var numLocations = _currentLoop.locations.length,
			l = 0,
			inRange = false;

		while(l < numLocations) {
			var inProx = $game.$audio.getProximity(_currentLoop.locations[l], _currentLoop.prox);
			if(inProx) {
				inRange = true;
				l = numLocations;
			}
			l++;
		}
		if(!inRange) {
			_environmentLoopFx.pause(_currentLoop.sound);
			_currentLoop = null;
		}
	},

	switchTrack: function(swap) {
		_midTransition = true;
		_prevTrack = _currentTrack;
		_soundtracks[_currentTrack].fadeOut(0, 1000, function() {
			_soundtracks[_prevTrack].pause();
		});
		_currentTrack = swap;

		var val = $game.$audio.isMute ? 0.0 : 0.2;
		_soundtracks[swap].fadeIn(val, 3000, function(swap) {
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
				trackRegion = _currentTrack;
				_newPlace = 'you are on the equator';
			}
		}

		return trackRegion;
	},

	toggleMute: function() {
		$game.$audio.isMute = $game.$audio.isMute ? false: true;
		if($game.$audio.isMute) {
			_soundtracks[_currentTrack].volume(0);
			_environmentLoopFx.volume(0);
			_environmentOnceFx.volume(0);
			_triggerFx.volume(0);
		}
		else {
			_soundtracks[_currentTrack].volume(0.2);
			_environmentLoopFx.volume(0.1);
			_environmentOnceFx.volume(0.3);
			_triggerFx.volume(0.4);
		}
		return $game.$audio.isMute;
	},

	fadeLow: function() {
		if(!$game.$audio.isMute) {
			_soundtracks[_currentTrack].volume(0.05);
			_environmentLoopFx.volume(0.03);
		}
	},

	fadeHi: function() {
		if($game.$audio.isMute) {
			_soundtracks[_currentTrack].volume(0.2);
			_environmentLoopFx.volume(0.2);
		}
	}

};