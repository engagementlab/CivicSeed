'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    botanist.js

    - Extends npc.js where the Botanist has behavior similar to that
      of an NPC, otherwise most other typical NPC behavior is ignored, since
      the Botanist location is hard-coded.
    - Covers any player interaction on the Botanist gameboard overlay,
      e.g. tangram puzzle solving, and filling out the civic resume question.
    - Handles first time players' tutorial session with the Botanist.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//private botanist vars
var _currentSlide = 0,
    _promptNum = 0,
    _svg = null,
    _drag = null,
    _new = null,
    _counter = 0,
    _dragOffX = 0,
    _dragOffY = 0,

    _paintbrushSeedFactor = 5,

    $tangramArea = null,
    $botanistContent = null;

var $botanist = $game.$botanist = {

  index:     0,
  dialog:    null,
  tangram:   null,
  name:      null,
  ready:     false,

  init: function (callback) {
    ss.rpc('game.npc.loadBotanist', function (data) {
      _botanist.data    = data;
      $botanist.index   = _botanist.data.id
      $botanist.dialog  = _botanist.data.dialog
      $botanist.name    = _botanist.data.name
      $botanist.tangram = _botanist.data.tangram

      _setDomSelectors();
      $game.$botanist.setupTangram();
      $game.$botanist.setState($game.$player.botanistState);
      $game.$botanist.ready = true;
      callback();
    });
  },

  resetInit: function () {
    _currentSlide = 0;
    _promptNum = 0;
    _svg = null;
    _drag = null;
    _new = null;
    _counter = 0;
    _dragOffX = 0;
    _dragOffY = 0;

    $tangramArea = null;
    $botanistContent = null;

    $game.$botanist.index= 0;
    $game.$botanist.dialog= null;
    $game.$botanist.tangram= null;
    $game.$botanist.name= null;
    $game.$botanist.ready= false;
  },

  // Get current render data
  getRenderInfo: function () {
    return (_botanist.isOnScreen()) ? _botanist.renderInfo : false
  },

  // Decide how to render botanist
  update: function () {
    if (_botanist.isOnScreen()) _botanist.idle()
  },

  // Clear botanist from canvas
  clear: function () {
    $game.$render.clearBotanist(_botanist.renderInfo)
  },

  // Sets the botanist state which determines what he shows
  setState: function (state) {
    _botanist.state = state
    // Set state globally for player
    $game.$player.botanistState = state

    // Save to database
    ss.rpc('game.player.updateGameInfo', {
      id:            $game.$player.id,
      botanistState: state
    })

    // Set visual state
    // If Botanist is in state 2, he has his arms crossed - otherwise he is waving his arms to get the attention of the player
    _botanist.renderInfo.srcY = (state === 2) ? 160 : 0
  },

  getState: function () {
    return $game.$player.botanistState
  },

  //determine what to show the player when they click on the botanist
  show: function () {
    var level = $game.$player.currentLevel

    // Clear nudges if present
    clearInterval(_botanist.nudgePlayerInterval)
    clearTimeout(_botanist.nudgePlayerTimeout)

    // Walk to botanist
    // Hacky. Player moves during game speech.
    // Potential fix is to build in callback functions to beginMove to allow a queue of actions to be
    // performed when a character has finished moving.
    var location = $game.$map.masterToLocal(71, 74)   // An arbitrary location by the Botanist
    $game.$player.beginMove(location.x, location.y)

    // Decide what to show based on the player's current level
    if (level > 4) {
      // Player is in a different level (e.g. boss?) What are they doing here?
      //they have beaten the INDIVIDUAL part of the game
      //if they have beat level 4
      //but comm. meter is <
      //and comm. meter is >
      //and final task is solved
      return
    }

    // If this is the player's first time in the game, player should complete the tutorial first.
    if ($game.checkFlag('first-time') === true) {
      _botanist.doTutorial()
      return
    }

    // Determine interaction by looking at Botanist state
    switch ($game.$player.botanistState) {
      // 0 = Initial state. Player is beginning the current level.
      case 0:
        // Show instructions.
        _botanist.chat($botanist.dialog[level].instructions, null, function () {
          // After reading the message, forward Botanist state and continue interaction
          $botanist.setState(1)
          $botanist.show()
        })
        break
      // 1 = Player has looked at the instructions / tutorial, and needs to obtain the puzzle piece for that level.
      case 1:
        $game.$botanist.showPrompt(0)
        break
      // 2 = Player has obtained tangram puzzle and is currently collecting resources.
      case 2:
        var hintIndex = ($game.$player.getInventory().length > 0) ? 1 : 0
        _botanist.chat($botanist.dialog[level].hint[hintIndex])
        break
      // 3 = Player has all the correct resources, ready to solve.
      case 3:
        $game.$botanist.showPrompt(1);
        break
      // 4 = Player has solved the puzzle but has not answered the portfolio question.
      case 4:
        $game.$botanist.showRiddle(2);
        break
    }

    /*

      NOTES.

      There are two variables that control the content to be shown.

      _promptNum
        0  The botanist has introduced the player to the level. This state means the Botanist needs to give the player the tangram puzzle.
        1  This state is set when the player has all the correct resources and is ready to solve the puzzle.
        2  The player is solving the puzzle? Corresponds with currentSlide = 2

      _currentSlide
        0  Default? Corresponds with prompt = 0?
        1
        2  Corresponds with prompt = 2

    */

  },

  nudgePlayer: function () {
    // First iteration
    _botanist.nudgePlayer()

    // Set up a recurring timer, which is cleared when player talks to the botanist.
    _botanist.nudgePlayerInterval = setInterval(_botanist.nudgePlayer, 16000)
  },

  // Shows the botanist's riddle when clicked on from the player's inventory
  showPuzzleFromInventory: function () {
    $game.$input.hideInventory(function () {
      $game.$botanist.showRiddle(0);
    })
  },

  //show the viewing tangram prompt
  showPrompt: function (prompt) {
    var dialogue = $game.$botanist.dialog[$game.$player.currentLevel].riddle.prompts[prompt];

    _botanist.chat(dialogue, function () {
      $game.$botanist.showRiddle(prompt);
    })
  },

  //show the riddle, its basically an image
  showRiddle: function (num) {

    // TODO / TEMPORARY New behavior.
    if (num === 0) {
      // shit
    }

    // OLD BEHAVIOR
    if (num === 1) {
      document.getElementById('botanist-area').classList.add('puzzle-mode')
      $game.setFlag('solving-puzzle')

      // Show 'how-to-play' puzzle hints
      setTimeout(function () {
        $game.alert('Drag a piece to the board to place it')
      }, 1000)

    }

    _promptNum = num;
    _currentSlide = 0;
    //if they are solving, change functionality of inventory
    if (num === 2) {
      _currentSlide = 2;
    }
    $game.$botanist.addContent();
    $game.$botanist.addButtons();

    $game.$npc.hideSpeechBubble(function () {
      $('#botanist-area').fadeIn(function () {
        $game.setFlag('visible-botanist-overlay')

        if (_currentSlide === 0 && $game.checkFlag('first-time') === false) {
          $tangramArea.show();

          if ($game.checkFlag('solving-puzzle') === true) {
          }
        }
      });
    });
  },

  showBotanistOverlay: function (callback) {
    if (typeof callback === 'function') callback()
  },

  //determine which buttons to show based on what is being shown
  addButtons: function () {
    $('#botanist-area button').hide();

    //no buttons except close
    if (_promptNum === 0) {
      if (_currentSlide === 0) {
        if ($game.checkFlag('first-time')) {
          $('#botanist-area .next-button').show();
        } else {
          $('#botanist-area .close-button').show();
        }
      }
      else {
        $('#botanist-area .close-button').show();
      }
    }
    else {
      if (_currentSlide === 0) {
        $('#botanist-area .answer-button').show();
        $('#botanist-area .clear-button').show();
      }
      else if (_currentSlide === 1) {
        $('#botanist-area .next-button').show();
      }
      else {
        $('#botanist-area .answer-button').show();
        //$('#botanist-area .clear-button').show();
      }
    }
  },

  //advance to next slide content
  nextSlide: function () {
    _currentSlide += 1;
    $game.$botanist.addContent();
    $game.$botanist.addButtons();
  },

  //go to previous slide content
  previousSlide: function () {
    _currentSlide -= 1;
    $game.$botanist.addContent();
    $game.$botanist.addButtons();
  },

  //determine which content to add and add it
  addContent: function () {
    //if _promptNum is 0, then it is the just showing the riddle no interaction
    if (_promptNum === 0) {
      if (_currentSlide === 0) {

        $('.botanist-content').empty()

        if ($botanist.getState() > 1) {
          _botanist.say('Here is the notebook page to view again.')
        }
        else {
          _botanist.say('Here is the page. You will be able to view it at any time in your inventory.')

          //add this tangram outline to the inventory
          $game.$player.putTangramPuzzleInInventory()
          $botanist.setState(2);
        }

        _botanist.loadPuzzleImage()
        $('.tangram-area').show()

      }
    }
    //they are solving it, so riddle interface and stuff
    else {
      if (_currentSlide === 0) {

        // Setup contents
        _botanist.say('OK. Take the pieces you have gathered and drop them into the outline to create your seeds.')
        _botanist.loadPuzzleImage()
        _botanist.setupPuzzleSolvingTrashCan()

        // Replace the tangram image in the inventory with puzzle-mode tip
        document.querySelector('#inventory .inventory-tangram').style.display = 'none'
        document.querySelector('#inventory .close-button').style.display = 'none'
        document.querySelector('#inventory .help').style.display = 'block'

        // Show the inventory screen
        $game.$input.showInventory(function () {
          // Set the inventory items to draggable in case they were off
          $('.inventory-item').attr('draggable', 'true')
        })

      }

      //right/wrong screen
      else if (_currentSlide === 1) {

        // After answering the puzzle
        _botanist.say($game.$botanist.dialog[$game.$player.currentLevel].riddle.response)
        document.getElementById('botanist-area').classList.remove('puzzle-mode')

        // Hide inventory
        $game.$input.hideInventory(function () {
          document.querySelector('#inventory .close-button').style.display = 'block'
          $('.inventory-item').remove();
        })

        var newHTML2 = '<h3>You earned a promotion to ' + $game.playerRanks[$game.$player.currentLevel + 1] + '!</h3>',
            imgPath3 = CivicSeed.CLOUD_PATH + '/img/game/seed_chips.png';

        newHTML2 += '<div class="seed-chips"><img src="' + imgPath3 +'"></div>';
        $botanistContent.html(newHTML2);
      }
      else {
        var endQuestion = _botanist.levelQuestion[$game.$player.currentLevel];
        _botanist.say(endQuestion)

        var inputBox = '<textarea placeholder="Type your answer here..." maxlength="5000" autofocus></textarea>';
        $botanistContent.html(inputBox);
      }
    }
  },

  //hide botanist window return game functionality
  hideResource: function () {
    //slide up the botanist area that contains big content
    //re-enable clicking by setting bools to false

    // TODO: THIS HAS NEVER HAPPENED. PUT IT BACK???
    if ($game.$player.currentlevel === 0 && $game.$player.botanistState === 2) {
      $game.alert('Level 1: Looking Inward.  See the log below for more details.')
      $game.log('Level 1 is about understanding one’s own motivations, goals, social identities, ethics and values in the context of a larger society.  Before beginning work in the community, it is important to look within, and reflect on where you are coming from in order to move forward. The more you understand yourself, the better equipped you will be to becoming an aware and effective active citizen.')
    }

    $tangramArea.hide();
    $('#botanist-area').fadeOut(function () {

      // Remove puzzle-mode class
      var el = document.getElementById('botanist-area')
      el.classList.remove('puzzle-mode')

      $game.removeFlag('visible-botanist-overlay')
      $('.botanist button').hide();

      $game.$botanist.clearBoard();
      $('.inventory-item').css('opacity',1);

      // Remove flags
      $game.removeFlag('solving-puzzle')
      $game.removeFlag('botanist-chatting')  // Just in case it was accidentally not removed

      //if they just beat a level, then show progreess
      if ($game.$player.botanistState === 0 && $game.$player.currentLevel < 4) {
        $game.$input.highlightHUDButton('.hud-progress')
        $game.showProgress();
      }
    });

    // Close and reset inventory to non-puzzle state
    $game.$input.hideInventory(function () {
      document.querySelector('#inventory .inventory-tangram').style.display = 'block'
      document.querySelector('#inventory .close-button').style.display = 'block'
      document.querySelector('#inventory .help').style.display = 'none'
      $('.inventory-item').remove()
    })
  },

  //when player submits answer must verify all pieces and respond accordingly
  submitAnswer: function () {
    //go through and check each piece on 'the board' and see it exists within the right answer
    //array and check the location. give feedback/next screen based on results
    if (_currentSlide === 0) {
      var allTangrams = $('.puzzle-svg > path'),
      correct = true,
      numRight = 0,
      aLength = $game.$botanist.tangram[$game.$player.currentLevel].answer.length,
      message = '',
      wrongOne = false,
      nudge = false;

      allTangrams.each(function (i, d) {
        //pull the coordinates for each tangram
        var tanIdD = $(this).attr('class'),
          tanId = tanIdD.substring(2,tanIdD.length),
          trans = $(this).attr('transform'),
          transD = trans.substring(10,trans.length-1),
          transD2 = transD.split(','),
          transX = parseInt(transD2[0],10),
          transY = parseInt(transD2[1],10),
          t = aLength,
          found = false,
          correctPiece = false;
          //go through the answer sheet to see if the current tangram is there &&
          //in the right place

        while(--t > -1) {
          var answer = $game.$botanist.tangram[$game.$player.currentLevel].answer[t];
          if (answer.id === tanId) {
            found = true;
            //this is a hard check for snapping
            if (transX === answer.x && transY === answer.y) {
              numRight += 1;
              correctPiece = true;
            }
            else {
              correctPiece = false;
            }
          }
        }

        if (!found) {
          wrongOne = true;
          correct = false;
          //remove it from the board
          $('.br' + tanId).remove();
          $('.r' + tanId)
            .css('opacity', 1)
            .attr('draggable', 'true');
        }
        else if (found && !correctPiece) {
          nudge = true;
          correct = false;
          //remove it from the board
          $('.br' + tanId).remove();
          $('.r' + tanId)
            .css('opacity', 1)
            .attr('draggable', 'true');
        }
      });

      if (allTangrams.length === 0) {
        correct = false;
        _paintbrushSeedFactor -= 1;
        message = 'At least TRY to solve it!';
      }
      else if (wrongOne) {
        correct= false;
        _paintbrushSeedFactor -=1;
        message = 'Oh! That’s not quite right. Think more about how the pieces relate to one another, and try again.';
      }
      else if (allTangrams.length < aLength) {
        correct= false;
        _paintbrushSeedFactor -=1;
        message = 'You are missing some pieces. Be sure to read the notebook clues carefully to help pick out the right pieces.';
      }
      else if (nudge) {
        correct= false;
        _paintbrushSeedFactor -=1;
        message = 'So close! You had the right pieces, just fix the placement.';
      }

      if (correct) {
        //it is correct if none were WRONG
        //make sure ALL were on the board
        if (numRight === aLength) {
          _currentSlide = 1;
          $game.$botanist.addContent();
          $game.$botanist.addButtons();
          //display item and congrats.
          //-> next slide is the prompt to answer question

          //remove all items from inventory on slide up
          //remove them from puzzle surface
          $('.puzzle-svg').empty();
          $tangramArea.hide();
          //remove them from player's inventory
          $game.$player.emptyInventory();
          var numSeeds = _paintbrushSeedFactor < 0 ? 0: _paintbrushSeedFactor,
            level = $game.$player.currentLevel + 1,
            totalSeeds = (30 + level * 4 ) + level * 4 * numSeeds;

          $game.$player.addSeeds('draw', totalSeeds)
          $botanist.setState(4)
        }
      }
      else {
        //display modal on current screen with feedback
        $game.$botanist.clearBoard();
        _botanist.feedback(message);
      }

    }
    else {
      _paintbrushSeedFactor = 5;
      var portAnswer = $.trim($('.botanist-content textarea').val());

      if (portAnswer.length === 0) {
        _botanist.feedback('Please answer the question!')
      }
      else {
        $game.$player.resumeAnswer(portAnswer);
        $game.$player.nextLevel();
        $game.$botanist.hideResource();
        //upload the user's answer to the DB
      }
    }
  },

  //preps the area for drag and drop puzzle mode
  setupTangram: function () {
    _svg = d3.select('.tangram-area').append('svg')
      .attr('class','puzzle-svg')

    _drag = d3.behavior.drag()
      .origin(Object)
      .on('drag',      $botanist.dragMove)
      .on('dragstart', $botanist.dragMoveStart)
      .on('dragend',   $botanist.dropMove);
  },

  //when dragging starts from inventory must bind drop on puzzle area
  dragStart: function (e) {
    if ($game.checkFlag('solving-puzzle')) {

      $tangramArea
        .unbind('dragover')
        .unbind('drop');

      var npcData = e.data,
        dt = e.originalEvent.dataTransfer;

      dt.setData('text/plain', npcData.npc);

      //set drag over and drop to receive
      $('.tangram-area')
        .bind('dragover',$game.$botanist.dragOver)
        .bind('drop', $game.$botanist.drop);
    }
  },

  dragEnd: function (e) {
    e.preventDefault()
  },

  dragOver: function (e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  },

  //when drop add it to puzzle area
  drop: function (e) {
    e.preventDefault();
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    //set class name for new shape and fetch shape data
    //e.originalEvent.offsetX
    var npcData = e.originalEvent.dataTransfer.getData('text/plain'),
      splits = npcData.split(','),
      npc = splits[0],
      name = splits[1],
      selector = 'br' + name,
      x = e.originalEvent.layerX,
      y =  e.originalEvent.layerY;

    var shape = $game.$resources.getShape(npc),
      path = shape.path,
      fill = $game.$resources.fills[shape.fill];


    //console.log(npcData, selector, x);
    $('.r' + name)
      .css('opacity','.4')
      .attr('draggable', 'false');

    _new = _svg.append('path')
      .attr('class', selector)
      .data([{x:x , y: y, id: name, color: fill}])
      .attr('d', shape.path)
      .attr('fill', fill)
      .attr('stroke', 'rgb(255,255,255)')
      .attr('stroke-width', 0)
      .attr('transform', 'translate('+x+','+y+')')
      .call(_drag);

    $tangramArea
      .unbind('dragover')
      .unbind('drop');

    //clear data from drag bind
    e.originalEvent.dataTransfer.clearData();
    return false;
  },

  //this is dragging a puzzle piece on area and moving it around
  dragMoveStart: function (d) {
    _dragOffX = d3.mouse(this)[0]
    _dragOffY = d3.mouse(this)[1]

    d3.select('.br' + d.id)
      .attr('stroke-width', 3)
      .classed('dragging', true)

    // Hacky way of making it so that dragging puzzle pieces at the lower end of tangram area doesn't
    // create calculation errors by bringing the z-index of tangram area above all other interface elements.
    $('.tangram-area').css({zIndex: 43000})
  },

  //make different color if over trash can
  dragMove: function (d) {
    var x        = d3.event.sourceEvent.layerX,
        y        = d3.event.sourceEvent.layerY,
//        mX       = d3.event.x,
//        mY       = d3.event.y,
        mX       = x - _dragOffX,
        mY       = y - _dragOffY,
        width    = $('.puzzle-svg').width(),
        height   = $('.puzzle-svg').height(),
        trans    = 'translate(' + mX  + ', ' + mY + ')',
        trashEl  = document.querySelector('#botanist-area .trash'),
        trashing = false,
        trash    = _botanist.trashPosition


    function _getCentroid (selection) {
      var bbox = selection.node().getBBox()
      return [bbox.x + bbox.width/2, bbox.y + bbox.height/2]
    }


    // Debug output
    console.log({
      x: x,
      y: y,
      mX: mX,
      mY: mY,
      _dragOffX: _dragOffX,
      _dragOffY: _dragOffY,
      trans: trans,
      event: d3.event,
      d: d
    })

    // If over trash area
    if (x > trash.left && x < trash.right && y > trash.top && y < trash.bottom) {
      trashEl.classList.add('active')
      trashing = true
    }
    else {
      trashEl.classList.remove('active')
      trashing = false
    }

    // Set the appearance of the tangram piece
    d3.select('.br' + d.id)
      .attr('transform', trans)
      .attr('opacity', function () {
        return trashing ? 0.5 : 1
      })
  },

  //move puzzle piece or trash it (return to inventory) on drop
  dropMove: function (d) {
    var x     = d3.event.sourceEvent.layerX,
        y     = d3.event.sourceEvent.layerY,
        mX    = _botanist.snapTangramTo(x - _dragOffX),
        mY    = _botanist.snapTangramTo(y - _dragOffY),
        trans = 'translate(' + mX  + ', ' + mY + ')',
        trash = _botanist.trashPosition

    d3.select('.br' + d.id)
      .classed('dragging', false)
      .attr('stroke-width', 0)
      .attr('transform', trans)

    // If over trash area
    if (x > trash.left && x < trash.right && y > trash.top && y < trash.bottom) {
      $('.br' + d.id).remove();
      $('.r' + d.id)
        .css('opacity', 1)
        .attr('draggable', 'true')
      $('.trash').removeClass('active')
    }

    // Restore z-index to normal
    $('.tangram-area').css({zIndex: 'initial'})
  },

  // Remove all pieces from puzzle board return to inventory
  clearBoard: function () {
    $('.puzzle-svg').empty()
    $('.inventory-item').css('opacity', 1).attr('draggable', 'true')
  },

  // Return level question for resume
  getLevelQuestion: function (level) {
    return _botanist.levelQuestion[level]
  },

  disable: function () {
    // Nothing
  }
};

