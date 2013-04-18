
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
			$game.$resources.init();
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
			dependsOn: npc.dependsOn,
			level: npc.level,
			isHolding: npc.isHolding,
			resource: npc.resource,
			onScreen: null,
			numSteps: 64,
			counter: Math.floor(Math.random() * 64),
			curFrame: 0,
			numFrames: 4,


			info: {
				x: npc.id % $game.TOTAL_WIDTH,
				y: Math.floor(npc.id / $game.TOTAL_WIDTH),
				spriteY: npc.sprite * 64
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
		$('.speechBubble').fadeOut(function() {
			$game.$npc.isChat = false;
			$game.$resources.isShowing = false;
			$('.speechBubble button').addClass('hideButton');
			$(".speechBubble .yesButton").unbind("click");
			$(".speechBubble .noButton").unbind("click");
		});
	},

	show: function() {
		//if there is no other stuff on screen, then show dialog
		if($game.$player.game.firstTime) {
			$game.$npc.isChat = true;
			$game.$npc.showSmalltalk(true);
		}
		else if(!$game.$resources.isShowing && !$game.$npc.isChat) {
			$game.$audio.playTriggerFx('npcBubble');
			if(_resourceOnDeck) {
				//check if visiting this npc depends on other
				var locked = $game.$npc.npcLocked();
				if(!locked) {
					$game.$resources.isShowing = true;
					$game.$npc.showPrompt();
				} else {
					_speak = 'Before I help you out, you need to go see ' + locked + '. Come back when you have their resource.';
					$('.speechBubble p').addClass('fitBubble');
					$('.speechBubble .speakerName').text(_who +': ');
					$('.speechBubble .message').text(_speak);
					$('.speechBubble').fadeIn(function() {
						$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,5000);
					});
				}
			}
			else {
				$game.$npc.isChat = true;
				$game.$npc.showSmalltalk();
			}
		}
	},

	npcLocked: function() {
		if(_curNpc.dependsOn.length > 0) {
			for(var d = 0; d < _curNpc.dependsOn.length; d++) {
				var id = _curNpc.dependsOn[d];
				var playerHasIt = $game.$player.checkForResource(id);
				if(!playerHasIt) {
					var name = $game.$npc.getName(id);
					return name;
				}
			}
			return false;
		} else {
			return false;
		}
	},
	//choose prompt based on PLAYERs memory of interaction
	//there are 3 prompts (0: fresh visit, 1: visited, wrong answer, 2: already answered
	showPrompt: function() {
		$('.speechBubble p').removeClass('fitBubble');
		clearTimeout($game.$npc.hideTimer);
		$('.speechBubble button').addClass('hideButton');
		var promptNum = $game.$player.getPrompt(_curNpc.id);
		_speak = _curNpc.dialog.prompts[promptNum];
		if(promptNum === 2) {
			_speak += ' Want to view again?';
		}
		$('.speechBubble .speakerName').text(_who+': ');
		$('.speechBubble .message').text(_speak);
		$('.speechBubble .yesButton, .speechBubble .noButton').removeClass('hideButton');
		$('.speechBubble').fadeIn(function() {
			$(".speechBubble .yesButton").bind("click", (function () {
				var revisit = promptNum < 2 ? false : true;
				$game.$resources.loadResource(_who, _curNpc.id, revisit);
				//$game.$resources.showResource(promptNum);
			}));
			$(".speechBubble .noButton").bind("click", (function () {
				$game.$npc.hideChat();
			}));
		});
	},

	showSmalltalk: function(firstTime) {
		//they have a resource with just one random response
		if(firstTime) {
			_speak = 'You should really see the botanist before exploring the world.';
		} else {
			if(_curNpc.isHolding) {
				var levelPlace = '';
				if($game.$player.game.currentLevel === 0) {
					levelPlace = 'northwest';
				} else if($game.$player.game.currentLevel === 1) {
					levelPlace = 'northeast';
				} else if($game.$player.game.currentLevel === 2) {
					levelPlace = 'southwest';
				} else {
					levelPlace = 'southeast';
				}
				_speak = 'You should go check out the ' + levelPlace;
			}
			//they have a response for past, present, future
			else {
				if($game.$player.game.currentLevel === _curNpc.level) {
					_speak = _curNpc.dialog.smalltalk[1];
				}
				else if($game.$player.game.currentLevel < _curNpc.level) {
					_speak = _curNpc.dialog.smalltalk[2];
				}
				else {
					_speak = _curNpc.dialog.smalltalk[0];
				}
			}
		}
		
		$('.speechBubble p').addClass('fitBubble');
		$('.speechBubble .speakerName').text(_who +': ');
		$('.speechBubble .message').text(_speak);

		$('.speechBubble').fadeIn(function() {
			$game.$npc.hideTimer = setTimeout($game.$npc.hideChat,8000);
		});
	},

	selectNpc: function(i) {
		$game.$npc.hideChat();
		_index = i;
		var stringId = String(_index);
		_curNpc = _allNpcs[stringId];
		if(!_curNpc) {
			_index += $game.TOTAL_WIDTH;
			stringId = String(_index);
			_curNpc = _allNpcs[stringId];
		}

		_who = _allNpcs[stringId].name;

		//check if it is just a random talking npc
		if(!_curNpc.isHolding) {
			_resourceOnDeck = false;
		}
		//if it is in player's level or previous
		else if($game.$player.game.currentLevel >= _curNpc.level) {
			_resourceOnDeck = true;
		}
		else {
			_resourceOnDeck = false;
		}
		$game.$player.npcOnDeck = true;
	},

	getNpcLevel: function(id) {
		if(id) {
			var stringId = String(id),
				level = _allNpcs[stringId].level;
				return level;
		} else {
			return _curNpc.level;
		}
	},

	getNpcData: function () {
		return _allNpcs;
	}
};
