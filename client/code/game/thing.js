
var _coords = [
		{x: 0, y: 14},
		{x: 113, y: 27},
		{x: 113, y: 79},
		{x: 0, y: 79},
		{x: 0, y: 0},
		{x: 0, y: 0}
		],
	_positions = [
		{x: 6, y: 20, d: -1, target: -3},
		{x: 133, y: 31, d: 1, target: 145},
		{x: 135, y: 124, d: 1, target: 145},
		{x: 8, y: 83, d: -1, target: -3},
		{x: 0, y: 0, d: 0, target: 0},
		{x: 0, y: 0, d: 0, target: 0}
		],
	_info = null,
	_renderInfo = null,
	_onScreen = false,
	_triggered = false;

$game.$thing = {

	ready: false,
	active: false,
	currentStep: 0,
	numSteps: 16,
	counter: Math.floor(Math.random() * 64),
	curFrame: 0,
	numFrames: 4,
	isMoving: false,

	init: function() {
		//create things position and render info based on players state
		_info = {
			x: 0,
			y: 0
		};
		_renderInfo = {
			kind: 'thing',
			prevX: 0,
			prevY: 0,
			curX: 0,
			curY: 0,
			srcX: 16,
			srcY: 18
		};
		if(!$game.$player.game.seenThing) {
			$game.$thing.setPosition();
		}
	},

	setPosition: function() {
		_info = _positions[$game.$player.game.currentLevel];
		_info.offX = 0;
		_info.offY = 0;
		_info.prevOffX = 0;
		_info.prevOffY = 0;
	},

	update: function() {
		if($game.$thing.active) {
			//if it is live, then update movement
			if(_onScreen) {
				if(_triggered) {
					$game.$thing.move();
				}
				else {
					$game.$thing.idleCheckTrigger();
				}
			}
			//if not, check if we need to turn it live
			else {
				var loc = $game.masterToLocal(_info.x, _info.y);
				if(loc) {
					_onScreen = true;
				}
			}
		}
	},

	makeActive: function() {
		$game.$thing.currentStep = 0;
		$game.$thing.active = true;
		_onScreen = false;
		_triggered = false;
	},

	updateRenderInfo: function() {
		//must pass true so we get the coords EVEN tho it doesn't exist for off screen stuff
		var loc = $game.masterToLocal(_info.x, _info.y, true);
		if(loc) {
			var prevX = loc.x * $game.TILE_SIZE + _info.prevOffX * $game.STEP_PIXELS / 2,
				prevY = loc.y * $game.TILE_SIZE + _info.prevOffY * $game.STEP_PIXELS / 2,
				curX = loc.x * $game.TILE_SIZE + _info.offX * $game.STEP_PIXELS / 2,
				curY = loc.y * $game.TILE_SIZE + _info.offY * $game.STEP_PIXELS / 2;

			_renderInfo.prevX = prevX,
			_renderInfo.prevY = prevY;
			_renderInfo.curX = curX,
			_renderInfo.curY = curY;
		}
	},

	idleCheckTrigger: function() {
		$game.$thing.updateRenderInfo();

		//check distance between player and thing
		var playerPos = $game.$player.getPosition(),
			dX = Math.abs(playerPos.x - (_info.x + 1)),
			dY = Math.abs(playerPos.y - _info.y);

		//if close enough, trigger thing to run!
		if(dX + dY < 6) {
			_triggered = true;
			$game.$player.game.seenThing = true;
		}

	},

	move: function() {
		if(_onScreen) {
			//if the steps between the tiles has finished,
			//update the master location, and reset steps to go on to next move
			if($game.$thing.currentStep >= $game.$thing.numSteps) {
				$game.$thing.currentStep = 0;
				//$game.$thing.info.x = $game.$thing.seriesOfMoves[$game.$thing.currentMove].masterX;
				//$game.$thing.info.y = $game.$thing.seriesOfMoves[$game.$thing.currentMove].masterY;
				_info.x += _info.d;
			}
			
			//check to see if done
			if(_info.x === _info.target) {
				_onScreen = false;
				$game.$thing.active = false;
			}

			//if not, step through it
			else {
				//increment the current step
				$game.$thing.currentStep += 1;

				//if it the first one, then figure out the direction to face
				if($game.$thing.currentStep === 1) {
					$game.$thing.currentStepIncX = _info.d;
					$game.$thing.currentStepIncY = 0;
					
					//set the previous offsets to 0 because the last visit
					//was the actual rounded master
					_info.prevOffX = 0;
					_info.prevOffY = 0;

					//set direction for sprite sheets
					if($game.$thing.currentStepIncX === 1) {
						_renderInfo.srcY = $game.TILE_SIZE * 2;
					}
					else {
						_renderInfo.srcY = $game.TILE_SIZE * 2;
					}
				}

				//if it is not the first step:
				else {
					_info.prevOffX = _info.offX;
					_info.prevOffY = _info.offY;
				}
				
				_info.offX = $game.$thing.currentStep * $game.$thing.currentStepIncX;
				_info.offY = $game.$thing.currentStep * $game.$thing.currentStepIncY;

				//try only changing the src (frame) every X frames
				// if(($game.$thing.currentStep - 1) % 8 === 0) {
				// 	$game.$thing.curFrame += 1;
				// 	if($game.$thing.curFrame >= $game.$thing.numFrames) {
				// 		$game.$thing.curFrame = 0;
				// 	}
				// }

			// 	$game.$thing.info.srcX = $game.$thing.curFrame * $game.TILE_SIZE,
				$game.$thing.updateRenderInfo();
			}
		}
		
	},

	clear: function() {
		$game.$renderer.clearThing(_renderInfo);
	},

	getRenderInfo: function() {
		if(_onScreen) {
			return _renderInfo;
		}
		else {
			return false;
		}
	},

	getLoc: function() {
		return _coords[$game.$player.game.currentLevel];
	}

};
