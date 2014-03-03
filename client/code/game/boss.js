'use strict';

var _charger = {},
    _grid,
    $BODY,
    $bossArea,
    $seedButton,
    $seedButtonCount,
    $clock,
    $score,

    _numChargers = 4,
    _currentCharger,
    _numDrawSeeds,
    _numRegularSeeds,
    _seedMode = 0,
    _rgbString,

    //clock stuff
    _start,
    _time,
    _elapsed,
    _target,
    _pause,
    _totalTime,
    _clockRate,
    _clockTimeout,

    _videoPath = CivicSeed.CLOUD_PATH + '/audio/cutScenes/',
    _numVideos = 4,
    _cutSceneVids = [],
    _score,
    _bossScore,

    _hackTimeout,
    _canPlace;

var $boss = $game.$boss = {

  // place player on map
  init: function (callback) {
    _setDomSelectors();
    _createGrid();
    $('.hud-regular').fadeOut('fast');
    _setupHud();
    _boss.showOverlay(0)
    _rgbString = 'rgba(255,0,0,';

    _loadVideo(0);
    $('#background').addClass('lab-background');
    $game.setFlag('boss-level')

    if (typeof callback === 'function') callback()
  },

  resetInit: function () {
    _charger = {};
    _grid = null;
    _currentCharger = null;
    _numDrawSeeds = null;
    _numRegularSeeds = null;
    _seedMode = 0;
    _rgbString = null;

    //clock stuff
    _start = null;
    _time = null;
    _elapsed = null;
    _target = null;
    _pause = null;
    _totalTime = null;
    _clockRate = null;
    _clockTimeout = null;

    _cutSceneVids = [];
    _score = null;
    _bossScore = null;
  },

  //drop a seed to reveal clues
  dropSeed: function (pos) {
    //update hud
    if (!_pause) {
      if (_seedMode === 1) {
        _numRegularSeeds--;
        $game.$audio.playTriggerFx('seedDrop');
        $('.hud-boss .regularSeedButton .badge').text(_numRegularSeeds);
        _renderTiles(pos);
        if (_numRegularSeeds <= 0) {
          //TODO: out of regular seeds display
          _seedMode = 0;
          $game.$player.seedMode = false;
          $game.$player.resetRenderColor();
          $('.hud-boss .regularSeedButton').removeClass('hud-button-active');
          //check if they fail
          _checkFail();
        }
      } else if (_seedMode === 2) {
        _numDrawSeeds--;
        $('.hud-boss .drawSeedButton .badge').text(_numDrawSeeds);
        if (_numDrawSeeds <= 0) {
          //TODO: out of regular seeds display
          _seedMode = 0;
          $game.$player.seedMode = false;
          $game.$player.resetRenderColor();
        }
      }
    }

    //update score
  },

  //finish walking, determine if we crushed charger or got item
  endMove: function (x,y) {
    //check for charger first
    //charger = means it has a revealed charger
    if (!_pause) {
      if (_grid[x][y].charger === 1) {
        _checkWin();
        $game.$render.clearBossLevel();
      } else if (_grid[x][y].item > -1) {
        //pick up good item
        _activateItem({x: x, y:y, item: _grid[x][y].item});
      }
    }
  }
};

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _boss = {

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
          _beginGame();
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

  //save feedback on resume responses to db for each user
  saveFeedback: function (resumes) {
    var info = [];
    $('#boss-area textarea').each(function (i) {
      var val = this.value;
      info.push({
        comment: val,
        id: resumes[i].id
      });
    });
    ss.rpc('game.player.resumeFeedback', info);
  }



}


function _setDomSelectors() {
  $BODY = $('body');
  $bossArea = $('#boss-area');
  $seedButton = $('.hud-boss .hud-seed');
  $seedButtonCount = $('.hud-boss .hud-seed .badge');
  $clock = $('.hud-boss .clock');
  $score = $('.hud-boss .score span');
}



//randomly place the charger
function _placeCharger() {
  if (_canPlace) {
    _canPlace = false;
    _hackTimeout = setTimeout(function () {
      _canPlace = true;
    },200);
    var x = Math.floor(Math.random() * $game.VIEWPORT_WIDTH),
      y = Math.floor(Math.random() * $game.VIEWPORT_HEIGHT);
    _charger.x = x;
    _charger.y = y;
    _charger.revealed = false;
    _currentCharger++;
    _calculateGrid();
    //set the grid item with the charger, take items off it if has em
    _grid[x][y].charger = 0;
    _grid[x][y].item = -1;
  }
}

//init the basic grid
function _createGrid() {
  _grid = [$game.VIEWPORT_WIDTH];
  var i = $game.VIEWPORT_WIDTH;
  while(--i >= 0) {
    _grid[i] = [$game.VIEWPORT_HEIGHT];
    var j = $game.VIEWPORT_HEIGHT;
    while(--j >= 0) {
      //place random object
      var item = _makeRandomItem();
      _grid[i][j] = {
        item: item,
        itemRevealed: false
      };
    }
  }
}

