
var _coords = [
		{x: 0, y: 14},
		{x: 113, y: 27},
		{x: 113, y: 79},
		{x: 0, y: 79},
		{x: 0, y: 0},
		{x: 0, y: 0}
		],
	_positions = [
		{x: 7, y: 20, d: -1, target: -3},
		{x: 137, y: 33, d: 1, target: 145},
		{x: 137, y: 124, d: 1, target: 145},
		{x: 7, y: 84, d: -1, target: -3},
		{x: 0, y: 0, d: 0, target: 0},
		{x: 0, y: 0, d: 0, target: 0}
		],
	_info = null,
	_renderInfo = null,
	_onScreen = false,
	_triggered = false;

$game.$robot = {

	ready: false,
	active: false,
	currentStep: 0,
	numSteps: 16,
	counter: Math.floor(Math.random() * 64),
	curFrame: 0,
	numFrames: 4,
	isMoving: false,

	init: function(callback) {
		if($game.bossModeUnlocked) {
			callback();
		} else {
			//create things position and render info based on players state
			_info = {
				x: 0,
				y: 0
			};
			_renderInfo = {
				kind: 'robot',
				prevX: 0,
				prevY: 0,
				curX: 0,
				curY: 0,
				srcX: 0,
				srcY: 0
			};
			if(!$game.$player.seenRobot) {
				$game.$robot.setPosition();
			}
			callback();
		}
	},

	resetInit: function() {
		_info = null;
		_renderInfo = null;
		_onScreen = false;
		_triggered = false;

		$game.$robot.ready= false;
		$game.$robot.active= false;
		$game.$robot.currentStep= 0;
		$game.$robot.counter= Math.floor(Math.random() * 64);
		$game.$robot.curFrame= 0;
		$game.$robot.isMoving= false;
	},

	setPosition: function() {
		_info = _positions[$game.$player.currentLevel];
		_info.offX = 0;
		_info.offY = 0;
		_info.prevOffX = 0;
		_info.prevOffY = 0;
		_renderInfo.dir = _positions[$game.$player.currentLevel].d;
		$game.$robot.isMoving = false;
		$game.$robot.active = true;
		$game.$robot.counter = Math.floor(Math.random() * 64);
		$game.$robot.curFrame = 0;
		$game.$robot.currentStep = 0;
		if(_renderInfo.dir === -1) {
			_renderInfo.srcY = 0;
		} else {
			_renderInfo.srcY = 64;
		}
	},

	update: function() {
		if($game.$robot.active) {
			//if it is live, then update movement
			if(_onScreen) {
				if(_triggered) {
					$game.$robot.move();
				}
				else {
					$game.$robot.idleCheckTrigger();
				}
			}
			//if not, check if we need to turn it live
			else {
				var loc = $game.$map.masterToLocal(_info.x, _info.y);
				if(loc) {
					_onScreen = true;
				}
			}
		}
	},

	updateRenderInfo: function() {
		//must pass true so we get the coords EVEN tho it doesn't exist for off screen stuff
		var loc = $game.$map.masterToLocal(_info.x, _info.y, true);
		if(loc) {
			var prevX = loc.x * $game.TILE_SIZE + _info.prevOffX * $game.STEP_PIXELS / 2,
				prevY = loc.y * $game.TILE_SIZE + _info.prevOffY * $game.STEP_PIXELS / 2,
				curX = loc.x * $game.TILE_SIZE + _info.offX * $game.STEP_PIXELS / 2,
				curY = loc.y * $game.TILE_SIZE + _info.offY * $game.STEP_PIXELS / 2;

			_renderInfo.prevX = prevX,
			_renderInfo.prevY = prevY;
			_renderInfo.curX = curX,
			_renderInfo.curY = curY;

			if($game.$robot.isMoving) {
				//left
				if(_renderInfo.dir === -1) {
					_renderInfo.srcY = 0;
				} else {
					_renderInfo.srcY = 64;
				}
			} else {
				if(_renderInfo.dir === -1) {
					_renderInfo.srcY = 128;
				} else {
					_renderInfo.srcY = 192;
				}
			}
		}

	},

	idleCheckTrigger: function() {
		$game.$robot.currentStep++;
		if($game.$robot.currentStep % 8 === 0) {
			if($game.$robot.currentStep > $game.$robot.numSteps) {
				$game.$robot.currentStep = 0;
			}
			$game.$robot.curFrame++;
			if($game.$robot.curFrame === $game.$robot.numFrames) {
				$game.$robot.curFrame = 0;
			}
			_renderInfo.srcX = $game.TILE_SIZE * $game.$robot.curFrame * 2;
		}
		$game.$robot.updateRenderInfo();

		//check distance between player and robot
		var playerPos = $game.$player.getPosition(),
			dX = Math.abs(playerPos.x - (_info.x + 1)),
			dY = Math.abs(playerPos.y - _info.y);

		//if close enough, trigger robot to run!
		if(dX + dY < 6) {
			_triggered = true;
			$game.$player.seenRobot = true;
			$game.$robot.isMoving = true;
			$game.$robot.currentStep = 0;
			$game.$robot.counter = 0;
			$game.$robot.curFrame = 0;
			var info = {
				id: $game.$player.id,
				seenRobot: $game.$player.seenRobot
			};
			ss.rpc('game.player.updateGameInfo', info);
		}
	},

	move: function() {
		if(_onScreen) {
			//if the steps between the tiles has finished,
			//update the master location, and reset steps to go on to next move
			if($game.$robot.currentStep >= $game.$robot.numSteps) {
				$game.$robot.currentStep = 0;
				//$game.$robot.info.x = $game.$robot.seriesOfMoves[$game.$robot.currentMove].masterX;
				//$game.$robot.info.y = $game.$robot.seriesOfMoves[$game.$robot.currentMove].masterY;
				_info.x += _info.d;
			}

			//check to see if done
			if(_info.x === _info.target) {
				_onScreen = false;
				$game.$robot.active = false;
			}

			//if not, step through it
			else {
				//increment the current step
				$game.$robot.currentStep += 1;

				//if it the first one, then figure out the direction to face
				if($game.$robot.currentStep === 1) {
					$game.$robot.currentStepIncX = _info.d;
					$game.$robot.currentStepIncY = 0;
					//set the previous offsets to 0 because the last visit
					//was the actual rounded master
					_info.prevOffX = 0;
					_info.prevOffY = 0;

				}

				//if it is not the first step:
				else {
					_info.prevOffX = _info.offX;
					_info.prevOffY = _info.offY;
					//set direction for sprite sheets
					if($game.$robot.currentStep % 4 === 0) {
						// console.log('currentStep', $game.$robot.currentStep);
						_renderInfo.srcX = $game.TILE_SIZE * ($game.$robot.currentStep / 4) * 2 - 64;
					}
				}

				_info.offX = $game.$robot.currentStep * $game.$robot.currentStepIncX;
				_info.offY = $game.$robot.currentStep * $game.$robot.currentStepIncY;

				//try only changing the src (frame) every X frames
				// if(($game.$robot.currentStep - 1) % 8 === 0) {
				// 	$game.$robot.curFrame += 1;
				// 	if($game.$robot.curFrame >= $game.$robot.numFrames) {
				// 		$game.$robot.curFrame = 0;
				// 	}
				// }
			// $game.$robot.info.srcX = $game.$robot.curFrame * $game.TILE_SIZE,
				$game.$robot.updateRenderInfo();
			}
		}
	},

	clear: function() {
		$game.$renderer.clearRobot(_renderInfo);
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
		return _coords[$game.$player.currentLevel];
	},

	disable: function() {
		_onScreen = false;
	}

};
