'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    resources.js

    - In-game resources that NPCs give to the player

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var _ = require('underscore')

// TODO: Resource object.
function Resource (data, skinSuit) {
  // Copy contents of resource data to this object
  for (var i in data) {
    this[i] = data[i]
  }

  this.playerAnswers = []

  // TODO: See where this is being used. Should the skinsuit
  // be a property of the NPC, the resource, or either?
  if (skinSuit) {
    this.skinSuit = skinSuit
  }
}

Resource.prototype.getNumResponses = function () {
  return this.playerAnswers.length
}

Resource.prototype.addPlayerResponse = function (data) {
  return this.playerAnswers.push(data)
}

// Remove a public player response from the resource's list of player responses
Resource.prototype.removePlayerResponse = function (data) {
  this.playerAnswers = _.reject(this.playerAnswers, function (answer) {
    return answer.playerId === data.playerId
  })
}

// Tangram pieces as object prototypes.
var _tangrams = []

function Tangram (data) {
  this.id    = data.id    // Numerical unique id for each tangram piece
  this.name  = data.name  // "correctX" or "wrongX" - not a unique identifier. Used by resource to identify which piece to use, currently.
  this.level = data.level // Pieces are associated with a level. Each level has a group of tangrams that go into a puzzle.
  this.path  = data.path  // SVG shape path
  this.fill  = data.fill  // Fill color, a string. Use method .getCSSColor to get a CSS/Canvas-compatible color string.
}

Tangram.prototype.getCSSColor = function () {
  var fills = {
    orange:      'rgb(236,113,41)',
    lightOrange: 'rgb(237,173,135)',
    blue:        'rgb(14,152,212)',
    lightBlue:   'rgb(109,195,233)',
    green:       'rgb(76,212,206)',
    lightGreen:  'rgb(164,238,235)'
  }
  return fills[this.fill] || 'rgb(0,0,0)' // Fallback to black
}


