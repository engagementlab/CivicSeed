'use strict';

var _resources = []

  //_rightOpenRandom = ['Very interesting. I\'ve never looked at it like that before.', 'That says a lot about you!', 'Thanks for sharing. Now get out there and spread some color!'],

var $resources = $game.$resources = {

  isShowing: false,
  ready: false,

  //load in all the resources and the corresponding answers
  init: function(callback) {
    var response = $game.$npc.getNpcData();
    //create array of ALL player responses and resource information
    ss.rpc('game.npc.getResponses', $game.$player.instanceName, function(all) {
      $.each(response, function(key, npc) {
        if(npc.isHolding) {
          var stringId = String(npc.index);
          _resources[stringId] = npc.resource;
          _resources[stringId].index = npc.index;
          _resources[stringId].playerAnswers = [];
          _resources[stringId].skinSuit = npc.skinSuit;
        }
      });
      var allRes = all[0].resourceResponses;
      $.each(allRes, function(key, answer) {
        if(answer.madePublic) {
          var stringId = String(answer.npc);
          _resources[stringId].playerAnswers.push(answer);
        }
      });

      $game.$resources.ready = true;
      callback();
    });
  },

  resetInit: function() {
    _resources = [];

    $game.$resources.isShowing = false;
    $game.$resources.ready = false;
  },

  debug: function () { // TODO: REMOVE
    console.log(_resources)
  },

  //decide how to display resource on screen depending on state of player
  showResource: function (index) {
    var el          = document.getElementById('resource-area'),
        resource    = _resources[index]

    // Load resource content, then display.
    $resources.isShowing = true
    _resource.loadArticle(resource, function () {
      $game.$audio.playTriggerFx('windowShow')
      $game.$audio.fadeLow()

      _resource.addContent(index, 1)
      $(el).fadeIn(300)
    })
  },

  // Called when player views a resource from inventory
  examineResource: function (index) {
    var el = document.getElementById('resource-area')

    // Close the inventory, then show resource and bind a function that returns to inventory on close
    $game.$input.closeInventory(function () {
      $resources.showResource(index)
      el.querySelector('.close-button, .close-overlay').addEventListener('click', function _onClose () {
        $game.$input.openInventory()
        // TODO: CHECK IF FOLLOWING LINE IS NECESSARY.
        // This is logic for controlling whether inventory state is remembered
        // when a player is examining items while solving the botanist's puzzle.
        $game.$player.inventoryShowing = ($game.$botanist.isSolving) ? false : true
        this.removeEventListener('click', _onClose)
      })
    })
  },

  // Hide the resource area
  hideResource: function (callback) {
    var el = document.getElementById('resource-area')

    $(el).fadeOut(300, function () {
      // Reset all resource slides and buttons to a hidden & clean state.
      _resource.resetSlides()
      _resource.resetButtons()

      // Clean up background globals
      _resource.temporaryAnswer = ''

      $resources.isShowing = false
      $game.$audio.fadeHi()

      // TODO: Move this elsewhere (include with logic of where checks should happen - not in the resource hiding function.)
      $game.$player.checkBotanistState();

      if (typeof callback === 'function') callback()
    })
  },

  // Activated when clicking on something that is specific to viewing answers
  examineResponses: function (index) {
    var overlay        = document.getElementById('resource-area'),
        el             = overlay.querySelector('.resource-responses'),
        resource       = _resources[index]

    _resource.addContent(index, 4)

    // Display rules
    el.style.display = 'block'
    _.each(overlay.querySelectorAll('.resource-content, .resource-article, .resource-question'), function (el) {
      el.style.display = 'none'
    })
    if ($(overlay).is(':hidden')) {
      $resources.isShowing = true
      $(overlay).fadeIn(300)
    }
  },

  // Display messages on checking user input
  showCheckMessage: function (message, callback) {
    var $check = $('#resource-area .check'),
        $el    = $check.find('.message-feedback')

    $check.find('.check-dialog').hide()
    $check.show()

    $el.find('.feedback').text(message)
    $el.find('button').on('click', function () {
      $resources.hideCheckMessage(callback)
    }).show()
    $el.fadeIn(200)
  },

  hideCheckMessage: function (callback) {
    var $el = $('#resource-area .check')
    if ($el.is(':visible')) {
      $el.fadeOut(200, callback)
    }
  },

  //get the shape svg info for a specific resource
  getShape: function(index) {
    var stringId = String(index),
      shapeName = _resources[stringId].shape;
    return _resource.shapes[$game.$player.currentLevel][shapeName];
  },

  getShapeName: function(index) {
    var stringId = String(index),
      shapeName = _resources[stringId].shape;
    return shapeName;
  },

  //get the tagline for the resource
  getTagline: function(index) {
    var stringId = String(index);
    return _resources[stringId].tagline;
  },

  //add an answer to the player answers for the specific resource
  addAnswer: function(data) {
    var stringId = String(data.npc);
    _resources[stringId].playerAnswers.push(data);
    //update the npc bubbles on screen
    $game.$player.displayNpcComments()
  },

  //moreve an answer (this means they made it private and it was previously public)
  removeAnswer: function(data) {
    var stringId = String(data.npc);
    var found = false,
      i = 0;
    // console.log(_resources[stringId].playerAnswers);
    while(!found) {
      if(_resources[stringId].playerAnswers[i].id === data.id) {
        _resources[stringId].playerAnswers.splice(i, 1);
        found = true;
      }
      i++;
      if(i >= _resources[stringId].playerAnswers.length) {
        found = true;
      }
    }

    $game.$player.displayNpcComments()
  },

  //get the question for a resource
  getQuestion: function(index) {
    var stringId = String(index);
    return _resources[stringId].question;
  },

  getNumResponses: function(index) {
    var stringId = String(index);
    return _resources[stringId].playerAnswers.length;
  }
};

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _resource = {

  temporaryAnswer: '',
  seedsToAdd:      0,

  resetSlides: function () {
    var overlay = document.getElementById('resource-area')
    // Note: this appears to perform faster than equivalent jQuery in tests: http://jsperf.com/jquery-vs-queryselectorall/40
    _.each(overlay.querySelectorAll('.resource-content, .resource-article, .resource-question, .resource-responses'), function (el) {
      el.style.display = 'none'
    })

    // Clearing article content is the safest and easiest way of preventing it from
    // affecting the rest of the game, e.g. stopping videos that are still playing
    overlay.querySelector('.resource-article').innerHTML = ''
  },

  resetButtons: function () {
    var buttons = document.getElementById('resource-area').querySelector('.buttons')

    // Reset event listeners by cloning and hide all buttons
    _.each(buttons.querySelectorAll('button'), function (button) {
      var clone = button.cloneNode(true)
      button = button.parentNode.replaceChild(clone, button)
      clone.style.display = 'none'
    })
  },

  // Preloads the resource article into the staging area
  loadArticle: function (resource, callback) {
    var url = CivicSeed.CLOUD_PATH + '/articles/' + resource.url + '.html'
    $('#resource-stage').empty().load(url, callback)
  },

  // Loads the tangram piece and adds it into DOM
  loadTangram: function (resource) {
    /* DEPRECATED:  The old version of this function loaded an image rather than the SVG.
    var overlay   = document.getElementById('resource-area'),
        level     = $game.$npc.getNpc(resource.index).getLevel(),
        folder    = 'level' + level,
        imagePath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + folder + '/' + resource.shape + '.png'

    overlay.querySelector('.tangram').innerHTML = '<img src="' + imagePath + '">'
    */

    // Loads the SVG version of the tangram.
    var artboard  = document.getElementById('resource-area').querySelector('.tangram'),
        artboardX = artboard.offsetWidth,
        artboardY = artboard.offsetHeight,
        shape     = $game.$resources.getShape(resource.index),
        // Copied from botanist.js/_svgFills
        fills = {
          orange: 'rgb(236,113,41)',
          lightOrange: 'rgb(237,173,135)',
          blue: 'rgb(14,152,212)',
          lightBlue: 'rgb(109,195,233)',
          green: 'rgb(76,212,206)',
          lightGreen: 'rgb(164,238,235)'
        },
        fill = fills[shape.fill]

    // Clear previous SVG if any
    artboard.innerHMTL = ''
    d3.select('svg').remove()

    var svg  = d3.select('#resource-area .tangram').append('svg').attr('class','tangram-svg'),
        path = svg.append('path')
                .attr('d', shape.path)
                .attr('fill', fill)
                .attr('stroke', 'rgb(255,255,255)')
                .attr('stroke-width', 0),
        pathCentroid = _getCentroid(path),
        displayX = (artboardX / 2) - pathCentroid[0],
        displayY = (artboardY / 2) - pathCentroid[1]

    // Set the tangram to display in the middle of the area
    path.attr('transform', 'translate(' + displayX + ',' + displayY +')')

    function _getCentroid (selection) {
      var bbox = selection.node().getBBox()
      return [bbox.x + bbox.width/2, bbox.y + bbox.height/2]
    }
  },

  // Preloads question information into the DOM
  loadQuestion: function (resource) {
    var overlay   = document.getElementById('resource-area'),
        el        = overlay.querySelector('.resource-question'),
        form      = el.querySelector('form'),
        type      = resource.questionType,
        formHTML  = ''

    // Fill in the question
    el.querySelector('.question').textContent = resource.question

    // Create the answer form
    switch (resource.questionType) {
      case 'multiple':
        for (var i =0; i < resource.possibleAnswers.length; i++) {
          formHTML += '<input name="resourceMultipleChoice" type ="radio" id="answer_' + i + '" value="' + resource.possibleAnswers[i] + '"><label for="answer_'+ i +'">' + resource.possibleAnswers[i] + '</label><br>';
        }
        break
      case 'open':
        formHTML = '<textarea class="open-response" placeholder="Type your answer here..." maxlength="5000" autofocus>' + _resource.temporaryAnswer + '</textarea></form><p class="privacy-message">Your answer will be private by default. You can later choose to make it public to earn special seeds.</p>';
        break
      case 'truefalse':
        formHTML = '<input name="resourceMultipleChoice" type="radio" id="true" value="true"><label for="true">true</label>' +
                   '<br><input name="resourceMultipleChoice" type="radio" id="false" value="false"><label for="false">false</label>';
        break
      case 'yesno':
        formHTML = '<input name="resourceMultipleChoice" type="radio" id="yes" value="yes"><label for="yes">yes</label>' +
                   '<br><input name="resourceMultipleChoice" type="radio" id="no" value="no"><label for="no">no</label>';
        break
      default:
        formHTML = 'Whoops! The game tried to set up a type of question that doesn’t exist!'
        break
    }
    form.innerHTML = formHTML
  },

  // Adds content for the screen if the Player answered the resource question correctly
  loadRewards: function (resource) {
    var el          = document.getElementById('resource-area').querySelector('.resource-content'),
        npc         = $game.$npc.getNpc(resource.index),
        npcLevel    = npc.level,
        playerLevel = $game.$player.currentLevel,
        feedback    = (resource.feedbackRight.length < 1) ? 'Thanks for sharing.' : resource.feedbackRight,
        dialogue    = ''

        if (npcLevel < playerLevel) {
          // When does this ever happen?
          dialogue = feedback + ' Here, take ' + _resource.seedsToAdd + ' seeds!'
        }
        else {
          // Load the tangram as an SVG path
          _resource.loadTangram(resource)

          dialogue = feedback + ' Here, take this puzzle piece, and ' + _resource.seedsToAdd + ' seeds!'
        }

        //give them the skinsuit regardless if in prev level or not
        if (resource.skinSuit) {
          dialogue += ' You unlocked the ' + $game.$skins.data.sets[resource.skinSuit].name + ' suit! Try it on or browse your other suits by clicking the changing room button below.'
        }

        $game.$audio.playTriggerFx('resourceRight')
        el.querySelector('.speaker').textContent = npc.name
        el.querySelector('.message').textContent = dialogue
  },

  // Load other players answers and your own
  loadResponses: function (resource) {
    var el             = document.getElementById('resource-area').querySelector('.resource-responses'),
        playerResource = $game.$player.getAnswer(resource.index),
        playerPublic   = false,
        playerHTML     = '',
        responsesHTML  = '',
        npc            = $game.$npc.getNpc(resource.index),
        dialogue       = ''

    // Process public responses (we do not have access to non-public responses here)
    for (var i = 0; i < resource.playerAnswers.length; i++) {
      var thisAnswer = resource.playerAnswers[i]
      if (thisAnswer.id === $game.$player.id) {
        // If yours is public, remember this for later
        playerPublic = true
      }
      else {
        // Create HTML snippet of all other players' public responses
        responsesHTML += '<li class="response"><p><span>' + thisAnswer.name + ': </span>' + thisAnswer.answer + '</p><div class="pledge-button"><button class="btn btn-success" data-npc="' + resource.index + '" data-player="'+ thisAnswer.id +'">Seed It!</button></div></li>';
      }
    }

    // Determine what NPC says for status
    if (responsesHTML !== '') {
      dialogue = 'Here are some recent answers by your peers.'
    }
    else {
      if (!playerPublic) {
        dialogue = 'There are no public answers. If you make your answer public, other players can give you more seeds!'
      }
      else {
        dialogue = 'Your answer is shown below, but other players have not made their answers public.'
      }
      responsesHTML = '<li class="response response-notice"><p>More answers from your peers will appear shortly.  Be sure to check back.</p></li>'
    }

    //add in the player's answer with the appropriate button
    // TODO: Make a better templating system for all of this
    playerHTML += '<li class="response your-response"><p><span>' + 'You said' + ': </span>' + playerResource.answers[playerResource.answers.length - 1] + '</p>'
    if (!playerPublic) {
      playerHTML += '<div class="public-button"><button class="btn btn-info" data-npc="'+ resource.index +'">Make Public</button> <i class="fa fa-lock fa-lg"></i></div>'
    }
    else {
      playerHTML += '<div class="private-button"><button class="btn btn-info" data-npc="'+ resource.index +'">Make Private</button> <i class="fa fa-unlock-alt fa-lg"></i></div>'
    }
    playerHTML += '</li>'

    el.querySelector('.question').innerHTML = 'Q: ' + resource.question
    el.querySelector('.content-box ul').innerHTML = playerHTML + responsesHTML
    el.querySelector('.speaker').textContent = npc.name
    el.querySelector('.message').textContent = dialogue
  },

  // Clear the display and decide what to show on screen
  addContent: function (index, section, slide) {
    var overlay     = document.getElementById('resource-area'),
        playerLevel = $game.$player.getLevel(),
        answer      = $game.$player.getAnswer(index),
        isAnswered  = (answer) ? true : false,
        isRevisit   = (answer && answer.result) ? true : false,
        resource    = _resources[index]

    var $article    = $('#resource-stage .pages > section'),
        slides      = $article.length

    // Reset all resource slides and buttons to a hidden & clean state.
    _resource.resetSlides()
    _resource.resetButtons()

    // Determine what content to add.
    switch (section) {
      // [SECTION 01] ARTICLE.
      case 1:
        if (!slide) slide = 0
        if (slide < 0 || slide === slides) this.addContent('next', 4)  // Exit out if bad slide

        // Load and show article content. Assuming already preloaded!
        var page = $article.get(slide).innerHTML
        $('.resource-article').html(page).show()

        // Logic for adding buttons
        // Always add a next button if there is more article to show
        if (slide < slides - 1) _addButton('next', 1, slide + 1)
        // On the last article slide, we must test for certain conditions
        else if (slide === slides - 1) {
          // If open-ended question and is answered, go straight to responses
          if (isRevisit && resource.questionType === 'open') _addButton('next', 4)
          // If question was answered correctly for any other question type, close resource window
          else if (isRevisit) _addButton ('close')
          // If question was not answered correctly, go to next slide (question screen)
          else _addButton('next', 2)
        }
        // Add a back button if it's not the first slide.
        if (slide > 0) _addButton('back', 1, slide - 1)

        break
      // [SECTION 02] QUESTION.
      // The next slide after the article is the Question screen, which displays if the
      // player has NOT answered this question correctly.
      case 2:
        // Load and show question.
        _resource.loadQuestion(resource)
        overlay.querySelector('.resource-question').style.display = 'block'

        // Add buttons
        _addButton('answer')
        _addButton('back', 1, slides - 1, function () {
          // If they were answering an open question, store their answer if the player goes back
          if (resource.questionType === 'open') {
            _resource.temporaryAnswer = overlay.querySelector('.open-response').value
          }
        })
        // After submitting an answer, if incorrect, the player is kicked back out to the game.
        // If correct, the player goes to section [3].
        // If answered, the player skips to section [4].
        break
      // [SECTION 03] REWARD.
      // Only shown immediately after section [2] if it is answered correctly.
      case 3:
        var input = overlay.querySelector('.tagline-input input')
        overlay.querySelector('.resource-content').style.display = 'block'

        // Load resource details and draw tangram - note that this needs to happen after
        // the visibility is set to 'block' because we calculate div width/height in this function.
        _resource.loadRewards(resource)

        // Reset and focus input
        input.value = ''
        input.focus()

        // Bind a check event listener to the standard close button on the upper right
        $('#resource-area a.close-overlay').on('click.onCloseCheck', function (e) {
          e.stopImmediatePropagation()
          if (_resource.validateTagline(resource) !== true) return
          $(this).off('click.onCloseCheck')
        })

        if (resource.questionType === 'open') {
          _addButton('save', 4)
        }
        else {
          _addButton('save')
        }
        break
      // [4] RESPONSES.
      // Shown immediately after slide [3] if the player gets it correct, -OR-
      // immediately after [1] if question was answered correctly and player is revisiting.
      case 4:
        _resource.loadResponses(resource)
        overlay.querySelector('.resource-responses').style.display = 'block'

        _addButton('close')
        // if (isRevisit === true) _addButton('back', 1, slides)
        // This is currently disabled because it is possible to view this directly without
        // preloading the article content, which would break in that instance.
        break
      // Generic error for debugging.
      default:
        $resources.hideResource(function callback() {
          $game.debug('Error Code 4992 dump!')
          console.log(index)
          console.log(resource)
          console.log(section)
          console.log(slide)
          $game.$npc.showSpeechBubble('Error Code 4992', ['The game failed to provide a slide to display, or tried to display a slide that doesn’t exist. See console for log details.'])
        })
        break
    }

    // Private add button function. Displays the button each slide asks for and binds actions to them.
    function _addButton (button, section, slide, callback) {
      var buttons = overlay.querySelector('.buttons'),
          back    = buttons.querySelector('.back-button'),
          next    = buttons.querySelector('.next-button'),
          answer  = buttons.querySelector('.answer-button'),
          save    = buttons.querySelector('.save-button'),
          close   = buttons.querySelector('.close-button')

      // Note on EventListeners. Removal is possible within the function itself (the easiest
      // way is to name the function so you can remove it) but there is no good way to remove
      // event listeners on *other* buttons, which is necessary because there is usually a
      // binary choice on these (e.g. previous and next buttons co-existing at the same time.)
      // As a result, event listeners are cleared on the resetButtons() function by programatically
      // cloning every button.
      switch (button) {
        case 'next':
          next.style.display = 'inline-block'
          next.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
            _resource.addContent(index, section, slide)
          })
          break
        case 'back':
          back.style.display = 'inline-block'
          back.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
            _resource.addContent(index, section, slide)
          })
          break
        case 'answer':
          answer.style.display = 'inline-block'
          answer.addEventListener('click', function () {
            if (typeof callback === 'function') callback()

            // This is kind of a dumb place to put it, but it's the best place for it to
            // work right now. If it's an open-ended question, check to make sure that the
            // response is sufficient. If not, exit prematurely and preserve the state of the form.
            // It doesn't seem possible to put these returns inside another callback function
            // because it only returns out of the callback, not the listener function.
            if (resource.questionType === 'open') {
              if (_resource.validateOpenResponse(resource) !== true) return
            }

            // Here is where the answer gets checked. If it's correct, save the answer and move
            // to the next slide. If not, we'll record that the answer was wrong, and quit.
            if (_resource.checkAnswer(resource) === true) {
              _resource.submitAnswer(resource, true)
              // Go to reward screen.
              _resource.addContent(index, 3)
            }
            else {
              _resource.submitAnswer(resource, false)
              // Quit
              _resource.showFeedbackWrong(resource)
            }
          })
          break
        case 'save':
          save.style.display = 'inline-block'
          save.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
            if (_resource.validateTagline(resource) !== true) return

            if (section) _resource.addContent(index, section)
            else $resources.hideResource()
          })
          break
        case 'close':
          close.style.display = 'inline-block'
          close.addEventListener('click', function _closeButton () {
            $resources.hideResource(callback)
          })
          break
        default:
          // Nothing.
          $game.debug('Warning: the game attempted to add a button a resource that does not exist.')
          break
      }
      return true
    }
  },

  validateTagline: function (resource) {
    var input   = document.getElementById('resource-area').querySelector('.tagline-input input'),
        tagline = input.value.trim()

    if (tagline.length === 0) {
      $resources.showCheckMessage('You should create a custom tagline!', _focusInput)
      return false
    }
    else {
      $game.$player.setTagline(resource, tagline)
      return true
    }

    function _focusInput () {
      input.focus()
    }
  },

  // Called by check answer to validate whether an open-ended response is sufficient
  validateOpenResponse: function (resource) {
    var response = this.getAnswer(resource)

    if (response.length === 0) {
      $resources.showCheckMessage('Please answer the question!', _focusInput)
      return false
    }
    else if (resource.requiredLength && response.length < resource.requiredLength) {
      _resource.popupCheck(resource, _focusInput)
      return false
    }
    else {
      return true
    }

    function _focusInput () {
      document.querySelector('.open-response').focus()
    }
  },

  // Trigger a popup if answer was too short
  popupCheck: function (resource, callback) {
    var $el = $('#resource-area .check')
    $el.find('.check-dialog').hide()
    $el.find('.confirm-skimpy').show()

    // Bind actions to buttons.
    // [1] Acknowledge prompt that your answer is skimpy and submit anyway
    $el.find('.sure-button').on('click', function () {
      $resources.hideCheckMessage()
      _resource.submitAnswer(resource, true)

      var slides = $('#resource-stage .pages > section').length
      _resource.addContent(resource.index, 3)
    }).show()
    // [2] Else, close and retry
    $el.find('.retry-button').on('click', function () {
      $resources.hideCheckMessage(callback)
    }).show()
    $el.fadeIn(200)
  },

  // Check whether the Player made the correct response
  checkAnswer: function (resource) {
    var response = this.getAnswer(resource)

    if (resource.questionType === 'open') return true // Open ended questions are never false
    else return (response === resource.answer) ? true : false
  },

  // Retrieve Player's answers from the question form
  getAnswer: function (resource) {
    if (resource.questionType === 'open') {
      return document.getElementById('resource-area').querySelector('.open-response').value.trim()
    }
    else {
      return $('input[name=resourceMultipleChoice]:checked').val()
    }
  },

  submitAnswer: function (resource, isCorrect) {
    var response   = this.getAnswer(resource),
        npcLevel   = $game.$npc.getNpc(resource.index).level,
        seedsToAdd = 0,
        data       = {
          index:        resource.index,
          answer:       response,
          npcLevel:     npcLevel,
          questionType: resource.questionType
        }

    // If correct, determine number of seeds to add, and push answer to DB
    if (isCorrect === true) {
      data.correct  = true
      data.skinSuit = resource.skinSuit

      seedsToAdd = $game.$player.answerResource(data)
      // If they took more than 1 try to get a binary, drop down more
      if (resource.questionType === 'truefalse' || resource.questionType === 'yesno') {
        if (seedsToAdd < 5 && seedsToAdd > 2) {
          seedsToAdd = 2
        }
      }

      $game.$player.saveAnswer(resource, data)
    }
    else if (isCorrect === false) {
      data.correct  = false

      seedsToAdd = $game.$player.answerResource(data)
      $game.$player.saveAnswer(resource, data)
    }
    else {
      $game.debug('Warning: an answer was submitted via _resources.submitAnswer() without indicating whether it is correct or incorrect.')
    }

    // Store seedsToAdd on this object. Not ideal? but it works for now
    _resource.seedsToAdd = seedsToAdd
  },

  // Called after submitAnswer(..., false) because the answer is wrong, and we're done
  showFeedbackWrong: function (resource) {
    var who     = $game.$npc.getNpc(resource.index).name,
        message = resource.feedbackWrong

    $resources.hideResource(function callback() {
      $game.$audio.playTriggerFx('resourceWrong')
      $game.$npc.showSpeechBubble(who, message)
    })
  },

  // Shape paths
  shapes: [{
    correct1: {
      path: 'm0,0l0,70l80,0l0,-70l-80,0z',
      fill: 'lightGreen'
    },
    wrong1: {
      path: 'm0,0l50,-50l50,50l-50,50l-50,-50z',
      fill: 'blue'
    },
    wrong2: {
      path: 'm0,0l0,-90l60,0l0,-50l-140,0l0,140l80,0z',
      fill: 'lightBlue'
    },
    correct2: {
      path: 'm0,0l-50,50l50,50l0,-100z',
      fill: 'orange'
    },
    wrong3: {
      path: 'm0,0c0,0 60,0 60,0c0,0 0,-50 0,-50c0,0 -60,0 -60,0c0,0 0,50 0,50z',
      fill: 'orange'
    },
    correct3: {
      path: 'm0,0l-100,0l0,50l60,0l0,20l80,0l0,-20l60,0l0,-50l-100,0z',
      fill: 'green'
    },
    wrong4: {
      path: 'm0,0l0,100l-50,-50l50,-50z',
      fill: 'lightOrange'
    },
    wrong5: {
      path: 'm0,0l0,-50l200,0l0,50l-200,0z',
      fill: 'green'
    },
    wrong6: {
      path: 'm0,0l80,0l0,90l-80,0l0,-90z',
      fill: 'lightGreen'
    },
    correct4: {
      path: 'm0,0l0,100l50,-50l-50,-50z',
      fill: 'lightOrange'
    }
  },{
    correct1: {
      path: 'm0,0l-60,0l0,120l-40,0l0,-160l140,0l0,160l-40,0l0,-120z',
      fill: 'green'
    },
    wrong1: {
      path: 'm0,0l0,-80l-170,0l-10,0l0,200l120,0l0,-120l60,0z',
      fill: 'orange'
    },
    wrong2: {
      path: 'm0,0c0,0 0,-200 0,-200c0,0 -120,0 -120,0c0,0 0,200 0,200c0,0 120,0 120,0z',
      fill: 'lightOrange'
    },
    wrong3: {
      path: 'm0,0l100,-40l100,0l100,40l-300,0z',
      fill: 'green'
    },
    wrong4: {
      path: 'm0,0l100,0l0,-40l-50,-40l-50,40l0,40z',
      fill: 'lightGreen'
    },
    wrong5: {
      path: 'm0,0l150,0l0,-120l-50,40l0,30l0,10l-100,40z',
      fill: 'blue'
    },
    wrong6: {
      path: 'm0,0c0,0 0,110 0,110c0,0 0,10 0,10c0,0 150,0 150,0c0,0 -100,-40 -100,-40c0,0 0,-40 0,-40c0,0 -50,-40 -50,-40z',
      fill: 'lightBlue'
    },
    correct2: {
      path: 'm0,0l300,0l-100,-40l-100,0l-100,40z',
      fill: 'lightOrange'
    },
    correct3: {
      path: 'm0,0c0,0 0,-200 0,-200c0,0 150,0 150,0c0,0 0,40 0,40c0,0 -70,0 -70,0c0,0 0,160 0,160c0,0 -80,0 -80,0z',
      fill: 'lightGreen'
    },
    wrong7: {
      path: 'm0,0l0,-200l150,0l0,40l-70,0l0,160l-80,0z',
      fill: 'orange'
    },
    correct4: {
      path: 'm0,0l0,-200l-150,0l0,40l70,0l0,160l80,0z',
      fill: 'blue'
    },
    wrong8: {
      path: 'm0,0l0,-200l-150,0l0,40l70,0l0,160l80,0z',
      fill: 'lightOrange'
    },
    correct5: {
      path: 'm0,0l100,0c0,0 0,-40 0,-40c0,0 -50,-40 -50,-40c0,0 -50,40 -50,40c0,0 0,40 0,40z',
      fill: 'orange'
    },
    wrong9: {
      path: 'm0,0l0,-160l-140,0l0,160l40,0l0,-120l60,0l0,120l40,0z',
      fill: 'blue'
    }
  }, {
    correct1: {
      path: 'm0,0c0,0 0,-30 0,-30c0,0 70,0 70,0c0,0 0,30 0,30c0,0 -20,0 -20,0c0,0 0,-10 0,-10c0,0 -30,0 -30,0c0,0 0,10 0,10c0,0 -20,0 -20,0z',
      fill: 'orange'
    },
    correct2: {
      path: 'm0,0l-20,20l-20,40l0,110l100,0l0,-70l-60,0l0,-100z',
      fill: 'lightOrange'
    },
    correct3: {
      path: 'm0,0l0,-60l300,0l10,20l0,40l-310,0z',
      fill: 'green'
    },
    correct4: {
      path: 'm0,0l0,70c0,0 100,0 100,0c0,0 0,-70 0,-70c0,0 -100,0 -100,0z',
      fill: 'lightGreen'
    },
    correct5: {
      path: 'm0,0l0,-70l150,0l0,70l-150,0z',
      fill: 'lightBlue'
    },
    wrong1: {
      path: 'm0,0l20,0l0,-10l30,0l0,10l20,0l0,-30l-70,0l0,30z',
      fill: 'blue'
    },
    wrong2: {
      path: 'm0,0l0,60l260,0l-20,-40l-20,-20l-220,0z',
      fill: 'lightOrange'
    },
    correct6: {
      path: 'm0,0l0,40l300,0l-10,-20l-20,-20l-270,0z',
      fill: 'blue'
    },
    wrong3: {
      path: 'm0,0l90,0l0,-60l-50,0l-20,20l-20,40z',
      fill: 'green'
    }
  }, {
    correct1: {
      path: 'm0,0l-120,0l0,40l240,0c0,0 0,-40 0,-40c0,0 -120,0 -120,0z',
      fill: 'orange'
    },
    wrong1: {
      path: 'm0,0l0,-40l240,0l0,40l-240,0z',
      fill: 'blue'
    },
    wrong2: {
      path: 'm0,0l80,0l0,-90l-100,0l20,90z',
      fill: 'lightOrange'
    },
    correct2: {
      path: 'm0,0l-60,0l-40,-180l100,0l-60,60l40,0l20,50l0,70z',
      fill: 'lightGreen'
    },
    wrong3: {
      path: 'm0,0l-100,0l0,90l80,0l20,-90z',
      fill: 'green'
    },
    wrong4: {
      path: 'm0,0l-20,-90l160,0l-20,90l-120,0z',
      fill: 'lightGreen'
    },
    correct3: {
      path: 'm0,0l100,0l-40,180l-60,0l0,-70l20,-50l40,0l-60,-60z',
      fill: 'blue'
    },
    correct4: {
      path: 'm0,0l60,60l-40,0l-20,-20l-20,20l-40,0l60,-60z',
      fill: 'lightOrange'
    },
    wrong5: {
      path: 'm0,0l120,0l0,220l-60,0l-40,-180l-20,0l0,-40z',
      fill: 'orange'
    },
    correct5: {
      path: 'm0,0l20,20l-20,50l-20,-50l20,-20z',
      fill: 'green'
    }
  }]

}




