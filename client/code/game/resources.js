'use strict';

var _resources = [],
	_currentSlide = 0,
	_numSlides = 0,
	_speak = null,
	_answered = false,
	_who = null,
	_correctAnswer = false,
	_curResource = null,
	_revisiting = false,
	_inventory = false,
	_temporaryAnswer = '',

	$resourceArea = null,
	$speakerName = null,
	$resourceMessage = null,
	$resourceContent = null,
	$resourceContentBody = null,

	_numSeedsToAdd = 0,
	_questionType = null,
	_feedbackRight = null,
	_skinSuitReward = null,
	//_rightOpenRandom = ['Very interesting. I\'ve never looked at it like that before.', 'That says a lot about you!', 'Thanks for sharing. Now get out there and spread some color!'],
	_publicAnswers = null,
	_preloadedPieceImage = null;

var $resources = $game.$resources = {

	isShowing: false,
	ready: false,
	waitingForTagline: false,

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

			//set dom selectors
			_setDomSelectors();

			$game.$resources.ready = true;
			callback();
		});
	},

	resetInit: function() {
		_resources = [];
		_currentSlide = 0;
		_numSlides = 0;
		_speak = null;
		_answered = false;
		_who = null;
		_correctAnswer = false;
		_curResource = null;
		_revisiting = false;
		_inventory = false;

		$resourceArea = null;
		$speakerName = null;
		$resourceMessage = null;
		$resourceContent = null;
		$resourceContentBody = null;

		_numSeedsToAdd = 0;
		_questionType = null;
		_feedbackRight = null;
		_skinSuitReward = null;
		_publicAnswers = null;
		_preloadedPieceImage = null;

		$game.$resources.isShowing= false;
		$game.$resources.ready= false;
		$game.$resources.waitingForTagline= false;
	},

  debug: function () { // TODO: REMOVE
    console.log(_resources)
  },

  // Called when player views a resource from inventory
  examineResource: function (index) {
    // Hides inventory, shows resource, and passes a callback function to re-open the
    // inventory once player exits the resource.
    $game.$input.closeInventory(function () {
      $resources.showResource(index, function () {
        $game.$input.openInventory()
        // $game.$player.inventoryShowing = ($game.$botanist.isSolving) ? false : true
      })
    })
  },

  // Activated when clicking on something that is specific to viewing answers
  examineAnswers: function (index) {
    $resources.showResponses(index)
  },

  // Preloads the resource into the staging area
  loadResource: function (resource, callback) {
    var url = CivicSeed.CLOUD_PATH + '/articles/' + resource.url + '.html'
    $('#resource-stage').empty().load(url, callback)
  },

  //decide how to display resource on screen depending on state of player (if returning)
  showResource: function (index, callback) {
    var el          = document.getElementById('resource-area'),
        npc         = $game.$npc.getNpc(index),
        npcLevel    = $game.$npc.getLevel(index),
        playerLevel = $game.$player.getLevel(),
        revisit     = $game.$player.getPrompt(index),    // 2 = revisiting?
        resource    = _resources[index]

    console.log('showResource() ', index, resource)

    // If NPC's level is higher than player's level, let's get out of here.
    /*
    if (npcLevel > playerLevel) {
      $game.debug('Aborting resource display because the NPC level of this resource (' + npcLevel + ') is higher than the player’s current level (' + playerLevel + ')')
      return false
    }
    */

    // Load resource content, then display.
    // $resources.isShowing = true
    $resources.loadResource(resource, function () {
      var slides    = $('#resource-stage .pages > section').length,
          folder    = 'level' + npcLevel,
          imagePath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + folder + '/' + resource.shape + '.png'

      $game.$audio.playTriggerFx('windowShow')
      $game.$audio.fadeLow()

      el.querySelector('.tangram').innerHTML = '<img src="' + imagePath + '">'

      //ready to show the resource now
      el.querySelector('.resource-content, .resource-article, .resource-question, .resource-responses').style.display = 'none'
      $resources.addContent(index);
      $resources.addButtons();

      $(el).fadeIn(300)
    })
    /*
    _who = who;
    _answered = answers;
    _correctAnswer = answers;
    _currentSlide = 0;
    _temporaryAnswer = '';

    var stringId = String(index);
    _curResource = _resources[stringId];
    _questionType = _curResource.questionType;
    _feedbackRight = _curResource.feedbackRight;
    _skinSuitReward = _curResource.skinSuit;
    */

		//revisiting means the already answered it and just see resource not question form
    /*
		_revisiting = revisit;
		if(_answered) {
			_correctAnswer = true;
			_currentSlide = _numSlides + 2;
		}
    else if(_revisiting) {
			_correctAnswer = false;
		}
    else {
			var npcLevel = $game.$npc.getNpcLevel(_curResource.index),
				levelFolder = 'level' + (npcLevel + 1),
				imgPath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + levelFolder + '/' + _curResource.shape + '.png';
			_preloadedPieceImage = '<div class="tangramPiece"><img src="' + imgPath + '"></div>';
		}
    */
	},

	//figure out which buttons to show based on what they are looking at
	addButtons: function() {

    // TEMPORARY: Put all old button references here, the only place where it's used
    var $resourceButton = $('#resource-area button'),
        $nextButton = $('#resource-area .nextButton'),
        $closeButton = $('#resource-area .closeButton'),
        $backButton = $('#resource-area .backButton'),
        $answerButton = $('#resource-area .answerButton'),
        $saveButton = $('#resource-area .saveButton');

		//hide all buttons by default
		$resourceButton.hide();
		//they answered the question
		if(_answered) {
			//other player answers page
			if(_currentSlide === _numSlides + 1) {
				if(_correctAnswer) {
					$saveButton.show();
				}
				else {
					$closeButton.show();
				}
			} else {
				$closeButton.show();
			}
		}
		//they haven't answered it yet
		else {
			//they are returning to the resource
			if(_revisiting) {
				//if its the last slide
				if(_currentSlide === _numSlides - 1) {
					//not open ended
					if( _questionType !== 'open') {
						$closeButton.show();
					}
					//answers to show
					else {
						if(_currentSlide > 0) {
							$backButton.show();
						}
						$nextButton.show();
					}
				}
				else if(_currentSlide === _numSlides) {
					$closeButton.show();
					$backButton.show();
				}
				else {
					$nextButton.show();
					if(_currentSlide > 0) {
						$backButton.show();
					}
				}
			}
			else {
				//if its the first page, we DEF. have a next and no back
				if(_currentSlide === 0) {
					$nextButton.show();
				}

				//if its not the first page or the last page, we have both
				else if(_currentSlide > 0 && _currentSlide < _numSlides) {
					$nextButton.show();
					$backButton.show();
				}

				//if its the last page, we have an answer button and a back
				else if(_currentSlide === _numSlides) {
					$answerButton.show();
					$backButton.show();
				}
			}
		}
	},

	//clear the display and decide what to show on screen
	addContent: function (index) {
		//if they answered the question...
		if(_answered) {
			_addAnsweredContent();
		}
		else {
			_addRealContent(index);
		}
	},

  getSlideContent: function (index, slide) {
    // Here's how slides go
    // 0 to article.(length - 1) = article's pages
    // article.length = The test question
    //   if unanswered, display the answer form.
    //   if answered, display player's answer and all public answers.
    // article.(length + 1) = If previous slide was the answer form, this is congrats!
  },

  // Show other players answers and your own
  showResponses: function (index) {
    var overlay        = document.getElementById('resource-area'),
        el             = overlay.querySelector('.resource-responses'),
        resource       = _resources[index],
        npc            = $game.$npc.getNpc(index),
        playerResource = $game.$player.getAnswer(index),
        playerPublic   = false,
        responsesHTML  = '',
        playerHTML     = '',
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
        responsesHTML+= '<li class="response"><p><span>' + thisAnswer.name + ': </span>' + thisAnswer.answer + '</p><div class="pledgeButton"><button class="btn btn-success" data-npc="' + resource.index + '" data-player="'+ thisAnswer.id +'">Seed It!</button></div></li>';
      }
    }

    // Determine what NPC says for status
    if (responsesHTML !== '') {
      dialogue = 'Here are some recent answers by your peers.'
    }
    else {
      dialogue = 'Your answer is shown below, but other players have not made their answers public.'
      responsesHTML= '<li class="response"><p>More answers from your peers will appear shortly.  Be sure to check back.</p></li>'
    }

    //add in the player's answer with the appropriate button
    // TODO: Make a better templating system for all of this
    playerHTML += '<li class="response your-response"><p><span>' + 'You said' + ': </span>' + playerResource.answers[playerResource.answers.length - 1] + '</p>'
    if (!playerPublic) {
      playerHTML += '<div class="publicButton"><button class="btn btn-info" data-npc="'+ resource.index +'">Make Public</button> <i class="fa fa-lock fa-lg"></i></div>'
    }
    else {
      playerHTML += '<div class="privateButton"><button class="btn btn-info" data-npc="'+ resource.index +'">Make Private</button> <i class="fa fa-unlock-alt fa-lg"></i></div>'
    }
    playerHTML += '</li>'

    el.querySelector('.question').innerHTML = 'Q: ' + resource.question
    el.querySelector('.content-box ul').innerHTML = playerHTML + responsesHTML
    el.querySelector('.speaker').textContent = npc.name
    el.querySelector('.message').textContent = dialogue

    // TODO: Move display logic elsewhere
    el.style.display = 'block'
    overlay.querySelector('.resource-content, .resource-article, .resource-question').style.display = 'none'
    if ($(overlay).is(':hidden')) {
      $resources.isShowing = true
      $(overlay).fadeIn()
    }
  },

  //hide the resource area and decide if we need to show inventory again or not
  hideResource: function (callback) {
    var el = document.getElementById('resource-area')

    $(el).fadeOut(function () {
      $resources.isShowing = false
      $game.$audio.fadeHi()
      if (typeof callback === 'function') {
        callback()
      }
    })
    /* This should be something callbacks should employ.
		//if the resource was being displayed from the inventory, keep it up.
		if(_inventory) {
			$inventory.fadeIn(function() {
				_inventory = false;
				if($game.$botanist.isSolving) {
					$game.$player.inventoryShowing = false;
				}
				else {
					$game.$player.inventoryShowing = true;
				}
			});
		} else {
			$game.$player.checkBotanistState();
		}
    */
	},

	//go back a slide in the resource (hack to go back 2 since next slide advances one)
	previousSlide: function() {
		//if they were answering the question, store their answer
		if(_currentSlide === _numSlides && _questionType === 'open') {
			_temporaryAnswer = $('.resourceContent textarea').val();
		}
		_currentSlide -= 2;
		$game.$resources.nextSlide();
	},

	//advance to the next slide in a resource
	nextSlide: function (slide) {
		_currentSlide += 1;
    $game.$resources.addContent();
    $game.$resources.addButtons();
	},

	//figure out if the player made the correct response or not, if we bypass it means they clicked okay on the prompt for it being too short
	submitAnswer: function (bypass) {
		var response = null;
		_correctAnswer = false;
		//retrieve the answer
		if(_questionType === 'open') {
			response = $.trim($('.resourceContent textarea').val());
      if (response.length === 0) {
        $resources.showCheckMessage('Please answer the question!')
        return false
      }
			else if (_curResource.requiredLength && response.length < _curResource.requiredLength && !bypass) {
				$game.$resources.popupCheck();
				return false;
			}
      else {
				_correctAnswer = true;
				if(_feedbackRight.length < 1) {
					_feedbackRight = 'Thanks for sharing.';
				}
			}
		}
		else {
			response = $('input[name=resourceMultipleChoice]:checked').val();
			if(response === _curResource.answer) {
				_correctAnswer = true;
			}
		}

		var npcLevel = $game.$npc.getNpcLevel(_curResource.index);
		//if correct, get seeds, push answer to db
		if(_correctAnswer) {
  		//update player stuff
			var rightInfo = {
				correct : true,
				index: _curResource.index,
				answer: response,
				npcLevel: npcLevel,
				questionType: _curResource.questionType,
				skinSuit: _skinSuitReward
			};
			_numSeedsToAdd = $game.$player.answerResource(rightInfo);

			//if they took more than 1 try to get a binary, drop down more
			if(_questionType === 'truefalse' || _questionType === 'yesno') {
				if(_numSeedsToAdd < 5) {
					_numSeedsToAdd = 2;
				}
			}
			//add this to the DB of resources for all player answers
			var newAnswer = {
				npc: _curResource.index,
				id: $game.$player.id,
				name: $game.$player.firstName,
				answer: response,
				madePublic: false,
				instanceName: $game.$player.instanceName,
				questionType: _curResource.questionType
			};
		}
		else {
			var wrongInfo = {
				correct : false,
				index: _curResource.index,
				answer: response,
				npcLevel: npcLevel,
				questionType: _curResource.questionType
			};
			_numSeedsToAdd = $game.$player.answerResource(wrongInfo);
		}
		_answered = true;

    if (_answered && _correctAnswer) {
      // If the answer is correct, there's more slides to go.
      $game.$resources.nextSlide();
    }
    else if (!_correctAnswer) {
      // If the answer is wrong, exit out. We're done here.
      _speak = _curResource.feedbackWrong;

      $resources.hideResource(function callback() {
        $game.$audio.playTriggerFx('resourceWrong')
        $game.$npc.showSpeechBubble(_who, _speak)
      })
    }

	},

	//get the shape svg info for a specific resource
	getShape: function(index) {
		var stringId = String(index),
			shapeName = _resources[stringId].shape;
		return _shapes[$game.$player.currentLevel][shapeName];
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

	// Trigger a popup if answer was too short
	popupCheck: function () {
    var $el = $('#resource-area .check')
    $el.find('.check-dialog').hide()
    $el.find('.confirm-skimpy').show()
    $el.find('button').show()
    $el.fadeIn(200)
	},

	// Display messages on checking user input
	showCheckMessage: function (message) {
    var $el = $('#resource-area .check')

    $el.find('.check-dialog').hide()
    $el.find('.message-feedback').show()

    $el.find('.feedback').text(message)
    $el.find('button').bind('click', $resources.hideCheckMessage).show()
    $el.fadeIn(200)
	},

  hideCheckMessage: function () {
    var $el = $('#resource-area .check')
    if ($el.is(':visible')) {
      $el.fadeOut(200)
    }
  },

	//get the question for a resource
	getQuestion: function(index) {
		var stringId = String(index);
		return _resources[stringId].question;
	},

	getCurResource: function() {
		return _curResource;
	},

	//decide what to do if we save custom tagline
	saveTagline: function (tagline) {
		if (tagline.length > 0) {
			$game.$player.setTagline(tagline);
			$game.$resources.waitingForTagline = false;

			//if open -> next slide
			//else -> close resource
			if(_curResource.questionType === 'open') {
				$game.$resources.nextSlide();
			} else {
				$game.$resources.hideResource();
			}
		}
    else {
			$('.tagline-input input').focus()
      $resources.showCheckMessage('You should create a custom tagline!')
		}
	},

	getNumResponses: function(index) {
		var stringId = String(index);
		return _resources[stringId].playerAnswers.length;
	}
};