var $resources = $game.$resources = {

  ready:     false,

  //load in all the resources and the corresponding answers
  init: function (callback) {
    // Get all resources
    var response = $game.$npc.getNpcData()
    $.each(response, function (key, npc) {
      if (npc.isHolding) {
        _resources.data[npc.resource.id] = new Resource(npc.resource, npc.skinSuit)
      }
    })

    // Create all tangram pieces - construct an array of all tangram pieces as object prototypes.
    for (var i = 0, j = TANGRAMS.length; i < j; i++) {
      _tangrams.push(new Tangram(TANGRAMS[i]))
    }

    // Create array of ALL player responses
    ss.rpc('game.npc.getResponses', $game.$player.instanceName, function (response) {
      var allPlayerResponses = response[0].resourceResponses

      $.each(allPlayerResponses, function (key, answer) {
        if (answer.madePublic === true) {
          $resources.get(answer.resourceId).addPlayerResponse(answer)
        }
      })

      $resources.ready = true
      callback()
    })
  },

  resetInit: function () {
    $resources.ready = false
  },

  get: function (id) {
    return _resources.data[id]
  },

  debug: function () { // TODO: REMOVE
    console.log(_resources.data)
  },

  // Decide how to display resource on screen depending on state of player
  showResource: function (id) {
    var el       = document.getElementById('resource-area'),
        resource = _resources.data[id]

    // Load resource content, then display.
    $game.flags.set('visible-resource-overlay')
    _resources.loadArticle(resource, function () {
      $game.$audio.playTriggerFx('windowShow')
      $game.$audio.fadeLow()

      _resources.addContent(id, 1)
      $(el).fadeIn(300)
    })
  },

  // Called when player views a resource from inventory
  examineResource: function (id) {
    // HIDES (not closes) the inventory, then show resource
    // Set a flag that remembers we were in the inventory
    $game.flags.set('viewing-inventory')
    $game.inventory.hide(function () {
      $resources.showResource(id)
    })
  },

  // Hide the resource area
  hideResource: function (callback) {
    var el = document.getElementById('resource-area')

    $(el).fadeOut(300, function () {
      // Reset all resource slides and buttons to a hidden & clean state.
      _resources.resetSlides()

      // Clean up background globals & game state flags
      _resources.temporaryAnswer = ''
      $game.flags.unset('visible-resource-overlay')

      // Clear resource stage
      _resources.unloadArticle()

      // Restore sound level
      $game.$audio.fadeHi()

      // If inventory was showing previously, re-open the inventory
      if ($game.flags.check('viewing-inventory') === true) $game.inventory.show()

      if (typeof callback === 'function') callback()
    })
  },

  // Activated when clicking on something that is specific to viewing answers
  examineResponses: function (id) {
    var overlay  = document.getElementById('resource-area'),
        el       = overlay.querySelector('.resource-responses'),
        resource = _resources.data[id]

    _resources.addContent(id, 4)

    // Display rules
    _resources.hideContent()
    el.style.display = 'block'
    if ($(overlay).is(':hidden')) {
      $game.flags.set('visible-resource-overlay')
      $(overlay).fadeIn(300)
    }
  },

  // Display messages on checking user input
  showCheckMessage: function (message, callback) {
    var $check      = $('#resource-area .check'),
        $el         = $check.find('.message-feedback'),
        $confirmBtn = $el.find('.btn-primary')

    $check.find('.check-dialog').hide()
    $check.show()

    $el.find('.feedback').text(message)
    $confirmBtn.on('click', function () {
      $resources.hideCheckMessage(callback)
    }).show()
    $el.fadeIn(200)
    $confirmBtn.focus()
  },

  hideCheckMessage: function (callback) {
    var $el = $('#resource-area .check')
    if ($el.is(':visible')) {
      $el.fadeOut(200, callback)
    }
  },

  // Get the Tangram for a given resource id
  getTangram: function (id) {
    var resource = $resources.get(id)
    return _.findWhere(_tangrams, { level: $game.$player.currentLevel, name: resource.shape })
  },

  getTangrams: function () {
    return _tangrams
  }

}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _resources = {

  data: [],

  temporaryAnswer: '',

  resetSlides: function () {
    var overlay = document.getElementById('resource-area'),
        article = overlay.querySelector('.resource-article')

    this.hideContent()

    // Clear article content to prevent it from affecting the rest of the game, e.g. stopping videos that are still playing
    // This is equivalent to, but faster than & less prone to memory leaks than innerHTML = ''
    while (article.firstChild) article.removeChild(article.firstChild)

    // When slides are reset, always reset all buttons
    this.resetButtons()
  },

  hideContent: function () {
    var overlay = document.getElementById('resource-area'),
        listOfContentElementSelectors = [
          '.resource-content',
          '.resource-article',
          '.resource-question',
          '.resource-responses',
          '.resource-custom-content'
        ]

    for (var i in listOfContentElementSelectors) {
      var el = overlay.querySelector(listOfContentElementSelectors[i])
      el.style.display = 'none'
    }

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
    // Continue if there is no resource article.
    if (!resource.url) {
      callback()
      return
    }

    // Otherwise, go get that resource article and pre-load it!
    ss.rpc('game.resource.get', resource.url, function (html) {
      $('#resource-stage').empty().html(html)
      callback()
    })
  },

  // Clears staging area
  unloadArticle: function () {
    var el = document.getElementById('resource-stage')
    // This is equivalent to, but faster than & less prone to memory leaks than innerHTML = ''
    while (el.firstChild) el.removeChild(el.firstChild)
  },

  unloadTangram: function () {
    var artboard  = document.getElementById('resource-area').querySelector('.tangram')

    artboard.innerHMTL = ''
    d3.select('#resource-area .tangram svg').remove()
  },

  // Loads the tangram piece and adds it into DOM
  loadTangram: function (resource) {
    // Loads the SVG version of the tangram.
    var artboard  = document.getElementById('resource-area').querySelector('.tangram'),
        artboardX = artboard.offsetWidth,
        artboardY = artboard.offsetHeight,
        shape     = $resources.getTangram(resource.id),
        fill      = shape.getCSSColor()

    // Clear previous SVG if any
    this.unloadTangram()

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
          formHTML += '<input name="resourceMultipleChoice" type ="radio" id="answer_' + i + '" value="' + resource.possibleAnswers[i] + '"><label for="answer_'+ i +'">' + resource.possibleAnswers[i] + '</label><br>'
        }
        break
      case 'open':
        formHTML = '<textarea class="open-response" placeholder="Type your answer here..." maxlength="5000" autofocus>' + _resources.temporaryAnswer + '</textarea></form><p class="privacy-message">Your answer will be private by default. You can later choose to make it public to earn special seeds.</p>'
        break
      case 'truefalse':
        formHTML = '<input name="resourceMultipleChoice" type="radio" id="true" value="true"><label for="true">true</label>' +
                   '<br><input name="resourceMultipleChoice" type="radio" id="false" value="false"><label for="false">false</label>'
        break
      case 'yesno':
        formHTML = '<input name="resourceMultipleChoice" type="radio" id="yes" value="yes"><label for="yes">yes</label>' +
                   '<br><input name="resourceMultipleChoice" type="radio" id="no" value="no"><label for="no">no</label>'
        break
      case 'resume':
        formHTML = this.makeResumeFormHTML(resource)
        break
      default:
        formHTML = 'Whoops! The game tried to set up a type of question that doesn’t exist!'
        break
    }
    form.innerHTML = formHTML

    // Autofocus on input box, if any
    if (resource.questionType === 'resume') {
      // Add scrollable to form
      form.classList.add('scrollable', 'resume-form')

      // Wait for DOM render
      setTimeout(function () {
        // Find focus
        $('.resume-text-input').filter(':first').focus()

        // Bind event to form submit action
        $('.resume-form').submit(function (e) {
          // Prevent actual submittal
          e.preventDefault()
          // Find the answer button and trigger click action on it
          $('#resource-area .buttons .answer-button').click()
        })
      }, 0)
    }
  },

  makeResumeFormHTML: function (resource) {
    var html = ''

    // Notes on questions and desired functionality from Sam's Google Doc
    switch (resource.answer) {
      // Purpose
      // "What is your passion, and how do you want to work toward it?"
      case 'purpose':
        // One short text box
        html = '<input class="resume-text-input" name="resume-purpose" type="text" value="" placeholder="" maxlength=255>'
        break
      // Education
      // What is your field of study at college?
      case 'education':
        // One short text box
        html = '<input class="resume-text-input" name="resume-education" type="text" value="" placeholder="" maxlength=140>'
        break
      // Experience
      // What is your previous experience with civic engagement?
      // List each organization you've worked with in the past, and
      // (briefly) what you did there.
      case 'experience':
        // Three text boxes (potentially with the ability to add another?)
        html = '<input class="resume-text-input" name="resume-experience" type="text" value="" placeholder="" maxlength=50>\
                <textarea class="resume-textarea" name="resume-experience-content"></textarea>\
                <input class="resume-text-input" name="resume-experience" type="text" value="" placeholder="" maxlength=50>\
                <textarea class="resume-textarea" name="resume-experience-content"></textarea>\
                <input class="resume-text-input" name="resume-experience" type="text" value="" placeholder="" maxlength=50>\
                <textarea class="resume-textarea" name="resume-experience-content"></textarea>'
        break
      // Skills
      // What skills would you bring to a civic engagement opportunity? Check all that apply!
      case 'skills':
        // Checkboxes
        // Hard code all of this for now...
        var skills = [
          'Social Media Content Development',
          'Social Media Back-end Management',
          'Salesforce / Raiser’s Edge / Constant Contact / CRM',
          'SPSS / STATA',
          'Microsoft Office Suite',
          'Access / Database Development and Reporting',
          'Data Cleaning  / Data Management',
          'Graphic Design -  Marketing / Promotion',
          'Graphic Design – Infographics / Data Visualization',
          'Multimedia Production',
          'Quantitative Modelling / Statistical Analysis / Excel',
          'Administration and Organizational',
          'Project Design',
          'Group Facilitation',
          'Manage Teams',
          'Working across Difference',
          'Child Development',
          'Early Literacy',
          'Languages (specify _______________)',
          'ESL Instruction',
          'Nutrition / Food Preparation / Food Security Support',
          'Qualitative Data Collection – Interview / Focus Groups',
          'Qualitative Analysis – Coding / NVivo',
          'Event Planning / Logistics / Event Support',
          'Public Speaking',
          'Writing – Marketing / Promotion',
          'Writing – Reports / Expository',
          'Copyediting / Proofreading',
          'Fundraising',
          'Environmental Stewardship / Environmental Program Operations',
          'Recycling Program Operations',
          'Public Health',
          'Performing Arts',
          'Community Outreach / Recruitment',
          'Working with Underserved Populations',
          'Client Support (specify ______________)',
          'CPR',
          'Human Subjects / CITI',
          'Familiar with Public Transport',
          'Other Skill (specify __________________)'
        ]

        for (var i = 0, j = skills.length; i < j; i++) {
          html += '<br><input name="resume-skills" type="checkbox" value="' + skills[i] + '"><label for="' + skills[i] + '">' + skills[i] + '</label>'
        }

        break
      // Tagline
      // In just a few words, describe yourself (in a civic engagement context). Example: "Skilled artist, big heart"
      case 'tagline':
        // One short text box with a tight character limit
        html = '<input class="resume-text-input" name="resume-tagline" type="text" value="" placeholder="" maxlength=50>'
        break
      // Catch all for typos etc
      default:
        html = '<strong class="color-red">Error:</strong> The game attempted to ask a resume question type that does not exist. Resume type provided: ' + resource.answer
        break
    }
    return html
  },

  // Adds content for the screen if the Player answered the resource question correctly
  loadRewards: function (resource) {
    var el            = document.getElementById('resource-area').querySelector('.resource-content'),
        input         = el.querySelector('.tagline-input input'),
        npc           = $game.$npc.findNpcByResourceId(resource.id),
        playerLevel   = $game.$player.currentLevel,
        feedback      = (resource.feedbackRight.length < 1) ? 'Thanks for sharing.' : resource.feedbackRight,
        dialogue      = '',
        skin          = $game.$skins.getSkin(resource.skinSuit),
        seedsRewarded = $game.$player.getResource(resource.id).seedsRewarded

    // Legacy stuff saved here, never used.
    //_rightOpenRandom = ['Very interesting. I\'ve never looked at it like that before.', 'That says a lot about you!', 'Thanks for sharing. Now get out there and spread some color!'],

    if (npc.level < playerLevel || resource.questionType === 'resume') {
      // This can happen because not all tangram pieces need to be obtained to
      // solve the botanist's puzzle. The player only needs the "correct" ones.
      // As a result, if a player goes back to talk to an NPC they haven't talked
      // to, they can still complete it, but will no longer obtain the tangram piece
      // since it is no longer necessary.
      // ALSO: No tangram piece is obtained if player is answering a resume question.
      // The player will still obtain seeds and skin rewards.
      dialogue = feedback + ' Here, take ' + seedsRewarded + ' seeds!'

      // Hide all the tangram related stuff
      _resources.unloadTangram()
      el.querySelector('.tagline-input').style.display = 'none'
    } else {
      // Load the tangram as an SVG path
      _resources.loadTangram(resource)

      // Reset and focus tagline input
      el.querySelector('.tagline-input').style.display = 'block'
      input.value = ''
      input.focus()

      // Bind an event to the submit action of the tagline input form
      $('.tagline-input').submit(function (e) {
        e.preventDefault()
        $('#resource-area .save-button').trigger('click')
      })

      // Bind a check event listener to the standard close button on the upper right
      $('#resource-area .close-overlay').on('click.onCloseCheck', function (e) {
        e.stopImmediatePropagation()
        e.preventDefault()
        // Basically, do the same thing as the save button in this case.
        $('#resource-area .save-button').trigger('click')
      })

      dialogue = feedback + ' Here, take this puzzle piece, and ' + seedsRewarded + ' seeds!'
    }

    //give them the skinsuit regardless if in prev level or not
    if (skin) {
      dialogue += ' You unlocked the ' + skin.name + ' suit! Try it on or browse your other suits by clicking the changing room button below.'
    }

    $game.$audio.playTriggerFx('resourceRight')
    el.querySelector('.speaker').textContent = npc.name
    el.querySelector('.message').textContent = dialogue
  },

  // A variation on loadRewards() to display 'Master NPC' content
  loadMasterNPCContent: function (resource) {
    var el            = document.getElementById('resource-area').querySelector('.resource-custom-content'),
        npc           = $game.$npc.findNpcByResourceId(resource.id)

    _resources.hideContent()
    el.style.display = 'block'

    // Bind a check event listener to the standard close button on the upper right
    $('#resource-area .close-overlay').on('click.onCloseCheck', function (e) {
      e.stopImmediatePropagation()
      e.preventDefault()
      $('#resource-area .close-button').trigger('click')
    })

    el.querySelector('.speaker').textContent = npc.name
  },

  // Load other players answers and your own
  loadResponses: function (resource) {
    var el             = document.getElementById('resource-area').querySelector('.resource-responses'),
        playerResource = $game.$player.getAnswer(resource.id),
        playerPublic   = false,
        playerHTML     = '',
        responsesHTML  = '',
        npc            = $game.$npc.findNpcByResourceId(resource.id),
        dialogue       = ''

    // Process public responses (we do not have access to non-public responses here)
    for (var i = 0; i < resource.playerAnswers.length; i++) {
      var thisAnswer = resource.playerAnswers[i]

      if (thisAnswer.playerId === $game.$player.id) {
        // If yours is public, remember this for later
        playerPublic = true
      } else {
        // Create HTML snippet of all other players' public responses
        responsesHTML += '<li class="response"><p><span>' + thisAnswer.name + ': </span>' + thisAnswer.answer + '</p><div class="pledge-button"><button class="btn btn-success" data-resource="' + resource.id + '" data-player="'+ thisAnswer.playerId +'">Seed It!</button></div></li>';
      }
    }

    // Determine what NPC says for status
    if (responsesHTML !== '') {
      dialogue = 'Here are some recent answers by your peers.'
    } else {
      if (!playerPublic) {
        dialogue = 'There are no public answers. If you make your answer public, other players can give you more seeds!'
      } else {
        dialogue = 'Your answer is shown below, but other players have not made their answers public.'
      }
      responsesHTML = '<li class="response response-notice"><p>More answers from your peers will appear shortly.  Be sure to check back.</p></li>'
    }

    //add in the player's answer with the appropriate button
    // TODO: Make a better templating system for all of this
    playerHTML += '<li class="response your-response"><p><span>' + 'You said' + ': </span>' + playerResource.answers[playerResource.answers.length - 1] + '</p>'
    if (!playerPublic) {
      playerHTML += '<div class="public-button"><button class="btn btn-info" data-resource="'+ resource.id +'">Make Public</button> <i class="fa fa-lock fa-lg"></i></div>'
    } else {
      playerHTML += '<div class="private-button"><button class="btn btn-info" data-resource="'+ resource.id +'">Make Private</button> <i class="fa fa-unlock-alt fa-lg"></i></div>'
    }
    playerHTML += '</li>'

    el.querySelector('.question').innerHTML = 'Q: ' + resource.question
    el.querySelector('.content-box ul').innerHTML = playerHTML + responsesHTML
    el.querySelector('.speaker').textContent = npc.name
    el.querySelector('.message').textContent = dialogue

    // Bind a check event listener to the standard close button on the upper right
    $('#resource-area .close-overlay').on('click.onCloseResource', function (e) {
      e.stopImmediatePropagation()
      e.preventDefault()
      // Basically, do the same thing as the close button in this case.
      $('#resource-area .close-button').trigger('click')
    })
  },

  // Clear the display and decide what to show on screen
  addContent: function (resourceId, section, slide) {
    var overlay      = document.getElementById('resource-area'),
        playerLevel  = $game.$player.getLevel(),
        answer       = $game.$player.getAnswer(resourceId),
        isAnswered   = (answer && answer.result) ? true : false,
        isRevisit    = $game.flags.check('viewing-inventory'),
        resource     = _resources.data[resourceId]

    var $article     = $('#resource-stage > section'),
        slides       = $article.length

    // Reset all resource slides and buttons to a hidden & clean state.
    _resources.resetSlides()

    // Skip section 1 if the NPC's resource does not have URL field
    // It means there is no article content to display, so go straight to question
    // Resume question types are like this, so are some open-ended questions.
    if (section === 1 && resource.url === '') {
      section = 2
    }

    // HACK FOR SECTION 4000 (Master NPC resource)
    // TODO: Need logic to handle state
    if (resource.id === 4000) {
      section = 4000
    }

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
          // If this resource is being reviewed later:
          if (isRevisit || isAnswered) {
            // If open-ended question, go to responses next
            if (resource.questionType === 'open') _addButton('next', 4)
            // If question was answered correctly for any other question type, close resource window
            else _addButton('close', null, null, _checkBotanistCallback)
          }
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
        _resources.loadQuestion(resource)
        overlay.querySelector('.resource-question').style.display = 'block'

        // Add buttons
        _addButton('answer')

        // No back button for resume type questions
        if (resource.questionType !== 'resume') {
          _addButton('back', 1, slides - 1, function () {
            // If they were answering an open question, store their answer if the player goes back
            if (resource.questionType === 'open') {
              _resources.temporaryAnswer = overlay.querySelector('.open-response').value
            }
          })
        }
        // After submitting an answer, if incorrect, the player is kicked back out to the game.
        // If correct, the player goes to section [3].
        // If answered, the player skips to section [4].
        break
      // [SECTION 03] REWARD.
      // Only shown immediately after section [2] if it is answered correctly.
      case 3:
        overlay.querySelector('.resource-content').style.display = 'block'

        // Load resource details and draw tangram - note that this needs to happen after
        // the visibility is set to 'block' because we calculate div width/height in this function.
        _resources.loadRewards(resource)

        if (resource.questionType === 'open') {
          _addButton('save', 4)
        } else if (resource.questionType === 'resume') {
          _addButton('close')
        } else {
          _addButton('save', null, null, _checkBotanistCallback)
        }
        break
      // [4] RESPONSES.
      // Shown immediately after slide [3] if the player gets it correct, -OR-
      // immediately after [1] if question was answered correctly and player is revisiting.
      case 4:
        _resources.loadResponses(resource)
        overlay.querySelector('.resource-responses').style.display = 'block'

        _addButton('close', null, null, _checkBotanistCallback)
        // If an article was preloaded onto the stage, display the 'back' button.
        if (document.getElementById('resource-stage').innerHTML !== '') _addButton('back', 1, slides - 1)
        break
      // [4000] MASTER NPC.
      // Kind of a hack, but this is a screen to show for the Master NPC's
      // introductory thing. It is only activated through activating Master NPC
      // for the first time, and will display until a player receives one of the
      // community NPCs' resources.
      // Behind the scenes, upon reading this message, the player obtains a
      // placeholder resource from the Master NPC that "unlocks" the community NPCs.
      // It will be refreshed later with the Q&A content.
      case 4000:
        _resources.loadMasterNPCContent(resource)
        _addButton('close')

        // Momentarily save dummy data for viewing this thing
        var data = {
              id:           resource.id,
              answer:       '',
              attempts:     0,
              npcLevel:     null,
              questionType: null,
              skinSuit:     null,
              correct:      false,
              tagline:      ''
            }
        $game.$player.saveResourceLocally(data)
        break
      // Generic error for debugging.
      default:
        $resources.hideResource(function callback () {
          $game.debug('Error Code 4992 dump!')
          console.log(resourceId, resource, section, slide)
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
            _resources.addContent(resourceId, section, slide)
          })
          break
        case 'back':
          back.style.display = 'inline-block'
          back.addEventListener('click', function () {
            if (typeof callback === 'function') callback()
            _resources.addContent(resourceId, section, slide)
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
              if (_resources.validateOpenResponse(resource) !== true) return
            }

            // Here is where the answer gets checked. If it's correct, save the answer and move
            // to the next slide. If not, we'll record that the answer was wrong, and quit.
            if (_resources.checkAnswer(resource) === true) {
              _resources.submitAnswer(resource, true)
              // Go to reward screen.
              _resources.addContent(resourceId, 3)
            } else {
              _resources.submitAnswer(resource, false)
              // Quit
              _resources.showFeedbackWrong(resource)
            }
          })
          break
        case 'save':
          save.style.display = 'inline-block'
          save.addEventListener('click', function _saveButton () {

            // For all question types except resume,
            // check the tagline
            if (resource.questionType !== 'resume') {
              var input   = _resources.readTaglineInput(),
                  tagline = _resources.sanitizeTagline(input)

              // If the tagline is not validated, exit
              if (_resources.validateTagline(tagline) !== true) {
                return false
              } else {
                // Else, set tagline and save the resource
                $game.$player.setTagline(resource, tagline)
              }
            }

            // Proceed to next screen or close resource window
            // depending on the situation
            if (section) {
              _resources.addContent(resourceId, section)
            } else {
              $resources.hideResource(callback)
            }

            // Cleanup: remove tagline check event
            $('#resource-area .close-overlay').off('click.onCloseCheck')
          })
          break
        case 'close':
          close.style.display = 'inline-block'
          close.addEventListener('click', function _closeButton () {

            // If correct, then unlock suit, add seeds, add
            // tangram to inventory, and save answer to DB
            if (!isRevisit) {
              $game.$player.saveResource(resource)
            }

            // Cleanup: remove close button event listener
            $('#resource-area .close-overlay').off('click.onCloseResource')

            $resources.hideResource(callback)
          })
          break
        default:
          // Nothing.
          $game.debug('Warning: the game attempted to add a button that does not exist.')
          break
      }
      return true
    }

    function _checkBotanistCallback () {
      // A callback function. If a resource was just collected, check to see if player shoud be automatically teleported to the botanist.
      if (!isRevisit) {
        $game.$botanist.checkState()
      }
    }
  },

  readTaglineInput: function () {
    return document.getElementById('resource-area').querySelector('.tagline-input input').value
  },

  sanitizeTagline: function (tagline) {
    return tagline.trim()
  },

  validateTagline: function (tagline) {
    // This is a callback function to focus on the input box after closing the message
    var _focusInput = function () {
      document.getElementById('resource-area').querySelector('.tagline-input input').focus()
    }

    if (tagline.length === 0) {
      $resources.showCheckMessage('You should summarize what you learned. You’ll need this later!', _focusInput)
      return false
    } else {
      return true
    }
  },

  // Called by check answer to validate whether an open-ended response is sufficient
  validateOpenResponse: function (resource) {
    var response    = this.getAnswer(resource),
        _focusInput = function () {
          document.querySelector('.open-response').focus()
        }

    if (response.length === 0) {
      $resources.showCheckMessage('Please answer the question!', _focusInput)
      return false
    } else if (resource.requiredLength && response.length < resource.requiredLength) {
      _resources.popupCheck(resource, _focusInput)
      return false
    } else {
      return true
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
      _resources.submitAnswer(resource, true)

      var slides = $('#resource-stage > section').length
      _resources.addContent(resource.id, 3)
    }).show()
    // [2] Else, close and retry
    $el.find('.retry-button').on('click', function () {
      $resources.hideCheckMessage(callback)
    }).show()
    $el.fadeIn(200)
    $el.find('.retry-button').focus()
  },

  // Check whether the Player made the correct response
  checkAnswer: function (resource) {
    var response = this.getAnswer(resource)

    if (resource.questionType === 'open' || resource.questionType === 'resume') {
      // Open-ended and resume questions are never false
      return true
    } else {
      // Compare given answer with the resource's correct answer
      return (response === resource.answer) ? true : false
    }
  },

  // Retrieve Player's answers from the question form
  getAnswer: function (resource) {
    if (resource.questionType === 'open') {
      return document.getElementById('resource-area').querySelector('.open-response').value.trim()
    } else {
      return $('input[name=resourceMultipleChoice]:checked').val()
    }
  },

  submitAnswer: function (resource, isCorrect) {
    var response = this.getAnswer(resource),
        npc      = $game.$npc.findNpcByResourceId(resource.id),
        data     = {
          id:           resource.id,
          answer:       response,
          npcLevel:     npc.level,
          questionType: resource.questionType,
          skinSuit:     resource.skinSuit,
          correct:      (isCorrect === true) ? true : false
        }

    $game.$player.saveResourceLocally(data)
  },

  // Called after submitAnswer(..., false) because the answer is wrong, and we're done
  showFeedbackWrong: function (resource) {
    var npc     = $game.$npc.findNpcByResourceId(resource.id),
        message = resource.feedbackWrong

    $resources.hideResource(function callback() {
      $game.$audio.playTriggerFx('resourceWrong')
      $game.$npc.showSpeechBubble(npc.name, message)
    })
  }

}


