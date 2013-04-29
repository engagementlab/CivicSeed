// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame   ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||

		function( callback ){
			window.setTimeout(callback, 1000 / 60);
		};
})();

//PRIVATE GAME VARS
var _stepNumber = 0,
	_stats = null,
	_badWords = ['fuck','shit', 'bitch', 'cunt', 'damn', 'penis', 'vagina', 'crap', 'screw', 'suck','piss', 'whore', 'slut'], //should be moved
	_levelNames = ['Level 1: Looking Inward', 'Level 2: Expanding Outward', 'Level 3: Working Together', 'Level 4: Looking Forward', 'Game Over: Profile Unlocked'],
	_displayTimeout = null,
	_prevMessage = 'Civic Seed';

//public functions
exports.$game = {

	//GLOBAL GAME CONSTANTS
	VIEWPORT_WIDTH: 30,
	VIEWPORT_HEIGHT: 15,
	TOTAL_WIDTH: 142,
	TOTAL_HEIGHT: 132,
	TILE_SIZE: 32,
	STEP_PIXELS: 4,

	//GLOBAL GAME VARS
	currentTiles: [],
	inTransit: false,
	running: false,
	ready: false,
	showingProgress : false,
	resourceCount: [],
	graph: null,
	masterX: null,
	masterY: null,
	playerRanks: ['novice gardener', 'apprentice gardener', 'expert gardener', 'master gardener','super master gardener'],

	init: function() {
		//all the init calls will trigger others, a waterfall approach to assure
		//the right data is loaded before we start
		//private so not client accesible...
		_loadPlayer();
	},

	pause: function() {
		$('.pauseMenu').slideDown();
		$game.running = false;
		// $game.$audio.pauseTheme();
	},

	resume: function() {
		$('.pauseMenu').slideUp(function() {
			$game.running = true;
			// $game.$audio.playTheme();
			$game.tick();
		});
	},

	beginTransition: function() {
		$game.inTransit = true;
		_stepNumber = 0;
		$game.$chat.hideChat();
		$game.$others.hideAllChats();
		$game.stepTransition();
	},

	stepTransition: function() {
		if(_stepNumber !== $game.$map.numberOfSteps) {
			_stepNumber += 1;
			$game.$map.transitionMap(_stepNumber);
		}
		else {
			$game.endTransition();
		}
	},

	endTransition: function() {
		$game.inTransit = false;
		$game.$player.isMoving = false;
		$game.$player.resetRenderValues();
		$game.$others.resetRenderValues();
		//now that the transition has ended, create a new grid
		$game.$map.createPathGrid(function() {
			$game.$map.stepDirection = null;
		});
	},

	tick: function() {
		if($game.running) {
			$game.$others.update();
			$game.$player.update();
			$game.$npc.update();
			$game.$botanist.update();
			$game.$robot.update();
			$game.$renderer.renderFrame();
			requestAnimFrame($game.tick);
		}
	},

	showProgress: function() {

		//save and show player's colors
		var myImageSrc = $game.$map.saveImage();
		$game.$map.createCollectiveImage();

		var tilesColored = $game.$player.getTilesColored(),
			resourcesDiscovered = $game.$player.getResourcesDiscovered();

		$('.levelImages img').removeClass('currentLevelImage');
		$('.levelImages img:nth-child(' + ($game.$player.currentLevel + 1) + ')').addClass('currentLevelImage');
		$('.personalInfo .currentLevel').text($game.playerRanks[$game.$player.currentLevel]);
		$('.colorMapYou img')
			.attr('src', myImageSrc)
			.attr('width', '426px');
		var playingTime = $game.$player.getPlayingTime(),
			hours = Math.floor(playingTime / 3600),
			hoursRemainder = playingTime % 3600,
			minutes = Math.floor(hoursRemainder / 60),
			seconds = playingTime % 60,
			displayTime = hours + 'h ' + minutes + 'm ' + seconds + 's';


		var contribution = Math.floor((tilesColored / $game.tilesColored) * 100) + '%',
			displayLevel = $game.$player.currentLevel + 1,
			topPlayers = '<p>top seeders:</p><ol>';

		for(var i = 0; i < _stats.leaderboard.length; i++) {
			topPlayers += '<li>' + _stats.leaderboard[i].name + ' (' + _stats.leaderboard[i].count + ' tiles)</li>';
		}
		topPlayers += '</ol>';
		topPlayers += '<p class="yourSeeds">You (' + tilesColored + ' tiles)</p>';
		//show player's seed droppings
		var allAnswers = $game.$player.compileAnswers();
		$('.displayMyAnswers').empty().append(allAnswers);
		$('.displayTime').html('<i class="icon-time icon-large"></i> ' + displayTime);
		var percentString = _stats.percent + '%';
		var numItems = $game.$player.getResourcesDiscovered();
		$('.displayPercent').text(percentString);
		$('.topSeeders').empty().append(topPlayers);
		$('.numCollected').text(numItems + ' / 42');
		$('.progressArea').fadeIn(function() {
			$game.showingProgress = true;
		});
	},

	temporaryStatus: function(msg) {
		$('.displayBoxText').text(msg);
		$('.displayBox').css('background','#a2f0e9');
		clearTimeout(_displayTimeout);
		_displayTimeout = setTimeout(function() {
			$('.displayBoxText').text(_prevMessage);
			$('.displayBox').css('background','white');
		}, 3000);
	},

	changeStatus: function(custom) {
		clearTimeout(_displayTimeout);
		$('.displayBox').css('background','white');
		if(custom) {
			$('.displayBoxText').text(custom);
		}
		else {
			if($game.$player.seedMode > 0) {
				$('.displayBoxText').text('click a tile to drop a seed');
			}
			else {
				$('.displayBoxText').text(_levelNames[$game.$player.currentLevel]);
			}
		}
		_prevMessage = $('.displayBoxText').text();
	},

	checkPotty: function(msg) {
		var temp = msg.toLowerCase();

		for(var i = 0; i < _badWords.length; i++) {
			if(temp.indexOf(_badWords[i]) > -1) {
				return 'I have a potty mouth and I am sorry for cussing.';
			}
		}
		return msg;
	},

	updateLeaderboard: function(data) {
		var leaderChange = true;
		if(_stats.leaderboard.length > 0) {
			leaderChange = (_stats.leaderboard[0].name === data.board[0].name) ? false : true;
		}
		if(leaderChange) {
			$game.temporaryStatus(data.board[0].name + ' is top seeder!');
		}
		_stats.leaderboard = data.board;
	}
};

