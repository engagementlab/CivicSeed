
var _loaded = false,
	_allNpcs = [],
	_index = 0;
	_currentSlide = 0;
	_numSlides = 0;
	_curNpc = null;
	__speak = null;
	_answered = false;
	_who = null;
	_currentQuestion = 0;
	_correctAnswer = false;

$game.$npc = {

	ready: false,
	hideTimer: null,
	isResource: false,
	isChat: false,

	init: function() {
		//load all the npc info from the DB store it in an array
		//where the index is the id of the npc / mapIndex
		ss.rpc('game.npc.getNpcs', function(response) {
			//iterate through repsonses, create a key
			//with the id and value is the object
			for(var i = 0; i < response.length; i += 1) {
				var stringId = String(response[i].id);
				_allNpcs[stringId] = response[i];
				_allNpcs[stringId].counter = Math.floor(Math.random()*55);
				_allNpcs[stringId].currentFrame = 0;
			}
			_loaded = true;
			$game.$npc.ready = true;
		});
	},

	show: function() {
		if(!$game.$npc.isResource && !$game.$npc.isChat) {
			//if this is false, it means we clicked the npc square
			//that is the top one (which doesn't have a unique id in our list
			//but rather corresponds to the one below it)
			
			if($game.$player.currentLevel === _curNpc.level) {
				_currentSlide = 0;
				$game.$npc.showPrompt(0);
			}
			else {
				$game.$npc.isChat = true;
				$game.$npc.showRandom();
			}
		}
		
	},
	//returns local x,y grid data based on mouse location
	showPrompt: function(index) {

		_speak = _curNpc.dialog.prompts[index];
		$('.speechBubble').css('height',55);
		if(index === 0) {
			$game.$npc.isResource = true;
			buttons = '<button class="btn btn-success">Yes</button><button class="btn btn-danger">No</button>';
			_speak += buttons;
			$('.speechBubble').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p>').slideDown(function() {
				$(".speechBubble .btn-success").bind("click", (function () {
					$game.$npc.showResource();
				}));
				$(".speechBubble .btn-danger").bind("click", (function () {
					$game.$npc.hideChat();
				}));
			});
		}
		else {
			$game.$npc.isChat = true;
			$('.speechBubble').css('height',40);
			$('.speechBubble').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p>').slideDown(function() {
				$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,5000);
			});
		}
					
	},

	showRandom: function() {
		var ran = Math.floor(Math.random() * _curNpc.dialog.random.length),
		_speak = _curNpc.dialog.random[ran];
		
		$('.speechBubble').css('height',40);
		$('.speechBubble').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p>').slideDown(function() {
			$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,5000);
		});
	},

	showResource: function() {

		$('.speechBubble').slideUp(function() {
			$('.speechBubble').empty();
			$game.$npc.isChat = false;
			$game.$npc.isResource = true;
			$(".speechBubble .btn-success").unbind("click");
			$(".speechBubble .btn-danger").unbind("click");

			//ready to show the resource now
			//_speak = _curNpc.dialog.questions[0];
			$('.resourceArea').empty();
			$game.$npc.addContent();
			$game.$npc.addButtons();
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
				$game.$npc.hideResource();
			}));
		}
		else {
			//if its the first page, we DEF. have a next and no back
			if(_currentSlide === 0) {
				$('.resourceArea').append('<button class="btn btn-primary nextButton">Next</button>');
				$('.nextButton').text('Next');
				$(".nextButton").bind("click", (function () {
					$game.$npc.nextSlide();
				}));
			}
			
			//if its not the first page or the last page, we have both
			else if(_currentSlide > 0 && _currentSlide < _numSlides) {
				$('.resourceArea').append('<button class="btn btn-primary nextButton">Next</button><button class="btn btn-inverse backButton">Back</button>');
				$('.nextButton').text('Next');
				$('.backButton').text('Back');
				$(".nextButton").bind("click", (function () {
					$game.$npc.nextSlide();
				}));
				$(".backButton").bind("click", (function () {
					$game.$npc.previousSlide();
				}));
			}

			//if its the last page, we have an answer button and a back
			else if(_currentSlide === _numSlides) {
				$('.resourceArea').append('<button class="btn btn-success answerButton">Answer</button><button class="btn btn-inverse backButton">Back</button>');
				$('.answerButton').text('Answer');
				$('.backButton').text('Back');
				$(".answerButton").bind("click", (function () {
					$game.$npc.submitAnswer();
				}));
				$(".backButton").bind("click", (function () {
					$game.$npc.previousSlide();
				}));
			}
		}
	},

	addContent: function() {

		//add the close button
		
		$('.resourceArea').append('<a href="#" style="font-size: 24px;"><i class="icon-remove-sign icon-large"></i></a>');
		$(".resourceArea a i").bind("click", (function () {
			$game.$npc.hideResource();
			return false;
		}));
		//add the answer form
		if(_answered) {
	
			if(_correctAnswer) {
				_speak = _curNpc.dialog.responses[0];
			}
			else {
				_speak = _curNpc.dialog.responses[1];
			}
			$('.resourceArea').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p>');
		}
		else {
			if(_currentSlide === _numSlides) {
				_speak = _curNpc.dialog.prompts[2];
				var finalQuestion = _curNpc.dialog.questions[_currentQuestion],
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
			$game.$npc.isResource = false;
		});
	},

	hideChat: function() {
		
		clearTimeout($game.$npc.hideTimer);
		$('.speechBubble').slideUp(function() {
			$('.speechBubble').empty();
			$game.$npc.isChat = false;
			$game.$npc.isResource = false;
			$(".speechBubble .btn-success").unbind("click");
			$(".speechBubble .btn-danger").unbind("click");
		});
	},

	//super ghetto hack to go back a page
	previousSlide: function() {
		_currentSlide -= 2;
		$game.$npc.nextSlide();
	},

	nextSlide: function() {
		
		_currentSlide += 1;

		//wipe the resource area
		$('.resourceArea').empty();

		$game.$npc.addContent();

		$game.$npc.addButtons();

		//add content (depending on what it is )
		
		
		
	},

	submitAnswer: function() {
		//if the answer is true, give them something!
		if(true) {
			//do something in db and stuff
			_correctAnswer = true;
		}
		else {
			_correctAnswer = false;
		}
		_answered = true;
		$game.$npc.nextSlide();
		//otherwise tell them they are wrong, stay on form page


	},

	selectNpc: function(i) {
		_index = i;
		var stringId = String(_index);
		_curNpc = _allNpcs[stringId];

		if(!_curNpc) {
				_index += $game.TOTAL_WIDTH;
				stringId = String(_index);
				_curNpc = _allNpcs[stringId];
			}

		_who = _allNpcs[stringId].name;

		if($game.$player.currentLevel === _curNpc.level) {
			_currentQuestion =  Math.floor(Math.random() * _curNpc.dialog.questions.length),
			$('.resourceStage').empty();
			$('.resourceStage').load(_curNpc.resource.url,function() {
				_numSlides = $('.resourceStage .pages > .page').length;
			});
		}
		
	},

	animateFrame: function () {
		data = {};

		for(var i = 0; i < $game.onScreenNpcs.length; i += 1) {
			var curId = $game.onScreenNpcs[i];
			_allNpcs[curId].counter += 1;

			if(_allNpcs[curId].counter >= 56) {
				_allNpcs[curId].counter = 0;
				
				data.srcX = _allNpcs[curId].spriteMap[0].x,
				data.srcY = _allNpcs[curId].spriteMap[0].y,
				data.x = _allNpcs[curId].id % $game.TOTAL_WIDTH,
				data.y = Math.floor(_allNpcs[curId].id / $game.TOTAL_WIDTH);

				$game.$renderer.renderNpc(data);
			}

			else if(_allNpcs[curId].counter === 24) {
				data.srcX = _allNpcs[curId].spriteMap[1].x,
				data.srcY = _allNpcs[curId].spriteMap[1].y,
				data.x = _allNpcs[curId].id % $game.TOTAL_WIDTH,
				data.y = Math.floor(_allNpcs[curId].id / $game.TOTAL_WIDTH);

				$game.$renderer.renderNpc(data);
			}
			else if(_allNpcs[curId].counter === 28) {
				data.srcX = _allNpcs[curId].spriteMap[2].x,
				data.srcY = _allNpcs[curId].spriteMap[2].y,
				data.x = _allNpcs[curId].id % $game.TOTAL_WIDTH,
				data.y = Math.floor(_allNpcs[curId].id / $game.TOTAL_WIDTH);

				$game.$renderer.renderNpc(data);
			}
			else if(_allNpcs[curId].counter === 32) {
				data.srcX = _allNpcs[curId].spriteMap[3].x,
				data.srcY = _allNpcs[curId].spriteMap[3].y,
				data.x = _allNpcs[curId].id % $game.TOTAL_WIDTH,
				data.y = Math.floor(_allNpcs[curId].id / $game.TOTAL_WIDTH);

				$game.$renderer.renderNpc(data);
			}
			
		}
	},

	render: function(tile) {
		//get npc data based on tileStateVal to string
		var data = {};
			stringId = String(tile.tileState);
		
		data.srcX = _allNpcs[stringId].spriteMap[0].x,
		data.srcY = _allNpcs[stringId].spriteMap[0].y,
		data.x = tile.x,
		data.y = tile.y;
		$game.$renderer.renderNpc(data);
	}

};
