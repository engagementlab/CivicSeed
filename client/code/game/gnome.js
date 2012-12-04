var _info = null,
	_renderInfo = null,
	_onScreen = false,
	_messages = null,
	_currentMessage = 0,
	_currentSlide = 0,
	_promptNum = 0;

$game.$gnome = {

	index: 0,
	numSteps: 64,
	counter: Math.floor(Math.random() * 64),
	curFrame: 0,
	numFrames: 4,
	dialog: null,
	name: null,
	isChat: false,
	isShowing: false,
	
	init: function() {
		ss.rpc('game.npc.loadGnome', function(response) {
			$game.$gnome.index = response.id,
			$game.$gnome.dialog = response.dialog,
			$game.$gnome.name = response.name;

			_info = {
				x: response.x,
				y: response.y
			};

			_renderInfo = {
				kind: 'gnome',
				curX: response.x,
				curY: response.y,
				prevX: response.x,
				prevY: response.y
			};

			$game.$gnome.getMaster();

		});
	},

	clear: function() {
		$game.$renderer.clearGnome(_renderInfo);
	},
	
	getRenderInfo: function() {
		//since the gnome is stationary, we can hard code his location

		if(_onScreen) {
			return _renderInfo;
		}
		else {
			return false;
		}
	},

	update: function() {

		if(!$game.inTransit) {
			if(_onScreen) {
				$game.$gnome.idle();
			}
		}
		else if($game.inTransit) {
			$game.$gnome.getMaster();
		}

	},

	getMaster: function() {
		var loc = $game.masterToLocal(_info.x, _info.y);
		if(loc) {
			var prevX = loc.x * $game.TILE_SIZE,
				prevY = loc.y * $game.TILE_SIZE,
				curX = loc.x * $game.TILE_SIZE,
				curY = loc.y * $game.TILE_SIZE;
			
			_renderInfo.prevX = prevX,
			_renderInfo.prevY = prevY;

			_renderInfo.curX = curX,
			_renderInfo.curY = curY;
			_onScreen = true;
		}
		else {
			_onScreen = false;
		}
	},

	idle: function() {
		/*
		_counter += 1;
		
		if(_counter >= 56) {
			_counter = 0,
			_renderInfo.srcX = 0,
			_renderInfo.srcY = _info.spriteMap[0].y;
		}

		else if(_counter == 24) {
			_renderInfo.srcX = 32;
			_renderInfo.srcY = _info.spriteMap[0].y;
		}

		else if(_counter == 28) {
			_renderInfo.srcX = 64;
			_renderInfo.srcY = _info.spriteMap[0].y;
		}

		else if(_counter == 32) {
			_renderInfo.srcX = 96;
			_renderInfo.srcY = _info.spriteMap[0].y;
		}
	*/
	},

	show: function() {
		
		//decide what to show based on the player's current status
				
		//if they are in a level 0-4
		if($game.$player.currentLevel < 5) {

			//show instructions first
			if($game.$player.game.gnomeState === 0) {
				_messages = $game.$gnome.dialog.level[$game.$player.currentLevel].instructions;
				_currentMessage = 0;
				$game.$gnome.showChat();

			}
			//if they have gotten the instructions / intro dialog, show them the riddle
			//and put it in the inventory...? (prompt, resource (riddle first screen, outline next))
			else if($game.$player.game.gnomeState === 1) {
				$game.$gnome.showPrompt(0);
			}
			//if they have the riddle, then provide a random hint, refer them to inventory is one
			else if($game.$player.game.gnomeState === 2) {
				var curHint = 0;
				console.log($game.$player.game.inventory);
				if($game.$player.game.inventory.length > 0) {
					curHint = 1;
				}
				//else hint 1
				_messages = [];
				_messages.push($game.$gnome.dialog.level[$game.$player.currentLevel].hint[curHint]);
				_currentMessage = 0;
				$game.$gnome.showChat();
			}
			//if they have gathered the right resources, prompt to answer riddle
			else if($game.$player.gnome.gnomeState === 3) {
				$game.$gnome.showPrompt(1);
			}
		
		}
		//they have beaten the INDIVIDUAL part of the game
		else {
			//if they have beat level 4
			//but comm. meter is <

			//and comm. meter is >

			//and final task is solved
		}

		
	},

	showTangram: function() {
		var file = '/img/game/tangrams/puzzle' + $game.$player.currentLevel + '.png';
		
	},

	showChat: function() {
		$game.$gnome.isChat = true;
		$game.$gnome.nextChatContent();
	},
	hideChat: function() {
		$('.speechBubble').slideUp(function() {
			$('.speechBubble button').addClass('hideButton');
			$('.speechBubble .closeChatButton').unbind('click');
			$game.$gnome.isChat = false;

			//save that the player has looked at the instructions
			if($game.$player.game.gnomeState === 0) {
				$game.$player.game.gnomeState = 1;
			}

		});
		
	},
	addChatContent: function() {
		
		$('.speechBubble .nextChatButton').removeClass('hideButton');
		$('.speechBubble .speakerName').text($game.$gnome.name+": ");
		$('.speechBubble .message').text(_messages[_currentMessage]);

		//first item, then drop
		if(_currentMessage === 0) {
			$('.speechBubble').slideDown(function() {
				$(".speechBubble .nextChatButton").bind('click', (function () {
					$game.$gnome.nextChatContent();
				}));
			});
		}
		if(_currentMessage === _messages.length - 1) {
			$(".speechBubble .nextChatButton").unbind('click').addClass('hideButton');

			$(".speechBubble .closeChatButton").removeClass('hideButton').bind("click", (function () {
				$game.$gnome.hideChat();
			}));
		}
	},

	nextChatContent: function() {
		//show the next message if there are more in the bag
		if(_currentMessage < _messages.length) {
			$game.$gnome.addChatContent();
			_currentMessage += 1;
		}
	},

	showPrompt: function(p) {
		$game.$gnome.isChat = true;
		_speak =  $game.$gnome.dialog.level[$game.$player.currentLevel].riddle.prompts[p];

		$('.speechBubble .speakerName').text($game.$gnome.name+': ');
		$('.speechBubble .message').text(_speak);
		$('.speechBubble .yesButton, .speechBubble .noButton').removeClass('hideButton');
		$('.speechBubble').slideDown(function() {
			$(".speechBubble .yesButton").bind("click", (function () {
				$game.$gnome.showRiddle(p);
			}));
			$(".speechBubble .noButton").bind("click", (function () {
				$game.$gnome.hideChat();
			}));
		});
	},

	inventoryShowRiddle: function() {
		//hide the inventory
		$('.inventory').slideUp(function() {
			$game.$player.inventoryShowing = false;
			$game.$gnome.isChat = true;
			$game.$gnome.showRiddle(0);
		});
	},

	showRiddle: function(num) {
		_promptNum = num;
		$game.$gnome.addContent();
		$game.$gnome.addButtons();
		_currentSlide = 0;
		
		$('.speechBubble').slideUp(function() {
			$('.speechBubble button').addClass('hideButton');
			$('.speechBubble .yesButton').unbind('click');
			$('.speechBubble .noButton').unbind('click');
			$('.gnomeArea').slideDown(function() {
				$game.$gnome.isShowing = true;
			});
		});
		
	},

	addButtons: function() {
		$('.gnomeArea button').addClass('hideButton');

		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				$('.gnomeArea .nextButton').removeClass('hideButton');
			}
			else if(_currentSlide === 1) {
				$('.gnomeArea .closeButton').removeClass('hideButton');
				$('.gnomeArea .backButton').removeClass('hideButton');
			}
		}
		else {
			if(_currentSlide === 0) {

			}
			else if(_currentSlide === 1) {

			}
			else {

			}
		}
	},

	nextSlide: function() {
		_currentSlide += 1;
		$game.$gnome.addContent();
		$game.$gnome.addButtons();
	},

	previousSlide: function() {
		_currentSlide -= 1;
		$game.$gnome.addContent();
		$game.$gnome.addButtons();
	},

	addContent: function() {

		
		$('.gnomeArea .speakerName').text($game.$gnome.name+': ');
		
		//if _promptNum is 0, then it is the just showing the riddle and tangram
		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				$('.gnomeArea .message').text('here is your next riddle whale thing.');
				$('.gnomeContent').html('<p>'+$game.$gnome.dialog.level[$game.$player.currentLevel].riddle.sonnet+'</p>');
			}
			else {
				//show them a different version if they already posses it
				
				if($game.$player.game.gnomeState > 1) {
					$('.gnomeArea .message').text('Here is the outline to view again.');
				}
				else {
					$('.gnomeArea .message').text('take this tangram outline, you can view it in the inventory.');
					//add this tangram outline to the inventory
					var file = 'puzzle' + $game.$player.currentLevel;
					$('.inventory').prepend('<div class="inventoryItem '+file+'"><img src="img\/game\/tangram\/'+file+'small.png"></div>');
					$('.'+ file).bind('click', $game.$gnome.inventoryShowRiddle);
					//update gnomeState
					$game.$player.game.gnomeState = 2;
				}
				
				$('.gnomeContent').html('<p><img src="img/game/tangram/puzzle'+$game.$player.currentLevel+'.png"></p>');
				
			}
		}
		//they are solving it, so riddle interface and stuff
		else {
			$('.inventory').slideDown(function() {
				$game.$player.inventoryShowing = true;
			});
		}
	},

	hideResource: function() {
		$('.gnomeArea').slideUp(function() {
			$game.$gnome.isShowing = false;
			$('.gnome button').addClass('hideButton');
			$game.$gnome.isChat = false;
		});
		$('.inventory').slideUp(function() {
			$game.$player.inventoryShowing = false;
		});	
	}
