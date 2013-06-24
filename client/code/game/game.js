window.requestAnimationFrame = (function() {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback, element) {
			// window.setTimeout(callback, _tickSpeed); // <-- OLD VERSION
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - _lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			_lastTime = currTime + timeToCall;
			return id;
		};
}());

//PRIVATE GAME VARS
var _stepNumber = 0,
	_stats = null,
	_badWords = ['fuck','shit', 'bitch', 'cunt', 'damn', 'penis', 'vagina', 'crap', 'screw', 'suck','piss', 'whore', 'slut'], //should be moved
	_levelNames = ['Level 1: Looking Inward', 'Level 2: Expanding Outward', 'Level 3: Working Together', 'Level 4: Looking Forward', 'Game Over: Profile Unlocked'],
	_displayTimeout = null;

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
	bossModeUnlocked: null,

	startNewAction: true,

	init: function() {
		//all the init calls will trigger others, a waterfall approach to assure
		//the right data is loaded before we start
		_loadPlayer();
	},

	//pause menu on browser tab unfocus (currently disabled)
	pause: function() {
		$('.pauseMenu').fadeIn();
		$game.running = false;
		//TODO: play pause music?
	},

	//resume from the pause menu, start up game loop
	resume: function() {
		$('.pauseMenu').slideUp(function() {
			$game.running = true;
			$game.tick();
		});
	},

	//starts a transition from one viewport to another
	beginTransition: function() {
		$game.inTransit = true;
		_stepNumber = 0;
		$game.$chat.hideChat();
		$game.$others.hideAllChats();
		$('.npcBubble').remove();
		$game.stepTransition();
	},

	//decides if we continue tweening the viewports or to end transition
	stepTransition: function() {
		if(_stepNumber !== $game.$map.numberOfSteps) {
			_stepNumber += 1;
			$game.$map.transitionMap(_stepNumber);
		}
		else {
			$game.endTransition();
		}
	},

	//resumes normal state of being able to walk and enables chat etc.
	endTransition: function() {
		$game.inTransit = false;
		$game.$player.isMoving = false;
		$game.$player.resetRenderValues();
		$game.$others.resetRenderValues();
		//now that the transition has ended, create a new grid
		$game.$map.createPathGrid(function() {
			$game.$map.stepDirection = null;
		});
		$game.$player.displayNpcComments();
		$game.$player.savePositionToDB();
	},

	//the game loop, if it is running, call all the updates and render
	tick: function() {
		if($game.running) {
			$game.$others.update();
			$game.$player.update();
			$game.$npc.update();
			$game.$botanist.update();
			$game.$robot.update();
			$game.$renderer.renderFrame();
			requestAnimationFrame($game.tick);
		}
	},

	//displays the progress area section, pulling the latest pertient data
	showProgress: function() {

		//save and show player's colors
		var myImageSrc = $game.$map.saveImage();
		$game.$map.createCollectiveImage();

		//get stats
		var tilesColored = $game.$player.getTilesColored(),
			resourcesDiscovered = $game.$player.getResourcesDiscovered();

		//show proper level image and color map
		$('.levelImages img').removeClass('currentLevelImage');
		$('.levelImages img:nth-child(' + ($game.$player.currentLevel + 1) + ')').addClass('currentLevelImage');
		$('.personalInfo .currentLevel').text($game.playerRanks[$game.$player.currentLevel]);
		$('.colorMapYou img')
			.attr('src', myImageSrc)
			.attr('width', '426px');

		//calculate the playing time
		var playingTime = $game.$player.getPlayingTime(),
			hours = Math.floor(playingTime / 3600),
			hoursRemainder = playingTime % 3600,
			minutes = Math.floor(hoursRemainder / 60),
			seconds = playingTime % 60,
			displayTime = hours + 'h ' + minutes + 'm ' + seconds + 's';

		//other game stats and leaderboard
		var contribution = Math.floor((tilesColored / $game.tilesColored) * 100) + '%',
			displayLevel = $game.$player.currentLevel + 1,
			topPlayers = '<p>top seeders:</p><ol>';
		for(var i = 0; i < _stats.leaderboard.length; i++) {
			topPlayers += '<li>' + _stats.leaderboard[i].name + ' (' + _stats.leaderboard[i].count + ' tiles)</li>';
		}
		topPlayers += '</ol>';
		topPlayers += '<p class="yourSeeds">You (' + tilesColored + ' tiles)</p>';

		//player's answers for all the open-ended questions, some others stats
		var allAnswers = $game.$player.compileAnswers();
		var percentString = _stats.percent + '%';
		var numItems = $game.$player.getResourcesDiscovered();

		//display everthing
		$('.displayMyAnswers').empty().append(allAnswers);
		$('.displayTime').html('<i class="icon-time icon-large"></i> ' + displayTime);
		$('.displayPercent').text(percentString);
		$('.topSeeders').empty().append(topPlayers);
		$('.numCollected').text(numItems + ' / 42');
		$('.progressArea').fadeIn(function() {
			$game.showingProgress = true;
		});
	},

	//shows message in the display box that only lasts specific time
	statusUpdate: function(data) {
		if(data.screen) {
			$('.statusUpdate').text(data.message).show();
			clearTimeout(_displayTimeout);
			var len = data.message.length,
				fadeTime = len * 100 + 500;
			_displayTimeout = setTimeout(function() {
				$('.statusUpdate').fadeOut();
			}, fadeTime);
		}
		if(data.log) {
			$game.$log.addMessage(data);
		}
	},

	//check for bad language to censor it in chat
	checkPotty: function(msg) {
		var temp = msg.toLowerCase();

		for(var i = 0; i < _badWords.length; i++) {
			if(temp.indexOf(_badWords[i]) > -1) {
				return 'I have a potty mouth and I am sorry for cussing.';
			}
		}
		return msg;
	},

	//triggered by a change server-side in the leaderboard
	updateLeaderboard: function(data) {
		var leaderChange = true;
		if(_stats.leaderboard.length > 0) {
			leaderChange = (_stats.leaderboard[0].name === data.board[0].name) ? false : true;
		}
		if(leaderChange) {
			$game.statusUpdate({message:data.board[0].name + ' is top seeder!',input:'status',screen: true,log:false});
		}
		_stats.leaderboard = data.board;
	},

	//triggered by a change server-side in the color map percent
	updatePercent: function(dropped) {
		_stats.prevPercent = _stats.percent;
		_stats.seedsDropped = dropped;
		_stats.percent = Math.floor(( _stats.seedsDropped / _stats.seedsDroppedGoal) * 100);
		var percentString = _stats.percent + '%';

		//if we have gone up a milestone, feedback it
		if(_stats.percent > 99) {
			//do something for game over?
				$game.statusUpdate({message:'the meter is filled!',input:'status',screen: true,log:false});
		}
		if(_stats.prevPercent != _stats.percent) {
			_stats.prevPercent = _stats.percent;
			if(_stats.percent % 5 === 0) {
				// $game.temporaryStatus('the world is now ' + percentString + ' colored!');
				console.log('TODO');
			}
		}
	}
};

