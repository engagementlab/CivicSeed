var _info = null,
	_renderInfo = null,
	_onScreen = false;

$game.$gnome = {

	index: 0,
	numSteps: 64,
	counter: Math.floor(Math.random() * 64),
	curFrame: 0,
	numFrames: 4,
	
	init: function() {
		ss.rpc('game.npc.loadGnome', function(response) {
			$game.$gnome.index = response.id;

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
				alert('follow me!');
			}
			

			//then show riddle

			//if they have resources but not the right ones provide hint

			//if they have the right ones prompt to answer
		
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
