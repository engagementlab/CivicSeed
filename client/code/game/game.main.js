'use strict'
/* global ss, Davis, JT, $, $CONTAINER, apprise */

// PRIVATE GAME VARS
var _stepNumber = 0
var _stats = null
var _displayTimeout = null

// PUBLIC EXPORTS
var $game = module.exports = {

  // GLOBAL GAME CONSTANTS
  VIEWPORT_WIDTH: 30,
  VIEWPORT_HEIGHT: 15,
  TOTAL_WIDTH: 142,
  TOTAL_HEIGHT: 132,
  TILE_SIZE: 32,
  STEP_PIXELS: 4,
  PIXEL_RATIO: 1,

  // GLOBAL GAME VARS
  currentTiles: [],
  running: false,
  ready: false,
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

  instantiated: false,

  init: function (callback) {
    console.log('Initializing all modules')

    // Instantiating code
    this.flags = require('/game.flags')
    this.inventory = require('/game.inventory')
    this.minimap = require('/game.minimap')

    // TODO: Don't use $ as a prefix for stuff
    // (because that usually means jQuery)
    // So, steadily search-replace stuff
    this.$map = require('/game.map')
    this.$render = require('/game.render')
    this.$npc = require('/game.npc')
    this.$resources = require('/game.resources')
    this.$skins = require('/game.skins')
    this.$player = require('/game.player')
    this.$others = require('/game.others')
    this.$robot = require('/game.robot')
    this.$botanist = require('/game.botanist')
    this.$mouse = require('/game.mouse')
    this.$audio = require('/game.audio')
    this.$pathfinder = require('/game.pathfinder')
    this.$events = require('/game.events')
    this.$input = require('/game.input')
    this.$chat = require('/game.chat')
    this.$log = require('/game.log')
    this.$boss = require('/game.boss')

    // Initalize modules
    this.$events.init()
    this.$input.init()

    // TODO: there needs to be some other kind of mechanism to see if the user has retired from the game...
    $(window).on('beforeunload', function () {
      if (sessionStorage.isPlaying === 'true') {
        return $game.exitGame()
      }
    })

    this.instantiated = true
  },

  // Must reset every module because init won't be called since the app was already loaded once (if they navigate to profile and back for example)
  // TODO: Refactor
  reInit: function () {
    console.log('Resetting all modules')
    this.resetInit()
    this.$map.resetInit()
    this.$render.resetInit()
    this.$npc.resetInit()
    this.$resources.resetInit()
    this.$player.resetInit()
    this.$others.resetInit()
    this.$robot.resetInit()
    this.$botanist.resetInit()
    this.$audio.resetInit()
    this.$log.resetInit()
  },

  // Resets the local game vars
  // TODO: Refactor
  resetInit: function () {
    _stepNumber = 0
    _stats = null
    _displayTimeout = null

    this.currentTiles = []
    this.flags.unset('screen-transition')
    this.running = false
    this.ready = false
    this.graph = null
    this.masterX = null
    this.masterY = null
    this.bossModeUnlocked = null
  },

  kickOffGame: function () {
    // Alias for private function
    _game.kickOffGame()
  },

  enterGame: function (callback) {
    // Check if they are ACTUALLY playing
    ss.rpc('shared.account.checkGameSession', function (response) {
      // YOU KNOW, THIS COULD ALL HAPPEN ELSEWHERE?
      if (!$game.instantiated) {
        $game.init()
      } else {
        $game.reInit()
      }

      if (response.status) {
        sessionStorage.setItem('isPlaying', true)
        _game.kickOffGame()
      } else {
        if (response.profileLink) {
          Davis.location.assign('/profiles/' + response.profileLink)
        }

        apprise('There seems to have been an error accessing the game.<br><br><span style="display:block;font-size:11px;text-align:center;">(If you think there is a problem, please contact the website administrator.)</span>')
      }
    })
  },

  // pause menu on browser tab unfocus (currently disabled)
  pause: function () {
    $('#pause-menu').fadeIn()
    $game.running = false
    // TODO: play pause music?
    // CAN USE: $game.$audio.stopAll();
  },

  // resume from the pause menu, start up game loop (currenty disabled)
  resume: function () {
    $('#pause-menu').slideUp(function () {
      $game.running = true
      $game.tick()
    })
  },

  // Starts a transition from one viewport to another
  beginTransition: function () {
    // Verify that the player is at the edge of a screen
    // Refuse transition if player is not at a transitional edge
    // This catches bugs
    var position = $game.$player.getLocalPosition()
    if (!(position.x === 0 ||
        position.x === $game.VIEWPORT_WIDTH - 1 ||
        position.y === 0 ||
        position.y === $game.VIEWPORT_HEIGHT - 1) &&
        $game.$map.isMapEdge(position) === false) {
      $game.flags.unset('screen-will-transition')
      return false
    }

    $game.flags.set('screen-transition')
    $game.flags.unset('screen-will-transition')

    var doTravel = function () {
      _stepNumber = 0
      $game.$chat.hideChat()
      $game.$others.hideAllChats()
      $game.$player.clearNpcComments()

      // Force clear all chats here (TODO: This is a hack because $others.hideAllChats() *SHOULD* BE DOING THIS!)
      $game.$chat.clearAllChats()
      $game.stepTransition()
    }

    // Wait until map data of next screen is fully loaded
    var beginTravel = function () {
      if ($game.$map.dataLoaded) {
        doTravel()
      } else {
        setTimeout(beginTravel, 50)
      }
    }

    beginTravel()
  },

  // Decides if we continue tweening the viewports or to end transition
  stepTransition: function () {
    if (_stepNumber < $game.$map.numberOfSteps) {
      _stepNumber += 1
      $game.$map.transitionMap(_stepNumber)
    } else {
      $game.endTransition()
    }
  },

  // Resumes normal state of being able to walk and enables chat etc.
  endTransition: function () {
    $game.flags.unset('screen-transition')
    $game.flags.unset('is-moving')

    // Now that the transition has ended, create a new grid
    $game.$pathfinder.createPathGrid()
    $game.$map.stepDirection = null

    // Other updates
    $game.$player.resetRenderValues()
    $game.$others.resetRenderValues()
    $game.$player.displayNpcComments()
    $game.minimap.radar.update()
    $game.$player.saveTimeToDB()
  },

  // If game loop is running, call all the updates and render
  tick: function () {
    if ($game.running) {
      // if ($game.$player.currentLevel < 4 || (!$game.bossModeUnlocked && $game.$player.currentLevel > 3)) {
      if (!$game.bossModeUnlocked) {
        $game.$others.update()
        $game.$npc.update()
        $game.$botanist.update()
        $game.$robot.update()
      }
      $game.$player.update()
      $game.$render.renderFrame()
    }
    window.requestAnimationFrame($game.tick)
  },

  // Updates the progress area section, pulling the latest pertinent data
  updateProgressOverlay: function () {
    var playerLevel = $game.$player.getLevel()
    var tilesColored = $game.$player.getTilesColored()
    var resourcesDiscovered = $game.$player.getResourcesDiscovered()
    var allAnswers = $game.$player.compileAnswers()
    var percentString = _stats.percent + '%'
    var topPlayers = ''

    // Save and show player's colors
    var myImageSrc = $game.$map.saveImage()
    $game.$map.createCollectiveImage()

    // Show proper level image and color map
    $('.level-images img').removeClass('current-level-image')
    $('.level-images img:nth-child(' + (playerLevel) + ')').addClass('current-level-image')
    $('.current-level-name').text($game.playerRanks[$game.$player.currentLevel])

    $('.color-map-you img.color-map-image')
      .attr('src', myImageSrc)
      .attr('width', '426px')

    for (var i = 0; i < _stats.leaderboard.length; i++) {
      topPlayers += '<li>' + _stats.leaderboard[i].name + ' &mdash; ' + _stats.leaderboard[i].count + '</li>'
    }

    // Display everthing
    $('.percent-complete .progress .bar').css('width', percentString)
    if (allAnswers) {
      $('.displayMyAnswers').empty().append(allAnswers)
    }
    $('.time-played-text').text(_formatDisplayTime())
    $('.top-seeders-ranking').html(topPlayers)
    $('.your-seeds').text('You (' + tilesColored + ')')
    $('.resources-collected').text(resourcesDiscovered + ' / 42') // TODO: FIX

    // Calculates the playing time
    function _formatDisplayTime () {
      var playingTime = $game.$player.getPlayingTime()
      var hours = Math.floor(playingTime / 3600)
      var hoursRemainder = playingTime % 3600
      var minutes = Math.floor(hoursRemainder / 60)
      var seconds = playingTime % 60

      return hours + 'h ' + minutes + 'm ' + seconds + 's'
    }
  },

  // Shows a message in either an on-screen display, in the chat log, or both
  statusUpdate: function (data) {
    var $el = $('#status-update')

    if (data.screen) {
      var len = data.message.length
      var fadeTime = len * 100 + 500

      $el.find('span').text(data.message)
      $el.fadeIn(100)
      clearTimeout(_displayTimeout)

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
      input: 'status',
      screen: true,
      log: false
    })
  },

  // Use $game.statusUpdate() to display a log entry only.
  log: function (message) {
    $game.statusUpdate({
      message: message,
      input: 'status',
      screen: false,
      log: true
    })
  },

  // Use $game.statusUpdate() to display both both log and on-screen message.
  broadcast: function (message) {
    $game.statusUpdate({
      message: message,
      input: 'status',
      screen: true,
      log: true
    })
  },

  debug: function (message) {
    console.error('CIVIC SEED DEBUG MESSAGE: ' + message)
  },

  // HUD inventory badges that show numbers
  getBadgeCount: function (target) {
    var count = document.querySelector(target + ' .badge').textContent
    return window.parseInt(count) || 0
  },

  setBadgeCount: function (target, quantity) {
    var badge = document.querySelector(target + ' .badge')
    badge.textContent = quantity

    // Hide or show badge depending on quantity
    // This can be overridden in the layout with a class of always-show, which will never hide.
    if (quantity > 0 || badge.classList.contains('always-show')) {
      badge.style.display = 'block'
    } else if (quantity <= 0 && !badge.classList.contains('always-show')) {
      badge.style.display = 'none'
    }
  },

  // Add a certain number of seeds to the current count.
  // Pass in a negative quantity to subtract.
  addBadgeCount: function (target, quantity) {
    var number = this.getBadgeCount(target) + quantity
    this.setBadgeCount(target, number)
  },

  // Triggered by a change server-side in the leaderboard
  updateLeaderboard: function (data) {
    var leaderChange = true
    if (_stats.leaderboard.length > 0) {
      leaderChange = (_stats.leaderboard[0].name === data.board[0].name) ? false : true
    }
    if (leaderChange) {
      $game.broadcast(data.board[0].name + ' is top seeder!')
    }
    _stats.leaderboard = data.board
  },

  // Triggered by a change server-side in the color map percent
  updatePercent: function (dropped) {
    _stats.prevPercent = _stats.percent
    _stats.seedsDropped = dropped
    _stats.percent = Math.floor((_stats.seedsDropped / _stats.seedsDroppedGoal) * 100)

    // If we have gone up a milestone, give feedback
    if (_stats.percent > 99 && !$game.bossModeUnlocked) {
      // TODO: do something for game over?
      $game.broadcast('The meter is full! The color has been restored.')
    }

    // Things to do as progress goes up
    /*
    if (_stats.prevPercent !== _stats.percent) {
      _stats.prevPercent = _stats.percent
      if (_stats.percent % 5 === 0) {
        //$game.temporaryStatus('the world is now ' + percentString + ' colored!');
        //$game.statusUpdate({message:'',input:'status',screen: true,log:true});
      }
    }
    */
  },

  // save and exit game
  exitGame: function (callback) {
    // Kill the audio & graphics
    $game.$audio.stopAll()
    $game.minimap.removePlayer($game.$player.id)

    // save out all current status of player to db on exit
    if (!$game.bossModeUnlocked) {
      $game.$player.saveTimeToDB()
    }

    ss.rpc('game.player.exitPlayer', {
      id: $game.$player.id,
      name: $game.$player.firstName
    }, function () {
      if (typeof callback === 'function') {
        callback()
      }
    })

    // Clear all state flags and things
    sessionStorage.removeItem('isPlaying')
    $game.$botanist.unload()
    $game.running = false
    $game.flags.unsetAll()
  },

  // startup boss level if player finished game and boss level is unlocked
  toBossLevel: function () {
    $game.$audio.pauseTrack()
    $game.$render.clearMap()
    $game.$player.setPositionInfo()
    $game.$player.clearNpcComments()
    $game.$botanist.disable()
    $game.$robot.disable()
    $game.$others.disable()
    _game.setBoundaries()
    _game.startGame(true)
  }

}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _game = {

  // At start of the game, append DOM elements
  kickOffGame: function () {
    $CONTAINER.append(JT['game-index']())

    // all the init calls will trigger others, a waterfall approach to assure
    // the right data is loaded before we start
    $game.$player.init(function () {
      _game.loadGameInfo()
    })
  },

  loadGameInfo: function () {
    // get the global game information stats
    ss.rpc('game.player.getGameInfo', function (response) {
      // regular game mode
      $game.bossModeUnlocked = response.bossModeUnlocked

      _stats = {
        seedsDropped: response.seedsDropped,
        seedsDroppedGoal: response.seedsDroppedGoal,
        leaderboard: response.leaderboard,
        percent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100),
        prevPercent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100)
      }
      $game.$player.setPositionInfo()

      // required for npcs to be placed
      _game.setBoundaries()

      $game.$render.init(function () {
        _game.loadMinimap()
      })
    })
  },

  loadMinimap: function () {
    $game.minimap.init(function () {
      _game.loadOthers()
    })
  },

  loadOthers: function () {
    // Must load after map
    $game.$others.init(function () {
      _game.loadNpc()
    })
  },

  loadNpc: function () {
    $game.$npc.init(function () {
      _game.loadResources()
    })
  },

  loadResources: function () {
    // Must load after npc
    $game.$resources.init(function () {
      _game.loadBotanist()
    })
  },

  loadBotanist: function () {
    // Must load after player/game
    $game.$botanist.init(function () {
      _game.loadRobot()
    })
  },

  loadRobot: function () {
    $game.$robot.init(function () {
      _game.loadAudio()
    })
  },

  loadAudio: function () {
    // Must load after getting player position
    $game.$audio.init(function () {
      _game.loadChat()
    })
  },

  loadChat: function () {
    $game.$chat.init(function () {
      _game.loadLog()
    })
  },

  loadLog: function () {
    $game.$log.init(function () {
      _game.loadExtra()
    })
  },

  // This is all the other stuff that needs to happen once everything is loaded
  loadExtra: function () {
    // Fill player's inventory and create outlines
    if ($game.$player.currentLevel < 4) {
      $game.inventory.init()
    }

    // Make player's color map
    var src = $game.$player.getColorMap()
    if (src !== undefined) {
      $game.$render.imageToCanvas(src)
    }

    $game.$map.createCollectiveImage()

    _game.startGame()
  },

  // Calculates the bounding box for the current viewport to get the right tiles
  setBoundaries: function () {
    // Calculate the top left corner of the viewport based on where the player is
    var position = $game.$player.getPosition()
    var tx = (position.x === 0) ? 0 : position.x - 1
    var ty = (position.y === 0) ? 0 : position.y - 1
    var divX = Math.floor(tx / ($game.VIEWPORT_WIDTH - 2))
    var divY = Math.floor(ty / ($game.VIEWPORT_HEIGHT - 2))
    var startX = divX * ($game.VIEWPORT_WIDTH - 2)
    var startY = divY * ($game.VIEWPORT_HEIGHT - 2)

    $game.masterX = startX
    $game.masterY = startY

    $game.$map.setBoundaries()
  },

  // Start the game, decide if going to boss level or not
  startGame: function (ingame) {
    if ($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
      $game.$boss.init()
    }

    $game.$map.firstStart(function () {
      if (ingame) return

      $('#loading').fadeOut(function () {
        $(this).remove()
        $game.ready = true
        $game.running = true
        $game.$render.renderAllTiles()
        $game.tick()
        $game.$player.displayNpcComments()

        // Turn on minimap view on gameboard
        $game.minimap.addPlayer($game.$player.id, $game.$player.getPosition(), $game.$player.getCSSColor())
        $game.minimap.radar.update()
        $game.minimap.show()

        // Things to do if the player has not completed the tutorial
        if ($game.flags.check('first-time') === true) {
          $game.alert('Welcome to Civic Seed!')
        } else {
          // Things to do if this is not the player's first time here
          $game.$player.giveMapToPlayer()
        }

        // If the player has completed level 4 but the world color meter not restored
        if ($game.$player.getLevel() > 4) {
          $game.$botanist.finishedAllBotanistPuzzles(0)
        }

        // Set up a nudge for the botanist, in case it needs to happen
        $game.$botanist._nudgePlayerTimeout = window.setTimeout($game.$botanist.nudgePlayer, 4000)

        // Apply skin flags ?
        $game.$skins.applyFlags()
      })
    })
  }

}
