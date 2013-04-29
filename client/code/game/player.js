var _curFrame = 0,
	_numFrames = 4,
	_numSteps = 8,
	_currentStepIncX = 0,
	_currentStepIncY = 0,
	_direction = 0,
	_willTravel = null,
	_idleCounter = 0,
	_getMaster = true,

	_info = null,
	_renderInfo = null,

	_numRequired = [4,5,6,5],

	$seedHudCount = null,
	$normalHudCount = null,
	$riddleHudCount = null,
	$specialHudCount = null,
	_previousSeedsDropped = null,

	$waiting = null,
	$gameboard = null,
	$inventoryBtn = null,
	$inventory = null,
	_startTime = null,

	_seeds = null,
	_totalSeeds = null,
	_resources = null,
	_position = null,
	_rgb = null,
	_rgbString = null,
	_playerColorNum = null,
	_inventory = null,
	_colorMap = null,
	_resume = null,
	_playingTime = null,
	_tilesColored = null,
	_pledges = null,
	_resourcesDiscovered = null,

	_specialSeedData = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],[1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0]];

$game.$player = {

	name: null,
	id: null,
	game: null,
	instanceName: null,
	currentLevel: null,
	botanistState: null,
	firstTime: null,
	seenRobot: null,
	seriesOfMoves: null,
	currentMove: 0,
	currentStep: 0,
	isMoving: false,
	inventoryShowing: false,
	seedventoryShowing: false,
	seedPlanting: false,
	npcOnDeck: false,
	ready: false,
	seedMode: 0,
	awaitingBomb: false,
	pathfinding: false,

	init: function(callback) {
		//get the players info from the db, alerts other users of presence
		ss.rpc('game.player.init', function(playerInfo) {
			//time in seconds since 1970 or whatever
			_startTime = new Date().getTime() / 1000;

			_info = {
				srcX: 0,
				srcY: 0,
				x: playerInfo.game.position.x,
				y: playerInfo.game.position.y,
				offX: 0,
				offY: 0,
				prevOffX: 0,
				prevOffY: 0
			};

			//TODO: REMOVE THIS AND CREATE VARS FOR EACH PROPERTY DIRECTLY UNDER PLAYER
			//so we don't have to do _property everytime
			$game.$player.game = playerInfo.game;
			_setPlayerInformation(playerInfo);

			//set the render info
			_renderInfo = {
				colorNum: _playerColorNum,
				srcX: 0,
				srcY: 0,
				curX: _info.x * $game.TILE_SIZE,
				curY: _info.y * $game.TILE_SIZE,
				prevX: _info.x * $game.TILE_SIZE,
				prevY: _info.y * $game.TILE_SIZE,
				kind: 'player',
				level: $game.$player.currentLevel
			};

			//setup DOM selectors
			_setDomSelectors();

			//set the color of the hud to personalize it
			var rgba = 'rgba(' + playerInfo.game.colorInfo.rgb.r + ',' + playerInfo.game.colorInfo.rgb.g + ',' + playerInfo.game.colorInfo.rgb.b + ', .6)';
			$('.hudCount').css('background', rgba);

			_updateTotalSeeds();
			$game.$player.updateRenderInfo();

			//we are ready, let everyone know dat
			$game.$player.ready = true;
			callback();
		});
	},

	update: function(){
		if($game.$player.isMoving) {
			$game.$player.move();
			_getMaster = true;
		}
		else if(!$game.inTransit) {
			$game.$player.idle();
		}
		else if($game.inTransit) {
			_getMaster = true;
		}
		//this keeps us from doing this query every frame
		if(_getMaster) {
			$game.$player.updateRenderInfo();
		}
	},

	updateRenderInfo: function() {
		//get local render information. update if appropriate.
		var loc = $game.$map.masterToLocal(_info.x, _info.y);
		if(loc) {
			var prevX = loc.x * $game.TILE_SIZE + _info.prevOffX * $game.STEP_PIXELS;
			prevY = loc.y * $game.TILE_SIZE + _info.prevOffY * $game.STEP_PIXELS;
			curX = loc.x * $game.TILE_SIZE + _info.offX * $game.STEP_PIXELS;
			curY = loc.y * $game.TILE_SIZE + _info.offY * $game.STEP_PIXELS;

			_renderInfo.prevX = prevX,
			_renderInfo.prevY = prevY,

			_renderInfo.srcX = _info.srcX,
			_renderInfo.srcY = _info.srcY,
			_renderInfo.curX = curX,
			_renderInfo.curY = curY;
		}
	},

	clear: function() {
		$game.$renderer.clearCharacter(_renderInfo);
	},

	move: function () {
		/** IMPORTANT note: x and y are really flipped!!! **/
		//update the step
		$game.$player.isMoving = true;

		//if the steps between the tiles has finished,
		//update the master location, and reset steps to go on to next move
		if($game.$player.currentStep >= _numSteps) {
			$game.$player.currentStep = 0;
			_info.x = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX;
			_info.y = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY;

			$game.$player.currentMove += 1;
			//render mini map every spot player moves
			$game.$map.updatePlayer($game.$player.id, _info.x, _info.y);
		}

		//if we done, finish
		if($game.$player.currentMove >= $game.$player.seriesOfMoves.length) {
			if($game.$player.keyMoving) {
				$game.$player.endKeyMove();
			}
			else {
				$game.$player.endMove();
			}
		}
		//if we no done, then step through it yo.
		else {

			//increment the current step
			$game.$player.currentStep += 1;

			//if it the first one, then figure out the direction to face
			if($game.$player.currentStep === 1) {
				_currentStepIncX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX - _info.x;
				_currentStepIncY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY - _info.y;
				//set the previous offsets to 0 because the last visit
				//was the actual rounded master
				_info.prevOffX = 0;
				_info.prevOffY = 0;

				//set direction for sprite sheets
				//direction refers to the y location on the sprite sheet
				//since the character will be in different rows
				//will be 0,1,2,3
				if(_currentStepIncX === 1) {
					_direction = 2;
				}
				else if(_currentStepIncX === -1) {
					_direction = 1;
				}
				else if(_currentStepIncY === -1) {
					_direction = 4;
				}
				else {
					_direction = 3;
				}
			}

			else {
				_info.prevOffX = _info.offX;
				_info.prevOffY = _info.offY;
			}

			_info.offX = $game.$player.currentStep * _currentStepIncX;
			_info.offY = $game.$player.currentStep * _currentStepIncY;

			//try only changing the src (frame) every X frames
			if(($game.$player.currentStep-1) % 8 === 0) {
				_curFrame += 1;
				if(_curFrame >= _numFrames) {
					_curFrame = 0;
				}
			}
			_info.srcX = _curFrame * $game.TILE_SIZE,
			_info.srcY = _direction * $game.TILE_SIZE*2;
		}
	},

	sendMoveInfo: function(moves) {
		$game.$player.seriesOfMoves = new Array(moves.length);
		$game.$player.seriesOfMoves = moves;
		$game.$player.currentMove = 1;
		$game.$player.currentStep = 0;
		$game.$player.isMoving = true;
		$game.$chat.hideChat();
	},

	endMove: function () {
		var posInfo = {
			id: $game.$player.id,
			x: _info.x,
			y: _info.y
		};
		ss.rpc('game.player.savePosition', posInfo);

		$game.$map.updatePlayer($game.$player.id, _info.x, _info.y);

		//put the character back to normal position
		_info.offX = 0,
		_info.offY = 0;
		_info.srcX = 0,
		_info.srcY =  0;
		_info.prevOffX= 0;
		_info.prevOffY= 0;

		$game.$player.isMoving = false;
		if(_willTravel) {
			var beginTravel = function(){
				if($game.$map.dataLoaded){
					$game.beginTransition();
				}
				else{
					//keep tryin!
					setTimeout(beginTravel,50);
				}
			};
			beginTravel();
		}
		else {
			//trigger npc to popup _info and stuff
			if($game.$player.npcOnDeck) {
				$game.$player.npcOnDeck = false;
				$game.$npc.show();
			}
		}
	},

	beginMove: function(x, y) {
		$game.$player.pathfinding = true;
		_info.offX = 0,
		_info.offY = 0;
		//check if it is an edge of the world
		$game.$map.isMapEdge(x, y, function(anEdge) {
			_willTravel = false;
			//if a transition is necessary, load new data
			if(!anEdge) {
				if(x === 0 || x === 29 || y === 0 || y === 14) {
					_willTravel = true;
					$game.$map.calculateNext(x, y);
				}
			}
			var loc = $game.$map.masterToLocal(_info.x, _info.y),
				master = {x: x, y: y};
			$game.$map.findPath(loc, master, function(result) {
				$game.$player.pathfinding = false;
				if(result.length > 0) {
					$game.$player.sendMoveInfo(result);
					ss.rpc('game.player.movePlayer', result, $game.$player.id, function() {
						var masterEndX = $game.$map.currentTiles[master.x][master.y].x,
							masterEndY = $game.$map.currentTiles[master.x][master.y].y;
						$game.$audio.update(masterEndX, masterEndY);
					});
				} else {
					$game.$player.npcOnDeck = false;
				}
			});
		});
	},

	slide: function(slideX, slideY) {
		_info.prevOffX = slideX * _numSteps;
		_info.prevOffY = slideY * _numSteps;
	},

	resetRenderValues: function() {
		_info.prevOffX = 0,
		_info.prevOffY = 0;
	},

	idle: function () {
		_idleCounter += 1;
		if($game.$player.seedMode > 0) {
			if(_idleCounter % 32 < 16) {
				_renderInfo.colorNum = 0;
			}
			else {
				_renderInfo.colorNum = _playerColorNum;
			}
		}

		if(_idleCounter >= 64) {
			_idleCounter = 0;
			_info.srcX = 0;
			_info.srcY = 0;
			_getMaster = true;
			_renderInfo.squat = false;
		}

		else if(_idleCounter === 48) {
			_info.srcX = 32;
			_info.srcY = 0;
			_getMaster = true;
			_renderInfo.squat = true;
		}

		else {
			_getMaster = false;
		}
	},

	dropSeed: function(options) {
		options.mX = $game.$map.currentTiles[options.x][options.y].x,
		options.mY = $game.$map.currentTiles[options.x][options.y].y;

		var mode = options.mode;

		//regular seed mode
		if(mode === 1) {
			if(_seeds.normal < 1) {
				return false;
			}
			else {
				options.sz = 3;
				_calculateSeeds(options);
				return true;
			}
		}
		//riddle seed mode
		else if(mode === 2 ){
			if(_seeds.riddle < 1) {
				return false;
			}
			else {
				options.sz = ($game.$player.currentLevel * 2) + 5;
				_calculateSeeds(options);
				return true;
			}
		}
		//special seed mode
		else if(mode === 3 ){
			if(_seeds.special < 1) {
				return false;
			}
			else {
				options.sz = 11;
				options.special = Math.floor(Math.random()*4);
				_calculateSeeds(options);
				return true;
			}
		}
	},

	//TODO: save locals to game object before pushing up
	exitAndSave: function(callback) {
		var endTime = new Date().getTime() / 1000,
			totalTime = endTime - _startTime;
		_playingTime += totalTime;
		_position.x = _info.x,
		_position.y = _info.y;
		_colorMap = $game.$map.saveImage();
		_savePlayerData();
		ss.rpc('game.player.exitPlayer', $game.$player.game, $game.$player.id, function(res) {
			callback();
		});
	},

	getPrompt: function(id) {
		var	l = _resources.length;

		while(--l > -1) {
			if(id === _resources[l].npc) {
				//if the player already got it right, it should be prompt 2
				if(_resources[l].result) {
					return 2;
				}
				else {
					return 1;
				}
				continue;
			}
		}
		return 0;
	},

	answerResource: function(info) {
		var newInfo = {
			npc: info.id,
			answers: [info.answer],
			attempts: 1,
			result: info.correct,
			seeded: 0
		};
		var realResource = null,
			l = _resources.length;

		//see if the resource is already in the list
		while(--l > -1) {
			if(info.id === _resources[l].npc) {
				realResource = _resources[l];
				continue;
			}
		}

		//if not, then add it to the list
		if(!realResource) {
			_resources.push(newInfo);
			realResource = _resources[_resources.length - 1];
		}
		else {
			realResource.answers.push(newInfo.answers[0]);
			realResource.attempts += 1;
			realResource.result = newInfo.result;
		}

		//the answer was correct, add item to inventory
		if(correct) {
			_resourcesDiscovered += 1;
			var rawAttempts = 6 - realResource.attempts,
				numToAdd = rawAttempts < 0 ? 0 : rawAttempts;
			$game.$player.updateSeeds('normal', numToAdd);

			if($game.$player.currentLevel === info.npcLevel) {
				_inventory.push(id);
				$game.$player.addToInventory(id);
				$game.$player.checkBotanistState();
			}
			_saveResourceToDB(realResource);
			return numToAdd;
		} else {
			_saveResourceToDB(realResource);
		}
	},

	saveMapImage: function() {
		//only do this if we have dropped X more seeds?
		//console.log('saving image');
		if(_seeds.dropped - _previousSeedsDropped > 4) {
			_colorMap = $game.$map.saveImage();
			ss.rpc('game.player.saveImage', _colorMap);
			_previousSeedsDropped = _seeds.dropped;
		}
	},

	checkBotanistState: function() {
		//put player to state 3 (solving) if they the RIGHT resources
		//AND they have already seen the first 2 staes
		if($game.$player.botanistState > 1) {
			//compare each player's resource to the correct answer
			var answers = $game.$botanist.tangram[$game.$player.currentLevel].answer,
				a = answers.length;
			//go through the answer sheet to see if the current tangram is there &&
			//in the right place
			//console.log(answers[a], _resources);
			while(--a > -1) {
				var curAnswerId = answers[a].id;
				//look thru player's resources for this answer 
				var p = 0,
					found = false;
				while(p < _resources.length) {
					if(_resources[p].npc === curAnswerId) {
						found = true;
						//console.log('found');
						//get out of the loop
						p = _resources.length;
					}
					p++;
				}
				if(!found) {
					return false;
				}
			}
			//if we made it here, that means you have all pieces
			$game.$player.botanistState = 3;
			$game.$botanist.setBotanistState(3);
		}
	},

	getAnswer: function(id) {
		var l = _resources.length;
		while(--l > -1) {
			if(id === _resources[l].npc) {
				return _resources[l];
			}
		}
	},

	clearInventory: function() {
		$('.inventoryItem').remove();
	},

	fillInventory: function() {
		//on first load, fill inventory from DB
		var l = _inventory.length,
			cur = 0;
		$inventoryBtn.text(l);

		while(cur < l) {
			$game.$player.addToInventory(_inventory[cur]);
			cur++;
		}

		//if the player has gotten the riddle, put the tangram in the inventory + bind actions
		if($game.$player.botanistState > 1) {
			$game.$player.tangramToInventory();
		}
	},

	addToInventory: function(id) {
		//create the class / ref to the image
		var className = 'r' + id,
			levelFolder = 'level' + ($game.$player.currentLevel + 1),
			imgPath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + levelFolder + '/small/' +  id +'.png',
			tagline = $game.$resources.getTagline(id);
		//put image on page in inventory
		$inventory.prepend('<img class="inventoryItem '+ className + '"src="' + imgPath + '" data-placement="top" data-original-title="' + tagline + '">');

		$('.' + className).bind('mouseenter',function() {
			//var info = $(this).attr('title');
			$(this).tooltip('show');
		});
		$inventoryBtn.text(_inventory.length);

		//bind click and drag functions, pass npc #
		$('img.inventoryItem.'+ className)
			.bind('click',{npc: id}, $game.$resources.beginResource)
			.bind('dragstart',{npc: id}, $game.$botanist.dragStart);
	},

	tangramToInventory: function() {
		var gFile = 'puzzle' + $game.$player.currentLevel,
			imgPath2 = CivicSeed.CLOUD_PATH + '/img/game/tangram/'+gFile+'small.png';

		$inventory.append('<div class="inventoryItem inventoryPuzzle '+gFile+'"><img src="' + imgPath2 + '" draggable = "false"></div>');
		$('.'+ gFile).bind('click', $game.$botanist.inventoryShowRiddle);
	},

	emptyInventory: function() {
		_inventory = [];
		$inventoryBtn.text('0');
	},

	createInventoryOutlines: function() {
		var io = $('.inventory > .outlines');
		io.empty();
		for(var i = 0; i < $game.resourceCount[$game.$player.currentLevel]; i +=1) {
			io.append('<div class="inventoryOutline"></div>');
		}
	},

	getPosition: function() {
		return _info;
	},

	nextLevel: function() {
		$game.$player.currentLevel += 1;

		//hack for demo user to never pass level 1
		if($game.$player.name === 'Demo') {
			$game.$player.currentLevel = 0;
			_resources = [],
			_inventory = [],
			_colorMap = '',
			_tilesColored = 0,
			_resume = [];
		}
		$game.$player.botanistState = 0;
		$game.$player.seenRobot = false;
		_pledges = 5;
		$game.$renderer.loadTilesheet($game.$player.currentLevel, true);
		$game.$robot.setPosition();

		if($game.$player.currentLevel === 4) {
			//they have beat the game!
			//say there profile is available and send em there.
			$game.$player.gameOver();
		}
		else {
			_renderInfo.level = $game.$player.currentLevel;
			$game.$player.createInventoryOutlines();
			//send status to message board
			var newLevelMsg = $game.$player.currentLevel + 1;
			// var stat = $game.$player.name + 'is on level' + newLevelMsg + '!';
			ss.rpc('game.player.levelChange', $game.$player.id, $game.$player.currentLevel);
			console.log('no way boss');
			$game.$renderer.playerToCanvas($game.$player.currentLevel, _renderInfo.colorNum, true);
			//load in other tree file
		}
	},

	getPlayingTime: function() {
		var currentTime = new Date().getTime() / 1000,
			totalTime = Math.round((currentTime - _startTime) + _playingTime);
		return totalTime;
	},

	openSeedventory: function() {
		//open up the inventory
		if(_seeds.riddle > 0 || _seeds.special > 0) {
			$('.seedventory').slideDown(function() {
				var col0 = _seeds.normal > 0 ? '#eee': '#333',
				col1 = _seeds.riddle > 0 ? '#eee': '#333',
				col2 = _seeds.special > 0 ? '#eee': '#333';

				$('.normalButton').css('color',col0);
				$('.riddleButton').css('color',col1);
				$('.specialButton').css('color',col2);

				$game.$player.seedventoryShowing = true;
				$game.changeStatus('choose a seed to plant');
				$('.seedButton').addClass('currentButton');
			});
		}
		//start seed mode on 0
		else {
			$('.seedButton').addClass('currentButton');
			if(_seeds.normal > 0) {
				$game.$player.seedPlanting = true;
				$game.$player.seedMode = 1;
				$game.changeStatus();
			}
			else {
				$('.seedButton').removeClass('currentButton');
				$game.temporaryStatus('you have no seeds');
			}
		}
	},

	startSeeding: function(choice) {
		$game.$player.seedMode = choice;
		$('.seedventory').slideUp(function() {
			$game.$player.seedventoryShowing = false;
			$game.$player.seedPlanting = true;
		});
		$game.changeStatus();
	},

	gameOver: function() {
		var endTime = new Date().getTime() / 1000,
			totalTime = endTime - _startTime;
		_playingTime += totalTime;
		_position.x = _info.x,
		_position.y = _info.y;
		_colorMap = $game.$map.saveImage();
		sessionStorage.setItem('isPlaying', false);
		ss.rpc('game.player.gameOver', $game.$player.game, $game.$player.id, function(res){
			if(res) {
				var hooray = '<div class="hooray"><p>You beat the game, hooray! <a href="' + res + '">CLICK HERE</a> to see your profile</p></div>';
				$('.gameboard').append(hooray);
			}
		});
	},

	makePublic: function(npcId) {
		var l = _resources.length;
		while(--l > -1) {
			if(npcId == _resources[l].npc) {
				//update this resource
				_resources[l].madePublic = true;
				//update resource db
				var info = {
					playerId: $game.$player.id,
					npcId: npcId,
					instanceName: $game.$player.instanceName
				};
				ss.rpc('game.npc.makeResponsePublic', info, function(res) {
					//take away the make public and replcae with eye?
					$('.publicButton').remove();
					$('.yourAnswer').append('<i class="icon-unlock privateButton icon-large" data-npc="'+ npcId +'"></i>');
				});
			}
		}
	},

	makePrivate: function(npcId) {
		var l = _resources.length;
		while(--l > -1) {
			if(npcId == _resources[l].npc) {
				//update this resource
				_resources[l].madePublic = false;
				//update resource db
				var info = {
					playerId: $game.$player.id,
					npcId: npcId,
					instanceName: $game.$player.instanceName
				};
				ss.rpc('game.npc.makeResponsePrivate', info, function(res) {
					//take away the make public and replcae with eye?
					$('.yourAnswer').append('<button class="btn btn-info publicButton" data-npc="'+ npcId +'">Make Public</button>');
					$('.privateButton').remove();
				});
			}
		}
	},

	compileAnswers: function() {
		var html = '';
		for (var a = 0; a < _resources.length; a++) {
			var item = _resources[a],
				npc = item.npc,
				answer = item.answers[item.answers.length - 1],
				question = $game.$resources.getQuestion(npc);
				html += '<p class="theQuestion">Q: ' + question + '</p><p class="theAnswer"><span>' + answer + '</span></p>';
		}
		return html;
	},

	checkForResource: function(id) {
		for(var r = 0; r < _resources.length; r++) {
			if(_resources[r].npc === id) {
				return true;
			}
		}
		return false;
	},

	updateSeeds: function(kind, quantity) {
		_seeds[kind] += quantity;
		//update hud
		_updateTotalSeeds();
	},

	resumeAnswer: function(answer) {
		_resume.push(answer);
	},

	updatePledges: function(quantity) {
		_pledges += quantity;
	},

	resetRenderColor: function() {
		_renderInfo.colorNum = _playerColorNum;
	},

	//get functions for other files to access player info
	getColor: function() {
		return _rgb;
	},

	getColorNum: function() {
		return _renderInfo.colorNum;
	},

	getRenderInfo: function() {
		return _renderInfo;
	},

	getColorMap: function() {
		return _colorMap;
	},

	getTilesColored: function() {
		return _tilesColored;
	},

	getResourcesDiscovered: function() {
		return _resourcesDiscovered;
	},

	getSeedsDropped: function() {
		return _seeds.dropped;
	},

	getInventoryLength: function() {
		return _inventory.length;
	},

	getPledges: function() {
		return _pledges;
	},

	getRGBA: function() {
		return 'rgba('+_colorInfo.r+','+_colorInfo.g+','+_colorInfo.b+','+ 0.5 + ')';
	},

	getRenderPosition: function () {
		return {x: _renderInfo.curX, y: _renderInfo.curY};
	}


};

