
var _loaded = false,	
	_resources = [],
	_currentSlide = 0,
	_numSlides = 0,
	_speak = null,
	_answered = false,
	_who = null,
	_correctAnswer = false,
	_curResource = null;

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

	loadResource: function(who, index) {
		_who = who,
		_answered = false,
		_currentSlide = 0;

		$('.resourceStage').empty();
		var stringId = String(index);
		_curResource = _resources[stringId];
		var url = _curResource.url;
		$('.resourceStage').load(url,function() {
			_numSlides = $('.resourceStage .pages > .page').length;
		});
	},

	showResource: function() {
		$('.speechBubble').slideUp(function() {
			$('.speechBubble').empty();
			$(".speechBubble .btn-success").unbind("click");
			$(".speechBubble .btn-danger").unbind("click");

			//ready to show the resource now
			//_speak = _curResource.dialog.questions[0];
			$('.resourceArea').empty();
			$game.$resources.addContent();
			$game.$resources.addButtons();
			$('.resourceArea').slideDown();
		});
		
	},

	//determine which buttons to put on the resource area
	//based on page number, if its a form yet, etc.
	//buttons: next, back, answer, close
	//bind functionality

	//assume that the buttons were removed before
		
		

	//if its been answered, we have a close button
	addButtons: function() {

		if(_answered) {
			$('.resourceArea').append('<button class="btn btn-primary closeButton">Close</button>');
			$('.closeButton').text('Close');
			$(".closeButton").bind("click", (function () {
				$game.$resources.hideResource();
			}));
		}
		else {
			//if its the first page, we DEF. have a next and no back
			if(_currentSlide === 0) {
				$('.resourceArea').append('<button class="btn btn-primary nextButton">Next</button>');
				$('.nextButton').text('Next');
				$(".nextButton").bind("click", (function () {
					$game.$resources.nextSlide();
				}));
			}
			
			//if its not the first page or the last page, we have both
			else if(_currentSlide > 0 && _currentSlide < _numSlides) {
				$('.resourceArea').append('<button class="btn btn-primary nextButton">Next</button><button class="btn btn-inverse backButton">Back</button>');
				$('.nextButton').text('Next');
				$('.backButton').text('Back');
				$(".nextButton").bind("click", (function () {
					$game.$resources.nextSlide();
				}));
				$(".backButton").bind("click", (function () {
					$game.$resources.previousSlide();
				}));
			}

			//if its the last page, we have an answer button and a back
			else if(_currentSlide === _numSlides) {
				$('.resourceArea').append('<button class="btn btn-success answerButton">Answer</button><button class="btn btn-inverse backButton">Back</button>');
				$('.answerButton').text('Answer');
				$('.backButton').text('Back');
				$(".answerButton").bind("click", (function () {
					$game.$resources.submitAnswer();
				}));
				$(".backButton").bind("click", (function () {
					$game.$resources.previousSlide();
				}));
			}
		}
	},

	addContent: function() {

		//add the close button
		
		$('.resourceArea').append('<a href="#" style="font-size: 24px;"><i class="icon-remove-sign icon-large"></i></a>');
		$(".resourceArea a i").bind("click", (function () {
			$game.$resources.hideResource();
			return false;
		}));
		//add the answer form
		if(_answered) {
	
			if(_correctAnswer) {
				_speak = _curResource.responses[0];
				$('.resourceArea').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p><p><img src="img/resource'+_curResource.resource.tangram+'.png"></p>');
			}
			else {
				_speak = _curResource.responses[1];
				$('.resourceArea').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p>');
			}
			
		}
		else {
			if(_currentSlide === _numSlides) {
				_speak = _curResource.prompt;
				var finalQuestion = _curResource.question,
					inputBox = '<form><input></input></form>';
				$('.resourceArea').append('<p><span class="speakerName">'+_who+': </span>'+_speak+'</p><p>'+finalQuestion+'</p>'+inputBox);
			}
			else{
				var content = $('.resourceStage .pages .page').get(_currentSlide).innerHTML;
				$('.resourceArea').append(content);
			}
		}
	},

	hideResource: function() {
		$('.resourceArea').slideUp(function() {
			$('.resourceArea p').remove();
			$('.resourceArea h2').remove();
			$game.$resources.isShowing = false;
		});
	},

	//super ghetto hack to go back a page
	previousSlide: function() {
		_currentSlide -= 2;
		$game.$resources.nextSlide();
	},

	nextSlide: function() {
		
		_currentSlide += 1;

		//wipe the resource area
		$('.resourceArea').empty();

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


	}


	
};
