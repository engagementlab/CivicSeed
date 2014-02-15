'use strict';

var _soundtracks = [],
    _triggerFx = null,
    _environmentLoopFx = null,
    _environmentOnceFx = null,
    _currentTrack = -1,
    _prevTrack = -1,
    _numTracks = 8,
    _tweenTimeout = null,
    _targetV = 0,
    _musicPath = CivicSeed.CLOUD_PATH + '/audio/music/',
    _audioFxPath = CivicSeed.CLOUD_PATH + '/audio/fx/',
    _midTransition = false,
    _extension = null,
    _environmentLoopFxPlaces = [
      { sound: 'stream',
        locations: [{x: 30, y: 10}, {x: 30, y: 50}, {x: 30, y: 90}, {x: 30, y: 130}, {x: 30, y: 170}],
        prox: {x:10,y:10}
      },
      { sound: 'wind',
        locations: [{x: 15, y: 8},{x: 60, y: 50}],
        prox: {x:20,y:15}
      },
      { sound: 'chatter',
        locations: [{x: 100, y: 30}],
        prox: {x:20,y:20}
      },
      { sound: 'waves',
        locations: [{x: 10, y: 80}],
        prox: {x:20,y:20}
      }
    ],
    _environmentOnceFxPlaces = [
      {location: {x: 35, y: 30}, sounds: ['forest1', 'forest2','forest3', 'bird1', 'bird2','bird3'], prox: {x:35, y:30}, chance: 0.2},
      {location: {x: 105, y: 30}, sounds: ['churchBells', 'townBells','chatter', 'bird2', 'bird3'], prox: {x:20, y:20}, chance: 0.1},
      {location: {x: 105, y: 90}, sounds: ['chickens', 'sheep1', 'sheep2', 'horse', 'bird3'], prox: {x:35, y:30}, chance: 0.15},
      {location: {x: 35, y: 90}, sounds: ['portBells', 'foghorn', 'bird2'], prox: {x:25, y:20}, chance: 0.1}

    ],
    _currentLoop = null,
    _currentPos = null