/*
	hideChat: function() {
		
		clearTimeout($game.$gnome.hideTimer);
		$('.speechBubble').slideUp(function() {
			$('.speechBubble').empty();
			$game.$gnome.isChat = false;
			$game.$resources.isShowing = false;
			$(".speechBubble .btn-success").unbind("click");
			$(".speechBubble .btn-danger").unbind("click");
		});
	},

	

	//choose prompt based on PLAYERs memory of interaction
	//there are 3 prompts (0: fresh visit, 1: visited, wrong answer, 2: already answered
	showPrompt: function() {
		var promptNum = $game.$player.getPrompt(_curgnome.id);
		_speak = _curgnome.dialog.prompts[promptNum];
		$('.speechBubble').css('height',55);
		buttons = '<button class="btn btn-success">Yes</button><button class="btn btn-danger">No</button>';
		_speak += buttons;
		$('.speechBubble').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p>').slideDown(function() {
			$(".speechBubble .btn-success").bind("click", (function () {
				$game.$resources.showResource(promptNum);
			}));
			$(".speechBubble .btn-danger").bind("click", (function () {
				$game.$gnome.hideChat();
			}));
		});
	},

	showRandom: function() {
		var ran = Math.floor(Math.random() * _curgnome.dialog.random.length),
		_speak = _curgnome.dialog.random[ran];
		
		$('.speechBubble').css('height',40);
		$('.speechBubble').append('<p><span class="speakerName">'+_who+': </span>'+ _speak +'</p>').slideDown(function() {
			$game.$gnome.hideTimer = setTimeout($game.$gnome.hideChat,5000);
		});
	},

	selectgnome: function(i) {
		_index = i;
		var stringId = String(_index);
		_curgnome = _allgnomes[stringId];

		if(!_curgnome) {
			_index += $game.TOTAL_WIDTH;
			stringId = String(_index);
			_curgnome = _allgnomes[stringId];
		}

		_who = _allgnomes[stringId].name;

		if($game.$player.currentLevel === _curgnome.level) {

			//here we will tell the resoure object to clear old stuff,
			//and tell it what to load (and who it corresponds to)
			$game.$resources.loadResource(_who, _curgnome.id, false);
			_resourceOnDeck = true;
		}
		else {
			_resourceOnDeck = false;
		}
		
	}
	*/
};
