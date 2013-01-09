
var _loaded = false,
	_allNpcs = {},
	_curNpc = null,
	_speak = null,
	_who = null,
	_resourceOnDeck = null;

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

	getName: function(id) {
		var stringId = String(id);
		return _allNpcs[stringId].name;
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
				spriteY: npc.spriteY
			},

			renderInfo: {
				prevX: (npc.id % $game.TOTAL_WIDTH) * $game.TILE_SIZE,
				prevY: (Math.floor(npc.id / $game.TOTAL_WIDTH)) * $game.TILE_SIZE,
				curX: (npc.id % $game.TOTAL_WIDTH) * $game.TILE_SIZE,
				curY: (Math.floor(npc.id / $game.TOTAL_WIDTH)) * $game.TILE_SIZE,
				srcX: 0,
				srcY: 0,
				kind: 'npc'
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
					npcObject.renderInfo.srcY = npcObject.info.spriteY;
				}

				else if(npcObject.counter == 24) {
					npcObject.renderInfo.srcX = 32;
					npcObject.renderInfo.srcY = npcObject.info.spriteY;
				}

				else if(npcObject.counter == 28) {
					npcObject.renderInfo.srcX = 64;
					npcObject.renderInfo.srcY = npcObject.info.spriteY;
				}

				else if(npcObject.counter == 32) {
					npcObject.renderInfo.srcX = 96;
					npcObject.renderInfo.srcY = npcObject.info.spriteY;
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
			$game.$npc.isChat = false;
			$game.$resources.isShowing = false;
			$('.speechBubble button').addClass('hideButton');
			$(".speechBubble .yesButton").unbind("click");
			$(".speechBubble .noButton").unbind("click");
		});
	},

	show: function() {
		//if there is no other stuff on screen, then show dialog
		
		if(!$game.$resources.isShowing && !$game.$npc.isChat) {
			if(_resourceOnDeck) {
				$game.$resources.isShowing = true;
				$game.$npc.showPrompt();
			}
			else {
				$game.$npc.isChat = true;
				$game.$npc.showRandom();
			}
		}
	},

	//choose prompt based on PLAYERs memory of interaction
	//there are 3 prompts (0: fresh visit, 1: visited, wrong answer, 2: already answered
	showPrompt: function() {
		var promptNum = $game.$player.getPrompt(_curNpc.id);
		_speak = _curNpc.dialog.prompts[promptNum];
		$('.speechBubble .speakerName').text(_who+': ');
		$('.speechBubble .message').text(_speak);
		$('.speechBubble .yesButton, .speechBubble .noButton').removeClass('hideButton');
		$('.speechBubble').slideDown(function() {
			$(".speechBubble .yesButton").bind("click", (function () {
				$game.$resources.showResource(promptNum);
			}));
			$(".speechBubble .noButton").bind("click", (function () {
				$game.$npc.hideChat();
			}));
		});
	},

	showRandom: function() {
		var ran = Math.floor(Math.random() * _curNpc.dialog.random.length);
		
		_speak = _curNpc.dialog.random[ran];
		

		$('.speechBubble .speakerName').text(_who);
		$('.speechBubble .message').text(_speak);

		$('.speechBubble').slideDown(function() {
			$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,5000);
		});
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

		if($game.$player.game.currentLevel === _curNpc.level) {

			//here we will tell the resoure object to clear old stuff,
			//and tell it what to load (and who it corresponds to)
			$game.$resources.loadResource(_who, _curNpc.id, false);
			_resourceOnDeck = true;
		}
		else {
			_resourceOnDeck = false;
		}
		
	}
	
};
