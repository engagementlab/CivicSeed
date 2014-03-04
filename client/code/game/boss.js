'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    boss.js

    - Controls boss mode.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var _numChargers = 4,
    _currentCharger,
    _canPlace;

var $boss = $game.$boss = {

  // place player on map
  init: function (callback) {
    _boss.createGrid()
    _boss.placeRandomItems()

    $('.hud-regular').fadeOut('fast');
    _boss.setupHud();
    _boss.loadVideo(0)

    _boss.showOverlay(0)

    $('#background').addClass('lab-background');
    $game.setFlag('boss-mode')

    if (typeof callback === 'function') callback()
  },

  resetInit: function () {
    _currentCharger = null;
  },

  // Drop a seed to reveal clues
  dropSeed: function (position) {
    // Do not allow seed drop to occur if the game is paused
    if (_boss.clock.isPaused) return

    //update hud
    if (_boss.seeds.current === 1) {
      $game.$audio.playTriggerFx('seedDrop');

      _boss.addSeedCount('regular', -1)
      _boss.renderTiles(position)

      // Out of seeds!
      if (_boss.seeds.regular <= 0) {
        _boss.seeds.current = 0;
        $game.$player.seedMode = false;
        $game.$player.resetRenderColor();
        $game.$input.activeHUDButton('.hud-boss .hud-seed')

        // Check if player fails
        _boss.checkFail()
      }
    }
    else if (_boss.seeds.current === 2) {

      _boss.addSeedCount('draw', -1)

      if (_boss.seeds.draw <= 0) {
        //TODO: out of regular seeds display
        _boss.seeds.current = 0;
        $game.$player.seedMode = false;
        $game.$player.resetRenderColor();
      }
    }
  },

  //finish walking, determine if we crushed charger or got item
  endMove: function (position) {
    var tile = _boss.grid[position.x][position.y]

    //check for charger first
    //charger = means it has a revealed charger
    if (_boss.clock.isPaused === false) {
      if (tile.charger === 1) {
        _boss.checkWin();
        $game.$render.clearBossLevel();
      }
      // If player lands on an item, pick it up (activate it)
      else if (tile.item) _boss.activateItem({ x: position.x, y: position.y })
    }
  },

  debug: function () {
    console.log(_boss.clock)
  },

  go: function () {
    _boss.clock.unpause()
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

  theCharger: {
    x:        null,
    y:        null,
    revealed: null
  },
  charger:    null,   // Stores the number of chargers picked up
  seeds:      {       // Stores quantity of seeds and current seed mode
    regular:  null,
    draw:     null,   // Note: draw seeds are a legacy feature of boss mode?
    current:  null    // To store the current seed mode
  },

  cutsceneVideos: [],

  // Preload all cutscene videos
  loadVideo: function (number) {
    var videoEl      = document.createElement('video'),
        path         = CivicSeed.CLOUD_PATH + '/audio/cutscenes/',
        numberVideos = 4

    if (CivicSeed.ENVIRONMENT === 'development') {
      videoEl.src = (Modernizr.video.h264) ? path + number + '.mp4' : path + number + '.webm?VERSION=' + Math.round(Math.random(1) * 1000000000)
    }
    else {
      videoEl.src = (Modernizr.video.h264) ? path + number + '.mp4?VERSION=' + CivicSeed.VERSION : path + number + '.webm?VERSION=' + CivicSeed.VERSION
    }

    videoEl.load()
    videoEl.className = 'cutscene'
    videoEl.addEventListener('canplaythrough', _listenerFunction)
    videoEl.addEventListener('error', function (e) {
      $game.debug('Boss cutscene video error')
    })

    function _listenerFunction (e) {
      this.removeEventListener('canplaythrough', _listenerFunction)
      _boss.cutsceneVideos.push(videoEl)

      number++
      if (number < numberVideos) {
        _boss.loadVideo(number)
      }
    }
  },

  //setup the new hud for the level
  setupHud: function () {
    $BODY = $('body')

    $BODY.on('click','.hud-boss .hud-seed', function () {
      if (_boss.seeds.current === 0 && _boss.seeds.regular > 0) {
        $(this).addClass('hud-button-active');
        _boss.seeds.current = 1;
        $game.$player.seedMode = true;
      } else if (_boss.seeds.current === 1) {
        $(this).removeClass('hud-button-active');
        _boss.seeds.current = 0;
        $game.$player.seedMode = false;
        $game.$player.resetRenderColor();
      } else if (_boss.seeds.current === 2) {
        if (_boss.seeds.regular > 0) {
          $(this).addClass('hud-button-active');
          $('.hud-boss .drawSeedButton').removeClass('hud-button-active');
          _boss.seeds.current = 1;
        } else {
          $game.alert('You have no more seeds!')
        }
      } else {
        $game.alert('You have no more seeds!')
      }
    });

    $BODY.on('click','.hud-boss .drawSeedButton', function () {
      if (_boss.seeds.current === 0) {
        $(this).addClass('hud-button-active');
        _boss.seeds.current = 2;
        $game.$player.seedMode = true;
      } else if (_boss.seeds.current === 1) {
        $(this).addClass('hud-button-active');
        $('.hud-boss .hud-seed').removeClass('hud-button-active');
        _boss.seeds.current = 2;
        $game.$player.seedMode = false;
        $game.$player.resetRenderColor();
      } else {
        $(this).removeClass('hud-button-active');
        _boss.seeds.current = 0;
      }
    });
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
              window.open('/profiles/' + sessionStorage.profileLink + '')
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

  // Utility function for performing actions for each tile on the gameboard grid
  // Passes a reference to the tile to the callback function
  forEachGridTile: function (callback) {
    var gridX = $game.VIEWPORT_WIDTH,
        gridY = $game.VIEWPORT_HEIGHT

    for (var x = 0; x < gridX; x++) {
      for (var y = 0; y < gridY; y++) {
        var tile = _boss.grid[x][y]
        if (typeof callback === 'function') callback(tile)
      }
    }
  },

  //start the game, clock, sound
  beginGame: function () {
    // Display boss HUD
    $('.hud-boss').fadeIn('fast')

    // Clear the canvas
    $game.$render.clearBossLevel()

    // Set score from tiles colored
    _boss.updateScore($game.$player.getTilesColored())
    _boss.modeScore = 0

    _boss.seeds.current = 0
    _boss.updateSeedCount('regular', 20)

    _currentCharger = 0;
    _canPlace = true;
    _boss.placeCharger();

    // Start the clock!
    _boss.clock.reset()
    _boss.clock.start()

    // Trigger boss music!
    $game.$audio.switchTrack(7)
  },

  // Place items randomly on grid
  placeRandomItems: function () {
    _boss.forEachGridTile(function (tile) {
      // 2% chance of a random item being placed on a tile.
      if (Math.floor(Math.random() * 100) <= 2) {
        tile.item = _boss.createRandomItem()
      }
    })
  },

  // Create a random item
  createRandomItem: function () {
    var numberOfItems = 4

    return {
      id:       Math.floor(Math.random() * numberOfItems),
      revealed: false
    }
  },

  // Activate a special item
  activateItem: function (position) {
    var tile = _boss.grid[position.x][position.y]

    if (!tile.item || !tile.item.revealed) return false
    else {
      // Do actions based on what item it is
      switch (tile.item.id) {
        // [ITEM 0]  TIME WARP - Speeds up time, bad for the player.
        case 0:
          $game.alert('Uh oh... time warp!')

          _boss.clock.speed = 4
          _boss.clock.clockTimeout = setTimeout(function () {
            _boss.clock.speed = 1
          }, 5000)
          setTimeout(function () {
            $game.$render.clearMapTile(position)
          }, 2000)

          break

        // [ITEM 1]  WIPEOUT - Removes all items and charger
        case 1:
          $game.alert('Wipeout!')

          setTimeout(function () {
            _boss.hideAllItems()
            $game.$render.clearBossLevel()
          }, 1000)

          // Remove the charger from the set location
          delete _boss.grid[_boss.theCharger.x][_boss.theCharger.y].charger

          break

        // [ITEM 2]  TIME FREEZE - Stops the clock for 5 seconds
        case 2:
          $game.alert('Time freeze, nice!')
          _boss.clock.speed = 0

          clearTimeout(_boss.clock.clockTimeout);
          _boss.clock.clockTimeout = setTimeout(function () {
            _boss.clock.speed = 1
          }, 5000)
          $game.$render.clearMapTile(position)

          break

        // [ITEM 3]  BONUS SEEDS - Add more seeds for the player
        case 3:
          $game.alert('Bonus seeds!')

          _boss.addSeedCount('regular', 3)

          $game.$render.clearMapTile(position)

          break

        default:
          // Nothing
          break
      }

      // Disable item
      delete tile.item
    }
  },

  //recalc grid values based on charger placement, place item randomly
  calculateGrid: function () {
    _boss.forEachGridTile(function (tile) {
      tile.distance = _boss.getDistanceFromCharger({ x: tile.x, y: tile.y })
      tile.charger  = -1
    })
  },

  // Place the charger on a random tile
  placeCharger: function () {
    if (!_canPlace) return

    _canPlace = false;
    var hack = setTimeout(function () {
      _canPlace = true;
    }, 200);

    var x    = Math.floor(Math.random() * $game.VIEWPORT_WIDTH),
        y    = Math.floor(Math.random() * $game.VIEWPORT_HEIGHT),
        tile = _boss.grid[x][y]

    _boss.theCharger = {
      x:        x,
      y:        y,
      revealed: false
    }

    _currentCharger++;
    _boss.calculateGrid();

    // Set the grid item with the charger, replace an item if it's there
    tile.charger = 0
    if (tile.item) delete tile.item
  },

  // Calculate how far from the charger the tile is
  getDistanceFromCharger: function (position) {
    return Math.abs(position.x - _boss.theCharger.x) + Math.abs(position.y - _boss.theCharger.y)
  },

  // The player reveals the charger
  foundCharger: function (position) {
    $game.alert('You found a charger! Go to it to disable it.')
    _boss.grid[position.x][position.y].charger = 1
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
          var tile     = _boss.grid[curX][curY]
          var distance = tile.distance,
              charger  = tile.charger,
              item     = -1 // By default, if there is no item pass this digit to the renderer to make it ignore this.

          // If player has revealed an item
          if (tile.item) {
            item = tile.item.id

            // Set it to revealed
            tile.item.revealed = true

            // If they revealed a bad item, activate it now
            if (tile.item.id < 2) _boss.activateItem({x: curX, y: curY})
          }

          // If player has found the charger
          if (charger === 0) _boss.foundCharger({x: curX, y: curY})

          if (distance < min) min = distance

          squares.push({
            val:     distance,
            x:       curX,
            y:       curY,
            item:    item,
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

  //see if the player has won, or set charger
  checkWin: function () {
    var addPoints = 50

    // Update score
    _boss.modeScore += addPoints
    _boss.updateScore(_boss.totalScore + addPoints)

    _boss.hideAllItems()

    var newCutsceneEl = document.createElement('div'),
        videoEl       = _boss.cutsceneVideos[_currentCharger - 1]

    newCutsceneEl.classList.add('cutscene-background')
    newCutsceneEl.appendChild(videoEl)
    document.getElementById('gameboard').appendChild(newCutsceneEl)

    $('.cutscene-background').fadeIn('fast');
    $('.cutscene')[0].play();

    _boss.clock.pause()

    $('.cutscene')[0].addEventListener('ended', function () {
      $('.cutscene')[0].removeEventListener('ended');
      $('.cutscene-background').fadeOut('fast', function () {

        var chargers = (_numChargers - _currentCharger + 1),
            message  = ''

        if (chargers === 1) {
          message = 'Only 1 charger left!'
        }
        else {
          message = 'Only ' + chargers + ' chargers left!'
        }
        $game.alert(message)

        _boss.clock.unpause()
        $('.cutscene-background').remove();
      });
      if (_currentCharger >= 4 && _boss.modeScore === 200) {
        _boss.clock.pause()
        _boss.showOverlay(4)
      } else {
        _boss.placeCharger();
      }
    });
  },

  // Check if they are out of seeds and the charger hasn't been revealed
  checkFail: function () {
    if (!_boss.theCharger.revealed || _currentCharger < _numChargers) _boss.fail()
  },

  // If player fails to beat the level
  fail: function () {
    $game.$input.inactiveHUDButton('.hud-boss .hud-seed')
    $game.$player.seedMode = false;
    $game.$player.resetRenderColor();
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
    timer:        null, // ?????

    // Set all the variables pertaining to starting a new clock
    reset: function () {
      this.startTime = new Date().getTime()
      this.time      = 0
      this.elapsed   = 0
      this.isPaused  = false
      this.totalTime = 0
      this.target    = 90
      this.speed     = 1
    },

    // Start the clock
    start: function () {
      console.log(this)
      setTimeout(this.update, 100)
    },

    // Update at each tick of the clock
    update: function () {
      var clockEl = document.querySelector('.hud-boss .clock'),
          clock   = _boss.clock

      clock.time      += 100;
      clock.totalTime += 100 * clock.speed;
      clock.elapsed    = clock.target - Math.floor(clock.totalTime / 1000);

      var diff = (new Date().getTime() - clock.startTime) - clock.time;

      // Display time
      clockEl.textContent = clock.elapsed

      if (clock.elapsed <= 0) _boss.fail()
      else if (!clock.isPaused) {
        setTimeout(clock.update, (100 - diff))
      }
    },

    // Pause the clock.
    // Do not use this to set clock rate to 0 if you still want to allow game action.
    pause: function () {
      this.speed    = 0
      this.isPaused = true
    },

    // Unpause the clock.
    unpause: function () {
      this.speed    = 1
      this.isPaused = false
    }

  }
}
