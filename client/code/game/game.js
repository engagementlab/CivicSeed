'use strict';

var _lastTime = 0;
window.requestAnimationFrame = (function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - _lastTime));
      var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
      _lastTime = currTime + timeToCall;
      return id;
    };
}());

// PRIVATE GAME VARS
var _stepNumber = 0,
  _stats = null,
  _levelNames = [
    'Level 1: Looking Inward',
    'Level 2: Expanding Outward',
    'Level 3: Working Together',
    'Level 4: Looking Forward',
    'Game Over: Profile Unlocked'
  ],
  _displayTimeout = null,
  $map,
  $render,
  $npc,
  $resources,
  $skins,
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
  PIXEL_RATIO: 1,

  //GLOBAL GAME VARS
  currentTiles: [],
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
  world: {
    'origin': {
      'shortname': 'botanist’s garden',
      'name': 'the Botanist’s Garden'
    },
    'northwest': {
      'shortname': 'forest',
      'name': 'Brightwood Forest'
    },
    'northeast': {
      'shortname': 'town',
      'name': 'Calliope Town'
    },
    'southeast': {
      'shortname': 'ranch',
      'name': 'The Ranch'
    },
    'southwest': {
      'shortname': 'port',
      'name': 'the Port District'
    },
    'nowhere': {
      'shortname': 'equator',
      'name': 'No Man’s Land'
    }
  },

  startNewAction: true,
  instantiated: false,

  init: function (callback) {

    // Instantiating code (if not already done)
    $map        = require('/map')
    $render     = require('/render')
    $npc        = require('/npc')
    $resources  = require('/resources')
    $skins      = require('/skins')
    $player     = require('/player')
    $others     = require('/others')
    $robot      = require('/robot')
    $botanist   = require('/botanist')
    $mouse      = require('/mouse')
    $audio      = require('/audio')
    $pathfinder = require('/pathfinder')
    $events     = require('/events')
    $input      = require('/input')
    $chat       = require('/chat')
    $log        = require('/log')
    $boss       = require('/boss')

    // events recevied by RPC
    $events.init();
    $input.init();

    // TODO: there needs to be some other kind of mechanism to see if the user has retired from the game...
    $WINDOW.on('beforeunload', function () {
      if (sessionStorage.isPlaying === 'true') {
        var x = $game.exitGame();
        return x;
      }
    });

    $game.instantiated = true;

  },

  //must reset every module because init won't be called since the app was already loaded once (if they navigate to profile and back for example)
  reInit: function () {
    $game.resetInit();
    $game.$map.resetInit();
    $game.$render.resetInit();
    $game.$npc.resetInit();
    $game.$resources.resetInit();
    $game.$skins.resetInit();
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
  resetInit: function () {
    _lastTime = 0;
    _stepNumber = 0;
    _stats = null;
    _displayTimeout = null;

    $game.currentTiles = [];
    $game.removeFlag('in-transit');
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

  enterGame: function (callback) {
    //check if they are ACTUALLY playing
    ss.rpc('shared.account.checkGameSession', function (response) {
      // YOU KNOW, THIS COULD ALL HAPPEN ELSEWHERE?
      if (!$game.instantiated) {
        $game.init();
      }
      else {
        $game.reInit();
      }

      if (response.status) {
        sessionStorage.setItem('isPlaying', true);
        _game.kickOffGame()
      }
      else {
        if (response.profileLink) {
            Davis.location.assign('/profiles/' + response.profileLink);
        }
        apprise('There seems to have been an error accessing the game.<br><br><span style="display:block;font-size:11px;text-align:center;">(If you think there is a problem, please contact the website administrator.)</span>');
      }
    });
  },

  // pause menu on browser tab unfocus (currently disabled)
  pause: function () {
    $('#pause-menu').fadeIn();
    $game.running = false;
    // TODO: play pause music?
    // CAN USE: $game.$audio.stopAll();
  },

  // resume from the pause menu, start up game loop (currenty disabled)
  resume: function () {
    $('#pause-menu').slideUp(function () {
      $game.running = true;
      $game.tick();
    });
  },

  //starts a transition from one viewport to another
  beginTransition: function () {
    $game.setFlag('in-transit');
    _stepNumber = 0;
    $game.$chat.hideChat();
    $game.$others.hideAllChats();
    $('.npc-bubble').remove();
    $game.stepTransition();
  },

  //decides if we continue tweening the viewports or to end transition
  stepTransition: function () {
    if (_stepNumber !== $game.$map.numberOfSteps) {
      _stepNumber += 1;
      $game.$map.transitionMap(_stepNumber);
    }
    else {
      $game.endTransition();
    }
  },

  //resumes normal state of being able to walk and enables chat etc.
  endTransition: function () {
    $game.removeFlag('in-transit');
    $game.$player.isMoving = false;
    $game.$player.resetRenderValues();
    $game.$others.resetRenderValues();
    //now that the transition has ended, create a new grid
    $game.$map.createPathGrid(function () {
      $game.$map.stepDirection = null;
    });
    $game.$player.displayNpcComments();
    $game.$player.saveTimeToDB();
  },

  //the game loop, if it is running, call all the updates and render
  tick: function () {
    if ($game.running) {
      if ($game.$player.currentLevel < 4 || (!$game.bossModeUnlocked && $game.$player.currentLevel > 3)) {
        $game.$others.update();
        $game.$npc.update();
        $game.$botanist.update();
        $game.$robot.update();
      }
      $game.$player.update();
      $game.$render.renderFrame();
      window.requestAnimationFrame($game.tick);
    }
  },

  //displays the progress area section, pulling the latest pertient data
  showProgress: function () {

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
      topPlayers += '<li>' + _stats.leaderboard[i].name + ' &mdash; ' + _stats.leaderboard[i].count + '</li>';
    }
    topPlayers += '</ol>';
    topPlayers += '<p class="yourSeeds">You (' + tilesColored + ')</p>';

    //player's answers for all the open-ended questions, some others stats
    var allAnswers = $game.$player.compileAnswers();
    var percentString = _stats.percent + '%';
    var numItems = $game.$player.getResourcesDiscovered();

    //display everthing
    $('.displayPercent .progress .bar').css('width', percentString)
    if (allAnswers) {
      $('.displayMyAnswers').empty().append(allAnswers)
    }
    $('.displayTime').html('<i class="fa fa-clock-o fa-lg"></i> ' + displayTime);
    //$('.displayPercent').text(percentString);
    $('.topSeeders').empty().append(topPlayers);
    $('.numCollected').text(numItems + ' / 42');

    /*
    $('#progress-area').show(function () {
      $game.showingProgress = true;
    });
    */
  },

  // Shows a message in either an on-screen display, in the chat log, or both
  statusUpdate: function (data) {
    var $el = $('#status-update')

    if (data.screen) {
      $el.find('span').text(data.message)
      $el.fadeIn(100)
      clearTimeout(_displayTimeout)
      var len      = data.message.length,
          fadeTime = len * 100 + 500
      _displayTimeout = setTimeout(function () {
        $el.fadeOut(150)
      }, fadeTime)
    }
    if (data.log) {
      $game.$log.addMessage(data)
    }
  },

  // Use $game.statusUpdate() to display an on-screen message only.
  alert: function (message) {
    $game.statusUpdate({
      message: message,
      input:   'status',
      screen:  true,
      log:     false
    })
  },

  // Use $game.statusUpdate() to display a log entry only.
  log: function (message) {
    $game.statusUpdate({
      message: message,
      input:   'status',
      screen:  false,
      log:     true
    })
  },

  // Use $game.statusUpdate() to display both both log and on-screen message.
  broadcast: function (message) {
    $game.statusUpdate({
      message: message,
      input:   'status',
      screen:  true,
      log:     true
    })
  },

  debug: function (message) {
    console.error('CIVIC SEED DEBUG MESSAGE: ' + message)
  },

  highlightUI: function (target) {
    $('.hud .hud-button').removeClass('hud-button-highlight') // Removes all previous HUD highlights
    $(target).addClass('hud-button-highlight')
  },

  unhighlightUI: function (target) {
    $(target).removeClass('hud-button-highlight')
  },

  getBadgeCount: function (target) {
    return window.parseInt($(target).find('.badge').text()) || 0
  },

  setBadgeCount: function (target, quantity) {
    var badge = $(target).find('.badge')
    badge.text(quantity)

    // Hide or show badge depending on quantity
    // This can be overridden in the layout with a class of always-show, which will never hide.
    if (quantity > 0 || badge.hasClass('always-show')) {
      badge.show()
    }
    else if (quantity <= 0 && !badge.hasClass('always-show')) {
      badge.hide()
    }
  },

  addBadgeCount: function (target, quantity) {
    var number = this.getBadgeCount(target) + quantity
    this.setBadgeCount(target, number)
  },

  //triggered by a change server-side in the leaderboard
  updateLeaderboard: function (data) {
    var leaderChange = true;
    if (_stats.leaderboard.length > 0) {
      leaderChange = (_stats.leaderboard[0].name === data.board[0].name) ? false : true
    }
    if (leaderChange) {
      $game.broadcast(data.board[0].name + ' is top seeder!')
    }
    _stats.leaderboard = data.board;
  },

  //triggered by a change server-side in the color map percent
  updatePercent: function (dropped) {
    _stats.prevPercent = _stats.percent;
    _stats.seedsDropped = dropped;
    _stats.percent = Math.floor(( _stats.seedsDropped / _stats.seedsDroppedGoal) * 100);
    //var percentString = _stats.percent + '%';

    //if we have gone up a milestone, feedback it
    if (_stats.percent > 99 && !$game.bossModeUnlocked) {
      //do something for game over?
        $game.statusUpdate({message:'The meter is full! The color has been restored.',input:'status',screen: true,log:true});
    }
    if (_stats.prevPercent != _stats.percent) {
      _stats.prevPercent = _stats.percent;
      if (_stats.percent % 5 === 0) {
        //$game.temporaryStatus('the world is now ' + percentString + ' colored!');
        //$game.statusUpdate({message:'',input:'status',screen: true,log:true});
      }
    }
  },

  // save and exit game
  exitGame: function (callback) {
    // console.log('exiting game!');
    sessionStorage.removeItem('isPlaying');
    $game.running = false;
    // TODO: fade out, instead of abrupt stop???
    $game.$audio.stopAll();
    // save out all current status of player to db on exit
    if (!$game.bossModeUnlocked) {
      $game.$player.saveTimeToDB();
    }
    $game.$map.removePlayer($game.$player.id);
    ss.rpc('game.player.exitPlayer', {
      id:   $game.$player.id,
      name: $game.$player.firstName
    }, function () {
      if (typeof callback === 'function') {
        callback();
      }
    });
  },

  //startup boss level if player finished game and boss level is unlocked
  toBossLevel: function () {
    $game.$audio.pauseTrack();
    $game.$render.clearMap();
    $game.$player.setPositionInfo();
    $game.$botanist.disable();
    $game.$robot.disable();
    $game.$others.disable();
    _game.setBoundaries();
    _game.startGame(true);
  },

  // Checks to see if a game state flag is set
  checkFlag: function (flag) {
    // Returns true if a given flag is found, and false if not
    return _.contains(_game.flags, flag)
  },

  // Sets a current game state flag
  setFlag: function (flag) {
    // Returns true if able to be set
    if (!this.checkFlag(flag)) {
      _game.flags.push(flag)
      return true
    }
    // Returns false if flag was not set (e.g. it was already set)
    else return false
  },

  // Alias for setFlag()
  flag: function (flag) {
    return this.setFlag(flag)
  },

  // Remove one or all game state flags
  removeFlag: function (flag) {
    if (flag) {
      _game.flags = _.reject(_game.flags, function (item) { return item === flag })
    }
    // If no flag is given, clear all flags
    else {
      _game.flags = []
    }
  }

};

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _game = {

  flags: [],

  // At start of the game, append DOM elements
  kickOffGame: function () {
    $CONTAINER.append(JT['game-gameboard']())
    $CONTAINER.append(JT['game-resourcestage']())
    $CONTAINER.append(JT['game-hud']())

    // all the init calls will trigger others, a waterfall approach to assure
    // the right data is loaded before we start
    $game.$player.init(function () {
      _game.loadGameInfo();
    });
  },

  loadGameInfo: function () {
    // get the global game information stats
    ss.rpc('game.player.getGameInfo', function (response) {
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
      $game.$render.init(function () {
        _game.loadMap();
      });
    });
  },

  loadMap: function() {
    $game.$map.init(function () {
      // required for npcs to be placed
      _game.setBoundaries();
      _game.loadOthers();
    });
  },

  loadOthers: function () {
    //depends on map
    $game.$others.init(function () {
      _game.loadNpc();
    });
  },

  loadNpc: function () {
    $game.$npc.init(function () {
      _game.loadResources();
    });
  },

  loadResources: function () {
    //depends on npc
    $game.$resources.init(function () {
      _game.loadBotanist();
    });
  },

  loadBotanist: function () {
    //depends on player/game
    $game.$botanist.init(function () {
      _game.loadRobot();
    });
  },

  loadRobot: function () {
    $game.$robot.init(function () {
      _game.loadAudio();
    });
  },

  loadAudio: function () {
    //depends on player position
    $game.$audio.init(function () {
      _game.loadChat();
    });
  },

  loadChat: function () {
    $game.$chat.init(function () {
      _game.loadLog();
    });
  },

  loadLog: function () {
    $game.$log.init(function () {
      _game.loadExtra();
    });
  },

  //this is all the other stuff that needs to happen once everything is loaded
  loadExtra: function () {
    //fill player inventory and creat outlines
    if ($game.$player.currentLevel < 4) {
      $game.$player.setupInventory()
    }

    //make players color map
    var src = $game.$player.getColorMap();
    if (src !== undefined) {
      $game.$render.imageToCanvas(src);
    }
    //create collective image
    $game.$map.createCollectiveImage();

    //update text in HUD
    // var percentString = _stats.percent + '%';
    // $('.hud-progress .badge').text(percentString);

    //init chat rpc
    ss.rpc('game.chat.init');
    _game.startGame();
  },

  //calculates the bounding box for the current viewport to get the right tiles
  setBoundaries: function () {
    //calculate the top left corner of the viewport based on where the player is
    var position = $game.$player.getPosition(),
        tx       = (position.x === 0) ? 0 : position.x - 1,
        ty       = (position.y === 0) ? 0 : position.y - 1,
        divX     = Math.floor(tx / ($game.VIEWPORT_WIDTH - 2)),
        divY     = Math.floor(ty / ($game.VIEWPORT_HEIGHT - 2)),
        startX   = divX * ($game.VIEWPORT_WIDTH - 2),
        startY   = divY * ($game.VIEWPORT_HEIGHT - 2)

    $game.masterX = startX;
    $game.masterY = startY;

    $game.$map.setBoundaries();
  },

  //start the game, decide if going to boss level or not
  startGame: function (ingame) {
    if ($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
      $game.$boss.init(function () {
        //TODO: something here?
      });
    }
    $game.$map.firstStart(function () {
      if (!ingame) {
        $('#loading').fadeOut(function () {
          $(this).remove();
          $game.ready = true;
          $game.running = true;
          $game.$render.renderAllTiles();
          $game.tick();
          $game.$player.displayNpcComments();
          if ($game.checkFlag('first-time') === true) {
            $game.alert('Welcome to Civic Seed!')
            $game.$botanist._nudgePlayerTimeout = window.setTimeout(function () { $game.alert('Talk to the botanist')}, 4000)
          }
          else if ($game.$player.botanistState === 0) {
            $game.$botanist.nudgePlayer()
          }
        });
      }
    });
  }

}