function _setDomSelectors() {

  $tangramArea = $('.tangram-area');
  $botanistContent = $('.botanist-content');
}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _botanist = {

  data: {},
  state: null,
  tutorialState: 0,

  nudgePlayerInterval: null,
  nudgePlayerTimeout: null,
  trashPosition: {
    top:    null,
    bottom: null,
    left:   null,
    right:  null
  },
  renderInfo: {
    kind:  'botanist',
    srcX:  0,
    srcY:  0,
    curX:  null,
    curY:  null,
    prevX: null,
    prevY: null
  },

  levelQuestion: [
    'What motivates you to civically engage? Your answer will become a permanent part of your Civic Resume, so think carefully!',
    'Please describe your past experience and skills in civic engagement. Your answer will become a permanent part of your Civic Resume, so think carefully!',
    'What aspect of civic engagement interests you the most? What type of projects do you want to work on? Your answer will become a permanent part of your Civic Resume, so think carefully!',
    'What outcomes do you hope to achieve for yourself through civic engagement? What are you hoping to learn, and where do you want your civic engagement to lead? Your answer will become a permanent part of your Civic Resume, so think carefully!'
  ],

  // Determine if the Botanist is on screen
  isOnScreen: function () {
    var loc = $game.$map.masterToLocal(_botanist.data.x, _botanist.data.y);

    if (loc) {
      var prevX = loc.x * $game.TILE_SIZE,
          prevY = loc.y * $game.TILE_SIZE,
          curX  = loc.x * $game.TILE_SIZE,
          curY  = loc.y * $game.TILE_SIZE;

      _botanist.renderInfo.prevX = prevX;
      _botanist.renderInfo.prevY = prevY;

      _botanist.renderInfo.curX = curX;
      _botanist.renderInfo.curY = curY;

      return true
    }
    else return false
  },

  //update data for idle cycle animation
  idle: function () {
    _counter += 1;

    if (_botanist.renderInfo.srcY === 0) {
      if (_counter >= 24) {
        _counter = 0;
        _botanist.renderInfo.srcX = 0;
      }

      else if (_counter == 18) {
        _botanist.renderInfo.srcX = 32 * 6;
      }

      else if (_counter == 12) {
        _botanist.renderInfo.srcX = 32 * 12;
      }

      else if (_counter == 6) {
        _botanist.renderInfo.srcX = 32 * 18;
      }
    } else {
      _botanist.renderInfo.srcX = 0;
    }
  },

  // Botanist speech bubble. This is a wrapper function for $npc.showSpeechBubble()
  chat: function (dialogue, prompt, callback) {
    // Set botanist chat status; this prevents people from cancelling dialogue with the botanist.
    $game.setFlag('botanist-chatting')

    // If there isn't a prompt already, force dialogue to be a prompt, otherwise it freezes player interaction forever
    if (!_.isFunction(prompt) && !_.isArray(dialogue)) {
      dialogue = [dialogue]
    }

    // Use $npc.showSpeechBubble() to display the chat bubble
    $game.$npc.showSpeechBubble($botanist.name, dialogue, prompt, function () {
      $game.removeFlag('botanist-chatting')
      if (typeof callback === 'function') callback()
    })
  },

  // Run through various steps of the onboarding tutorial.
  doTutorial: function () {
    var tutorialState = _botanist.tutorialState,
        dialogue      = ''

    switch (tutorialState) {
      // Seed instructions
      case 0:
        dialogue = $botanist.dialog[0].instructions
        _botanist.chat(dialogue, null, function () {
          $game.$input.highlightHUDButton('.hud-seed')
          $game.$player.setSeeds('regular', 1)
          _botanist.tutorialState = 1
        })
        break
      // Complete seed tutorial and start progress tutorial
      case 1:
        // Make sure they have planted a seed
        if ($game.$player.getSeedsDropped() < 1) {
          // dialogue =  'To plant a seed, click the leaf icon at the bottom of the screen, and then click the area where you wish to plant. Oh, look at that, you have a seed already! Try and plant it, then talk to me again.'
          dialogue = 'To plant a seed, click the leaf icon at the bottom of the screen, and then click the area where you wish to plant. Try and plant it, then talk to me again.'
          $game.$input.highlightHUDButton('.hud-seed')
          _botanist.chat(dialogue, null, function () {
            $game.alert('Plant a seed by clicking the seed icon')
          })
        }
        else {
          // Player has completed seed tutorial; start progress tutorial
          dialogue = $botanist.dialog[0].instructions2

          // TODO: ?????
          $game.$player.saveMapImage(true)

          // Player now does progress window tutorial.
          $game.$input.highlightHUDButton('.hud-progress')
          _botanist.chat(dialogue, null, function () {
            $game.alert('Look at the progress window')
            // setTimeout($botanist.nudgePlayer, 5000)
            $botanist.setState(1)
            _botanist.tutorialState = 2
          })
        }
        break
      // Complete progress tutorial and begin level 1
      case 2:
        // Verify that the player has clicked the Progress button
        // If it's still highlighted, player has not clicked it.
        if ($('.hud-progress').hasClass('hud-button-highlight')) {
          _botanist.chat('Take a look at the progress window by clicking on the highlighted Progress button at the bottom of the screen!')
        }
        else {
          // Display start to level 1

          // TODO: ACTUALLY DISPLAY THE BOTANIST OVERLAY....!
          $('.tangram-area').hide()
          _botanist.say('The pieces you need to complete this puzzle lie in Brightwood Forest, located in the northwest.')
          document.querySelector('#botanist-area .botanist-content').innerHTML = '<div class="minimap"><img src="/img/game/minimap.png"></div><p>Go out and talk to the people you see. When you think you have all the pieces, come back to the center of the map and talk to me. Good luck!</p>'

          // Add this tangram outline to the inventory
          $game.$player.putTangramPuzzleInInventory()
          $botanist.setState(2)

          // Complete the tutorial phase.
          _botanist.completeTutorial()
        }
        break
      // This can be expanded to include any number of steps in the future.
      // Be sure to call _botanist.completeTutorial() at the last step to record that the player has
      // finished the tutorial session.
    }
  },

  // Remove player's first time flag & update this on the server.
  completeTutorial: function () {
    // After removing this flag, doTutorial() will no longer be called.
    $game.removeFlag('first-time')
    ss.rpc('game.player.updateGameInfo', {
      id:        $game.$player.id,
      firstTime: false
    })
  },

  nudgePlayer: function () {
    $game.alert('Talk to the botanist')
    $game.$render.pingMinimap({x: 70, y: 71})
  },

  // Gets the position of the trash can and returns it
  getTrashPosition: function () {
    var el  = document.getElementById('botanist-area').querySelector('.trash'),
        $el = $(el)

    return {
      top:    $el.position().top,
      bottom: $el.position().top  + $el.height(),
      left:   $el.position().left,
      right:  $el.position().left + $el.width()
    }
  },

  // Gets the position of the trash can and stores it on an internal variable for later
  setTrashPosition: function () {
    this.trashPosition = this.getTrashPosition()

    return (this.trashPosition.top !== null) ? true : false
  },

  // Bind a tooltip to the trash can to provide some UI feedback for the user.
  setupPuzzleSolvingTrashCan: function () {
    var el      = document.querySelector('#botanist-area .tangram-outline'),
        trashEl = document.createElement('img')

    // Create & format the trash can element
    trashEl.classList.add('trash')
    trashEl.src = CivicSeed.CLOUD_PATH + '/img/game/trash.png';
    trashEl.title = 'Drag a piece to the trash can to put it back in your inventory.'
    trashEl.setAttribute('data-placement', 'top')
    trashEl.addEventListener('mouseover', function () {
      $(this).tooltip('show')
    })

    // Add it to the DOM
    el.appendChild(trashEl)

    // Remember the trash position for later
    return this.setTrashPosition()
  },

  // When piece is moved, snap to 10x10 grid
  snapTangramTo: function (num) {
    var thresh = 10
    return Math.round(num / thresh) * thresh
  },

  // Give the Botanist something to say in the botanist overlay.
  say: function (message) {
    var el        = document.getElementById('botanist-area'),
        speakerEl = el.querySelector('.speaker'),
        messageEl = el.querySelector('.message')

    speakerEl.innerText = $botanist.name
    messageEl.innerText = message
  },

  // Load the puzzle image for player's current level and adds it to DOM.
  loadPuzzleImage: function () {
    var el       = document.querySelector('#botanist-area .tangram-outline'),
        puzzleEl = document.createElement('img')

    // Clear the area first.
    while (el.firstChild) el.removeChild(el.firstChild)

    // Put in the image.
    puzzleEl.src = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle' + $game.$player.currentLevel + '.png'
    el.appendChild(puzzleEl)
  },

  // Give user feedback on puzzle answer
  feedback: function (message) {
    var $el = $('#botanist-area .check')

    $el.find('.feedback').text(message)
    $el.find('button').bind('click', _botanist.hideFeedback).show()
    $el.fadeIn(200)
  },

  hideFeedback: function () {
    var $el = $('#botanist-area .check')
    if ($el.is(':visible')) {
      $el.fadeOut(200)
    }
  },

}