function _hideItems() {
  var i = $game.VIEWPORT_WIDTH;
  while(--i >= 0) {
    var j = $game.VIEWPORT_HEIGHT;
    while(--j >= 0) {
      _grid[i][j].itemRevealed = false;
    }
  }
}

//recalc grid values based on charger placement, place item randomly
function _calculateGrid() {
  var i = $game.VIEWPORT_WIDTH;
  while(--i >= 0) {
    var j = $game.VIEWPORT_HEIGHT;
    while(--j >= 0) {
      var dist = _distFromCharger({x:i,y:j});
      _grid[i][j].distance = dist;
      _grid[i][j].charger = -1;
    }
  }
}

//calculate how far from the charger the tile is
function _distFromCharger (pos) {
  var delta = Math.abs(pos.x - _charger.x)  + Math.abs(pos.y - _charger.y);
  return delta;
}

//start the game, clock, sound
function _beginGame () {
  // Display boss HUD
  $('.hud-boss').fadeIn('fast')

  //clear the canvas if a restart
  $game.$render.clearBossLevel();

  //set score from tiles colored
  _score = $game.$player.getTilesColored();
  _bossScore = 0;
  $score.text(_score);
  _start = new Date().getTime();
  _time = 0;
  _elapsed = '0.0';
  _pause = false;
  _totalTime = 0;
  _target = 90;
  _clockRate = 1;
  _numRegularSeeds = 20;
  _currentCharger = 0;
  _charger = {};
  _seedMode = 0;
  _canPlace = true;
  _placeCharger();
  $('.hud-boss .regularSeedButton .badge').text(_numRegularSeeds);
  setTimeout(_updateTime, 100);
  //trigger boss music!
  $game.$audio.switchTrack(7);
}

//tick the clock
function _updateTime () {
  _time += 100;
  _totalTime += 100 * _clockRate;
  _elapsed = _target - Math.floor(_totalTime / 1000);

  var diff = (new Date().getTime() - _start) - _time;

  $clock.text(_elapsed);

  if (_elapsed <= 0) {
    _fail();
  }
  else if (!_pause) {
    setTimeout(_updateTime, (100 - diff));
  }
}

//check if they are out of seeds and the charger hasn't been revealed
function _checkFail() {
  if (!_charger.revealed || _currentCharger < _numChargers) {
    _fail();
  }
}

//see if the player has won, or set charger
function _checkWin() {
  //add X to score
  _score += 50;
  _bossScore += 50;
  $score.text(_score);

  _hideItems();
  var newCutScene = '<div class="cutSceneBg"></div>';
  $('.gameboard').append(newCutScene);
  var newVid = _cutSceneVids[_currentCharger - 1];
  $('.cutSceneBg').append(newVid);
  $('.cutSceneBg').fadeIn('fast');
  $('.cutScene')[0].play();
  _clockRate = 0;
  $('.cutScene')[0].addEventListener('ended', function () {
    $('.cutScene')[0].removeEventListener('ended');
    $('.cutSceneBg').fadeOut('fast', function () {

      var chargers = (_numChargers - _currentCharger + 1),
          message  = ''

      if (chargers === 1) {
        message = 'Only 1 charger left!'
      }
      else {
        message = 'Only ' + chargers + ' chargers left!'
      }
      $game.alert(message)

      _clockRate = 1;
      $('.cutSceneBg').remove();
    });
    if (_currentCharger >= 4 && _bossScore === 200) {
      _pause = true;
      _boss.showOverlay(4)
    } else {
      _placeCharger();
    }
  });
}

//show stuff if they don't beat the level
function _fail() {
  $('.hud-boss .regularSeedButton').removeClass('hud-button-active');
  $game.$player.seedMode = false;
  $game.$player.resetRenderColor();
  _pause = true;
  _boss.showOverlay(3)
}

//setup the new hud for the level
function _setupHud() {
  $BODY.on('click','.hud-boss .regularSeedButton', function () {
    if (_seedMode === 0 && _numRegularSeeds > 0) {
      $(this).addClass('hud-button-active');
      _seedMode = 1;
      $game.$player.seedMode = true;
    } else if (_seedMode === 1) {
      $(this).removeClass('hud-button-active');
      _seedMode = 0;
      $game.$player.seedMode = false;
      $game.$player.resetRenderColor();
    } else if (_seedMode === 2) {
      if (_numRegularSeeds > 0) {
        $(this).addClass('hud-button-active');
        $('.hud-boss .drawSeedButton').removeClass('hud-button-active');
        _seedMode = 1;
      } else {
        $game.alert('You have no more seeds!')
      }
    } else {
      $game.alert('You have no more seeds!')
    }
  });

  $BODY.on('click','.hud-boss .drawSeedButton', function () {
    if (_seedMode === 0) {
      $(this).addClass('hud-button-active');
      _seedMode = 2;
      $game.$player.seedMode = true;
    } else if (_seedMode === 1) {
      $(this).addClass('hud-button-active');
      $('.hud-boss .regularSeedButton').removeClass('hud-button-active');
      _seedMode = 2;
      $game.$player.seedMode = false;
      $game.$player.resetRenderColor();
    } else {
      $(this).removeClass('hud-button-active');
      _seedMode = 0;
    }
  });
}

