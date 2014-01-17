var _lastTime = 0;
window.requestAnimationFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - _lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
      _lastTime = currTime + timeToCall;
      return id;
    };
}());

// PRIVATE GAME VARS
var _stepNumber = 0,
  _stats = null,
  _badWords = ['fuck','shit', 'bitch', 'cunt', 'damn', 'penis', 'vagina', 'crap', 'screw', 'suck','piss', 'whore', 'slut'], //should be moved
  _levelNames = [
    'Level 1: Looking Inward',
    'Level 2: Expanding Outward',
    'Level 3: Working Together',
    'Level 4: Looking Forward',
    'Game Over: Profile Unlocked'
  ],
  _displayTimeout = null,
  $map,
  $game_render,
  $npc,
  $resources,
  $player,
  $others,
  $robot,
  $botanist,
  $mouse,
  $audio,
  $pathfinder,
  $events,
  $input,
  $chat,
  $log,
  $boss;

// PUBLIC EXPORTS
var $game = module.exports = {

  //GLOBAL GAME CONSTANTS
  VIEWPORT_WIDTH: 30,
  VIEWPORT_HEIGHT: 15,
  TOTAL_WIDTH: 142,
  TOTAL_HEIGHT: 132,
  TILE_SIZE: 32,
  STEP_PIXELS: 4,

  //GLOBAL GAME VARS
  currentTiles: [],
  inTransit: false,
  running: false,
  ready: false,
  showingProgress : false,
  showingSkinventory : false,
  resourceCount: [],
  graph: null,
  masterX: null,
  masterY: null,
  playerRanks: [
    'Novice Gardener',
    'Apprentice Gardener',
    'Expert Gardener',
    'Master Gardener',
    'Super Master Gardener'
  ],
  bossModeUnlocked: null,
  playerSkins: {
    'basic': {
      'id': 'basic',
      'name': 'Basic Look',
      'description': 'This is you. You look great!',
      'effect': null,
      'modifiers': null,
      'head': {
        'name': 'Basic Head',
        'description': 'Your beautiful face.',
        'effect': null,
        'modifiers': null
      },
      'torso': {
        'name': 'Basic Body',
        'description': 'Your heart is in here somewhere.',
        'effect': null,
        'modifiers': null
      },
      'legs': {
        'name': 'Basic Legs',
        'description': 'These legs are made for walking.',
        'effect': null,
        'modifiers': null
      }
    },
    'astronaut': {
      'id': 'astronaut',
      'name': 'Astronaut',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Space Helmet',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Space Suit',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Space Pants',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    },
    'cactus': {
      'id': 'cactus',
      'name': 'Cactus',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Cactus Head',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Cactus Body',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Cactus Legs',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    },
    'cone': {
      'id': 'cone',
      'name': 'Ice Cream Cone',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Strawberry Scoop',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Sugar Cone Top',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Sugar Cone Bottom',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    },
    'dinosaur': {
      'id': 'dinosaur',
      'name': 'Dinosaur',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Dinosaur Head',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Dinosaur Body',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Dinosaur Legs',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    },
    'horse': {
      'id': 'horse',
      'name': 'Horse',
      'description': '',
      'effect': 'You walk a lot faster!',
      'modifiers': '',
      'head': {
        'name': 'Horse Head',
        'description': '',
        'effect': 'You walk slightly faster.',
        'modifiers': ''
      },
      'torso': {
        'name': 'Horse Body',
        'description': '',
        'effect': 'You walk slightly faster.',
        'modifiers': ''
      },
      'legs': {
        'name': 'Horse Legs',
        'description': '',
        'effect': 'You walk slightly faster.',
        'modifiers': ''
      }
    },
    'lion': {
      'id': 'lion',
      'name': 'Lion',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Lion Head',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Lion Body',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Lion Legs',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    },
    'ninja': {
      'id': 'ninja',
      'name': 'Ninja',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Ninja Mask',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Ninja Gi',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Ninja Pants',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    },
    'octopus': {
      'id': 'octopus',
      'name': 'Octopus',
      'description': '',
      'effect': 'Your paint radius goes up by three.',
      'modifiers': '',
      'head': {
        'name': 'Octopus Head',
        'description': '',
        'effect': 'Your paint radius goes up by one.',
        'modifiers': ''
      },
      'torso': {
        'name': 'Octopus Body',
        'description': '',
        'effect': 'Your paint radius goes up by one.',
        'modifiers': ''
      },
      'legs': {
        'name': 'Eight Legs',
        'description': '',
        'effect': 'Your paint radius goes up by one.',
        'modifiers': ''
      }
    },
    'penguin': {
      'id': 'penguin',
      'name': 'Penguin',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Penguin Head',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Penguin Suit',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Penguin Bottoms',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    },
    'tuxedo': {
      'id': 'tuxedo',
      'name': 'Tuxedo',
      'description': '',
      'effect': '',
      'modifiers': '',
      'head': {
        'name': 'Tuxedo Mask',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'torso': {
        'name': 'Tuxedo Jacket',
        'description': '',
        'effect': '',
        'modifiers': ''
      },
      'legs': {
        'name': 'Tuxedo Pants',
        'description': '',
        'effect': '',
        'modifiers': ''
      }
    }
  },

  startNewAction: true,

  instantiated: false,

  init: function(callback) {

    // instantiating code (if not already done)
    $map = require('/map');
    $render = require('/render');
    $npc = require('/npc');
    $resources = require('/resources');
    $player = require('/player');
    $others = require('/others');
    $robot = require('/robot');
    $botanist = require('/botanist');
    $mouse = require('/mouse');
    $audio = require('/audio');
    $pathfinder = require('/pathfinder');
    $events = require('/events');
    $input = require('/input');
    $chat = require('/chat');
    $log = require('/log');
    $boss = require('/boss');

    // events recevied by RPC
    $events.init();
    $input.init();

    // TODO: there needs to be some other kind of mechanism to see if the user has retired from the game...
    $WINDOW.on('beforeunload', function() {
      if(sessionStorage.isPlaying === 'true') {
        var x = $game.exitGame();
        return x;
      }
    });

    $game.instantiated = true;

  },

  //must reset every module because init won't be called since the app was already loaded once (if they navigate to profile and back for example)
  reInit: function() {
    $game.resetInit();
    $game.$map.resetInit();
    $game.$renderer.resetInit();
    $game.$npc.resetInit();
    $game.$resources.resetInit();
    $game.$player.resetInit();
    $game.$others.resetInit();
    $game.$robot.resetInit();
    $game.$botanist.resetInit();
    $game.$mouse.resetInit();
    $game.$audio.resetInit();
    $game.$input.resetInit();
    $game.$chat.resetInit();
    $game.$log.resetInit();
    $game.$boss.resetInit();
  },

  //resets the local game vars
  resetInit: function() {
    _lastTime = 0;
    _stepNumber = 0;
    _stats = null;
    _displayTimeout = null;
  
    $game.currentTiles = [];
    $game.inTransit = false;
    $game.running = false;
    $game.ready = false;
    $game.showingProgress = false;
    $game.showingSkinventory = false;
    $game.resourceCount = [];
    $game.graph = null;
    $game.masterX = null;
    $game.masterY = null;
    $game.bossModeUnlocked = null;
    $game.startNewAction = true;
  },

  enterGame: function(callback) {
    //check if they are ACTUALLY playing
    ss.rpc('shared.account.checkGameSession', function(response) {
      // YOU KNOW, THIS COULD ALL HAPPEN ELSEWHERE?
      if(!$game.instantiated) {
        $game.init();
      } else {
        $game.reInit();
      }
      if(response.status) {
        sessionStorage.setItem('isPlaying', true);
        $game.kickOffGame();
      } else {
        if(response.profileLink) {
            Davis.location.assign('/profiles/' + response.profileLink);
        }
        apprise('There seems to have been an error accessing the game.<br><br><span style="display:block;font-size:11px;text-align:center;">(If you think there is a problem, please contact the website administrator.)</span>');
      }
    });
  },

  //start the the game up by appending the dom
  kickOffGame: function() {
    $CONTAINER.append(JT['game-gameboard']());
    $CONTAINER.append(JT['game-resourceStage']());
    $CONTAINER.append(JT['game-hud']());
    $events.registerVariables();
    $input.registerVariables();
    _kickOffGame();
  },

  // pause menu on browser tab unfocus (currently disabled)
  pause: function() {
    $('.pauseMenu').fadeIn();
    $game.running = false;
    // TODO: play pause music?
    // CAN USE: $game.$audio.stopAll();
  },

  // resume from the pause menu, start up game loop (currenty disabled)
  resume: function() {
    $('.pauseMenu').slideUp(function() {
      $game.running = true;
      $game.tick();
    });
  },

  //starts a transition from one viewport to another
  beginTransition: function() {
    $game.inTransit = true;
    _stepNumber = 0;
    $game.$chat.hideChat();
    $game.$others.hideAllChats();
    $('.npcBubble').remove();
    $game.stepTransition();
  },

  //decides if we continue tweening the viewports or to end transition
  stepTransition: function() {
    if(_stepNumber !== $game.$map.numberOfSteps) {
      _stepNumber += 1;
      $game.$map.transitionMap(_stepNumber);
    }
    else {
      $game.endTransition();
    }
  },

  //resumes normal state of being able to walk and enables chat etc.
  endTransition: function() {
    $game.inTransit = false;
    $game.$player.isMoving = false;
    $game.$player.resetRenderValues();
    $game.$others.resetRenderValues();
    //now that the transition has ended, create a new grid
    $game.$map.createPathGrid(function() {
      $game.$map.stepDirection = null;
    });
    $game.$player.displayNpcComments();
    $game.$player.saveTimeToDB();
  },

  //the game loop, if it is running, call all the updates and render
  tick: function() {
    if($game.running) {
      if($game.$player.currentLevel < 4 || (!$game.bossModeUnlocked && $game.$player.currentLevel > 3)) {
        $game.$others.update();
        $game.$npc.update();
        $game.$botanist.update();
        $game.$robot.update();
      }
      $game.$player.update();
      $game.$renderer.renderFrame();
      requestAnimationFrame($game.tick);
    }
  },

  //displays the progress area section, pulling the latest pertient data
  showProgress: function() {

    //save and show player's colors
    var myImageSrc = $game.$map.saveImage();
    $game.$map.createCollectiveImage();

    //get stats
    var tilesColored = $game.$player.getTilesColored(),
      resourcesDiscovered = $game.$player.getResourcesDiscovered();

    //show proper level image and color map
    $('.levelImages img').removeClass('currentLevelImage');
    $('.levelImages img:nth-child(' + ($game.$player.currentLevel + 1) + ')').addClass('currentLevelImage');
    $('.personalInfo .currentLevel').text($game.playerRanks[$game.$player.currentLevel]);
    $('.colorMapYou img')
      .attr('src', myImageSrc)
      .attr('width', '426px');

    //calculate the playing time
    var playingTime = $game.$player.getPlayingTime(),
      hours = Math.floor(playingTime / 3600),
      hoursRemainder = playingTime % 3600,
      minutes = Math.floor(hoursRemainder / 60),
      seconds = playingTime % 60,
      displayTime = hours + 'h ' + minutes + 'm ' + seconds + 's';

    //other game stats and leaderboard
    // var contribution = Math.floor((tilesColored / $game.tilesColored) * 100) + '%',
    var displayLevel = $game.$player.currentLevel + 1,
      topPlayers = '<p>top seeders:</p><ol>';
    for(var i = 0; i < _stats.leaderboard.length; i++) {
      topPlayers += '<li>' + _stats.leaderboard[i].name + ' -- ' + _stats.leaderboard[i].count + '</li>';
    }
    topPlayers += '</ol>';
    topPlayers += '<p class="yourSeeds">You (' + tilesColored + ')</p>';

    //player's answers for all the open-ended questions, some others stats
    var allAnswers = $game.$player.compileAnswers();
    var percentString = _stats.percent + '%';
    var numItems = $game.$player.getResourcesDiscovered();

    //display everthing
    $('.displayPercent .progress .bar').css('width', percentString);
    $('.displayMyAnswers').empty().append(allAnswers);
    $('.displayTime').html('<i class="icon-time icon-large"></i> ' + displayTime);
    //$('.displayPercent').text(percentString);
    $('.topSeeders').empty().append(topPlayers);
    $('.numCollected').text(numItems + ' / 42');
    $('.progressArea').fadeIn(function() {
      $game.showingProgress = true;
    });
  },

  //shows message in the display box that only lasts specific time
  statusUpdate: function (data) {
    if (data.screen) {
      $('.statusUpdate span').text(data.message);
      $('.statusUpdate').show();
      clearTimeout(_displayTimeout);
      var len      = data.message.length,
          fadeTime = len * 100 + 500;
      _displayTimeout = setTimeout(function() {
        $('.statusUpdate').fadeOut();
      }, fadeTime);
    }
    if (data.log) {
      $game.$log.addMessage(data);
    }
  },

  // Generic use of $game.statusUpdate() for an on-screen message only.
  alert: function (message) {
    $game.statusUpdate({
      message: message,
      input:   'status',
      screen:  true,
      log:     false
    })
  },

  // Generic use of $game.statusUpdate() for a log entry only.
  log: function (message) {
    $game.statusUpdate({
      message: message,
      input:   'status',
      screen:  false,
      log:     true
    })
  },

  // Generic use of $game.statusUpdate() for both log and screen message.
  broadcast: function (message) {
    $game.statusUpdate({
      message: message,
      input:   'status',
      screen:  true,
      log:     true
    })
  },

  //check for bad language to censor it in chat
  checkPotty: function(msg) {
    var temp = msg.toLowerCase();

    for(var i = 0; i < _badWords.length; i++) {
      if(temp.indexOf(_badWords[i]) > -1) {
        return 'I have a potty mouth and I am sorry for cussing.';
      }
    }
    return msg;
  },

  //triggered by a change server-side in the leaderboard
  updateLeaderboard: function(data) {
    var leaderChange = true;
    if(_stats.leaderboard.length > 0) {
      leaderChange = (_stats.leaderboard[0].name === data.board[0].name) ? false : true;
    }
    if(leaderChange) {
      $game.statusUpdate({message:data.board[0].name + ' is top seeder!',input:'status',screen: true,log:true});
    }
    _stats.leaderboard = data.board;
  },

  //triggered by a change server-side in the color map percent
  updatePercent: function(dropped) {
    _stats.prevPercent = _stats.percent;
    _stats.seedsDropped = dropped;
    _stats.percent = Math.floor(( _stats.seedsDropped / _stats.seedsDroppedGoal) * 100);
    //var percentString = _stats.percent + '%';

    //if we have gone up a milestone, feedback it
    if(_stats.percent > 99 && !$game.bossModeUnlocked) {
      //do something for game over?
        $game.statusUpdate({message:'The meter is full! The color has been restored.',input:'status',screen: true,log:true});
    }
    if(_stats.prevPercent != _stats.percent) {
      _stats.prevPercent = _stats.percent;
      if(_stats.percent % 5 === 0) {
        //$game.temporaryStatus('the world is now ' + percentString + ' colored!');
        //$game.statusUpdate({message:'',input:'status',screen: true,log:true});
      }
    }
  },

  // save and exit game
  exitGame: function(callback) {
    // console.log('exiting game!');
    sessionStorage.removeItem('isPlaying');
    $game.running = false;
    // TODO: fade out, instead of abrupt stop???
    $game.$audio.stopAll();
    // save out all current status of player to db on exit
    if(!$game.bossModeUnlocked) {
      $game.$player.saveTimeToDB();
    }
    $game.$map.removePlayer($game.$player.id);
    ss.rpc('game.player.exitPlayer', $game.$player.id, $game.$player.firstName, function() {
      if(typeof callback === 'function') {
        callback();
      }
    });
  },

  //startup boss level if player finished game and boss level is unlocked
  toBossLevel: function() {
    $game.$audio.pauseTrack();
    $game.$renderer.clearMap();
    $game.$player.setPositionInfo();
    $game.$botanist.disable();
    $game.$robot.disable();
    $game.$others.disable();
    _setBoundaries();
    _startGame(true);
  }

};

/********* PRIVATE FUNCTIONS **********/

// all the init calls will trigger others, a waterfall approach to assure
// the right data is loaded before we start
function _kickOffGame() {
  $game.$player.init(function() {
    _loadGameInfo();
  });
}

function _loadGameInfo() {
  // get the global game information stats
  ss.rpc('game.player.getGameInfo', function(response) {
    // regular game mode
    $game.bossModeUnlocked = response.bossModeUnlocked;

    $game.resourceCount = response.resourceCount;
    _stats = {
      seedsDropped: response.seedsDropped,
      seedsDroppedGoal: response.seedsDroppedGoal,
      leaderboard: response.leaderboard,
      percent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100),
      prevPercent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100)
    };
    $game.$player.setPositionInfo();
    $game.$renderer.init(function() {
      _loadMap();
    });
  });
}

function _loadMap() {
  $game.$map.init(function() {
    // required for npcs to be placed
    _setBoundaries();
    _loadOthers();
  });
}

function _loadOthers() {
  //depends on map
  $game.$others.init(function() {
    _loadNpc();
  });
}

function _loadNpc() {
  $game.$npc.init(function() {
    _loadResources();
  });
}

function _loadResources() {
  //depends on npc
  $game.$resources.init(function() {
    _loadBotanist();
  });
}

function _loadBotanist() {
  //depends on player/game
  $game.$botanist.init(function() {
    _loadRobot();
  });
}

function _loadRobot() {
  $game.$robot.init(function() {
    _loadAudio();
  });
}

function _loadAudio() {
  //depends on player position
  $game.$audio.init(function() {
    _loadChat();
  });
}

function _loadChat() {
  $game.$chat.init(function() {
    _loadLog();
  });
}

function _loadLog() {
  $game.$log.init(function() {
    _loadExtra();
  });
}

//this is all the other stuff that needs to happen once everything is loaded
function _loadExtra() {
  //fill player inventory and creat outlines
  $game.$player.fillInventory();
  $game.$player.createInventoryOutlines();

  //make players color map
  var src = $game.$player.getColorMap();
  if(src !== undefined) {
    $game.$renderer.imageToCanvas(src);
  }
  //create collective image
  $game.$map.createCollectiveImage();

  //update text in HUD
  // var percentString = _stats.percent + '%';
  // $('.progressButton .hudCount').text(percentString);

  //init chat rpc
  ss.rpc('game.chat.init');
  _startGame();
}

//calculates the bounding box for the current viewport to get the right tiles
function _setBoundaries() {
  //calculate the top left corner of the viewport based on where the player is
  var position = $game.$player.getPosition(),
    tx = (position.x === 0) ? 0 : position.x - 1,
    ty = (position.y === 0) ? 0 : position.y - 1,
    divX = Math.floor(tx / ($game.VIEWPORT_WIDTH - 2 )),
    divY = Math.floor(ty / ($game.VIEWPORT_HEIGHT - 2 )),
    startX  = divX * ($game.VIEWPORT_WIDTH - 2),
    startY = divY * ($game.VIEWPORT_HEIGHT - 2);

  $game.masterX = startX;
  $game.masterY = startY;

  $game.$map.setBoundaries();
}

//start the game, decide if going to boss level or not
function _startGame(ingame) {
  if($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
    $game.$boss.init(function() {
      //TODO: something here?
    });
  }
  $game.$map.firstStart(function() {
    if(!ingame) {
      $('.loading').fadeOut(function() {
        $(this).remove();
        $game.ready = true;
        $game.running = true;
        $game.$renderer.renderAllTiles();
        $game.tick();
        $game.$player.displayNpcComments();
      });
    }
  });
}
