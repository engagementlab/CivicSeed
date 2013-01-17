//current values are there for the inbetween squares
//master is the most previously gridded position

var _curFrame = 0,
	_numFrames = 4,
	_numSteps = 8,
	_currentStepIncX = 0,
	_currentStepIncY = 0,
	_direction = 0,
	_willTravel = null,
	_idleCounter = 0,
	_getMaster = true;
	_info = {},
	_renderInfo = {},
	_isChatting = false,
	_hideTimer = null,
	_chatId = null,
	_chatIdSelector = null,
	_rgb = null,
	_numRequired = [1,1,1,1],
	_seedHudCount = null,
	_normalHudCount = null,
	_riddleHudCount = null,
	_specialHudCount = null,
	_waitingSel = null,
	_gameboardSel = null,
	_inventoryBtnSel = null,
	_inventorySel = null,
	_playerGameInfo = null,
	_startTime = null,
	_playerColorNum = null;


$game.$player = {

	name: null,
	id: null,
	game: null,
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
	keyWalking: false,
	keyX: 0,
	keyY: 0,
	keyMoving: false,


	//private methods

	init: function() {
		//initialize DB and let all players know there is a new active one
		ss.rpc('game.player.init', function(newInfo) {
			
			//time in seconds since 1970 or whatever
			_startTime = new Date().getTime() / 1000;

			_info = {
				srcX: 0,
				srcY: 0,
				x: newInfo.game.position.x,
				y: newInfo.game.position.y,
				offX: 0,
				offY: 0,
				prevOffX: 0,
				prevOffY: 0
			};
			
			_playerColorNum = newInfo.game.colorInfo.tilesheet;
			
			
			//we have retrieved player info, so it is ready
			$game.$player.ready = true;

			$game.$player.id = newInfo.id,
			$game.$player.name = newInfo.name,
			$game.$player.game = newInfo.game;
			_playerGameInfo = newInfo.game;

			_renderInfo.colorNum = _playerColorNum,
			_renderInfo.srcX = 0,
			_renderInfo.srcY = 0,
			_renderInfo.curX = _info.x * $game.TILE_SIZE,
			_renderInfo.curY = _info.y * $game.TILE_SIZE,
			_renderInfo.prevX = _info.x * $game.TILE_SIZE,
			_renderInfo.prevY = _info.y * $game.TILE_SIZE,
			_renderInfo.kind = 'player',
			_renderInfo.level = $game.$player.game.currentLevel;

			//set variables for dom selectors
			_seedHudCount = $('.seedButton .hudCount');
			_normalHudCount = $('.normalButton .hudCount');
			_riddleHudCount = $('.riddleButton .hudCount');
			_specialHudCount = $('.specialButton .hudCount');
			_waitingSel = $('.waitingForSeed');
			_gameboardSel = $('.gameboard');
			_inventoryBtnSel = $('.inventoryButton > .hudCount');
			_inventorySel = $('.inventory > .pieces');

			$game.changeStatus();
			
			$game.$renderer.changeTilesheet($game.$player.game.currentLevel, false);
			_rgb = 'rgb(' + newInfo.game.colorInfo.rgb.r + ',' + newInfo.game.colorInfo.rgb.g + ',' + newInfo.game.colorInfo.rgb.b + ')';
			var rgba = 'rgba(' + newInfo.game.colorInfo.rgb.r + ',' + newInfo.game.colorInfo.rgb.g + ',' + newInfo.game.colorInfo.rgb.b + ', .6)';
			$('.hudCount').css('background', rgba);
				
			//init everything else that depends on the player info
			$game.$others.init();
			$game.$thing.init();

			//set HUD values
			var numSeeds = $game.$player.game.seeds.normal + $game.$player.game.seeds.riddle + $game.$player.game.seeds.special;

			_seedHudCount.text(numSeeds);
			_normalHudCount.text($game.$player.game.seeds.normal);
			_riddleHudCount.text($game.$player.game.seeds.riddle);
			_specialHudCount.text($game.$player.game.seeds.special);
			
			$game.$player.fillInventory();

			_chatId = 'player'+ newInfo.id,
			_chatIdSelector = '#' + _chatId;

			$game.firstLoad(_info.x, _info.y);
			$game.$player.updateRenderInfo();
			$game.$map.addPlayer(newInfo.id, _info.x, _info.y, _rgb);

			var src = $game.$player.game.colorMap;
			if(src !== undefined) {
				$game.$renderer.imageToCanvas(src);
			}
			$game.$map.createCollectiveImage();
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

	updateGnomeState: function() {
		// //update gnome state when: 
		// 	-resource added to inventory 
		// 	-riddle solved (level change)
		// 	-instructions viewed

		
	},

	updateRenderInfo: function() {
		var loc = $game.masterToLocal(_info.x, _info.y);
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
		$game.$player.hideChat();
	},

	endKeyMove: function() {

		_info.offX = 0,
		_info.offY = 0;
		_info.prevOffX= 0;
		_info.prevOffY= 0;

		//if traveling, falsify everthing, start the travel
		if(_willTravel) {
			_info.srcY = 0,
			_info.srcX = 0;
			$game.$player.keyWalking = false;
			$game.$player.isMoving = false;
			$game.$player.keyMoving = false;
			var beginTravel = function(){
				if($game.dataLoaded){
					$game.dataLoaded = false;
					$game.beginTransition();
				}
				else{
					//keep tryin!
					setTimeout(beginTravel,50);
				}
			};
			beginTravel();
		}
		// no travel,
		else {
			//if still holding, keep movin shorty
			if($game.$player.keyWalking) {
				$game.$player.getKeyMove();
			}
			else {
				_info.srcY = 0,
				_info.srcX = 0;
				$game.$player.keyMoving = false;
				$game.$player.isMoving = false;
			}
		}
	},

	endMove: function () {
		var posInfo = {
			id: $game.$player.id,
			x: _info.x,
			y: _info.y
		};
		ss.rpc('game.player.savePosition', posInfo);

		$game.$map.updatePlayer($game.$player.id, _info.x, _info.y);

		_info.offX = 0,
		_info.offY = 0;

		//put the character back to normal position

		_info.srcX = 0,
		_info.srcY =  0;

		_info.prevOffX= 0;
		_info.prevOffY= 0;

		$game.$player.isMoving = false;
		if(_willTravel) {
			var beginTravel = function(){
				if($game.dataLoaded){
					$game.dataLoaded = false;
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
			if($game.$player.npcOnDeck) {
				$game.$player.npcOnDeck = false;
					$game.$npc.show();

					//trigger npc to popup _info and stuff
			}
		}
		
	},

	beginMove: function(x, y) {
		_info.offX = 0,
		_info.offY = 0;
		//check if it is an edge of the world
		$game.isMapEdge(x, y, function(anEdge) {
			_willTravel = false;
			//if a transition is necessary, load new data
			if(!anEdge) {
				if(x === 0 || x === 29 || y === 0 || y === 14) {
					_willTravel = true;
					$game.calculateNext(x, y, function() {
					// 	//data is loaded!
					// 	// $game.$player.getPath();
					});
				}
			}
			

			//calc local for start point for pathfinding
			var loc = $game.masterToLocal(_info.x, _info.y);
			
			var masterEndX = $game.currentTiles[x][y].x,
				masterEndY = $game.currentTiles[x][y].y;

			var start = $game.graph.nodes[loc.y][loc.x],
				end = $game.graph.nodes[y][x],
				result = $game.$astar.search($game.graph.nodes, start, end);
			if(result.length > 0) {
				$game.$player.sendMoveInfo(result);
				
				ss.rpc('game.player.movePlayer', result, $game.$player.id, function() {
					$game.$audio.update(masterEndX, masterEndY);
				});
			}
		});
			
	},

	beginKeyWalk: function(dirX, dirY) {
		$game.$player.keyWalking = true;
		$game.$player.keyX = dirX;
		$game.$player.keyY = dirY;
		$game.$player.getKeyMove();
		$game.$player.isMoving = true;

	},
	getKeyMove: function() {
		
		var locStart = $game.masterToLocal(_info.x, _info.y),
			newX = $game.$player.keyX + _info.x,
			newY = $game.$player.keyY + _info.y,
			locEnd = $game.masterToLocal(newX, newY),
			start = $game.graph.nodes[locStart.y][locStart.x],
			end = $game.graph.nodes[locEnd.y][locEnd.x],
			result = $game.$astar.search($game.graph.nodes, start, end);

		$game.$player.keyMoving = true;
		
		$game.isMapEdge(locEnd.x, locEnd.y, function(anEdge) {
			_willTravel = false;
			//if a transition is necessary, load new data
			if(!anEdge) {
				if(locEnd.x === 0 || locEnd.x === 29 || locEnd.y === 0 || locEnd.y === 14) {
					_willTravel = true;
					$game.calculateNext(locEnd.x, locEnd.y,function(){});
				}
				$game.$player.sendMoveInfo(result);
			}
			
		});
	},
	slide: function(slideX, slideY) {
		_info.prevOffX = slideX * _numSteps;
		_info.prevOffY = slideY * _numSteps;
	},

	getRenderInfo: function() {
		return _renderInfo;	
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
		//if there are no seeds, send message can't plant
	
		options.mX = $game.currentTiles[options.x][options.y].x,
		options.mY = $game.currentTiles[options.x][options.y].y;

		var mode = options.mode;

		//regular seed mode
		if(mode === 1) {
			if($game.$player.game.seeds.normal < 1) {
				return false;
			}
			else {
				options.sz = 3;
				$game.$player.calculateSeeds(options);
				return true;
			}
		}
		//riddle seed mode
		else if(mode === 2 ){
			if($game.$player.game.seeds.riddle < 1) {
				return false;
			}
			else {
				options.sz = ($game.$player.game.currentLevel * 2) + 5;
				$game.$player.calculateSeeds(options);
				return true;
			}
		}
		else if(mode === 3 ){
			if($game.$player.game.seeds.special < 1) {
				return false;
			}
			else {
				//options.sz = ($game.$player.game.currentLevel * 2) + 5;
				$game.$player.calculateSeeds(options);
				return true;
			}
		}
		
	},

	calculateSeeds: function(options) {
		//start at the top left corner and loop through (vertical first)
		var mid = Math.floor(options.sz / 2),
			origX = options.mX - mid,
			origY = options.mY - mid,
			sX = options.x - mid,
			sY = options.y - mid,
			bombed = [],
			mode = options.mode;
		
		if($game.currentTiles[options.x][options.y].color) {
			if($game.currentTiles[options.x][options.y].color.owner !== 'nobody') {
				console.log('owned');
				return false;
			}
		}


		var b = 0;
		while(b < options.sz) {
			var a = 0;
			while(a < options.sz) {
				//only add if it is in the map!
				if(origX + a > -1 && origX + a < $game.TOTAL_WIDTH && origY + b > -1 && origY + b < $game.TOTAL_HEIGHT) {
					
					//only make circles if not mode 1 (basic)
					
					//this says: if you are part of the circle radius
					//if you are basic, then do it regardless
					if(mode === 1 || Math.abs(a - mid) * Math.abs(b - mid) < (mid * (mid - 1))) {

						var tempA = Math.round((0.7 - ((Math.abs(a - mid) + Math.abs(b - mid)) / options.sz) * 0.5) * 100) / 100;
						
						//set x,y and color info for each square
						var square = {
							x: origX + a,
							y: origY + b,
							color:
							{
								r: $game.$player.game.colorInfo.rgb.r - 20,
								g: $game.$player.game.colorInfo.rgb.g - 20,
								b: $game.$player.game.colorInfo.rgb.b - 20,
								a: tempA,
								owner: 'nobody'
							}
						};

						//assign the middle one the owner
						if( a === mid && b === mid) {
							square.color.a = 0.8;
							square.color.owner = $game.$player.name;
						}
						bombed.push(square);
					}
				}
				a += 1;
			}
			b += 1;
		}

		if(bombed.length > 0) {
			
		
			//set a waiting boolean so we don't plant more until receive data back from rpc
			$game.$player.awaitingBomb = true;

			//send the data to the rpc
			var info = {
				id: $game.$player.id,
				name: $game.$player.name,
				sz: options.sz,
				x: origX,
				y: origY,
				tilesColored: $game.$player.game.tilesColored
			};

			var loc = $game.masterToLocal(options.mX,options.mY);

			_waitingSel
				.css({
					top: loc.y * 32,
					left: loc.x * 32
				})
				.show();

			ss.rpc('game.player.dropSeed', bombed, info, function(result) {
				//increase the drop count for the player
				$game.$player.awaitingBomb = false;
				_waitingSel.fadeOut();
				if(result > 0) {
					//play sound clip
					$game.$audio.playSound(0);
					$game.$player.game.tilesColored += result;
								//update seed count in HUD
					if(mode === 1) {
						$game.$player.game.seeds.normal -= 1;
						//bounce outta seed mode
						if($game.$player.game.seeds.normal === 0) {
							$game.$player.seedMode = 0;
							_renderInfo.colorNum = _playerColorNum;
							$game.$player.seedPlanting = false;
							$game.changeStatus();
							$game.statusUpdate('you are out seeds');
						}
						_normalHudCount.text($game.$player.game.seeds.normal);
					}
					else if(mode === 2) {
						$game.$player.game.seeds.riddle -= 1;
						if($game.$player.game.seeds.riddle === 0) {
							$game.$player.seedMode = 0;
							_renderInfo.colorNum = _playerColorNum;
							$game.$player.seedPlanting = false;
							$game.changeStatus();
							$game.changeStatus('no more seeds for you!');
						}
						_riddleHudCount.text($game.$player.game.seeds.riddle);
					}
					else if(mode === 3) {
						$game.$player.game.seeds.special -= 1;
						if($game.$player.game.seeds.special === 0) {
							$game.$player.seedMode = 0;
							_renderInfo.colorNum = _playerColorNum;
							$game.$player.seedPlanting = false;
							$game.changeStatus();
							$game.changeStatus('no more seeds for you!');
						}
						_specialHudCount.text($game.$player.game.seeds.special);
					}
					var numSeeds = $game.$player.game.seeds.normal + $game.$player.game.seeds.riddle + $game.$player.game.seeds.special;
					_seedHudCount.text(numSeeds);
				}
				else {
					$game.changeStatus('sorry, someone beat you to that tile');
				}
			});
			
		}
		
	},

	message: function(message) {

		var len = message.length + 4,
			fadeTime = len * 150 + 1000,
			sz = Math.floor(len * 8) + 10;
				
		fadeTime = (fadeTime > 11500) ? 11500 : fadeTime;
		
		if(_isChatting) {
			clearTimeout(_hideTimer);
			$(_chatIdSelector).text('me: '+ message);
		}
		else {
			_gameboardSel.append('<p class=\'playerChat\' id=' + _chatId + '>me: ' + message + '</p>');
		}
		
		var half = sz / 2,
			placeX;

		if(_renderInfo.curX > 470 ) {
			var rem = 940 - _renderInfo.curX;
			if(half > rem) {
				placeX = _renderInfo.curX - half - (half - rem);
			}
			else {
				placeX = _renderInfo.curX - half + 16;
			}
		}
		else {

			if(half > _renderInfo.curX) {
				placeX = _renderInfo.curX - half + (half - _renderInfo.curX) + 10;
			}
			else {
				placeX = _renderInfo.curX - half + 16;
			}
		}
	
		$(_chatIdSelector).css({
			'top': _renderInfo.curY - 72,
			'left': placeX,
			'width': sz
		});
		
		_isChatting = true;
		//make it remove after 5 seconds...
		_hideTimer = setTimeout($game.$player.hideChat,fadeTime);
	},

	hideChat: function() {
		//remove chat from screen
		clearTimeout(_hideTimer);
		$(_chatIdSelector).fadeOut('fast',function() {
			$(this).remove();
			_isChatting = false;
		});

	},

	exitAndSave: function() {
		var endTime = new Date().getTime() / 1000,
			totalTime = endTime - _startTime;
		$game.$player.game.playingTime += totalTime;
		$game.$player.game.position.x = _info.x,
		$game.$player.game.position.y = _info.y;
		$game.$player.game.colorMap = $game.$map.saveImage();
		ss.rpc('game.player.exitPlayer', $game.$player.game, $game.$player.id);
		
	},

	getPrompt: function(id) {
		
		var	l = $game.$player.game.resources.length;

		while(--l > -1) {
			if(id === $game.$player.game.resources[l].npc) {
				//if the player already got it right, it should be prompt 2
				if($game.$player.game.resources[l].result) {
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

	answerResource: function(correct, id, answer) {
		
		var r = {
			npc: id,
			answers: [answer],
			attempts: 1,
			result: correct
		};
		
		var rs = null,
			l = $game.$player.game.resources.length;

		//see if the resource is already in the list
		while(--l > -1) {
			if(id === $game.$player.game.resources[l].npc) {
				rs = $game.$player.game.resources[l];
				continue;
			}
		}

		//if not, then add it to the list
		if(!rs) {
			$game.$player.game.resources.push(r);
			rs = $game.$player.game.resources[$game.$player.game.resources.length - 1];
		}
		else {
			rs.answers.push(r.answers[0]);
			rs.attempts += 1;
			rs.result = r.result;
		}

		//the answer was correct, add item to inventory
		if(correct) {
			$game.$player.game.resourcesDiscovered += 1;
			var rawAttempts = 6 - rs.attempts,
				numToAdd = rawAttempts < 0 ? 0 : rawAttempts;
			$game.$player.game.seeds.normal += numToAdd;
			_seedHudCount.text($game.$player.game.seeds.normal);
			$game.$player.game.inventory.push(id);
			$game.$player.addToInventory(id);
			$game.$player.checkGnomeState();
		}
	},

	checkGnomeState: function() {
		//put player to state 3 (solving) if they have enough resources
		//AND they have already seen the first 2 staes
		if($game.$player.game.inventory.length >= _numRequired[$game.$player.game.currentLevel] && $game.$player.game.gnomeState > 1) {
				$game.$player.game.gnomeState = 3;
			}
	},
	getAnswer: function(id) {
		var l = $game.$player.game.resources.length;
		while(--l > -1) {
			if(id === $game.$player.game.resources[l].npc) {
				var rightOne = $game.$player.game.resources[l].answers.length - 1;
				return $game.$player.game.resources[l].answers[rightOne];
			}
		}
	},

	clearInventory: function() {
		$('.inventoryItem').remove();
	},

	fillInventory: function() {
		//on first load, fill inventory from DB
		var l = $game.$player.game.inventory.length;
		_inventoryBtnSel.text(l);
		while(--l > -1) {
			$game.$player.addToInventory($game.$player.game.inventory[l]);
		}

		//if the player has gotten the riddle, put the tangram in the inventory + bind actions
		if($game.$player.game.gnomeState > 1) {
			$game.$player.tangramToInventory();
		}
	},

	addToInventory: function(id) {
		//create the class / ref to the image
		var file = 'r' + id;
		//put image on page in inventory
		_inventorySel.prepend('<img class="inventoryItem '+ file + '"src="img\/game\/resources\/small\/'+file+'.png">');
		
		_inventoryBtnSel.text($game.$player.game.inventory.length);

		//bind click and drag functions, pass npc #
		$('img.inventoryItem.'+ file)
			.bind('click',{npc: id}, $game.$resources.beginResource)
			.bind('dragstart',{npc: id}, $game.$gnome.dragStart);
	},

	tangramToInventory: function() {
		var gFile = 'puzzle' + $game.$player.game.currentLevel;
		_inventorySel.append('<div class="inventoryItem '+gFile+'"><img src="img\/game\/tangram\/'+gFile+'small.png" draggable = "false"></div>');
		$('.'+ gFile).bind('click', $game.$gnome.inventoryShowRiddle);
	},

	emptyInventory: function() {
		$game.$player.game.inventory = [];
		_inventoryBtnSel.text('0');
	},

	createInventoryOutlines: function() {
		var io = $('.inventory > .outlines');
		io.empty();
		for(var i = 0; i < $game.resourceCount[$game.$player.game.currentLevel]; i +=1) {
			io.append('<div class="inventoryOutline"></div>');
		}
	},

	getPosition: function() {
		return _info;
	},

	nextLevel: function() {
		$game.$player.game.currentLevel += 1;
		$game.$player.game.gnomeState = 0;
		$game.$player.game.seenThing = false;
		$game.$renderer.changeTilesheet($game.$player.game.currentLevel, true);

		_renderInfo.level = $game.$player.game.currentLevel;
		$game.$player.createInventoryOutlines();
		//send status to message board
		var newLevelMsg = $game.$player.game.currentLevel + 1;
		var stat = $game.$player.name + 'is on level' + newLevelMsg + '!';
		ss.rpc('game.player.statusUpdate', stat);
		//load in other tree file
	},

	getPlayingTime: function() {
		var currentTime = new Date().getTime() / 1000,
			totalTime = Math.round((currentTime - _startTime) + $game.$player.game.playingTime);
		return totalTime;
	},

	chooseSeed: function() {
		//check if we have multi kinds of seeds, if so, show them
		//else, go into reg seed mode
		if($game.$player.seedventoryShowing) {
			
			$('.seedventory').slideUp(function() {
				$game.$player.seedventoryShowing = false;
				$game.$player.seedMode = 0;
				_renderInfo.colorNum = _playerColorNum;
				$game.changeStatus();
			});
		}
		else {
			if($game.$player.seedPlanting) {
				$game.$player.seedPlanting = false;
				$game.seedMode = 0;
				_renderInfo.colorNum = _playerColorNum;
				$game.statusUpdate('seed mode ended, as you were');
			}
			else {
				var col0 = $game.$player.game.seeds.normal > 0 ? '#eee': '#333',
					col1 = $game.$player.game.seeds.riddle > 0 ? '#eee': '#333',
					col2 = $game.$player.game.seeds.special > 0 ? '#eee': '#333';

					$('.normalButton').css('color',col0);
					$('.riddleButton').css('color',col1);
					$('.specialButton').css('color',col2);
				
				if($game.$player.game.seeds.riddle > 0 || $game.$player.game.seeds.special > 0 && !$game.$resources.isShowing && !$game.$player.inventoryShowing && !$game.$gnome.isShowing) {
					$('.seedventory').slideDown(function() {
						$game.$player.seedventoryShowing = true;
						$game.changeStatus('choose a seed to plant');
					});
				}
				else if($game.$player.game.seeds.normal > 0) {
					$game.$player.seedMode = 1;
					$game.changeStatus();
				}
				else {
					$game.statusUpdate('you need some seeds child');
				}
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
	}
};

