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

	init: function(callback) {
		var response = $game.$npc.getNpcData();
		//create array of ALL player responses and resource information
		ss.rpc('game.npc.getResponses', $game.$player.instanceName, function(all) {
			$.each(response, function(key, npc) {
				if(npc.isHolding) {
					var stringId = String(npc.id);
					_resources[stringId] = npc.resource;
					_resources[stringId].id = npc.id;
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

	//called when player clicks on resource from inventory to simulate clicking the NPC
	beginResource: function(e) {
		var nombre = $game.$npc.getName(e.data.npc);
		$game.$resources.loadResource(nombre, e.data.npc, true);
		_inventory = true;
		$game.$resources.isShowing = true;
	},

	//preloads the resource into the staging area (not visible) and sets question and stuff
	loadResource: function(who, index, revisit) {
		_who = who,
		_answered = false,
		_currentSlide = 0;

		$resourceStage.empty();
		var stringId = String(index);
		_curResource = _resources[stringId];
		_questionType = _curResource.questionType;
		_feedbackRight = _curResource.feedbackRight;

		var npcLevel = $game.$npc.getNpcLevel(index);
		if(npcLevel <= $game.$player.currentLevel) {
			// var url = '/articles/level' + (npcLevel + 1) + '/' + _curResource.id + '.html';
			var url = '/articles/' + _curResource.url + '.html';
			$resourceStage.empty().load(url,function() {
				_numSlides = $('.resourceStage .pages > section').length;
				$game.$resources.showResource(revisit);
			});
		}
	},

	//decide how to display resource on screen depending on state of player (if returning)
	showResource: function(revisit) {
		//revising means the already answered it and just see resource not question form
		_revisiting = revisit;
		if(_revisiting) {
			_correctAnswer = false;
		} else {
			var npcLevel = $game.$npc.getNpcLevel(),
				levelFolder = 'level' + (npcLevel + 1),
				imgPath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + levelFolder + '/' + _curResource.id + '.png';
			_preloadedPieceImage = '<img src="' + imgPath + '" class="centerImage">';
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

	addButtons: function() {
		//hide all buttons by default
		$resourceButton.addClass('hideButton');
		//they answered the question
		if(_answered) {
			//other player answers page
			if(_currentSlide === _numSlides + 1 &&  _questionType === 'open') {
				if(_correctAnswer) {
					$nextButton.removeClass('hideButton');
				}
				else {
					$closeButton.removeClass('hideButton');
				}
			}
			//other answer types without responses
			else {
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

	showRecentAnswers: function() {
		//alway show player's answer with a lock icon (make public button)
		//if it is public, just show eye icon
		var finalQuestion = '<div class="publicAnswers"><p class="finalQuestion">Q: ' + _curResource.question + '</p>',
			displayAnswers = '<ul>',
			yourAnswer = $game.$player.getAnswer(_curResource.id),
			rightOne = yourAnswer.answers.length - 1;

		displayAnswers += '<li class="playerAnswers yourAnswer"><p><span>' + 'You said' + ': </span>' + yourAnswer.answers[rightOne] + '</p>';
		if(!yourAnswer.madePublic) {
			// displayAnswers += '<i class="icon-unlock publicButton icon-large"></i>';
			displayAnswers += '<button class="btn btn-info publicButton" data-npc="'+ _curResource.id +'">Make Public</button>';
		} else {
			displayAnswers += '<i class="icon-unlock privateButton icon-large" data-npc="'+ _curResource.id +'"></i>';
		}
		displayAnswers += '</li>';
		if(_curResource.playerAnswers) {
			var recentAnswers = _curResource.playerAnswers,
				spot = recentAnswers.length;

			while(--spot > -1) {
				//double check
				if(recentAnswers[spot].madePublic && recentAnswers[spot].id != $game.$player.id) {
					displayAnswers += '<li class="playerAnswers"><p><span>' + recentAnswers[spot].name + ': </span>' + recentAnswers[spot].answer + '</p><button class="btn btn-success pledgeButton" data-npc="' + _curResource.id + '" data-player="'+ recentAnswers[spot].id +'">Seed It!</button></li>';
				}
			}
			displayAnswers += '</ul></div>';
			_speak = 'Here are some recent answers by your peers: ';
		} else {
			_speak = 'Congrats! You were the first to answer.';
			displayAnswers += '<p>** More answers from your peers will appear shortly.  Be sure to check back. **</p>';
		}
			$speakerName.text(_who + ': ');
			$resourceMessage.text(_speak);
			$resourceContent.html(finalQuestion + displayAnswers);
	},

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
		}
		$game.$audio.fadeHi();
	},

	//super ghetto hack to go back a page
	previousSlide: function() {
		_currentSlide -= 2;
		$game.$resources.nextSlide();
	},

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

		var npcLevel = $game.$npc.getNpcLevel();
		//if correct, get seeds, push answer to db
		if(_correctAnswer) {
			//update player stuff
			var rightInfo = {
				correct : true,
				id: _curResource.id,
				answer: response,
				npcLevel: npcLevel
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
				npc: _curResource.id,
				id: $game.$player.id,
				name: $game.$player.name,
				answer: response,
				madePublic: false,
				instanceName: $game.$player.instanceName
			};
			//hack to not include demo users
			if($game.$player.name !== 'Demo') {
				ss.rpc('game.npc.saveResponse', newAnswer);
			}
		}
		else {
			var wrongInfo = {
				correct : false,
				id: _curResource.id,
				answer: response,
				npcLevel: npcLevel
			};
			_numSeedsToAdd = $game.$player.answerResource(wrongInfo);
		}
		_answered = true;
		$game.$resources.nextSlide();
	},

	getShape: function(id) {
		var stringId = String(id);
		return _resources[stringId].shape;
	},

	getTagline: function(id) {
		var stringId = String(id);
		return _resources[stringId].tagline;
	},

	addAnswer: function(data) {
		var stringId = String(data.npc);
		_resources[stringId].playerAnswers.push(data);
	},

	removeAnswer: function(data) {
		var stringId = String(data.npc);
		var found = false,
			i = 0;
		console.log(_resources[stringId].playerAnswers);
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

	popupCheck: function() {
		$('.check button').removeClass('hideButton');
		$('.check').show();
	},

	getQuestion: function(id) {
		var stringId = String(id);
		return _resources[stringId].question;
	}
};

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
}

function _addAnsweredContent() {
	//if they got it right, give them a tangram
	if(_correctAnswer) {
		//first, congrats and show them the tangram piece
		if(_currentSlide === _numSlides + 1) {
			var npcLevel = $game.$npc.getNpcLevel();
			if(npcLevel < $game.$player.currentLevel) {
				_speak = _feedbackRight + ' Here, take ' + _numSeedsToAdd + ' seeds!';
				$resourceContent.empty().css('overflow','auto');
			}
			else {
				_speak = _feedbackRight + ' Here, take this puzzle piece, and ' + _numSeedsToAdd + ' seeds!';
				//show image on screen
				//get path from db, make svg with that
				$game.$audio.playTriggerFx('resourceRight');
				$resourceContent.html(_preloadedPieceImage).css('overflow', 'hidden');
			}
			$speakerName.text(_who + ': ');
			$resourceMessage.text(_speak);
		}
		//the next slide will show them recent answers
		else {
			$resourceContent.empty().css('overflow','auto');
			$game.$resources.showRecentAnswers();
		}
	}
}

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
				inputBox = '<form><textarea placeholder="type your answer here..."></textarea></form><p class="privacyMessage">your answer will be private by default. You  can later choose to make it public to earn special seeds.</p>';
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