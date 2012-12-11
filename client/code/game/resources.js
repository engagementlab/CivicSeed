
var _loaded = false,	
	_resources = [],
	_currentSlide = 0,
	_numSlides = 0,
	_speak = null,
	_answered = false,
	_who = null,
	_correctAnswer = false,
	_curResource = null,
	_revisiting = false,
	_inventory = false;

$game.$resources = {

	isShowing: false,
	

	init: function() {
		ss.rpc('game.npc.getResources', function(response) {
			//iterate through repsonses, create a key
			//with the id and value is the object
			_allNpcs = {};
			$.each(response, function(key, resource) {
				var stringId = String(resource.id);
				_resources[stringId] = resource;
			});
			_loaded = true;
		});
	},

	beginResource: function(e) {
		$game.$resources.loadResource(false, e.data.npc, true);
		_inventory = true;
		$game.$resources.isShowing = true;
		
	},

	loadResource: function(who, index, now) {
		_who = who,
		_answered = false,
		_currentSlide = 0;

		$('.resourceStage').empty();
		var stringId = String(index);
		_curResource = _resources[stringId];
		var url = _curResource.url;
		$('.resourceStage').load(url,function() {
			_numSlides = $('.resourceStage .pages > .page').length;
			if(now) {
				$game.$resources.showResource(2);
			}
		});
	},

	showResource: function(num) {
		//if they already got it right, then don't have answer form, but show answer
		if(num === 2) {
			_revisiting = true;
		}

		$('.speechBubble').slideUp(function() {
			$('.speechBubble button').addClass('hideButton');
			$(".speechBubble .yesButton").unbind("click");
			$(".speechBubble .noButton").unbind("click");

			//ready to show the resource now
			//_speak = _curResource.dialog.questions[0];
			$('.resourceArea .dialog > span, .resourceArea .resourceContent').empty();
			$game.$resources.addContent();
			$game.$resources.addButtons();
			$('.inventory').slideUp(function() {
				$game.$player.inventoryShowing = false;
				$('.resourceArea').slideDown();
			});
			
		});
		
	},

	addButtons: function() {
		$('.resourceArea button').addClass('hideButton');
		
		if(_answered) {
			$('.resourceArea .closeButton').removeClass('hideButton');
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
				if(_revisiting) {
					$('.resourceArea .closeButton').removeClass('hideButton');
				}
				else {
					$('.resourceArea .answerButton').removeClass('hideButton');
				}
				$('.resourceArea .backButton').removeClass('hideButton');
			}
		}
	},

	addContent: function() {

		//add the answer form
		if(_answered) {
	
			if(_correctAnswer) {
				_speak = _curResource.responses[0];
				$('.resourceArea .speakerName').text(_who);
				$('.resourceArea .message').text(_speak);
				//show image on screen
				//get path from db, make svg with that
				var newSvg = '<svg><path d="'+_curResource.shape.path+'" fill="' + _curResource.shape.fill + '" transform = "translate(200,200)"</path></svg>';
				$('.resourceContent').html(newSvg);
			}
			else {
				_speak = _curResource.responses[1];
				$('.resourceArea .speakerName').text(_who);
				$('.resourceArea .message').text(_speak);
				$('.resourceContent').empty();
			}
			
		}
		else {
			if(_currentSlide === _numSlides) {
				
				var finalQuestion = '<p>' + _curResource.question + '</p>';
				//show their answer and the question, not the form
				if(_revisiting) {
					playerAnswer = '<p><span class=\'speakerName\'>Your Answer: </span>'+$game.$player.getAnswer(_curResource.id) + '</p>';
					$('.resourceContent').html(finalQuestion + playerAnswer);
				}
				else {
					_speak = _curResource.prompt;
					$('.resourceArea .speakerName').text(_who);
					$('.resourceArea .message').text(_speak);
					var inputBox = '<form><input></input></form>';
					$('.resourceContent').html(finalQuestion + inputBox);
				}
					
			}
			else{
				var content = $('.resourceStage .pages .page').get(_currentSlide).innerHTML;
				$('.resourceContent').html(content);
			}
		}
	},

	hideResource: function() {
		$('.resourceArea').slideUp(function() {
			$game.$resources.isShowing = false;
			$('.resourceArea button').addClass('hideButton');
		});

		//if the resource was being displayed from the inventory, keep it up.
		if(_inventory) {
			$('.inventory').slideDown(function() {
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

		//wipe the resource area

		$game.$resources.addContent();

		$game.$resources.addButtons();
	
	},

	submitAnswer: function() {
	
		//get the answer from the field
		var response = $('.resourceArea input').val();
		
		if(response === _curResource.answer) {
			//do something in db and stuff
			$game.$player.answerResource(true,_curResource.id, response);
			_correctAnswer = true;
		}
		else {
			$game.$player.answerResource(false,_curResource.id, response);
			_correctAnswer = false;
		}
		_answered = true;
		$game.$resources.nextSlide();
		//otherwise tell them they are wrong, stay on form page
	},

	getShape: function(id) {
		var stringId = String(id);
		return _resources[stringId].shape;
	}


	
};