/***** PRIVATE FUNCTIONS ******/

//reuse for doms
function _setDomSelectors() {
	$resourceArea = $('#resource-area');
	$speakerName = $('#resource-area .speakerName');
	$resourceMessage = $('#resource-area .message');
	$resourceContent = $('.resourceContent');
	$resourceContentBody = $('.resourceContentBody');
}

//adding content if they answered the resource to show
function _addAnsweredContent() {
	//if they got it right, give them a tangram
	if(_correctAnswer) {
		//first, congrats and show them the tangram piece
		if(_currentSlide === _numSlides + 1) {
			$game.$resources.waitingForTagline = true;
			var	npcLevel = $game.$npc.getNpcLevel()

			if(npcLevel < $game.$player.currentLevel) {
				_speak = _feedbackRight + ' Here, take ' + _numSeedsToAdd + ' seeds!';
				$('.tagline-input').show()
				$resourceContent.empty().css('overflow','auto');
			}

			else {
				_speak = _feedbackRight + ' Here, take this puzzle piece, and ' + _numSeedsToAdd + ' seeds!';
				//show image on screen
				//get path from db, make svg with that
				$game.$audio.playTriggerFx('resourceRight');

				$resourceContent.empty().html(_preloadedPieceImage).css('overflow', 'hidden');
			}
			//give them the skinsuit regardless if in prev level or not
			if(_skinSuitReward) {
				_speak += ' You unlocked the ' + $game.$skins.data[_skinSuitReward].name + ' suit! Try it on or browse your other suits by clicking the changing room button below.';
			}
			$speakerName.text(_who);
			$resourceMessage.text(_speak);
      $('#resource-area .dialog').show()
			//give them input box for custom tagline
		}
		//the next slide will show them recent answers
		else {
			$resourceContent.empty().show();
			$resources.showResponses();
		}
	}
}