//private functions
function privateFunction() {
	console.log('I am private');
}

function _saveResourceToDB(resource) {
	var info = {
		id: $game.$player.id,
		resource: resource
	};
	ss.rpc('game.player.saveResource', info, function() {
		console.log('resource saved');
	});
}

function _setDomSelectors() {
	//set variables for dom selectors
	$seedHudCount = $('.seedButton .hudCount');
	$normalHudCount = $('.normalButton .hudCount');
	$riddleHudCount = $('.riddleButton .hudCount');
	$specialHudCount = $('.specialButton .hudCount');
	$waiting = $('.waitingForSeed');
	$gameboard = $('.gameboard');
	$inventoryBtn = $('.inventoryButton > .hudCount');
	$inventory = $('.inventory > .pieces');
	//selectors for chat stuff
}

function _setPlayerInformation(info) {
	//private
	_seeds = info.game.seeds;
	_previousSeedsDropped = _seeds.dropped;
	_resources = info.game.resources;
	_position = info.game.position;
	_colorInfo = info.game.colorInfo.rgb;
	_rgb = 'rgb(' + info.game.colorInfo.rgb.r + ',' + info.game.colorInfo.rgb.g + ',' + info.game.colorInfo.rgb.b + ')';
	_rgbString = 'rgba(' + (info.game.colorInfo.rgb.r + 10) + ',' + (info.game.colorInfo.rgb.g + 10) + ',' + (info.game.colorInfo.rgb.b + 10) + ',';
	_playerColorNum = info.game.colorInfo.tilesheet;
	_inventory = info.game.inventory;
	_colorMap = info.game.colorMap;
	_resume = info.game.resume;
	_playingTime = info.game.playingTime;
	_tilesColored = info.game.tilesColored;
	_pledges = info.game.pledges;
	_resourcesDiscovered = info.game.resourcesDiscovered;

	//public
	$game.$player.id = info.id;
	$game.$player.name = info.name;
	$game.$player.currentLevel = info.game.currentLevel;
	$game.$player.botanistState = info.game.botanistState;
	$game.$player.firstTime = info.game.firstTime;
	$game.$player.instanceName = info.game.instanceName;
	$game.$player.seenRobot = info.game.seenRobot;
}

