var _prevX = 0,
	_prevY = 0,
	_curX = 0,
	_curY = 0,
	_changed = false,
	_index = 0;

$game.$mouse = {
	drawMode: false,

	resetInit: function() {
		_prevX = 0;
		_prevY = 0;
		_curX = 0;
		_curY = 0;
		_changed = false;
		_index = 0;

		$game.$mouse.drawMode = false;
	},
	//returns local x,y grid data based on mouse location
	updateMouse: function(mouseInfo, clicked) {

		var x = mouseInfo.x - mouseInfo.offX;
		var y = mouseInfo.y - mouseInfo.offY;

		_prevX = _curX;
		_prevY = _curY;

		var tempX = Math.floor(x/32),
			tempY = Math.floor(y/32);

		//extremes(if at edge it will be just over)
		if(tempX > $game.VIEWPORT_WIDTH-1) {
			_curX = $game.VIEWPORT_WIDTH-1;
		} else if(tempX < 0) {
			_curX = 0;
		} else {
			_curX = tempX;
		}

		if(tempY > $game.VIEWPORT_HEIGHT - 1) {
			_curY = $game.VIEWPORT_HEIGHT - 1;
		}
		else if(tempY < 0) {
			_curY = 0;
		} else {
			_curY = tempY;
		}

		if(mouseInfo.debug){
			console.log($game.$map.currentTiles[_curX][_curY]);
		}

		//if the grid is different update render
		if(_curX !== _prevX || _curY !== _prevY){
			//render new
			var mouseStuff = {
				pX: _prevX,
				pY: _prevY,
				cX: _curX,
				cY: _curY
			};
			$game.$renderer.renderMouse(mouseStuff);
			if($game.$mouse.drawMode) {
				$game.$player.drawSeed({x:_curX, y:_curY});
			}
		}

		if(clicked) {
			if($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
				if($game.$player.seedMode) {
					$game.$boss.dropSeed({x:_curX, y:_curY});
				} else {
					$game.$player.beginMove(_curX, _curY);
				}
			} else {
				//if the player is in seed mode, determine if drop seed or exit mode
				if($game.$player.seedMode) {
					if(!$game.$player.awaitingBomb) {
						var m = {
								mouse: true,
								x: _curX,
								y: _curY,
								mode: $game.$player.seedMode
							};
						var r = $game.$player.dropSeed(m);
						if(!r) {
							$('.seedButton').removeClass('hud-button-active');
						}
					}
				}
				else {
					//if clicking on other player, show their info
					var mX = $game.$map.currentTiles[_curX][_curY].x,
						mY = $game.$map.currentTiles[_curX][_curY].y;
					var user = $game.$others.playerCard(mX, mY, true);

					if(!user) {
						//determine if the player can go to new tile
						var state = $game.$map.getTileState(_curX, _curY);
						//if the player isn't "searching" for a path it is a green tile, move
						if(state === -1 && !$game.$player.pathfinding) {
							$game.$player.beginMove(_curX,_curY);
							if($game.$npc.isChat) {
								$game.$npc.hideSpeechBubble();
							}
							if($game.$botanist.isChat) {
								$game.$botanist.hideChat();
							}
						}
						//they clicked on an NPC
						else if(state >= 0 ) {
							if(state !== $game.$botanist.index && !$game.$player.pathfinding) {
								if($game.$npc.isChat) {
									$game.$npc.hideSpeechBubble();
								}
								$game.$npc.selectNpc(state);
								//move top bottom left of NPC
								$game.$player.beginMove(_curX-2,_curY+1);
							}
							else {
								//show botanist stuff cuz you clicked him!
								$('.speechBubble button').hide();
								$game.$botanist.show();
							}
						}
					}
				}
			}
		}
	},

	getCurrentPosition: function() {
		return {x: _curX, y: _curY};
	}

};
