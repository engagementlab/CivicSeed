var _prevX = 0,
	_prevY = 0,
	_curX = 0,
	_curY = 0,
	_changed = false,
	_index = 0;

$game.$mouse = {
	//returns local x,y grid data based on mouse location
	updateMouse: function(mouseInfo, clicked) {

		var x = mouseInfo.x - mouseInfo.offX;
		var y = mouseInfo.y - mouseInfo.offY;

		_prevX = _curX;
		_prevY = _curY;

		var tempX = Math.floor(x/32),
			tempY = Math.floor(y/32);

		//extremes(if at edge it will be just over)
		if(tempX > 29) {
			_curX = 29;
		} else if(tempX < 0) {
			_curX = 0;
		} else {
			_curX = tempX;
		}

		if(tempY > 14) {
			_curY = 14;
		}
		else if(tempY < 0) {
			_curY = 0;
		} else {
			_curY = tempY;
		}

		if(mouseInfo.debug){
			console.log($game.$map.currentTiles[_curX][_curY]);
		}

		//if the grid is different update boolean
		if(_curX !== _prevX || _curY !== _prevY){
			//render new
			var mouseStuff = {
				pX: _prevX,
				pY: _prevY,
				cX: _curX,
				cY: _curY
			};
			$game.$renderer.renderMouse(mouseStuff);
		}

		if(clicked) {
			//check if it is a nogo or npc
			//if the tile BELOW the tile clicked is npc,
			//then user clicked the head, so act like npc
			if($game.$player.seedMode > 0) {
				if(!$game.$player.awaitingBomb) {
					var m = {
							mouse: true,
							x: _curX,
							y: _curY,
							mode: $game.$player.seedMode
						};
					var r = $game.$player.dropSeed(m);
					if(!r) {
						$('.seedButton').removeClass('currentButton');
						$game.temporaryStatus('you have not seeds to drop');
					}
				}
			}
			else {
				//if clicking on a player, show their info
				var mX = $game.$map.currentTiles[_curX][_curY].x,
					mY = $game.$map.currentTiles[_curX][_curY].y;
				var user = $game.$others.playerCard(mX, mY);
				if(!user) {
					var state = $game.$map.getTileState(_curX, _curY);
					//go
					if(state === -1 && !$game.$player.pathfinding) {
						$game.$player.beginMove(_curX,_curY);
						if($game.$npc.isChat) {
							$game.$npc.hideChat();
						}
						else if($game.$botanist.isChat) {
							$game.$botanist.hideChat();
						}
					}
					//npc
					else if(state >= 0 ) {
						//set index val so reousrce can show right one

						//if you click on a different square then the previously
						//selected npc, then hide the npc info if it is showing
						if(state !== $game.$botanist.index && !$game.$player.pathfinding) {
							$game.$npc.selectNpc(state);
							//move them to the spot to the
							//BOTTOM LEFT corner of the npc
							//(consistent so we leave that open in tilemap)
							//also make sure it is not a transition tile
							$game.$player.beginMove(_curX-2,_curY+1);
						}

						else {
							$('.speechBubble button').addClass('hideButton');
							$game.$botanist.show();
						}
					}
				}
			}
		}
	}

};
