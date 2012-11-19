
var _loaded = false,
	_allNpcs = {},
	_currentSlide = 0.
	_numSlides = 0,
	_curNpc = null,
	_speak = null,
	_answered = false,
	_who = null,
	_currentQuestion = 0,
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
			_allNpcs = {};
			$.each(response, function(key, npc) {
				$game.$npc.addNpc(npc);
			});
			_loaded = true;
			$game.$npc.ready = true;
		});
	},

	addNpc: function(npc) {
		var newbie = $game.$npc.createNpc(npc);
		newbie.getMaster();
		_allNpcs[npc.id] = newbie;

	},

	update: function() {
		//if is moving, move
		$.each(_allNpcs, function(key, npc) {
			npc.update();
		});
	},

	clear: function() {
		//if is moving, move
		$.each(_allNpcs, function(key, npc) {
			npc.clear();
		});
	},

	getRenderInfo: function() {
		var all = [];
		$.each(_allNpcs, function(key, npc) {
			var temp = npc.getRenderInfo();
			if(temp) {
				all.push(temp);
			}
		});
		return all;
	},

	createNpc: function(npc) {

		var npcObject = {

			name: npc.name,
			id: npc.id,
			dialog: npc.dialog,
			level: npc.level,
			resource: npc.resource,
			onScreen: null,
			numSteps: 64,
			counter: Math.floor(Math.random() * 64),
			curFrame: 0,
			numFrames: 4,


			info: {
				x: npc.id % $game.TOTAL_WIDTH,
				y: Math.floor(npc.id / $game.TOTAL_WIDTH),
				spriteMap: npc.spriteMap
			},

			renderInfo: {
				prevX: (npc.id % $game.TOTAL_WIDTH) * $game.TILE_SIZE,
				prevY: (Math.floor(npc.id / $game.TOTAL_WIDTH)) * $game.TILE_SIZE,
				curX: (npc.id % $game.TOTAL_WIDTH) * $game.TILE_SIZE,
				curY: (Math.floor(npc.id / $game.TOTAL_WIDTH)) * $game.TILE_SIZE,
				srcX: 0,
				srcY: 0,
				isNpc: true
			},


			update: function() {

				if(!$game.inTransit) {
					npcObject.idle();
				}
				else if($game.inTransit) {
					npcObject.getMaster();
				}

			},

			getMaster: function() {
				var loc = $game.masterToLocal(npcObject.info.x, npcObject.info.y);
				if(loc) {
					var prevX = loc.x * $game.TILE_SIZE,
						prevY = loc.y * $game.TILE_SIZE,
						curX = loc.x * $game.TILE_SIZE,
						curY = loc.y * $game.TILE_SIZE;
					
					npcObject.renderInfo.prevX = prevX,
					npcObject.renderInfo.prevY = prevY;

					npcObject.renderInfo.curX = curX,
					npcObject.renderInfo.curY = curY;
					npcObject.onScreen = true;
				}
				else {
					npcObject.onScreen = false;
				}
			},

			idle: function() {
				npcObject.counter += 1;
				
				if(npcObject.counter >= 56) {
					npcObject.counter = 0,
					npcObject.renderInfo.srcX = 0,
					npcObject.renderInfo.srcY = npcObject.info.spriteMap[0].y;
				}

				else if(npcObject.counter == 24) {
					npcObject.renderInfo.srcX = 32;
					npcObject.renderInfo.srcY = npcObject.info.spriteMap[0].y;
				}

				else if(npcObject.counter == 28) {
					npcObject.renderInfo.srcX = 64;
					npcObject.renderInfo.srcY = npcObject.info.spriteMap[0].y;
				}

				else if(npcObject.counter == 32) {
					npcObject.renderInfo.srcX = 96;
					npcObject.renderInfo.srcY = npcObject.info.spriteMap[0].y;
				}

			},


			clear: function() {
				$game.$renderer.clearCharacter(npcObject.renderInfo);
			},

			getRenderInfo: function() {
				if(npcObject.onScreen) {
					return npcObject.renderInfo;
				}
				else {
					return false;
				}
			}

		};

		return npcObject;		
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
	
};