function _calculateSeeds(options) {
	//start at the top left corner and loop through (vertical first)
	var mid = Math.floor(options.sz / 2),
		origX = options.mX - mid,
		origY = options.mY - mid,
		sX = options.x - mid,
		sY = options.y - mid,
		bombed = [],
		mode = options.mode,
		square = null;
	if($game.$map.currentTiles[options.x][options.y].color) {
		if($game.$map.currentTiles[options.x][options.y].color.owner !== 'nobody') {
			$game.temporaryStatus('that tile has been planted on');
			return false;
		}
	}
	var tempRGB = null,
		tempIndex = null,
		b = 0;
	while(b < options.sz) {
		var a = 0;
		while(a < options.sz) {
			//only add if it is in the map!
			if(origX + a > -1 && origX + a < $game.TOTAL_WIDTH && origY + b > -1 && origY + b < $game.TOTAL_HEIGHT) {
				//only dynamically calculate seeds if riddle or normal mode
				if(mode < 3) {
					//this says: if you are part of the circle radius
					//if you are basic, then do it regardless
					if(mode === 1 || Math.abs(a - mid) * Math.abs(b - mid) < (mid * (mid - 1))) {
						var tempA = Math.round((0.5 - ((Math.abs(a - mid) + Math.abs(b - mid)) / options.sz) * 0.3) * 100) / 100;
						//set x,y and color info for each square
						tempRGB = _rgbString + tempA + ')';
						tempIndex = (origY+b) * $game.TOTAL_WIDTH + (origX + a);
						square = {
							x: origX + a,
							y: origY + b,
							mapIndex: tempIndex,
							color:
							{
								r: _colorInfo.r + 10,
								g: _colorInfo.g + 10,
								b: _colorInfo.b + 10,
								a: tempA,
								owner: 'nobody'
							},
							curColor: tempRGB,
							instanceName: $game.$player.instanceName
						};

						//assign the middle one the owner
						if( a === mid && b === mid) {
							square.color.a = 0.6;
							square.color.owner = $game.$player.name;
						}
						bombed.push(square);
					}
				}
				//special seed, pull from data of
				else {
					//find the index based on the a,b values
					var specialIndex = (b * options.sz) + a;

					//only add a square if it exists in our special array
					if(_specialSeedData[options.special][specialIndex] === 1) {
						//set x,y and color info for each square
						tempRGB = _rgbString + '0.3)';
						tempIndex = (origY+b) * $game.TOTAL_WIDTH + (origX + a);
						square = {
							x: origX + a,
							y: origY + b,
							mapIndex: tempIndex,
							color:
							{
								r: _colorInfo.r + 10,
								g: _colorInfo.g + 10,
								b: _colorInfo.b + 10,
								a: 0.3,
								owner: 'nobody'
							},
							curColor: tempRGB,
							instanceName: $game.$player.instanceName
						};
						bombed.push(square);
					}
				}
			}
			a += 1;
		}
		b += 1;
	}

	if(bombed.length > 0) {
		_sendSeedBomb(bombed, options, origX, origY);
	}
}

