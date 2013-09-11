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

	$resourceStage = null,
	$speechBubble = null,
	$inventory = null,
	$resourceArea = null,
	$speechButton = null,
	$resourceButton = null,
	$speakerName = null,
	$resourceMessage = null,
	$resourceContent = null,
	$resourceContentBody = null,
	$nextButton = null,
	$closeButton = null,
	$backButton = null,
	$answerButton = null,

	_numSeedsToAdd = 0,
	_questionType = null,
	_feedbackRight = null,
	_rightOpenRandom = ['Very interesting. I\'ve never looked at it like that before.', 'That says a lot about you!', 'Thanks for sharing. Now get out there and spread some color!'],
	_publicAnswers = null,
	_preloadedPieceImage = null;

$game.$resources = {

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

		$resourceStage = null;
		$speechBubble = null;
		$inventory = null;
		$resourceArea = null;
		$speechButton = null;
		$resourceButton = null;
		$speakerName = null;
		$resourceMessage = null;
		$resourceContent = null;
		$resourceContentBody = null;
		$nextButton = null;
		$closeButton = null;
		$backButton = null;
		$answerButton = null;

		_numSeedsToAdd = 0;
		_questionType = null;
		_feedbackRight = null;
		_publicAnswers = null;
		_preloadedPieceImage = null;

		$game.$resources.isShowing= false;
		$game.$resources.ready= false;
		$game.$resources.waitingForTagline= false;
	},

	//called when player clicks on resource from inventory to simulate clicking the NPC
	beginResource: function(npc, answers) {
		var nombre = $game.$npc.getName(npc);
		$game.$resources.loadResource(nombre, npc, true, answers);
		if(!answers) {
			_inventory = true;
		}
		$game.$resources.isShowing = true;
	},

	//preloads the resource into the staging area (not visible) and sets question and stuff
	loadResource: function(who, index, revisit, answers) {
		_who = who;
		_answered = answers;
		_correctAnswer = answers;
		_currentSlide = 0;

		$resourceStage.empty();
		var stringId = String(index);
		_curResource = _resources[stringId];
		_questionType = _curResource.questionType;
		_feedbackRight = _curResource.feedbackRight;

		var npcLevel = $game.$npc.getNpcLevel(index);
		if(npcLevel <= $game.$player.currentLevel) {
			var url = '/articles/' + _curResource.url + '.html';
			$resourceStage.empty().load(url,function() {
				_numSlides = $('.resourceStage .pages > section').length;
				$game.$resources.showResource(revisit);
			});
		}
	},

	//decide how to display resource on screen depending on state of player (if returning)
	showResource: function(revisit) {
		//revisiting means the already answered it and just see resource not question form
		_revisiting = revisit;
		if(_answered) {
			_correctAnswer = true;
			_currentSlide = _numSlides + 2;
		} else if(_revisiting) {
			_correctAnswer = false;
		} else {
			var npcLevel = $game.$npc.getNpcLevel(_curResource.index),
				levelFolder = 'level' + (npcLevel + 1),
				imgPath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + levelFolder + '/' + _curResource.shape + '.png';
			_preloadedPieceImage = '<p class="tangramPieceP"><img src="' + imgPath + '" class="centerImage"></p>';
		}

		$speechBubble.fadeOut(function() {
			$speechButton.addClass('hideButton');
			$(".speechBubble .yesButton").unbind("click");
			$(".speechBubble .noButton").unbind("click");

			//ready to show the resource now
			$('.resourceArea .dialog > span, .resourceArea .resourceContent').empty();
			$game.$resources.addContent();
			$game.$resources.addButtons();
			$inventory.fadeOut(function() {
				$game.$player.inventoryShowing = false;
				$resourceArea.addClass('patternBg1');
				$resourceArea.fadeIn();
				$game.$audio.playTriggerFx('windowShow');
			});
		});

		$game.$audio.fadeLow();
	},

	//figure out which buttons to show based on what they are looking at
	addButtons: function() {
		//hide all buttons by default
		$resourceButton.addClass('hideButton');
		//they answered the question
		if(_answered) {
			//other player answers page
			if(_currentSlide === _numSlides + 1) {
				if(_correctAnswer) {
					$saveButton.removeClass('hideButton');
				}
				else {
					$closeButton.removeClass('hideButton');
				}
			} else {
				$closeButton.removeClass('hideButton');
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
						$closeButton.removeClass('hideButton');
					}
					//answers to show
					else {
						if(_currentSlide > 0) {
							$backButton.removeClass('hideButton');
						}
						$nextButton.removeClass('hideButton');
					}
				}
				else if(_currentSlide === _numSlides) {
					$closeButton.removeClass('hideButton');
					$backButton.removeClass('hideButton');
				}
				else {
					$nextButton.removeClass('hideButton');
					if(_currentSlide > 0) {
						$backButton.removeClass('hideButton');
					}
				}
			}
			else {
				//if its the first page, we DEF. have a next and no back
				if(_currentSlide === 0) {
					$nextButton.removeClass('hideButton');
				}

				//if its not the first page or the last page, we have both
				else if(_currentSlide > 0 && _currentSlide < _numSlides) {
					$nextButton.removeClass('hideButton');
					$backButton.removeClass('hideButton');
				}

				//if its the last page, we have an answer button and a back
				else if(_currentSlide === _numSlides) {
					$answerButton.removeClass('hideButton');
					$backButton.removeClass('hideButton');
				}
			}
		}
	},

	//clear the display and decide what to show on screen
	addContent: function() {
		$speakerName.empty();
		$resourceMessage.empty();
		$resourceContentBody.empty().hide();
		$resourceContent.empty();
		//if they answered the question...
		if(_answered) {
			_addAnsweredContent();
		}
		else {
			_addRealContent();
		}
	},

	//show all other players recent answers and your own answer
	//include options to make public or not
	showRecentAnswers: function() {
		//alway show player's answer with a lock icon (make public button)
		//if it is public, just show eye icon
		//console.log(_curResource);
		var finalQuestion = '<div class="publicAnswers"><p class="finalQuestion">Q: ' + _curResource.question + '</p>';
			otherAnswers = '';
			yourAnswer = $game.$player.getAnswer(_curResource.index),
			rightOne = yourAnswer.answers.length - 1;

		if(_curResource.playerAnswers) {
			var recentAnswers = _curResource.playerAnswers,
				spot = recentAnswers.length,
				yoursPublic;

			while(--spot > -1) {
				//double check
				if(recentAnswers[spot].madePublic && recentAnswers[spot].id != $game.$player.id) {
					otherAnswers += '<li class="playerAnswers"><p><span>' + recentAnswers[spot].name + ': </span>' + recentAnswers[spot].answer + '</p><button class="btn btn-success pledgeButton" data-npc="' + _curResource.index + '" data-player="'+ recentAnswers[spot].id +'">Seed It!</button></li>';
				} else if(recentAnswers[spot].madePublic && recentAnswers[spot].id === $game.$player.id) {
					yoursPublic = true;
				}
			}

			//add in the player's answer with the appropriate button
			var finalDisplay = '<ul>';

			finalDisplay += '<li class="playerAnswers yourAnswer"><p><span>' + 'You said' + ': </span>' + yourAnswer.answers[rightOne] + '</p>';
			
			if(!yoursPublic) {
				// displayAnswers += '<i class="icon-unlock publicButton icon-large"></i>';
				finalDisplay += '<button class="btn btn-info publicButton" data-npc="'+ _curResource.index +'">Make Public</button>';
			} else {
				finalDisplay += '<i class="icon-unlock privateButton icon-large" data-npc="'+ _curResource.index +'"></i>';
			}
			finalDisplay +=  '</li>' + otherAnswers + '</ul></div>';

			_speak = 'Here are some recent answers by your peers: ';
		} else {
			_speak = 'Congrats! You were the first to answer.';
			displayAnswers += '<p>** More answers from your peers will appear shortly.  Be sure to check back. **</p>';
		}
			$speakerName.text(_who + ': ');
			$resourceMessage.text(_speak);
			$resourceContent.html(finalQuestion + finalDisplay);
	},

	//hide the resource area and decide if we need to show inventory again or not
	hideResource: function() {
		$resourceArea.fadeOut(function() {
			$game.$resources.isShowing = false;
			$resourceButton.addClass('hideButton');
			$resourceArea.removeClass('patternBg1');
		});

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
		$game.$audio.fadeHi();
	},

	//go back a slide in the resource (hack to go back 2 since next slide advances one)
	previousSlide: function() {
		_currentSlide -= 2;
		$game.$resources.nextSlide();
	},

	//advance to the next slide in a resource
	nextSlide: function() {
		_currentSlide += 1;
		//if its answered, determine if we need to show npc chat style instead
		if(_answered) {
			//if they got it wrong
			if(!_correctAnswer) {
				_speak = _curResource.feedbackWrong;
				$game.$audio.playTriggerFx('resourceWrong');
				//hide resource
				$game.$resources.hideResource();
				$('.speechBubble .speakerName').text(_who + ': ');
				$('.speechBubble .message').text(_speak);

				$('.speechBubble').fadeIn();
				$game.$npc.isChat = true;
				$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,4000);
			}
			else {
				$game.$resources.addContent();
				$game.$resources.addButtons();
			}
		}
		else {
			$game.$resources.addContent();
			$game.$resources.addButtons();
		}
	},

	//figure out if the player made the correct response or not, if we bypass it means they clicked okay on the prompt for it being too short
	submitAnswer: function(bypass) {
		var response = null;
		_correctAnswer = false;
		//retrieve the answer
		if(_questionType === 'open') {
			response = $('.resourceContent textarea').val();
			if(response.length < 1 && !bypass) {
				$game.$resources.popupCheck(true);
				return false;
			}
			if(_curResource.requiredLength && response.length < _curResource.requiredLength && !bypass) {
				$game.$resources.popupCheck();
				return false;
			} else {
				_correctAnswer = true;
				var ran = Math.floor(Math.random() * 3);
				_feedbackRight = _rightOpenRandom[ran];
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
				questionType: _curResource.questionType
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
		$game.$resources.nextSlide();
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
		var npcs = $game.$npc.getOnScreenNpcs();
		for (var n = 0; n < npcs.length; n++) {
			if(stringId == npcs[n]) {
				$game.$player.displayNpcComments();
				break;
			}
		}
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
	},

	//a popup triggered if answer was too short
	popupCheck: function() {
		$('.check button').removeClass('hideButton');
		$('.check').show();
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
	saveTagline: function(tagline) {
		if(tagline.length > 0) {
			$game.$player.setTagline(tagline);
			$game.$resources.waitingForTagline = false;

			//if open -> next slide
			//else -> close resource
			if(_curResource.questionType === 'open') {
				$game.$resources.nextSlide();
			} else {
				$game.$resources.hideResource();
			}
		} else {
			$('.checkTagline').show().delay(2000).fadeOut();
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
	$resourceStage = $('.resourceStage');
	$speechBubble = $('.speechBubble');
	$inventory = $('.inventory');
	$resourceArea = $('.resourceArea');
	$speechButton = $('.speechBubble button');
	$resourceButton = $('.resourceArea button');
	$speakerName = $('.resourceArea .speakerName');
	$resourceMessage = $('.resourceArea .message');
	$resourceContent = $('.resourceContent');
	$resourceContentBody = $('.resourceContentBody');
	$nextButton = $('.resourceArea .nextButton');
	$closeButton = $('.resourceArea .closeButton');
	$backButton = $('.resourceArea  .backButton');
	$answerButton = $('.resourceArea  .answerButton');
	$saveButton = $('.resourceArea  .saveButton');
}

//adding content if they answered the resource to show
function _addAnsweredContent() {
	//if they got it right, give them a tangram
	if(_correctAnswer) {
		//first, congrats and show them the tangram piece
		if(_currentSlide === _numSlides + 1) {
			$game.$resources.waitingForTagline = true;
			var inputBox = '<p class="centerText taglineInput"><input class="customTagline" name="tagline" type ="text" value="" maxLength = "60"></input></p><p class="privacyMessage taglineInput">Name this resource to remember it.</p>',
				npcLevel = $game.$npc.getNpcLevel(),
				html;
			if(npcLevel < $game.$player.currentLevel) {
				_speak = _feedbackRight + ' Here, take ' + _numSeedsToAdd + ' seeds!';
				html = inputBox;
				$resourceContent.empty().html(html).css('overflow','auto');
			}
			else {
				_speak = _feedbackRight + ' Here, take this puzzle piece, and ' + _numSeedsToAdd + ' seeds!';
				//show image on screen
				//get path from db, make svg with that
				$game.$audio.playTriggerFx('resourceRight');

				html = _preloadedPieceImage + inputBox;
				$resourceContent.empty().html(html).css('overflow', 'hidden');
			}
			$speakerName.text(_who + ': ');
			$resourceMessage.text(_speak);
			//give them input box for custom tagline
		}
		//the next slide will show them recent answers
		else {
			$resourceContent.empty().css('overflow','auto');
			$game.$resources.showRecentAnswers();
		}
	}
}

//adds question content or shows answers or show resource content
function _addRealContent() {
	$resourceContent.css('overflow', 'auto');
	if(_currentSlide === _numSlides) {
		var finalQuestion = '<p class="finalQuestion">Q: ' + _curResource.question + '</p>';
		//show their answer and the question, not the form
		if(_revisiting) {
			$game.$resources.showRecentAnswers();
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
					inputBox+='<input name="resourceMultipleChoice" type ="radio" value="' + _curResource.possibleAnswers[i] + '"> ' + _curResource.possibleAnswers[i] + '</input><br>';
				}
				inputBox += '</form>';
			}
			else if(_questionType === 'open') {
				inputBox = '<form><textarea placeholder="type your answer here..."></textarea></form><p class="privacyMessage">Your answer will be private by default. You  can later choose to make it public to earn special seeds.</p>';
			}
			else if(_questionType === 'truefalse') {
				//inputBox = '<form><input type="submit" value="true"><input type="submit" value="false"></form>';
				inputBox = '<form><input name="resourceMultipleChoice" type ="radio" value="true">true</input>' +
							'<br><input name="resourceMultipleChoice" type ="radio" value="false">false</input>';
			}
			else if(_questionType === 'yesno') {
				inputBox = '<form><input name="resourceMultipleChoice" type ="radio" value="yes">yes</input>' +
							'<br><input name="resourceMultipleChoice" type ="radio" value="no">no</input>';
			}
			$resourceContent.html(finalQuestion + inputBox);
		}
	}
	else{
		var content = $('.resourceStage .pages > section').get(_currentSlide).innerHTML;
		$resourceContent.empty();
		$resourceContentBody.html(content).show();
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
		path: 'm0,0l0,-80l-170,0l-10,0l0,200l120,0l0,-120l60,0z',
		fill: 'orange'
	},
	wrong1: {
		path: 'm0,0c0,0 0,-200 0,-200c0,0 -120,0 -120,0c0,0 0,200 0,200c0,0 120,0 120,0z',
		fill: 'lightOrange'
	},
	wrong2: {
		path: 'm0,0l100,-40l100,0l100,40l-300,0z',
		fill: 'green'
	},
	wrong3: {
		path: 'm0,0l100,0l0,-40l-50,-40l-50,40l0,40z',
		fill: 'lightGreen'
	},
	wrong4: {
		path: 'm0,0l-60,0l0,120l-40,0l0,-160l140,0l0,160l-40,0l0,-120z',
		fill: 'green'
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