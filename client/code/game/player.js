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
	_getMaster = false;
	_info = {},
	_renderInfo = {},
	_isChatting = false,
	_hideTimer = null,
	_chatId = null,
	_chatIdSelector = null;


$game.$player = {

	name: null,
	id: null,
	seriesOfMoves: null,
	currentMove: 0,
	currentStep: 0,
	isMoving: false,
	npcOnDeck: false,
	ready: false,
	currentLevel: 1,
	seedMode: false,
	hue: 0,
	saturation: '90%',
	lightness: '80%',



	//private methods

	init: function() {
		//initialize DB and let all players know there is a new active one
		ss.rpc('game.player.init', function(newInfo) {
			
			console.log(newInfo);
			$game.$others.init();
			ss.rpc('game.player.addPlayer',newInfo);
			$game.$player.ready = true;
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

			_renderInfo.colorNum = newInfo.game.colorInfo.tilesheet;
			
			$game.$player.id = newInfo.id,
			$game.$player.name = newInfo.name,
			_chatId = 'player'+ newInfo.id,
			_chatIdSelector = '#' + _chatId;

			$game.firstLoad(_info.x, _info.y);
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
			$game.masterToLocal(_info.x, _info.y, function(loc) {
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
			});
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
			$game.$renderer.renderMiniMap();

		}

		//if we done, finish
		if($game.$player.currentMove >= $game.$player.seriesOfMoves.length) {
			$game.$player.endMove();
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

	endMove: function () {
		var posInfo = {
			id: $game.$player.id,
			x: _info.x,
			y: _info.y
		};
		ss.rpc('game.player.sendPosition', posInfo);
		_info.offX = 0,
		_info.offY = 0;

		//put the character back to normal position
		_info.srcX = 0,
		_info.srcY =  0;

		_info.prevOffX= 0;
		_info.prevOffY= 0;

		$game.$player.isMoving = false;
		$game.$player.render();
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
						//data is loaded!
						// $game.$player.getPath();
					});
				}
			}
			

			//calc local for start point for pathfinding
			$game.masterToLocal(_info.x, _info.y, function(loc) {
				var start = $game.graph.nodes[loc.y][loc.x],
					end = $game.graph.nodes[y][x],
					result = $game.$astar.search($game.graph.nodes, start, end);
					if(result.length > 0) {
						ss.rpc('game.player.movePlayer', result, $game.$player.id);
					}
					else {

					}
				
			});
		

			
		});
			
	},

	slide: function(slideX, slideY) {
		_info.prevOffX = slideX * _numSteps;
		_info.prevOffY = slideY * _numSteps;
	},

	render: function() {
		
		$game.$renderer.renderPlayer(_renderInfo, true);
	},

	resetRenderValues: function() {
		_info.prevOffX = 0,
		_info.prevOffY = 0;
	},

	idle: function () {
		_idleCounter += 1;
		if(_idleCounter >= 64) {
			_idleCounter = 0;
			_info.srcX = 0;
			_info.srcY = 0;
			_getMaster = true;
		}

		else if(_idleCounter == 48) {
			_info.srcX = 32;
			_info.srcY = 0;
			_getMaster = true;
		}

		else {
			_getMaster = false;
		}
	},

	dropSeed: function(options) {
		//add color the surrounding tiles
		var oX, oY, mX, mY;


		if(options.mouse) {
			oX = options.x,
			oY = options.y;
			mX = $game.currentTiles[oX][oY].x;
			mY = $game.currentTiles[oX][oY].y;
		}
		else {
			$game.masterToLocal(_info.x, _info.y,  function(loc) {
				oX = loc.x;
				oY = loc.y;
			});
			mX = _info.x;
			mY = _info.y;
		}

		var bombed = [];
		//color algorithms for different levels:
		if($game.$player.currentLevel === 0) {
			var square = {
				x: _info.x,
				y: _info.y,
				color:
				{
					h: Math.floor(Math.random()),
					s: $game.$player.saturation,
					l: $game.$player.lightness,
					a: 0.8,
					owner: 'Russell'
				}
			};

			bombed.push(square);
			ss.rpc('game.player.dropSeed', bombed);
		}

		//not the "intro level"
		else {
			//do a check to see if the tile is owned
			
			if($game.currentTiles[oX][oY].color) {
				if($game.currentTiles[oX][oY].color.owner) {
					console.log('can\'t plant here.');
				}
			//if it's colored and NOT owned
				else {
					$game.$player.addColor(true, mX,mY);
				}
			}
			//if it is not colored at all
			else{
				$game.$player.addColor(false, mX, mY);
			}
			
		}
	},

	addColor: function(isColored, x, y) {
		var bombed = [];
		//square
		//start at top left corner
		var origX = x - 1;
		var origY = y - 1;
		var newHue = Math.floor(Math.random()*255);

		var a = 3;
		while(--a >= 0) {
			var b = 3;
			while(--b >= 0) {

				var square = {
					x: origX + a,
					y: origY + b,
					
					color:
					{
						h: newHue,
						s: $game.$player.saturation,
						l: $game.$player.lightness,
						a: 0.5,
						owner: false
					}
				};

				//only add it if it is on the map
				if(origX + a>-1 && origX + a<$game.TOTAL_WIDTH && origY + b>-1 && origY + b < $game.TOTAL_HEIGHT) {
					//assign the middle one the owner
					if( a === 1 && b === 1) {
						//this will be put in the ACTUAL DB,
						//instead of local
						square.color.a = 1,
						square.color.owner = 'Russell';
					}
					bombed.push(square);
				}

				$game.$renderer.renderMiniTile(square);
			}
		}
		ss.rpc('game.player.dropSeed', bombed);
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
			$('.gameboard').append('<p class=\'playerChat\' id=' + _chatId + '>me: ' + message + '</p>');
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

	remove: function() {
		ss.rpc('game.player.removePlayer', $game.$player.id);
	},
};

