
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
	_resourceStateSel = null,
	_speechBubbleSel = null,
	_inventorySel = null,
	_resourceAreaSel = null,
	_speechButtonSel = null,
	_resourceButtonSel = null,
	_speakerNameSel = null,
	_resourceMessageSel = null,
	_resourceContentSel = null,
	_numSeedsToAdd = 0,
	_questionType = null,
	_feedbackRight = null,
	_rightOpenRandom = ['Very interesting. I\'ve never looked at it like that before.', 'That says a lot about you!', 'Thanks for sharing. Now get out there and spread some color!'],
	_publicAnswers = null;

$game.$resources = {

	isShowing: false,
	ready: false,

	init: function() {
		ss.rpc('game.npc.getResources', function(response) {
			//iterate through repsonses, create a key
			//with the id and value is the object
			_allNpcs = {};
			ss.rpc('game.npc.getResponses', $game.$player.game.instanceName, function(all) {

				$.each(response, function(key, resource) {
					var stringId = String(resource.id);
					_resources[stringId] = resource;
					_resources[stringId].playerAnswers = [];
				});

				var allRes = all[0].resourceResponses;
				$.each(allRes, function(key, answer) {
					if(answer.madePublic) {
						var stringId = String(answer.npc);
						_resources[stringId].playerAnswers.push(answer);
					}
				});
				//fill the inventory if there were things when we last left
				$game.$player.fillInventory();

				//set dom selectors
				_resourceStateSel = $('.resourceStage');
				_speechBubbleSel = $('.speechBubble');
				_inventorySel = $('.inventory');
				_resourceAreaSel = $('.resourceArea');
				_speechButtonSel = $('.speechBubble button');
				_resourceButtonSel = $('.resourceArea button');
				_speakerNameSel = $('.resourceArea .speakerName');
				_resourceMessageSel = $('.resourceArea .message');
				_resourceContentSel = $('.resourceContent');

				$game.$resources.ready = true;
			});
		});
	},

	beginResource: function(e) {
		var nombre = $game.$npc.getName(e.data.npc);
		$game.$resources.loadResource(nombre, e.data.npc, true);
		_inventory = true;
		$game.$resources.isShowing = true;
	},

	loadResource: function(who, index, now) {
		_who = who,
		_answered = false,
		_currentSlide = 0;

		_resourceStateSel.empty();
		var stringId = String(index);
		_curResource = _resources[stringId];
		_questionType = _curResource.questionType;
		_feedbackRight = _curResource.feedbackRight;
		var url = _curResource.url;
		_resourceStateSel.load(url,function() {
			_numSlides = $('.resourceStage .pages > .page').length;
			if(now) {
				$game.$resources.showResource(2);
			}
		});
	},

	showResource: function(num) {
		_revisiting = false;
		//if they already got it right, then don't have answer form, but show answer
		if(num === 2) {
			_revisiting = true;
			_correctAnswer = false;
		}

		_speechBubbleSel.fadeOut(function() {
			_speechButtonSel.addClass('hideButton');
			$(".speechBubble .yesButton").unbind("click");
			$(".speechBubble .noButton").unbind("click");

			//ready to show the resource now
			//_speak = _curResource.dialog.questions[0];
			$('.resourceArea .dialog > span, .resourceArea .resourceContent').empty();
			$game.$resources.addContent();
			$game.$resources.addButtons();
			_inventorySel.fadeOut(function() {
				$game.$player.inventoryShowing = false;
				// _resourceAreaSel.addClass('patternBg1');
				_resourceAreaSel.fadeIn();
			});
		});
	},

	addButtons: function() {
		_resourceButtonSel.addClass('hideButton');
		if(_answered) {
			//this is the medal page
			if(_currentSlide === _numSlides + 1 &&  _questionType === 'open') {
				if(_correctAnswer) {
					$('.resourceArea .nextButton').removeClass('hideButton');
				}
				else {
					$('.resourceArea .closeButton').removeClass('hideButton');
				}
			}
			else {
				$('.resourceArea .closeButton').removeClass('hideButton');
			}
		}
		else {
			if(_revisiting) {
				//if its the last slide
				if(_currentSlide === _numSlides - 1) {
					//not open ended
					if( _questionType !== 'open') {
						$('.resourceArea .closeButton').removeClass('hideButton');
					}
					//answers to show
					else {
						if(_currentSlide > 0) {
							$('.resourceArea  .backButton').removeClass('hideButton');
						}
						$('.resourceArea  .nextButton').removeClass('hideButton');
					}
				}
				else if(_currentSlide === _numSlides) {
					$('.resourceArea  .closeButton, .resourceArea .backButton').removeClass('hideButton');
				}
				else {
					$('.resourceArea  .nextButton').removeClass('hideButton');
					if(_currentSlide > 0) {
						$('.resourceArea  .backButton').removeClass('hideButton');
					}
				}
			}
			else {
				//if its the first page, we DEF. have a next and no back
				if(_currentSlide === 0) {
					$('.resourceArea .nextButton').removeClass('hideButton');
				}
				
				//if its not the first page or the last page, we have both
				else if(_currentSlide > 0 && _currentSlide < _numSlides) {
					$('.resourceArea .nextButton,.resourceArea  .backButton').removeClass('hideButton');
				}

				//if its the last page, we have an answer button and a back
				else if(_currentSlide === _numSlides) {
					
					$('.resourceArea .answerButton').removeClass('hideButton');
					$('.resourceArea .backButton').removeClass('hideButton');
				}
			}
		}
	},

	addContent: function() {
		_speakerNameSel.empty();
		_resourceMessageSel.empty();
		//if they answered the question...
		if(_answered) {
			//if they got it right, give them a tangram
			if(_correctAnswer) {
				//first, congrats and show them the tangram piece
				if(_currentSlide === _numSlides + 1) {
					var npcLevel = $game.$npc.getNpcLevel();
					if(npcLevel < $game.$player.game.currentLevel) {
						_speak = _feedbackRight + ' Here, take ' + _numSeedsToAdd + ' seeds!';
						_resourceContentSel.empty().css('overflow','auto');
					}
					else {
						_speak = _feedbackRight + ' Here, take this puzzle piece, and ' + _numSeedsToAdd + ' seeds!';
						//show image on screen
						//get path from db, make svg with that
						var levelFolder = 'level' + ($game.$player.game.currentLevel + 1),
							imgPath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + levelFolder + '/' + _curResource.id + '.png';
						newImg = '<img src="' + imgPath + '" class="centerImage">';
						_resourceContentSel.html(newImg).css('overflow', 'hidden');
					}
					_speakerNameSel.text(_who + ': ');
					_resourceMessageSel.text(_speak);
				}
				//the next slide will show them recent answers
				else {
					_resourceContentSel.empty().css('overflow','auto');
					$game.$resources.showRecentAnswers();
				}
			}
		}
		else {
			_resourceContentSel.css('overflow', 'auto');
			if(_currentSlide === _numSlides) {
				var finalQuestion = '<p class="finalQuestion">Q: ' + _curResource.question + '</p>';
				//show their answer and the question, not the form
				if(_revisiting) {
					$game.$resources.showRecentAnswers();
				}
				else {
					// _speak = _curResource.prompt;
					// _speakerNameSel.text(_who + ': ');
					// _resourceMessageSel.text(_speak);
					var inputBox = null;
					if(_questionType === 'multiple') {
						inputBox = '<form><input name="resourceMultipleChoice" type ="radio" value="' + _curResource.possibleAnswers[0] + '"> ' + _curResource.possibleAnswers[0] + '</input>' +
									'<br><input name="resourceMultipleChoice" type ="radio" value="' + _curResource.possibleAnswers[1] + '"> ' + _curResource.possibleAnswers[1] + '</input>' +
									'<br><input name="resourceMultipleChoice" type ="radio" value="' + _curResource.possibleAnswers[2] + '"> ' + _curResource.possibleAnswers[2] + '</input>' +
									'<br><input name="resourceMultipleChoice" type ="radio" value="' + _curResource.possibleAnswers[3] + '"> ' + _curResource.possibleAnswers[3] + '</form';
					}
					else if(_questionType === 'open') {
						inputBox = '<form><textarea placeholder="type your answer here..."></textarea></form>';
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
					_resourceContentSel.html(finalQuestion + inputBox);
				}
			}
			else{
				var content = $('.resourceStage .pages .page').get(_currentSlide).innerHTML;
				_resourceContentSel.html(content);
			}
		}
	},

	showRecentAnswers: function() {
		//alway show player's answer with a lock icon (make public button)
		//if it is public, just show eye icon
		var finalQuestion = '<p class="finalQuestion">Q: ' + _curResource.question + '</p><div class="publicAnswers">',
			displayAnswers = '<ul>',
			yourAnswer = $game.$player.getAnswer(_curResource.id),
			rightOne = yourAnswer.answers.length - 1;

		console.log(yourAnswer);
		displayAnswers += '<li class="playerAnswers yourAnswer"><p><span>' + 'You said' + ': </span>' + yourAnswer.answers[rightOne] + '</p>';
		if(yourAnswer.madePublic) {
			displayAnswers += '<i class="icon-unlock publicButton icon-large"></i>';
		} else {
			displayAnswers += '<button class="btn btn-info publicButton" data-npc="'+ _curResource.id +'">Make Public</button>';
		}
		displayAnswers += '</li>';
		if(_curResource.playerAnswers) {
			var recentAnswers = _curResource.playerAnswers,
				spot = recentAnswers.length;

			while(--spot > -1) {
				//double check
				if(recentAnswers[spot].madePublic && recentAnswers[spot].id != $game.$player.id) {
					displayAnswers += '<li class="playerAnswers"><p><span>' + recentAnswers[spot].name + ': </span>' + recentAnswers[spot].answer + '</p><button class="btn btn-success pledgeButton" data-player="'+ recentAnswers[spot].id +'">Seed It!</button></li>';
				}
			}
			displayAnswers += '</ul></div>';
			_speak = 'Here are some recent answers by your peers: ';
		} else {
			_speak = 'Congrats! You were the first to answer.';
			displayAnswers += '<p>** More answers from your peers will appear shortly.  Be sure to check back. **</p>';
		}
			_speakerNameSel.text(_who + ': ');
			_resourceMessageSel.text(_speak);
			_resourceContentSel.html(finalQuestion + displayAnswers);
	},

	hideResource: function() {
		_resourceAreaSel.fadeOut(function() {
			$game.$resources.isShowing = false;
			_resourceButtonSel.addClass('hideButton');
			// _resourceAreaSel.removeClass('patternBg1');
		});

		//if the resource was being displayed from the inventory, keep it up.
		if(_inventory) {
			_inventorySel.fadeIn(function() {
				_inventory = false;
				if($game.$gnome.isSolving) {
					$game.$player.inventoryShowing = false;
				}
				else {
					$game.$player.inventoryShowing = true;
				}
				
			});
		}
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

				//hide resource
				$game.$resources.hideResource();
				$('.speechBubble .speakerName').text(_who + ': ');
				$('.speechBubble .message').text(_speak);

				$('.speechBubble').fadeIn(function() {
					$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,4000);
				});
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
			if(response.length < 1) {
				$game.$resources.popupCheck();
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
			_numSeedsToAdd = $game.$player.answerResource(true,_curResource.id, response, npcLevel);

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
				instanceName: $game.$player.game.instanceName
			};
			//hack to not include demo users
			if($game.$player.game.name !== 'Demo') {
				ss.rpc('game.npc.saveResponse', newAnswer);
			}
		}
		else {
			_numSeedsToAdd = $game.$player.answerResource(false,_curResource.id, response, npcLevel);
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
		_curResource = _resources[stringId];
		_curResource.playerAnswers.push(data);
	},

	popupCheck: function() {
		$('.check button').removeClass('hideButton');
		$('.check').show();
	}
};