var $audio = $game.$audio = {

  ready: false,
  isMute: false,

  config: {
    soundtrackVolume:        0.2,
    environmentLoopFxVolume: 0.1,
    environmentOnceFxVolume: 0.3,
    triggerFxVolume:         0.4
  },

  init: function (callback) {
    if (CivicSeed.ENVIRONMENT !== 'development') {
      _extension = CivicSeed.version;
    }

    $audio.isMute = $game.$player.isMuted
    if ($audio.isMute) {
      $game.$input.muteAudio()
      $game.$audio.mute()
    }

    var track = _audio.whichTrack()
    $audio.loadTrack(track)

    //hack to check if all stuff is loaded so we can callback
    var checkDone = function () {
      if ($audio.ready) {
        callback();
      } else {
        setTimeout(checkDone, 30);
      }
    };
    checkDone();
  },

  resetInit: function () {
    _soundtracks = [];
    _triggerFx = null;
    _environmentLoopFx = null;
    _environmentOnceFx = null;
    _currentTrack = -1;
    _prevTrack = -1;
    _tweenTimeout = null;
    _targetV = 0;
    _midTransition = false;
    _extension = null;
    _currentLoop = null;
    _currentPos = null;

    $game.$audio.ready= false;
    $game.$audio.isMute = $game.$player.isMuted
  },

  loadTrack: function (num) {
    var mp3 = _musicPath + num + '.mp3?VERSION=',
        ogg = _musicPath + num + '.ogg?VERSION='

    if (_extension) {
      mp3 += _extension
      ogg += _extension
    } else {
      mp3 += Math.round(Math.random(1) * 1000000000)
      ogg += Math.round(Math.random(1) * 1000000000)
    }

    var autoplay = true
    if ($game.$player.currentLevel > 3 && $game.bossModeUnlocked) {
      autoplay = false
    }

    _soundtracks[num] = new Howl({
      urls: [mp3, ogg],
      autoplay: autoplay,
      loop: true,
      volume: $audio.config.soundtrackVolume,
      buffer: true
    });
    //this goes thru all the tracks, and skips num since its preloaded
    $audio.loadOtherTrack(0, num);
    $audio.loadTriggerFx();
    _currentTrack = num;
  },

  loadOtherTrack: function (track, num) {
    if (track !== num) {
      var mp3 = _musicPath + track + '.mp3?VERSION=',
          ogg = _musicPath + track + '.ogg?VERSION='

      if (_extension) {
        mp3 += _extension;
        ogg += _extension;
      } else {
        mp3 += Math.round(Math.random(1) * 1000000000)
        ogg += Math.round(Math.random(1) * 1000000000)
      }
      _soundtracks[track] = new Howl({
        urls: [mp3, ogg],
        autoplay: false,
        loop: true,
        volume: 0.0,
        buffer: true
      });
      track++;
      if (track !== _numTracks) {
        $audio.loadOtherTrack(track, num);
      }
    } else {
      track++;
      if (track !== _numTracks) {
        $audio.loadOtherTrack(track, num);
      }
    }
  },

  loadTriggerFx: function () {
    var mp3 = _musicPath + 'triggers.mp3?VERSION=',
      ogg = _musicPath +'triggers.ogg?VERSION=';
    if (_extension) {
      mp3 += _extension;
      ogg += _extension;
    } else {
      mp3 += Math.round(Math.random(1) * 1000000000)
      ogg += Math.round(Math.random(1) * 1000000000)
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
        pieceDrop: [16000, 200],
        robot: [17000, 2800]
      },
      volume: $audio.config.triggerFxVolume,
      onload: function () {
        $audio.loadEnvironmentLoopFx();
      }
    });
  },

  loadEnvironmentLoopFx: function () {
    var mp3 = _musicPath + 'environmentloop.mp3?VERSION=',
        ogg = _musicPath + 'environmentloop.ogg?VERSION=';

    if (_extension) {
      mp3 += _extension;
      ogg += _extension;
    } else {
      mp3 += Math.round(Math.random(1) * 1000000000)
      ogg += Math.round(Math.random(1) * 1000000000)
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
      onend: function () {
        $audio.checkLoopExit();
      },
      volume: $audio.config.environmentLoopFxVolume,
      onload: function () {
        $audio.loadEnvironmentOnceFx();
      }
    });
  },

  loadEnvironmentOnceFx: function () {
    var mp3 = _musicPath + 'environmentonce.mp3?VERSION=',
        ogg = _musicPath +'environmentonce.ogg?VERSION=';

    if (_extension) {
      mp3 += _extension;
      ogg += _extension;
    } else {
      mp3 += Math.round(Math.random(1) * 1000000000)
      ogg += Math.round(Math.random(1) * 1000000000)
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
      volume: $audio.config.environmentOnceFxVolume,
      onend: function () {
      },
      onload: function () {
        $audio.ready = true;
      }
    });
  },

  playTriggerFx: function (fx) {
    _triggerFx.play(fx);
  },

  playEnvironmentLoopFx: function (fx) {
    _environmentLoopFx.play(fx);
  },

  playEnvironmentOnceFx: function (fx) {
    var ranDelay = Math.random() * 2000;
    setTimeout(function () {
      _environmentOnceFx.play(fx);
    }, ranDelay);
  },

  update: function (posX, posY) {
    _currentPos = {x: posX, y: posY};
    var trackNum = _audio.whichTrack(),
        message  = 'Entering '

    if (_soundtracks[trackNum]._loaded && trackNum !== _currentTrack && !_midTransition) {
      $audio.switchTrack(trackNum)

      // As audio switches, display a notice to the player of where
      // they are entering.
      // TODO: Move this elsewhere (to player, map, or game.js)
      // Since this is not really music-related.
      switch (trackNum) {
        case 0:
          // Top left
          message += $game.world.northwest.name
          break
        case 1:
          // Top right
          message += $game.world.northeast.name
          break
        case 2:
          // Bottom right
          message += $game.world.southeast.name
          break
        case 3:
          // Bottom left
          message += $game.world.southwest.name
          break
        case 5:
          // Botanist's area
          message += $game.world.origin.name
          break
        default:
          message  = 'You are on the equator'
          break
      }
      $game.alert(message)
    }
    if (!_currentLoop) {
      $audio.checkEnvironmentLoopFx(trackNum);
    }
    $audio.checkEnvironmentOnceFx(trackNum);
  },

  checkEnvironmentLoopFx: function () {
    var numPlaces = _environmentLoopFxPlaces.length,
      p = 0;

    while(p < numPlaces) {
      var place = _environmentLoopFxPlaces[p],
        numLocations = place.locations.length,
        l = 0;

      while(l < numLocations) {
        var inProx = _audio.getProximity(place.locations[l], place.prox);
          if (inProx) {
            _currentLoop = place;
            $audio.playEnvironmentLoopFx(place.sound);
            //get out of BOTH loops
            l = numLocations;
            p = numPlaces;
          }
        l++;
      }
      p++;
    }
  },

  checkEnvironmentOnceFx: function () {
    var numPlaces = _environmentOnceFxPlaces.length,
      p = 0;

    while(p < numPlaces) {
      var place = _environmentOnceFxPlaces[p],
        inProx = _audio.getProximity(place.location, place.prox);
      if (inProx) {
        var rollDice = Math.random();
        if (rollDice < place.chance) {
          var soundIndex = Math.floor((rollDice / place.chance) * place.sounds.length);
          $audio.playEnvironmentOnceFx(place.sounds[soundIndex]);
          //if we don't want overlapping of sounds triggered at a time
          p = numPlaces;
        }
      }
      p++;
    }
  },

  checkLoopExit: function () {
    var numLocations = _currentLoop.locations.length,
      l = 0,
      inRange = false;

    while(l < numLocations) {
      var inProx = _audio.getProximity(_currentLoop.locations[l], _currentLoop.prox);
      if (inProx) {
        inRange = true;
        l = numLocations;
      }
      l++;
    }
    if (!inRange) {
      _environmentLoopFx.pause(_currentLoop.sound);
      _currentLoop = null;
    }
  },

  pauseTrack: function () {
    _soundtracks[_currentTrack].pause();
  },

  switchTrack: function (swap) {
    _prevTrack = _currentTrack;
    _currentTrack = swap;
    if (_prevTrack !== _currentTrack) {
      _midTransition = true;
      _soundtracks[_prevTrack].fadeOut(0, 1000, function () {
        _soundtracks[_prevTrack].pause();
      });
      _soundtracks[_currentTrack].fadeIn(0.2, 3000, function (swap) {
        _midTransition = false;
      });
    }
  },

  // Toggle audio on or off, and save setting to player profile
  toggleMute: function () {
    $audio.isMute = !$audio.isMute

    if ($audio.isMute) {
      $audio.mute()
    }
    else {
      $audio.unmute()
    }

    // Save volume state to player profile
    $game.$player.isMuted = $audio.isMute
    ss.rpc('game.player.updateGameInfo', {
      id: $game.$player.id,
      isMuted: $game.$player.isMuted
    })

    return $audio.isMute
  },

  // Mute and unmute wrappers for Howler
  mute: function () {
    Howler.mute()
  },

  unmute: function () {
    Howler.unmute()
  },

  fadeLow: function () {
    if (!$audio.isMute) {
      _soundtracks[_currentTrack].volume($audio.config.soundtrackVolume * 0.25)
      _environmentLoopFx.volume($audio.config.environmentLoopFxVolume * 0.15)
    }
  },

  fadeHi: function () {
    if (!$audio.isMute) {
      _soundtracks[_currentTrack].volume($audio.config.soundtrackVolume)
      _environmentLoopFx.volume($audio.config.environmentLoopFxVolume)
    }
  },

  stopAll: function () {
    _soundtracks[_currentTrack].stop()
    _environmentLoopFx.stop()
  }

}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _audio = {

  getProximity: function (location, prox) {
    var distX = Math.abs(_currentPos.x - location.x),
        distY = Math.abs(_currentPos.y - location.y)

    return (distX < prox.x && distY < prox.y) ? true : false
  },

  // Determine which soundtrack to play
  whichTrack: function () {
    // This is dependent on player's position in the world, so get that
    var track = $game.$player.getGameRegion()
    // If 'no man's land' is returned, cover it by changing to track 4
    if (track === -1) track = 4
    return track
  }

}
