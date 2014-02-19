'use strict';

//private botanist vars
var _info = null,
    _renderInfo = null,
    _onScreen = false,
    _messages = null,
    _currentMessage = 0,
    _currentSlide = 0,
    _promptNum = 0,
    _transferData = {},
    _svg = null,
    _drag = null,
    _new = null,
    _counter = 0,
    _dragOffX = 0,
    _dragOffY = 0,

    _paintbrushSeedFactor = 5,
    _levelQuestion = ['What motivates you to civically engage? Your answer will become a permanent part of your Civic Resume, so think carefully!','Please describe your past experience and skills in civic engagement. Your answer will become a permanent part of your Civic Resume, so think carefully!','What aspect of civic engagement interests you the most? What type of projects do you want to work on? Your answer will become a permanent part of your Civic Resume, so think carefully!', 'What outcomes do you hope to achieve for yourself through civic engagement? What are you hoping to learn, and where do you want your civic engagement to lead? Your answer will become a permanent part of your Civic Resume, so think carefully!'],

    $botanistArea = null,
    $inventoryItem = null,
    $tangramArea = null,
    $botanistTextArea = null,
    $inventoryBtn = null,
    $inventoryPuzzle = null,
    $botanistContent = null,
    $botanistAreaMessage = null;

//export botanist functions
var $botanist = $game.$botanist = {

  index: 0,
  numSteps: 64,
  counter: Math.floor(Math.random() * 64),
  curFrame: 0,
  numFrames: 4,
  dialog: null,
  tangram: null,
  name: null,
  isChat: false,
  isShowing: false,
  ready: false,

  tutorialState: 0,

  init: function (callback) {
    ss.rpc('game.npc.loadBotanist', function (botanist) {
      $game.$botanist.index = botanist.id;
      $game.$botanist.dialog = botanist.dialog;
      $game.$botanist.name = botanist.name;
      $game.$botanist.tangram = botanist.tangram;

      _info = {
        x: botanist.x,
        y: botanist.y
      };

      _renderInfo = {
        kind: 'botanist',
        srcX: 0,
        srcY: 0,
        curX: botanist.x,
        curY: botanist.y,
        prevX: botanist.x,
        prevY: botanist.y
      };

      _setDomSelectors();
      $game.$botanist.setupTangram();
      $game.$botanist.getMaster();
      $game.$botanist.setState($game.$player.botanistState);
      $game.$botanist.ready = true;
      callback();
    });
  },

  resetInit: function () {
    _info = null;
    _renderInfo = null;
    _onScreen = false;
    _messages = null;
    _currentMessage = 0;
    _currentSlide = 0;
    _promptNum = 0;
    _transferData = {};
    _svg = null;
    _drag = null;
    _new = null;
    _counter = 0;
    _dragOffX = 0;
    _dragOffY = 0;

    $botanistArea = null;
    $inventoryItem = null;
    $tangramArea = null;
    $botanistTextArea = null;
    $inventoryBtn = null;
    $inventoryPuzzle = null;
    $botanistContent = null;
    $botanistAreaMessage = null;

    $game.$botanist.index= 0;
    $game.$botanist.counter= Math.floor(Math.random() * 64);
    $game.$botanist.curFrame= 0;
    $game.$botanist.dialog= null;
    $game.$botanist.tangram= null;
    $game.$botanist.name= null;
    $game.$botanist.isChat= false;
    $game.$botanist.isShowing= false;
    $game.$botanist.ready= false;

    $botanist.tutorialState = 0
  },

  //clear botanist from canvas
  clear: function () {
    $game.$render.clearBotanist(_renderInfo);
  },

  //get botanist current render data
  getRenderInfo: function () {
    //since the botanist is stationary, we can hard code his location

    if (_onScreen) {
      return _renderInfo;
    }
    else {
      return false;
    }
  },

  //decide how to render botanist
  update: function () {
    if (!$game.checkFlag('in-transit')) {
      if (_onScreen) {
        $game.$botanist.idle();
      }
    }
    else if ($game.checkFlag('in-transit')) {
      $game.$botanist.getMaster();
    }
  },

  getState: function () {
    return $game.$player.botanistState
  },

  // Sets the botanist state which determines what he shows
  setState: function (state) {
    // Set state globally for player
    $game.$player.botanistState = state

    // Save to database
    ss.rpc('game.player.updateGameInfo', {
      id: $game.$player.id,
      botanistState: state
    })

    // Render visual state
    // If Botanist is in state 2, he has his arms crossed - otherwise he is waving his arms to get the attention of the player
    _renderInfo.srcY = (state === 2) ? 160 : 0
  },

  //determine if botanist is on screen
  getMaster: function () {
    var loc = $game.$map.masterToLocal(_info.x, _info.y);

    if (loc) {
      var prevX = loc.x * $game.TILE_SIZE,
        prevY = loc.y * $game.TILE_SIZE,
        curX = loc.x * $game.TILE_SIZE,
        curY = loc.y * $game.TILE_SIZE;

      _renderInfo.prevX = prevX;
      _renderInfo.prevY = prevY;

      _renderInfo.curX = curX;
      _renderInfo.curY = curY;
      _onScreen = true;
    }
    else {
      _onScreen = false;
    }
  },

  //update data for idle cycle animation
  idle: function () {
    _counter += 1;

    if (_renderInfo.srcY === 0) {
      if (_counter >= 24) {
        _counter = 0;
        _renderInfo.srcX = 0;
      }

      else if (_counter == 18) {
        _renderInfo.srcX = 32 * 6;
      }

      else if (_counter == 12) {
        _renderInfo.srcX = 32 * 12;
      }

      else if (_counter == 6) {
        _renderInfo.srcX = 32 * 18;
      }
    } else {
      _renderInfo.srcX = 0;
    }
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
    if (level >= 4) {
      // Player is in a different level (e.g. boss?) What are they doing here?
      //they have beaten the INDIVIDUAL part of the game
      //if they have beat level 4
      //but comm. meter is <
      //and comm. meter is >
      //and final task is solved
      return
    }

    // Look at Botanist state
    switch ($game.$player.botanistState) {
      // 0 = Initial state. Player is beginning the current level.
      case 0:
        // If this is the player's first time in the game, player should complete the tutorial first.
        if ($game.checkFlag('first-time') === true) {
          $botanist.doTutorial($botanist.tutorialState)
          return
        }

        // Show instructions.
        $botanist.chat($botanist.dialog[level].instructions, null, function () {
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
        $botanist.chat($botanist.dialog[level].hint[hintIndex])
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
  },

  nudgePlayer: function () {
    // First iteration
    _nudge()

    // Set up a recurring timer, which is cleared when player talks to the botanist.
    _botanist.nudgePlayerInterval = setInterval(_nudge, 16000)

    function _nudge() {
      $game.alert('Talk to the botanist')
      $game.$render.pingMinimap({x: 70, y: 71})
    }
  },

  // Wrapper for $npc.showSpeechBubble()
  chat: function (dialogue, prompt, callback) {
    // Set botanist chat status; this prevents people from cancelling dialogue with the botanist.
    // $botanist.isChat = true
    $game.$npc.showSpeechBubble($botanist.name, dialogue, prompt, callback)
    /* TODO: Find out why callback is not getting passed through
    $game.$npc.showSpeechBubble($botanist.name, dialogue, prompt, function (callback) {
      $botanist.isChat = false
      callback()
    })
    */
  },

  doTutorial: function (tutorialState) {
    var dialogue = ''

    switch (tutorialState) {
      // Seed instructions
      case 0:
        dialogue = $botanist.dialog[0].instructions
        $botanist.chat(dialogue, null, function () {
          $game.highlightUI('.hud-seed')
          $game.$player.setSeeds('regular', 1)
          $botanist.tutorialState = 1
        })
        break
      // Complete seed tutorial and start progress tutorial
      case 1:
        // Make sure they have planted a seed
        if ($game.$player.getSeedsDropped() < 1) {
          // dialogue =  'To plant a seed, click the leaf icon at the bottom of the screen, and then click the area where you wish to plant. Oh, look at that, you have a seed already! Try and plant it, then talk to me again.'
          dialogue =  ['To plant a seed, click the leaf icon at the bottom of the screen, and then click the area where you wish to plant. Try and plant it, then talk to me again.']
          $game.highlightUI('.hud-seed')
          $botanist.chat(dialogue, null, function () {
            $game.alert('Plant a seed by clicking the seed icon')
          })
        }
        else {
          // Player has completed seed tutorial; start progress tutorial
          dialogue = [$botanist.dialog[0].instructions2]     // Force instruction to prompt

          // TODO: ?????
          $game.$player.saveMapImage(true)

          // Player now does progress window tutorial.
          $game.highlightUI('.hud-progress')
          $botanist.chat(dialogue, null, function () {
            $game.alert('Look at the progress window')
            setTimeout($botanist.nudgePlayer, 5000)
            $botanist.setState(1)
          })
        }
        break
      // There is no case 2 / default, but can be expanded to include this in the future.
    }
  },

  //show the viewing tangram prompt
  showPrompt: function (prompt) {
    var dialogue = $game.$botanist.dialog[$game.$player.currentLevel].riddle.prompts[prompt];

    $botanist.chat(dialogue, function () {
      if (prompt === 1) {
        $botanistArea.addClass('puzzle-mode')
        $game.setFlag('solving-puzzle')
      }
      $game.$botanist.showRiddle(prompt);
    })
  },

  //show the riddle if the inventory is open and it was clicked
  inventoryShowRiddle: function () {

    //hide the inventory if the resource is not already visible
    //when clicked on from inventory (this means it isn't in puzzle mode)
    if (!$game.$botanist.isShowing) {
      $('#inventory').slideUp();
      $game.$botanist.isChat = true;
      $game.$botanist.showRiddle(0);
    }
  },

  //show the riddle, its basically an image
  showRiddle: function (num) {
    _promptNum = num;
    _currentSlide = 0;
    //if they are solving, change functionality of inventory
    if (num === 1) {
      $game.$botanist.isChat = true;
    } else if (num === 2) {
      _currentSlide = 2;
    }
    $game.$botanist.addContent();
    $game.$botanist.addButtons();

    $game.$npc.hideSpeechBubble(function () {
      $botanistArea.fadeIn(function () {
        $game.$botanist.isShowing = true;

        if (_currentSlide === 0 && $game.checkFlag('first-time') === false) {
          $tangramArea.show();

          if ($game.checkFlag('solving-puzzle') === true) {
            // Show 'how-to-play' puzzle hints
            setTimeout(function () {
              $game.alert('Drag a piece to the board to place it')
            }, 5000)

            // Find and store coordinates for the trash area
            _botanist.setTrashPosition()
          }
        }
      });
    });
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
    $('#botanist-area .speaker').text($game.$botanist.name);
    //if _promptNum is 0, then it is the just showing the riddle no interaction
    if (_promptNum === 0) {
      if (_currentSlide === 0) {

        $botanistContent.empty()

        if ($botanist.getState() > 1) {
          $botanistAreaMessage.text('Here is the notebook page to view again.');
        }
        else {
          $botanistAreaMessage.text('Here is the page. You will be able to view it at any time in your inventory.');

          //add this tangram outline to the inventory
          $game.$player.tangramToInventory();
          $botanist.setState(2);
        }

        var imgPath = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle' + $game.$player.currentLevel+ '.png';
        $('.tangram-outline').html('<img src="' + imgPath + '">');
        $('.tangram-area').show()

      }
      else {
        if ($game.$player.currentLevel === 0) {

          $game.removeFlag('first-time')

          // Update player info.
          ss.rpc('game.player.updateGameInfo', {
            id:        $game.$player.id,
            firstTime: false
          })

          //add this tangram outline to the inventory
          $game.$player.tangramToInventory();
          $botanist.setState(2)
          $('.tangram-area').hide()

          $botanistAreaMessage.text('The pieces you need to complete this puzzle lie in Brightwood Forest, located in the northwest.');
          $botanistContent.html('<p class="miniExample" ><img src="/img/game/minimap.png"></p><p>Go out and talk to the people you see. When you think you have all the pieces, come back to the center of the map and talk to me. Good luck!</p>');
        }
      }
    }
    //they are solving it, so riddle interface and stuff
    else {
      if (_currentSlide === 0) {
        $inventoryBtn.hide();

        $game.$input.openInventory(function () {
          //set the inventory items to draggable in case they were off
          $inventoryItem.attr('draggable','true');
        })

        //$game.$botanist.dialog[$game.$player.currentLevel].riddle.sonnet
        $botanistAreaMessage.text('OK. Take the pieces you have gathered and drop them into the outline to create your seeds.');
        var imgPath1 = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle'+$game.$player.currentLevel+'.png',
            imgPath2 = CivicSeed.CLOUD_PATH + '/img/game/trash.png';
        var newHTML = '<img src="' + imgPath1 + '"><img src="' + imgPath2 + '" class="trash">';
        $('.tangram-outline').html(newHTML);

        // Replace the tangram image in the inventory with tip
        $('.inventory-tangram').hide()
        $('#inventory .help').show()
      }
      //right/wrong screen
      else if (_currentSlide === 1) {
        $botanistArea.animate({
            'height':'450px'
        });

        $game.$input.closeInventory(function () {
          $inventoryBtn.show();
          $inventoryItem.remove();
        })

        var postTangramTalk = $game.$botanist.dialog[$game.$player.currentLevel].riddle.response;
        //console.log('posttangramtalk', postTangramTalk);
        $botanistAreaMessage.text(postTangramTalk);
        var newHTML2 = '<h3>You earned a promotion to ' + $game.playerRanks[$game.$player.currentLevel + 1] + '!</h3>',
            imgPath3 = CivicSeed.CLOUD_PATH + '/img/game/seed_chips.png';

        newHTML2 += '<div class="seed-chips"><img src="' + imgPath3 +'"></div>';
        $botanistContent.html(newHTML2);
      }
      else {
        var endQuestion = _levelQuestion[$game.$player.currentLevel];
        $botanistAreaMessage.text(endQuestion);
        var inputBox = '<textarea placeholder="Type your answer here..." maxlength="5000" autofocus></textarea>';
        $botanistContent.html(inputBox);
      }
    }
  },

  showTangram: function () {
    // Reserved
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
    $botanistArea.fadeOut(function () {
      $game.$botanist.isShowing = false;
      $('.botanist button').hide();
      $(this).removeClass('puzzle-mode')
      $game.$botanist.isChat = false;

      $game.$botanist.clearBoard();
      $('.inventory-item').css('opacity',1);

      // Remove flags
      $game.removeFlag('solving-puzzle')

      //if they just beat a level, then show progreess
      if ($game.$player.botanistState === 0 && $game.$player.currentLevel < 4) {
        $game.highlightUI('.hud-progress')
        $game.showProgress();
      }
    });

    // Close and reset inventory to non-puzzle state
    $game.$input.closeInventory(function () {
      // TODO: Check this stuff
      $inventoryBtn.show();
      $inventoryItem.remove();
      $('.inventory-puzzle').show();
      $('#inventory .help').hide();
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
        this.feedback('Please answer the question!')
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
      .on('drag', $game.$botanist.dragMove)
      .on('dragstart', $game.$botanist.dragMoveStart)
      .on('dragend', $game.$botanist.dropMove);
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
        $trashEl = $('.trash'),
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
      $trashEl.addClass('active')
      trashing = true
    }
    else {
      $trashEl.removeClass('active')
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

  //return level question for resume
  getLevelQuestion: function (level) {
    return _levelQuestion[level];
  },

  disable: function () {
    _onScreen = false;
  }
};

function _setDomSelectors() {
  $botanistArea = $('#botanist-area');
  $inventoryItem = $('.inventory-item');
  $tangramArea = $('.tangram-area');
  $botanistTextArea = $('.botanist-content textarea');
  $inventoryBtn = $('#inventory button');
  $inventoryPuzzle = $('.inventory-puzzle');
  $botanistContent = $('.botanist-content');
  $botanistAreaMessage = $('#botanist-area .message');
}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _botanist = {

  nudgePlayerInterval: null,
  nudgePlayerTimeout: null,
  trashPosition: {
    top:    null,
    bottom: null,
    left:   null,
    right:  null
  },

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

  setTrashPosition: function () {
    this.trashPosition = this.getTrashPosition()

    return (this.trashPosition.top !== null) ? true : false
  },

  // When piece is moved, snap to 10x10 grid
  snapTangramTo: function (num) {
    var thresh = 10
    return Math.round(num / thresh) * thresh
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