function _sendSeedBomb(bombed, options, origX, origY) {
	//set a waiting boolean so we don't plant more until receive data back from rpc
	$game.$player.awaitingBomb = true;

	//send the data to the rpc
	var info = {
		id: $game.$player.id,
		name: $game.$player.name,
		sz: options.sz,
		x: origX,
		y: origY,
		tilesColored: _tilesColored
	};

	var loc = $game.$map.masterToLocal(options.mX,options.mY);

	$waiting
		.css({
			top: loc.y * 32,
			left: loc.x * 32
		})
		.show();

	ss.rpc('game.player.dropSeed', bombed, info, function(result) {
		_seeds.dropped += 1;
		//increase the drop count for the player
		$game.$player.awaitingBomb = false;
		$waiting.fadeOut();
		if(result > 0) {
			//play sound clip
			$game.$audio.playTriggerFx('seedDrop');
			_tilesColored += result;
						//update seed count in HUD
			if(options.mode === 1) {
				$game.$player.updateSeeds('normal', -1);
				//bounce outta seed options.mode
				if(_seeds.normal === 0) {
					$game.$player.seedMode = 0;
					_renderInfo.colorNum = _playerColorNum;
					$game.$player.seedPlanting = false;
					$game.changeStatus();
					$game.temporaryStatus('you are out seeds');
					$('.seedButton').removeClass('currentButton');
					$game.$player.saveMapImage();
				}
			}
			else if(options.mode === 2) {
				$game.$player.updateSeeds('riddle', -1);
				if(_seeds.riddle === 0) {
					$game.$player.seedMode = 0;
					_renderInfo.colorNum = _playerColorNum;
					$game.$player.seedPlanting = false;
					$game.changeStatus();
					$game.changeStatus('no more seeds for you!');
					$('.seedButton').removeClass('currentButton');
					$game.$player.saveMapImage();
				}
			}
			else if(options.mode === 3) {
				$game.$player.updateSeeds('special', -1);
				if(_seeds.special === 0) {
					$game.$player.seedMode = 0;
					_renderInfo.colorNum = _playerColorNum;
					$game.$player.seedPlanting = false;
					$game.changeStatus();
					$game.changeStatus('no more seeds for you!');
					$('.seedButton').removeClass('currentButton');
					$game.$player.saveMapImage();
				}
			}
		}
		else {
			$game.changeStatus('sorry, someone beat you to that tile');
		}
	});
}

function _updateTotalSeeds() {
	_totalSeeds = _seeds.normal + _seeds.riddle + _seeds.special;
	$seedHudCount.text(_totalSeeds);
	$riddleHudCount.text(_seeds.riddle);
	$normalHudCount.text(_seeds.normal);
	$specialHudCount.text(_seeds.special);
}

function _savePlayerData() {
	$game.$player.game.seeds = _seeds;
	$game.$player.game.resources = _resources;
	$game.$player.game.position = _position;
	$game.$player.game.inventory = _inventory;
	$game.$player.game.colorMap = _colorMap;
	$game.$player.game.resume = _resume;
	$game.$player.game.playingTime = _playingTime;
	$game.$player.game.tilesColored = _tilesColored;
	$game.$player.game.pledges = _pledges;
	$game.$player.game.resourcesDiscovered = _resourcesDiscovered;
	$game.$player.game.currentLevel = $game.$player.currentLevel;
	$game.$player.game.botanistState = $game.$player.botanistState;
	$game.$player.game.firstTime = $game.$player.firstTime;
	$game.$player.game.seenRobot = $game.$player.seenRobot;
}