var TANGRAMS = [
  {
    "id": 0,
    "name": "correct1",
    "level": 0,
    "path": "m0,0l0,70l80,0l0,-70l-80,0z",
    "fill": "lightGreen"
  },
  {
    "id": 1,
    "name": "wrong1",
    "level": 0,
    "path": "m0,0l50,-50l50,50l-50,50l-50,-50z",
    "fill": "blue"
  },
  {
    "id": 2,
    "name": "wrong2",
    "level": 0,
    "path": "m0,0l0,-90l60,0l0,-50l-140,0l0,140l80,0z",
    "fill": "lightBlue"
  },
  {
    "id": 3,
    "name": "correct2",
    "level": 0,
    "path": "m0,0l-50,50l50,50l0,-100z",
    "fill": "orange"
  },
  {
    "id": 4,
    "name": "wrong3",
    "level": 0,
    "path": "m0,0c0,0 60,0 60,0c0,0 0,-50 0,-50c0,0 -60,0 -60,0c0,0 0,50 0,50z",
    "fill": "orange"
  },
  {
    "id": 5,
    "name": "correct3",
    "level": 0,
    "path": "m0,0l-100,0l0,50l60,0l0,20l80,0l0,-20l60,0l0,-50l-100,0z",
    "fill": "green"
  },
  {
    "id": 6,
    "name": "wrong4",
    "level": 0,
    "path": "m0,0l0,100l-50,-50l50,-50z",
    "fill": "lightOrange"
  },
  {
    "id": 7,
    "name": "wrong5",
    "level": 0,
    "path": "m0,0l0,-50l200,0l0,50l-200,0z",
    "fill": "green"
  },
  {
    "id": 8,
    "name": "wrong6",
    "level": 0,
    "path": "m0,0l80,0l0,90l-80,0l0,-90z",
    "fill": "lightGreen"
  },
  {
    "id": 9,
    "name": "correct4",
    "level": 0,
    "path": "m0,0l0,100l50,-50l-50,-50z",
    "fill": "lightOrange"
  },
  {
    "id": 10,
    "name": "correct1",
    "level": 1,
    "path": "m0,0l-60,0l0,120l-40,0l0,-160l140,0l0,160l-40,0l0,-120z",
    "fill": "green"
  },
  {
    "id": 11,
    "name": "wrong1",
    "level": 1,
    "path": "m0,0l0,-80l-170,0l-10,0l0,200l120,0l0,-120l60,0z",
    "fill": "orange"
  },
  {
    "id": 12,
    "name": "wrong2",
    "level": 1,
    "path": "m0,0c0,0 0,-200 0,-200c0,0 -120,0 -120,0c0,0 0,200 0,200c0,0 120,0 120,0z",
    "fill": "lightOrange"
  },
  {
    "id": 13,
    "name": "wrong3",
    "level": 1,
    "path": "m0,0l100,-40l100,0l100,40l-300,0z",
    "fill": "green"
  },
  {
    "id": 14,
    "name": "wrong4",
    "level": 1,
    "path": "m0,0l100,0l0,-40l-50,-40l-50,40l0,40z",
    "fill": "lightGreen"
  },
  {
    "id": 15,
    "name": "wrong5",
    "level": 1,
    "path": "m0,0l150,0l0,-120l-50,40l0,30l0,10l-100,40z",
    "fill": "blue"
  },
  {
    "id": 16,
    "name": "wrong6",
    "level": 1,
    "path": "m0,0c0,0 0,110 0,110c0,0 0,10 0,10c0,0 150,0 150,0c0,0 -100,-40 -100,-40c0,0 0,-40 0,-40c0,0 -50,-40 -50,-40z",
    "fill": "lightBlue"
  },
  {
    "id": 17,
    "name": "correct2",
    "level": 1,
    "path": "m0,0l300,0l-100,-40l-100,0l-100,40z",
    "fill": "lightOrange"
  },
  {
    "id": 18,
    "name": "correct3",
    "level": 1,
    "path": "m0,0c0,0 0,-200 0,-200c0,0 150,0 150,0c0,0 0,40 0,40c0,0 -70,0 -70,0c0,0 0,160 0,160c0,0 -80,0 -80,0z",
    "fill": "lightGreen"
  },
  {
    "id": 19,
    "name": "wrong7",
    "level": 1,
    "path": "m0,0l0,-200l150,0l0,40l-70,0l0,160l-80,0z",
    "fill": "orange"
  },
  {
    "id": 20,
    "name": "correct4",
    "level": 1,
    "path": "m0,0l0,-200l-150,0l0,40l70,0l0,160l80,0z",
    "fill": "blue"
  },
  {
    "id": 21,
    "name": "wrong8",
    "level": 1,
    "path": "m0,0l0,-200l-150,0l0,40l70,0l0,160l80,0z",
    "fill": "lightOrange"
  },
  {
    "id": 22,
    "name": "correct5",
    "level": 1,
    "path": "m0,0l100,0c0,0 0,-40 0,-40c0,0 -50,-40 -50,-40c0,0 -50,40 -50,40c0,0 0,40 0,40z",
    "fill": "orange"
  },
  {
    "id": 23,
    "name": "wrong9",
    "level": 1,
    "path": "m0,0l0,-160l-140,0l0,160l40,0l0,-120l60,0l0,120l40,0z",
    "fill": "blue"
  },
  {
    "id": 24,
    "name": "correct1",
    "level": 2,
    "path": "m0,0c0,0 0,-30 0,-30c0,0 70,0 70,0c0,0 0,30 0,30c0,0 -20,0 -20,0c0,0 0,-10 0,-10c0,0 -30,0 -30,0c0,0 0,10 0,10c0,0 -20,0 -20,0z",
    "fill": "orange"
  },
  {
    "id": 25,
    "name": "correct2",
    "level": 2,
    "path": "m0,0l-20,20l-20,40l0,110l100,0l0,-70l-60,0l0,-100z",
    "fill": "lightOrange"
  },
  {
    "id": 26,
    "name": "correct3",
    "level": 2,
    "path": "m0,0l0,-60l300,0l10,20l0,40l-310,0z",
    "fill": "green"
  },
  {
    "id": 27,
    "name": "correct4",
    "level": 2,
    "path": "m0,0l0,70c0,0 100,0 100,0c0,0 0,-70 0,-70c0,0 -100,0 -100,0z",
    "fill": "lightGreen"
  },
  {
    "id": 28,
    "name": "correct5",
    "level": 2,
    "path": "m0,0l0,-70l150,0l0,70l-150,0z",
    "fill": "lightBlue"
  },
  {
    "id": 29,
    "name": "wrong1",
    "level": 2,
    "path": "m0,0l20,0l0,-10l30,0l0,10l20,0l0,-30l-70,0l0,30z",
    "fill": "blue"
  },
  {
    "id": 30,
    "name": "wrong2",
    "level": 2,
    "path": "m0,0l0,60l260,0l-20,-40l-20,-20l-220,0z",
    "fill": "lightOrange"
  },
  {
    "id": 31,
    "name": "correct6",
    "level": 2,
    "path": "m0,0l0,40l300,0l-10,-20l-20,-20l-270,0z",
    "fill": "blue"
  },
  {
    "id": 32,
    "name": "wrong3",
    "level": 2,
    "path": "m0,0l90,0l0,-60l-50,0l-20,20l-20,40z",
    "fill": "green"
  },
  {
    "id": 33,
    "name": "correct1",
    "level": 3,
    "path": "m0,0l-120,0l0,40l240,0c0,0 0,-40 0,-40c0,0 -120,0 -120,0z",
    "fill": "orange"
  },
  {
    "id": 34,
    "name": "wrong1",
    "level": 3,
    "path": "m0,0l0,-40l240,0l0,40l-240,0z",
    "fill": "blue"
  },
  {
    "id": 35,
    "name": "wrong2",
    "level": 3,
    "path": "m0,0l80,0l0,-90l-100,0l20,90z",
    "fill": "lightOrange"
  },
  {
    "id": 36,
    "name": "correct2",
    "level": 3,
    "path": "m0,0l-60,0l-40,-180l100,0l-60,60l40,0l20,50l0,70z",
    "fill": "lightGreen"
  },
  {
    "id": 37,
    "name": "wrong3",
    "level": 3,
    "path": "m0,0l-100,0l0,90l80,0l20,-90z",
    "fill": "green"
  },
  {
    "id": 38,
    "name": "wrong4",
    "level": 3,
    "path": "m0,0l-20,-90l160,0l-20,90l-120,0z",
    "fill": "lightGreen"
  },
  {
    "id": 39,
    "name": "correct3",
    "level": 3,
    "path": "m0,0l100,0l-40,180l-60,0l0,-70l20,-50l40,0l-60,-60z",
    "fill": "blue"
  },
  {
    "id": 40,
    "name": "correct4",
    "level": 3,
    "path": "m0,0l60,60l-40,0l-20,-20l-20,20l-40,0l60,-60z",
    "fill": "lightOrange"
  },
  {
    "id": 41,
    "name": "wrong5",
    "level": 3,
    "path": "m0,0l120,0l0,220l-60,0l-40,-180l-20,0l0,-40z",
    "fill": "orange"
  },
  {
    "id": 42,
    "name": "correct5",
    "level": 3,
    "path": "m0,0l20,20l-20,50l-20,-50l20,-20z",
    "fill": "green"
  }
]