//adds question content or shows answers or show resource content
function _addRealContent (index) {
  var $el         = $('#resource-area'),
      npc         = $game.$npc.getNpc(index),
      npcLevel    = $game.$npc.getLevel(index),
      playerLevel = $game.$player.getLevel(),
      revisit     = $game.$player.getPrompt(index),    // 2 = revisiting?
      resource    = _resources[index]

  var $article = $('#resource-stage .pages > section'),
      slides   = $article.length

  console.log('_currentSlide: ', _currentSlide)
  console.log('resource: ', resource, index)

  if (_currentSlide === slides) {
    // the _currentSlide is equal to the number of slides, that is, time to display
    // the resource's test question.
    var $content = $el.find('.resource-question')
    $content.find('.question').text(resource.question)
    $el.show()
  }

	// $resourceContent.css('overflow', 'auto');
	if(_currentSlide === slides) {
		// var finalQuestion = '<p class="finalQuestion">Q: ' + _curResource.question + '</p>';
		//show their answer and the question, not the form
		if(_revisiting) {
			$game.$resources.showResponses();
		}
		else {
			// _speak = _curResource.prompt;
			// $speakerName.text(_who + ': ');
			// $resourceMessage.text(_speak);
			var inputBox = null;
			if(_questionType === 'multiple') {
				var numOptions = _curResource.possibleAnswers.length;
				inputBox = '<form>';
				for(var i =0; i<numOptions; i++) {
					inputBox+='<input name="resourceMultipleChoice" type ="radio" id="answer_' + i + '" value="' + _curResource.possibleAnswers[i] + '"><label for="answer_'+ i +'">' + _curResource.possibleAnswers[i] + '</label><br>';
				}
				inputBox += '</form>';
			}
			else if(_questionType === 'open') {
				inputBox = '<form><textarea placeholder="Type your answer here..." autofocus></textarea></form><p class="privacy-message">Your answer will be private by default. You  can later choose to make it public to earn special seeds.</p>';
			}
			else if(_questionType === 'truefalse') {
				//inputBox = '<form><input type="submit" value="true"><input type="submit" value="false"></form>';
				inputBox = '<form><input name="resourceMultipleChoice" type="radio" id="true" value="true"><label for="true">true</label>' +
							'<br><input name="resourceMultipleChoice" type="radio" id="false" value="false"><label for="false">false</label>';
			}
			else if(_questionType === 'yesno') {
				inputBox = '<form><input name="resourceMultipleChoice" type="radio" id="yes" value="yes"><label for="yes">yes</label>' +
							'<br><input name="resourceMultipleChoice" type="radio" id="no" value="no"><label for="no">no</label>';
			}
			$resourceContent.html(finalQuestion + inputBox).show();
			if(_temporaryAnswer.length > 0 && _questionType === 'open') {
				$('.resourceContent textarea').val(_temporaryAnswer);
			}
		}
	}
	else {
    // Show contents of article
		var page = $article.get(_currentSlide).innerHTML
    $('.resource-content').hide()
    $('.resource-article').html(page).show()
	}
}


/***shape data ***/
var _shapes = [{
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
}];