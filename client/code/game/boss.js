'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    boss.js

    - Controls boss mode.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $boss = $game.$boss = {

  // Initialize boss mode
  init: function (callback) {
    $('.hud-regular').fadeOut('fast')
    document.getElementById('background').classList.add('lab-background')
    $game.setFlag('boss-mode')
    _boss.createGrid()

    _boss.setupCutsceneVideos()
    _boss.showOverlay(0)

    if (typeof callback === 'function') callback()
  },

  // Start seed mode. Called via $input
  startSeedMode: function () {
    if (_boss.seeds.regular > 0) {
      _boss.seeds.current = 'regular'
    }
  },

  // Ends seed mode. Hands control back to $input
  endSeedMode: function () {
    _boss.seeds.current = 'none'
    $game.$input.endSeedMode()
  },

  // Drop a seed to reveal clues
  dropSeed: function (position) {
    // Do not allow seed drop to occur if the game is paused
    if (_boss.clock.isPaused) return

    // Regular seed action.
    if (_boss.seeds.current === 'regular') {
      $game.$audio.playTriggerFx('seedDrop');

      _boss.addSeedCount('regular', -1)
      _boss.renderTiles(position)

      // Out of seeds!
      if (_boss.seeds.regular <= 0) {
        $game.alert('You are out of seeds!')
        $boss.endSeedMode()

        // Check if player fails
        _boss.checkFail()
      }
    }

    // Note: previous version of this script included
    // a draw seed type which has been removed.
  },

  // When player stops on a tile, determine if we picked up a charger or an item
  endMove: function (position) {
    var tile = _boss.grid[position.x][position.y]

    // Prevent anything from occurring if something has paused the game (e.g. timer ran out)
    if (_boss.clock.isPaused) return

    // If player lands on a charger or item, pick it up / activate it
    // Check for charger first, then the item.
    if (tile.charger === 1) _boss.pickUpCharger()
    else if (tile.item) _boss.activateItem(tile)
  }
};

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _boss = {

  grid:       [],
  totalScore: null,
  modeScore:  null,

  numberOfChargers: 4,
  theCharger: {
    x:        null,
    y:        null,
    revealed: null
  },
  chargersCollected: 0,    // Stores the number of chargers picked up
  seeds:      {            // Stores quantity of seeds and current seed mode
    regular:  null,
    draw:     null,        // Note: draw seeds are a legacy feature of boss mode?
    current:  null         // To store the current seed mode
  },

  // Set up all items for the boss game.
  items: [
    {
      name: 'timewarp',
      description: 'Speeds up time, bad for the player.',
      id: 0,
      spriteIndex: 0,
      message: 'Uh oh... time warp!',
      immediate: true,
      activate: function () {
        _boss.clock.speed = 4
        _boss.clock.clockTimeout = setTimeout(function () {
          _boss.clock.speed = 1
        }, 5000)
      }
    },
    {
      name: 'wipeout',
      description: 'Removes all revealed tiles',
      id: 1,
      spriteIndex: 1,
      message: 'Wipeout!',
      immediate: true,
      activate: function () {
        setTimeout(function () {
          _boss.hideAllItems()
          $game.$render.clearBossLevel()
        }, 1000)

        // Hide the charger
        _boss.theCharger.revealed = false
      }
    },
    {
      name: 'timefreeze',
      description: 'Stops the clock for 5 seconds',
      id: 2,
      spriteIndex: 2,
      message: 'Time freeze, nice!',
      immediate: false,
      activate: function () {
        _boss.clock.speed = 0
        clearTimeout(_boss.clock.clockTimeout)
        _boss.clock.clockTimeout = setTimeout(function () {
          _boss.clock.speed = 1
        }, 5000)
      }
    },
    {
      name: 'bonusseeds',
      description: 'Add more seeds for the player',
      id: 3,
      spriteIndex: 3,
      message: 'Bonus seeds!',
      immediate: false,
      activate: function () {
        _boss.addSeedCount('regular', 3)
      }
    }
  ],

  // Setup cutscene DOM element
  setupCutsceneVideos: function () {
    var el = document.createElement('div')
    el.id = 'boss-cutscene'
    el.classList.add('cutscene-background')
    el.style.display = 'none'
    document.getElementById('gameboard').appendChild(el)

    // Now preload all the videos
    _boss.preloadVideos()
  },

  // Preload all cutscene videos
  preloadVideos: function () {
    var numberVideos = 4,
        videoEl      = null

    for (var i = 0; i < numberVideos; i++) {
      this.loadVideo(i)
    }
  },

  // Load a cutscene video
  loadVideo: function (number) {
    var videoEl      = document.createElement('video'),
        path         = CivicSeed.CLOUD_PATH + '/audio/cutscenes/'

    if (CivicSeed.ENVIRONMENT === 'development') {
      videoEl.src = (Modernizr.video.h264) ? path + number + '.mp4' : path + number + '.webm?VERSION=' + Math.round(Math.random(1) * 1000000000)
    }
    else {
      videoEl.src = (Modernizr.video.h264) ? path + number + '.mp4?VERSION=' + CivicSeed.VERSION : path + number + '.webm?VERSION=' + CivicSeed.VERSION
    }

    videoEl.id = 'boss-cutscene-' + number
    videoEl.classList.add('cutscene')
    videoEl.style.display = 'none'
    videoEl.addEventListener('canplaythrough', _listenerFunction)
    videoEl.addEventListener('error', function (e) {
      $game.debug('Boss cutscene video error')
    })

    function _listenerFunction (e) {
      videoEl.removeEventListener('canplaythrough', _listenerFunction)
      document.getElementById('boss-cutscene').appendChild(videoEl)
    }
  },

  showOverlay: function (section) {
    var overlay = document.getElementById('boss-area')
    overlay.style.display = 'block'
    $game.setFlag('visible-boss-overlay')
    _boss.addContent(section)
  },

  hideOverlay: function (callback) {
    var overlay = document.getElementById('boss-area')
    $(overlay).fadeOut('fast', function () {
      $game.removeFlag('visible-boss-overlay')
      if (typeof callback === 'function') callback()
    })
  },

  resetContent: function () {
    var overlay = document.getElementById('boss-area')
    _.each(overlay.querySelectorAll('.boss-introduction, .boss-resumes, .boss-instructions, .boss-win'), function (el) {
      el.style.display = 'none'
    })
    overlay.querySelector('.dialog').style.display = 'block'
  },

  // Add content to the boss area overlay window
  addContent: function (section) {
    var overlay   = document.getElementById('boss-area'),
        speakerEl = overlay.querySelector('.dialog .speaker'),
        messageEl = overlay.querySelector('.dialog .message'),
        speaker   = $game.$botanist.name,
        resumes   = null,
        el        = null

    var html = '';

    _boss.resetContent()

    // Determine what content to add.
    switch (section) {
      // [SECTION 00] VIDEO INTRO TO BOSS LEVEL.
      case 0:
        el = overlay.querySelector('.boss-introduction')
        el.style.display = 'block'
        el.innerHTML = '<iframe src="//player.vimeo.com/video/74144898" width="600" height="337" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'
        overlay.querySelector('.dialog').style.display = 'none'

        _boss.setButton(1)
        break
      // [SECTION 01] RESUMES AND RESPONSES.
      case 1:
        ss.rpc('game.player.getRandomResumes', {instanceName: $game.$player.instanceName}, function (res) {
          el = overlay.querySelector('.boss-resumes')
          var resumeContent = el.querySelector('.content-box')

          speakerEl.textContent = speaker
          messageEl.innerHTML = 'To find the charging modules, you will need to use my <strong class="color-darkgreen">Special Seeds</strong>. But... the seeds aren’t finished yet. You’ll need to add the last ingredient. Please read what your fellow players have said and provide feedback. This will help them improve their civic resumes. Review them all to receive your <strong class="color-darkgreen">Special Seeds!</strong>'

          resumes = _boss.chooseResumeResponses(res)

          // There are no resumes to respond to; move onto the next section.
          if (resumes.length < 1) {
            _boss.addContent(2)
            return
          }

          // If there are resumes to respond to, add them
          for (var i = 0; i < resumes.length; i++) {
            var question = $game.$botanist.getLevelQuestion(resumes[i].level);
            html += '<div class="resume-response">';
            html += '<p class="resume-question">Q: ' + question + '</p>';
            html += '<p class="resume-answer"><span>A random peer said:</span> ' + resumes[i].answer + '</p>';
            html += '<div class="resume-response-prompt">'
            html += '<p>Do you have any feedback for his or her response? Enter it below.</p>'
            html += '<textarea class="resume-feedback" placeholder="Type your feedback here..." maxlength="5000"></textarea>'
            html += '</div>'
            html += '</div>'
          }
          resumeContent.innerHTML += html
          _boss.setButton(2, 'Save feedback', function () {
            _boss.saveFeedback(resumes)
          })

          el.style.display = 'block'
        })
        break
      // [SECTION 02] INSTRUCTIONS.
      case 2:
        speakerEl.textContent = speaker
        messageEl.textContent = 'Thanks! You got 20 special seeds.'
        $('.boss-instructions').show()
        _boss.setButton(5, 'Ready?', function () {
          _boss.beginGame()
        })
        break
      // [SECTION 03] FAIL SCREEN.
      case 3:
        speakerEl.textContent = speaker
        messageEl.textContent = 'You failed to defeat the robot. Why don’t you try again?'
        _boss.setButton(2, 'Play again')
        break
      // [SECTION 04] WIN SCREEN.
      case 4:
        ss.rpc('game.player.unlockProfile', $game.$player.id, function (err) {
          if (!err) {
            speakerEl.textContent = speaker
            messageEl.textContent = 'Congratulations, you defeated the robot!'

            el = overlay.querySelector('.boss-win')
            el.style.display = 'block'
            el.innerHTML = '<iframe src="//player.vimeo.com/video/74131828" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'
            _boss.setButton(5, 'Unlock profile', function () {
              window.location.assign('/profiles/' + sessionStorage.profileLink + '')
            })
          }
          else {
            $game.debug('Error unlocking profile. Server returned this message: ' + err)
          }
        })
        break
      default:
        // Nothing. Close this window.
        _boss.hideOverlay()
        break
    }
  },

  // There is only one button on the boss windows so this will do all the work
  setButton: function (section, display, callback) {
    var button = document.getElementById('boss-area').querySelector('.boss-button'),
        clone  = button.cloneNode(true)

    button = button.parentNode.replaceChild(clone, button)
    if (display) {
      clone.textContent = display
    }
    clone.addEventListener('click', function _click () {
      _boss.addContent(section)
      if (typeof callback === 'function') callback()
    })
  },

  // Choose random resume responses from peers
  chooseResumeResponses: function (data) {
    var numberToGet   = 4,
        allResponses  = _removeCurrentPlayer(data),
        theChosenOnes = []

    // Function to remove responses belonging to the current player.
    function _removeCurrentPlayer (data) {
      for (var i = 0; i < data.length; i++) {
        if (data[i]._id === $game.$player.id) {
          data.splice(i, 1)
          return data
        }
      }
      // If the current player is not found, just return everything
      return data
    }

    // Function to select a response at random, given a level
    function _selectResponse (level, data) {
      var responses = []

      // Create an array of all responses at a given level
      for (var i = 0; i < data.length; i++) {
        if (data[i].game.resume[level]) {
          responses.push(data[i])
        }
      }

      // Select one at random
      var random = Math.floor(Math.random() * responses.length)
      return responses[random]
    }

    // For each level, get a random response and select it for the Q&A.
    for (var i = 0; i < numberToGet; i++) {
      var response = _selectResponse(i, allResponses)

      if (response) {
        theChosenOnes.push({
          id:     response._id,
          level:  i,
          answer: response.game.resume[i]
        })
      }
    }

    return theChosenOnes
  },

  // Save feedback on resume responses to db for each user
  saveFeedback: function (resumes) {
    var info = []

    $('#boss-area textarea').each(function (i) {
      var val = this.value
      info.push({
        comment: val,
        id:      resumes[i].id
      })
    })

    ss.rpc('game.player.resumeFeedback', info)
  },

  // Create the basic grid
  createGrid: function () {
    var gridX = $game.VIEWPORT_WIDTH,
        gridY = $game.VIEWPORT_HEIGHT

    for (var x = 0; x < gridX; x++) {
      _boss.grid[x] = []
      for (var y = 0; y < gridY; y++) {
        _boss.grid[x][y] = {
          x: x,
          y: y
        }
      }
    }
  },

  // Utility method for performing actions on each tile on the gameboard grid.
  // Pass in a function as an argument to this method to act on each
  // tile. The function will be passed a reference to the tile
  forEachGridTile: function (func) {
    var gridX = $game.VIEWPORT_WIDTH,
        gridY = $game.VIEWPORT_HEIGHT

    for (var x = 0; x < gridX; x++) {
      for (var y = 0; y < gridY; y++) {
        if (typeof func === 'function') func(_boss.grid[x][y])
      }
    }
  },

  // Start the game, clock, sound
  beginGame: function () {
    // Display boss HUD
    $('.hud-boss').fadeIn('fast')

    // Clear the canvas
    $game.$render.clearBossLevel()

    // Set score from tiles colored
    _boss.updateScore($game.$player.getTilesColored())
    _boss.modeScore = 0

    // Set up seeds
    _boss.seeds.current = 'none'
    _boss.updateSeedCount('regular', 20)

    // Set up random items
    _boss.placeRandomItems()

    // Set up charger
    _boss.chargersCollected = 0
    _boss.theCharger = {}
    _boss.placeCharger()

    // Start the clock!
    _boss.clock.reset()
    _boss.clock.start()

    // Trigger boss music!
    $game.$audio.switchTrack(7)
  },

  // Place items randomly on grid
  placeRandomItems: function () {
    _boss.forEachGridTile(function (tile) {
      // Clear it first
      tile.item = null
      // 4% chance of a random item being placed on a tile.
      if (Math.floor(Math.random() * 100) <= 4) {
        tile.item = _boss.createRandomItem()
      }
    })
  },

  // Create a random item
  createRandomItem: function () {
    var numberOfItems = _boss.items.length
    return {
      id:       Math.floor(Math.random() * numberOfItems),
      revealed: false
    }
  },

  // Activate a special item
  activateItem: function (position) {
    var tile = _boss.grid[position.x][position.y],
        id   = null

    if (!tile.item || !tile.item.revealed) return false
    else {
      id = tile.item.id

      // Activate the item
      $game.alert(_boss.items[id].message)
      _boss.items[id].activate()

      // TODO: Animate the activation of the item so that player
      // knows it's active, before it is removed.

      // Remove the item from the grid.
      setTimeout(function () {
        $game.$render.clearMapTile(tile)
      }, 2000)

      // Disable item
      delete tile.item
    }
  },

  // Place the charger on a random tile
  placeCharger: function () {
    // Clear board of old charger(s) first.
    _boss.forEachGridTile(function (tile) {
      tile.charger = 0
    })

    // Choose a random tile.
    var x    = Math.floor(Math.random() * $game.VIEWPORT_WIDTH),
        y    = Math.floor(Math.random() * $game.VIEWPORT_HEIGHT),
        tile = _boss.grid[x][y]

    _boss.theCharger = {
      id:       _boss.chargersCollected + 1,
      x:        x,
      y:        y,
      revealed: false
    }

    _boss.calculateChargerProximity()

    // Set the grid item with the charger, replace an item if it's there
    tile.charger = 1
    if (tile.item) delete tile.item
  },

  // Calculate grid values based on charger location
  calculateChargerProximity: function () {
    _boss.forEachGridTile(function (tile) {
      tile.distance = _boss.getDistanceFromCharger(tile)
    })
  },

  // Calculate how far from the charger the tile is
  getDistanceFromCharger: function (position) {
    return Math.abs(position.x - _boss.theCharger.x) + Math.abs(position.y - _boss.theCharger.y)
  },

  // The player reveals the charger
  foundCharger: function () {
    $game.alert('You found a charger! Go to it to disable it.')
    _boss.theCharger.revealed = true
  },

  // Figure out how to render tiles after dropping a seed
  renderTiles: function (position) {
    var topLeftX = position.x - 1,
        topLeftY = position.y - 1,
        squares  = [],
        min      = 100,
        color    = '255, 0, 0'       // Red

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        var curX = topLeftX + x,
            curY = topLeftY + y;

        //only add it if in the bounds of the game area
        if (curX >= 0 && curX < $game.VIEWPORT_WIDTH && curY >= 0 && curY < $game.VIEWPORT_HEIGHT) {
          var tile          = _boss.grid[curX][curY]
          var distance      = tile.distance,
              spriteIndex   = -1 // By default, if there is no item pass this digit to the renderer to make it ignore this.

          // If player has revealed an item
          if (tile.item) {
            var itemId = tile.item.id

            // Set sprite index for render
            spriteIndex = _boss.items[itemId].spriteIndex

            // Set it to revealed
            tile.item.revealed = true

            // If they revealed a bad item, activate it now
            if (_boss.items[itemId].immediate === true) _boss.activateItem(tile)
          }
          // If player has found the charger
          if (tile.charger === 1) {
            _boss.foundCharger()
          }

          if (distance < min) min = distance
          squares.push({
            val:     distance,
            x:       curX,
            y:       curY,
            item:    spriteIndex,
            charger: tile.charger
          })
        }
      }
    }

    // Set color of the square
    for (var s = 0; s < squares.length; s++) {
      var alpha        = 0.8 - (squares[s].val - min) * 0.2 + 0.1
      squares[s].color = 'rgba(' + color + ', ' + alpha + ')'
    }

    // Render tiles
    $game.$render.renderBossTiles(squares)
  },

  // Update player's score on the HUD
  updateScore: function (score) {
    // Store internally
    _boss.totalScore = score

    // Update on the HUD
    var el = document.querySelector('.hud-boss .score span')
    el.textContent = score
  },

  // Update player's seed count on the HUD
  updateSeedCount: function (type, count) {
    _boss.seeds[type] = count
    $game.setBadgeCount('.hud-boss .hud-seed', count)
  },

  // Add seed count on the HUD by a certain amount
  addSeedCount: function (type, seeds) {
    _boss.seeds[type] += seeds
    $game.addBadgeCount('.hud-boss .hud-seed', seeds)
  },

  // Hide all revealed items on the gameboard
  hideAllItems: function () {
    _boss.forEachGridTile(function (tile) {
      if (tile.item) tile.item.revealed = false
    })
  },

  // Pick up the charger, and then check win condition or place a new charger.
  pickUpCharger: function () {
    var addPoints = 50

    // Pause the game
    _boss.clock.pause()

    // Update score
    _boss.modeScore += addPoints
    _boss.updateScore(_boss.totalScore + addPoints)

    // Clear board
    _boss.hideAllItems()
    $game.$render.clearBossLevel()

    // Play the cutscene video
    var cutsceneEl = document.getElementById('boss-cutscene'),
        videoEl    = document.getElementById('boss-cutscene-' + (_boss.theCharger.id - 1))

    $('#boss-cutscene').fadeIn('fast')
    $game.setFlag('playing-cutscene')
    videoEl.style.display = 'block'

    // Set up actions to perform after the video has finished
    videoEl.addEventListener('ended', _onVideoHasFinishedPlaying)
    videoEl.addEventListener('error', _onVideoHasFinishedPlaying) // In case of playback error, let's keep going instead of freezing the game

    // Play video
    videoEl.play()

    function _onVideoHasFinishedPlaying () {
      this.removeEventListener('ended', _onVideoHasFinishedPlaying)
      this.removeEventListener('error', _onVideoHasFinishedPlaying)
      _boss.hideCutscene(function callback() {
        _boss.nextCharger()
      })
    }
  },

  // Hide cutscene player element
  hideCutscene: function (callback) {
    $('#boss-cutscene').fadeOut('fast', function () {
      // Hide the video & unset flags
      $('#boss-cutscene .cutscene').hide()
      $game.removeFlag('playing-cutscene')

      if (typeof callback === 'function') callback()
    })
  },

  // After a charger is collected, reset, check win condition or place another charger
  nextCharger: function () {
    _boss.theCharger = {}
    _boss.chargersCollected++

    // Check if player wins, otherwise, keep going.
    if (_boss.checkWin() === true) {
      _boss.win()
    }
    else {
      // Generate new items
      _boss.placeRandomItems()
      // Place another charger
      _boss.placeCharger()

      // Tell the player how many chargers are left
      var chargersLeft = (_boss.numberOfChargers - _boss.chargersCollected),
          message      = ''

      if (chargersLeft === 1) {
        message = 'Just one charger left!'
      }
      else {
        message = 'Only ' + chargersLeft + ' chargers left!'
      }
      $game.alert(message)

      // Unpause the game
      _boss.clock.unpause()
    }
  },

  // Check if the player has beaten the boss mode
  checkWin: function () {
    // If all the chargers have been collected, YOU WIN!
    // if (_boss.chargersCollected >= _boss.numberOfChargers && _boss.modeScore === 200) {
    if (_boss.chargersCollected >= _boss.numberOfChargers) return true
    else return false
  },

  // If the player has failed the boss mode, return true and show fail screen.
  checkFail: function () {
    // Condition for failure:
    // If player is out of seeds, and the charger hasn't been revealed
    if (!_boss.theCharger.revealed || _boss.chargersCollected < _boss.numberOfChargers) {
      _boss.fail()
      return true
    }
    else return false
  },

  // Actions to perform if player wins
  win: function () {
    // Pause music & timer
    _boss.clock.pause()
    $game.$audio.pauseTrack()

    // Show win screen
    _boss.showOverlay(4)
  },

  // Show fail screen & gear up for a reset
  fail: function () {
    $game.$input.inactiveHUDButton('.hud-boss .hud-seed')
    $game.removeFlag('seed-mode')
    $game.$player.seedMode = false;
    $game.$player.resetRenderColor()
    _boss.clock.pause()
    _boss.showOverlay(3)
  },

  // Functions and settings for the boss mode timer
  clock: {
    startTime:    null,
    time:         null,
    elapsed:      null,
    target:       null,
    isPaused:     null,
    totalTime:    null,
    speed:        null, // Speed of clock. 0 = paused; 1 = normal; 2 = 2x speed, etc.
    clockTimeout: null,
    tickInterval: null,

    // Set all the variables pertaining to starting a new clock
    reset: function () {
      this.startTime = new Date().getTime()
      this.time      = 0
      this.elapsed   = 0
      this.isPaused  = false
      this.totalTime = 0
      this.target    = 90
      this.speed     = 1

      clearTimeout(this.clockTimeout)
      clearInterval(this.tickInterval)
    },

    // Start the clock
    start: function () {
      this.tickInterval = setInterval(this.update, 100)
    },

    // Update at each tick of the clock
    update: function () {
      var clockEl = document.querySelector('.hud-boss .clock'),
          self    = _boss.clock

      self.time      += 100
      self.totalTime += 100 * self.speed
      self.elapsed    = self.target - Math.floor(self.totalTime / 1000)

      var diff = (new Date().getTime() - self.startTime) - self.time

      // Display time
      clockEl.textContent = self.elapsed

      if (self.elapsed <= 0) _boss.fail()
    },

    // Pause the clock.
    // Do not use this to set clock rate to 0 if you still want to allow game action.
    pause: function () {
      this.speed    = 0
      this.isPaused = true
      clearInterval(this.tickInterval)
    },

    // Unpause the clock.
    unpause: function () {
      this.speed    = 1
      this.isPaused = false
      this.start()
    }

  }
}
