//current values are there for the inbetween squares
//master is the most previously gridded position

var _offX = 0,
	_offY = 0,
	_prevOffX = 0,
	_prevOffY = 0,
	_srcX = 0,
	_srcY = 0,
	_curFrame = 0,
	_numFrames = 4,
	_numSteps = 8,
	_currentStepIncX = 0,
	_currentStepIncY = 0,
	_prevStepX = 0, //deprecated
	_prevStepY = 0, //deprecated
	_direction = 0,
	_willTravel = null,
	_idleCounter = 0,
	playerInfo = null;


$game.$player = {

	_masterX: 19,
	_masterY: 10,
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
	id: null,


	//private methods

	init: function() {
		
		$game.$player.ready = true;
		
		playerInfo = {
			srcX: _srcX,
			srcY: _srcY,
			x: $game.$player._masterX,
			y: $game.$player._masterY,
			offX: _offX,
			offY: _offY,
			prevX: _prevOffX,
			prevY: _prevOffY
		}

	},
	update: function(){

		if($game.$player.isMoving) {
			$game.$player.move();
		}

	},
	move: function () {
		/** IMPORTANT note: x and y are really flipped!!! **/
		//update the step
		$game.$player.isMoving = true;

		//if the steps between the tiles has finished,
		//update the master location, and reset steps to go on to next move 
		if($game.$player.currentStep >= _numSteps) {
			$game.$player.currentStep = 0;
			$game.$player._masterX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX;
			$game.$player._masterY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY;
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
				_currentStepIncX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX - $game.$player._masterX;
				_currentStepIncY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY - $game.$player._masterY;
				// _prevStepX = _currentX * $game.TILE_SIZE;
				// _prevStepY = _currentY * $game.TILE_SIZE;
				
				//set the previous offsets to 0 because the last visit
				//was the actual rounded master 
				_prevOffX = 0;
				_prevOffY = 0;

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
				_prevOffX = _offX;
				_prevOffY = _offY;
			}
			
			_offX = $game.$player.currentStep * _currentStepIncX;
			_offY = $game.$player.currentStep * _currentStepIncY;


			// _prevStepX = _currentX;
			// _prevStepY = _currentY;

			// _currentX = ($game.$player._masterX * $game.TILE_SIZE) + $game.$player.currentStep * (_currentStepIncX * $game.STEP_PIXELS ),
			// _currentY = ($game.$player._masterY * $game.TILE_SIZE) + $game.$player.currentStep * (_currentStepIncY * $game.STEP_PIXELS );

			//try only changing the src (frame) every X frames
			if(($game.$player.currentStep-1)%8 == 0) {
				_curFrame += 1;
				if(_curFrame >= _numFrames) {
					_curFrame = 0;
				}
			}
			_srcX = _curFrame * $game.TILE_SIZE,
			_srcY =  _direction * $game.TILE_SIZE*2;

			playerInfo.srcX = _srcX;
			playerInfo.srcY = _srcY;
			playerInfo.x = $game.$player._masterX;
			playerInfo.y = $game.$player._masterY;
			playerInfo.offX = _offX;
			playerInfo.offY = _offY;
			playerInfo.prevX = _prevOffX;
			playerInfo.prevY = _prevOffY;
		
			//$game.$renderer.renderPlayer(playerInfo);
			//setTimeout($game.$player.move; 17);
			//requestAnimFrame($game.$player;.move);
		}
	},
	endMove: function () {
		_offX = 0,
		_offY = 0;

		//put the character back to normal position
		_srcX = 0,
		_srcY =  0;

		_prevOffX= 0;
		_prevOffY= 0;

		playerInfo.srcX = _srcX;
		playerInfo.srcY = _srcY;
		playerInfo.x = $game.$player._masterX;
		playerInfo.y = $game.$player._masterY;
		playerInfo.offX = _offX;
		playerInfo.offY = _offY;
		playerInfo.prevX = _prevOffX;
		playerInfo.prevY = _prevOffY;

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
				//trigger npc to popup info and stuff
			}
		}
		
	},
	beginMove: function(x, y) {
		_offX = 0,
		_offY = 0;
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
			$game.masterToLocal($game.$player._masterX, $game.$player._masterY, function(loc) {
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
	slide: function(stepX, stepY) {

		_prevOffX = stepX * _numSteps;
		_prevOffY = stepY * _numSteps;

		playerInfo.srcX = _srcX;
		playerInfo.srcY = _srcY;
		playerInfo.x = $game.$player._masterX;
		playerInfo.y = $game.$player._masterY;
		playerInfo.offX = _offX;
		playerInfo.offY = _offY;
		playerInfo.prevX = _prevOffX;
		playerInfo.prevY = _prevOffY;

	},
	render: function() {
		
		$game.$renderer.renderPlayer(playerInfo);
	
	},
	resetRenderValues: function() {
		_prevOffX = 0,
		_prevOffY = 0,
		playerInfo.prevX = _prevOffX,
		playerInfo.prevY = _prevOffY;

	},
	idle: function () {
		_idleCounter += 1;
		if(_idleCounter >= 64) { 
			_idleCounter = 0;
			playerInfo.srcX = 0;
			playerInfo.srcY = 0;
			$game.$player.render();
		}

		if(_idleCounter == 48) {
			playerInfo.srcX = 32;
			playerInfo.srcY = 0;
			$game.$player.render();
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
			$game.masterToLocal($game.$player._masterX, $game.$player._masterY,  function(loc) {
				oX = loc.x;
				oY = loc.y;
			});
			mX = $game.$player._masterX;
			mY = $game.$player._masterY;
		}

		var bombed = [];
		//color algorithms for different levels:
		if($game.$player.currentLevel === 0) {
			var square = {
				x: $game.$player._masterX,
				y: $game.$player._masterY,
				color: 
				{
					h: Math.floor(Math.random()),
					s: $game.$player.saturation,
					l: $game.$player.lightness,
					a: .8,
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
		for(var a = 0; a<3; a++) {
			for(var b = 0; b<3; b++) {
				
				var square = {
					x: origX + a,
					y: origY + b,
					
					color: 
					{
						h: newHue,
						s: $game.$player.saturation,
						l: $game.$player.lightness,
						a: .5,
						owner: false
					}
				};

				//only add it if it is on the map	
				if(origX + a>-1 && origX + a<$game.TOTAL_WIDTH && origY + b>-1 && origY + b < $game.TOTAL_HEIGHT) {
					//assign the middle one the owner
					if( a === 1 && b === 1) {
						//this will be put in the ACTUAL DB,
						//instead of local
						square.color.a = 1;
						square.color.owner = 'Russell'; 			
					}
					bombed.push(square);	
				}

				$game.$renderer.renderMiniTile(square);
			}
		}
		ss.rpc('game.player.dropSeed', bombed);		
	
	}
};