exports.gameModuleReady = function(callback) {

	callback();

};

//private functions
function _loadPlayer() {
	$game.$player.init(function() {
		_loadRenderer();
	});
}

function _loadRenderer() {
	$game.$renderer.init(function() {
		_loadMap();
	});
}

function _loadMap() {
	$game.$map.init(function() {
		_setBoundaries(); //required for npcs to be placed
		_loadOthers();
	});
}

function _loadOthers() {
	//depends on map
	$game.$others.init(function() {
		_loadNpc();
	});
}

function _loadNpc() {
	$game.$npc.init(function() {
		_loadResources();
	});
}

function _loadResources() {
	//depends on npc
	$game.$resources.init(function() {
		_loadBotanist();
	});
}

function _loadBotanist() {
	//depends on player/game
	$game.$botanist.init(function() {
		_loadRobot();
	});
}

function _loadRobot() {
	$game.$robot.init(function() {
		_loadAudio();
	});
}

function _loadAudio() {
	//depends on player position
	$game.$audio.init(function() {
		_loadChat();
	});
}

function _loadChat() {
	$game.$chat.init(function() {
		_loadGameInfo();
	});
}

function _loadGameInfo() {
	//get the global game information stats
	ss.rpc('game.player.getGameInfo', function(response) {
		//regular game mode
		$game.resourceCount = response.resourceCount;
		_stats = {
			seedsDropped: response.seedsDropped,
			seedsDroppedGoal: response.seedsDroppedGoal,
			tilesColored: response.tilesColored,
			leaderboard: response.leaderboard,
			percent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100),
			prevPercent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100)
		};
		_loadExtra();
	});
}

function _loadExtra() {
	//this is all the other stuff that needs to happen once everything is loaded

	//fill player inventory and creat outlines
	$game.$player.fillInventory();
	$game.$player.createInventoryOutlines();

	//make players color map
	var src = $game.$player.getColorMap();
	if(src !== undefined) {
		$game.$renderer.imageToCanvas(src);
	}
	//create collective image
	$game.$map.createCollectiveImage();

	//update text in HUD
	var percentString = _stats.percent + '%';
	$('.progressButton .hudCount').text(percentString);
	_prevMessage = _levelNames[$game.$player.currentLevel];

	//update status
	$game.changeStatus();
	//init chat rpc
	ss.rpc('game.chat.init');
	_startGame();
}

function _setBoundaries() {
	//calculate the top left corner of the viewport based on where the player is
	var position = $game.$player.getPosition(),
		tx = (position.x === 0) ? 0 : position.x - 1,
		ty = (position.y === 0) ? 0 : position.y - 1,
		divX = Math.floor(tx / ($game.VIEWPORT_WIDTH - 2 )),
		divY = Math.floor(ty / ($game.VIEWPORT_HEIGHT - 2 )),
		startX  = divX * ($game.VIEWPORT_WIDTH - 2),
		startY = divY * ($game.VIEWPORT_HEIGHT - 2);

	$game.masterX = startX;
	$game.masterY = startY;

	$game.$map.setBoundaries();
}

function _startGame() {
	$game.$map.firstStart(function() {
		$game.ready = true;
		$game.running = true;
		$game.$renderer.renderAllTiles();
		$game.tick();
		$('.loading').fadeOut(function() {
			$(this).remove();
		});
	});
}
