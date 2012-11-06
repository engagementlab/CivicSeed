
	_onScreenPlayers = {};

$game.$others = {

	init: function() {
		ss.rpc('game.player.getOthers', function(response) {
			_onScreenPlayers = {};
			$.each(response, function(key, player) { 
  				$game.$others.add(player);
			});
		});
	},

	add: function(player) {
		//check if player is on our screen (or near it....)
		//don't add it if its yourself
		console.log(player.id);
		if(player.id != $game.$player.id) {
			//set inview if nearby
			var newbie = $game.$others.createOther(player);
			_onScreenPlayers[player.id] = newbie;
			console.log("added: " + player.id);
		}
	},

	update: function() {

	},

	remove: function(id) {
		//clear from screen...

		delete _onScreenPlayers[id];
		console.log(_onScreenPlayers);
	},

	createOther: function(player) {
		var newPlayer = {

			name: player.name,
			id: player.id,
			x: player.x,
			y: player.y,
			
			renderInfo: {
				x: player.x,
				y: player.y,
				srcX: 0,
				srcY: 0,
				offX: 0,
				offY: 0,
				prevX: 0,
				prevY: 0
			},

			render: function() {
				$game.$renderer.renderOther(newPlayer.renderInfo);
			},

			beginMove: function(moves) {

			}
		};

		return newPlayer;
	},



	render: function() {
		$.each(_onScreenPlayers, function(key, player) { 
  			player.render(); 
		});

	},
	
	sendMoveInfo: function(moves, id) {
		if(_onScreenPlayers[id]) {
			_onScreenPlayers[id].beginMove(moves);
		}
	}
	
};

	// resetRenderValues: function() {
	// 	_prevOffX = 0,
	// 	_prevOffY = 0,
	// 	playerInfo.prevX = _prevOffX,
	// 	playerInfo.prevY = _prevOffY;

	// },
	
	
			// move: function () {
	// 	/** IMPORTANT note: x and y are really flipped!!! **/
	// 	//update the step
	// 	$game.$others.isMoving = true;

	// 	//if the steps between the tiles has finished,
	// 	//update the master location, and reset steps to go on to next move 
	// 	if($game.$others.currentStep >= _numSteps) {
	// 		$game.$others.currentStep = 0;
	// 		$game.$others._masterX = $game.$others.seriesOfMoves[$game.$others.currentMove].masterX;
	// 		$game.$others._masterY = $game.$others.seriesOfMoves[$game.$others.currentMove].masterY;
	// 		$game.$others.currentMove += 1;
	// 		//render mini map every spot player moves
	// 		$game.$renderer.renderMiniMap();

	// 	}

	// 	//if we done, finish
	// 	if($game.$others.currentMove >= $game.$others.seriesOfMoves.length) {
	// 		$game.$others.endMove();
	// 	}

	// 	//if we no done, then step through it yo.
	// 	else {
			
	// 		//increment the current step 
	// 		$game.$others.currentStep += 1;

	// 		//if it the first one, then figure out the direction to face
	// 		if($game.$others.currentStep === 1) {
	// 			_currentStepIncX = $game.$others.seriesOfMoves[$game.$others.currentMove].masterX - $game.$others._masterX;
	// 			_currentStepIncY = $game.$others.seriesOfMoves[$game.$others.currentMove].masterY - $game.$others._masterY;
	// 			// _prevStepX = _currentX * $game.TILE_SIZE;
	// 			// _prevStepY = _currentY * $game.TILE_SIZE;
				
	// 			//set the previous offsets to 0 because the last visit
	// 			//was the actual rounded master 
	// 			_prevOffX = 0;
	// 			_prevOffY = 0;

	// 			//set direction for sprite sheets
	// 			//direction refers to the y location on the sprite sheet
	// 			//since the character will be in different rows
	// 			//will be 0,1,2,3
	// 			if(_currentStepIncX === 1) {
	// 				_direction = 2;
	// 			}
	// 			else if(_currentStepIncX === -1) {
	// 				_direction = 1;
	// 			}
	// 			else if(_currentStepIncY === -1) {
	// 				_direction = 4;
	// 			}
	// 			else {
	// 				_direction = 3;
	// 			}
	// 		}

	// 		else {
	// 			_prevOffX = _offX;
	// 			_prevOffY = _offY;
	// 		}
			
	// 		_offX = $game.$others.currentStep * _currentStepIncX;
	// 		_offY = $game.$others.currentStep * _currentStepIncY;


	// 		// _prevStepX = _currentX;
	// 		// _prevStepY = _currentY;

	// 		// _currentX = ($game.$others._masterX * $game.TILE_SIZE) + $game.$others.currentStep * (_currentStepIncX * $game.STEP_PIXELS ),
	// 		// _currentY = ($game.$others._masterY * $game.TILE_SIZE) + $game.$others.currentStep * (_currentStepIncY * $game.STEP_PIXELS );

	// 		//try only changing the src (frame) every X frames
	// 		if(($game.$others.currentStep-1)%8 == 0) {
	// 			_curFrame += 1;
	// 			if(_curFrame >= _numFrames) {
	// 				_curFrame = 0;
	// 			}
	// 		}
	// 		_srcX = _curFrame * $game.TILE_SIZE,
	// 		_srcY =  _direction * $game.TILE_SIZE*2;

	// 		playerInfo.srcX = _srcX;
	// 		playerInfo.srcY = _srcY;
	// 		playerInfo.x = $game.$others._masterX;
	// 		playerInfo.y = $game.$others._masterY;
	// 		playerInfo.offX = _offX;
	// 		playerInfo.offY = _offY;
	// 		playerInfo.prevX = _prevOffX;
	// 		playerInfo.prevY = _prevOffY;
		
	// 		//$game.$renderer.renderPlayer(playerInfo);
	// 		//setTimeout($game.$others.move; 17);
	// 		//requestAnimFrame($game.$others;.move);
	// 	}
	// },
	// endMove: function () {
	// 	_offX = 0,
	// 	_offY = 0;

	// 	//put the character back to normal position
	// 	_srcX = 0,
	// 	_srcY =  0;

	// 	_prevOffX= 0;
	// 	_prevOffY= 0;

	// 	playerInfo.srcX = _srcX;
	// 	playerInfo.srcY = _srcY;
	// 	playerInfo.x = $game.$others._masterX;
	// 	playerInfo.y = $game.$others._masterY;
	// 	playerInfo.offX = _offX;
	// 	playerInfo.offY = _offY;
	// 	playerInfo.prevX = _prevOffX;
	// 	playerInfo.prevY = _prevOffY;

	// 	$game.$others.isMoving = false;
	// 	$game.$others.render();
	// 	if(_willTravel) {
	// 		var beginTravel = function(){
	// 			if($game.dataLoaded){
	// 				$game.dataLoaded = false;
	// 				$game.beginTransition();
	// 			}	
	// 			else{
	// 				//keep tryin!
	// 				setTimeout(beginTravel,50);
	// 			}
	// 		};
	// 		beginTravel();
	// 	}
	// 	else {
	// 		if($game.$others.npcOnDeck) {
	// 			$game.$others.npcOnDeck = false;
	// 				$game.$npc.show();					
	// 			//trigger npc to popup info and stuff
	// 		}
	// 	}
		
	// };