exports.gameModuleReady = function(callback) {

	callback();

};

/********* PRIVATE FUNCTIONS **********/

function _loadPlayer() {
	$game.$player.init(function() {
		_loadGameInfo();
	});
}

function _loadGameInfo() {
	//get the global game information stats
	ss.rpc('game.player.getGameInfo', function(response) {
		//regular game mode
		$game.bossModeUnlocked = response.bossModeUnlocked;
		//for testing
		//$game.bossModeUnlocked = true;
		$game.resourceCount = response.resourceCount;
		_stats = {
			seedsDropped: response.seedsDropped,
			seedsDroppedGoal: response.seedsDroppedGoal,
			tilesColored: response.tilesColored,
			leaderboard: response.leaderboard,
			percent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100),
			prevPercent: Math.floor((response.seedsDropped / response.seedsDroppedGoal) * 100)
		};
		$game.$player.setPositionInfo();
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
		_loadLog();
	});
}

function _loadLog() {
	$game.$log.init(function() {
		_loadExtra();
	});
}

//this is all the other stuff that needs to happen once everything is loaded
function _loadExtra() {
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

	//init chat rpc
	ss.rpc('game.chat.init');
	_startGame();
}

//calculates the bounding box for the current viewport to get the right tiles
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
	if($game.bossModeUnlocked) {
		$game.$boss.init(function() {
			//TODO: something here?
		});
	}
	$game.$map.firstStart(function() {
		$('.loading').fadeOut(function() {
			$(this).remove();
			$game.ready = true;
			$game.running = true;
			$game.$renderer.renderAllTiles();
			$game.tick();
			$game.$player.displayNpcComments();
		});
	});
}