//figure out which tiles to render based on seed drop
function _renderTiles(pos) {
  var topLeftX = pos.x - 1,
    topLeftY = pos.y - 1,
    squares = [],
    min = 100;
  for(var x = 0; x < 3; x++) {
    for(var y = 0; y < 3; y++) {
      var curX = topLeftX + x,
        curY = topLeftY + y;
      //only add it if in the bounds of the game area
      if (curX >= 0 && curX < $game.VIEWPORT_WIDTH && curY >= 0 && curY < $game.VIEWPORT_HEIGHT) {
        var val = _grid[curX][curY].distance,
          item = _grid[curX][curY].item,
          charger = _grid[curX][curY].charger;
        if (val < min) {
          min = val;
        }
        squares.push({
          val: val,
          x: curX,
          y: curY,
          item: item,
          charger: charger
        });
        //if they found the charger, set it to found, send alert
        if (charger === 0) {
          _foundCharger(curX, curY);
        }
        if (item > -1) {
          //make sure it is revealed
          _grid[curX][curY].itemRevealed = true;
          //if they revealed a bad item, activate it now
          if (item < 2) {
            _activateItem({x: curX, y:curY, item:item});
          }
        }
      }
    }
  }
  //figure out the color
  for(var s = 0; s < squares.length; s++) {
    var alpha = 0.8 - (squares[s].val - min) * 0.2 + 0.1;
    squares[s].color = _rgbString + alpha + ')';
    //console.log(squares[s]);
  }
  $game.$render.renderBossTiles(squares);
}

//create a random item
function _makeRandomItem() {
  var ran = Math.floor(Math.random() * 200);
  if (ran < 4) {
    return ran;
  } else {
    return -1;
  }
}

//the player reveals the charger
function _foundCharger(x,y) {
  _grid[x][y].charger = 1;
  $game.alert('You found a charger! Go to it to disable it.')
  _charger.revealed = true;
}

//player activates an special item
function _activateItem(data) {
  if (_grid[data.x][data.y].itemRevealed) {
    //disable item in future
    _grid[data.x][data.y].item = -1;
    if (data.item === 0) {
      //speed up time (bad)
      $game.alert('Uh oh... time warp!')
      _clockRate = 4;
      _clockTimeout = setTimeout(function () {
        _clockRate = 1;
      },5000);
      setTimeout(function () {
        $game.$render.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
      },2000);
    } else if (data.item === 1) {
      //wipeout
      $game.alert('Wipeout!')
      setTimeout(function () {
        _hideItems();
        $game.$render.clearBossLevel();
      }, 1000);
      _grid[_charger.x][_charger.y].charger = 0;
    } else if (data.item === 2) {
      //time freeze
      $game.alert('Time freeze, nice!')
      _clockRate = 0;
      clearTimeout(_clockTimeout);
      _clockTimeout = setTimeout(function () {
        _clockRate = 1;
      },5000);
      $game.$render.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
    } else if (data.item === 3) {
      //extra seeds
      $game.alert('Bonus seeds!')
      _numRegularSeeds += 3;
      $('.hud-boss .regularSeedButton .badge').text(_numRegularSeeds);
      $game.$render.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
    }
  }
}

//load all cut scene videos up at start
function _loadVideo (num) {
  var vid = document.createElement('video'),
      i = num // ????? i is not defined anywhere else.

  if (CivicSeed.ENVIRONMENT === 'development') {
    vid.src = Modernizr.video.h264 ? _videoPath + num + '.mp4' :
      _videoPath + i + '.webm?VERSION=' + Math.round(Math.random(1) * 1000000000);
  } else {
    vid.src = Modernizr.video.h264 ? _videoPath + num + '.mp4?VERSION=' + CivicSeed.VERSION:
      _videoPath + i + '.webm?VERSION=' + CivicSeed.VERSION;
  }

  vid.load();
  vid.className = 'cutScene';
  vid.addEventListener('canplaythrough', _listenerFunction)
  vid.addEventListener('error', function (e) {
    console.log('vid error');
  })

  function _listenerFunction (e) {
    this.removeEventListener('canplaythrough', _listenerFunction);
    _cutSceneVids.push(vid);
    num += 1;
    if (num < _numVideos) {
      _loadVideo(num);
    }
  }
}


