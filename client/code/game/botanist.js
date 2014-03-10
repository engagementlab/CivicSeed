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
var _counter = 0,
    _dragOffX = 0,
    _dragOffY = 0,
    _paintbrushSeedFactor = 5

var $botanist = $game.$botanist = {

  index:   0,
  dialog:  null,
  tangram: null,
  name:    null,
  ready:   false,

  init: function (callback) {
    ss.rpc('game.npc.loadBotanist', function (data) {
      _botanist.data    = data

      $botanist.index   = _botanist.data.id
      $botanist.dialog  = _botanist.data.dialog
      $botanist.tangram = _botanist.data.tangram
      $botanist.name    = _botanist.data.name
      $botanist.ready   = true

      callback()
    });
  },

  resetInit: function () {
    _counter = 0;
    _dragOffX = 0;
    _dragOffY = 0;

    $botanist.index   = 0;
    $botanist.dialog  = null;
    $botanist.tangram = null;
    $botanist.name    = null;
    $botanist.ready   = false;
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
    // The state of the botanist should be set at the beginning of the game by $game.init()
    _botanist.state = state

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
    return _botanist.state
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

    // Behavior for if player has completed level 4
    if (level === 4) {
      // Display a generic end of level chat and then exit out. No further content from botanist.
      // The game will continue only when the boss mode is unlocked.
      _botanist.chat($botanist.dialog[4].instructions)
      return
    }

    // If this is the player's first time in the game, player should complete the tutorial first.
    if ($game.checkFlag('first-time') === true) {
      _botanist.doTutorial()
      return
    }

    // Determine interaction by looking at Botanist state
    switch ($game.$botanist.getState()) {
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
        _botanist.showPrompt(0)
        break
      // 2 = Player has obtained tangram puzzle and is currently collecting resources.
      case 2:
        var hintIndex = ($game.$player.getInventory().length > 0) ? 1 : 0
        _botanist.chat($botanist.dialog[level].hint[hintIndex])
        break
      // 3 = Player has all the correct resources, ready to solve.
      case 3:
        _botanist.showPrompt(1)
        break
      // 4 = Player has correctly solved the puzzle, but has not answered the portfolio question.
      case 4:
        _botanist.showOverlay(3);
        break
    }
  },

  nudgePlayer: function () {
    // First iteration
    _botanist.nudgePlayer()

    // Set up a recurring timer, which is cleared when player talks to the botanist.
    _botanist.nudgePlayerInterval = setInterval(_botanist.nudgePlayer, 16000)
  },

  // Shows the botanist's riddle when clicked on from the player's inventory
  showPuzzlePageFromInventory: function () {
    // Set a flag that remembers we were in the inventory
    $game.setFlag('viewing-inventory')
    $game.$input.hideInventory(function () {
      _botanist.showOverlay(0)
    })
  },

  // Hide botanist overlay window
  hideOverlay: function (callback) {
    var overlay = document.getElementById('botanist-area')

    $(overlay).fadeOut(300, function () {
      // Reset all UI
      _botanist.resetContent()
      _botanist.clearPuzzleMode()
      $botanist.clearBoard()
      $('.inventory-item').css('opacity',1);

      // Remove flags
      $game.removeFlag('visible-botanist-overlay')
      $game.removeFlag('solving-puzzle')
      $game.removeFlag('botanist-chatting')  // Just in case it was accidentally not removed

      //if they just beat a level, then show progreess
      if ($game.$botanist.getState() === 0 && $game.$player.currentLevel < 4) {
        $game.$input.highlightHUDButton('.hud-progress')
        $game.showProgress();
      }

      // If inventory was showing previously, re-open the inventory
      if ($game.checkFlag('viewing-inventory') === true) $game.$input.showInventory()

      // Execute a callback function if provided
      if (typeof callback === 'function') callback()
    })
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

  //when dragging starts from inventory must bind drop on puzzle area
  // Called from player.js when an item is added to the inventory.
  onTangramDragFromInventoryStart: function (e) {
    var $puzzleEl = $('.botanist-puzzle')

    $puzzleEl
      .unbind('dragover')
      .unbind('drop')

    var npcData = e.data,
        dt = e.originalEvent.dataTransfer;

    dt.setData('text/plain', npcData.npc);

    //set drag over and drop to receive
    $puzzleEl
      .bind('dragover', _botanist.onTangramDragOver)
      .bind('drop',     _botanist.onTangramDrop);
  },

  disable: function () {
    // Nothing
  }
};

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
          _botanist.showPrompt(0)
        }
        break
      // This can potentially be expanded to include any number of steps in the future, although
      // currently the tutorial starts to make use of other functions similar to rest of the
      // levels (e.g. addContent()) to kick off level 1. Look for the presence of the 'first-time'
      // flag to detect whether player is in tutorial mode. When complete, be sure to call the
      // _botanist.completeTutorial() function to remember that the player has completed the
      // tutorial session.
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
    if ($botanist.getState() !== 2) {
      $game.alert('Talk to the botanist')
      $game.$render.pingMinimap({x: 70, y: 71})
    }
  },

  // Show a chat bubble prompt before displaying overlay content
  showPrompt: function (section) {
    var dialogue = $game.$botanist.dialog[$game.$player.currentLevel].riddle.prompts[section]
    _botanist.chat(dialogue, function () {
      _botanist.showOverlay(section)
    })
  },

  showOverlay: function (section) {
    var overlay = document.getElementById('botanist-area')
    $game.setFlag('visible-botanist-overlay')
    this.addContent(section)
    $(overlay).fadeIn(300)
  },

  addContent: function (section) {
    var overlay = document.getElementById('botanist-area'),
        content = overlay.querySelector('.botanist-content')

    // Reset all resource slides and buttons to a hidden & clean state.
    _botanist.resetContent()

    // Determine what content to add.
    switch (section) {
      // [SECTION 00] PUZZLE / TANGRAM / NOTEBOOK PAGE.
      //   This game seems to use the terms "tangram", "puzzle", and "notebook page" almost
      //   interchangeably.  "Notebook page" is most commonly used by the Botanist character
      //   when speaking to the player.  Internally, this is called the "tangram" in the code.
      //   Despite being an accurate term, this developer prefers using the word "puzzle" so as
      //   to avoid confusion with individual tangram pieces which the player collects during
      //   the course of the game.
      //
      //   For case 0, we are just showing or giving the puzzle page to the player. No further
      //   interaction.
      case 0:
        _botanist.showPuzzlePageContent()

        // Special case for tutorial
        if ($game.checkFlag('first-time')) {
          _addButton('next', 5)
          break
        }

        // Add close button
        _addButton('close', null, function () {
          // If the player does not yet have this puzzle piece, the game adds it to the
          // player's inventory after this window is closed.
          if ($botanist.getState() < 2) {
            $game.$player.putTangramPuzzleInInventory()
            $botanist.setState(2)
          }
        })
        break
      // [SECTION 01] SOLVING THE BOTANISTS'S PUZZLE.
      case 1:
        // Setup classes and flags
        document.getElementById('botanist-area').classList.add('puzzle-mode')
        $game.setFlag('solving-puzzle')

        // Setup contents
        _botanist.say('OK. Take the pieces you have gathered and drop them into the outline to create your seeds.')
        _botanist.setupPuzzleSolvingTrash()
        _botanist.setupPuzzleSolvingTangram()
        _botanist.loadPuzzleImage()
        overlay.querySelector('.botanist-puzzle').style.display = 'block'

        // Replace the tangram image in the inventory with puzzle-mode tip
        document.querySelector('#inventory .inventory-tangram').style.display = 'none'
        document.querySelector('#inventory .close-button').style.display = 'none'
        document.querySelector('#inventory .help').style.display = 'block'

        // Show the inventory screen
        $game.$input.showInventory(function () {
          // Set the inventory items to draggable in case they were off
          $('.inventory-item').attr('draggable', 'true')
        })

        // Show 'how-to-play' puzzle hints
        setTimeout(function () {
          $game.alert('Drag a piece to the board to place it')
        }, 1000)
        setTimeout(function () {
          $game.alert('Click on a piece to review its contents')
        }, 6000)

        // Add buttons
        _addButton('clear')

        // Add an Answer button and provide a function for what to do when it's pressed
        _addButton('answer', 2, function () {
          // Check the puzzle answer. If correct, submit it and move on to the next screen.
          if (_botanist.checkPuzzleAnswer() === true) {
            _botanist.submitPuzzleAnswer()

            // Go to reward screen.
            _botanist.addContent(2)
          }
        })
        break
      // [SECTION 02] CORRECTLY SOLVED THE PUZZLE.
      case 2:
        _botanist.say($game.$botanist.dialog[$game.$player.currentLevel].riddle.response)
        var imgPath = CivicSeed.CLOUD_PATH + '/img/game/seed_chips.png'
        content.innerHTML = '<h3>You earned a promotion to ' + $game.playerRanks[$game.$player.currentLevel + 1] + '!</h3><div class="seed-chips"><img src="' + imgPath +'"></div>'
        content.style.display = 'block'

        _addButton('next', 3)
        break
      // [SECTION 03] ANSWER THE CIVIC RESUME / PORTFOLIO QUESTION.
      case 3:
        _botanist.say(_botanist.levelQuestion[$game.$player.currentLevel])
        content.innerHTML = '<textarea placeholder="Type your answer here..." maxlength="5000" autofocus></textarea>'
        content.style.display = 'block'

        // Add a save button and provide a function for what to do when it's pressed
        _addButton('save', null, function () {
          // If the response is complete, upload the user's answer to the server and go to the next level
          if (_botanist.validatePortfolioResponse() === true) {
            _botanist.submitPortfolioResponse()

            // Reset - TODO: Verify this is all good
            _paintbrushSeedFactor = 5;
            $game.$player.nextLevel()
            $botanist.hideOverlay(function () {
              // Begin the next level introduction from the Botanist
              $botanist.show()
            })
          }
        })
        break
      // (Skipped section 4 on purpose)

      // [SECTION 05] GIVE THE PLAYER THE MINIMAP
      //  This is a special screen that occurs only during the tutorial.
      case 5:
        _botanist.say('The pieces you need to complete this puzzle lie in Brightwood Forest, located in the northwest.')
        content.innerHTML = '<div class="minimap"><img src="/img/game/minimap.png"></div><p>Go out and talk to the people you see. When you think you have all the pieces, come back to the center of the map and talk to me. Good luck!</p>'
        content.style.display = 'block'

        _addButton('close', null, function () {
          // Add this tangram outline to the inventory
          $game.$player.putTangramPuzzleInInventory()
          $botanist.setState(2)

          // Give the player the map.
          $game.$input.showMinimap()

          // Complete the tutorial phase.
          _botanist.completeTutorial()

          // Note: this has actually never happened, but I'm putting it back here to see what happens
          $game.alert('Level 1: Looking Inward.  See the log below for more details.')
          $game.log('Level 1 is about understanding one’s own motivations, goals, social identities, ethics and values in the context of a larger society.  Before beginning work in the community, it is important to look within, and reflect on where you are coming from in order to move forward. The more you understand yourself, the better equipped you will be to becoming an aware and effective active citizen.')
        })
        break
      // Generic error for debugging.
      default:
        $botanist.hideOverlay(function callback () {
          $game.debug('Error Code 4998 dump!')
          console.log(section)
          $game.$npc.showSpeechBubble('Error Code 4998', ['The game failed to provide a slide to display, or tried to display a slide that doesn’t exist. See console for log details.'])
        })
        break
    }

    // Private add button function. Displays the button each slide asks for and binds actions to them.
    // Similar to _addButton() in resources.js - refer to that for notes
    function _addButton (button, section, callback) {
      var buttons = overlay.querySelector('.buttons'),
          back    = buttons.querySelector('.back-button'),
          clear   = buttons.querySelector('.clear-button'),
          next    = buttons.querySelector('.next-button'),
          answer  = buttons.querySelector('.answer-button'),
          save    = buttons.querySelector('.save-button'),
          close   = buttons.querySelector('.close-button')

      // Show requested button and bind event listeners
      switch (button) {
        case 'next':
          next.style.display = 'inline-block'
          next.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
            _botanist.addContent(section)
          })
          break
        case 'back':
          back.style.display = 'inline-block'
          back.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
            _botanist.addContent(section)
          })
          break
        // Clear button is used during puzzle to clear the puzzle board.
        case 'clear':
          clear.style.display = 'inline-block'
          clear.addEventListener('click', function () {
            $botanist.clearBoard()
          })
          break
        // Answer button is used during puzzle mode to submit a puzzle answer.
        case 'answer':
          answer.style.display = 'inline-block'
          answer.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
          })
          break
        // Save button is used to submit a portfolio response answer at the end of each level.
        case 'save':
          save.style.display = 'inline-block'
          save.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
          })
          break
        case 'close':
          close.style.display = 'inline-block'
          close.addEventListener('click', function () {
            $botanist.hideOverlay(callback)
          })
          break
        default:
          // Nothing.
          $game.debug('Warning: the game attempted to add a button that does not exist.')
          break
      }
      return true
    }

  },

  // The following reset functions are similar to resource.js functionality, so be sure to
  // make sure code improvements occur on both
  resetContent: function () {
    // Similar to _resources.resetSlides()
    var overlay = document.getElementById('botanist-area'),
        content = overlay.querySelector('.botanist-content')

    // Hides each slide
    _.each(overlay.querySelectorAll('.botanist-content, .botanist-puzzle'), function (el) {
      el.style.display = 'none'
    })

    // Empties contents of certain divs
    _.each(overlay.querySelectorAll('.botanist-content, .botanist-puzzle'), function (el) {
      while (el.firstChild) el.removeChild(el.firstChild)
    })

    // When slides are reset, always reset all buttons
    this.resetButtons()
  },

  resetButtons: function () {
    // Similar to _resources.resetButtons()
    var buttons = document.getElementById('botanist-area').querySelector('.buttons')

    // Reset event listeners by cloning and hide all buttons
    _.each(buttons.querySelectorAll('button'), function (button) {
      var clone = button.cloneNode(true)
      button = button.parentNode.replaceChild(clone, button)
      clone.style.display = 'none'
    })
  },

  // Give the Botanist something to say in the botanist overlay.
  // Use the .chat() function if you want to use a speech bubble instead.
  say: function (message) {
    var el        = document.getElementById('botanist-area')

    el.querySelector('.speaker').textContent = $botanist.name
    el.querySelector('.message').textContent = message
  },

  // Display the puzzle page.
  showPuzzlePageContent: function () {
    // There are two states for this, depending on the state of the Botanist.

    // If Botanist state is less than 2, he is showing it to the player for the first time.

    // If Botanist state is 2 or higher, then the player already has the puzzle in his or her
    // inventory, so the player is reviewing the puzzle page (either by talking to
    // the Botanist again, or looking at it from the Inventory).

    if ($botanist.getState() < 2) {
      // The Botanist gives the puzzle page to the player
      _botanist.say('Here is the page. You will be able to view it at any time in your inventory.')
    }
    else {
      // Reviewing the puzzle page
      _botanist.say('Here is the notebook page to view again.')
    }

    // Load puzzle image into DOM and display it.
    _botanist.loadPuzzleImage()
    $('.botanist-puzzle').show()
  },

  // Load the puzzle image for player's current level and adds it to DOM.
  loadPuzzleImage: function () {
    var el       = document.querySelector('#botanist-area .botanist-puzzle'),
        puzzleEl = document.createElement('img')

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
      $el.fadeOut(200, function () {
        // Remind player to review resources.
        setTimeout(function () {
          $game.alert('Click on a piece to review its contents')
        }, 1000)
      })
    }
  },

  // Gets the position of the trash can and returns it
  getTrashPosition: function () {
    var el  = document.getElementById('botanist-area').querySelector('.trash'),
        $el = $(el)

    var position = {
      top:    $el.position().top,
      bottom: $el.position().top  + $el.height(),
      left:   $el.position().left,
      right:  $el.position().left + $el.width()
    }
    console.log(position)

    return position
  },

  // Gets the position of the trash can and stores it on an internal variable for later
  setTrashPosition: function () {
    this.trashPosition = this.getTrashPosition()

    return (this.trashPosition.top !== null) ? true : false
  },

  // Bind a tooltip to the trash can to provide some UI feedback for the user.
  setupPuzzleSolvingTrash: function () {
    var el      = document.querySelector('#botanist-area .botanist-puzzle'),
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
  },

  // Preps the area for drag and drop puzzle mode
  setupPuzzleSolvingTangram: function () {
    d3.select('.botanist-puzzle')
      .append('svg')
      .classed('puzzle-svg', true)
  },

  onTangramDragOver: function (e) {
    e.preventDefault()
    return false
  },

  // When a tangram piece is dragged & dropped onto the puzzle area, add the shape
  onTangramDrop: function (e) {
    e.preventDefault()
    e.stopPropagation()

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

    var drag = d3.behavior.drag()
                .origin(Object)
                .on('drag',      _botanist.onTangramDrag)
                .on('dragstart', _botanist.onTangramDragStart)
                .on('dragend',   _botanist.onTangramDragEnd);

    //console.log(npcData, selector, x);
    $('.r' + name)
      .css('opacity','.4')
      .attr('draggable', 'false');

    d3.select('.puzzle-svg').append('path')
      .attr('class', selector)
      .data([{x:x , y: y, id: name, color: fill}])
      .attr('d', shape.path)
      .attr('fill', fill)
      .attr('stroke', 'rgb(255,255,255)')
      .attr('stroke-width', 0)
      .attr('transform', 'translate('+x+','+y+')')
      .call(drag);

    $('.botanist-puzzle')
      .unbind('dragover')
      .unbind('drop');

    //clear data from drag bind
    e.originalEvent.dataTransfer.clearData();
    return false;
  },

  // Event handler for starting to drag a puzzle piece on the puzzle area
  onTangramDragStart: function (d) {

    _dragOffX = d3.mouse(this)[0]
    _dragOffY = d3.mouse(this)[1]

    // This is put here because right now, trash position returns 0s if this
    // function is called too early in the setup process. Calling this now
    // ensures that this information is saved right when the dragging begins
    _botanist.setTrashPosition()

    // Apply a different visual style to the picked up piece
    d3.select('.br' + d.id)
      .attr('stroke-width', 3)
      .classed('dragging', true)

    // Sorts the picked up piece so that it is above the others.
    // Taken from here: http://stackoverflow.com/questions/13595175/updating-svg-element-z-index-with-d3
    d3.selectAll('.puzzle-svg path').sort(function (a, b) { // select the parent and sort the path's
      if (a.id != d.id) return -1;                          // a is not the hovered element, send "a" to the back
      else return 1;                                        // a is the hovered element, bring "a" to the front
    })

    // Hacky way of making it so that dragging puzzle pieces at the lower end of tangram area doesn't
    // create calculation errors by bringing the z-index of tangram area above all other interface elements.
    // And also lower the z-index of the trash can so that we can interact with it.
    $('.botanist-puzzle').css({zIndex: 43000})
    $('.trash').css({zIndex: 'initial'})
  },

  // Event handler for dragging a puzzle piece on area and moving it around
  onTangramDrag: function (d) {

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
    /*
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
*/

    // If over trash area, style the trash can
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
  onTangramDragEnd: function (d) {
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

    // If over trash area, return it to the inventory
    if (x > trash.left && x < trash.right && y > trash.top && y < trash.bottom) {
      $('.br' + d.id).remove();
      $('.r' + d.id)
        .css('opacity', 1)
        .attr('draggable', 'true')
      $('.trash').removeClass('active')
    }

    // Restore z-indexes to normal
    $('.botanist-puzzle').css({zIndex: 'initial'})
    $('.trash').css({zIndex: 40000})
  },

  // When piece is moved, snap to 10x10 grid
  snapTangramTo: function (num) {
    var thresh = 10
    return Math.round(num / thresh) * thresh
  },

  checkPuzzleAnswer: function () {
    var allTangrams = $('.puzzle-svg > path'),
        correct     = true,
        numRight    = 0,
        aLength     = $game.$botanist.tangram[$game.$player.currentLevel].answer.length,
          // This is the number of pieces
        message     = '',
        wrongOne    = false,
        nudge       = false;

    allTangrams.each(function (i, d) {
      //pull the coordinates for each tangram
      var tanIdD  = $(this).attr('class'),
          tanId   = tanIdD.substring(2,tanIdD.length),
          trans   = $(this).attr('transform'),
          transD  = trans.substring(10,trans.length-1),
          transD2 = transD.split(','),
          transX  = parseInt(transD2[0],10),
          transY  = parseInt(transD2[1],10),
          t       = aLength,
          found   = false,
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
      correct = false
      _paintbrushSeedFactor -= 1;
      message = 'At least TRY to solve it!';
    }
    // If there was a wrong piece
    else if (wrongOne) {
      correct = false
      _paintbrushSeedFactor -=1;
      message = 'Oh! That’s not quite right. Think more about how the pieces relate to one another, and try again.';
    }
    else if (allTangrams.length < aLength) {
      correct = false
      _paintbrushSeedFactor -=1;
      message = 'You are missing some pieces. Be sure to read the notebook clues carefully to help pick out the right pieces.';
    }
    else if (nudge) {
      correct = false
      _paintbrushSeedFactor -=1;
      message = 'So close! You had the right pieces, just fix the placement.';
    }

    // Display feedback, if there is one
    if (message.length > 0) {
      _botanist.feedback(message)
    }

    // TODO: Improve checking process so it doesn't have to remove pieces?
    // The checking process removes pieces from the board as it checks.
    // When it returns correct = false, it may do so before removing or checking all the pieces.
    // As a result, the clearBoard() function is called to always make sure the board is clean after the check.
    // However, it may be preferable in some cases to allow the pieces to stay on the board.
    $game.$botanist.clearBoard()

    // TODO: Is this necessary?
    //it is correct if none were WRONG
    //make sure ALL were on the board
    /*
    if (numRight === aLength) {
      correct = true
    }
    */

    return correct
  },

  // If puzzle answer is correct, give player rewards
  submitPuzzleAnswer: function () {
    // Remove pieces from player's inventory
    $game.$player.emptyInventory()

    // Add number of seeds as a reward
    var numSeeds   = _paintbrushSeedFactor < 0 ? 0: _paintbrushSeedFactor,
        level      = $game.$player.currentLevel + 1,
        totalSeeds = (30 + level * 4 ) + level * 4 * numSeeds;
    $game.$player.addSeeds('draw', totalSeeds)

    // Reset inventory and puzzle mode
    _botanist.clearPuzzleMode()

    // Set botanist to next state
    $botanist.setState(4)
  },

  // Reads the player's portfolio response answer from the textarea input
  getPortfolioResponseInput: function () {
    return $.trim($('.botanist-content textarea').val())
  },

  // Called by portfolio answer submit function to validate whether the question was answered
  validatePortfolioResponse: function () {
    var response    = this.getPortfolioResponseInput(),
        _focusInput = function () {
          document.querySelector('.botanist-content textarea').focus()
        }

    if (response.length === 0) {
      this.feedback('Please answer the question!', _focusInput)
      return false
    }
    else return true
  },

  // Submits the portfolio response answer to the server
  submitPortfolioResponse: function () {
    var response = this.getPortfolioResponseInput()
    $game.$player.resumeAnswer(response)
  },

  // Removes puzzle mode class from botanist overlay and resets inventory
  clearPuzzleMode: function () {
    // Remove puzzle-mode class
    document.getElementById('botanist-area').classList.remove('puzzle-mode')
    this.resetInventoryInterface()
  },

  // Hide and reset inventory view to non-puzzle state
  resetInventoryInterface: function () {
    $game.removeFlag('viewing-inventory')
    $game.$input.closeInventory(function () {
      document.querySelector('#inventory .inventory-tangram').style.display = 'block'
      document.querySelector('#inventory .close-button').style.display = 'block'
      document.querySelector('#inventory .help').style.display = 'none'
    })
  }

}
